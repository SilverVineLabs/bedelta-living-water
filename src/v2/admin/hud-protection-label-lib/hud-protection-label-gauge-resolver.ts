/**
 * HUD protection gauge — semantic Δ gauge resolver.
 */

import type { DemoSimScenario } from "../../services/demo-simulator-service";
import {
  buildAbsorbBars,
  HUD_VE_DISPLAY,
  isHudVeActive,
  needsBandage,
  PROTECTION_GAUGE_TIPS,
} from "./hud-protection-label-constants";
import type { ProtectionGaugeView } from "./hud-protection-label-types";

/**
 * Semantic protection gauge with live Δ numbers (no Index formulas exposed).
 * `forceVe` simulates VE after Auto-Optimize.
 */
export function resolveProtectionGauge(input: {
  santenmokuTension: number;
  slippageBps: number;
  netYieldBps: number;
  coverage: number;
  forceVe?: boolean;
  scenario?: DemoSimScenario;
}): ProtectionGaugeView {
  const tension = input.forceVe
    ? HUD_VE_DISPLAY
    : Number(input.santenmokuTension);
  const coverage = Math.min(1, Math.max(0, Number(input.coverage) || 0));
  const slip = Math.max(0, Number(input.slippageBps) || 0);
  const yieldBps = Number(input.netYieldBps) || 0;

  if (isHudVeActive(tension) || input.forceVe) {
    return {
      mode: "VE_ZERO_FRICTION",
      emoji: "☯️",
      labelEn: "Santenmoku Vector Equilibrium",
      tipEn: PROTECTION_GAUGE_TIPS.ve,
      absorbPct: 50,
      microChart: `[← VE ${HUD_VE_DISPLAY.toFixed(2)} →]`,
      absorptionBps: 0,
      riskDropPct: 0,
      depthRefillBps: 0,
      voidPatchPct: 100,
      frictionBps: 0,
      netYieldBps: Number(yieldBps.toFixed(2)),
      pulse: true,
    };
  }

  const dist = Math.abs(tension - HUD_VE_DISPLAY);
  const absorbPct = Math.min(
    100,
    Math.round(Math.max(8, dist * 1.8 + coverage * 25)),
  );

  if (needsBandage(input.scenario)) {
    const depthRefillBps = Number(
      (slip * (0.45 + coverage * 0.4) + dist * 0.55).toFixed(1),
    );
    return {
      mode: "SELF_HEALING",
      emoji: "🩹",
      labelEn: "W03 Self-Heal Bandage (Auto-Healing Liquid Void)",
      tipEn: PROTECTION_GAUGE_TIPS.bandage,
      absorbPct,
      microChart: `${buildAbsorbBars(absorbPct)} ${absorbPct}%`,
      absorptionBps: 0,
      riskDropPct: 0,
      depthRefillBps,
      voidPatchPct: 100,
      frictionBps: 0,
      netYieldBps: Number(yieldBps.toFixed(2)),
      pulse: true,
    };
  }

  const absorptionBps = Number(
    (slip * (0.35 + coverage * 0.55) + dist * 0.9).toFixed(2),
  );
  const riskDropPct = -Math.min(
    95,
    Math.round(coverage * 55 + Math.min(40, dist * 0.7)),
  );

  return {
    mode: "ABSORBING",
    emoji: "🛡️",
    labelEn: "Santenmoku Citadel Shield Absorbing",
    tipEn: PROTECTION_GAUGE_TIPS.absorbing,
    absorbPct,
    microChart: `${buildAbsorbBars(absorbPct)} ${absorbPct}%`,
    absorptionBps,
    riskDropPct,
    depthRefillBps: 0,
    voidPatchPct: 100,
    frictionBps: Number((slip * (1 - coverage * 0.4)).toFixed(2)),
    netYieldBps: Number(yieldBps.toFixed(2)),
    pulse: true,
  };
}
