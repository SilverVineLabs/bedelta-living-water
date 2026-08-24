/**
 * HUD protection gauge — Trinity 3-mode flat exhibition cards.
 */

import { HUD_VE_DISPLAY } from "./hud-protection-label-constants";
import type { TrinityDefenseCard } from "./hud-protection-label-types";
import { resolveProtectionGauge } from "./hud-protection-label-gauge-resolver";

/**
 * Trinity 3-Mode flat exhibition — all modes visible simultaneously (no hide).
 */
export function resolveTrinityDefenseCards(input: {
  slippageBps: number;
  netYieldBps: number;
  coverage: number;
  archAbsorbing: boolean;
  forceVe: boolean;
  scenario?: import("../../services/demo-simulator-service").DemoSimScenario;
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
