import type { FundingPoint } from "./survival-benchmark.types";
import { NOTIONAL_USD, HEDGE_TRACKING_ERR } from "./survival-benchmark.types";
import { maxDrawdown, sharpeFromDailyReturns } from "./survival-benchmark.utils";

export function computeFundingEquity(
  funding: FundingPoint[],
  hourlyClose: Map<number, number>,
): {
  equityFund: number[];
  equityEng: number[];
  mddFund: number;
  mddEng: number;
  sharpeFund: number;
  sharpeEng: number;
  navFund: number;
  navEng: number;
} {
  const equityFund: number[] = [];
  const equityEng: number[] = [];
  const dailyFund = new Map<string, number>();
  const dailyEng = new Map<string, number>();
  let navFund = NOTIONAL_USD;
  let navEng = NOTIONAL_USD;
  let prevClose: number | null = null;
  for (const f of funding) {
    const r = Number(f.fundingRate);
    const fundPnl = NOTIONAL_USD * r;
    let residual = 0;
    const bucket = Math.floor(f.time / 3_600_000) * 3_600_000;
    const px = hourlyClose.get(bucket);
    if (px && prevClose && prevClose > 0) {
      residual =
        NOTIONAL_USD * Math.abs((px - prevClose) / prevClose) * HEDGE_TRACKING_ERR;
    }
    if (px) prevClose = px;
    navFund += fundPnl;
    navEng += fundPnl - residual;
    equityFund.push(navFund);
    equityEng.push(navEng);
    const day = new Date(f.time).toISOString().slice(0, 10);
    dailyFund.set(day, (dailyFund.get(day) ?? 0) + fundPnl);
    dailyEng.set(day, (dailyEng.get(day) ?? 0) + fundPnl - residual);
  }
  return {
    equityFund,
    equityEng,
    mddFund: maxDrawdown(equityFund),
    mddEng: maxDrawdown(equityEng),
    sharpeFund: sharpeFromDailyReturns(
      [...dailyFund.values()].map((p) => p / NOTIONAL_USD),
    ),
    sharpeEng: sharpeFromDailyReturns(
      [...dailyEng.values()].map((p) => p / NOTIONAL_USD),
    ),
    navFund,
    navEng,
  };
}

export function buildHourlyClose(candles1h: { t: number; c: string }[]): Map<number, number> {
  const hourlyClose = new Map<number, number>();
  for (const c of candles1h) {
    hourlyClose.set(Math.floor(c.t / 3_600_000) * 3_600_000, Number(c.c));
  }
  return hourlyClose;
}
