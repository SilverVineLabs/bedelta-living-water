/**
 * BeΔ Living Water — Survival Benchmark Report
 * HL Mainnet L1 + Dual-Radar + Single-Weapon Isolation (v1.5 dark-staging).
 *
 * Usage: pnpm tsx scripts/generate-survival-report.ts
 */

import { mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { computeLiveBookMetrics } from "../../src/services/exchanges/hyperliquid-adapter";
import { auditLiveBookSoilResistance } from "../../src/services/check-soil-resistance";
import { dualLegMarketSlip, simulateSliTwap } from "./book-simulation";
import { buildHourlyClose, computeFundingEquity } from "./funding-equity";
import { runFullSpecAndProgressiveRuns } from "./full-spec-runs";
import {
  fetchBinanceCloses1h,
  fetchCandles,
  fetchEthMeta,
  fetchFundingHistory,
  fetchL2Book,
} from "./hl-data-fetch";
import { HLRadarEvaluator } from "./hl-radar-evaluator";
import { runPhaseIsolations } from "./phase-isolations";
import { buildSurvivalMarkdown } from "./report-template";
import { buildReportContext } from "./survival-report-context";
import { logSurvivalSummary } from "./survival-benchmark-log";
import {
  COIN,
  LOOKBACK_MS,
  NOTIONAL_USD,
  OUT,
  STRESS_NOTIONAL_USD,
} from "./survival-benchmark.types";
import {
  annualizedVol,
  logReturns,
  mean,
  probeFromMetrics,
} from "./survival-benchmark.utils";

async function main(): Promise<void> {
  const endMs = Date.now();
  const startMs = endMs - LOOKBACK_MS;
  console.log(`[survival] fetching HL mainnet + Binance basis for ${COIN}…`);

  const [funding, fundingSol, fundingBtc, candles1m, candles1h, book, binance1h, ethMeta] =
    await Promise.all([
      fetchFundingHistory("ETH", startMs, endMs),
      fetchFundingHistory("SOL", startMs, endMs),
      fetchFundingHistory("BTC", startMs, endMs),
      fetchCandles("1m", startMs, endMs),
      fetchCandles("1h", startMs, endMs),
      fetchL2Book(),
      fetchBinanceCloses1h(startMs, endMs),
      fetchEthMeta(),
    ]);

  if (!funding.length) throw new Error("No fundingHistory returned");
  if (!candles1m.length && !candles1h.length) {
    throw new Error("No candleSnapshot returned");
  }

  const metrics100k = computeLiveBookMetrics(book, NOTIONAL_USD);
  const metricsStress = computeLiveBookMetrics(book, STRESS_NOTIONAL_USD);
  if (!metrics100k) throw new Error("Unable to derive L2 book metrics");

  const soilAudit = auditLiveBookSoilResistance(probeFromMetrics(COIN, metrics100k));
  const market100 = dualLegMarketSlip(book, metrics100k.midPx, NOTIONAL_USD);
  const marketStress = dualLegMarketSlip(book, metrics100k.midPx, STRESS_NOTIONAL_USD);
  const twap100 = simulateSliTwap(book, metrics100k.midPx, NOTIONAL_USD);
  const twapStress = simulateSliTwap(book, metrics100k.midPx, STRESS_NOTIONAL_USD);
  const saved100 = market100.slipUsd - twap100.slipUsd;
  const savedStress = marketStress.slipUsd - twapStress.slipUsd;

  const rates = funding.map((f) => Number(f.fundingRate));
  const meanHourly = mean(rates);
  const netApy = meanHourly * 24 * 365;
  const hourlyClose = buildHourlyClose(candles1h);
  const {
    mddFund,
    mddEng,
    sharpeFund,
    sharpeEng,
    navFund,
    navEng,
  } = computeFundingEquity(funding, hourlyClose);

  const closes1m = candles1m.map((c) => Number(c.c)).filter((x) => x > 0);
  const closes1h = candles1h.map((c) => Number(c.c)).filter((x) => x > 0);
  const vol1m = annualizedVol(logReturns(closes1m), 525_600);
  const vol1h = annualizedVol(logReturns(closes1h), 8_760);
  const spanDays =
    (funding[funding.length - 1]!.time - funding[0]!.time) / 86_400_000;
  const c1mSpanH =
    candles1m.length > 1
      ? (candles1m[candles1m.length - 1]!.t - candles1m[0]!.t) / 3_600_000
      : 0;

  console.log(`[survival] evaluating HLRadarEvaluator over ${funding.length} ticks…`);
  const radar = new HLRadarEvaluator({
    funding,
    candles1m,
    candles1h,
    binance1h,
    book,
    maxLeverage: ethMeta.maxLeverage,
    assetCtx: ethMeta.assetCtx,
  });
  const ticks = radar.evaluateHistory();
  const degraded = ticks.filter((t) => t.degraded);
  const radarSlipSaved = degraded.reduce((s, t) => s + t.slipSavedUsd, 0);
  const avgComposite = mean(ticks.map((t) => t.composite));
  const avgPrimary = mean(ticks.map((t) => t.primary));
  const avgSecondary = mean(ticks.map((t) => t.secondary));
  const avgS = {
    s1: mean(ticks.map((t) => t.scores.s1)),
    s2: mean(ticks.map((t) => t.scores.s2)),
    s3: mean(ticks.map((t) => t.scores.s3)),
    s4: mean(ticks.map((t) => t.scores.s4)),
    s5: mean(ticks.map((t) => t.scores.s5)),
  };
  const minComposite = Math.min(...ticks.map((t) => t.composite));
  const maxComposite = Math.max(...ticks.map((t) => t.composite));
  const latest = ticks[ticks.length - 1]!;
  const hudCounts = ticks.reduce(
    (acc, t) => {
      acc[t.hudState] = (acc[t.hudState] ?? 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  const phases = runPhaseIsolations({
    funding,
    fundingSol,
    fundingBtc,
    ticks,
    book,
    metrics100k,
    radarSlipSaved,
    spanDays,
  });
  const fullSpec = runFullSpecAndProgressiveRuns({
    funding,
    fundingSol,
    fundingBtc,
    ticks,
    degraded,
    hourlyClose,
    metrics100k,
    phases,
    spanDays,
    meanHourly,
  });

  const md = buildSurvivalMarkdown(
    buildReportContext({
      spanDays,
      ethMeta,
      ticks,
      degraded,
      hudCounts,
      radarSlipSaved,
      avgPrimary,
      avgSecondary,
      avgComposite,
      minComposite,
      maxComposite,
      latest,
      avgS,
      funding,
      fundingSol,
      fundingBtc,
      metrics100k,
      metricsStress,
      soilAudit,
      market100,
      marketStress,
      twap100,
      twapStress,
      saved100,
      savedStress,
      meanHourly,
      netApy,
      candles1m,
      candles1h,
      binance1h,
      c1mSpanH,
      vol1m,
      vol1h,
      mddFund,
      mddEng,
      sharpeFund,
      sharpeEng,
      navFund,
      navEng,
      phases,
      fullSpec,
    }),
  );

  mkdirSync(dirname(OUT), { recursive: true });
  writeFileSync(OUT, md, "utf8");
  console.log(`[survival] wrote ${OUT}`);
  logSurvivalSummary({
    avgComposite,
    degradedCount: degraded.length,
    radarSlipSaved,
    sharpeEng,
    netApy,
    phases,
    fullSpec,
  });
}

main().catch((err) => {
  console.error("[survival] FAILED", err);
  process.exit(1);
});
