import {
  TWAP_PATH_SLOT_COUNT,
  TwapEngineV2Stub,
  type TWAPEngineV2,
} from "../../src/services/execution/twap-engine-v2";
import {
  computeLiveBookMetrics,
  type HlL2BookLevel,
  type HlL2BookResponse,
} from "../../src/services/exchanges/hyperliquid-adapter";
import { auditLiveBookSoilResistance } from "../../src/services/check-soil-resistance";
import { MAX_SLIPPAGE, MIN_DEPTH_USD } from "../../src/services/risk-control";
import {
  COIN,
  NOTIONAL_USD,
  type SliTwapResult,
  type WalkFill,
} from "./survival-benchmark.types";
import { probeFromMetrics } from "./survival-benchmark.utils";

export function parseLevel(level: HlL2BookLevel | [string, string]): {
  px: number;
  sz: number;
} {
  if (Array.isArray(level)) {
    return { px: parseFloat(level[0]), sz: parseFloat(level[1]) };
  }
  return { px: parseFloat(level.px), sz: parseFloat(level.sz) };
}

export function walkBook(
  levels: HlL2BookLevel[],
  midPx: number,
  notionalUsd: number,
  side: "buy" | "sell",
): WalkFill {
  let remaining = notionalUsd;
  let filledUsd = 0;
  let filledQty = 0;

  for (const level of levels) {
    const { px, sz } = parseLevel(level);
    if (!(px > 0 && sz > 0)) continue;
    const levelUsd = px * sz;
    const takeUsd = Math.min(remaining, levelUsd);
    filledUsd += takeUsd;
    filledQty += takeUsd / px;
    remaining -= takeUsd;
    if (remaining <= 1e-9) break;
  }

  if (filledQty <= 0 || filledUsd <= 0 || !(midPx > 0)) {
    return {
      filledUsd: 0,
      filledQty: 0,
      avgPx: midPx,
      midPx,
      impactBps: Number.POSITIVE_INFINITY,
      slipUsd: notionalUsd,
    };
  }

  const avgPx = filledUsd / filledQty;
  const rawImpact =
    side === "buy" ? (avgPx - midPx) / midPx : (midPx - avgPx) / midPx;
  const impactBps = Math.max(0, rawImpact) * 10_000;
  const slipUsd = Math.max(0, rawImpact) * filledUsd;
  return { filledUsd, filledQty, avgPx, midPx, impactBps, slipUsd };
}

export function simulateSliTwap(
  book: HlL2BookResponse,
  midPx: number,
  totalUsd: number,
  planner: TWAPEngineV2 = new TwapEngineV2Stub(),
): SliTwapResult {
  const routes = planner.planRoutes({
    symbol: COIN,
    totalNotionalUsd: totalUsd,
    horizonMs: 30 * 60_000,
    preferVwap: true,
  });
  const liveRoutes = routes.filter((r) => r.weightBps > 0 && r.maxSliceUsd > 0);
  const sliceCount = Math.max(1, liveRoutes.length);
  const baseSlice = totalUsd / sliceCount;
  const bids = book.levels?.[0] ?? [];
  const asks = book.levels?.[1] ?? [];

  let filledUsd = 0;
  let slipUsd = 0;
  let soilTrips = 0;
  let slicesUsed = 0;

  for (let i = 0; i < sliceCount; i++) {
    let sliceUsd = Math.min(baseSlice, totalUsd - filledUsd);
    if (sliceUsd <= 0) break;
    const route = liveRoutes[i % liveRoutes.length]!;
    sliceUsd = Math.min(sliceUsd, Math.max(route.maxSliceUsd, baseSlice * 0.5));

    let fill = walkBook(asks, midPx, sliceUsd, "buy");
    const shortFill = walkBook(bids, midPx, sliceUsd, "sell");
    const combinedSlip = (fill.slipUsd + shortFill.slipUsd) / 2;
    const combinedBps = (fill.impactBps + shortFill.impactBps) / 2;

    const sliceProbe = probeFromMetrics(
      COIN,
      computeLiveBookMetrics(book, sliceUsd) ?? {
        bestBid: midPx * 0.9999,
        bestAsk: midPx * 1.0001,
        midPx,
        spreadBps: 2,
        bidDepthUsd: MIN_DEPTH_USD,
        askDepthUsd: MIN_DEPTH_USD,
        depthUsd: MIN_DEPTH_USD,
        priceImpactBps: combinedBps,
      },
    );
    sliceProbe.priceImpactBps = combinedBps;
    const soil = auditLiveBookSoilResistance(sliceProbe);

    if (soil.tripped || combinedBps / 10_000 > MAX_SLIPPAGE) {
      soilTrips += 1;
      sliceUsd *= 0.5;
      fill = walkBook(asks, midPx, sliceUsd, "buy");
      const short2 = walkBook(bids, midPx, sliceUsd, "sell");
      const slip2 = (fill.slipUsd + short2.slipUsd) / 2;
      filledUsd += sliceUsd;
      slipUsd += slip2;
      slicesUsed += 1;
      continue;
    }

    filledUsd += sliceUsd;
    slipUsd += combinedSlip;
    slicesUsed += 1;
  }

  const impactBps = filledUsd > 0 ? (slipUsd / filledUsd) * 10_000 : 0;
  return {
    slipUsd,
    impactBps,
    filledUsd,
    soilTrips,
    slicesUsed,
    sliceUsd: baseSlice,
    pathSlots: sliceCount,
  };
}

export function dualLegMarketSlip(
  book: HlL2BookResponse,
  midPx: number,
  notional: number,
): { slipUsd: number; impactBps: number } {
  const buy = walkBook(book.levels?.[1] ?? [], midPx, notional, "buy");
  const sell = walkBook(book.levels?.[0] ?? [], midPx, notional, "sell");
  return {
    slipUsd: (buy.slipUsd + sell.slipUsd) / 2,
    impactBps: (buy.impactBps + sell.impactBps) / 2,
  };
}

export function twapShortImpact(
  levels: HlL2BookLevel[],
  mid: number,
  totalUsd: number,
  slices: number,
): { slipUsd: number; impactBps: number; sliceUsd: number } {
  const n = Math.max(1, slices);
  const sliceUsd = totalUsd / n;
  let slipUsd = 0;
  let filled = 0;
  for (let i = 0; i < n; i++) {
    const fill = walkBook(levels, mid, sliceUsd, "sell");
    slipUsd += fill.slipUsd;
    filled += fill.filledUsd;
  }
  return {
    slipUsd,
    impactBps: filled > 0 ? (slipUsd / filled) * 10_000 : 0,
    sliceUsd,
  };
}

export { TWAP_PATH_SLOT_COUNT };
