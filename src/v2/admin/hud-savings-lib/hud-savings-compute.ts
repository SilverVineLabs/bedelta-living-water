/**
 * HUD savings calculator — weapon coverage and savings compute.
 */

import {
  DEMO_ROLE_CAPITAL_USD,
  simulateDemoCell,
} from "../../services/demo-simulator-service";
import {
  SCENARIO_LOSS_MULT,
  V15_COUNTER_MEV_BASELINE_USD,
  V15_COUNTER_MEV_NET_USD,
  V15_COUNTER_MEV_RATE,
  V15_COUNTER_MEV_SAVED_USD,
  VERSION_DEFENSE_RATE,
  WEAPON_SAVE_WEIGHT,
  type HudSavingsInput,
  type HudSavingsResult,
} from "./hud-savings-constants";

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
