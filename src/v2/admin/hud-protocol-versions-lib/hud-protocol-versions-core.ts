/**
 * Protocol version presets (v0.8 → v3.0) for Shield Tree HUD.
 * Cumulative unlock: lower versions gray-lock unsupported weapons.
 * Right panel groups by Version Matrix (not topology pillars).
 */

export * from "./hud-protocol-versions-types";
export * from "./hud-protocol-versions-pillars";
export * from "./hud-protocol-versions-helpers";

export {
  STANDARD_OPERATOR_ROSTER,
  OPERATOR_TARGET_VERSION,
} from "../operator-matrix";

export {
  VERSION_UNLOCKS,
  VERSION_BASE_SAVED,
  VERSION_TIMELINE,
  RAIN_CATEGORIES,
  baseSavedForVersion,
  sampleJitterPct,
  resolveWeaponMatrixStatus,
  JITTER_TIP_EN,
  ARCH_SHIELD_TIP_EN,
  ELITE_MATRIX_MAX_CODE,
  filterEliteMatrixWeapons,
  filterScaleDownWeapons,
  eliteMatrixWeaponCount,
  scaleDownWeaponCount,
  isScaleDownOperator,
  operatorDisplayCode,
  isEliteMatrixWeapon,
  parseWeaponCodeNumber,
} from "../hud-weapons-matrix";
export type {
  RainCategoryId,
  RainWeaponDef,
  RainCategoryDef,
  WeaponMatrixStatus,
  VersionTimelineMeta,
} from "../hud-weapons-matrix";
