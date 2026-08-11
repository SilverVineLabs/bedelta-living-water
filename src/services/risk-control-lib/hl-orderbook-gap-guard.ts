/**
 * Hyperliquid Orderbook Gap Guard — leverage scale-down + elevated depth margin (c13).
 */

import { isXyzOrHip3Key } from "../exchanges/asset-classifier-lib/asset-classifier-core";
import { FUNDING_LEVERAGE_MILD_FLOOR, FUNDING_LEVERAGE_NORMAL } from "./funding-regime-guard";
import { isHlOrderbookGapWindow } from "./time-gates";
import { recordHlOrderbookGapGuardTrigger } from "../telemetry-analytics-lib/telemetry-analytics-core";

export const HL_ORDERBOOK_GAP_GUARD = "HL_ORDERBOOK_GAP_GUARD" as const;
export const HL_ORDERBOOK_GAP_DEPTH_MULTIPLIER = 2;

export interface HlOrderbookGapGuardInput {
  symbol: string;
  depthUsd?: number;
  minDepthUsd?: number;
  requestedLeverage?: number;
  at?: Date;
}

export interface HlOrderbookGapGuardResult {
  triggered: boolean;
  targetLeverage: number;
  requiredMinDepthUsd: number;
  reasons: string[];
}

/** Evaluate Hyperliquid orderbook gap window — scale 3x → 1x and double depth floor. */
export function evaluateHlOrderbookGapGuard(
  input: HlOrderbookGapGuardInput,
): HlOrderbookGapGuardResult {
  const symbol = String(input.symbol ?? "").trim();
  const baseMinDepth = Math.max(0, Number(input.minDepthUsd) || 0);
  const reasons: string[] = [];

  if (!isXyzOrHip3Key(symbol)) {
    return {
      triggered: false,
      targetLeverage: input.requestedLeverage ?? FUNDING_LEVERAGE_NORMAL,
      requiredMinDepthUsd: baseMinDepth,
      reasons,
    };
  }

  if (!isHlOrderbookGapWindow(input.at)) {
    return {
      triggered: false,
      targetLeverage: input.requestedLeverage ?? FUNDING_LEVERAGE_NORMAL,
      requiredMinDepthUsd: baseMinDepth,
      reasons,
    };
  }

  const targetLeverage = FUNDING_LEVERAGE_MILD_FLOOR;
  const requiredMinDepthUsd = Math.round(
    baseMinDepth * HL_ORDERBOOK_GAP_DEPTH_MULTIPLIER,
  );
  reasons.push(HL_ORDERBOOK_GAP_GUARD);
  reasons.push(`HL_ORDERBOOK_LEVERAGE_SCALE=${FUNDING_LEVERAGE_NORMAL}x->${targetLeverage}x`);

  if (
    input.requestedLeverage !== undefined &&
    Number.isFinite(input.requestedLeverage) &&
    input.requestedLeverage > targetLeverage + 1e-6
  ) {
    reasons.push(
      `HL_ORDERBOOK_LEVERAGE_CAP=${targetLeverage}<${input.requestedLeverage.toFixed(2)}`,
    );
  }

  if (
    input.depthUsd !== undefined &&
    input.depthUsd < requiredMinDepthUsd
  ) {
    reasons.push(
      `HL_ORDERBOOK_GAP_GUARD_DEPTH=${input.depthUsd}<${requiredMinDepthUsd}`,
    );
  }

  recordHlOrderbookGapGuardTrigger();

  return {
    triggered: true,
    targetLeverage,
    requiredMinDepthUsd,
    reasons,
  };
}
