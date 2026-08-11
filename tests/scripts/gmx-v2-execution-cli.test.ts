import { afterEach, describe, expect, it, vi } from "vitest";
import {
  AUDITOR_ORACLE_LAG_NOTE,
  isGmxV2ExecutionHelpRequested,
  parseGmxV2ExecutionCli,
  printGmxV2ExecutionHelp,
  resolveOracleLagAuditorNote,
  validateGmxExecutionGuards,
} from "../../scripts/gmx-v2-execution-cli";
import {
  __resetArbitrumGasGuardForTests,
  __setArbitrumGasGuardForTests,
  buildArbitrumGasGuardMetrics,
} from "../../src/services/risk/arbitrum-gas-guard";
import {
  __resetSequencerGuardCacheForTests,
  __setSequencerProbeForTests,
} from "../../src/services/risk/sequencer-guard";

afterEach(() => {
  __resetArbitrumGasGuardForTests();
  __resetSequencerGuardCacheForTests();
  vi.restoreAllMocks();
});

function armSequencerSafe(now = Date.now()): void {
  const sec = Math.floor(now / 1000);
  __setSequencerProbeForTests({
    answer: 0,
    startedAtSec: sec - 900,
    updatedAtSec: sec,
    fetchedAtMs: now,
    safe: true,
    reason: null,
  });
}

function armOracleLagDeadlock(now = Date.now()): void {
  armSequencerSafe(now);
  __setArbitrumGasGuardForTests({
    l1BaseFeeWei: 0n,
    l1SurchargeWei: 0n,
    l1SurchargeUsd: 0,
    targetYieldUsd: 0.1,
    gasYieldRatio: 0,
    gasBlocked: false,
    oracleUpdatedAtMs: 1_000,
    l2BlockTimestampMs: 32_000,
    oracleLagMs: 31_000,
    oracleLagDeadlock: true,
    reason: "ORACLE_LAG_DEADLOCK:31000ms>30000ms",
    fetchedAtMs: now,
  });
}

describe("gmx-v2-execution-cli", () => {
  it("isGmxV2ExecutionHelpRequested detects --help and -h", () => {
    expect(isGmxV2ExecutionHelpRequested(["--help"])).toBe(true);
    expect(isGmxV2ExecutionHelpRequested(["-h"])).toBe(true);
    expect(isGmxV2ExecutionHelpRequested(["--live-read"])).toBe(false);
  });

  it("printGmxV2ExecutionHelp documents --live-read, --allow-stale-oracle, and --help", () => {
    const spy = vi.spyOn(console, "log").mockImplementation(() => {});
    printGmxV2ExecutionHelp();
    const text = String(spy.mock.calls[0]?.[0]);
    expect(text).toContain("--live-read");
    expect(text).toContain("--allow-stale-oracle");
    expect(text).toContain("-h, --help");
  });

  it("parseGmxV2ExecutionCli parses live-read and allow-stale-oracle flags", () => {
    const cli = parseGmxV2ExecutionCli([
      "--live-read",
      "--allow-stale-oracle",
      "--symbol",
      "eth",
      "--size",
      "250",
      "--side",
      "long",
    ]);
    expect(cli.liveRead).toBe(true);
    expect(cli.allowStaleOracle).toBe(true);
    expect(cli.symbol).toBe("ETH");
    expect(cli.sizeUsd).toBe(250);
    expect(cli.side).toBe("long");
  });

  it("resolveOracleLagAuditorNote returns LIVE_DEFENSE_ACTIVE guidance on oracle lag block", () => {
    armOracleLagDeadlock();
    const gas = buildArbitrumGasGuardMetrics();
    const note = resolveOracleLagAuditorNote(
      ["ORACLE_LAG_DEADLOCK:31000ms>30000ms"],
      gas,
    );
    expect(note).toBe(AUDITOR_ORACLE_LAG_NOTE);
    expect(note).toContain("--allow-stale-oracle");
  });

  it("validateGmxExecutionGuards blocks on oracle lag without bypass", () => {
    armOracleLagDeadlock();
    const verdict = validateGmxExecutionGuards(false);
    expect(verdict.ok).toBe(false);
    expect(verdict.reasons.join("|")).toContain("ORACLE_LAG");
  });

  it("validateGmxExecutionGuards bypasses oracle lag with --allow-stale-oracle", () => {
    armOracleLagDeadlock();
    const warn = vi.spyOn(console, "error").mockImplementation(() => {});
    const verdict = validateGmxExecutionGuards(true);
    expect(verdict.ok).toBe(true);
    expect(warn.mock.calls[0]?.[0]).toContain("[BYPASS_WARNING]");
    expect(warn.mock.calls[0]?.[0]).toContain("--allow-stale-oracle");
  });
});
