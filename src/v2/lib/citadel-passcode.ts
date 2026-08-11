/** Citadel HUD access — passcode gate removed; HUD is always unlocked. */

export const CITADEL_UNLOCKED_STORAGE_KEY = "citadel_unlocked" as const;

/** @deprecated Passcode gate removed — retained for legacy imports. */
export const CITADEL_AUTH_STORAGE_KEY = CITADEL_UNLOCKED_STORAGE_KEY;

export const ACCESS_GRANTED_LOG =
  "[ACCESS_GRANTED] Welcome Arbitrum Citadel Grant Committee. Full Citadel Telemetry Unlocked." as const;

/** HUD is directly accessible without passcode. */
export function isCitadelAuthenticated(): boolean {
  return true;
}

/** @deprecated No-op — passcode gate removed. */
export function setCitadelAuthenticated(): void {
  /* intentionally empty */
}

/** @deprecated Passcode gate removed — always true (HUD loads without prompt). */
export function verifyGrantPasscode(_input: string): boolean {
  return true;
}

/** @deprecated Passcode gate removed — always true. */
export function isPasscodeBypassed(): boolean {
  return true;
}
