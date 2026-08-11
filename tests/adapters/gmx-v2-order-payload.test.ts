import { afterEach, describe, expect, it } from "vitest";
import {
  __resetArbitrumGasGuardForTests,
  __setArbitrumGasGuardForTests,
  DEFAULT_GMX_EXECUTION_FEE_WEI,
  estimateGmxKeeperExecutionFeeWei,
} from "../../src/services/risk/arbitrum-gas-guard";
import {
  buildGmxV2UnsignedDepositPayload,
  buildGmxV2UnsignedOrderPayload,
  computeGmxAcceptablePrice,
  DEFAULT_GMX_EXECUTION_FEE_WEI as PAYLOAD_DEFAULT_FEE,
  GMX_DEFAULT_UI_FEE_RECEIVER,
  GMX_ZERO_ADDRESS,
  GMX_ZERO_REFERRAL_CODE,
  resolveGmxExecutionFeeWei,
  resolveGmxReferralCode,
  resolveGmxUiFeeReceiver,
} from "../../src/services/adapters/gmx-v2-order-payload";

const TREASURY = "0x1111111111111111111111111111111111111111";
const REFERRAL =
  "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";

describe("gmx-v2-order-payload", () => {
  const prevUiFee = process.env.GMX_UI_FEE_RECEIVER;

  afterEach(() => {
    if (prevUiFee === undefined) delete process.env.GMX_UI_FEE_RECEIVER;
    else process.env.GMX_UI_FEE_RECEIVER = prevUiFee;
    __resetArbitrumGasGuardForTests();
  });

  it("resolveGmxUiFeeReceiver prefers input > opts > env > zero", () => {
    process.env.GMX_UI_FEE_RECEIVER = "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee";
    expect(resolveGmxUiFeeReceiver({}, {})).toBe("0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee");
    expect(resolveGmxUiFeeReceiver({ uiFeeReceiver: TREASURY }, {})).toBe(TREASURY);
    expect(resolveGmxUiFeeReceiver({}, { uiFeeReceiver: "0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb" })).toBe(
      "0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
    );
    delete process.env.GMX_UI_FEE_RECEIVER;
    expect(resolveGmxUiFeeReceiver({}, {})).toBe(GMX_DEFAULT_UI_FEE_RECEIVER);
  });

  it("resolveGmxReferralCode prefers input > opts > zero bytes32", () => {
    expect(resolveGmxReferralCode({ referralCode: REFERRAL }, {})).toBe(REFERRAL);
    expect(resolveGmxReferralCode({}, { referralCode: REFERRAL })).toBe(REFERRAL);
    expect(resolveGmxReferralCode({}, {})).toBe(GMX_ZERO_REFERRAL_CODE);
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

  it("requires finite midPriceUsd > 0", () => {
    expect(() =>
      buildGmxV2UnsignedOrderPayload({
        side: "long",
        sizeUsd: 100,
        marketToken: "ETH",
        midPriceUsd: 0,
      }),
    ).toThrow(/midPriceUsd/);
  });

  it("combines maxSlippageBps with signedImpactBps for acceptablePrice", () => {
    const withImpact = buildGmxV2UnsignedOrderPayload({
      side: "short",
      sizeUsd: 200_000,
      marketToken: "ETH",
      midPriceUsd: 3500,
      maxSlippageBps: 30,
      pool: { longTokenUsd: 6_000_000, shortTokenUsd: 2_000_000 },
    });
    const baseline = computeGmxAcceptablePrice(3500, false, 30, 0);
    expect(Number(withImpact.acceptablePrice)).not.toBe(baseline);
    expect(Number(withImpact.acceptablePrice)).toBeGreaterThan(baseline);
  });

  it("buildGmxV2UnsignedOrderPayload embeds fee fields on increase/decrease", () => {
    const increase = buildGmxV2UnsignedOrderPayload(
      {
        side: "short",
        sizeUsd: 500,
        marketToken: "ETH",
        midPriceUsd: 3500,
        uiFeeReceiver: TREASURY,
        referralCode: REFERRAL,
      },
      {},
    );
    expect(increase.action).toBe("increase");
    expect(increase.orderType).toBe("MarketIncrease");
    expect(increase.minOutputAmount).toBe("0");
    expect(increase.initialCollateralDeltaAmount).toBe("500000000");
    expect(increase.callbackGasLimit).toBe("0");
    expect(increase.uiFeeReceiver).toBe(TREASURY);
    expect(increase.referralCode).toBe(REFERRAL);
    expect(increase.executionFee).toBe(PAYLOAD_DEFAULT_FEE);
    expect(increase.acceptablePrice).toBe("3489.5000");

    const decrease = buildGmxV2UnsignedOrderPayload(
      {
        side: "long",
        sizeUsd: 250,
        reduceOnly: true,
        marketToken: "BTC",
        midPriceUsd: 65000,
      },
      { uiFeeReceiver: TREASURY, referralCode: REFERRAL },
    );
    expect(decrease.action).toBe("decrease");
    expect(decrease.orderType).toBe("MarketDecrease");
    expect(decrease.initialCollateralDeltaAmount).toBe("0");
    expect(decrease.reduceOnly).toBe(true);
    expect(decrease.uiFeeReceiver).toBe(TREASURY);
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
});
