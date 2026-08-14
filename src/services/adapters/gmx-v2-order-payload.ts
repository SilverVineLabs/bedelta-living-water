/**
 * GMX v2 unsigned order/deposit payload builders — uiFeeReceiver + referralCode.
 */

import {
  GMX_REFERRAL_CODE_BYTES32,
  GMX_UI_FEE_BPS,
  GMX_UI_FEE_RECEIVER,
} from "../../config/gmx-revenue";
import {
  DEFAULT_GMX_EXECUTION_FEE_WEI,
  estimateGmxKeeperExecutionFeeWei,
} from "../risk/arbitrum-gas-guard";
import {
  estimatePreliminaryImpact,
  type GmxV2PoolWeights,
} from "../yield/gmx-v2-price-impact";
import type { ArbitrumHedgeSide } from "./arbitrum-adapter";
import type { GmxV2AdapterOptions, GmxV2OrderType, GmxV2UnsignedOrderPayload } from "./gmx-v2-adapter.types";

export { DEFAULT_GMX_EXECUTION_FEE_WEI };

export const GMX_ZERO_ADDRESS = "0x0000000000000000000000000000000000000000" as const;
/** Live treasury — re-exported from gmx-revenue SSOT. */
export const GMX_DEFAULT_UI_FEE_RECEIVER = GMX_UI_FEE_RECEIVER;
export { GMX_UI_FEE_BPS };
export const GMX_ZERO_REFERRAL_CODE =
  "0x0000000000000000000000000000000000000000000000000000000000000000" as const;
/** Registered SILVERVINE referral — re-exported from gmx-revenue SSOT. */
export const GMX_DEFAULT_REFERRAL_CODE = GMX_REFERRAL_CODE_BYTES32;
/** System-wide slippage ceiling — unauthenticated callers cannot exceed. */
export const GMX_MAX_SLIPPAGE_BPS = 100 as const;
export const GMX_DEFAULT_SLIPPAGE_BPS = 30 as const;
export const GMX_DEFAULT_CALLBACK_GAS_LIMIT = "0" as const;
export const USDC_DECIMALS = 6 as const;

export interface GmxV2OrderFeeConfig {
  uiFeeReceiver?: string;
  referralCode?: string;
  executionFeeWei?: string;
}

export interface GmxV2BuildUnsignedOrderInput extends GmxV2OrderFeeConfig {
  side: ArbitrumHedgeSide;
  sizeUsd: number;
  reduceOnly?: boolean;
  maxSlippageBps?: number;
  clientOrderId?: string;
  marketToken: string;
  /** Live index mid — required; no hardcoded symbol fallback. */
  midPriceUsd: number;
  pool?: GmxV2PoolWeights;
  signedImpactBps?: number;
  orderType?: GmxV2OrderType;
  limitOrder?: boolean;
  minOutputAmount?: string;
  initialCollateralDeltaAmount?: string;
  callbackGasLimit?: string;
}

export interface GmxV2BuildDepositPayloadInput extends GmxV2OrderFeeConfig {
  marketToken: string;
  sizeUsd: number;
  collateralToken?: string;
  receiver?: string;
}

function readEnv(key: string): string | undefined {
  const raw = typeof process !== "undefined" ? process.env?.[key] : undefined;
  const trimmed = raw?.trim();
  return trimmed || undefined;
}

export function resolveGmxUiFeeReceiver(
  opts: GmxV2AdapterOptions = {},
  input: GmxV2OrderFeeConfig = {},
): string {
  return (
    input.uiFeeReceiver?.trim() ||
    opts.uiFeeReceiver?.trim() ||
    readEnv("GMX_UI_FEE_RECEIVER") ||
    GMX_DEFAULT_UI_FEE_RECEIVER
  );
}

export function resolveGmxReferralCode(
  opts: GmxV2AdapterOptions = {},
  input: GmxV2OrderFeeConfig = {},
): string {
  return (
    input.referralCode?.trim() ||
    opts.referralCode?.trim() ||
    readEnv("GMX_REFERRAL_CODE") ||
    GMX_DEFAULT_REFERRAL_CODE
  );
}

export function resolveGmxExecutionFeeWei(
  opts: GmxV2AdapterOptions = {},
  input: GmxV2OrderFeeConfig = {},
): string {
  const explicit = input.executionFeeWei?.trim() || opts.executionFeeWei?.trim();
  return explicit || estimateGmxKeeperExecutionFeeWei();
}

export function clampGmxMaxSlippageBps(requested?: number): number {
  const raw = requested ?? GMX_DEFAULT_SLIPPAGE_BPS;
  if (!Number.isFinite(raw) || raw < 0) return GMX_DEFAULT_SLIPPAGE_BPS;
  return Math.min(raw, GMX_MAX_SLIPPAGE_BPS);
}

/** Non-zero min-output floor from size + slippage + adverse impact bps. */
export function estimateGmxMinOutputAmount(input: {
  sizeUsd: number;
  slippageBps: number;
  signedImpactBps: number;
  reduceOnly: boolean;
}): string {
  const adverseBps = input.slippageBps + Math.max(0, input.signedImpactBps);
  const protectionFactor = Math.max(0.0001, 1 - adverseBps / 10_000);
  const minUsd = input.sizeUsd * protectionFactor;
  const atomic = Math.max(1, Math.floor(minUsd * 10 ** USDC_DECIMALS));
  return String(atomic);
}

export function resolveGmxMinOutputAmount(
  input: GmxV2BuildUnsignedOrderInput,
  slippageBps: number,
  signedImpactBps: number,
): string {
  const estimated = estimateGmxMinOutputAmount({
    sizeUsd: input.sizeUsd,
    slippageBps,
    signedImpactBps,
    reduceOnly: input.reduceOnly ?? false,
  });
  if (input.minOutputAmount === undefined) return estimated;
  const requested = BigInt(input.minOutputAmount);
  const floor = BigInt(estimated);
  return (requested > floor ? requested : floor).toString();
}

function requireMidPriceUsd(midPriceUsd: number): number {
  if (!Number.isFinite(midPriceUsd) || midPriceUsd <= 0) {
    throw new Error("GMX order payload requires finite midPriceUsd > 0");
  }
  return midPriceUsd;
}

function resolveSignedImpactBps(input: GmxV2BuildUnsignedOrderInput, isLong: boolean): number {
  if (input.signedImpactBps !== undefined) return input.signedImpactBps;
  if (!input.pool) return 0;
  return estimatePreliminaryImpact({
    orderSizeUsd: input.sizeUsd,
    isLong,
    pool: input.pool,
  }).signedImpactBps;
}

export function computeGmxAcceptablePrice(
  midPriceUsd: number,
  isLong: boolean,
  slippageBps: number,
  signedImpactBps: number,
): number {
  const totalBps = slippageBps + signedImpactBps;
  const factor = totalBps / 10_000;
  return isLong ? midPriceUsd * (1 + factor) : midPriceUsd * (1 - factor);
}

export function resolveGmxOrderType(input: GmxV2BuildUnsignedOrderInput): GmxV2OrderType {
  if (input.orderType) return input.orderType;
  const limit = input.limitOrder ?? false;
  if (input.reduceOnly) return limit ? "LimitDecrease" : "MarketDecrease";
  return limit ? "LimitIncrease" : "MarketIncrease";
}

function resolveInitialCollateralDeltaAmount(input: GmxV2BuildUnsignedOrderInput): string {
  if (input.initialCollateralDeltaAmount !== undefined) return input.initialCollateralDeltaAmount;
  if (input.reduceOnly) return "0";
  return String(Math.round(input.sizeUsd * 10 ** USDC_DECIMALS));
}

export function buildGmxV2UnsignedOrderPayload(
  input: GmxV2BuildUnsignedOrderInput,
  opts: GmxV2AdapterOptions = {},
): GmxV2UnsignedOrderPayload {
  const slippageBps = clampGmxMaxSlippageBps(input.maxSlippageBps);
  const isLong = input.side === "long";
  const px = requireMidPriceUsd(input.midPriceUsd);
  const signedImpactBps = resolveSignedImpactBps(input, isLong);
  const acceptablePrice = computeGmxAcceptablePrice(px, isLong, slippageBps, signedImpactBps);
  const orderType = resolveGmxOrderType(input);
  const minOutputAmount = resolveGmxMinOutputAmount(input, slippageBps, signedImpactBps);

  return {
    action: input.reduceOnly ? "decrease" : "increase",
    orderType,
    marketToken: input.marketToken,
    collateralToken: "USDC",
    isLong,
    sizeDeltaUsd: input.sizeUsd.toFixed(2),
    acceptablePrice: acceptablePrice.toFixed(4),
    executionFee: resolveGmxExecutionFeeWei(opts, input),
    minOutputAmount,
    initialCollateralDeltaAmount: resolveInitialCollateralDeltaAmount(input),
    callbackGasLimit: input.callbackGasLimit ?? GMX_DEFAULT_CALLBACK_GAS_LIMIT,
    reduceOnly: input.reduceOnly ?? false,
    clientOrderId: input.clientOrderId,
    slippageBps,
    uiFeeReceiver: resolveGmxUiFeeReceiver(opts, input),
    referralCode: resolveGmxReferralCode(opts, input),
  };
}

export function buildGmxV2UnsignedDepositPayload(
  input: GmxV2BuildDepositPayloadInput,
  opts: GmxV2AdapterOptions = {},
): Record<string, unknown> {
  const half = (input.sizeUsd / 2).toFixed(2);
  return {
    action: "deposit",
    marketToken: input.marketToken,
    collateralToken: input.collateralToken ?? "USDC",
    longTokenAmountUsd: half,
    shortTokenAmountUsd: half,
    executionFee: resolveGmxExecutionFeeWei(opts, input),
    receiver: input.receiver ?? GMX_ZERO_ADDRESS,
    uiFeeReceiver: resolveGmxUiFeeReceiver(opts, input),
    referralCode: resolveGmxReferralCode(opts, input),
  };
}
