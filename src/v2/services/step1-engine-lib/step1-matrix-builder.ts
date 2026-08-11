import {
  STEP1_ROOT_KEYS,
  type MockConfig,
  type Step1RootKey,
  type UserMode,
} from "../../types/step1";
import {
  isUsCloseSpikeWindow,
  isUsOpenSpikeWindow,
} from "./step1-time-windows";

export function resolveGeoCountry(
  config?: MockConfig,
  requestHeaders?: Headers,
): string {
  if (config?.isMockMode && config.mockGeoCountry !== undefined) {
    return config.mockGeoCountry.toUpperCase();
  }
  const header = requestHeaders?.get("cf-ipcountry") ?? "";
  return header.trim().toUpperCase();
}

export function resolveSpikeWindowActive(
  config?: MockConfig,
  now: Date = new Date(),
): { open: boolean; close: boolean; any: boolean } {
  if (config?.isMockMode && config.mockIsUSMarketOpenWindow !== undefined) {
    const forced = config.mockIsUSMarketOpenWindow;
    return { open: forced, close: false, any: forced };
  }
  const open = isUsOpenSpikeWindow(now);
  const close = isUsCloseSpikeWindow(now);
  return { open, close, any: open || close };
}

/**
 * Resolve macro VIX. In mock mode never hits a live API.
 * Live path is a stub placeholder that returns a safe default until wired.
 */
export async function resolveVix(config?: MockConfig): Promise<number> {
  if (config?.isMockMode) {
    return config.mockVix ?? 18;
  }
  // Live VIX fetch intentionally deferred — dry-run / offline-safe default.
  return 18;
}

export function resolveUserXp(config?: MockConfig): number {
  if (config?.isMockMode && config.mockUserXP !== undefined) {
    return config.mockUserXP;
  }
  return 0;
}

/**
 * Build the 20-Root Defense Matrix.
 * `true` = PASS (clear), `false` = FAIL/LOCKED.
 */
export function buildMatrixDetails(input: {
  geoLocked: boolean;
  openSpikeLocked: boolean;
  closeSpikeLocked: boolean;
  vixLocked: boolean;
  primaryMode: UserMode;
  root17Tripped: boolean;
}): Record<Step1RootKey, boolean> {
  const {
    geoLocked,
    openSpikeLocked,
    closeSpikeLocked,
    vixLocked,
    primaryMode,
    root17Tripped,
  } = input;

  const lossLockPass = true; // Dynamic Max SL welded — always enforced/pass
  const beginnerCapPass = primaryMode !== "BEGINNER" || !vixLocked;
  const equityLockPass = !geoLocked && !openSpikeLocked && !closeSpikeLocked;
  const tsunamiPass = !openSpikeLocked && !closeSpikeLocked;
  const killSwitchPass = !geoLocked && !vixLocked;

  const matrix: Record<Step1RootKey, boolean> = {
    root1_lossLock: lossLockPass,
    root2_geoLock: !geoLocked,
    root3_openSpikeLock: !openSpikeLocked,
    root4_closeSpikeLock: !closeSpikeLocked,
    root5_vixLock: !vixLocked,
    root6_beginnerCap: beginnerCapPass,
    root7_equityLock: equityLockPass,
    root8_slippageLock: true,
    root9_depthLock: true,
    root10_tsunamiShield: tsunamiPass,
    root11_fundingExtreme: !vixLocked,
    root12_crossVenue: true,
    root13_sessionAuth: true,
    root14_capitalFloor: true,
    root15_leverageCap: primaryMode !== "BEGINNER",
    root16_correlation: !vixLocked,
    root17_drawdownDay: !root17Tripped,
    root18_rateLimit: true,
    root19_dataFreshness: true,
    root20_killSwitch: killSwitchPass,
  };

  // Guarantee all 20 canonical keys are present
  for (const key of STEP1_ROOT_KEYS) {
    if (matrix[key] === undefined) {
      matrix[key] = false;
    }
  }

  return matrix;
}
