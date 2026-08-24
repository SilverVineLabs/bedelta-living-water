/**
 * HUD protection gauge — state label resolver.
 */

import type { DemoSimScenario } from "../../services/demo-simulator-service";
import type { ShieldMorphId } from "../../services/tension-engine-service";
import {
  BANDAGE_SCENARIOS,
  isHudVeActive,
  PROTECTION_GAUGE_TIPS,
} from "./hud-protection-label-constants";
import type { ProtectionStateLabel } from "./hud-protection-label-types";

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
