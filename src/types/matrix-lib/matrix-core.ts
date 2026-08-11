/** Action codes consumed by the dashboard action-style renderer */
export type ActionStatus =
  | "BUY_HL_SPOT_SHORT_HL_PERP"
  | "SHORT_HL_SPOT_LONG_HL_PERP"
  | "SPREAD_TOO_HIGH"
  | "HOLD"
  | "RULE_B_HIGH_RATE";

/** Per-symbol price / funding maps from exchange adapters (Hyperliquid + cross-venue) */
export interface ExchangePriceMaps {
  hlSpot: Record<string, number>;
  hlPerp: Record<string, number>;
  /** dYdX v4 perp mids — required for cross-venue soil resistance */
  dydxPerp: Record<string, number>;
  hlFunding: Record<string, number>;
  /** HL day notional volume USD, keyed by normalized crypto symbol */
  hlDayVolumeUsd?: Record<string, number>;
}

/** One row in the arbitrage matrix (crypto pairs only after Rule A) */
export interface MatrixRow {
  a1_timestamp: string;
  b1_symbol: string;
  c1_hl_spot: number;
  d1_hl_perp: number;
  e1_hl_funding: number;
  /** Signed HL funding APR (% / year) */
  h1_annual_hl: number;
  /** Absolute funding yield APR (% / year) — primary yield column */
  i1_annual_cross: number;
  j1_strategy: string;
  k1_basis_sp: number;
  n1_friction: number;
  o1_cost_usd: number;
  stability: number;
  /** Rule A fields */
  score: number;
  netProfit7d: number;
  fundingStdDev24h: number;
  volume3d: number;
  onHyperliquid: boolean;
  passedRule?: "A" | "B";
  /** Per-token Max SL from funding std-dev matrix */
  maxLossLimit?: number;
  maxLossLabel?: string;
  /** World-tree / matrix category for Step 2 filters */
  asset_category?: "crypto" | "commodity" | "stock" | "index" | "fx" | "preipo";
  /** HL open-interest or depth proxy (USD notional) */
  hl_oi_usd?: number;
  /** Legacy aliases for dashboard */
  std_dev_24h?: number;
  vol_3d_avg?: number;
  actionStatus?: ActionStatus;
  risk_tripped?: boolean;
  risk_reasons?: string[];
  risk_estimated_loss_usd?: number;
}

export interface MatrixDebugKeys {
  hlSpotKeys?: string[];
  hlPerpKeys?: string[];
  hlSpot?: string[];
  hlPerp?: string[];
}

export interface MatrixDebugInfo {
  source: string;
}

/** TradFi commodity mid prices (allMids fuzzy) */
export interface CommoditiesSnapshot {
  gold?: number;
  wti?: number;
  brent?: number;
  silver?: number;
  natgas?: number;
  copper?: number;
  platinum?: number;
  [key: string]: number | undefined;
}

/** TradFi stock / equity synthetic mid prices */
export interface StocksSnapshot {
  nvda?: number;
  samsung?: number;
  mu?: number;
  skhynix?: number;
  dram?: number;
  sndk?: number;
  amd?: number;
  [key: string]: number | undefined;
}

/** Equity index synthetics (XYZ100, S&P500, QQQ, …) */
export interface IndicesSnapshot {
  xyz100?: number;
  sp500?: number;
  qqq?: number;
  us500?: number;
  jp225?: number;
  kr200?: number;
  [key: string]: number | undefined;
}

/** FX synthetics (USDJPY, EURUSD, DXY, …) */
export interface FxSnapshot {
  usdjpy?: number;
  eurusd?: number;
  gbpusd?: number;
  dxy?: number;
  usdkrw?: number;
  [key: string]: number | undefined;
}

/** Pre-IPO / unlisted equity synthetics */
export interface PreIpoSnapshot {
  [key: string]: number | undefined;
}

/** Per-asset TradFi enrichment from xyz metaAndAssetCtxs */
export interface TradFiAssetEnrichment {
  hlSymbol: string;
  markPrice?: number;
  change24h_pct?: number;
  openInterest?: number;
  openInterestNotionalUsd?: number;
  /** Hourly funding rate (HL perp) */
  fundingRateHourly?: number;
  /** 8h funding as percentage (hourly × 8 × 100) */
  fundingRate8h_pct?: number;
  /** UI spotlight alias only — never a fetch / panel filter */
  isHighlight?: boolean;
}

/** Open-interest king for a TradFi category panel */
export interface TradFiOiKing {
  key: string;
  hlSymbol: string;
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

/** Full TradFi spectrum branched from allMids — never enters Rule A */
export interface TradFiSpectrum {
  commodities: CommoditiesSnapshot;
  stocks: StocksSnapshot;
  indices: IndicesSnapshot;
  fx: FxSnapshot;
  preipo: PreIpoSnapshot;
}

/** 8h funding extremes for dashboard world-tree bar */
export interface FundingRateKing {
  symbol: string;
  /** 8h funding rate as percentage (hourly rate × 8 × 100) */
  rate8h_pct: number;
}

export interface FundingRateKings {
  highest: FundingRateKing;
  lowest: FundingRateKing;
  /** Top 3 most positive 8h funding (long bleed board) */
  topPositive?: FundingRateKing[];
  /** Top 3 most negative 8h funding (short squeeze board) */
  topNegative?: FundingRateKing[];
}

/**
 * Phase 2 reserved — Polymarket / prediction-market adapter payload.
 * Not wired in Phase 1 Macro Radar; kept for future API glue.
 */
export interface PredictionMarketData {
  marketId: string;
  question: string;
  /** Probability / mid price in [0, 1] */
  yesPrice?: number;
  volumeUsd?: number;
  endDateIso?: string;
  sourceUrl?: string;
  tags?: string[];
}

/** Successful GET /api/data payload */
export interface MatrixSuccessResponse {
  success: true;
  timestamp_hkt: string;
  /** Filtered crypto pairs (Rule A) — same as `data` */
  matrix: MatrixRow[];
  /** Canonical table array for the dashboard */
  data?: MatrixRow[];
  debug_info?: MatrixDebugInfo;
  debug_raw_keys?: MatrixDebugKeys;
  /** Backend system logs mirrored to frontend DEBUG CONSOLE */
  debug_system_logs?: string[];
  vix?: number;
  vix_traditional?: number;
  dvol_crypto?: number;
  commodities?: CommoditiesSnapshot;
  stocks?: StocksSnapshot;
  indices?: IndicesSnapshot;
  fx?: FxSnapshot;
  preipo?: PreIpoSnapshot;
  /** Live HL 8h funding extremes for World Tree funding board */
  funding_rate_kings?: FundingRateKings;
  /**
   * Lightweight full HL crypto quote proxy for client-side category map / FR sort.
   * Worker does not run hlCategoryMap here — frontend owns heavy bucketing.
   */
  hl_universe?: HlUniverseQuote[];
  /** TradFi 24h change / OI enrichment + per-category OI kings */
  tradfi_enrichment?: TradFiEnrichmentPack;
  /** HKT 21:00–23:00 tsunami shield — soil resistance locked */
  tsunami_shield_active?: boolean;
  /** Authoritative risk HUD + execution gate state */
  systemState?: import("../../services/systemState").SystemState;
}

/** Slim per-symbol quote for client-side World-Tree mapping (no Rule/Soil) */
export interface HlUniverseQuote {
  symbol: string;
  mark: number;
  spot: number;
  /** Hourly funding decimal (HL native) */
  funding: number;
  dayVolumeUsd: number;
  /** Precomputed 8h funding % for client sort */
  funding8h_pct: number;
}

export interface MatrixErrorResponse {
  success: false;
  error: string;
  hardlock?: boolean;
  code?: "HARDLOCK";
  signingChannelOpen?: false;
  systemState?: import("../../services/systemState").SystemState;
}

export type MatrixResponse = MatrixSuccessResponse | MatrixErrorResponse;

/** Loose shape of the optional Python gateway `/matrix` payload */
export interface PythonGatewayItem {
  pair: string;
  exchange: string;
  price: number;
  funding: number;
}

export interface PythonGatewayPayload {
  raw?: {
    matrix?: Record<string, PythonGatewayItem>;
  };
}

/** Hyperliquid metaAndAssetCtxs response fragment */
export interface HyperliquidUniverseAsset {
  name: string;
  /** Often undefined on live HL — do not trust alone */
  isSpot?: boolean;
  /** Spot pairs may expose token indices here */
  tokens?: unknown[];
  szDecimals?: number;
  maxLeverage?: number;
}

export interface HyperliquidAssetCtx {
  funding?: string;
  oraclePx?: string;
  midPx?: string;
  prevDayPx?: string;
  dayNtlVlm?: string;
  dayBaseVlm?: string;
  openInterest?: string;
}

export type HyperliquidMetaAndAssetCtxs = [
  { universe?: HyperliquidUniverseAsset[] },
  HyperliquidAssetCtx[],
];
