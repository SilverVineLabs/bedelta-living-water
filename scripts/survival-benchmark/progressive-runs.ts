import type { computeLiveBookMetrics } from "../../src/services/exchanges/hyperliquid-adapter";
import {
  AffiliateReinvestingStub,
  CrossChainIngressBridgeStub,
  HyperdashWhaleFollowerStub,
  IcebergShadowOrdersStub,
  PreemptiveGasBiddingStub,
  UsdYieldLendStub,
  ZeroSpreadRebalancerStub,
} from "../../src/services/stubs";
import { COIN, NOTIONAL_USD } from "./survival-benchmark.types";
import { maxDrawdown, sharpeFromDailyReturns } from "./survival-benchmark.utils";
import type { PhaseIsolationsResult } from "./phase-isolations";

export interface ProgressiveRunsInput {
  phases: PhaseIsolationsResult;
  metrics100k: NonNullable<ReturnType<typeof computeLiveBookMetrics>>;
  fullSpecNetApy: number;
  navFs: number;
  fullSpecSlip30d: number;
  fullSpecSlip1mStress: number;
  fullSpecBlockRate: number;
  fullSpecSaasYr: number;
  fsEquity: number[];
  fsDaily: Map<string, number>;
  spanDays: number;
  hours: number;
  meanHourly: number;
}

export interface ProgressiveRunsResult {
  runANetApy: number;
  runANav: number;
  batch1DeltaApy: number;
  batch1ExtraUsd: number;
  lendRes: ReturnType<UsdYieldLendStub["simulate"]>;
  affRes: ReturnType<AffiliateReinvestingStub["simulate"]>;
  shadowRes: ReturnType<IcebergShadowOrdersStub["simulate"]>;
  zsrRes: ReturnType<ZeroSpreadRebalancerStub["simulate"]>;
  shadowSlipSaved: number;
  idleUsdcUsd: number;
  builderCommissionUsd: number;
  affAnnualizedUsd: number;
  gasRes: ReturnType<PreemptiveGasBiddingStub["simulate"]>;
  gasImpactDropPct: number;
  gasSlipSaved: number;
  ingressSol: ReturnType<CrossChainIngressBridgeStub["simulate"]>;
  ingressArb: ReturnType<CrossChainIngressBridgeStub["simulate"]>;
  ingressTvlUsd: number;
  whaleRes: ReturnType<HyperdashWhaleFollowerStub["simulate"]>;
  whaleFundingUsd: number;
  batch2ExtraUsd: number;
  batch2DeltaApy: number;
  runBNetApy: number;
  runBVsBaseApy: number;
  runBTvlAfter: number;
  runCNetApy: number;
  runCVsBaseApy: number;
  runCSlip30d: number;
  runCSlip1m: number;
  runCNav: number;
  runCMdd: number;
  runCSharpe: number;
  runCBlockRate: number;
  runCSaasYr: number;
  runCAffiliateYr: number;
  runCCombinedRevYr: number;
}

export function runProgressiveRuns(
  input: ProgressiveRunsInput,
): ProgressiveRunsResult {
  const {
    phases,
    metrics100k,
    fullSpecNetApy,
    navFs,
    fullSpecSlip30d,
    fullSpecSlip1mStress,
    fullSpecBlockRate,
    fullSpecSaasYr,
    fsEquity,
    fsDaily,
    spanDays,
    hours,
    meanHourly,
  } = input;
  const { baselineFundingUsd, baselineNetApy, market100Iso, market1mIso, full1m } =
    phases;

  const annFactor = (365 * 24) / Math.max(hours, 1);
  const idleUsdcUsd = NOTIONAL_USD * 0.25;
  const lendRes = new UsdYieldLendStub(true).simulate({
    idleUsdcUsd,
    lendApy: 0.042,
    durationHours: hours,
    allocationPct: 1,
  });
  const estVolumeUsd = NOTIONAL_USD * 2 * (hours / (30 * 24));
  const builderCommissionUsd = estVolumeUsd * 0.00025 * 0.15;
  const affRes = new AffiliateReinvestingStub(true).simulate({
    builderCommissionUsd,
    hedgePoolNavUsd: NOTIONAL_USD,
  });
  const shadowRes = new IcebergShadowOrdersStub(true).simulate({
    symbol: COIN,
    side: "ask",
    probeUsd: 250,
    maxProbes: 4,
    levels: [
      {
        price: metrics100k.bestAsk,
        sizeUsd: Math.max(500, metrics100k.askDepthUsd * 0.35),
      },
      { price: metrics100k.bestAsk * 1.0002, sizeUsd: 180 },
      {
        price: metrics100k.bestAsk * 1.0004,
        sizeUsd: Math.max(500, metrics100k.askDepthUsd * 0.25),
      },
      { price: metrics100k.bestAsk * 1.0006, sizeUsd: 220 },
    ],
  });
  const shadowSlipSaved =
    market100Iso.slipUsd * shadowRes.spoofRatio * 0.35;
  const zsrRes = new ZeroSpreadRebalancerStub(true).simulate({
    spotUsd: NOTIONAL_USD * 0.4,
    perpMarginUsd: NOTIONAL_USD * 0.6,
    targetSpotWeight: 0.35,
    legacyTransferBps: 2,
  });
  const batch1ExtraUsd =
    lendRes.interestUsd +
    affRes.reinvestedUsd +
    shadowSlipSaved +
    zsrRes.savedUsd;
  const batch1DeltaApy = (batch1ExtraUsd / NOTIONAL_USD) * annFactor;
  const runANetApy = fullSpecNetApy + batch1DeltaApy;
  const runANav = navFs + batch1ExtraUsd;
  const affAnnualizedUsd =
    affRes.reinvestedUsd * (365 / Math.max(spanDays, 1));

  const gasRes = new PreemptiveGasBiddingStub(true).simulate({
    currentPriorityGwei: 0.8,
    samples: [
      { blockNumber: 100, baseFeeGwei: 12, priorityFeeGwei: 0.4 },
      { blockNumber: 101, baseFeeGwei: 13, priorityFeeGwei: 0.65 },
      { blockNumber: 102, baseFeeGwei: 14.5, priorityFeeGwei: 0.95 },
    ],
  });
  const gasImpactDropPct = gasRes.triggered ? 0.18 : 0.04;
  const gasSlipSaved =
    Math.max(0, market1mIso.slipUsd - full1m.slipUsd) * gasImpactDropPct +
    market100Iso.slipUsd * gasImpactDropPct * 0.05;
  const ingressSol = new CrossChainIngressBridgeStub(true).simulate({
    sourceChain: "SOL",
    amountUsdc: 50_000,
  });
  const ingressArb = new CrossChainIngressBridgeStub(true).simulate({
    sourceChain: "ARB",
    amountUsdc: 50_000,
  });
  const ingressTvlUsd =
    ingressSol.creditedHlUsdc + ingressArb.creditedHlUsdc;
  const whaleRes = new HyperdashWhaleFollowerStub(true).simulate({
    maxHedgeUsd: 50_000,
    mode: "counter",
    signals: [
      { vaultId: "hd-quant-alpha", deltaUsd: 120_000, winRate: 0.62 },
      { vaultId: "hd-quant-beta", deltaUsd: -40_000, winRate: 0.55 },
    ],
  });
  const whaleFundingUsd =
    Math.abs(whaleRes.hedgeDeltaUsd) * meanHourly * hours;
  const batch2ExtraUsd = gasSlipSaved + whaleFundingUsd;
  const batch2DeltaApy = (batch2ExtraUsd / NOTIONAL_USD) * annFactor;
  const runBFundingUsd = baselineFundingUsd + batch1ExtraUsd + batch2ExtraUsd;
  const runBNetApy = (runBFundingUsd / NOTIONAL_USD) * annFactor;
  const runBVsBaseApy = runBNetApy - baselineNetApy;
  const runBTvlAfter = NOTIONAL_USD + ingressTvlUsd;

  const runCExtraUsd = batch1ExtraUsd + batch2ExtraUsd;
  const runCNetApy = fullSpecNetApy + batch1DeltaApy + batch2DeltaApy;
  const runCVsBaseApy = runCNetApy - baselineNetApy;
  const runCSlip30d = fullSpecSlip30d + shadowSlipSaved + gasSlipSaved;
  const runCSlip1m =
    fullSpecSlip1mStress +
    Math.max(0, market1mIso.slipUsd - full1m.slipUsd) * gasImpactDropPct;
  const runCNav = navFs + runCExtraUsd;
  const runCEquity = fsEquity.map(
    (v, i) =>
      v + runCExtraUsd * ((i + 1) / Math.max(fsEquity.length, 1)),
  );
  const runCMdd = maxDrawdown(runCEquity);
  const runCDaily = new Map(fsDaily);
  const lastDay = [...runCDaily.keys()].sort().at(-1);
  if (lastDay) {
    runCDaily.set(lastDay, (runCDaily.get(lastDay) ?? 0) + runCExtraUsd);
  }
  const runCSharpe = sharpeFromDailyReturns(
    [...runCDaily.values()].map((p) => p / NOTIONAL_USD),
  );
  const runCBlockRate = fullSpecBlockRate;
  const runCSaasYr = fullSpecSaasYr;
  const runCAffiliateYr = affAnnualizedUsd;
  const runCCombinedRevYr = runCSaasYr + runCAffiliateYr;

  return {
    runANetApy,
    runANav,
    batch1DeltaApy,
    batch1ExtraUsd,
    lendRes,
    affRes,
    shadowRes,
    zsrRes,
    shadowSlipSaved,
    idleUsdcUsd,
    builderCommissionUsd,
    affAnnualizedUsd,
    gasRes,
    gasImpactDropPct,
    gasSlipSaved,
    ingressSol,
    ingressArb,
    ingressTvlUsd,
    whaleRes,
    whaleFundingUsd,
    batch2ExtraUsd,
    batch2DeltaApy,
    runBNetApy,
    runBVsBaseApy,
    runBTvlAfter,
    runCNetApy,
    runCVsBaseApy,
    runCSlip30d,
    runCSlip1m,
    runCNav,
    runCMdd,
    runCSharpe,
    runCBlockRate,
    runCSaasYr,
    runCAffiliateYr,
    runCCombinedRevYr,
  };
}
