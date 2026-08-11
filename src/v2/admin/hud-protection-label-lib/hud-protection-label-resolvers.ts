/**
 * HUD protection gauge — state label + gauge resolvers.
 */

import type { DemoSimScenario } from "../../services/demo-simulator-service";
import type { ShieldMorphId } from "../../services/tension-engine-service";
import {
  BANDAGE_SCENARIOS,
  buildAbsorbBars,
  HUD_VE_DISPLAY,
  isHudVeActive,
  needsBandage,
  PROTECTION_GAUGE_TIPS,
} from "./hud-protection-label-constants";
import type {
  ProtectionGaugeView,
  ProtectionStateLabel,
  TrinityDefenseCard,
} from "./hud-protection-label-types";

/**
 * Map tension + shield morph → plain-language psychological safety badge.
 */
export function resolveProtectionStateLabel(input: {
  santenmokuTension: number;
  shieldMorphId: ShieldMorphId;
  scenario?: DemoSimScenario;
}): ProtectionStateLabel {
  if (isHudVeActive(input.santenmokuTension)) {
    return {
      id: "VE_ZERO_FRICTION",
      emoji: "☯️",
      labelEn: "Santenmoku Vector Equilibrium",
      pulse: true,
      tipEn: PROTECTION_GAUGE_TIPS.ve,
    };
  }

  if (input.scenario && BANDAGE_SCENARIOS.has(input.scenario)) {
    return {
      id: "SELF_HEALING",
      emoji: "🩹",
      labelEn: "W03 Self-Heal Bandage (Auto-Healing Liquid Void)",
      pulse: true,
      tipEn: PROTECTION_GAUGE_TIPS.bandage,
    };
  }

  if (input.shieldMorphId === "RUIN_LOCK_SHIELD") {
    return {
      id: "HARD_LOCK",
      emoji: "🛡️",
      labelEn: "Santenmoku Citadel Shield Absorbing",
      pulse: true,
      tipEn: PROTECTION_GAUGE_TIPS.absorbing,
    };
  }

  if (
    input.shieldMorphId === "ANTI_MEV_COUNTER_SHIELD" ||
    (input.santenmokuTension >= 10 && input.santenmokuTension < 40)
  ) {
    return {
      id: "COUNTERSTRIKE",
      emoji: "⚔️",
      labelEn: "Anti-MEV Rhythm Lock",
      pulse: true,
      tipEn: PROTECTION_GAUGE_TIPS.absorbing,
    };
  }

  if (input.santenmokuTension < 80) {
    return {
      id: "ARMOR_ABSORBING",
      emoji: "🛡️",
      labelEn: "Santenmoku Citadel Shield Absorbing",
      pulse: true,
      tipEn: PROTECTION_GAUGE_TIPS.absorbing,
    };
  }

  return {
    id: "CALM_AEGIS",
    emoji: "🐱",
    labelEn: "Calm Aegis",
    pulse: false,
    tipEn: "Santenmoku Tension stable — base aegis online; calm execution window.",
  };
}

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

/**
 * Trinity 3-Mode flat exhibition — all modes visible simultaneously (no hide).
 */
export function resolveTrinityDefenseCards(input: {
  slippageBps: number;
  netYieldBps: number;
  coverage: number;
  archAbsorbing: boolean;
  forceVe: boolean;
  scenario?: DemoSimScenario;
}): TrinityDefenseCard[] {
  const bandageGauge = resolveProtectionGauge({
    santenmokuTension: 18,
    slippageBps: input.slippageBps,
    netYieldBps: input.netYieldBps,
    coverage: input.coverage,
    scenario: "LIQUIDITY_HOLE_VACUUM",
  });
  const citadelGauge = resolveProtectionGauge({
    santenmokuTension: 12,
    slippageBps: input.slippageBps,
    netYieldBps: input.netYieldBps,
    coverage: input.coverage,
    scenario: "NORMAL_RANGING",
  });
  const archGauge = resolveProtectionGauge({
    santenmokuTension: input.forceVe ? HUD_VE_DISPLAY : 50,
    slippageBps: input.slippageBps,
    netYieldBps: input.netYieldBps,
    coverage: input.coverage,
    forceVe: input.forceVe || input.archAbsorbing,
    scenario: input.scenario,
  });

  const depthRefillBps = Math.max(32, Math.round(bandageGauge.depthRefillBps));

  return [
    {
      id: "A",
      emoji: "🩹",
      titleEn: "Mode A: W03 Depth Self-Heal Bandage",
      statusEn: `Auto-Healing Liquid Void Active | Depth Refill +${depthRefillBps} bps`,
      accent: "rose",
      microChart: bandageGauge.microChart,
    },
    {
      id: "B",
      emoji: "🛡️",
      titleEn: "Mode B: Santenmoku Citadel Shield",
      statusEn: "Citadel max absorb | MEV sell-pressure tension → 0% ruin",
      accent: "amber",
      microChart: citadelGauge.microChart,
    },
    {
      id: "C",
      emoji: "☯️",
      titleEn: "Mode C: Integrated Arch Shield",
      statusEn: input.archAbsorbing || input.forceVe
        ? "Arch Shield dynamic | Zero-Slippage Mode active"
        : "Arch Shield idle | Zero-Slippage Mode standby",
      accent: "sky",
      microChart: archGauge.microChart,
    },
  ];
}
