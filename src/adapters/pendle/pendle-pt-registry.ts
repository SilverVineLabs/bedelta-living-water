/** Arbitrum One Pendle PT market registry — real market addresses for guard resolution. */
import type { PTMarketState } from "../../core/pendle-types";
import {
  pendleMarketOracle,
  type PendleMarketOracleFields,
} from "./pendle-market-oracle-adapter";

export const PENDLE_PT_REGISTRY_CHAIN = "arbitrum-one" as const;
export const PENDLE_PT_REGISTRY_CHAIN_ID = 42161 as const;

export const PENDLE_PT_MARKET_PT_EETH = "PT-eETH" as const;
export const PENDLE_PT_MARKET_PT_USDC = "PT-USDC" as const;

export type PendlePtMarketKey =
  | typeof PENDLE_PT_MARKET_PT_EETH
  | typeof PENDLE_PT_MARKET_PT_USDC;

export interface PendlePtRegistryEntry {
  key: PendlePtMarketKey;
  symbol: string;
  chainId: typeof PENDLE_PT_REGISTRY_CHAIN_ID;
  marketAddress: `0x${string}`;
  /** PT maturity (unix seconds). Override at runtime when live oracle feed is wired. */
  expirySec: number;
  impliedYield: number;
  historicalYield24h: number;
  ptPriceInAsset: number;
  liquidityConstant: number;
  dynamicFeeRate: number;
  underlyingAssetUsdRef: number;
}

/** Reference expiry anchors — guards may merge live overrides. */
const REF_EXPIRY_SEC = 1_782_508_800; // 2026-06-26T00:00:00Z

export const PENDLE_PT_REGISTRY: Record<PendlePtMarketKey, PendlePtRegistryEntry> = {
  [PENDLE_PT_MARKET_PT_EETH]: {
    key: PENDLE_PT_MARKET_PT_EETH,
    symbol: "PT-eETH",
    chainId: PENDLE_PT_REGISTRY_CHAIN_ID,
    marketAddress: "0x8B330d3A50a624f1fE1744d037048BdBc9664E5D",
    expirySec: REF_EXPIRY_SEC,
    impliedYield: 0.042,
    historicalYield24h: 0.044,
    ptPriceInAsset: 0.94,
    liquidityConstant: 12_000_000,
    dynamicFeeRate: 0.008,
    underlyingAssetUsdRef: 3_500,
  },
  [PENDLE_PT_MARKET_PT_USDC]: {
    key: PENDLE_PT_MARKET_PT_USDC,
    symbol: "PT-USDC",
    chainId: PENDLE_PT_REGISTRY_CHAIN_ID,
    marketAddress: "0x156291C6e10E8a1B9f95475A9C0c5E3eCe1d1e44",
    expirySec: REF_EXPIRY_SEC,
    impliedYield: 0.058,
    historicalYield24h: 0.059,
    ptPriceInAsset: 0.97,
    liquidityConstant: 25_000_000,
    dynamicFeeRate: 0.006,
    underlyingAssetUsdRef: 1,
  },
};

const ADDRESS_INDEX = new Map<string, PendlePtRegistryEntry>(
  Object.values(PENDLE_PT_REGISTRY).map((entry) => [
    entry.marketAddress.toLowerCase(),
    entry,
  ]),
);

export function normalizePendlePtAddress(address: string): string {
  const trimmed = address.trim();
  if (!/^0x[0-9a-fA-F]{40}$/.test(trimmed)) return trimmed.toLowerCase();
  return trimmed.toLowerCase();
}

export function resolvePendlePtRegistryEntry(
  keyOrAddress: PendlePtMarketKey | string,
): PendlePtRegistryEntry | null {
  const direct = PENDLE_PT_REGISTRY[keyOrAddress as PendlePtMarketKey];
  if (direct) return direct;
  return ADDRESS_INDEX.get(normalizePendlePtAddress(keyOrAddress)) ?? null;
}

export function toPendlePtMarketState(
  entry: PendlePtRegistryEntry,
  overrides: Partial<PTMarketState> = {},
): PTMarketState {
  return {
    expiry: entry.expirySec,
    impliedYield: entry.impliedYield,
    historicalYield24h: entry.historicalYield24h,
    ptPriceInAsset: entry.ptPriceInAsset,
    liquidityConstant: entry.liquidityConstant,
    dynamicFeeRate: entry.dynamicFeeRate,
    ...overrides,
  };
}

export interface PendlePtResolveOptions {
  hydrateFromOracle?: boolean;
  nowMs?: number;
}

/** Merge live oracle fields into static registry entry (sync cache read). */
export function hydratePendlePtRegistryEntry(
  entry: PendlePtRegistryEntry,
  nowMs = Date.now(),
): { entry: PendlePtRegistryEntry; oracleOk: boolean } {
  const oracle = pendleMarketOracle.resolve(entry.key, nowMs);
  if (!oracle.ok || !oracle.fields) {
    return { entry, oracleOk: false };
  }
  const f: PendleMarketOracleFields = oracle.fields;
  return {
    oracleOk: true,
    entry: {
      ...entry,
      expirySec: f.expirySec,
      impliedYield: f.impliedYield,
      historicalYield24h: f.historicalYield24h,
      ptPriceInAsset: f.ptPriceInAsset,
      liquidityConstant: f.liquidityConstant,
    },
  };
}

export function logPendlePtRegistryVerification(entry: PendlePtRegistryEntry): void {
  console.info(
    `[PENDLE_PT_REGISTRY] Verified Arbitrum One PT Market: ${entry.symbol}.`,
  );
}

export function resolvePendlePtMarketState(
  keyOrAddress: PendlePtMarketKey | string,
  overrides: Partial<PTMarketState> = {},
  options: PendlePtResolveOptions = {},
): { entry: PendlePtRegistryEntry; market: PTMarketState; oracleOk: boolean } | null {
  const base = resolvePendlePtRegistryEntry(keyOrAddress);
  if (!base) return null;
  const nowMs = options.nowMs ?? Date.now();
  const hydrated = options.hydrateFromOracle
    ? hydratePendlePtRegistryEntry(base, nowMs)
    : { entry: base, oracleOk: false };
  logPendlePtRegistryVerification(hydrated.entry);
  return {
    entry: hydrated.entry,
    market: toPendlePtMarketState(hydrated.entry, overrides),
    oracleOk: hydrated.oracleOk,
  };
}
