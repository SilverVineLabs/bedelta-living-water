/** GMX v2 markets/info fetch — gmxinfra REST only (fail-closed, no synthetic pool fallback). */

import {
  GMX_ALLOWED_HOSTS,
  GMX_MARKETS_INFO_URL,
  type GmxMarketInfo,
} from "../../adapters/gmx";
import { assertRpcAllowlisted, BROWSER_MIMIC_USER_AGENT } from "../defense/rpc-whitelist";
import type { GmxV2AdapterOptions, GmxV2MarketsInfoResponse } from "./gmx-v2-adapter.types";
import { ARBITRUM_RPC_URL } from "./gmx-v2-rpc-constants";
import { GMX_RPC_PROBE_TTL_MS } from "./gmx-v2-rpc";

export const GMX_ARBITRUM_RPC_FALLBACK_URLS = [
  ARBITRUM_RPC_URL,
  "https://rpc.ankr.com/arbitrum",
] as const;

const GMX_MARKETS_INFO_TIMEOUT_MS = 8_000 as const;
const GMX_API_LIQUIDITY_SCALE = 1e24 as const;

type GmxMarketApiRow = GmxMarketInfo & Record<string, unknown>;

let marketsCache: { at: number; markets: GmxMarketInfo[] } | null = null;

export function __resetGmxMarketsCacheForTests(): void {
  marketsCache = null;
}

function shouldRetryMarketsHttp(status: number): boolean {
  return status === 503 || status >= 500;
}

function normalizeGmxMarketFromApi(raw: GmxMarketApiRow): GmxMarketInfo {
  const longPool =
    raw.longPoolAmount ??
    (typeof raw.poolAmountLong === "string" || typeof raw.poolAmountLong === "number"
      ? String(raw.poolAmountLong)
      : undefined);
  const shortPool =
    raw.shortPoolAmount ??
    (typeof raw.poolAmountShort === "string" || typeof raw.poolAmountShort === "number"
      ? String(raw.poolAmountShort)
      : undefined);
  const liqLong = parseFloat(String(raw.availableLiquidityLong ?? "0"));
  const liqShort = parseFloat(String(raw.availableLiquidityShort ?? "0"));
  const poolFromLiq =
    liqLong > 0 || liqShort > 0 ? String((liqLong + liqShort) / GMX_API_LIQUIDITY_SCALE) : undefined;
  return {
    ...raw,
    longPoolAmount: longPool,
    shortPoolAmount: shortPool,
    poolValueMax: raw.poolValueMax ?? poolFromLiq,
    poolValueMin: raw.poolValueMin ?? poolFromLiq,
    borrowingFactorPerSecondForLongs:
      raw.borrowingFactorPerSecondForLongs ??
      (typeof raw.borrowingRateLong === "string" ? raw.borrowingRateLong : undefined),
    fundingFactorPerSecond:
      raw.fundingFactorPerSecond ??
      (typeof raw.fundingRateLong === "string" ? raw.fundingRateLong : undefined),
  };
}

async function fetchMarketsInfoHttp(
  url: string,
  opts: GmxV2AdapterOptions,
): Promise<GmxMarketInfo[] | null> {
  try {
    const res = opts.fetchFn
      ? await opts.fetchFn(url)
      : await (async () => {
          assertRpcAllowlisted(url, GMX_ALLOWED_HOSTS);
          return fetch(url, {
            headers: {
              Accept: "application/json, text/plain, */*",
              "User-Agent": BROWSER_MIMIC_USER_AGENT,
            },
            signal: AbortSignal.timeout(GMX_MARKETS_INFO_TIMEOUT_MS),
          });
        })();
    if (!res.ok) {
      if (shouldRetryMarketsHttp(res.status)) return null;
      throw new Error(`GMX markets/info HTTP ${res.status}`);
    }
    const body = (await res.json()) as GmxV2MarketsInfoResponse | GmxMarketInfo[];
    const rows = Array.isArray(body) ? body : (body.markets ?? []);
    const markets = rows.map((row) => normalizeGmxMarketFromApi(row as GmxMarketApiRow));
    return markets.length > 0 ? markets : null;
  } catch {
    return null;
  }
}

export async function fetchMarketsInfo(opts: GmxV2AdapterOptions): Promise<GmxMarketInfo[]> {
  const now = opts.now?.() ?? Date.now();
  if (marketsCache && now - marketsCache.at < GMX_RPC_PROBE_TTL_MS) {
    return marketsCache.markets;
  }
  const url = opts.marketsUrl ?? GMX_MARKETS_INFO_URL;
  const live = await fetchMarketsInfoHttp(url, opts);
  if (!live) {
    if (marketsCache?.markets.length) return marketsCache.markets;
    throw new Error(
      "GMX markets/info unavailable — fail-closed (no synthetic pool fallback; degraded=true)",
    );
  }
  marketsCache = { at: now, markets: live };
  return live;
}
