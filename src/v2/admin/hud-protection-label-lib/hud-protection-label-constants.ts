/**
 * HUD protection gauge — constants and VE gate helpers.
 */

/** Scenarios that open a liquidity void → W03 bandage. */
export const BANDAGE_SCENARIOS: ReadonlySet<string> = new Set([
  "LIQUIDITY_HOLE_VACUUM",
  "FLASH_CRASH_BLACK_SWAN",
  "HIGH_VOLATILITY_SQUEEZE",
]);

/** Public VE display center — Index band logic stays out of this module. */
export const HUD_VE_DISPLAY = 50;

/** HUD-only VE gate (no engine import → no Index band constants in SPA). */
export function isHudVeActive(tension: number): boolean {
  const t = Number(tension);
  return Number.isFinite(t) && Number(t.toFixed(2)) === HUD_VE_DISPLAY;
}

export const PROTECTION_GAUGE_TIPS = {
  absorbing:
    "[Santenmoku Citadel Shield] Auto-absorbs extreme market impact and MEV sell pressure, cancels high-slippage kinetic energy, and guards principal at 0% ruin.",
  bandage:
    "[Santenmoku Self-Heal Defense] Liquidity void detected — W03 auto-draws BeΔ tank capital to patch the book instantly, stopping cascade liquidation and premium blowout.",
  ve: "[Santenmoku zero-point kinetic release] At exclusive Vector Equilibrium, absorbed market impact converts fully into liquidity yield — 0.00 bps zero-slippage best execution.",
} as const;

export const WIKI_CORE_STATES = [
  {
    id: "ARMOR_ABSORBING" as const,
    emoji: "🛡️",
    titleEn: "Santenmoku Citadel Shield Absorbing",
    triggerEn:
      "Trigger: Santenmoku Tension off Vector Equilibrium, or high-impact / Ruin Lock.",
    principleEn:
      "Principle: like Santenmoku Citadel Shield — redistribute singular liquidation pressure across the defense mesh; no single-point ruin.",
    deltaEn:
      "Δ benefit: live Δ Absorption (bps) and Δ Risk Drop (%) prove Citadel Shield converting impact into measurable protection.",
  },
  {
    id: "SELF_HEALING" as const,
    emoji: "🩹",
    titleEn: "W03 Liquidity Self-Heal Bandage",
    triggerEn:
      "Trigger: extreme sell pressure or liquidity void (flash crash / vacuum / squeeze).",
    principleEn:
      "Principle: W03 draws BeΔ tank capital to patch the book gap — bandage the void before it spreads.",
    deltaEn:
      "Δ benefit: live Δ Void Patch 100% and Δ Depth Refill (bps) prove the liquidity void is sealed.",
  },
  {
    id: "VE_ZERO_FRICTION" as const,
    emoji: "☯️",
    titleEn: "Santenmoku Vector Equilibrium",
    triggerEn:
      "Trigger: Santenmoku Tension at Vector Equilibrium, or Auto-Optimize enters VE demo state.",
    principleEn:
      "Principle: at Santenmoku Vector Equilibrium, absorbed impact converts to liquidity yield — micro-spread and friction cancel.",
    deltaEn:
      "Δ benefit: Δ Friction = 0.00 bps with live Δ Net Yield (bps) as zero-friction proof.",
  },
] as const;

export function needsBandage(scenario: string | undefined): boolean {
  return Boolean(scenario && BANDAGE_SCENARIOS.has(scenario));
}

export function buildAbsorbBars(pct: number): string {
  const filled = Math.max(0, Math.min(10, Math.round((pct / 100) * 10)));
  return `[${"|".repeat(filled)}${".".repeat(10 - filled)}]`;
}
