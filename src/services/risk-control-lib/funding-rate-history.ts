/**
 * ETH/Perp funding rate history SSOT + regime classification (2024–2026 window).
 */

export const ETH_FUNDING_HISTORY = {
  periodLabel: "2024-2026",
  /** Annualized gross funding APR (HL ETH/Perp composite) */
  avgGrossAprPct: 12.8,
  medianGrossAprPct: 11.2,
  /** Share of 8h funding intervals with rate >= 0 */
  positiveFundingPct: 71.4,
  /** Longest observed negative-funding streak (calendar days) */
  maxConsecutiveNegativeDays: 14,
  p95NegativeStreakDays: 9,
} as const;

export type FundingRegime =
  | "NORMAL_POSITIVE"
  | "MILD_NEGATIVE"
  | "PROLONGED_NEGATIVE";

/** Hourly funding below this (bps) triggers prolonged-negative classification */
export const PROLONGED_NEGATIVE_RATE_BPS = -10;

/** Continuous negative funding beyond this window escalates to mild-negative */
export const MILD_NEGATIVE_MIN_HOURS = 24;

/** Cumulative negative yield APR floor — breach triggers prolonged-negative */
export const PROLONGED_CUMULATIVE_YIELD_APR_PCT = -3.0;

export interface FundingRegimeContext {
  /** Hours funding has been continuously negative */
  negativeDurationHours?: number;
  /** Rolling cumulative negative yield as signed APR percent */
  cumulativeNegativeYieldApr?: number;
}

export interface FundingStressPoint {
  day: number;
  rateBps: number;
  regime: FundingRegime;
}

/**
 * Classify live funding into NORMAL_POSITIVE | MILD_NEGATIVE | PROLONGED_NEGATIVE.
 * Rate-only path: >=0 normal · < -10 bps prolonged · else mild when negative.
 */
export function evaluateFundingRegime(
  currentRateBps: number,
  context: FundingRegimeContext = {},
): FundingRegime {
  if (currentRateBps >= 0) {
    return "NORMAL_POSITIVE";
  }

  const hours = Math.max(0, context.negativeDurationHours ?? 0);
  const cumulative = context.cumulativeNegativeYieldApr ?? 0;

  if (
    currentRateBps < PROLONGED_NEGATIVE_RATE_BPS ||
    cumulative <= PROLONGED_CUMULATIVE_YIELD_APR_PCT ||
    hours >= ETH_FUNDING_HISTORY.maxConsecutiveNegativeDays * 24
  ) {
    return "PROLONGED_NEGATIVE";
  }

  return "MILD_NEGATIVE";
}

/** Replay daily funding (bps) through regime classifier for stress dashboards. */
export function simulateFundingStressPath(
  dailyRatesBps: readonly number[],
): FundingStressPoint[] {
  let negativeHours = 0;
  let cumulativeApr = 0;

  return dailyRatesBps.map((rateBps, index) => {
    if (rateBps < 0) {
      negativeHours += 24;
      cumulativeApr += (rateBps / 10_000) * 3 * 365;
    } else {
      negativeHours = 0;
    }

    const regime = evaluateFundingRegime(rateBps, {
      negativeDurationHours: negativeHours,
      cumulativeNegativeYieldApr: cumulativeApr,
    });

    return { day: index + 1, rateBps, regime };
  });
}
