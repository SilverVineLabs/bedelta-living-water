/**
 * Distance-weighted Risk Index — tier-averaged 4-Tier scoring (0–100).
 * Direction: RISK_INDEX 0 = nominal → 100 = max risk (inverse of HEALTH_CRI).
 */

import {
  CRI_TIER_DEFINITIONS,
  RISK_INDEX_TIER_DEFINITIONS,
  RISK_INDEX_MAX,
  RISK_INDEX_MIN,
  TOXICITY_ELEVATED_THRESHOLD,
  TOXIC_MODE_COOLDOWN_MS,
  TOXIC_MODE_THRESHOLD,
} from "../../config/constants";

export type RootRiskStatus = "PASS" | "WARN" | "TRIPPED";

export const ROOT_STATUS_SCORE: Readonly<Record<RootRiskStatus, number>> = {
  PASS: 0,
  WARN: 50,
  TRIPPED: 100,
};

export { CRI_TIER_DEFINITIONS, RISK_INDEX_TIER_DEFINITIONS };
export {
  RISK_INDEX_MAX,
  RISK_INDEX_MIN,
  TOXICITY_ELEVATED_THRESHOLD,
  TOXIC_MODE_THRESHOLD,
  TOXIC_MODE_COOLDOWN_MS,
};

export type RiskIndexBand = "NOMINAL" | "TOXICITY_ELEVATED" | "TOXIC_MODE";

export interface RiskIndexHudConfig {
  band: RiskIndexBand;
  badge: string;
  cssClass: string;
  scoreClass: string;
}

export const RISK_INDEX_HUD_CONFIG: Record<RiskIndexBand, RiskIndexHudConfig> = {
  NOMINAL: {
    band: "NOMINAL",
    badge: "[ STATUS: NOMINAL ]",
    cssClass: "is-nominal",
    scoreClass: "text-emerald-400",
  },
  TOXICITY_ELEVATED: {
    band: "TOXICITY_ELEVATED",
    badge: "[ STATUS: TOXICITY ELEVATED ]",
    cssClass: "is-toxicity-elevated",
    scoreClass: "text-purple-400",
  },
  TOXIC_MODE: {
    band: "TOXIC_MODE",
    badge: "[ TOXIC MODE TRIPPED ]",
    cssClass: "is-toxic-mode",
    scoreClass: "text-cyan-400 animate-pulse",
  },
};

export function rootTierCardClass(rootNum: number): string {
  if (rootNum <= 6) return "root-tier-card is-tier1";
  if (rootNum <= 12) return "root-tier-card is-tier2";
  if (rootNum <= 18) return "root-tier-card is-tier3";
  return "root-tier-card is-tier4";
}

export function rootStatusToScore(status: RootRiskStatus): number {
  return ROOT_STATUS_SCORE[status];
}

export function resolveRootStatus(
  statuses: Partial<Record<number, RootRiskStatus>>,
  root: number,
): RootRiskStatus {
  return statuses[root] ?? "PASS";
}

export function tierAverageScore(
  statuses: Partial<Record<number, RootRiskStatus>>,
  roots: readonly number[],
): number {
  if (roots.length === 0) return 0;
  let sum = 0;
  for (const root of roots) {
    sum += rootStatusToScore(resolveRootStatus(statuses, root));
  }
  return sum / roots.length;
}

export function statusesFromTrippedRoots(
  trippedRoots: Iterable<number>,
): Partial<Record<number, RootRiskStatus>> {
  const out: Partial<Record<number, RootRiskStatus>> = {};
  for (const root of trippedRoots) {
    if (root >= 1 && root <= 20) out[root] = "TRIPPED";
  }
  return out;
}

export function calculateRiskScore(
  statuses: Partial<Record<number, RootRiskStatus>>,
): number {
  let score = 0;
  for (const tier of CRI_TIER_DEFINITIONS) {
    score += tierAverageScore(statuses, tier.roots) * tier.weight;
  }
  return Math.min(100, Math.round(score));
}

/** Distance-weighted risk score 0–100 from tripped root numbers (higher = more toxic). */
export function calculateRiskScoreFromTrippedRoots(
  trippedRoots: Iterable<number>,
): number {
  return calculateRiskScore(statusesFromTrippedRoots(trippedRoots));
}

/** @deprecated Use calculateRiskScoreFromTrippedRoots */
export const calculateCriScore = calculateRiskScoreFromTrippedRoots;

export function resolveRiskIndexBand(riskScore: number): RiskIndexBand {
  if (riskScore >= TOXIC_MODE_THRESHOLD) return "TOXIC_MODE";
  if (riskScore >= TOXICITY_ELEVATED_THRESHOLD) return "TOXICITY_ELEVATED";
  return "NOMINAL";
}

export function isToxicModeTripped(riskScore: number): boolean {
  return riskScore >= TOXIC_MODE_THRESHOLD;
}

export function formatRiskIndexLabel(riskScore: number): string {
  return `RISK INDEX: ${riskScore} / 100`;
}

export type StatusHudStage =
  | "NORMAL"
  | "GROWTH"
  | "WARNING"
  | "SHIELD"
  | "GOD_MODE"
  | "BLOCKED";

export function resolveStatusHudStage(
  criScore: number,
  hardLock = false,
): Exclude<StatusHudStage, "GROWTH"> {
  if (hardLock || criScore >= 100) return "BLOCKED";
  const band = resolveRiskIndexBand(criScore);
  if (band === "TOXIC_MODE") return "GOD_MODE";
  if (band === "TOXICITY_ELEVATED") return "WARNING";
  return "NORMAL";
}

export const STATUS_HUD_CONFIG = {
  NORMAL: {
    stage: "NORMAL" as const,
    emoji: "🟢",
    label: "Green Scan",
    subtitle: "Silent background monitoring",
    cssClass: "is-normal",
  },
  GROWTH: {
    stage: "GROWTH" as const,
    emoji: "🟢",
    label: "+EXP, LEVEL UP!",
    subtitle: "Safe-zone XP progression",
    cssClass: "is-growth",
  },
  WARNING: {
    stage: "WARNING" as const,
    emoji: "🟡",
    label: "Amber Status / alert",
    subtitle: "Risk hawk eye activated",
    cssClass: "is-warning",
  },
  SHIELD: {
    stage: "SHIELD" as const,
    emoji: "🛡️",
    label: "Shield Protocol",
    subtitle: "Deep root defense active",
    cssClass: "is-shield",
  },
  GOD_MODE: {
    stage: "GOD_MODE" as const,
    emoji: "👁️",
    label: "SANTENMOKU PROTOCOL: ENGAGED",
    subtitle: "Three-Eyes physical override",
    cssClass: "is-god-mode",
  },
  BLOCKED: {
    stage: "BLOCKED" as const,
    emoji: "🔴",
    label: "ERROR 403 / DEADLOCK",
    subtitle: "100% execution deadlock",
    cssClass: "is-blocked",
  },
} as const;
