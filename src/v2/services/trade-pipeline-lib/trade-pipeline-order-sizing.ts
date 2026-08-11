import {
  computeEffectiveMaxSlUsd,
  computeOrderAwareMaxSlUsd,
  DEFAULT_ACCOUNT_EQUITY_USD,
  sanitizeAccountEquityUsd,
} from "../../../services/effective-max-sl";
import { evaluateFundingRegimePolicy } from "../../../services/risk-control";

/** @deprecated Use computeEffectiveMaxSlUsd(DEFAULT_ACCOUNT_EQUITY_USD) */
export const MAX_SL_USD = computeEffectiveMaxSlUsd(DEFAULT_ACCOUNT_EQUITY_USD);

export const DEFAULT_CAPITAL_USD = DEFAULT_ACCOUNT_EQUITY_USD;
export const ORDER_SIZE_MIN_USD = 1_000 as const;
export const ORDER_SIZE_MAX_USD = 100_000 as const;

/** Top-bar tactical modes (Shield / Tactical / Flash). */
export type TradeMode = "SHIELD" | "TACTICAL" | "FLASH";

/** @deprecated Legacy aliases — prefer TradeMode */
export type LegacyTradeMode = "BEGINNER" | "INTERMEDIATE" | "EXPERT";

export function normalizeTradeMode(mode: string | null | undefined): TradeMode {
  const m = String(mode || "").toUpperCase();
  if (m === "TACTICAL" || m === "INTERMEDIATE") return "TACTICAL";
  if (m === "FLASH" || m === "EXPERT") return "FLASH";
  return "SHIELD";
}

/** Sanitize capital — empty / NaN / <= 0 falls back to $10,000 (no div-by-zero). */
export function sanitizeCapitalUsd(raw: unknown): number {
  return sanitizeAccountEquityUsd(raw);
}

/** Slider max = capital, hard-capped into [$1k, $100k]. */
export function resolveOrderSizeMaxUsd(capitalUsd: number): number {
  const capital = sanitizeCapitalUsd(capitalUsd);
  return Math.max(
    ORDER_SIZE_MIN_USD,
    Math.min(ORDER_SIZE_MAX_USD, capital),
  );
}

/** Clamp order size into [min, sliderMax(capital)]. */
export function clampOrderSizeUsd(
  orderSizeUsd: number,
  capitalUsd: number,
): number {
  const max = resolveOrderSizeMaxUsd(capitalUsd);
  const n = Number(orderSizeUsd);
  if (!Number.isFinite(n) || n < ORDER_SIZE_MIN_USD) return ORDER_SIZE_MIN_USD;
  return Math.min(Math.max(n, ORDER_SIZE_MIN_USD), max);
}

/** Apply funding-regime leverage scaling to rebalance notional before margin checks. */
export function resolveFundingAdjustedOrderSize(input: {
  baseNotionalUsd: number;
  currentRateBps: number;
  negativeDurationHours?: number;
  cumulativeNegativeYieldApr?: number;
  isRebalance?: boolean;
}): {
  orderSizeUsd: number;
  targetLeverage: number;
  regime: ReturnType<typeof evaluateFundingRegimePolicy>["regime"];
  haltRebalancing: boolean;
} {
  const policy = evaluateFundingRegimePolicy({
    ...input,
    baseNotionalUsd: input.baseNotionalUsd,
  });
  return {
    orderSizeUsd: policy.scaledNotionalUsd,
    targetLeverage: policy.targetLeverage,
    regime: policy.regime,
    haltRebalancing: policy.haltRebalancing,
  };
}

export function estimateSlipLossUsd(
  orderSizeUsd: number,
  slipRatio: number,
): number {
  return Math.max(0, orderSizeUsd) * Math.max(0, slipRatio);
}

export function estimateFrictionLossUsd(
  orderSizeUsd: number,
  frictionRate: number,
  fixedCostUsd: number,
): number {
  return Math.max(0, orderSizeUsd) * Math.max(0, frictionRate) + Math.max(0, fixedCostUsd);
}

/**
 * True when expected slippage (and optional market friction) exceeds the dynamic Max SL boundary.
 */
export function exceedsMaxRiskBoundary(input: {
  orderSizeUsd: number;
  slipRatio: number;
  accountEquityUsd?: number;
  frictionRate?: number;
  fixedCostUsd?: number;
  includeFriction?: boolean;
}): boolean {
  const equity = sanitizeAccountEquityUsd(input.accountEquityUsd);
  const maxSl = computeOrderAwareMaxSlUsd(equity, input.orderSizeUsd, input.slipRatio);
  const slipLoss = estimateSlipLossUsd(input.orderSizeUsd, input.slipRatio);
  if (slipLoss > maxSl) return true;
  if (input.includeFriction) {
    const frictionLoss = estimateFrictionLossUsd(
      input.orderSizeUsd,
      input.frictionRate ?? 0,
      input.fixedCostUsd ?? 0,
    );
    if (frictionLoss > maxSl) return true;
  }
  return false;
}

/** Required margin notional (1x conservative — full order size). */
export function requiredMarginUsd(orderSizeUsd: number): number {
  return Math.max(0, Number(orderSizeUsd) || 0);
}

export function hasInsufficientMargin(
  withdrawableCollateral: number,
  requiredMargin: number,
): boolean {
  return withdrawableCollateral < requiredMargin;
}
