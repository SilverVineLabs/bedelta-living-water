import type { computeLiveBookMetrics } from "../../src/services/exchanges/hyperliquid-adapter";
import type { auditLiveBookSoilResistance } from "../../src/services/check-soil-resistance";
import type { computeSlippageSaved } from "../../src/services/slippage-saved-telemetry";
import type {
  AffiliateReinvestingStub,
  CrossChainIngressBridgeStub,
  HyperdashWhaleFollowerStub,
  IcebergShadowOrdersStub,
  PreemptiveGasBiddingStub,
  UsdYieldLendStub,
  ZeroSpreadRebalancerStub,
} from "../../src/services/stubs";
import type { CrossAssetRotationService } from "../../src/services/cross-asset-rotation";
import type {
  Candle,
  FundingPoint,
  HlAssetCtx,
  RadarTick,
  SensorScores,
} from "./survival-benchmark.types";
import type { PhaseIsolationsResult } from "./phase-isolations";
import type { FullSpecRunsResult } from "./full-spec-runs";

export interface SurvivalReportContext {
  spanDays: number;
  ethMeta: { maxLeverage: number; assetCtx: HlAssetCtx };
  ticks: RadarTick[];
  degraded: RadarTick[];
  hudCounts: Record<string, number>;
  radarSlipSaved: number;
  avgPrimary: number;
  avgSecondary: number;
  avgComposite: number;
  minComposite: number;
  maxComposite: number;
  latest: RadarTick;
  avgS: SensorScores;
  funding: FundingPoint[];
  fundingSol: FundingPoint[];
  fundingBtc: FundingPoint[];
  metrics100k: NonNullable<ReturnType<typeof computeLiveBookMetrics>>;
  metricsStress: ReturnType<typeof computeLiveBookMetrics>;
  soilAudit: ReturnType<typeof auditLiveBookSoilResistance>;
  market100: { slipUsd: number; impactBps: number };
  marketStress: { slipUsd: number; impactBps: number };
  twap100: { slipUsd: number; impactBps: number; soilTrips: number };
  twapStress: { slipUsd: number; impactBps: number; soilTrips: number };
  saved100: number;
  savedStress: number;
  meanHourly: number;
  netApy: number;
  candles1m: Candle[];
  candles1h: Candle[];
  binance1h: Map<number, number>;
  c1mSpanH: number;
  vol1m: number;
  vol1h: number;
  mddFund: number;
  mddEng: number;
  sharpeFund: number;
  sharpeEng: number;
  navFund: number;
  navEng: number;
  baselineNetApy: number;
  afNetApy: number;
  deltaApy: number;
  baselineFundingUsd: number;
  afFundingUsd: number;
  afExtraSubsidyUsd: number;
  navBase: number;
  navAf: number;
  mddBase: number;
  mddAf: number;
  phase3SlipSaved: number;
  deltaSlipSavedP3: number;
  blackSwanHours: number;
  yieldSpikeMaxUsd: number;
  avgSpikeUsd: number;
  yieldSpikeSumUsd: number;
  basePaths: number;
  fullPaths: number;
  slipSavedBase100: number;
  slipSavedFull100: number;
  base1m: PhaseIsolationsResult["base1m"];
  full1m: PhaseIsolationsResult["full1m"];
  impactDrop1mPct: number;
  costDrop1mUsd: number;
  slipSavedBase1m: number;
  slipSavedFull1m: number;
  deltaSlip100: number;
  deltaSlip1m: number;
  vaasOrders: number;
  vaasBlocked: number;
  vaasBaselineBlockRate: number;
  vaasBlockRate: number;
  vaasBlockRateDelta: number;
  vaasSoilBlocks: number;
  vaasRootBlocks: number;
  vaasBlockedNotional: number;
  vaasSaasFeeUsd: number;
  vaasSaasFeeAnnualized: number;
  phase5Base: PhaseIsolationsResult["phase5Base"];
  phase5Active: PhaseIsolationsResult["phase5Active"];
  phase5DeltaApy: number;
  phase5ExtraFunding: number;
  phase5SlipCost: number;
  phase5NetExtra: number;
  rotationOn: CrossAssetRotationService;
  fullSpecNetApy: number;
  fullSpecVsBaseApy: number;
  fullSpecExtraFunding: number;
  fullSpecSlip1mStress: number;
  fullSpecSlip30d: number;
  telemetry: ReturnType<typeof computeSlippageSaved>;
  fullSpecSharpe: number;
  fullSpecMdd: number;
  navFs: number;
  fullSpecBlockRate: number;
  fullSpecSaasYr: number;
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
  runCNetApy: number;
  runCVsBaseApy: number;
  runCSlip30d: number;
  runCSlip1m: number;
  runCNav: number;
  runCSharpe: number;
  runCMdd: number;
  runCBlockRate: number;
  runCSaasYr: number;
  runCAffiliateYr: number;
  runCCombinedRevYr: number;
}

export function buildReportContext(input: {
  spanDays: number;
  ethMeta: { maxLeverage: number; assetCtx: HlAssetCtx };
  ticks: RadarTick[];
  degraded: RadarTick[];
  hudCounts: Record<string, number>;
  radarSlipSaved: number;
  avgPrimary: number;
  avgSecondary: number;
  avgComposite: number;
  minComposite: number;
  maxComposite: number;
  latest: RadarTick;
  avgS: SensorScores;
  funding: FundingPoint[];
  fundingSol: FundingPoint[];
  fundingBtc: FundingPoint[];
  metrics100k: NonNullable<ReturnType<typeof computeLiveBookMetrics>>;
  metricsStress: ReturnType<typeof computeLiveBookMetrics>;
  soilAudit: ReturnType<typeof auditLiveBookSoilResistance>;
  market100: { slipUsd: number; impactBps: number };
  marketStress: { slipUsd: number; impactBps: number };
  twap100: { slipUsd: number; impactBps: number; soilTrips: number };
  twapStress: { slipUsd: number; impactBps: number; soilTrips: number };
  saved100: number;
  savedStress: number;
  meanHourly: number;
  netApy: number;
  candles1m: Candle[];
  candles1h: Candle[];
  binance1h: Map<number, number>;
  c1mSpanH: number;
  vol1m: number;
  vol1h: number;
  mddFund: number;
  mddEng: number;
  sharpeFund: number;
  sharpeEng: number;
  navFund: number;
  navEng: number;
  phases: PhaseIsolationsResult;
  fullSpec: FullSpecRunsResult;
}): SurvivalReportContext {
  const { phases, fullSpec, ...core } = input;
  return {
    ...core,
    ...phases,
    ...fullSpec,
    vaasBlocked: phases.vaasBlocked,
    rotationOn: phases.rotationOn,
    phase5Base: phases.phase5Base,
    phase5Active: phases.phase5Active,
    phase5DeltaApy: phases.phase5DeltaApy,
    phase5ExtraFunding: phases.phase5ExtraFunding,
    phase5SlipCost: phases.phase5SlipCost,
    phase5NetExtra: phases.phase5NetExtra,
  };
}
