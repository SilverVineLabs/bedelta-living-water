import { HL_INFO_URL } from "../../src/config/constants";
import { fetchAllowlisted } from "../../src/services/defense/rpc-whitelist";
import type { HlL2BookResponse } from "../../src/services/exchanges/hyperliquid-adapter";
import {
  BINANCE_KLINES,
  COIN,
  UA,
  type Candle,
  type FundingPoint,
  type HlAssetCtx,
} from "./survival-benchmark.types";

export async function postHlInfo<T>(body: Record<string, unknown>): Promise<T> {
  const res = await fetchAllowlisted(HL_INFO_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...UA },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(60_000),
  });
  if (!res.ok) {
    throw new Error(`HL info ${body.type} HTTP ${res.status}`);
  }
  return (await res.json()) as T;
}

export async function fetchFundingHistory(
  coin: string,
  startMs: number,
  endMs: number,
): Promise<FundingPoint[]> {
  const out: FundingPoint[] = [];
  let cursor = startMs;
  while (cursor < endMs) {
    const chunk = await postHlInfo<FundingPoint[]>({
      type: "fundingHistory",
      coin,
      startTime: cursor,
      endTime: endMs,
    });
    if (!chunk.length) break;
    out.push(...chunk);
    const last = chunk[chunk.length - 1]!.time;
    if (last <= cursor) break;
    cursor = last + 1;
    if (chunk.length < 500) break;
  }
  const seen = new Set<number>();
  return out.filter((p) => {
    if (seen.has(p.time)) return false;
    seen.add(p.time);
    return true;
  });
}

export async function fetchCandles(
  interval: "1m" | "1h",
  startMs: number,
  endMs: number,
): Promise<Candle[]> {
  const stepMs = interval === "1m" ? 2 * 86_400_000 : 10 * 86_400_000;
  const out: Candle[] = [];
  for (let t = startMs; t < endMs; t += stepMs) {
    const chunkEnd = Math.min(t + stepMs, endMs);
    const chunk = await postHlInfo<Candle[]>({
      type: "candleSnapshot",
      req: {
        coin: COIN,
        interval,
        startTime: t,
        endTime: chunkEnd,
      },
    });
    if (!chunk.length) continue;
    const before = out.length;
    for (const c of chunk) out.push(c);
    if (
      interval === "1m" &&
      out.length === before + chunk.length &&
      chunk.length >= 5000
    ) {
      break;
    }
  }
  const seen = new Set<number>();
  return out
    .filter((c) => {
      if (seen.has(c.t)) return false;
      seen.add(c.t);
      return true;
    })
    .sort((a, b) => a.t - b.t);
}

/** Binance USDT-M klines — script-only (not Edge allowlist). */
export async function fetchBinanceCloses1h(
  startMs: number,
  endMs: number,
): Promise<Map<number, number>> {
  const out = new Map<number, number>();
  let cursor = startMs;
  while (cursor < endMs) {
    const url = `${BINANCE_KLINES}?symbol=ETHUSDT&interval=1h&startTime=${cursor}&endTime=${endMs}&limit=1000`;
    const res = await fetch(url, {
      headers: { ...UA },
      signal: AbortSignal.timeout(60_000),
    });
    if (!res.ok) break;
    const rows = (await res.json()) as Array<[number, string, string, string, string]>;
    if (!Array.isArray(rows) || !rows.length) break;
    for (const row of rows) {
      const t = Number(row[0]);
      const c = Number(row[4]);
      if (t > 0 && c > 0) out.set(Math.floor(t / 3_600_000) * 3_600_000, c);
    }
    const last = Number(rows[rows.length - 1]![0]);
    if (last <= cursor) break;
    cursor = last + 1;
    if (rows.length < 1000) break;
  }
  return out;
}

export async function fetchEthMeta(): Promise<{
  maxLeverage: number;
  assetCtx: HlAssetCtx;
}> {
  const [meta, ctxs] = await postHlInfo<
    [{ universe: Array<{ name: string; maxLeverage: number }> }, HlAssetCtx[]]
  >({ type: "metaAndAssetCtxs" });
  const idx = meta.universe.findIndex((a) => a.name === COIN);
  if (idx < 0) throw new Error("ETH not in meta universe");
  return {
    maxLeverage: meta.universe[idx]!.maxLeverage,
    assetCtx: ctxs[idx]!,
  };
}

export async function fetchL2Book(): Promise<HlL2BookResponse> {
  return postHlInfo<HlL2BookResponse>({ type: "l2Book", coin: COIN });
}
