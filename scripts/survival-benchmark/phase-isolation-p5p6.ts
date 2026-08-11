import { CrossAssetRotationService } from "../../src/services/cross-asset-rotation";
import {
  MAX_SLIPPAGE,
  MIN_DEPTH_USD,
  RiskLimitExceeded,
  checkSoilResistance,
} from "../../src/services/risk-control";
import { enforceSantenmokuGuard } from "../../src/sdk/risk-sdk";
import type { computeLiveBookMetrics } from "../../src/services/exchanges/hyperliquid-adapter";
import {
  COIN,
  NOTIONAL_USD,
  STRESS_NOTIONAL_USD,
  VAAS_LICENSE_BPS,
  type FundingPoint,
  type RadarTick,
} from "./survival-benchmark.types";

export function runPhase5And6(input: {
  funding: FundingPoint[];
  fundingSol: FundingPoint[];
  fundingBtc: FundingPoint[];
  ticks: RadarTick[];
  metrics100k: NonNullable<ReturnType<typeof computeLiveBookMetrics>>;
  spanDays: number;
}) {
  const { funding, fundingSol, fundingBtc, ticks, metrics100k, spanDays } =
    input;

  let vaasOrders = 0;
  let vaasBlocked = 0;
  let vaasBlockedNotional = 0;
  let vaasRootBlocks = 0;
  let vaasSoilBlocks = 0;
  const vaultBalance = NOTIONAL_USD;
  for (const tick of ticks) {
    vaasOrders += 1;
    const toxic = tick.degraded;
    const orderNotional = toxic ? STRESS_NOTIONAL_USD * 0.05 : NOTIONAL_USD * 0.02;
    const estimatedLossUsd = toxic
      ? vaultBalance * 0.05
      : vaultBalance * 0.005;
    const soil = toxic
      ? {
          hlSpot: metrics100k.bestBid,
          hlPerp: metrics100k.bestAsk,
          dydxPerp: metrics100k.midPx * (1 + MAX_SLIPPAGE * 2),
          depthUsd: MIN_DEPTH_USD * 0.2,
          orderSizeUsd: orderNotional,
          accountBalanceUsd: vaultBalance,
        }
      : {
          hlSpot: metrics100k.bestBid,
          hlPerp: metrics100k.bestAsk,
          dydxPerp: metrics100k.midPx,
          depthUsd: metrics100k.depthUsd,
          orderSizeUsd: orderNotional,
          accountBalanceUsd: vaultBalance,
        };

    let blocked = false;
    let soilBlocked = false;
    let rootBlocked = false;
    try {
      const guard = enforceSantenmokuGuard({
        symbol: COIN,
        estimatedLossUsd,
        accountBalanceUsd: vaultBalance,
        soil,
      });
      if (guard.soil && !guard.soil.ok) {
        blocked = true;
        soilBlocked = true;
      }
    } catch (err) {
      if (err instanceof RiskLimitExceeded) {
        blocked = true;
        rootBlocked = true;
        const soilOnly = checkSoilResistance({ symbol: COIN, ...soil });
        if (!soilOnly.ok) soilBlocked = true;
      } else {
        throw err;
      }
    }
    if (blocked) {
      vaasBlocked += 1;
      vaasBlockedNotional += orderNotional;
      if (soilBlocked) vaasSoilBlocks += 1;
      if (rootBlocked) vaasRootBlocks += 1;
    }
  }
  const vaasBlockRate = vaasOrders > 0 ? vaasBlocked / vaasOrders : 0;
  const vaasBaselineBlockRate = 0;
  const vaasBlockRateDelta = vaasBlockRate - vaasBaselineBlockRate;
  const vaasSaasFeeUsd =
    (vaasBlockedNotional * VAAS_LICENSE_BPS) / 10_000;
  const vaasSaasFeeAnnualized =
    vaasSaasFeeUsd * (365 / Math.max(spanDays, 1));

  const rotationSeries = {
    ETH: funding.map((f) => ({
      time: f.time,
      hourlyRate: Number(f.fundingRate),
    })),
    SOL: fundingSol.map((f) => ({
      time: f.time,
      hourlyRate: Number(f.fundingRate),
    })),
    BTC: fundingBtc.map((f) => ({
      time: f.time,
      hourlyRate: Number(f.fundingRate),
    })),
  };
  const rotationOff = new CrossAssetRotationService(false);
  const rotationOn = new CrossAssetRotationService(true);
  const phase5Base = rotationOff.simulate({
    notionalUsd: NOTIONAL_USD,
    series: rotationSeries,
  });
  const phase5Active = rotationOn.simulate({
    notionalUsd: NOTIONAL_USD,
    series: rotationSeries,
  });

  return {
    vaasOrders,
    vaasBlocked,
    vaasBlockedNotional,
    vaasRootBlocks,
    vaasSoilBlocks,
    vaasBlockRate,
    vaasBaselineBlockRate,
    vaasBlockRateDelta,
    vaasSaasFeeUsd,
    vaasSaasFeeAnnualized,
    phase5Base,
    phase5Active,
    phase5DeltaApy: phase5Active.pureDeltaApy,
    phase5ExtraFunding:
      phase5Active.fundingPnlUsd - phase5Base.fundingPnlUsd,
    phase5SlipCost: phase5Active.rotationSlipUsd,
    phase5NetExtra: phase5Active.netPnlUsd - phase5Base.netPnlUsd,
    rotationOn,
  };
}
