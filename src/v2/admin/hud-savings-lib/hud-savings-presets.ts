/**
 * HUD savings calculator — chart series and auto-optimize presets.
 */

import {
  simulateDemoCell,
  type DemoSimRole,
  type DemoSimScenario,
} from "../../services/demo-simulator-service";
import { TOPOLOGY_SHIELD_TREE } from "../../services/tension-engine-service";
import type { ChartPoint } from "./hud-savings-constants";

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
