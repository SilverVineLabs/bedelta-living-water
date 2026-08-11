import { AntiFragileYieldService } from "../../src/services/anti-fragile-yield";
import { computeSlippageSaved } from "../../src/services/slippage-saved-telemetry";
import type { computeLiveBookMetrics } from "../../src/services/exchanges/hyperliquid-adapter";
import {
  COIN,
  DEGRADE_THRESHOLD,
  HEDGE_TRACKING_ERR,
  NOTIONAL_USD,
  STRESS_NOTIONAL_USD,
  type FundingPoint,
  type RadarTick,
} from "./survival-benchmark.types";
import { maxDrawdown, sharpeFromDailyReturns } from "./survival-benchmark.utils";
import type { PhaseIsolationsResult } from "./phase-isolations";
import { runProgressiveRuns } from "./progressive-runs";

export interface FullSpecRunsInput {
  funding: FundingPoint[];
  fundingSol: FundingPoint[];
  fundingBtc: FundingPoint[];
  ticks: RadarTick[];
  degraded: RadarTick[];
  hourlyClose: Map<number, number>;
  metrics100k: NonNullable<ReturnType<typeof computeLiveBookMetrics>>;
  phases: PhaseIsolationsResult;
  spanDays: number;
  meanHourly: number;
}

export type FullSpecRunsResult = ReturnType<typeof runFullSpecAndProgressiveRuns>;

export function runFullSpecAndProgressiveRuns(input: FullSpecRunsInput) {
  const {
    funding,
    ticks,
    degraded,
    hourlyClose,
    phases,
    spanDays,
  } = input;

  const {
    baselineFundingUsd,
    baselineNetApy,
    market100Iso,
    market1mIso,
    full100,
    full1m,
    vaasBlockRate,
    vaasSaasFeeAnnualized,
    phase5Active,
    hours,
    rotationOn,
  } = phases;

  const afOn = new AntiFragileYieldService(true);

  let fullSpecSlip30d = 0;
  for (const tick of degraded) {
    const stress =
      1 +
      Math.max(0, (DEGRADE_THRESHOLD - tick.composite) / DEGRADE_THRESHOLD) * 4;
    fullSpecSlip30d +=
      Math.max(0, market100Iso.slipUsd - full100.slipUsd) * stress;
    if (tick.secondary < 35) {
      fullSpecSlip30d +=
        Math.max(0, market1mIso.slipUsd - full1m.slipUsd) * 0.15;
    }
  }
  const fullSpecSlip1mStress = Math.max(
    0,
    market1mIso.slipUsd - full1m.slipUsd,
  );

  const rateMaps = {
    ETH: new Map(funding.map((f) => [f.time, Number(f.fundingRate)] as const)),
    SOL: new Map(
      input.fundingSol.map((f) => [f.time, Number(f.fundingRate)] as const),
    ),
    BTC: new Map(
      input.fundingBtc.map((f) => [f.time, Number(f.fundingRate)] as const),
    ),
  };
  const decisionByTime = new Map(
    phase5Active.decisions.map((d) => [d.time, d] as const),
  );
  let fullSpecFundingUsd = 0;
  const fsEquity: number[] = [];
  const fsDaily = new Map<string, number>();
  let navFs = NOTIONAL_USD;
  let prevFsClose: number | null = null;

  for (const f of funding) {
    const decision = decisionByTime.get(f.time);
    const active = decision?.to ?? "ETH";
    const hourlyRate =
      rateMaps[active].get(f.time) ?? Number(f.fundingRate);
    const tick = ticks.find((t) => t.time === f.time);
    const blackSwan = tick?.degraded ?? false;
    const basePnl = NOTIONAL_USD * hourlyRate;
    const afHour = afOn.evaluateHourlyHlFunding({
      notionalUsd: NOTIONAL_USD,
      hourlyFundingRate: hourlyRate,
      blackSwanActive: blackSwan,
    });
    let pnl =
      blackSwan && hourlyRate > 0 ? afHour.subsidyUsd : basePnl;
    if (decision?.rotated) {
      const slip = (NOTIONAL_USD * rotationOn.rotationSlipBps) / 10_000;
      pnl -= slip;
    }
    fullSpecFundingUsd += pnl;

    const bucket = Math.floor(f.time / 3_600_000) * 3_600_000;
    const px = hourlyClose.get(bucket);
    let engPnl = pnl;
    if (px && prevFsClose && prevFsClose > 0) {
      engPnl -=
        NOTIONAL_USD *
        Math.abs((px - prevFsClose) / prevFsClose) *
        HEDGE_TRACKING_ERR;
    }
    if (px) prevFsClose = px;
    navFs += engPnl;
    fsEquity.push(navFs);
    const day = new Date(f.time).toISOString().slice(0, 10);
    fsDaily.set(day, (fsDaily.get(day) ?? 0) + engPnl);
  }

  const fullSpecNetApy =
    (fullSpecFundingUsd / NOTIONAL_USD) * ((365 * 24) / hours);
  const fullSpecExtraFunding = fullSpecFundingUsd - baselineFundingUsd;
  const fullSpecVsBaseApy = fullSpecNetApy - baselineNetApy;
  const fullSpecMdd = maxDrawdown(fsEquity);
  const fullSpecSharpe = sharpeFromDailyReturns(
    [...fsDaily.values()].map((p) => p / NOTIONAL_USD),
  );

  const telemetry = computeSlippageSaved(
    [
      {
        symbol: COIN,
        notionalUsd: STRESS_NOTIONAL_USD,
        rawImpactBps: market1mIso.impactBps,
        gatedImpactBps: full1m.impactBps,
      },
      {
        symbol: COIN,
        notionalUsd: NOTIONAL_USD,
        rawImpactBps: market100Iso.impactBps,
        gatedImpactBps: full100.impactBps,
      },
    ],
    "30D full-spec ($1M + $100k)",
  );

  const fullSpecBlockRate = vaasBlockRate;
  const fullSpecSaasYr = vaasSaasFeeAnnualized;

  const progressive = runProgressiveRuns({
    phases,
    metrics100k: input.metrics100k,
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
    meanHourly: input.meanHourly,
  });

  return {
    fullSpecSlip30d,
    fullSpecSlip1mStress,
    fullSpecFundingUsd,
    fullSpecNetApy,
    fullSpecExtraFunding,
    fullSpecVsBaseApy,
    fullSpecMdd,
    fullSpecSharpe,
    navFs,
    telemetry,
    fullSpecBlockRate,
    fullSpecSaasYr,
    ...progressive,
  };
}
