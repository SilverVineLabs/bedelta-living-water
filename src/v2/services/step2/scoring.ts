/**
 * Step 2 weakness scoring — funding, OI divergence, depth asymmetry, liq magnet.
 * @theory Kyle (1985) — book depth asymmetry as liquidity stress proxy.
 * @theory Hasbrouck (1991) — microstructure-informed weakness ranking.
 */

import {
  DEPTH_ASYMMETRY_HIGH,
  DEPTH_ASYMMETRY_LOW,
  FUNDING_ANOMALY_THRESHOLD,
  FUNDING_EXTREME_THRESHOLD,
  LIQUIDATION_MAGNET_PCT,
  MIN_DAY_VOLUME_USD,
} from "../../../config/constants";
import type {
  EnemyDebuffType,
  TargetDirection,
  WeakTargetMetric,
} from "../../types/step2-targets";
import type { Tier1Candidate } from "./types";

export function clampScore(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(100, n));
}

export function computeBookDepthAsymmetryRatio(
  bidDepthUsd: number,
  askDepthUsd: number,
): number {
  if (!(askDepthUsd > 0)) return bidDepthUsd > 0 ? Infinity : 1;
  return bidDepthUsd / askDepthUsd;
}

export function assignDebuffs(input: {
  fundingRateHourly: number;
  bookDepthAsymmetryRatio: number;
  estimatedLiquidationDistancePct: number;
  oiChange24hRatio: number;
  priceChange24hRatio: number;
}): EnemyDebuffType[] {
  const debuffs: EnemyDebuffType[] = [];
  const asym = input.bookDepthAsymmetryRatio;
  if (
    Number.isFinite(asym) &&
    (asym < DEPTH_ASYMMETRY_LOW || asym > DEPTH_ASYMMETRY_HIGH)
  ) {
    debuffs.push("DEBUFF_AIR_POCKET");
  }
  if (Math.abs(input.fundingRateHourly) > FUNDING_EXTREME_THRESHOLD) {
    debuffs.push("DEBUFF_BLEEDING");
  }
  if (
    Number.isFinite(input.estimatedLiquidationDistancePct) &&
    input.estimatedLiquidationDistancePct < LIQUIDATION_MAGNET_PCT
  ) {
    debuffs.push("DEBUFF_MAGNET_PULL");
  }
  const oiDiverges =
    Math.abs(input.oiChange24hRatio) >= 0.05 &&
    Math.abs(input.priceChange24hRatio) >= 0.02 &&
    Math.sign(input.oiChange24hRatio) !== Math.sign(input.priceChange24hRatio) &&
    Math.sign(input.oiChange24hRatio) !== 0 &&
    Math.sign(input.priceChange24hRatio) !== 0;
  if (oiDiverges) debuffs.push("DEBUFF_CROWDED_TRAP");
  return debuffs;
}

export function computeWeaknessScore(input: {
  fundingRateHourly: number;
  oiChange24hRatio: number;
  priceChange24hRatio: number;
  bookDepthAsymmetryRatio: number;
  estimatedLiquidationDistancePct: number;
}): number {
  const fundingAbs = Math.abs(input.fundingRateHourly);
  const fundingScore = Math.min(40, (fundingAbs / FUNDING_EXTREME_THRESHOLD) * 40);

  const oiAbs = Math.abs(input.oiChange24hRatio);
  const pxAbs = Math.abs(input.priceChange24hRatio);
  const diverges =
    oiAbs >= 0.05 &&
    pxAbs >= 0.02 &&
    Math.sign(input.oiChange24hRatio) !== Math.sign(input.priceChange24hRatio) &&
    Math.sign(input.oiChange24hRatio) !== 0 &&
    Math.sign(input.priceChange24hRatio) !== 0;
  const divergenceScore = diverges
    ? Math.min(30, (oiAbs / 0.25) * 15 + (pxAbs / 0.1) * 15)
    : Math.min(10, oiAbs * 20 + pxAbs * 20);

  const asym = input.bookDepthAsymmetryRatio;
  let depthScore = 0;
  if (Number.isFinite(asym)) {
    if (asym < DEPTH_ASYMMETRY_LOW) {
      depthScore = Math.min(20, ((DEPTH_ASYMMETRY_LOW - asym) / DEPTH_ASYMMETRY_LOW) * 20);
    } else if (asym > DEPTH_ASYMMETRY_HIGH) {
      depthScore = Math.min(20, ((asym - DEPTH_ASYMMETRY_HIGH) / DEPTH_ASYMMETRY_HIGH) * 20);
    }
  } else if (!Number.isFinite(asym) && asym === Infinity) {
    depthScore = 20;
  }

  const liq = input.estimatedLiquidationDistancePct;
  const liqScore =
    Number.isFinite(liq) && liq < LIQUIDATION_MAGNET_PCT
      ? Math.min(10, ((LIQUIDATION_MAGNET_PCT - liq) / LIQUIDATION_MAGNET_PCT) * 10)
      : 0;

  return clampScore(fundingScore + divergenceScore + depthScore + liqScore);
}

export function resolveTargetDirection(
  fundingRateHourly: number,
  oiChange24hRatio: number,
  priceChange24hRatio: number,
): TargetDirection {
  if (Math.abs(fundingRateHourly) >= FUNDING_ANOMALY_THRESHOLD) {
    return fundingRateHourly > 0 ? "WEAK_LONG" : "WEAK_SHORT";
  }
  if (oiChange24hRatio > 0 && priceChange24hRatio < 0) return "WEAK_LONG";
  if (oiChange24hRatio < 0 && priceChange24hRatio > 0) return "WEAK_SHORT";
  return fundingRateHourly >= 0 ? "WEAK_LONG" : "WEAK_SHORT";
}

function buildReasoning(input: {
  direction: TargetDirection;
  debuffs: EnemyDebuffType[];
  fundingRateHourly: number;
  oiChange24hRatio: number;
  priceChange24hRatio: number;
  bookDepthAsymmetryRatio: number;
  estimatedLiquidationDistancePct: number;
}): string[] {
  const lines: string[] = [
    `Direction ${input.direction} from funding=${(input.fundingRateHourly * 100).toFixed(4)}%/h`,
    `OI Δ24h=${(input.oiChange24hRatio * 100).toFixed(2)}% vs price Δ24h=${(input.priceChange24hRatio * 100).toFixed(2)}%`,
  ];
  if (Number.isFinite(input.bookDepthAsymmetryRatio)) {
    lines.push(`Book depth asymmetry bid/ask=${input.bookDepthAsymmetryRatio.toFixed(3)}`);
  }
  lines.push(`Est. liquidation distance=${input.estimatedLiquidationDistancePct.toFixed(2)}%`);
  if (input.debuffs.length > 0) lines.push(`Debuffs: ${input.debuffs.join(", ")}`);
  return lines;
}

export function buildWeakTargetMetric(
  candidate: Tier1Candidate,
  book: { bidDepthUsd: number; askDepthUsd: number; estimatedLiquidationDistancePct: number },
): WeakTargetMetric {
  const bookDepthAsymmetryRatio = computeBookDepthAsymmetryRatio(
    book.bidDepthUsd,
    book.askDepthUsd,
  );
  const estimatedLiquidationDistancePct = book.estimatedLiquidationDistancePct;
  const direction = resolveTargetDirection(
    candidate.fundingRateHourly,
    candidate.oiChange24hRatio,
    candidate.priceChange24hRatio,
  );
  const debuffs = assignDebuffs({
    fundingRateHourly: candidate.fundingRateHourly,
    bookDepthAsymmetryRatio,
    estimatedLiquidationDistancePct,
    oiChange24hRatio: candidate.oiChange24hRatio,
    priceChange24hRatio: candidate.priceChange24hRatio,
  });
  const weaknessScore = computeWeaknessScore({
    fundingRateHourly: candidate.fundingRateHourly,
    oiChange24hRatio: candidate.oiChange24hRatio,
    priceChange24hRatio: candidate.priceChange24hRatio,
    bookDepthAsymmetryRatio,
    estimatedLiquidationDistancePct,
  });

  const thinSide = Math.min(Math.max(book.bidDepthUsd, 0), Math.max(book.askDepthUsd, 0));
  const minCapitalToCascadeUSD = Math.max(500, thinSide * 0.15);
  const estimatedCascadeVolumeUSD =
    candidate.openInterestUsd *
    Math.max(
      0.02,
      (LIQUIDATION_MAGNET_PCT -
        Math.min(estimatedLiquidationDistancePct, LIQUIDATION_MAGNET_PCT)) /
        LIQUIDATION_MAGNET_PCT,
    );

  return {
    symbol: candidate.symbol,
    direction,
    weaknessScore,
    debuffs,
    cascadeMetrics: {
      minCapitalToCascadeUSD: Number(minCapitalToCascadeUSD.toFixed(2)),
      estimatedCascadeVolumeUSD: Number(estimatedCascadeVolumeUSD.toFixed(2)),
    },
    metrics: {
      fundingRateHourly: candidate.fundingRateHourly,
      oiChange24hRatio: candidate.oiChange24hRatio,
      priceChange24hRatio: candidate.priceChange24hRatio,
      bookDepthAsymmetryRatio: Number.isFinite(bookDepthAsymmetryRatio)
        ? Number(bookDepthAsymmetryRatio.toFixed(4))
        : bookDepthAsymmetryRatio,
      estimatedLiquidationDistancePct,
    },
    reasoning: buildReasoning({
      direction,
      debuffs,
      fundingRateHourly: candidate.fundingRateHourly,
      oiChange24hRatio: candidate.oiChange24hRatio,
      priceChange24hRatio: candidate.priceChange24hRatio,
      bookDepthAsymmetryRatio,
      estimatedLiquidationDistancePct,
    }),
  };
}

function hasFundingAnomaly(funding: number): boolean {
  return Math.abs(funding) >= FUNDING_ANOMALY_THRESHOLD;
}

function hasOiPriceDivergence(oiChange: number, priceChange: number): boolean {
  return (
    Math.abs(oiChange) >= 0.05 &&
    Math.abs(priceChange) >= 0.02 &&
    Math.sign(oiChange) !== Math.sign(priceChange) &&
    Math.sign(oiChange) !== 0 &&
    Math.sign(priceChange) !== 0
  );
}

export function passesTier1Filter(row: {
  dayNtlVlm: number;
  fundingRateHourly: number;
  oiChange24hRatio: number;
  priceChange24hRatio: number;
}): boolean {
  if (!(row.dayNtlVlm > MIN_DAY_VOLUME_USD)) return false;
  return (
    hasFundingAnomaly(row.fundingRateHourly) ||
    hasOiPriceDivergence(row.oiChange24hRatio, row.priceChange24hRatio)
  );
}

/**
 * Pre-trade high-funding + book-depth asymmetry entry gate.
 * Requires funding anomaly AND air-pocket depth asymmetry.
 */
export function passesHighFundingAsymmetryFilter(input: {
  fundingRateHourly: number;
  bookDepthAsymmetryRatio: number;
}): boolean {
  if (!hasFundingAnomaly(input.fundingRateHourly)) return false;
  const asym = input.bookDepthAsymmetryRatio;
  if (!Number.isFinite(asym)) return asym === Infinity;
  return asym < DEPTH_ASYMMETRY_LOW || asym > DEPTH_ASYMMETRY_HIGH;
}

export function tier1Priority(c: Tier1Candidate): number {
  return (
    Math.abs(c.fundingRateHourly) * 1e6 +
    Math.abs(c.oiChange24hRatio) * 100 +
    Math.abs(c.priceChange24hRatio) * 50 +
    Math.log10(Math.max(c.dayNtlVlm, 1))
  );
}
