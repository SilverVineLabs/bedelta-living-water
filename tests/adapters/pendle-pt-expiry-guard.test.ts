import { describe, expect, it } from "vitest";
import {
  evaluatePendlePtExpiryRisk,
  PENDLE_PT_NEAR_EXPIRY,
  PENDLE_YIELD_JITTER_BREACH,
} from "../../src/adapters/pendle/pendle-pt-expiry-guard";

const NOW_MS = 1_700_000_000_000;
const THREE_DAYS_SEC = Math.floor(NOW_MS / 1000) + 3 * 86_400;
const THIRTY_DAYS_SEC = Math.floor(NOW_MS / 1000) + 30 * 86_400;

describe("pendle-pt-expiry-guard", () => {
  it("fail-closes when <7 days to maturity and jitter > 200 bps", () => {
    const v = evaluatePendlePtExpiryRisk(THREE_DAYS_SEC, 250, NOW_MS);
    expect(v.failClosed).toBe(true);
    expect(v.daysToMaturity).toBeLessThan(7);
    expect(v.impliedYieldJitterBps).toBe(250);
    expect(v.reasons).toContain(PENDLE_PT_NEAR_EXPIRY);
    expect(v.reasons).toContain(PENDLE_YIELD_JITTER_BREACH);
  });

  it("allows when near expiry but jitter within 200 bps", () => {
    const v = evaluatePendlePtExpiryRisk(THREE_DAYS_SEC, 150, NOW_MS);
    expect(v.failClosed).toBe(false);
    expect(v.reasons).toContain(PENDLE_PT_NEAR_EXPIRY);
    expect(v.reasons).not.toContain(PENDLE_YIELD_JITTER_BREACH);
  });

  it("allows when jitter high but maturity >7 days away", () => {
    const v = evaluatePendlePtExpiryRisk(THIRTY_DAYS_SEC, 300, NOW_MS);
    expect(v.failClosed).toBe(false);
    expect(v.daysToMaturity).toBeGreaterThanOrEqual(7);
  });
});
