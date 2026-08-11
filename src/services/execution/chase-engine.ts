/**
 * Post-Only (ALO) Maker Chase Engine — reprice every 100ms at Bid1/Ask1 until filled.
 * Falls back from market taker when Top-3 depth probe fails slippage gate.
 */

import {
  buildLimitOrderWire,
  formatHlPerpPrice,
  formatHlSize,
} from "../../adapters/hl/execution-wire";
import type { HlOrderWire } from "../../adapters/hl/execution-types";
import type { WsBookData } from "../../adapters/hl/websocket/types";
import {
  evaluateTop3DepthFromWsBook,
  type DepthProbeSide,
  type Top3DepthProbeResult,
} from "../hyperliquid/depth-probe";

/** Maker chase cancel/replace interval. */
export const CHASE_REPRICE_INTERVAL_MS = 100 as const;

/** Safety cap on chase iterations (~5s @ 100ms). */
export const CHASE_MAX_ATTEMPTS = 50 as const;

export type ExecutionRoute = "market_taker" | "alo_maker_chase";

export interface ChaseOrderSpec {
  asset: number;
  isBuy: boolean;
  size: number;
  szDecimals: number;
  reduceOnly?: boolean;
  cloid?: string;
}

export interface ChaseTickResult {
  attempt: number;
  limitPx: number;
  wire: HlOrderWire;
  filled: boolean;
  cancelled: boolean;
  reason: string;
}

export interface MakerChaseResult {
  route: ExecutionRoute;
  filled: boolean;
  attempts: number;
  finalLimitPx: number | null;
  ticks: ChaseTickResult[];
  probe: Top3DepthProbeResult;
  reasons: string[];
}

export interface MakerChaseDeps {
  submitOrder: (wire: HlOrderWire, attempt: number) => Promise<{ oid?: number }>;
  cancelOrder: (args: {
    asset: number;
    oid?: number;
    cloid?: string;
  }) => Promise<void>;
  getBook: () => WsBookData | null;
  isFilled: (args: { oid?: number; cloid?: string }) => Promise<boolean>;
  sleep?: (ms: number) => Promise<void>;
  repriceIntervalMs?: number;
  maxAttempts?: number;
}

/** Route to ALO chase when Top-3 probe fails slippage / depth gate. */
export function shouldUseMakerChase(probe: Top3DepthProbeResult): boolean {
  return !probe.sufficient;
}

export function resolveExecutionRoute(
  probe: Top3DepthProbeResult,
): ExecutionRoute {
  return shouldUseMakerChase(probe) ? "alo_maker_chase" : "market_taker";
}

/** Post-Only maker price — buy @ Bid1, sell @ Ask1. */
export function resolveAloMakerPrice(input: {
  isBuy: boolean;
  bestBid: number;
  bestAsk: number;
}): number {
  const { isBuy, bestBid, bestAsk } = input;
  if (isBuy) return bestBid > 0 ? bestBid : bestAsk;
  return bestAsk > 0 ? bestAsk : bestBid;
}

/** Reprice toward live Top-of-book (chase Bid1/Ask1). */
export function computeNextChasePrice(input: {
  isBuy: boolean;
  currentPx: number;
  bestBid: number;
  bestAsk: number;
}): number {
  if (input.isBuy) {
    return Math.max(input.currentPx, input.bestBid);
  }
  return input.currentPx > 0
    ? Math.min(input.currentPx, input.bestAsk)
    : input.bestAsk;
}

export function buildAloChaseWire(
  spec: ChaseOrderSpec,
  limitPx: number,
): HlOrderWire {
  const px = formatHlPerpPrice(limitPx, spec.szDecimals);
  const sz = formatHlSize(spec.size, spec.szDecimals);
  return buildLimitOrderWire({
    asset: spec.asset,
    isBuy: spec.isBuy,
    size: sz,
    limitPx: px,
    reduceOnly: spec.reduceOnly,
    tif: "Alo",
    cloid: spec.cloid,
  });
}

function bookTopPrices(book: WsBookData | null): {
  bestBid: number;
  bestAsk: number;
} {
  if (!book) return { bestBid: 0, bestAsk: 0 };
  const bid = parseFloat(book.levels?.[0]?.[0]?.px ?? "0");
  const ask = parseFloat(book.levels?.[1]?.[0]?.px ?? "0");
  return { bestBid: bid, bestAsk: ask };
}

/** Single chase tick — build ALO wire at current Bid1/Ask1. */
export function planChaseTick(
  spec: ChaseOrderSpec,
  book: WsBookData | null,
  attempt: number,
  previousPx = 0,
): ChaseTickResult {
  const { bestBid, bestAsk } = bookTopPrices(book);
  const limitPx = computeNextChasePrice({
    isBuy: spec.isBuy,
    currentPx: previousPx,
    bestBid,
    bestAsk,
  });
  const resolvedPx = resolveAloMakerPrice({
    isBuy: spec.isBuy,
    bestBid,
    bestAsk,
  });
  const px = limitPx > 0 ? limitPx : resolvedPx;
  return {
    attempt,
    limitPx: px,
    wire: buildAloChaseWire(spec, px),
    filled: false,
    cancelled: false,
    reason: `CHASE_ALO:${spec.isBuy ? "BID1" : "ASK1"}@${px}`,
  };
}

/**
 * Run Post-Only maker chase — reprice every 100ms until filled or max attempts.
 */
export async function runMakerChaseUntilFilled(
  spec: ChaseOrderSpec,
  probe: Top3DepthProbeResult,
  deps: MakerChaseDeps,
): Promise<MakerChaseResult> {
  const sleep =
    deps.sleep ?? ((ms: number) => new Promise((r) => setTimeout(r, ms)));
  const interval = deps.repriceIntervalMs ?? CHASE_REPRICE_INTERVAL_MS;
  const maxAttempts = deps.maxAttempts ?? CHASE_MAX_ATTEMPTS;
  const ticks: ChaseTickResult[] = [];
  const reasons: string[] = [...probe.reasons];

  if (!shouldUseMakerChase(probe)) {
    return {
      route: "market_taker",
      filled: false,
      attempts: 0,
      finalLimitPx: null,
      ticks,
      probe,
      reasons: ["MAKER_CHASE_SKIP:TOP3_SUFFICIENT"],
    };
  }

  reasons.push("MAKER_CHASE:ALO_POST_ONLY");
  let previousPx = 0;
  let lastOid: number | undefined;
  let finalLimitPx: number | null = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const book = deps.getBook();
    const tick = planChaseTick(spec, book, attempt, previousPx);
    previousPx = tick.limitPx;
    finalLimitPx = tick.limitPx;

    if (lastOid !== undefined) {
      await deps.cancelOrder({ asset: spec.asset, oid: lastOid, cloid: spec.cloid });
      tick.cancelled = true;
    }

    const submitted = await deps.submitOrder(tick.wire, attempt);
    lastOid = submitted.oid;

    const filled = await deps.isFilled({ oid: submitted.oid, cloid: spec.cloid });
    tick.filled = filled;
    ticks.push(tick);

    if (filled) {
      reasons.push(`MAKER_CHASE_FILLED:attempt=${attempt}`);
      return {
        route: "alo_maker_chase",
        filled: true,
        attempts: attempt,
        finalLimitPx,
        ticks,
        probe,
        reasons,
      };
    }

    if (attempt < maxAttempts) {
      await sleep(interval);
    }
  }

  reasons.push(`MAKER_CHASE_TIMEOUT:attempts=${maxAttempts}`);
  return {
    route: "alo_maker_chase",
    filled: false,
    attempts: maxAttempts,
    finalLimitPx,
    ticks,
    probe,
    reasons,
  };
}

/** Build probe from WS book for chase routing decision. */
export function probeForChaseRoute(
  book: WsBookData | null,
  side: DepthProbeSide,
  orderUsd?: number,
): Top3DepthProbeResult {
  if (!book) {
    return {
      sufficient: false,
      side,
      orderUsd: orderUsd ?? 300,
      maxSlippageBps: 2,
      impactBps: Number.POSITIVE_INFINITY,
      filledUsd: 0,
      top3DepthUsd: 0,
      bestBid: 0,
      bestAsk: 0,
      midPx: 0,
      leadMs: 0,
      probedAt: Date.now(),
      reasons: ["WS_L2_BOOK_UNAVAILABLE"],
    };
  }
  const evaluated = evaluateTop3DepthFromWsBook(book, side, { orderUsd });
  return { ...evaluated, leadMs: 0, probedAt: Date.now() };
}
