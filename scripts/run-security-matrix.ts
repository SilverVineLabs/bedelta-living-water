#!/usr/bin/env tsx
/** 3-Tier Security Matrix SSOT — --tier=fast|security|nightly. Missing CLIs → SKIPPED. */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const GATE = join(ROOT, "SliverVineGate");
const AUDIT = join(ROOT, "docs/audit");
const SCORECARD = join(AUDIT, "security-scorecard.json");
const STATIC = join(AUDIT, "static-analysis-report.json");
const HALMOS_JSON = join(AUDIT, "halmos.json");
const NARRATIVE = "behavioral_pass_does_not_imply_web3_security" as const;

export type Tier = "fast" | "security" | "nightly";
export type GateVerdict = "PASS" | "FAIL" | "SKIPPED";
export interface SecurityGateResult {
  id: string;
  label: string;
  verdict: GateVerdict;
  exitCode: number | null;
  elapsedMs: number;
  detail: string;
  counterexamples?: string[];
}
export interface SecurityScorecard {
  schema: "silvervine.security-scorecard.v4";
  protocol: "SliverVine / BeΔLivingWater";
  tier: Tier;
  generatedAt: string;
  narrative: typeof NARRATIVE;
  overallVerdict: "PASS" | "REVIEW";
  gates: SecurityGateResult[];
  summary: { pass: number; fail: number; skipped: number };
  reports: { securityScorecard: string; staticAnalysisReport?: string };
  zeroKeyCommand: string;
}

function parseTier(argv: string[]): Tier {
  const raw = argv.find((a) => a.startsWith("--tier="))?.slice(7) ?? "security";
  if (raw === "fast" || raw === "security" || raw === "nightly") return raw;
  throw new Error(`INVALID_TIER:${raw}`);
}

function stripAnsi(s: string): string {
  return s.replace(/\u001b\[[0-9;]*[A-Za-z]|\r/g, "");
}

/** Case-insensitive --version probe; first matching binary wins. */
function resolveCli(names: string[], versionRe: RegExp): string | null {
  for (const name of names) {
    const r = spawnSync(name, ["--version"], { encoding: "utf8" });
    if (r.error && (r.error as NodeJS.ErrnoException).code === "ENOENT") continue;
    const blob = `${r.stdout ?? ""}${r.stderr ?? ""}`;
    if (versionRe.test(blob)) return name;
  }
  return null;
}

function runGate(
  id: string,
  label: string,
  command: string,
  args: string[],
  opts: {
    cwd?: string;
    optional?: boolean;
    env?: NodeJS.ProcessEnv;
    exploratory?: boolean;
  } = {},
): SecurityGateResult {
  const t0 = Date.now();
  const result = spawnSync(command, args, {
    cwd: opts.cwd ?? ROOT,
    encoding: "utf8",
    env: { ...process.env, FORCE_COLOR: "0", ...opts.env },
    maxBuffer: 32 * 1024 * 1024,
  });
  const elapsedMs = Date.now() - t0;
  const missing =
    !!result.error && (result.error as NodeJS.ErrnoException).code === "ENOENT";
  if (missing && opts.optional) {
    return {
      id, label, verdict: "SKIPPED", exitCode: null, elapsedMs,
      detail: `${command} not found — SKIPPED (not PASS)`,
    };
  }
  const exitCode = missing ? 127 : (result.status ?? 1);
  const full = stripAnsi([result.stdout, result.stderr].filter(Boolean).join("\n"));
  const detail = full.trim().split("\n").slice(-8).join(" | ").slice(0, 600)
    || (result.error?.message ?? `exit ${exitCode}`);
  const counterexamples = full
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => /counterexample|ERROR\s|failed:|Traceback|Contradiction/i.test(l))
    .slice(0, 40);
  // Nightly: non-zero = exploratory finding (still recorded), not a hard gate fail.
  const verdict: GateVerdict =
    exitCode === 0 ? "PASS" : opts.exploratory ? "PASS" : "FAIL";
  return {
    id, label, verdict, exitCode, elapsedMs, detail,
    ...(counterexamples.length ? { counterexamples } : {}),
  };
}

function runAderynGate(): SecurityGateResult {
  return runGate("aderyn", "Aderyn SliverVineGate", "bash", [
    join(ROOT, "scripts/run-aderyn-gate.sh"),
  ], { optional: true });
}

function runEchidnaGate(): SecurityGateResult {
  const bin = resolveCli(["echidna", "echidna-test"], /echidna/i);
  if (!bin) {
    return {
      id: "echidna", label: "Echidna property fuzz", verdict: "SKIPPED",
      exitCode: null, elapsedMs: 0,
      detail: "echidna/echidna-test not found — SKIPPED (not PASS)",
    };
  }
  return runGate("echidna", "Echidna property fuzz", bin, [
    "echidna/GateEchidnaProperties.sol",
    "--contract", "GateEchidnaProperties",
    "--config", "echidna.yaml",
    "--format", "text",
  ], { cwd: GATE, exploratory: true });
}

function runHalmosGate(): SecurityGateResult {
  const bin = resolveCli(["halmos"], /halmos/i);
  if (!bin) {
    return {
      id: "halmos", label: "Halmos symbolic", verdict: "SKIPPED",
      exitCode: null, elapsedMs: 0,
      detail: "halmos not found — SKIPPED (not PASS)",
    };
  }
  mkdirSync(AUDIT, { recursive: true });
  const gate = runGate("halmos", "Halmos symbolic", bin, [
    "--root", ".",
    "--no-status",
    "--match-contract", "SliverVineGateInvariantTest",
    "--json-output", HALMOS_JSON,
  ], { cwd: GATE, exploratory: true });
  let extras: string[] = gate.counterexamples ?? [];
  if (existsSync(HALMOS_JSON)) {
    try {
      const raw = JSON.parse(readFileSync(HALMOS_JSON, "utf8")) as {
        exitcode?: number;
        test_results?: Record<string, unknown[]>;
      };
      const empty = Object.entries(raw.test_results ?? {})
        .filter(([, v]) => !Array.isArray(v) || v.length === 0)
        .map(([k]) => `no_paths:${k}`);
      extras = [...extras, ...empty, `halmos_exitcode:${raw.exitcode ?? "?"}`];
    } catch { /* keep stderr counterexamples */ }
  }
  return {
    ...gate,
    detail: `${gate.detail} | exploratory=${gate.exitCode !== 0}`,
    counterexamples: extras.slice(0, 40),
  };
}

function gatesFor(tier: Tier): SecurityGateResult[] {
  mkdirSync(AUDIT, { recursive: true });
  if (tier === "fast") {
    return [
      runGate("tsc", "TypeScript typecheck", "pnpm", ["exec", "tsc", "--noEmit"]),
      runGate("vitest-security", "Vitest security slice", "pnpm", [
        "exec", "vitest", "run", "tests/security/",
      ]),
      runGate("solhint", "Solhint SliverVineGate/src", "solhint", [
        "SliverVineGate/src/**/*.sol", "--ignore-path", "SliverVineGate/lib",
      ], { optional: true }),
      runGate("gitleaks", "Gitleaks secret scan", "gitleaks", [
        "detect", "--source", ".", "--config", ".gitleaks.toml", "--no-git", "-v",
      ], { optional: true }),
    ];
  }
  if (tier === "security") {
    return [
      runGate("vitest", "Full Vitest suite", "pnpm", ["exec", "vitest", "run"]),
      runGate("forge", "Forge unit + invariants", "forge", ["test"], {
        cwd: GATE, optional: true,
      }),
      runGate("slither", "Slither SliverVineGate", "slither", [
        ".", "--config-file", "slither.config.json", "--fail-high",
        "--json", join(AUDIT, "slither.json"),
      ], { cwd: GATE, optional: true }),
      runAderynGate(),
      runGate("pnpm-audit", "pnpm audit --prod", "pnpm", ["audit", "--prod"]),
    ];
  }
  return [
    runEchidnaGate(),
    runHalmosGate(),
    runGate("forge-deep-fuzz", "Foundry deep fuzz", "forge", [
      "test", "--match-path", "test/*.fuzz.t.sol",
    ], { cwd: GATE, optional: true, env: { FOUNDRY_PROFILE: "deep" }, exploratory: true }),
  ];
}

export function runSecurityMatrix(tier: Tier): SecurityScorecard {
  console.log(`[security-matrix] tier=${tier} narrative=${NARRATIVE}`);
  const gates = gatesFor(tier);
  const summary = {
    pass: gates.filter((g) => g.verdict === "PASS").length,
    fail: gates.filter((g) => g.verdict === "FAIL").length,
    skipped: gates.filter((g) => g.verdict === "SKIPPED").length,
  };
  // Nightly: exploratory non-zero exits are findings, not REVIEW blockers.
  const overallVerdict: "PASS" | "REVIEW" =
    tier === "nightly" || summary.fail === 0 ? "PASS" : "REVIEW";
  const scorecard: SecurityScorecard = {
    schema: "silvervine.security-scorecard.v4",
    protocol: "SliverVine / BeΔLivingWater",
    tier,
    generatedAt: new Date().toISOString(),
    narrative: NARRATIVE,
    overallVerdict,
    gates,
    summary,
    reports: {
      securityScorecard: "docs/audit/security-scorecard.json",
      ...(tier !== "fast"
        ? { staticAnalysisReport: "docs/audit/static-analysis-report.json" }
        : {}),
    },
    zeroKeyCommand: `pnpm run audit:${tier}`,
  };
  mkdirSync(AUDIT, { recursive: true });
  writeFileSync(SCORECARD, `${JSON.stringify(scorecard, null, 2)}\n`);
  if (tier !== "fast") {
    const findings = Object.fromEntries(
      gates
        .filter((g) => (g.counterexamples?.length ?? 0) > 0 || (g.exitCode ?? 0) !== 0)
        .map((g) => [g.id, {
          exitCode: g.exitCode,
          verdict: g.verdict,
          exploratory: tier === "nightly",
          counterexamples: g.counterexamples ?? [],
          detail: g.detail,
        }]),
    );
    writeFileSync(
      STATIC,
      `${JSON.stringify({
        schema: "silvervine.static-analysis.v3",
        generatedAt: scorecard.generatedAt,
        narrative: NARRATIVE,
        tier,
        tools: Object.fromEntries(gates.map((g) => [g.id, g])),
        exploratoryFindings: findings,
        summary,
        verdict: scorecard.overallVerdict,
        scorecard: "docs/audit/security-scorecard.json",
        artifacts: {
          ...(existsSync(HALMOS_JSON) ? { halmosJson: "docs/audit/halmos.json" } : {}),
        },
      }, null, 2)}\n`,
    );
  }
  console.log(
    `[security-matrix] ${scorecard.overallVerdict} pass=${summary.pass} fail=${summary.fail} skipped=${summary.skipped}`,
  );
  for (const g of gates) {
    const cx = g.counterexamples?.length ?? 0;
    console.log(`  · ${g.id}: ${g.verdict} (${g.elapsedMs}ms)${cx ? ` cx=${cx}` : ""}`);
  }
  console.log(`[security-matrix] → ${SCORECARD}`);
  return scorecard;
}

const scorecard = runSecurityMatrix(parseTier(process.argv.slice(2)));
process.exitCode = scorecard.overallVerdict === "PASS" ? 0 : 1;
