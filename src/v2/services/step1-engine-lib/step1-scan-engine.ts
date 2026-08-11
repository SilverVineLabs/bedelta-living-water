import {
  STEP1_ROOT_KEYS,
  type MockConfig,
  type Step1ScanResult,
} from "../../types/step1";
import {
  computeEffectiveMaxSlUsd,
  DEFAULT_ACCOUNT_EQUITY_USD,
  sanitizeAccountEquityUsd,
} from "../../../services/effective-max-sl";
import { calculateRiskScoreFromTrippedRoots } from "../risk-engine";
import {
  checkRoot17DailyLimit,
  createRoot17DailyState,
  type Root17DailyState,
} from "../root17-daily";
import {
  buildMatrixDetails,
  resolveGeoCountry,
  resolveSpikeWindowActive,
  resolveUserXp,
  resolveVix,
} from "./step1-matrix-builder";
import { resolveUserMode } from "./step1-role-eligibility";

/** Dynamic Max SL at default base-tier equity — (10k × 1%) + $100 = $200 */
export const MAX_SL_USD = computeEffectiveMaxSlUsd(
  DEFAULT_ACCOUNT_EQUITY_USD,
) as number;

/**
 * Hyperliquid Terms of Use & OFAC restricted jurisdictions.
 * Geo-Lock / soil resistance must refuse execution for these ISO country codes.
 */
export const HL_RESTRICTED_COUNTRIES = [
  "US",
  "CA",
  "CU",
  "IR",
  "KP",
  "SY",
  "GB",
] as const;

/** @deprecated Prefer HL_RESTRICTED_COUNTRIES — same ToS / OFAC list */
export const RESTRICTED_GEOS = HL_RESTRICTED_COUNTRIES;

/** VIX threshold that trips Extreme Macro Volatility Warning */
export const VIX_LOCK_THRESHOLD = 30 as const;

/**
 * Step 1 Defense Scan Engine.
 * Evaluates geo, US open/close spike windows, macro VIX, and XP mode,
 * then returns a SAFE / LOCKED result with the 20-Root matrix.
 *
 * When `config.isMockMode` is true, all external inputs are mock-driven
 * (no live API hits).
 */
export async function runStep1Scan(
  config?: MockConfig,
  requestHeaders?: Headers,
  root17State?: Root17DailyState,
): Promise<Step1ScanResult> {
  const now = new Date();

  const geo = resolveGeoCountry(config, requestHeaders);
  const geoLocked =
    geo.length > 0 &&
    (HL_RESTRICTED_COUNTRIES as readonly string[]).includes(geo);

  const spike = resolveSpikeWindowActive(config, now);
  const openSpikeLocked = spike.open;
  const closeSpikeLocked = spike.close;
  const spikeLocked = spike.any;

  const vix = await resolveVix(config);
  const vixLocked = vix > VIX_LOCK_THRESHOLD;

  const xp = resolveUserXp(config);
  const primaryMode = resolveUserMode(xp);

  const accountEquityUsd = sanitizeAccountEquityUsd(
    config?.mockAccountEquityUsd,
  );
  const effectiveMaxSlUsd = computeEffectiveMaxSlUsd(accountEquityUsd);

  const root17Check = checkRoot17DailyLimit({
    accountEquityUsd,
    state: root17State ?? createRoot17DailyState(now),
    now,
  });
  const root17Tripped = root17Check.tripped;

  const matrixDetails = buildMatrixDetails({
    geoLocked,
    openSpikeLocked,
    closeSpikeLocked,
    vixLocked,
    primaryMode,
    root17Tripped,
  });

  const trippedRoots: number[] = [];
  STEP1_ROOT_KEYS.forEach((key, idx) => {
    if (matrixDetails[key] === false) trippedRoots.push(idx + 1);
  });
  const risk_score = calculateRiskScoreFromTrippedRoots(trippedRoots);

  let status: Step1ScanResult["status"] = "SAFE";
  let activeLockReason: string | undefined;

  // Priority order: Root 17 → geo → spike window → VIX
  if (root17Tripped) {
    status = "LOCKED";
    activeLockReason =
      root17Check.reason ?? "Root 17 Daily Drawdown / SL Count Cap (Choice A)";
  } else if (geoLocked) {
    status = "LOCKED";
    activeLockReason = "Jurisdiction Access Restricted";
  } else if (spikeLocked) {
    status = "LOCKED";
    activeLockReason = "US Market Open/Close Volatility Window";
  } else if (vixLocked) {
    status = "LOCKED";
    activeLockReason = "Extreme Macro Volatility Warning";
  }

  return {
    status,
    primaryMode,
    maxLossUSD: effectiveMaxSlUsd,
    accountEquityUsd,
    risk_score,
    root17: root17Check,
    timestamp: Date.now(),
    ...(activeLockReason !== undefined ? { activeLockReason } : {}),
    matrixDetails,
  };
}
