import type { HyperliquidMetaAndAssetCtxs } from "../../../types/matrix";
import {
  placeTradFiAsset,
  type TradFiBucket,
} from "../asset-classifier";

export interface TradFiAssetEnrichment {
  hlSymbol: string;
  /** Live mark / mid price from xyz meta */
  markPrice?: number;
  change24h_pct?: number;
  /** Raw OI size (contracts / base units) */
  openInterest?: number;
  /** OI size × mark price — USDC notional for king ranking */
  openInterestNotionalUsd?: number;
  /** Hourly funding rate from xyz meta (HL API `ctx.funding` = per-hour decimal) */
  fundingRateHourly?: number;
  /** 8h funding as percentage (= hourly × 8 × 100, matches HL UI "8h Funding") */
  fundingRate8h_pct?: number;
  /** UI highlight alias (e.g. Pre-IPO spotlight) — never a fetch filter */
  isHighlight?: boolean;
}

export interface TradFiOiKing {
  key: string;
  hlSymbol: string;
  /** Notional OI in USDC (size × mark) */
  openInterestNotionalUsd: number;
  displayName: string;
}

export type TradFiCategoryKey =
  | "commodities"
  | "stocks"
  | "indices"
  | "fx"
  | "preipo";

export interface TradFiEnrichmentPack {
  commodities: Record<string, TradFiAssetEnrichment>;
  stocks: Record<string, TradFiAssetEnrichment>;
  indices: Record<string, TradFiAssetEnrichment>;
  fx: Record<string, TradFiAssetEnrichment>;
  preipo: Record<string, TradFiAssetEnrichment>;
  kings: Partial<Record<TradFiCategoryKey, TradFiOiKing>>;
}

const CATEGORY_BUCKET: Record<TradFiBucket, TradFiCategoryKey> = {
  commodity: "commodities",
  stock: "stocks",
  index: "indices",
  fx: "fx",
  preipo: "preipo",
};

const DISPLAY_NAMES: Record<string, string> = {
  brent: "BRENT",
  wti: "WTI",
  gold: "GOLD",
  silver: "SILVER",
  copper: "COPPER",
  natgas: "NATGAS",
  platinum: "PLATINUM",
  palladium: "PALLADIUM",
  aluminium: "ALUMINIUM",
  urnm: "URNM",
  nvda: "NVDA",
  samsung: "SAMSUNG",
  smsn: "SMSN",
  googl: "GOOGL",
  goog: "GOOG",
  msft: "MSFT",
  intc: "INTC",
  crcl: "CRCL",
  aapl: "AAPL",
  tsla: "TSLA",
  meta: "META",
  amzn: "AMZN",
  tsmc: "TSMC",
  tsm: "TSM",
  mu: "MU",
  skhynix: "SKHYNIX",
  dram: "DRAM",
  sndk: "SNDK",
  amd: "AMD",
  xyz100: "XYZ100",
  sp500: "SP500",
  us500: "US500",
  jp225: "JP225",
  kr200: "KR200",
  qqq: "QQQ",
  usdjpy: "USDJPY",
  eurusd: "EURUSD",
  gbpusd: "GBPUSD",
  usdkrw: "USDKRW",
  dxy: "DXY",
  cxmt: "CXMT",
  qnt: "QNT",
};

function displayNameForKey(key: string): string {
  return DISPLAY_NAMES[key.toLowerCase()] ?? key.toUpperCase();
}

function upsertAsset(
  bucket: Record<string, TradFiAssetEnrichment>,
  key: string,
  hlSymbol: string,
  markPrice: number,
  change24h_pct: number | undefined,
  openInterest: number | undefined,
  fundingRateHourly: number | undefined,
  isHighlight?: boolean,
): void {
  const oiSize = openInterest ?? 0;
  const notional =
    markPrice > 0 && oiSize > 0 ? markPrice * oiSize : 0;
  const fr8h =
    Number.isFinite(fundingRateHourly) && fundingRateHourly !== undefined
      ? fundingRateHourly * 8 * 100
      : undefined;
  const existing = bucket[key];
  const existingNotional = existing?.openInterestNotionalUsd ?? 0;
  // Prefer higher OI notional when colliding on the same canonical key
  if (existing && existingNotional > notional) {
    if (isHighlight && !existing.isHighlight) {
      existing.isHighlight = true;
    }
    return;
  }
  bucket[key] = {
    hlSymbol,
    markPrice,
    change24h_pct,
    openInterest: oiSize > 0 ? oiSize : existing?.openInterest,
    openInterestNotionalUsd:
      notional > 0 ? notional : existing?.openInterestNotionalUsd,
    fundingRateHourly:
      Number.isFinite(fundingRateHourly) ? fundingRateHourly : existing?.fundingRateHourly,
    fundingRate8h_pct:
      fr8h !== undefined ? fr8h : existing?.fundingRate8h_pct,
    isHighlight: isHighlight || existing?.isHighlight,
  };
}

function pickKing(
  bucket: Record<string, TradFiAssetEnrichment>,
): TradFiOiKing | undefined {
  let bestKey = "";
  let bestNotional = 0;
  let bestHl = "";
  for (const [key, asset] of Object.entries(bucket)) {
    const notional = asset.openInterestNotionalUsd ?? 0;
    if (notional > bestNotional) {
      bestNotional = notional;
      bestKey = key;
      bestHl = asset.hlSymbol;
    }
  }
  if (bestNotional <= 0 || !bestKey) return undefined;
  return {
    key: bestKey,
    hlSymbol: bestHl,
    openInterestNotionalUsd: bestNotional,
    displayName: displayNameForKey(bestKey),
  };
}

/**
 * Parse FULL xyz dex metaAndAssetCtxs universe.
 * No keyword / whitelist fetch filter — classify every mid, sort/Top-N happens at UI.
 */
export function parseTradFiEnrichmentFromXyzMeta(
  raw: HyperliquidMetaAndAssetCtxs,
  _logs: string[] = [],
): TradFiEnrichmentPack {
  const pack: TradFiEnrichmentPack = {
    commodities: {},
    stocks: {},
    indices: {},
    fx: {},
    preipo: {},
    kings: {},
  };

  const universe = raw[0]?.universe ?? [];
  const ctxs = raw[1] ?? [];

  for (let i = 0; i < universe.length; i++) {
    const name = universe[i]?.name ?? "";
    const ctx = ctxs[i] ?? {};
    const mid = parseFloat(ctx.midPx ?? ctx.oraclePx ?? "0");
    const prev = parseFloat(ctx.prevDayPx ?? "0");
    const oi = parseFloat(ctx.openInterest ?? "0");
    const funding = parseFloat(ctx.funding ?? "0");

    if (!Number.isFinite(mid) || mid <= 0) continue;

    // Full xyz universe: include every asset with a live mid (OI optional; no keyword filter)
    const placement = placeTradFiAsset(name, { assumeTradFiUniverse: true });
    if (!placement) continue;

    let change24h_pct: number | undefined;
    if (Number.isFinite(prev) && prev > 0) {
      change24h_pct = ((mid - prev) / prev) * 100;
    }

    const bucketKey = CATEGORY_BUCKET[placement.category];
    const bucket = pack[bucketKey] as Record<string, TradFiAssetEnrichment>;
    upsertAsset(
      bucket,
      placement.key,
      placement.hlSymbol,
      mid,
      change24h_pct,
      Number.isFinite(oi) && oi > 0 ? oi : undefined,
      Number.isFinite(funding) ? funding : undefined,
      placement.isHighlight,
    );
  }

  for (const cat of [
    "commodities",
    "stocks",
    "indices",
    "fx",
    "preipo",
  ] as const) {
    const king = pickKing(pack[cat]);
    if (king) pack.kings[cat] = king;
  }

  return pack;
}
