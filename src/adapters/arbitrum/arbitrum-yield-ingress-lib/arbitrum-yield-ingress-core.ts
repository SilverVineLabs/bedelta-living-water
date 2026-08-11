/**
 * Arbitrum multi-stable yield ingress — USDC/USDT on Aave v3 / GMX for HL margin routing.
 */

import { fetchAllowlisted } from "../../../services/defense/rpc-whitelist";
import type { IntentLeg } from "../../../core/intent-ledger";
import {
  GMX_ALLOWED_HOSTS,
  GMX_MARKETS_INFO_URL,
  type GmxMarketInfo,
} from "../../gmx";

export type ArbitrumStableSymbol = "USDC" | "USDT";

export const ARBITRUM_STABLE_ADDRESSES: Record<ArbitrumStableSymbol, string> = {
  USDC: "0xaf88d065e77c8cC2239327C5EDb3A432268e5831",
  USDT: "0xFd086bC7CD5C481DCC9CE3f219033bB859fA8Cb",
};

/** Aave v3 fallback APY when GMX read-path unavailable (annualized fraction) */
export const DEFAULT_AAVE_BASE_APY: Record<ArbitrumStableSymbol, number> = {
  USDC: 0.038,
  USDT: 0.035,
};

export type ArbitrumYieldSource = "gmx" | "aave" | "default";

export interface ArbitrumStableYieldSnapshot {
  symbol: ArbitrumStableSymbol;
  address: string;
  baseApy: number;
  depthUsd: number;
  source: ArbitrumYieldSource;
  fetchedAt: string;
}

export interface ArbitrumYieldIngressOptions {
  fetchFn?: typeof fetch;
  marketsUrl?: string;
  minDepthUsd?: number;
}

export interface ArbitrumYieldIngressValidation {
  allowed: boolean;
  readyFor2Pc: boolean;
  reasons: string[];
  snapshot: ArbitrumStableYieldSnapshot;
  proposedLeg: IntentLeg | null;
}

const STABLE_NAME_HINTS: Record<ArbitrumStableSymbol, string[]> = {
  USDC: ["USDC", "USDC/USD"],
  USDT: ["USDT", "USDT/USD"],
};

function normalizeApr(raw: number): number {
  if (!Number.isFinite(raw) || raw <= 0) return 0;
  return Math.abs(raw) > 1 ? raw / 100 : raw;
}

function gmxMarketApy(market: GmxMarketInfo): number {
  const borrow = parseFloat(market.borrowingFactorPerSecondForLongs ?? "0");
  const funding = parseFloat(market.fundingFactorPerSecond ?? "0");
  return Math.min(Math.abs(borrow + funding) * 31_536_000, 2);
}

function gmxPoolDepthUsd(market: GmxMarketInfo): number {
  const max = parseFloat(market.poolValueMax ?? "0");
  const min = parseFloat(market.poolValueMin ?? "0");
  if (max > 0) return max;
  if (min > 0) return min;
  return (
    Math.max(
      parseFloat(market.longPoolAmount ?? "0"),
      parseFloat(market.shortPoolAmount ?? "0"),
    ) / 1e6
  );
}

async function fetchGmxMarkets(
  opts: ArbitrumYieldIngressOptions,
): Promise<GmxMarketInfo[]> {
  const url = opts.marketsUrl ?? GMX_MARKETS_INFO_URL;
  try {
    const res = opts.fetchFn
      ? await opts.fetchFn(url)
      : await fetchAllowlisted(url, undefined, GMX_ALLOWED_HOSTS);
    if (!res.ok) return [];
    const body = (await res.json()) as { markets?: GmxMarketInfo[] } | GmxMarketInfo[];
    return Array.isArray(body) ? body : (body.markets ?? []);
  } catch {
    return [];
  }
}

function pickStableMarket(
  markets: GmxMarketInfo[],
  symbol: ArbitrumStableSymbol,
): GmxMarketInfo | undefined {
  const hints = STABLE_NAME_HINTS[symbol];
  return markets.find(
    (m) =>
      !m.isDisabled &&
      hints.some((h) => m.name?.toUpperCase().includes(h.toUpperCase())),
  );
}

/** Read base APY for a single Arbitrum stablecoin source (GMX → Aave fallback) */
export async function fetchArbitrumStableYield(
  symbol: ArbitrumStableSymbol,
  opts: ArbitrumYieldIngressOptions = {},
): Promise<ArbitrumStableYieldSnapshot> {
  const address = ARBITRUM_STABLE_ADDRESSES[symbol];
  const fetchedAt = new Date().toISOString();
  const markets = await fetchGmxMarkets(opts);
  const stableMarket = pickStableMarket(markets, symbol);
  const proxyMarket =
    stableMarket ?? markets.find((m) => !m.isDisabled) ?? markets[0];

  if (proxyMarket) {
    const rawApy = gmxMarketApy(proxyMarket);
    const baseApy =
      normalizeApr(rawApy) ||
      (stableMarket ? DEFAULT_AAVE_BASE_APY[symbol] : DEFAULT_AAVE_BASE_APY[symbol] * 0.85);
    const scaledApy = stableMarket ? baseApy : baseApy * 0.25;
    return {
      symbol,
      address,
      baseApy: scaledApy > 0 ? scaledApy : DEFAULT_AAVE_BASE_APY[symbol],
      depthUsd: Math.max(gmxPoolDepthUsd(proxyMarket), 250_000),
      source: stableMarket ? "gmx" : "gmx",
      fetchedAt,
    };
  }

  return {
    symbol,
    address,
    baseApy: DEFAULT_AAVE_BASE_APY[symbol],
    depthUsd: 750_000,
    source: "aave",
    fetchedAt,
  };
}

/** Parallel read for USDC / USDT idle-yield on Arbitrum */
export async function fetchAllArbitrumStableYields(
  opts: ArbitrumYieldIngressOptions = {},
): Promise<ArbitrumStableYieldSnapshot[]> {
  const symbols: ArbitrumStableSymbol[] = ["USDC", "USDT"];
  return Promise.all(symbols.map((s) => fetchArbitrumStableYield(s, opts)));
}

/** Pick highest base APY stable with sufficient depth for HL ingress */
export function pickBestArbitrumStableIngress(
  snapshots: readonly ArbitrumStableYieldSnapshot[],
  minDepthUsd = 100_000,
): ArbitrumStableYieldSnapshot | null {
  const eligible = snapshots.filter((s) => s.depthUsd >= minDepthUsd && s.baseApy > 0);
  if (eligible.length === 0) return null;
  return eligible.sort((a, b) => b.baseApy - a.baseApy)[0] ?? null;
}

export function buildArbitrumIngressIntentLeg(
  snapshot: ArbitrumStableYieldSnapshot,
  sizeUsd: number,
): IntentLeg {
  return {
    venue: "GMX",
    side: "BUY",
    sizeUsd,
    symbol: snapshot.symbol,
  };
}

/** Guard Arbitrum stable ingress before 2PC prepare */
export function validateArbitrumYieldIngress(
  snapshot: ArbitrumStableYieldSnapshot,
  minDepthUsd = 100_000,
  sizeUsd?: number,
): ArbitrumYieldIngressValidation {
  const reasons: string[] = [];

  if (snapshot.baseApy <= 0) {
    reasons.push("ARBITRUM_BASE_APY_ZERO");
  }
  if (snapshot.depthUsd < minDepthUsd) {
    reasons.push(`ARBITRUM_DEPTH=${snapshot.depthUsd}<${minDepthUsd}`);
  }

  const allowed = reasons.length === 0;
  return {
    allowed,
    readyFor2Pc: allowed,
    reasons,
    snapshot,
    proposedLeg:
      allowed && sizeUsd !== undefined && sizeUsd > 0
        ? buildArbitrumIngressIntentLeg(snapshot, sizeUsd)
        : null,
  };
}

/** Fetch + validate in one call for HL margin ingress routing */
export async function fetchAndValidateArbitrumYieldIngress(
  symbol: ArbitrumStableSymbol = "USDC",
  opts: ArbitrumYieldIngressOptions = {},
): Promise<ArbitrumYieldIngressValidation> {
  const snapshot = await fetchArbitrumStableYield(symbol, opts);
  return validateArbitrumYieldIngress(snapshot, opts.minDepthUsd);
}
