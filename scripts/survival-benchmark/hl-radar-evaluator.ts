import { auditLiveBookSoilResistance } from "../../src/services/check-soil-resistance";
import {
  computeLiveBookMetrics,
  type HlL2BookResponse,
} from "../../src/services/exchanges/hyperliquid-adapter";
import {
  MAX_SLIPPAGE,
  MIN_DEPTH_USD,
  checkSoilResistance,
} from "../../src/services/risk-control";
import { buildSystemState } from "../../src/services/systemState";
import { dualLegMarketSlip, simulateSliTwap } from "./book-simulation";
import {
  COIN,
  DEGRADE_THRESHOLD,
  NOTIONAL_USD,
  STRESS_NOTIONAL_USD,
  W,
  type Candle,
  type FundingPoint,
  type HlAssetCtx,
  type RadarTick,
  type SensorScores,
} from "./survival-benchmark.types";
import { clamp, probeFromMetrics } from "./survival-benchmark.utils";
import { scoreS4WhaleLiq, scoreS5BasisZ } from "./hl-radar-sensors";

export class HLRadarEvaluator {
  readonly maxLeverage: number;
  readonly book: HlL2BookResponse;
  readonly midPx: number;
  private readonly fundingRates: number[];
  private readonly fundingTimes: number[];
  private readonly candles1m: Candle[];
  private readonly candles1h: Candle[];
  private readonly binance1h: Map<number, number>;
  private readonly hlClose1h: Map<number, number>;
  private readonly basisSeries: number[];
  private readonly liveSoilScore: number;
  private readonly marketSlip100: number;
  private readonly twapSlip100: number;

  constructor(input: {
    funding: FundingPoint[];
    candles1m: Candle[];
    candles1h: Candle[];
    binance1h: Map<number, number>;
    book: HlL2BookResponse;
    maxLeverage: number;
    assetCtx: HlAssetCtx;
  }) {
    this.maxLeverage = input.maxLeverage;
    this.book = input.book;
    this.fundingRates = input.funding.map((f) => Number(f.fundingRate));
    this.fundingTimes = input.funding.map((f) => f.time);
    this.candles1m = input.candles1m;
    this.candles1h = input.candles1h;
    this.binance1h = input.binance1h;

    this.hlClose1h = new Map();
    for (const c of input.candles1h) {
      this.hlClose1h.set(
        Math.floor(c.t / 3_600_000) * 3_600_000,
        Number(c.c),
      );
    }

    const metrics =
      computeLiveBookMetrics(input.book, NOTIONAL_USD) ??
      ({
        bestBid: Number(input.assetCtx.midPx) * 0.9999,
        bestAsk: Number(input.assetCtx.midPx) * 1.0001,
        midPx: Number(input.assetCtx.midPx),
        spreadBps: 2,
        bidDepthUsd: MIN_DEPTH_USD,
        askDepthUsd: MIN_DEPTH_USD,
        depthUsd: MIN_DEPTH_USD,
        priceImpactBps: 5,
      } as const);
    this.midPx = metrics.midPx;

    const probe = probeFromMetrics(COIN, metrics);
    const soil = auditLiveBookSoilResistance(probe);
    const soilCore = checkSoilResistance({
      symbol: COIN,
      hlSpot: metrics.bestBid,
      hlPerp: metrics.bestAsk,
      dydxPerp: metrics.midPx,
      depthUsd: metrics.depthUsd,
      orderSizeUsd: NOTIONAL_USD,
      accountBalanceUsd: NOTIONAL_USD,
    });
    const depthRatio = Math.min(1, metrics.depthUsd / MIN_DEPTH_USD);
    const impactTox = Math.min(1, metrics.priceImpactBps / (MAX_SLIPPAGE * 10_000));
    this.liveSoilScore = clamp(
      100 *
        (0.45 * depthRatio +
          0.35 * (soil.tripped || soilCore.tripped ? 0 : 1) +
          0.2 * (1 - impactTox)),
    );

    const mkt = dualLegMarketSlip(input.book, this.midPx, NOTIONAL_USD);
    const twap = simulateSliTwap(input.book, this.midPx, NOTIONAL_USD);
    this.marketSlip100 = mkt.slipUsd;
    this.twapSlip100 = twap.slipUsd;

    this.basisSeries = [];
    for (const [t, hl] of this.hlClose1h) {
      const bn = this.binance1h.get(t);
      if (bn && bn > 0 && hl > 0) this.basisSeries.push((hl - bn) / bn);
    }
  }

  scoreS1(atMs: number): number {
    const window = this.candles1m.filter(
      (c) => c.t <= atMs && c.t >= atMs - 30 * 60_000,
    );
    if (window.length < 5) {
      const h1 = this.candles1h.filter(
        (c) => c.t <= atMs && c.t >= atMs - 6 * 3_600_000,
      );
      if (h1.length < 3) return 70;
      const ranges = h1.map((c) => {
        const px = Number(c.c);
        return px > 0 ? (Number(c.h) - Number(c.l)) / px : 0;
      });
      const vols = h1.map((c) => Number(c.v) || 0);
      const spreadVel = Math.abs(ranges[ranges.length - 1]! - ranges[0]!);
      const volDrop =
        vols[0]! > 0 ? Math.max(0, 1 - vols[vols.length - 1]! / vols[0]!) : 0;
      const tox = Math.min(1, spreadVel * 80 + volDrop * 0.5);
      return clamp(100 * (1 - tox));
    }

    const ranges = window.map((c) => {
      const px = Number(c.c);
      return px > 0 ? (Number(c.h) - Number(c.l)) / px : 0;
    });
    const vols = window.map((c) => Number(c.v) || 1e-9);
    const trades = window.map((c) => Math.max(1, c.n || 1));
    const cfr = ranges.map((r, i) => r / Math.sqrt(trades[i]! * vols[i]!));
    const cfrVel = Math.abs(cfr[cfr.length - 1]! - cfr[0]!);
    const spreadVel = Math.abs(ranges[ranges.length - 1]! - ranges[0]!);
    const tox = Math.min(1, cfrVel * 2e3 + spreadVel * 120);
    return clamp(100 * (1 - tox));
  }

  scoreS2(atMs: number): number {
    const idx = this.fundingTimes.findIndex((t) => t >= atMs);
    const i =
      idx === -1
        ? this.fundingTimes.length - 1
        : Math.max(2, idx);
    if (i < 2) return 70;
    const f0 = this.fundingRates[i]!;
    const f1 = this.fundingRates[i - 1]!;
    const f2 = this.fundingRates[i - 2]!;
    const dtH = Math.max(
      1,
      (this.fundingTimes[i]! - this.fundingTimes[i - 1]!) / 3_600_000,
    );
    const d1 = (f0 - f1) / dtH;
    const d2 = (f0 - 2 * f1 + f2) / (dtH * dtH);
    const slopeTox = Math.min(1, Math.abs(d1) / 0.000012);
    const accelTox = Math.min(1, Math.abs(d2) / 0.00002);
    const levelTox = Math.min(1, Math.abs(f0) / 0.00008);
    const tox = 0.5 * slopeTox + 0.3 * accelTox + 0.2 * levelTox;
    return clamp(100 * (1 - tox));
  }

  scoreS3(_atMs: number): number {
    void _atMs;
    return this.liveSoilScore;
  }

  scoreS4(atMs: number, mid: number): number {
    return scoreS4WhaleLiq({
      maxLeverage: this.maxLeverage,
      candles1h: this.candles1h,
      atMs,
      mid,
    });
  }

  scoreS5(atMs: number): number {
    return scoreS5BasisZ({
      atMs,
      hlClose1h: this.hlClose1h,
      binance1h: this.binance1h,
      basisSeries: this.basisSeries,
    });
  }

  evaluateAt(atMs: number): RadarTick {
    const bucket = Math.floor(atMs / 3_600_000) * 3_600_000;
    const mid = this.hlClose1h.get(bucket) ?? this.midPx;

    const scores: SensorScores = {
      s1: this.scoreS1(atMs),
      s2: this.scoreS2(atMs),
      s3: this.scoreS3(atMs),
      s4: this.scoreS4(atMs, mid),
      s5: this.scoreS5(atMs),
    };

    const primary =
      W.s1 * scores.s1 + W.s2 * scores.s2 + W.s3 * scores.s3;
    const secondary = W.s4 * scores.s4 + W.s5 * scores.s5;
    const weighted = W.primary * primary + W.secondary * secondary;
    const weakest = Math.min(
      scores.s1,
      scores.s2,
      scores.s3,
      scores.s4,
      scores.s5,
    );
    let composite = clamp(0.58 * weighted + 0.42 * weakest);
    if (scores.s4 < 18 || scores.s5 < 22) {
      composite = clamp(Math.min(composite, 0.82 * composite, weakest + 8));
    }
    const degraded = composite < DEGRADE_THRESHOLD;

    const systemState = buildSystemState({
      accountBalanceUsd: NOTIONAL_USD,
      currentCri: Math.round(composite),
      soilTripped: degraded || scores.s3 < 40,
      skipHardlockAssert: true,
      symbol: COIN,
      isSandboxMode: true,
    });

    let slipSavedUsd = 0;
    if (degraded) {
      const stress =
        1 + Math.max(0, (DEGRADE_THRESHOLD - composite) / DEGRADE_THRESHOLD) * 4;
      slipSavedUsd = Math.max(0, this.marketSlip100 - this.twapSlip100) * stress;
      if (secondary < 35) {
        const mStress = dualLegMarketSlip(
          this.book,
          this.midPx,
          STRESS_NOTIONAL_USD,
        );
        const tStress = simulateSliTwap(
          this.book,
          this.midPx,
          STRESS_NOTIONAL_USD,
        );
        slipSavedUsd += Math.max(0, mStress.slipUsd - tStress.slipUsd) * 0.15;
      }
    }

    return {
      time: atMs,
      scores,
      primary,
      secondary,
      composite,
      degraded,
      hudState: systemState.hudState,
      systemState,
      slipSavedUsd,
    };
  }

  evaluateHistory(): RadarTick[] {
    const ticks: RadarTick[] = [];
    for (const t of this.fundingTimes) {
      ticks.push(this.evaluateAt(t));
    }
    return ticks;
  }
}
