/**
 * GMX v2 unsigned order/deposit payload builders — IBaseOrderUtils.CreateOrderParams alignment.
 */

import { estimatePreliminaryImpact } from "../yield/gmx-v2-price-impact";
import type {
  GmxV2AdapterOptions,
  GmxV2OrderType,
  GmxV2UnsignedOrderPayload,
} from "./gmx-v2-adapter.types";
import { assertGmxPayloadFailClosed, toGmxPrice30, toGmxUsd30 } from "./gmx-v2-order-payload-guards";
import {
  GMX_DEFAULT_CALLBACK_GAS_LIMIT,
  GMX_USDC_ARBITRUM,
  GMX_ZERO_ADDRESS,
  USDC_DECIMALS,
} from "./gmx-v2-order-payload-constants";

export {
  DEFAULT_GMX_EXECUTION_FEE_WEI,
  GMX_DEFAULT_REFERRAL_CODE,
  GMX_DEFAULT_UI_FEE_RECEIVER,
  GMX_FLOAT_PRECISION,
  GMX_MAX_SLIPPAGE_BPS,
  GMX_PAYLOAD_EXECUTION_FEE_TRIP,
  GMX_PAYLOAD_PRICE_IMPACT_TRIP,
  GMX_UI_FEE_BPS,
  GMX_USDC_ARBITRUM,
  GMX_ZERO_ADDRESS,
  GMX_ZERO_REFERRAL_CODE,
  toGmxPrice30,
  toGmxUsd30,
  USDC_DECIMALS,
} from "./gmx-v2-order-payload-constants";

export {
  clampGmxMaxSlippageBps,
  estimateGmxMinOutputAmount,
  resolveGmxExecutionFeeWei,
  resolveGmxMinOutputAmount,
  resolveGmxReferralCode,
  resolveGmxUiFeeReceiver,
} from "./gmx-v2-order-payload-fees";

export {
  GMX_ORDER_TYPE_INDEX,
  type GmxV2BuildDepositPayloadInput,
  type GmxV2BuildUnsignedOrderInput,
  type GmxV2BuildWithdrawPayloadInput,
  type GmxV2OrderFeeConfig,
} from "./gmx-v2-order-payload.types";

import {
  clampGmxMaxSlippageBps,
  estimateGmxMinOutputAmount,
  resolveGmxExecutionFeeWei,
  resolveGmxMinOutputAmount,
  resolveGmxReferralCode,
  resolveGmxUiFeeReceiver,
} from "./gmx-v2-order-payload-fees";
import {
  GMX_ORDER_TYPE_INDEX,
  type GmxV2BuildDepositPayloadInput,
  type GmxV2BuildUnsignedOrderInput,
  type GmxV2BuildWithdrawPayloadInput,
} from "./gmx-v2-order-payload.types";

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

function toGmxGmToken18(tokens: number): string {
  if (!Number.isFinite(tokens) || tokens < 0) {
    throw new Error("GMX withdraw payload requires finite gm token amount >= 0");
  }
  const [whole, frac = ""] = tokens.toFixed(6).split(".");
  const micro = BigInt(whole + (frac + "000000").slice(0, 6));
  return (micro * 10n ** 12n).toString();
}

function resolveGmxMarketTokenAmount(input: GmxV2BuildWithdrawPayloadInput): string {
  if (input.gmTokenAmount !== undefined) return input.gmTokenAmount;
  const gmPriceUsd = input.gmPriceUsd;
  if (!gmPriceUsd || !Number.isFinite(gmPriceUsd) || gmPriceUsd <= 0) {
    return toGmxGmToken18(input.sizeUsd);
  }
  return toGmxGmToken18(input.sizeUsd / gmPriceUsd);
}

function resolveWithdrawSignedImpactBps(input: GmxV2BuildWithdrawPayloadInput): number {
  if (input.signedImpactBps !== undefined) return input.signedImpactBps;
  if (!input.pool) return 0;
  return estimatePreliminaryImpact({
    orderSizeUsd: input.sizeUsd,
    isLong: false,
    pool: input.pool,
  }).signedImpactBps;
}

export function buildGmxV2UnsignedWithdrawPayload(
  input: GmxV2BuildWithdrawPayloadInput,
  opts: GmxV2AdapterOptions = {},
): Record<string, unknown> {
  const slippageBps = clampGmxMaxSlippageBps(input.maxSlippageBps);
  const signedImpactBps = resolveWithdrawSignedImpactBps(input);
  const executionFee = resolveGmxExecutionFeeWei(opts, input);
  assertGmxPayloadFailClosed({
    ...input,
    isLong: false,
    executionFee,
  });
  const halfUsd = input.sizeUsd / 2;
  const minHalfUsd = estimateGmxMinOutputAmount({
    sizeUsd: halfUsd,
    slippageBps,
    signedImpactBps,
    reduceOnly: true,
  });
  const marketTokenAmount = resolveGmxMarketTokenAmount(input);

  return {
    action: "withdraw",
    addresses: {
      receiver: input.receiver ?? GMX_ZERO_ADDRESS,
      callbackContract: GMX_ZERO_ADDRESS,
      uiFeeReceiver: resolveGmxUiFeeReceiver(opts, input),
      market: input.marketToken,
      longTokenSwapPath: [],
      shortTokenSwapPath: [],
    },
    numbers: {
      marketTokenAmount,
      minLongTokenAmount: minHalfUsd,
      minShortTokenAmount: minHalfUsd,
      executionFee,
      callbackGasLimit: input.callbackGasLimit ?? GMX_DEFAULT_CALLBACK_GAS_LIMIT,
    },
    shouldUnwrapNativeToken: false,
    referralCode: resolveGmxReferralCode(opts, input),
    gmTokenAmountUsd: input.sizeUsd.toFixed(2),
    longTokenAmountUsd: halfUsd.toFixed(2),
    shortTokenAmountUsd: halfUsd.toFixed(2),
  };
}
