/**
 * Protocol version presets (v0.8 → v3.0) — types and version chip constants.
 */

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

export interface ProtocolVersionMeta {
  id: ProtocolVersion;
  labelEn: string;
  blurbEn: string;
}
