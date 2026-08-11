/**
 * Santenmoku 64 Weapons Matrix — filters, status resolution, and scale-down helpers.
 */

import {
  isScaleDownOperator,
  SCALE_DOWN_OPERATOR_COUNT,
} from "../../../data/operator-matrix";
import { RAIN_CATEGORIES } from "./hud-weapons-matrix-catalog";
import type {
  ProtocolVersion,
  RainWeaponDef,
  WeaponMatrixStatus,
} from "./hud-weapons-matrix-types";
import {
  VERSION_BASE_SAVED,
  VERSION_RANK,
  VERSION_UNLOCKS,
  WEAPON_UNLOCK_VERSION,
} from "./hud-weapons-matrix-version-meta";

export function baseSavedForVersion(version: ProtocolVersion): number {
  return VERSION_BASE_SAVED[version];
}

export function sampleJitterPct(): number {
  return 0.03 + Math.random() * 0.05;
}

export function isWeaponUnlockedInMatrix(weaponId: string, version: ProtocolVersion): boolean {
  return VERSION_UNLOCKS[version].includes(weaponId);
}

export function resolveWeaponMatrixStatus(weapon: RainWeaponDef, currentVersion: ProtocolVersion): WeaponMatrixStatus {
  const unlock = weapon.unlockVersion ?? WEAPON_UNLOCK_VERSION[weapon.id] ?? null;
  if (!unlock) return { kind: "locked" };
  if (VERSION_RANK[currentVersion] >= VERSION_RANK[unlock]) return { kind: "active" };
  return { kind: "coming_soon", version: unlock };
}

export function allMatrixWeaponIds(): string[] {
  return RAIN_CATEGORIES.flatMap((c) => c.weapons.map((w) => w.id));
}

/** Scale-down HUD: category-prefix roster (v1.5 milestone — 22 operators). */
export {
  isScaleDownOperator,
  operatorDisplayCode,
  SCALE_DOWN_OPERATOR_COUNT,
} from "../../../data/operator-matrix";

export function filterScaleDownWeapons(
  weapons: readonly RainWeaponDef[],
): RainWeaponDef[] {
  return weapons
    .filter((w) => isScaleDownOperator(w.id))
    .sort((a, b) => a.displayCode.localeCompare(b.displayCode, undefined, { numeric: true }));
}

export function scaleDownWeaponCount(): number {
  return SCALE_DOWN_OPERATOR_COUNT;
}

/** @deprecated Use filterScaleDownWeapons — legacy W01–W22 filter */
export const ELITE_MATRIX_MAX_CODE = 22;

export function parseWeaponCodeNumber(code: string): number | null {
  const match = /^W(\d{2})$/.exec(code);
  if (!match) return null;
  const n = Number(match[1]);
  return Number.isFinite(n) ? n : null;
}

/** @deprecated Use isScaleDownOperator */
export function isEliteMatrixWeapon(weapon: RainWeaponDef): boolean {
  return isScaleDownOperator(weapon.id);
}

/** @deprecated Use filterScaleDownWeapons */
export function filterEliteMatrixWeapons(
  weapons: readonly RainWeaponDef[],
): RainWeaponDef[] {
  return filterScaleDownWeapons(weapons);
}

/** @deprecated Use scaleDownWeaponCount */
export function eliteMatrixWeaponCount(): number {
  return scaleDownWeaponCount();
}
