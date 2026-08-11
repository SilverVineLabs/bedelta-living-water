/**
 * WS Top-3 orderbook depth probe — 50ms pre-execution liquidity gate.
 * Validates $300 notional fits Top-3 book with ≤2 bps slippage.
 */

import type { WsBookData, WsBookLevel } from "../../adapters/hl/websocket/types";
import { MICRO_CAPITAL_USD } from "../../config/risk-parameters";

/** Sample WS book this many ms before order execution. */
export const DEPTH_PROBE_LEAD_MS = 50 as const;

/** Default probe notional — micro-capital envelope. */
export const DEPTH_PROBE_ORDER_USD = MICRO_CAPITAL_USD;

/** Max acceptable walk impact on Top-3 liquidity (bps). */
export const DEPTH_PROBE_MAX_SLIPPAGE_BPS = 2 as const;

export const DEPTH_PROBE_TOP_N = 3 as const;

export type DepthProbeSide = "buy" | "sell";

export interface BookLevel {
  px: number;
  sz: number;
}

export interface Top3DepthProbeInput {
  bids: BookLevel[];
  asks: BookLevel[];
  side: DepthProbeSide;
  orderUsd?: number;
  maxSlippageBps?: number;
  topN?: number;
}

export interface Top3WalkFill {
  filledUsd: number;
  filledQty: number;
  avgPx: number;
  impactBps: number;
  topDepthUsd: number;
}

export interface Top3DepthProbeResult {
  sufficient: boolean;
  side: DepthProbeSide;
  orderUsd: number;
  maxSlippageBps: number;
  impactBps: number;
  filledUsd: number;
  top3DepthUsd: number;
  bestBid: number;
  bestAsk: number;
  midPx: number;
  leadMs: number;
  probedAt: number;
  reasons: string[];
}

export function parseWsBookLevel(level: WsBookLevel): BookLevel {
  return {
    px: parseFloat(level.px),
    sz: parseFloat(level.sz),
  };
}

export function takeTopLevels(
  levels: BookLevel[],
  topN: number = DEPTH_PROBE_TOP_N,
): BookLevel[] {
  return levels
    .filter((l) => l.px > 0 && l.sz > 0)
    .slice(0, topN);
}

export function levelsFromWsBook(
  book: WsBookData,
  topN: number = DEPTH_PROBE_TOP_N,
): { bids: BookLevel[]; asks: BookLevel[] } {
  const bids = (book.levels?.[0] ?? []).map(parseWsBookLevel);
  const asks = (book.levels?.[1] ?? []).map(parseWsBookLevel);
  return {
    bids: takeTopLevels(bids, topN),
    asks: takeTopLevels(asks, topN),
  };
}

export function sumTopDepthUsd(levels: BookLevel[]): number {
  return levels.reduce((sum, l) => sum + l.px * l.sz, 0);
}

/** Walk Top-N book side for notional — return impact bps vs mid. */
export function walkTopBookImpact(
  levels: BookLevel[],
  midPx: number,
  notionalUsd: number,
  side: DepthProbeSide,
): Top3WalkFill {
  let remaining = notionalUsd;
  let filledUsd = 0;
  let filledQty = 0;

  for (const level of levels) {
    if (!(level.px > 0 && level.sz > 0)) continue;
    const levelUsd = level.px * level.sz;
    const takeUsd = Math.min(remaining, levelUsd);
    filledUsd += takeUsd;
    filledQty += takeUsd / level.px;
    remaining -= takeUsd;
    if (remaining <= 1e-9) break;
  }

  const topDepthUsd = sumTopDepthUsd(levels);

  if (filledQty <= 0 || filledUsd <= 0 || !(midPx > 0)) {
    return {
      filledUsd,
      filledQty,
      avgPx: midPx,
      impactBps: Number.POSITIVE_INFINITY,
      topDepthUsd,
    };
  }

  const avgPx = filledUsd / filledQty;
  const rawImpact =
    side === "buy"
      ? (avgPx - midPx) / midPx
      : (midPx - avgPx) / midPx;
  const impactBps = Math.max(0, rawImpact) * 10_000;

  return {
    filledUsd,
    filledQty,
    avgPx,
    impactBps,
    topDepthUsd,
  };
}

/** Pure Top-3 depth evaluation from bid/ask ladders. */
export function evaluateTop3Depth(
  input: Top3DepthProbeInput,
): Omit<Top3DepthProbeResult, "leadMs" | "probedAt"> {
  const orderUsd = input.orderUsd ?? DEPTH_PROBE_ORDER_USD;
  const maxSlippageBps = input.maxSlippageBps ?? DEPTH_PROBE_MAX_SLIPPAGE_BPS;
  const topN = input.topN ?? DEPTH_PROBE_TOP_N;
  const bids = takeTopLevels(input.bids, topN);
  const asks = takeTopLevels(input.asks, topN);

  const bestBid = bids[0]?.px ?? 0;
  const bestAsk = asks[0]?.px ?? 0;
  const midPx =
    bestBid > 0 && bestAsk > 0 ? (bestBid + bestAsk) / 2 : bestBid || bestAsk;

  const levels = input.side === "buy" ? asks : bids;
  const walk = walkTopBookImpact(levels, midPx, orderUsd, input.side);

  const reasons: string[] = [];
  let sufficient = true;

  if (!(bestBid > 0 && bestAsk > 0)) {
    sufficient = false;
    reasons.push("TOP3_BOOK_EMPTY");
  }
  if (walk.filledUsd + 1e-6 < orderUsd) {
    sufficient = false;
    reasons.push(
      `TOP3_DEPTH_INSUFFICIENT:filled=$${walk.filledUsd.toFixed(2)}<order=$${orderUsd}`,
    );
  }
  if (walk.impactBps > maxSlippageBps) {
    sufficient = false;
    reasons.push(
      `TOP3_SLIPPAGE=${walk.impactBps.toFixed(2)}bps>${maxSlippageBps}bps`,
    );
  }
  if (sufficient) {
    reasons.push(
      `TOP3_OK:impact=${walk.impactBps.toFixed(2)}bps:depth=$${walk.topDepthUsd.toFixed(0)}`,
    );
  }

  return {
    sufficient,
    side: input.side,
    orderUsd,
    maxSlippageBps,
    impactBps: walk.impactBps,
    filledUsd: walk.filledUsd,
    top3DepthUsd: walk.topDepthUsd,
    bestBid,
    bestAsk,
    midPx,
    reasons,
  };
}

export function evaluateTop3DepthFromWsBook(
  book: WsBookData,
  side: DepthProbeSide,
  options?: {
    orderUsd?: number;
    maxSlippageBps?: number;
    topN?: number;
  },
): Omit<Top3DepthProbeResult, "leadMs" | "probedAt"> {
  const { bids, asks } = levelsFromWsBook(book, options?.topN);
  return evaluateTop3Depth({
    bids,
    asks,
    side,
    orderUsd: options?.orderUsd,
    maxSlippageBps: options?.maxSlippageBps,
    topN: options?.topN,
  });
}

/**
 * Wait `leadMs` (default 50ms) then snapshot WS L2 book Top-3 for pre-execution gate.
 */
export async function probeWsTop3DepthBeforeExecution(input: {
  getBook: () => WsBookData | null;
  side: DepthProbeSide;
  orderUsd?: number;
  maxSlippageBps?: number;
  leadMs?: number;
  now?: () => number;
  sleep?: (ms: number) => Promise<void>;
}): Promise<Top3DepthProbeResult> {
  const leadMs = input.leadMs ?? DEPTH_PROBE_LEAD_MS;
  const sleep =
    input.sleep ?? ((ms: number) => new Promise((r) => setTimeout(r, ms)));
  const now = input.now ?? (() => Date.now());

  await sleep(leadMs);
  const probedAt = now();
  const book = input.getBook();

  if (!book) {
    return {
      sufficient: false,
      side: input.side,
      orderUsd: input.orderUsd ?? DEPTH_PROBE_ORDER_USD,
      maxSlippageBps: input.maxSlippageBps ?? DEPTH_PROBE_MAX_SLIPPAGE_BPS,
      impactBps: Number.POSITIVE_INFINITY,
      filledUsd: 0,
      top3DepthUsd: 0,
      bestBid: 0,
      bestAsk: 0,
      midPx: 0,
      leadMs,
      probedAt,
      reasons: ["WS_L2_BOOK_UNAVAILABLE"],
    };
  }

  const evaluated = evaluateTop3DepthFromWsBook(book, input.side, {
    orderUsd: input.orderUsd,
    maxSlippageBps: input.maxSlippageBps,
  });

  return { ...evaluated, leadMs, probedAt };
}
