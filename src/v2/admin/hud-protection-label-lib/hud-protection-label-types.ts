/**
 * HUD protection gauge — semantic type definitions.
 */

import type { ShieldMorphId } from "../../services/tension-engine-service";
import type { DemoSimScenario } from "../../services/demo-simulator-service";

export type ProtectionStateId =
  | "VE_ZERO_FRICTION"
  | "ARMOR_ABSORBING"
  | "SELF_HEALING"
  | "COUNTERSTRIKE"
  | "HARD_LOCK"
  | "CALM_AEGIS";

export type ProtectionGaugeMode =
  | "ABSORBING"
  | "SELF_HEALING"
  | "VE_ZERO_FRICTION";

export interface ProtectionStateLabel {
  id: ProtectionStateId;
  emoji: string;
  labelEn: string;
  pulse: boolean;
  tipEn: string;
}

export interface ProtectionGaugeView {
  mode: ProtectionGaugeMode;
  emoji: string;
  labelEn: string;
  tipEn: string;
  /** 0–100 fill for micro chart (semantic only) */
  absorbPct: number;
  /** ASCII / bar visual */
  microChart: string;
  /** Δ absorption impact (bps) — absorbing mode */
  absorptionBps: number;
  /** Δ risk drop (%) — absorbing mode */
  riskDropPct: number;
  /** Δ depth refill (bps) — self-heal mode */
  depthRefillBps: number;
  /** Δ void patch (%) — self-heal mode */
  voidPatchPct: number;
  /** Δ spread friction (bps) — VE mode */
  frictionBps: number;
  /** Δ net yield (bps) — VE mode */
  netYieldBps: number;
  pulse: boolean;
}

export interface TrinityDefenseCard {
  id: "A" | "B" | "C";
  emoji: string;
  titleEn: string;
  statusEn: string;
  accent: "rose" | "amber" | "sky";
  microChart: string;
}

export type { ShieldMorphId, DemoSimScenario };
