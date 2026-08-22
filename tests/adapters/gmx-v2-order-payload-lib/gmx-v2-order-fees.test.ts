import { describe, expect, it } from "vitest";
import {
  __setArbitrumGasGuardForTests,
  DEFAULT_GMX_EXECUTION_FEE_WEI,
  estimateGmxKeeperExecutionFeeWei,
} from "../../../src/services/risk/arbitrum-gas-guard";
import {
  buildGmxV2UnsignedDepositPayload,
  buildGmxV2UnsignedOrderPayload,
  buildGmxV2UnsignedWithdrawPayload,
  clampGmxMaxSlippageBps,
  computeGmxAcceptablePrice,
  DEFAULT_GMX_EXECUTION_FEE_WEI as PAYLOAD_DEFAULT_FEE,
  estimateGmxMinOutputAmount,
  GMX_DEFAULT_REFERRAL_CODE,
  GMX_DEFAULT_UI_FEE_RECEIVER,
  GMX_MAX_SLIPPAGE_BPS,
  GMX_ORDER_TYPE_INDEX,
  GMX_USDC_ARBITRUM,
  GMX_ZERO_ADDRESS,
  GMX_ZERO_REFERRAL_CODE,
  resolveGmxExecutionFeeWei,
  resolveGmxReferralCode,
  resolveGmxUiFeeReceiver,
  toGmxPrice30,
} from "../../../src/services/adapters/gmx-v2-order-payload";
import {
  GMX_REFERRAL_CODE_BYTES32,
  GMX_REFERRAL_CODE_LABEL,
} from "../../../src/config/gmx-revenue";
import { REFERRAL, TREASURY, useGmxOrderPayloadTestHooks } from "./gmx-v2-order-payload-shared";

describe("gmx-v2-order-fees", () => {
  useGmxOrderPayloadTestHooks();

  it("resolveGmxUiFeeReceiver prefers input > opts > env > SSOT treasury", () => {
    process.env.GMX_UI_FEE_RECEIVER = "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee";
    expect(resolveGmxUiFeeReceiver({}, {})).toBe("0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee");
    expect(resolveGmxUiFeeReceiver({ uiFeeReceiver: TREASURY }, {})).toBe(TREASURY);
    expect(resolveGmxUiFeeReceiver({}, { uiFeeReceiver: "0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb" })).toBe(
      "0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
    );
    delete process.env.GMX_UI_FEE_RECEIVER;
    expect(resolveGmxUiFeeReceiver({}, {})).toBe(GMX_DEFAULT_UI_FEE_RECEIVER);
  });

  it("resolveGmxReferralCode prefers input > opts > env > SILVERVINE SSOT", () => {
    expect(resolveGmxReferralCode({ referralCode: REFERRAL }, {})).toBe(REFERRAL);
    expect(resolveGmxReferralCode({}, { referralCode: REFERRAL })).toBe(REFERRAL);
    process.env.GMX_REFERRAL_CODE = REFERRAL;
    expect(resolveGmxReferralCode({}, {})).toBe(REFERRAL);
    delete process.env.GMX_REFERRAL_CODE;
    expect(resolveGmxReferralCode({}, {})).toBe(GMX_DEFAULT_REFERRAL_CODE);
    expect(resolveGmxReferralCode({}, {})).toBe(GMX_REFERRAL_CODE_BYTES32);
    expect(GMX_REFERRAL_CODE_BYTES32).toBe(
      "0x53494c56455256494e4500000000000000000000000000000000000000000000",
    );
    expect(GMX_REFERRAL_CODE_BYTES32).not.toBe(GMX_ZERO_REFERRAL_CODE);
    expect(GMX_REFERRAL_CODE_LABEL).toBe("SILVERVINE");
  });

  it("default CreateOrderParams injects treasury uiFeeReceiver and SILVERVINE referralCode", () => {
    const order = buildGmxV2UnsignedOrderPayload({
      side: "short",
      sizeUsd: 100,
      marketToken: "0x70d95587d40A2caf56bd97485aB3Eec10Bee6336",
      midPriceUsd: 3500,
    });
    expect(order.addresses.uiFeeReceiver).toBe(GMX_DEFAULT_UI_FEE_RECEIVER);
    expect(order.referralCode).toBe(GMX_REFERRAL_CODE_BYTES32);
    expect(order.addresses.market).toBe("0x70d95587d40A2caf56bd97485aB3Eec10Bee6336");
    expect(order.addresses.initialCollateralToken).toBe(GMX_USDC_ARBITRUM);
  });

  it("resolveGmxExecutionFeeWei prefers input > opts > gas guard estimate", () => {
    expect(resolveGmxExecutionFeeWei({}, {})).toBe(DEFAULT_GMX_EXECUTION_FEE_WEI);
    expect(resolveGmxExecutionFeeWei({ executionFeeWei: "2000000000000000" }, {})).toBe(
      "2000000000000000",
    );
    expect(
      resolveGmxExecutionFeeWei({}, { executionFeeWei: "3000000000000000" }),
    ).toBe("3000000000000000");
    __setArbitrumGasGuardForTests({
      l1BaseFeeWei: 1n,
      l1SurchargeWei: 2_000_000_000_000_000n,
      l1SurchargeUsd: 5,
      targetYieldUsd: 10,
      gasYieldRatio: 0.5,
      gasBlocked: false,
      oracleUpdatedAtMs: 0,
      l2BlockTimestampMs: 0,
      oracleLagMs: 0,
      oracleLagDeadlock: false,
      reason: null,
      fetchedAtMs: Date.now(),
    });
    expect(estimateGmxKeeperExecutionFeeWei()).toBe("2000000000000000");
    expect(resolveGmxExecutionFeeWei({}, {})).toBe("2000000000000000");
  });

  it("caps maxSlippageBps at system ceiling for unauthenticated callers", () => {
    expect(clampGmxMaxSlippageBps(500)).toBe(GMX_MAX_SLIPPAGE_BPS);
    expect(clampGmxMaxSlippageBps(30)).toBe(30);
    const order = buildGmxV2UnsignedOrderPayload({
      side: "short",
      sizeUsd: 500,
      marketToken: "0x70d95587d40A2caf56bd97485aB3Eec10Bee6336",
      midPriceUsd: 3500,
      maxSlippageBps: 500,
    });
    expect(computeGmxAcceptablePrice(3500, false, GMX_MAX_SLIPPAGE_BPS, 0)).toBeLessThan(3500);
    expect(order.numbers.acceptablePrice).toBe(
      toGmxPrice30(computeGmxAcceptablePrice(3500, false, GMX_MAX_SLIPPAGE_BPS, 0)),
    );
  });

  it("estimates non-zero minOutputAmount instead of zero placeholder", () => {
    const estimated = estimateGmxMinOutputAmount({
      sizeUsd: 500,
      slippageBps: 30,
      signedImpactBps: 0,
      reduceOnly: false,
    });
    expect(BigInt(estimated)).toBeGreaterThan(0n);
    const order = buildGmxV2UnsignedOrderPayload({
      side: "short",
      sizeUsd: 500,
      marketToken: "0x70d95587d40A2caf56bd97485aB3Eec10Bee6336",
      midPriceUsd: 3500,
    });
    expect(BigInt(order.numbers.minOutputAmount)).toBeGreaterThan(0n);
    expect(order.numbers.minOutputAmount).toBe(estimated);
  });

  it("combines maxSlippageBps with signedImpactBps for acceptablePrice", () => {
    const withImpact = buildGmxV2UnsignedOrderPayload({
      side: "short",
      sizeUsd: 200_000,
      marketToken: "0x70d95587d40A2caf56bd97485aB3Eec10Bee6336",
      midPriceUsd: 3500,
      maxSlippageBps: 30,
      pool: { longTokenUsd: 6_000_000, shortTokenUsd: 2_000_000 },
      skipFailClosedGuards: true,
    });
    const baseline = toGmxPrice30(computeGmxAcceptablePrice(3500, false, 30, 0));
    expect(withImpact.numbers.acceptablePrice).not.toBe(baseline);
    expect(BigInt(withImpact.numbers.acceptablePrice)).toBeGreaterThan(BigInt(baseline));
  });

  it("buildGmxV2UnsignedOrderPayload aligns CreateOrderParams address/number tuple order", () => {
    const increase = buildGmxV2UnsignedOrderPayload(
      {
        side: "short",
        sizeUsd: 500,
        marketToken: "0x70d95587d40A2caf56bd97485aB3Eec10Bee6336",
        midPriceUsd: 3500,
        uiFeeReceiver: TREASURY,
        referralCode: REFERRAL,
      },
      {},
    );
    expect(increase.orderType).toBe(GMX_ORDER_TYPE_INDEX.MarketIncrease);
    expect(increase.addresses).toEqual({
      receiver: GMX_ZERO_ADDRESS,
      cancellationReceiver: GMX_ZERO_ADDRESS,
      callbackContract: GMX_ZERO_ADDRESS,
      uiFeeReceiver: TREASURY,
      market: "0x70d95587d40A2caf56bd97485aB3Eec10Bee6336",
      initialCollateralToken: GMX_USDC_ARBITRUM,
      swapPath: [],
    });
    expect(BigInt(increase.numbers.minOutputAmount)).toBeGreaterThan(0n);
    expect(increase.numbers.initialCollateralDeltaAmount).toBe("500000000");
    expect(increase.numbers.callbackGasLimit).toBe("0");
    expect(increase.referralCode).toBe(REFERRAL);
    expect(increase.numbers.executionFee).toBe(PAYLOAD_DEFAULT_FEE);
    expect(increase.numbers.acceptablePrice).toBe(toGmxPrice30(3489.5));

    const decrease = buildGmxV2UnsignedOrderPayload(
      {
        side: "long",
        sizeUsd: 250,
        reduceOnly: true,
        marketToken: "0x70d95587d40A2caf56bd97485aB3Eec10Bee6336",
        midPriceUsd: 65000,
      },
      { uiFeeReceiver: TREASURY, referralCode: REFERRAL },
    );
    expect(decrease.orderType).toBe(GMX_ORDER_TYPE_INDEX.MarketDecrease);
    expect(decrease.numbers.initialCollateralDeltaAmount).toBe("0");
    expect(decrease.isLong).toBe(true);
    expect(decrease.addresses.uiFeeReceiver).toBe(TREASURY);
    expect(decrease.referralCode).toBe(REFERRAL);
  });

  it("buildGmxV2UnsignedDepositPayload includes uiFeeReceiver and referralCode", () => {
    const deposit = buildGmxV2UnsignedDepositPayload(
      { marketToken: "ETH", sizeUsd: 100, uiFeeReceiver: TREASURY, referralCode: REFERRAL },
      {},
    );
    expect(deposit.action).toBe("deposit");
    expect(deposit.uiFeeReceiver).toBe(TREASURY);
    expect(deposit.referralCode).toBe(REFERRAL);
    expect(deposit.executionFee).toBe(PAYLOAD_DEFAULT_FEE);
    expect(deposit.longTokenAmountUsd).toBe("50.00");
  });

  it("buildGmxV2UnsignedWithdrawPayload aligns CreateWithdrawalParams with fail-closed guards", () => {
    const withdraw = buildGmxV2UnsignedWithdrawPayload(
      {
        marketToken: "0x70d95587d40A2caf56bd97485aB3Eec10Bee6336",
        sizeUsd: 100,
        gmTokenAmount: "500000000000000000",
        uiFeeReceiver: TREASURY,
        referralCode: REFERRAL,
        skipFailClosedGuards: true,
      },
      {},
    );
    expect(withdraw.action).toBe("withdraw");
    expect(withdraw.addresses).toEqual({
      receiver: GMX_ZERO_ADDRESS,
      callbackContract: GMX_ZERO_ADDRESS,
      uiFeeReceiver: TREASURY,
      market: "0x70d95587d40A2caf56bd97485aB3Eec10Bee6336",
      longTokenSwapPath: [],
      shortTokenSwapPath: [],
    });
    expect(withdraw.numbers).toMatchObject({
      marketTokenAmount: "500000000000000000",
      executionFee: PAYLOAD_DEFAULT_FEE,
      callbackGasLimit: "0",
    });
    expect(BigInt(String(withdraw.numbers.minLongTokenAmount))).toBeGreaterThan(0n);
    expect(BigInt(String(withdraw.numbers.minShortTokenAmount))).toBeGreaterThan(0n);
    expect(withdraw.referralCode).toBe(REFERRAL);
    expect(withdraw.shouldUnwrapNativeToken).toBe(false);
    expect(withdraw.gmTokenAmountUsd).toBe("100.00");
  });
});
