import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import type { HudState, SystemState } from "../../src/services/systemState";

const __dirname = dirname(fileURLToPath(import.meta.url));
export const ROOT = join(__dirname, "../..");
export const OUT = join(ROOT, "docs/0801_BeDelta_Survival_Benchmark.md");

export const COIN = "ETH";
export const ROTATION_ASSETS = ["ETH", "SOL", "BTC"] as const;
export const NOTIONAL_USD = 100_000;
export const STRESS_NOTIONAL_USD = 1_000_000;
export const HEDGE_TRACKING_ERR = 0.002;
export const LOOKBACK_MS = 30 * 86_400_000;
export const DEGRADE_THRESHOLD = 30;
/** VaaS B2B licensing bps on blocked toxic notional (window fee Δ) */
export const VAAS_LICENSE_BPS = 2;
export const UA = { "User-Agent": "BeDeltaLivingWater/SurvivalBenchmark" } as const;
export const BINANCE_KLINES = "https://fapi.binance.com/fapi/v1/klines";

/** Dual-radar weights — HL Custom 5-Sensor matrix */
export const W = {
  primary: 0.6,
  secondary: 0.4,
  s1: 0.3,
  s2: 0.4,
  s3: 0.3,
  s4: 0.5,
  s5: 0.5,
} as const;

export interface FundingPoint {
  coin: string;
  fundingRate: string;
  premium: string;
  time: number;
}

export interface Candle {
  t: number;
  o: string;
  h: string;
  l: string;
  c: string;
  v: string;
  n: number;
}

export interface WalkFill {
  filledUsd: number;
  filledQty: number;
  avgPx: number;
  midPx: number;
  impactBps: number;
  slipUsd: number;
}

export interface SensorScores {
  s1: number;
  s2: number;
  s3: number;
  s4: number;
  s5: number;
}

export interface RadarTick {
  time: number;
  scores: SensorScores;
  primary: number;
  secondary: number;
  composite: number;
  degraded: boolean;
  hudState: HudState;
  systemState: SystemState;
  slipSavedUsd: number;
}

export interface HlAssetCtx {
  funding: string;
  openInterest: string;
  oraclePx: string;
  markPx: string;
  midPx: string;
  premium: string;
  impactPxs?: [string, string];
}

export interface SliTwapResult {
  slipUsd: number;
  impactBps: number;
  filledUsd: number;
  soilTrips: number;
  slicesUsed: number;
  sliceUsd: number;
  pathSlots: number;
}

export interface TwapShortImpact {
  slipUsd: number;
  impactBps: number;
  sliceUsd: number;
}
