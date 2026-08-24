/**
 * HUD savings calculator — constants and input/output types.
 */

import type {
  DemoSimRole,
  DemoSimScenario,
} from "../../services/demo-simulator-service";
import type { ProtocolVersion } from "../hud-protocol-versions";

/** Per-weapon contribution to max defense savings (sums ≤ 1). Internal only. */
export const WEAPON_SAVE_WEIGHT: Readonly<Record<string, number>> = {
  SOIL: 0.14,
  ROOT: 0.16,
  W03: 0.07,
  W43: 0.06,
  W47: 0.07,
  BEDA: 0.08,
  W65: 0.06,
  W58: 0.1,
  W64: 0.08,
  SSOT: 0.04,
  W52: 0.05,
  BITWISE: 0.09,
  W34: 0.07,
  W39: 0.05,
  W67: 0.05,
  W40: 0,
  W45: 0,
};

export const SCENARIO_LOSS_MULT: Readonly<Record<DemoSimScenario, number>> = {
  NORMAL_RANGING: 0.35,
  HIGH_VOLATILITY_SQUEEZE: 0.85,
  PREDATORY_MEV_ATTACK: 1.05,
  FLASH_CRASH_BLACK_SWAN: 1.25,
  LIQUIDITY_HOLE_VACUUM: 1.1,
  ORACLE_RPC_DISTORTION: 0.95,
};

export const VERSION_DEFENSE_RATE: Readonly<Record<ProtocolVersion, number>> = {
  "v0.8": 0.35,
  "v1.0": 0.65,
  "v1.5": 0.9,
  "v2.0": 0.95,
  "v2.5": 1.0499965,
  "v3.0": 1.1499982,
};

/** Demo showcase: v1.5 + Arch Shield toggle → Counter-MEV reverse extraction (W34/W47 narrative). */
export const V15_COUNTER_MEV_BASELINE_USD = 11274.8;
export const V15_COUNTER_MEV_SAVED_USD = 14093.0;
export const V15_COUNTER_MEV_NET_USD = 2818.2;
export const V15_COUNTER_MEV_RATE =
  V15_COUNTER_MEV_SAVED_USD / V15_COUNTER_MEV_BASELINE_USD;

export interface HudSavingsInput {
  role: DemoSimRole;
  scenario: DemoSimScenario;
  protocolVersion: ProtocolVersion;
  shieldActive: boolean;
  weaponEnabled: Readonly<Record<string, boolean>>;
}

export interface HudSavingsResult {
  capitalUsd: number;
  baselineLossUsd: number;
  savedUsd: number;
  netValueUsd: number;
  coverage: number;
}

export interface ChartPoint {
  step: number;
  offSlippageBps: number;
  onSlippageBps: number;
  offNetYieldBps: number;
  onNetYieldBps: number;
}
