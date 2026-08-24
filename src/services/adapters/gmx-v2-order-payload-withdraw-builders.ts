/**
 * GMX v2 unsigned withdraw payload builder.
 */

import type { GmxV2AdapterOptions } from "./gmx-v2-adapter.types";
import { assertGmxPayloadFailClosed } from "./gmx-v2-order-payload-guards";
import {
  GMX_DEFAULT_CALLBACK_GAS_LIMIT,
  GMX_ZERO_ADDRESS,
} from "./gmx-v2-order-payload-constants";
import {
  clampGmxMaxSlippageBps,
  estimateGmxMinOutputAmount,
  resolveGmxExecutionFeeWei,
  resolveGmxReferralCode,
  resolveGmxUiFeeReceiver,
} from "./gmx-v2-order-payload-fees";
import type { GmxV2BuildWithdrawPayloadInput } from "./gmx-v2-order-payload.types";
import {
  resolveGmxMarketTokenAmount,
  resolveWithdrawSignedImpactBps,
} from "./gmx-v2-order-payload-builder-helpers";

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
