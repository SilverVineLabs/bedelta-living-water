/**
 * Santenmoku 64 Weapons Matrix — weapon catalog and name map.
 */

import {
  OPERATOR_SAVED_BPS,
  operatorDisplayCode,
} from "../../../data/operator-matrix";
import {
  appendModuleRoadmapTag,
  MODULE_ROADMAP_TAG,
  operatorModuleRoadmapTag,
} from "../../../data/operator-matrix/module-roadmap-tags";
import type { ProtocolVersion, RainCategoryDef, RainWeaponDef } from "./hud-weapons-matrix-types";

function withDisplayCode(id: string, code: string): string {
  return operatorDisplayCode(id) ?? operatorDisplayCode(code) ?? code;
}

function savedBpsFor(id: string): number {
  return OPERATOR_SAVED_BPS[id] ?? 0;
}

function stub(n: number, unlockVersion: ProtocolVersion | null = null): RainWeaponDef {
  const code = `W${String(n).padStart(2, "0")}`;
  const meta = STUB_NAME_BY_CODE[n] ?? code;
  const displayCode = withDisplayCode(code, code);
  return {
    id: code,
    code,
    displayCode,
    unlockVersion,
    savedBpsEstimate: savedBpsFor(code),
    labelEn: appendModuleRoadmapTag(
      `${displayCode} ${meta}`,
      MODULE_ROADMAP_TAG.V15_ROADMAP,
    ),
  };
}

function known(
  id: string,
  code: string,
  unlockVersion: ProtocolVersion | null,
  labelEn: string,
): RainWeaponDef {
  const displayCode = withDisplayCode(id, code);
  const stripLegacy = (s: string) =>
    s.replace(/^W\d+\s+/, "").replace(new RegExp(`^${displayCode}\\s+`), "");
  const enLabel = stripLegacy(labelEn);
  const roadmapTag = operatorModuleRoadmapTag(id);
  return {
    id,
    code,
    displayCode,
    unlockVersion,
    savedBpsEstimate: savedBpsFor(id),
    labelEn: appendModuleRoadmapTag(`${displayCode} ${enLabel}`, roadmapTag),
  };
}

const STUB_NAME_BY_CODE: Readonly<Record<number, string>> = {
  4: "Bitwise Mirror Flip",
  5: "Dual-Phase Strike",
  6: "Flash Execution",
  7: "Mirror Reflection",
  8: "Tempo Adaptation",
  9: "Cycle Cooling",
  10: "Historical Oracle",
  11: "RWA Anchor",
  13: "Depth Refill",
  14: "Liquidity Bridge",
  16: "Risk Buffer",
  17: "Heat Dissipation",
  18: "Iceberg Deterrence",
  19: "Pressure Refill",
  20: "Shortwave Absorption",
  21: "Long-Tail Defense",
  22: "Circuit Breaker",
  23: "Slope Gate",
  24: "Rate Noise Suppression",
  25: "Path Rectifier",
  26: "Node Split",
  27: "Supply Balance",
  28: "Reactive Settling",
  29: "Deep-Water Cruise",
  30: "Boundary Lock",
  31: "Market Breathing",
  32: "Noise Filtering",
  33: "Style Rotation",
  35: "Fee Mirror",
  36: "Anchor Repair",
  37: "Time-Window Control",
  38: "Momentum Cushion",
  41: "Linear Echo",
  42: "Dual-Domain Sync",
  44: "Threshold Alert",
  46: "Disconnect Insurance",
  48: "Hotspot Isolation",
  49: "Annealing Control",
  50: "Cold-Start Archive",
  51: "Storm Return",
  53: "Supply Backfill",
  54: "Anti-Noise Rebuild",
  55: "Low-Latency Gate",
  56: "Structure Calibration",
  57: "Risk Seal",
  59: "Pressure Diversion",
  60: "Deep Guardrail",
  61: "Zero-Leak Seal",
  62: "Drawdown Cushion",
  63: "Steady-State Ballast",
  64: "Terminal Relief",
} as const;

export const RAIN_CATEGORIES: readonly RainCategoryDef[] = [
  {
    id: "UMBRELLA",
    symbol: "O",
    emoji: "☂️",
    count: 21,
    labelEn: "Δ Umbrella (O)",
    tipEn: "☂️ O-frame: ΔIO anti-oxidant reaction — blocks top-of-book sandwich & MEV.",
    blurbEn: "Blocks top-of-book sandwich & MEV",
    weapons: [known("W43", "W43", "v1.5", "W43 Overcooked Pipeline"), known("W47", "W47", "v1.5", "W47 Dual-Phase Exec"), known("BITWISE", "W34", "v1.5", "UM-03 Bitwise Inversion (~)"), stub(39), stub(4), stub(5), stub(6), stub(7), stub(8), stub(9), stub(10), stub(11), stub(13), stub(14), stub(16), stub(17), stub(18), stub(19), stub(20), stub(21), stub(22)],
  },
  {
    id: "BOOTS",
    symbol: "△",
    emoji: "👢",
    count: 21,
    labelEn: "Δ Boots (△)",
    tipEn: "👢 △ boots base: soil liquidity — checkSoil keeps footing solid.",
    blurbEn: "Hardens soil liquidity — book won't collapse",
    weapons: [known("SOIL", "W01", "v0.8", "W01 checkSoilResistance()"), known("BEDA", "W15", "v0.8", "W15 BeΔ Fluidic Buffer Tank"), stub(40), stub(23), stub(24), stub(25), stub(26), stub(27), stub(28), stub(29), stub(30), stub(31), stub(32), stub(33), stub(35), stub(36), stub(37), stub(38), stub(41), stub(42), stub(44)],
  },
  {
    id: "RAINCOAT",
    symbol: "I",
    emoji: "🧥",
    count: 22,
    labelEn: "Δ Raincoat (I)",
    tipEn: "🧥 I-column raincoat: Zero-Leakage Circuit Isolation — Hot Key insulated, 0% leak.",
    blurbEn: "Zero-Leakage Circuit Isolation",
    weapons: [known("ROOT", "W02", "v0.8", "W02 rootProtection()"), known("SSOT", "W12", "v1.0", "W12 SystemState SSOT"), known("W03", "W03", "v1.0", "W03 Auto-Healing Bandage"), stub(45), stub(46), stub(48), stub(49), stub(50), stub(51), known("W52", "W52", null, "W52 Data Transponder"), stub(53), stub(54), stub(55), stub(56), stub(57), known("W58", "W58", null, "W58 Hard-Shell Armor"), stub(59), stub(60), stub(61), stub(62), stub(63), known("W64", "W64", null, "W64 Piezo Relief")],
  },
] as const;

function normalizeWeaponName(labelEn: string, code: string): string {
  const cleaned = labelEn
    .replace(/\s*(Geometric Operator)\b/gi, "")
    .replace(/\s*\((Geometric Operator)\)/gi, "")
    .trim();
  return cleaned || code;
}

export const WEAPON_NAME_MAP: Readonly<Record<string, string>> = Object.freeze(
  Object.fromEntries(
    RAIN_CATEGORIES.flatMap((category) =>
      category.weapons.map((weapon) => [
        weapon.id,
        normalizeWeaponName(weapon.labelEn, weapon.displayCode),
      ]),
    ),
  ) as Record<string, string>,
);
