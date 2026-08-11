/**
 * Hyperliquid L1 order wire builders and pre-trade Pgate gate.
 * @see risk-control.ts — checkSoilResistanceWithVine()
 */

import { assertVineShield } from "../../services/fool-proof-guard";
import { checkSoilResistanceWithVine } from "../../services/risk-control";
import { PGATE_MAX_LATENCY_MS, PGATE_MAX_SLIPPAGE } from "../../config/constants";
import {
  assertMaxOrderClipUsd,
  shouldTriggerReduceOnlyFlatten,
} from "../../config/risk-parameters";
import { passesHighFundingAsymmetryFilter } from "../../v2/services/step2/scoring";
import {
  PreTradeValidationError,
  type HlOrderWire,
  type OrderGrouping,
  type OrderTif,
  type PreTradeValidationInput,
  type TpslSide,
} from "./execution-types";

/** Normalize float to Hyperliquid wire price/size string (max 8 decimals) */
export function floatToWire(value: number): string {
  const rounded = value.toFixed(8);
  if (Math.abs(Number(rounded) - value) >= 1e-12) {
    throw new Error(`floatToWire causes rounding: ${value}`);
  }
  const normalized = Number(rounded);
  return Object.is(normalized, -0) ? "0" : normalized.toString();
}

/** HL perp price — ≤5 sig figs and ≤ (6 − szDecimals) decimal places. */
export function formatHlPerpPrice(price: number, szDecimals: number): number {
  const maxDecimals = Math.max(0, 6 - szDecimals);
  if (price > 100_000) return Math.round(price);
  const sig = Number.parseFloat(Number(price).toPrecision(5));
  return Number(sig.toFixed(maxDecimals));
}

/** HL order size — truncate to szDecimals lot size. */
export function formatHlSize(size: number, szDecimals: number): number {
  const factor = 10 ** szDecimals;
  return Math.floor(size * factor) / factor;
}

/** Bump size (integer lot ticks) until notional meets target with post-round safety floor. */
export function ensureHlMinNotionalSize(
  size: number,
  limitPx: number,
  szDecimals: number,
  targetNotionalUsd = 12,
  safetyFloorUsd = 10.5,
): number {
  const safeLimitPx = Math.max(limitPx, 1);
  const factor = 10 ** szDecimals;
  const minSize = targetNotionalUsd / safeLimitPx;
  let ticks = Math.ceil(Math.max(size, minSize) * factor - 1e-9);
  if (ticks <= 0) ticks = 1;

  const maxTicks = ticks + 10_000;
  while (ticks < maxTicks) {
    const adjusted = ticks / factor;
    if (adjusted * safeLimitPx >= safetyFloorUsd) {
      return adjusted;
    }
    ticks += 1;
  }
  throw new Error(
    `Cannot reach HL min notional safety floor $${safetyFloorUsd} at limitPx=${limitPx}`,
  );
}

/**
 * Pgate + soil resistance gate — blocks new position orders.
 * @theory Kyle (1985) — Kyle's Lambda price-impact prior to venue POST.
 * @theory Almgren & Chriss (2000) — transient impact / optimal execution slippage cap.
 * @see checkSoilResistanceWithVine — cross-venue soil matrix.
 */
export function assertPreTradeValidation(input: PreTradeValidationInput): void {
  const reasons: string[] = [];

  if (input.latencyMs !== undefined && input.latencyMs > PGATE_MAX_LATENCY_MS) {
    reasons.push(`LATENCY_MS=${input.latencyMs}>${PGATE_MAX_LATENCY_MS}`);
  }

  if (
    input.expectedSlippage !== undefined &&
    input.expectedSlippage > PGATE_MAX_SLIPPAGE
  ) {
    reasons.push(
      `EXPECTED_SLIPPAGE=${(input.expectedSlippage * 100).toFixed(4)}%>${PGATE_MAX_SLIPPAGE * 100}%`,
    );
  }

  if (input.foolProof && input.accountBalanceUsd !== undefined) {
    try {
      assertVineShield({
        order: input.foolProof,
        accountBalanceUsd: input.accountBalanceUsd,
      });
    } catch (err) {
      reasons.push(err instanceof Error ? err.message : String(err));
    }
  }

  const soil = checkSoilResistanceWithVine(input);
  if (soil.tripped) reasons.push(...soil.reasons);

  if (
    input.step2HighFundingAsymmetry &&
    !passesHighFundingAsymmetryFilter(input.step2HighFundingAsymmetry)
  ) {
    reasons.push("STEP2_HIGH_FUNDING_ASYMMETRY_GATE");
  }

  if (input.orderNotionalUsd !== undefined) {
    const clipReason = assertMaxOrderClipUsd(input.orderNotionalUsd);
    if (clipReason) reasons.push(clipReason);
  }

  if (
    input.dailyDrawdownPct !== undefined &&
    shouldTriggerReduceOnlyFlatten(input.dailyDrawdownPct)
  ) {
    reasons.push("HARD_STOP_LOSS_PCT→REDUCE_ONLY_FLATTEN");
  }

  if (reasons.length > 0) {
    throw new PreTradeValidationError(
      "Pre-trade validation failed — execution blocked",
      reasons,
    );
  }
}

export function buildLimitOrderWire(args: {
  asset: number;
  isBuy: boolean;
  size: number;
  limitPx: number;
  reduceOnly?: boolean;
  tif?: OrderTif;
  cloid?: string;
}): HlOrderWire {
  const wire: HlOrderWire = {
    a: args.asset,
    b: args.isBuy,
    p: floatToWire(args.limitPx),
    s: floatToWire(args.size),
    r: args.reduceOnly ?? false,
    t: { limit: { tif: args.tif ?? "Gtc" } },
  };
  if (args.cloid) wire.c = args.cloid;
  return wire;
}

/** Market-style entry via IoC limit that crosses the spread */
export function buildMarketOrderWire(args: {
  asset: number;
  isBuy: boolean;
  size: number;
  limitPx: number;
  reduceOnly?: boolean;
  cloid?: string;
}): HlOrderWire {
  return buildLimitOrderWire({ ...args, tif: "Ioc" });
}

export function buildTriggerOrderWire(args: {
  asset: number;
  isBuy: boolean;
  size: number;
  triggerPx: number;
  tpsl: TpslSide;
  isMarket?: boolean;
  reduceOnly?: boolean;
  cloid?: string;
}): HlOrderWire {
  const wire: HlOrderWire = {
    a: args.asset,
    b: args.isBuy,
    p: "0",
    s: floatToWire(args.size),
    r: args.reduceOnly ?? true,
    t: {
      trigger: {
        triggerPx: floatToWire(args.triggerPx),
        isMarket: args.isMarket ?? true,
        tpsl: args.tpsl,
      },
    },
  };
  if (args.cloid) wire.c = args.cloid;
  return wire;
}

export function buildOrderAction(
  orders: HlOrderWire[],
  grouping: OrderGrouping = "na",
): Record<string, unknown> {
  return { type: "order", orders, grouping };
}

export function buildCancelAction(
  cancels: Array<{ asset: number; oid: number }>,
): Record<string, unknown> {
  return {
    type: "cancel",
    cancels: cancels.map((c) => ({ a: c.asset, o: c.oid })),
  };
}

export function buildCancelByCloidAction(
  cancels: Array<{ asset: number; cloid: string }>,
): Record<string, unknown> {
  return {
    type: "cancelByCloid",
    cancels: cancels.map((c) => ({ a: c.asset, cloid: c.cloid })),
  };
}
