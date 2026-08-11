/**
 * Protocol version presets (v0.8 → v3.0) for Shield Tree HUD.
 * Cumulative unlock: lower versions gray-lock unsupported weapons.
 * Right panel groups by Version Matrix (not topology pillars).
 */

import { TOPOLOGY_SHIELD_TREE } from "../../services/tension-engine-service";
import { operatorsIntroducedAt } from "../operator-matrix";
import { VERSION_UNLOCKS } from "../hud-weapons-matrix";

export type ProtocolVersion =
  | "v0.8"
  | "v1.0"
  | "v1.5"
  | "v2.0"
  | "v2.5"
  | "v3.0";

export const PROTOCOL_VERSIONS: readonly ProtocolVersion[] = [
  "v0.8",
  "v1.0",
  "v1.5",
  "v2.0",
  "v2.5",
  "v3.0",
] as const;

export const DEFAULT_PROTOCOL_VERSION: ProtocolVersion = "v0.8";

/** Strict F-pattern topology rows — upper alpha/sigma/delta/theta, lower omega/kappa/lambda/zeta. */
export const TOPOLOGY_ROW_UPPER = ["NODE_ALPHA", "NODE_SIGMA", "NODE_DELTA", "NODE_THETA"] as const;
export const TOPOLOGY_ROW_LOWER = ["NODE_OMEGA", "NODE_KAPPA", "NODE_LAMBDA", "NODE_ZETA"] as const;

/** Header preset chips: v0.8 / v1.0 / v1.5 / v2.5 / v3.0 (+ Unlock All → v3.0). */
export const HEADER_VERSION_CHIPS: readonly ProtocolVersion[] = [
  "v0.8",
  "v1.0",
  "v1.5",
  "v2.5",
  "v3.0",
] as const;

/** Scale-down HUD: only these three versions are clickable in the matrix selector. */
export const SELECTABLE_VERSION_CHIPS: readonly ProtocolVersion[] = [
  "v0.8",
  "v1.0",
  "v1.5",
] as const;

/** Future milestones — shown disabled in the matrix selector. */
export const LOCKED_VERSION_CHIPS: readonly ProtocolVersion[] = [
  "v2.5",
  "v3.0",
] as const;

export const LOCKED_VERSION_LABEL =
  "🔒 Target: 2027 (Milestone 3+)" as const;

/** Versions that arm VE zero-friction on one-click geometric optimize. */
export const VE_OPTIMIZE_VERSIONS: readonly ProtocolVersion[] = [
  "v1.5",
  "v2.0",
  "v2.5",
  "v3.0",
] as const;

export type CorePillarId =
  | "V08_ORIGIN"
  | "V10_RISK"
  | "V15_CITADEL"
  | "V25_COUNTER"
  | "V30_DOME";

export interface CorePillarDef {
  id: CorePillarId;
  /** Bagua ids that light this pillar when scenario-active */
  topologyNodeIds: readonly string[];
  weaponIds: readonly string[];
  labelEn: string;
}

/**
 * Version Matrix — five protocol evolution groups (one-screen HUD).
 * weaponIds derived from STANDARD_OPERATOR_ROSTER SSOT (no W39/W40/W45).
 */
export const CORE_PILLARS: readonly CorePillarDef[] = [
  {
    id: "V08_ORIGIN",
    topologyNodeIds: ["NODE_ALPHA"],
    weaponIds: operatorsIntroducedAt("v0.8"),
    labelEn: "v0.8 Public Origin",
  },
  {
    id: "V10_RISK",
    topologyNodeIds: ["NODE_OMEGA", "NODE_DELTA"],
    weaponIds: operatorsIntroducedAt("v1.0"),
    labelEn: "v1.0 Risk Foundation",
  },
  {
    id: "V15_CITADEL",
    topologyNodeIds: ["NODE_SIGMA"],
    weaponIds: operatorsIntroducedAt("v1.5"),
    labelEn: "v1.5 Dark Citadel",
  },
  {
    id: "V25_COUNTER",
    topologyNodeIds: ["NODE_KAPPA"],
    weaponIds: [],
    labelEn: "v2.5 MEV Counter",
  },
  {
    id: "V30_DOME",
    topologyNodeIds: ["NODE_LAMBDA", "NODE_ZETA"],
    weaponIds: [],
    labelEn: "v3.0 Geodesic Dome",
  },
] as const;

export interface ProtocolVersionMeta {
  id: ProtocolVersion;
  labelEn: string;
  blurbEn: string;
}

export const PROTOCOL_VERSION_META: Readonly<
  Record<ProtocolVersion, ProtocolVersionMeta>
> = {
  "v0.8": {
    id: "v0.8",
    labelEn: "v0.8 Public Origin",
    blurbEn: "Physical hard-lock only: checkSoilResistance + rootProtection",
  },
  "v1.0": {
    id: "v1.0",
    labelEn: "v1.0 Risk Foundation",
    blurbEn: "Adds SSOT state machine + liquidity tanks",
  },
  "v1.5": {
    id: "v1.5",
    labelEn: "v1.5 Dark Citadel",
    blurbEn: "Full 24-Cell: high-speed dispatch + hard-shell armor",
  },
  "v2.0": {
    id: "v2.0",
    labelEn: "v2.0 Geometric Spread",
    blurbEn: "Tempo/Cycle: geometric dynamic spread",
  },
  "v2.5": {
    id: "v2.5",
    labelEn: "v2.5 MEV Counter",
    blurbEn: "Bitwise + iceberg: MEV counterstrike",
  },
  "v3.0": {
    id: "v3.0",
    labelEn: "v3.0 Geodesic Dome",
    blurbEn: "Full-weapon dome: reserved for future milestones",
  },
};

export function isWeaponUnlockedInVersion(
  weaponId: string,
  version: ProtocolVersion,
): boolean {
  return VERSION_UNLOCKS[version].includes(weaponId);
}

/** Enabled map for version: unlocked → on; locked → off. */
export function weaponEnabledMapForVersion(
  version: ProtocolVersion,
): Record<string, boolean> {
  const map: Record<string, boolean> = {};
  for (const card of TOPOLOGY_SHIELD_TREE) {
    for (const w of card.weapons) {
      map[w.id] = isWeaponUnlockedInVersion(w.id, version);
    }
  }
  return map;
}

/** Hard-lock (checkbox disabled) when weapon not in version, or tree.locked unless v3.0. */
export function isWeaponUiLocked(
  weaponId: string,
  version: ProtocolVersion,
  treeLocked: boolean,
): boolean {
  if (!isWeaponUnlockedInVersion(weaponId, version)) return true;
  if (treeLocked && version !== "v3.0") return true;
  return false;
}

export function topologyCardsInOrder(row: readonly string[]) {
  return row.map((id) => {
    const card = TOPOLOGY_SHIELD_TREE.find((c) => c.id === id);
    if (!card) throw new Error(`Missing topology card ${id}`);
    return card;
  });
}

export function isVeOptimizeVersion(version: ProtocolVersion): boolean {
  return (VE_OPTIMIZE_VERSIONS as readonly string[]).includes(version);
}


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
