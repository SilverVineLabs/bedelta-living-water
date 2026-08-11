import {
  TWAP_PATH_SLOT_COUNT,
  TwapEngineV2Full30,
  TwapEngineV2Stub,
} from "../../src/services/execution/twap-engine-v2";
import type { HlL2BookResponse } from "../../src/services/exchanges/hyperliquid-adapter";
import { computeLiveBookMetrics } from "../../src/services/exchanges/hyperliquid-adapter";
import { AntiFragileYieldService } from "../../src/services/anti-fragile-yield";
import {
  COIN,
  NOTIONAL_USD,
  STRESS_NOTIONAL_USD,
  type FundingPoint,
  type RadarTick,
} from "./survival-benchmark.types";
import {
  TWAP_PATH_SLOT_COUNT as TWAP_SLOTS,
  twapShortImpact,
  walkBook,
} from "./book-simulation";
import { maxDrawdown } from "./survival-benchmark.utils";
import { runPhase5And6 } from "./phase-isolation-p5p6";

export interface PhaseIsolationsInput {
  funding: FundingPoint[];
  fundingSol: FundingPoint[];
  fundingBtc: FundingPoint[];
  ticks: RadarTick[];
  book: HlL2BookResponse;
  metrics100k: NonNullable<ReturnType<typeof computeLiveBookMetrics>>;
  radarSlipSaved: number;
  spanDays: number;
}

export type PhaseIsolationsResult = ReturnType<typeof runPhaseIsolations>;

export function runPhaseIsolations(input: PhaseIsolationsInput) {
  const {
    funding,
    fundingSol,
    fundingBtc,
    ticks,
    book,
    metrics100k,
    radarSlipSaved,
    spanDays,
  } = input;

  const afOff = new AntiFragileYieldService(false);
  const afOn = new AntiFragileYieldService(true);
  void afOff;
  let baselineFundingUsd = 0;
  let afFundingUsd = 0;
  let afExtraSubsidyUsd = 0;
  let blackSwanHours = 0;
  let yieldSpikeMaxUsd = 0;
  let yieldSpikeSumUsd = 0;
  const afEquity: number[] = [];
  const baselineEquity: number[] = [];
  let navAf = NOTIONAL_USD;
  let navBase = NOTIONAL_USD;
  const rateByTime = new Map(
    funding.map((f) => [f.time, Number(f.fundingRate)] as const),
  );
  for (const tick of ticks) {
    const hourlyRate = rateByTime.get(tick.time) ?? 0;
    const blackSwan = tick.degraded;
    const basePnl = NOTIONAL_USD * hourlyRate;
    const afHour = afOn.evaluateHourlyHlFunding({
      notionalUsd: NOTIONAL_USD,
      hourlyFundingRate: hourlyRate,
      blackSwanActive: blackSwan,
    });
    const afPnl =
      blackSwan && hourlyRate > 0 ? afHour.subsidyUsd : basePnl;
    const spike = Math.max(0, afPnl - basePnl);
    baselineFundingUsd += basePnl;
    afFundingUsd += afPnl;
    afExtraSubsidyUsd += spike;
    navBase += basePnl;
    navAf += afPnl;
    baselineEquity.push(navBase);
    afEquity.push(navAf);
    if (blackSwan && afHour.regime === "BLACK_SWAN_SHORT_SUBSIDY") {
      blackSwanHours += 1;
      yieldSpikeSumUsd += spike;
      yieldSpikeMaxUsd = Math.max(yieldSpikeMaxUsd, spike);
    }
  }
  const hours = Math.max(ticks.length, 1);
  const baselineNetApy =
    (baselineFundingUsd / NOTIONAL_USD) * ((365 * 24) / hours);
  const afNetApy = (afFundingUsd / NOTIONAL_USD) * ((365 * 24) / hours);
  const deltaApy = afNetApy - baselineNetApy;
  const deltaSlipSavedP3 = 0;
  const phase3SlipSaved = radarSlipSaved;
  const mddAf = maxDrawdown(afEquity);
  const mddBase = maxDrawdown(baselineEquity);
  const avgSpikeUsd =
    blackSwanHours > 0 ? yieldSpikeSumUsd / blackSwanHours : 0;

  const bidsP4 = book.levels?.[0] ?? [];
  const market1mIso = walkBook(
    bidsP4,
    metrics100k.midPx,
    STRESS_NOTIONAL_USD,
    "sell",
  );
  const market100Iso = walkBook(
    bidsP4,
    metrics100k.midPx,
    NOTIONAL_USD,
    "sell",
  );
  const base100 = twapShortImpact(bidsP4, metrics100k.midPx, NOTIONAL_USD, 3);
  const full100 = twapShortImpact(
    bidsP4,
    metrics100k.midPx,
    NOTIONAL_USD,
    TWAP_SLOTS,
  );
  const base1m = twapShortImpact(
    bidsP4,
    metrics100k.midPx,
    STRESS_NOTIONAL_USD,
    3,
  );
  const full1m = twapShortImpact(
    bidsP4,
    metrics100k.midPx,
    STRESS_NOTIONAL_USD,
    TWAP_SLOTS,
  );
  const full30Plan = new TwapEngineV2Full30().planRoutes({
    symbol: COIN,
    totalNotionalUsd: STRESS_NOTIONAL_USD,
    horizonMs: 30 * 60_000,
    preferVwap: true,
  });
  const basePlan = new TwapEngineV2Stub().planRoutes({
    symbol: COIN,
    totalNotionalUsd: STRESS_NOTIONAL_USD,
    horizonMs: 30 * 60_000,
    preferVwap: true,
  });
  const basePaths = basePlan.filter((r) => r.weightBps > 0).length;
  const fullPaths = full30Plan.filter((r) => r.weightBps > 0).length;
  const slipSavedBase100 = market100Iso.slipUsd - base100.slipUsd;
  const slipSavedFull100 = market100Iso.slipUsd - full100.slipUsd;
  const slipSavedBase1m = market1mIso.slipUsd - base1m.slipUsd;
  const slipSavedFull1m = market1mIso.slipUsd - full1m.slipUsd;
  const deltaSlip100 = slipSavedFull100 - slipSavedBase100;
  const deltaSlip1m = slipSavedFull1m - slipSavedBase1m;
  const impactDrop1mPct =
    base1m.impactBps > 0
      ? (base1m.impactBps - full1m.impactBps) / base1m.impactBps
      : 0;
  const costDrop1mUsd = base1m.slipUsd - full1m.slipUsd;

  const p5p6 = runPhase5And6({
    funding,
    fundingSol,
    fundingBtc,
    ticks,
    metrics100k,
    spanDays,
  });

  void TWAP_PATH_SLOT_COUNT;

  return {
    baselineFundingUsd,
    baselineNetApy,
    afNetApy,
    deltaApy,
    afFundingUsd,
    afExtraSubsidyUsd,
    navBase,
    navAf,
    mddAf,
    mddBase,
    blackSwanHours,
    yieldSpikeMaxUsd,
    yieldSpikeSumUsd,
    avgSpikeUsd,
    deltaSlipSavedP3,
    phase3SlipSaved,
    basePaths,
    fullPaths,
    slipSavedBase100,
    slipSavedFull100,
    slipSavedBase1m,
    slipSavedFull1m,
    deltaSlip100,
    deltaSlip1m,
    impactDrop1mPct,
    costDrop1mUsd,
    base100,
    full100,
    base1m,
    full1m,
    market100Iso,
    market1mIso,
    hours,
    ...p5p6,
  };
}
