import { HL_L2_STALE_THRESHOLD_MS } from "../../../config/constants";
import {
  computeLiveBookMetrics,
  isL2BookFailClosed,
  postHlInfo,
  type HlL2BookResponse,
  type LiveL2BookSnapshot,
} from "../../../services/exchanges/hl-l2-book";
import type { Step2MockL2Book } from "../../types/step2-targets";

export function estimateLiqDistanceFromBook(
  bidDepthUsd: number,
  askDepthUsd: number,
  midPx: number,
): number {
  if (!(midPx > 0)) return 5;
  const thin = Math.min(bidDepthUsd, askDepthUsd);
  if (thin < 50_000) return 0.6;
  if (thin < 200_000) return 1.2;
  if (thin < 1_000_000) return 2.5;
  return 4.0;
}

export async function fetchL2BookFeatures(
  symbol: string,
  midPx: number,
  mockBook?: Step2MockL2Book,
): Promise<{
  bidDepthUsd: number;
  askDepthUsd: number;
  estimatedLiquidationDistancePct: number;
}> {
  if (mockBook) return mockBook;

  const probeStarted = Date.now();
  const res = await postHlInfo({ type: "l2Book", coin: symbol });
  const probeMs = Date.now() - probeStarted;

  if (probeMs > HL_L2_STALE_THRESHOLD_MS || !res.ok) {
    throw new Error(`L2_FAIL_CLOSED_${symbol}_${probeMs}ms`);
  }

  const raw = (await res.json()) as HlL2BookResponse;
  const snapshot: LiveL2BookSnapshot = {
    coin: symbol,
    book: {
      coin: raw.coin ?? symbol,
      levels: raw.levels ?? [[], []],
      time: raw.time,
    },
    fetchedAt: new Date().toISOString(),
    live: true,
    source: "testnet",
  };

  if (isL2BookFailClosed(snapshot, Date.now())) {
    throw new Error(`L2_FAIL_CLOSED_STALE_${symbol}`);
  }

  const metrics = computeLiveBookMetrics(snapshot.book);
  if (!metrics) {
    throw new Error(`L2_FAIL_CLOSED_EMPTY_${symbol}`);
  }

  return {
    bidDepthUsd: metrics.bidDepthUsd,
    askDepthUsd: metrics.askDepthUsd,
    estimatedLiquidationDistancePct: estimateLiqDistanceFromBook(
      metrics.bidDepthUsd,
      metrics.askDepthUsd,
      metrics.midPx > 0 ? metrics.midPx : midPx,
    ),
  };
}
