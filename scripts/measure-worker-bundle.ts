#!/usr/bin/env tsx
/**
 * Measure Worker bundle size via `wrangler deploy --dry-run`.
 * Entry SSOT: wrangler.toml `main` (src/worker-entry.ts).
 */
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, statSync } from "node:fs";
import { gzipSync } from "node:zlib";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUTDIR = "dist-worker";
const ENTRY_BASENAME = "worker-entry.js";
const TOTAL_UPLOAD_RE = /Total Upload:\s+([\d.]+)\s+KiB\s+\/\s+gzip:\s+([\d.]+)\s+KiB/;

function run(cmd: string, args: string[]): {
  ok: boolean;
  status: number | null;
  stdout: string;
  stderr: string;
} {
  const result = spawnSync(cmd, args, {
    cwd: ROOT,
    encoding: "utf8",
    env: { ...process.env, WRANGLER_WRITE_LOGS: "false" },
  });
  return {
    ok: result.status === 0,
    status: result.status,
    stdout: result.stdout ?? "",
    stderr: result.stderr ?? "",
  };
}

function kiB(bytes: number): number {
  return Math.round((bytes / 1024) * 100) / 100;
}

const BUNDLE_GZIP_LIMIT_KIB = 158.99 as const;

function main(): void {
  const full = process.argv.includes("--full");
  if (full || !existsSync(join(ROOT, "dist", "index.html"))) {
    console.log("[bundle:measure] building SPA…");
    const spa = run("pnpm", ["run", "build:spa"]);
    if (!spa.ok) {
      console.error(spa.stderr || spa.stdout);
      process.exit(spa.status ?? 1);
    }
  }

  console.log("[bundle:measure] wrangler dry-run…");
  const bundle = run("pnpm", [
    "exec",
    "wrangler",
    "deploy",
    "--dry-run",
    "--outdir",
    OUTDIR,
  ]);
  const combined = `${bundle.stdout}\n${bundle.stderr}`;
  if (!bundle.ok) {
    console.error(combined);
    process.exit(bundle.status ?? 1);
  }

  const entryPath = join(ROOT, OUTDIR, ENTRY_BASENAME);
  if (!existsSync(entryPath)) {
    console.error(`[bundle:measure] missing ${OUTDIR}/${ENTRY_BASENAME}`);
    process.exit(1);
  }

  const raw = readFileSync(entryPath);
  const gzipBytes = gzipSync(raw).length;
  const upload = combined.match(TOTAL_UPLOAD_RE);

  const report = {
    measuredAt: new Date().toISOString(),
    entry: "src/worker-entry.ts",
    artifact: `${OUTDIR}/${ENTRY_BASENAME}`,
    rawKiB: kiB(statSync(entryPath).size),
    gzipKiB: kiB(gzipBytes),
    wranglerTotalUploadKiB: upload ? Number(upload[1]) : null,
    wranglerTotalGzipKiB: upload ? Number(upload[2]) : null,
    limitKiB: BUNDLE_GZIP_LIMIT_KIB,
    pass: kiB(gzipBytes) <= BUNDLE_GZIP_LIMIT_KIB,
  };

  console.log(JSON.stringify(report, null, 2));
  if (!report.pass) {
    console.error(`[bundle:measure] FAIL — ${report.gzipKiB} KiB > ${BUNDLE_GZIP_LIMIT_KIB} KiB`);
    process.exit(1);
  }
}

main();
