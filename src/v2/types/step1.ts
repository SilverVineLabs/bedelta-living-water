/** Step 1 Defense Scan — status gate for execution */
export type Step1Status = "SAFE" | "LOCKED";

/** XP-derived trader capability tier */
export type UserMode = "BEGINNER" | "INTERMEDIATE" | "EXPERT";

/**
 * Outcome of a single Step 1 Defense Scan.
 * `maxLossUSD` = Effective Max SL at account equity: (equity × 1%) + $100.
 */
export interface Step1ScanResult {
  status: Step1Status;
  primaryMode: UserMode;
  /** Dynamic Effective Max SL USD at scan equity */
  maxLossUSD: number;
  /** Account equity used for dynamic Max SL / Root 17 caps */
  accountEquityUsd?: number;
  /** Distance-weighted risk score 0–100 (higher = more toxic) */
  risk_score?: number;
  /** Root 17 Choice A daily tracker snapshot */
  root17?: {
    status: "PASS" | "TRIPPED";
    tripped: boolean;
    httpStatus: 200 | 403;
    reason?: string;
    maxDailyLossUsd: number;
    maxDailySlCount: number;
    effectiveMaxSlUsd: number;
  };
  /** Epoch ms when this scan completed — required for Step 2 handshake */
  timestamp: number;
  /** Human-readable string when LOCKED (e.g., "US Market Open Volatility Window") */
  activeLockReason?: string;
  /**
   * Key-value map of 20-Root Defense Matrix states
   * (e.g., { root1_lossLock: true, root7_equityLock: false })
   * `true` = PASS, `false` = FAIL/LOCKED
   */
  matrixDetails: Record<string, boolean>;
}

/**
 * Offline Dry-Run configuration.
 * When `isMockMode` is true the engine must not hit live APIs.
 */
export interface MockConfig {
  isMockMode: boolean;
  mockVix?: number;
  mockIsUSMarketOpenWindow?: boolean;
  mockGeoCountry?: string;
  mockUserXP?: number;
  /** Mock account equity for dynamic Max SL / Root 17 */
  mockAccountEquityUsd?: number;
  /** Mock HL wallet historical fill / TX count for role eligibility */
  mockUserTxCount?: number;
}

/** Canonical keys for the 20-Root Defense System */
export const STEP1_ROOT_KEYS = [
  "root1_lossLock",
  "root2_geoLock",
  "root3_openSpikeLock",
  "root4_closeSpikeLock",
  "root5_vixLock",
  "root6_beginnerCap",
  "root7_equityLock",
  "root8_slippageLock",
  "root9_depthLock",
  "root10_tsunamiShield",
  "root11_fundingExtreme",
  "root12_crossVenue",
  "root13_sessionAuth",
  "root14_capitalFloor",
  "root15_leverageCap",
  "root16_correlation",
  "root17_drawdownDay",
  "root18_rateLimit",
  "root19_dataFreshness",
  "root20_killSwitch",
] as const;

export type Step1RootKey = (typeof STEP1_ROOT_KEYS)[number];
