/**
 * Dynamic Liquidation Distance Meter — Cross-Margin Perp Short safety boundary.
 * Below +50% distance → soilRebalance() reallocates spot collateral.
 */

import { calculateLiqDistance } from "../exchanges/hl-margin";
import { notifyFailClosedLock } from "../telemetry/telegram-alert";

/** Trigger soil rebalance when liquidation distance falls below this %. */
export const LIQUIDATION_SAFE_DISTANCE_PCT = 50 as const;

/** Default HL-style maintenance margin rate for cross-margin estimate. */
export const DEFAULT_CROSS_MMR = 0.05 as const;

export interface LiquidationMeterInput {
  /** Mark / mid price */
  markPx: number;
  /**
   * Exchange-reported liquidation price.
   * For perp shorts under cross margin, liqPx is typically above mark.
   */
  liquidationPx?: number;
  /** Cross-margin account equity (USD) */
  accountEquityUsd?: number;
  /** Absolute short notional USD (|szi| * mark) */
  shortNotionalUsd?: number;
  /** Maintenance margin rate (default 5%) */
  maintenanceMarginRate?: number;
}

export interface LiquidationMeterResult {
  /** Live liquidation distance in percent (positive = buffer above mark for shorts) */
  liquidationDistancePct: number;
  source: "exchange_liq_px" | "cross_margin_estimate" | "unavailable";
  /** True when distance < +50% → must soilRebalance */
  needsSoilRebalance: boolean;
  markPx: number;
  liquidationPx: number | null;
  reasons: string[];
}

export interface SoilRebalanceInput {
  spotCollateralUsd: number;
  perpShortNotionalUsd: number;
  liquidationDistancePct: number;
  /** Target post-rebalance distance (default 50%) */
  targetDistancePct?: number;
  accountEquityUsd?: number;
}

export interface SoilRebalanceResult {
  triggered: boolean;
  reason: string;
  /** Spot collateral to allocate / top-up (USD) */
  spotCollateralDeltaUsd: number;
  /** Suggested perp short notional after trim (USD) */
  targetShortNotionalUsd: number;
  spotCollateralUsdAfter: number;
  projectedDistancePct: number;
}

/**
 * Estimate cross-margin short liquidation price when exchange liqPx missing.
 * Approx: liqPx ≈ mark * (1 + (equity/notional − mmr)) for shorts (price-up risk).
 */
export function estimateCrossMarginShortLiqPx(input: {
  markPx: number;
  accountEquityUsd: number;
  shortNotionalUsd: number;
  maintenanceMarginRate?: number;
}): number | null {
  const mark = Number(input.markPx) || 0;
  const equity = Number(input.accountEquityUsd) || 0;
  const notional = Math.abs(Number(input.shortNotionalUsd) || 0);
  const mmr = input.maintenanceMarginRate ?? DEFAULT_CROSS_MMR;
  if (!(mark > 0) || !(notional > 0) || !(equity > 0)) return null;
  const bufferRatio = equity / notional - mmr;
  if (!(bufferRatio > 0)) return mark; // already at/through maintenance
  return mark * (1 + bufferRatio);
}

/**
 * Live Liquidation Distance (%) for Perp Short under Cross Margin.
 * Distance = |liqPx − mark| / mark × 100 (positive buffer).
 */
export function measureLiquidationDistance(
  input: LiquidationMeterInput,
): LiquidationMeterResult {
  const markPx = Number(input.markPx) || 0;
  const reasons: string[] = [];
  let liquidationPx: number | null = null;
  let source: LiquidationMeterResult["source"] = "unavailable";

  if (
    input.liquidationPx != null &&
    Number.isFinite(input.liquidationPx) &&
    input.liquidationPx > 0
  ) {
    liquidationPx = input.liquidationPx;
    source = "exchange_liq_px";
  } else if (
    input.accountEquityUsd != null &&
    input.shortNotionalUsd != null
  ) {
    liquidationPx = estimateCrossMarginShortLiqPx({
      markPx,
      accountEquityUsd: input.accountEquityUsd,
      shortNotionalUsd: input.shortNotionalUsd,
      maintenanceMarginRate: input.maintenanceMarginRate,
    });
    source = liquidationPx != null ? "cross_margin_estimate" : "unavailable";
  }

  const liquidationDistancePct =
    liquidationPx != null && markPx > 0
      ? calculateLiqDistance(markPx, liquidationPx)
      : 0;

  if (source === "unavailable") {
    reasons.push("LIQ_DISTANCE_UNAVAILABLE");
  }

  const needsSoilRebalance =
    source !== "unavailable" &&
    liquidationDistancePct < LIQUIDATION_SAFE_DISTANCE_PCT;

  if (needsSoilRebalance) {
    reasons.push(
      `LIQ_DISTANCE=${liquidationDistancePct.toFixed(2)}%<${LIQUIDATION_SAFE_DISTANCE_PCT}%`,
    );
  }

  return {
    liquidationDistancePct,
    source,
    needsSoilRebalance,
    markPx,
    liquidationPx,
    reasons,
  };
}

/**
 * Reallocate spot collateral (and optionally trim short) to restore ≥ +50% liq distance.
 */
export function soilRebalance(input: SoilRebalanceInput): SoilRebalanceResult {
  const targetDistancePct =
    input.targetDistancePct ?? LIQUIDATION_SAFE_DISTANCE_PCT;
  const distance = Number(input.liquidationDistancePct) || 0;
  const spot = Math.max(0, Number(input.spotCollateralUsd) || 0);
  const shortNotional = Math.max(0, Number(input.perpShortNotionalUsd) || 0);

  if (!(distance < targetDistancePct)) {
    return {
      triggered: false,
      reason: "LIQ_DISTANCE_HEALTHY",
      spotCollateralDeltaUsd: 0,
      targetShortNotionalUsd: shortNotional,
      spotCollateralUsdAfter: spot,
      projectedDistancePct: distance,
    };
  }

  // Deficit fraction vs target — top up spot by shortNotional * gap, else trim short.
  const gapFrac = Math.max(0, (targetDistancePct - distance) / 100);
  let spotCollateralDeltaUsd = shortNotional * gapFrac;
  let targetShortNotionalUsd = shortNotional;
  let spotAfter = spot + spotCollateralDeltaUsd;
  let projectedDistancePct = distance + gapFrac * 100;

  // If still short of target after reasonable top-up (>50% of notional), trim short 1:1 with gap.
  if (spotCollateralDeltaUsd > shortNotional * 0.5 && shortNotional > 0) {
    const trimFrac = Math.min(0.5, gapFrac);
    targetShortNotionalUsd = shortNotional * (1 - trimFrac);
    spotCollateralDeltaUsd = shortNotional * gapFrac * 0.5;
    spotAfter = spot + spotCollateralDeltaUsd;
    projectedDistancePct = Math.max(targetDistancePct, distance + trimFrac * 100);
  }

  const reason = `SOIL_REBALANCE:liqDist=${distance.toFixed(2)}%<${targetDistancePct}% → spot+$${spotCollateralDeltaUsd.toFixed(2)} short→$${targetShortNotionalUsd.toFixed(2)}`;
  notifyFailClosedLock(reason);

  return {
    triggered: true,
    reason,
    spotCollateralDeltaUsd,
    targetShortNotionalUsd,
    spotCollateralUsdAfter: spotAfter,
    projectedDistancePct,
  };
}

/** Measure distance and auto-trigger soilRebalance when below +50%. */
export function evaluateLiquidationSafety(input: LiquidationMeterInput & {
  spotCollateralUsd: number;
  perpShortNotionalUsd?: number;
}): {
  meter: LiquidationMeterResult;
  rebalance: SoilRebalanceResult | null;
} {
  const meter = measureLiquidationDistance(input);
  if (!meter.needsSoilRebalance) {
    return { meter, rebalance: null };
  }
  const rebalance = soilRebalance({
    spotCollateralUsd: input.spotCollateralUsd,
    perpShortNotionalUsd:
      input.perpShortNotionalUsd ?? input.shortNotionalUsd ?? 0,
    liquidationDistancePct: meter.liquidationDistancePct,
  });
  return { meter, rebalance };
}
