/**
 * GMX v2 unsigned order/deposit payload builders — IBaseOrderUtils.CreateOrderParams alignment.
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
import type {
  GmxV2AdapterOptions,
  GmxV2OrderType,
  GmxV2UnsignedOrderPayload,
} from "./gmx-v2-adapter.types";
import {
  assertGmxPayloadFailClosed,
  toGmxPrice30,
  toGmxUsd30,
} from "./gmx-v2-order-payload-guards";

export { DEFAULT_GMX_EXECUTION_FEE_WEI };
export {
  GMX_FLOAT_PRECISION,
  GMX_PAYLOAD_EXECUTION_FEE_TRIP,
  GMX_PAYLOAD_PRICE_IMPACT_TRIP,
  toGmxPrice30,
  toGmxUsd30,
} from "./gmx-v2-order-payload-guards";

export const GMX_ZERO_ADDRESS = "0x0000000000000000000000000000000000000000" as const;
export const GMX_USDC_ARBITRUM = "0xaf88d065e77c8cC2239327C5EDb3A432268e5831" as const;
export const GMX_DEFAULT_UI_FEE_RECEIVER = GMX_UI_FEE_RECEIVER;
export { GMX_UI_FEE_BPS };
export const GMX_ZERO_REFERRAL_CODE =
  "0x0000000000000000000000000000000000000000000000000000000000000000" as const;
export const GMX_DEFAULT_REFERRAL_CODE = GMX_REFERRAL_CODE_BYTES32;
export const GMX_MAX_SLIPPAGE_BPS = 100 as const;
export const GMX_DEFAULT_SLIPPAGE_BPS = 30 as const;
export const GMX_DEFAULT_CALLBACK_GAS_LIMIT = "0" as const;
export const USDC_DECIMALS = 6 as const;

export const GMX_ORDER_TYPE_INDEX: Record<GmxV2OrderType, number> = {
  MarketIncrease: 2,
  LimitIncrease: 3,
  MarketDecrease: 4,
  LimitDecrease: 5,
};

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
  midPriceUsd: number;
  pool?: GmxV2PoolWeights;
  signedImpactBps?: number;
  orderType?: GmxV2OrderType;
  limitOrder?: boolean;
  minOutputAmount?: string;
  initialCollateralDeltaAmount?: string;
  callbackGasLimit?: string;
  receiver?: string;
  skipFailClosedGuards?: boolean;
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

export function estimateGmxMinOutputAmount(input: {
  sizeUsd: number;
  slippageBps: number;
  signedImpactBps: number;
  reduceOnly: boolean;
}): string {
  const adverseBps = input.slippageBps + Math.max(0, input.signedImpactBps);
  const protectionFactor = Math.max(0.0001, 1 - adverseBps / 10_000);
  const minUsd = input.sizeUsd * protectionFactor;
  return String(Math.max(1, Math.floor(minUsd * 10 ** USDC_DECIMALS)));
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
  const orderTypeLabel = resolveGmxOrderType(input);
  const executionFee = resolveGmxExecutionFeeWei(opts, input);
  assertGmxPayloadFailClosed({ ...input, isLong, executionFee });

  return {
    addresses: {
      receiver: input.receiver ?? GMX_ZERO_ADDRESS,
      cancellationReceiver: GMX_ZERO_ADDRESS,
      callbackContract: GMX_ZERO_ADDRESS,
      uiFeeReceiver: resolveGmxUiFeeReceiver(opts, input),
      market: input.marketToken,
      initialCollateralToken: GMX_USDC_ARBITRUM,
      swapPath: [],
    },
    numbers: {
      sizeDeltaUsd: toGmxUsd30(input.sizeUsd),
      initialCollateralDeltaAmount: resolveInitialCollateralDeltaAmount(input),
      triggerPrice: "0",
      acceptablePrice: toGmxPrice30(acceptablePrice),
      executionFee,
      callbackGasLimit: input.callbackGasLimit ?? GMX_DEFAULT_CALLBACK_GAS_LIMIT,
      minOutputAmount: resolveGmxMinOutputAmount(input, slippageBps, signedImpactBps),
      validFromTime: "0",
    },
    orderType: GMX_ORDER_TYPE_INDEX[orderTypeLabel],
    decreasePositionSwapType: 0,
    isLong,
    shouldUnwrapNativeToken: false,
    autoCancel: false,
    referralCode: resolveGmxReferralCode(opts, input),
    dataList: input.clientOrderId ? [input.clientOrderId] : [],
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
