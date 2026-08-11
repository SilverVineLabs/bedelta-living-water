/**
 * HUD savings calculator, chart series, and auto-optimize presets.
 * Pure sensor-to-plan math over demo-simulator + weapon toggles.
 */

import {
  DEMO_ROLE_CAPITAL_USD,
  simulateDemoCell,
  type DemoSimRole,
  type DemoSimScenario,
} from "../../services/demo-simulator-service";
import { TOPOLOGY_SHIELD_TREE } from "../../services/tension-engine-service";
import type { ProtocolVersion } from "../hud-protocol-versions";

/** Per-weapon contribution to max defense savings (sums ≤ 1). Internal only. */
const WEAPON_SAVE_WEIGHT: Readonly<Record<string, number>> = {
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

const SCENARIO_LOSS_MULT: Readonly<Record<DemoSimScenario, number>> = {
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

export function computeWeaponCoverage(
  weaponEnabled: Readonly<Record<string, boolean>>,
): number {
  let sum = 0;
  let max = 0;
  for (const [id, w] of Object.entries(WEAPON_SAVE_WEIGHT)) {
    max += w;
    if (weaponEnabled[id]) sum += w;
  }
  return max > 0 ? Math.min(1, sum / max) : 0;
}

/**
 * Baseline loss from unprotected demo cell; saved scales with weapon coverage.
 */
export function computeHudSavings(input: HudSavingsInput): HudSavingsResult {
  const capital = DEMO_ROLE_CAPITAL_USD[input.role];
  const off = simulateDemoCell({
    role: input.role,
    scenario: input.scenario,
    adaptiveEngineEnabled: false,
  });

  const mult = SCENARIO_LOSS_MULT[input.scenario];
  const slipLoss =
    (Math.max(0, off.slippageBps) / 10_000) * capital * mult;
  const mevLoss =
    off.netYieldBps < 0
      ? (Math.abs(off.netYieldBps) / 10_000) * capital * mult
      : 0;
  const baselineAbs =
    input.role === "INSTITUTION" && input.scenario === "FLASH_CRASH_BLACK_SWAN"
      ? 11274.8
      : Number((slipLoss + mevLoss).toFixed(2));

  const counterMevArmed =
    input.protocolVersion === "v1.5" &&
    input.shieldActive &&
    Boolean(input.weaponEnabled.W43 && input.weaponEnabled.W47);

  if (counterMevArmed) {
    const baseline = Math.abs(baselineAbs);
    const savedUsd =
      Math.abs(baseline - V15_COUNTER_MEV_BASELINE_USD) < 0.01
        ? V15_COUNTER_MEV_SAVED_USD
        : Number((baseline * V15_COUNTER_MEV_RATE).toFixed(2));
    const netValueUsd =
      Math.abs(baseline - V15_COUNTER_MEV_BASELINE_USD) < 0.01
        ? V15_COUNTER_MEV_NET_USD
        : Number((savedUsd - baseline).toFixed(2));
    return {
      capitalUsd: capital,
      baselineLossUsd: -baseline,
      savedUsd,
      netValueUsd,
      coverage: Number(V15_COUNTER_MEV_RATE.toFixed(4)),
    };
  }

  const defenseRate = VERSION_DEFENSE_RATE[input.protocolVersion] ?? 0.35;
  const coverage = input.shieldActive ? defenseRate : 0;
  const savedUsd = Number((Math.abs(baselineAbs) * coverage).toFixed(2));

  return {
    capitalUsd: capital,
    baselineLossUsd: -Math.abs(baselineAbs),
    savedUsd,
    netValueUsd: Number((-Math.abs(baselineAbs) + savedUsd).toFixed(2)),
    coverage: Number(coverage.toFixed(4)),
  };
}

/** Synthetic 8-step OFF vs ON curves for current role/scenario. */
export function buildComparisonChartSeries(
  role: DemoSimRole,
  scenario: DemoSimScenario,
): ChartPoint[] {
  const off = simulateDemoCell({
    role,
    scenario,
    adaptiveEngineEnabled: false,
  });
  const on = simulateDemoCell({
    role,
    scenario,
    adaptiveEngineEnabled: true,
  });
  const points: ChartPoint[] = [];
  for (let i = 0; i < 8; i += 1) {
    const t = i / 7;
    points.push({
      step: i + 1,
      offSlippageBps: Number((off.slippageBps * (0.7 + 0.5 * t)).toFixed(2)),
      onSlippageBps: Number((on.slippageBps * (0.95 + 0.1 * t)).toFixed(2)),
      offNetYieldBps: Number((off.netYieldBps * (0.6 + 0.7 * t)).toFixed(2)),
      onNetYieldBps: Number((on.netYieldBps * (0.85 + 0.25 * t)).toFixed(2)),
    });
  }
  return points;
}

/**
 * Optimal weapon preset for scenario — keep core locks, arm scenario topology nodes.
 */
export function resolveOptimalWeaponPreset(
  scenario: DemoSimScenario,
): Record<string, boolean> {
  const enabled: Record<string, boolean> = {};
  for (const card of TOPOLOGY_SHIELD_TREE) {
    for (const w of card.weapons) {
      enabled[w.id] = w.locked ? false : true;
    }
  }
  if (scenario === "NORMAL_RANGING") {
    enabled.BITWISE = false;
    enabled.W34 = false;
    enabled.W64 = false;
  }
  if (scenario === "PREDATORY_MEV_ATTACK") {
    enabled.BITWISE = true;
    enabled.W34 = true;
  }
  if (
    scenario === "FLASH_CRASH_BLACK_SWAN" ||
    scenario === "LIQUIDITY_HOLE_VACUUM"
  ) {
    enabled.W58 = true;
    enabled.W64 = true;
    enabled.BEDA = true;
    enabled.W03 = true;
    enabled.ROOT = true;
    enabled.SOIL = true;
  }
  return enabled;
}

export function defaultWeaponEnabledMap(): Record<string, boolean> {
  const init: Record<string, boolean> = {};
  for (const card of TOPOLOGY_SHIELD_TREE) {
    for (const w of card.weapons) {
      init[w.id] = w.defaultEnabled;
    }
  }
  return init;
}
