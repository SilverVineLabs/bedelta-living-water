import type { Candle } from "./survival-benchmark.types";
import { clamp, mean, stdev } from "./survival-benchmark.utils";

export function scoreS4WhaleLiq(input: {
  maxLeverage: number;
  candles1h: Candle[];
  atMs: number;
  mid: number;
}): number {
  const { maxLeverage, candles1h, atMs, mid } = input;
  const structuralWall = 1 / Math.max(1, maxLeverage);
  const lookback = candles1h.filter(
    (c) => c.t <= atMs && c.t >= atMs - 48 * 3_600_000,
  );
  if (!lookback.length || !(mid > 0)) {
    return clamp(100 * Math.min(1, structuralWall / 0.01));
  }

  let high24 = 0;
  let low24 = Number.POSITIVE_INFINITY;
  for (const c of lookback) {
    high24 = Math.max(high24, Number(c.h));
    low24 = Math.min(low24, Number(c.l));
  }
  const longHeadroom = structuralWall - Math.max(0, (high24 - mid) / mid);
  const shortHeadroom = structuralWall - Math.max(0, (mid - low24) / mid);
  const wallDist = Math.max(0, Math.min(longHeadroom, shortHeadroom));

  const ranked = [...lookback].sort(
    (a, b) => Number(b.v) * Number(b.n || 1) - Number(a.v) * Number(a.n || 1),
  );
  const top = ranked.slice(0, Math.min(20, ranked.length));
  let wSum = 0;
  let distSum = 0;
  for (const c of top) {
    const w = Number(c.v) * Math.max(1, c.n || 1);
    const low = Number(c.l);
    const high = Number(c.h);
    const d = Math.min(Math.abs(mid - low), Math.abs(high - mid)) / mid;
    distSum += w * d;
    wSum += w;
  }
  const magnetDist = wSum > 0 ? distSum / wSum : structuralWall;
  const deltaPLiq = 0.6 * wallDist + 0.4 * magnetDist;

  if (deltaPLiq < 0.003) return clamp(2 + (deltaPLiq / 0.003) * 10);
  if (deltaPLiq < 0.01) return clamp(12 + ((deltaPLiq - 0.003) / 0.007) * 28);
  if (deltaPLiq < 0.02) return clamp(40 + ((deltaPLiq - 0.01) / 0.01) * 25);
  return clamp(65 + Math.min(35, ((deltaPLiq - 0.02) / 0.06) * 35));
}

export function scoreS5BasisZ(input: {
  atMs: number;
  hlClose1h: Map<number, number>;
  binance1h: Map<number, number>;
  basisSeries: number[];
}): number {
  const { atMs, hlClose1h, binance1h, basisSeries } = input;
  const bucket = Math.floor(atMs / 3_600_000) * 3_600_000;
  const hl = hlClose1h.get(bucket);
  const bn = binance1h.get(bucket);
  if (!hl || !bn || bn <= 0) return 65;

  const window: number[] = [];
  for (let t = bucket - 48 * 3_600_000; t <= bucket; t += 3_600_000) {
    const h = hlClose1h.get(t);
    const b = binance1h.get(t);
    if (h && b && b > 0) window.push((h - b) / b);
  }
  const series = window.length >= 8 ? window : basisSeries;
  if (series.length < 8) return 65;

  const basis = (hl - bn) / bn;
  const mu = mean(series);
  const sd = stdev(series) || 1e-9;
  const z = Math.abs((basis - mu) / sd);
  if (z >= 3) return clamp(8 * Math.max(0, 4 - z));
  if (z >= 2) return clamp(40 - (z - 2) * 25);
  return clamp(100 - z * 22);
}
