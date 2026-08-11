import { ALMGREN_CHRISS_PATH_COUNT } from "../../src/core/weapons/almgren-chriss-twap";
import type { DemoLevelId, RegimeDef, RoleTier } from "./demo-data.types";

const F1_PITSTOP_BUDGET_MS = 1_800;
const ELASTICITY_EARLY_WARN_MS = 20;

export const ROLES: readonly RoleTier[] = [
  { id: "retail", label: "Retail", capitalUsd: 1_000 },
  { id: "pro", label: "Pro", capitalUsd: 10_000 },
  { id: "project", label: "Project", capitalUsd: 50_000 },
  { id: "family_office", label: "FamilyOffice", capitalUsd: 200_000 },
  { id: "institution", label: "Institution", capitalUsd: 1_000_000 },
] as const;

export const REGIMES: readonly RegimeDef[] = [
  {
    id: "sideways",
    label: "Sideways / Boring (±5%)",
    movePct: 0,
    returnByLevel: [-0.018, 0, 0.003, 0.006, 0.009, 0.012],
  },
  {
    id: "bull_trend",
    label: "Bull Trend (+5%)",
    movePct: 0.05,
    returnByLevel: [0.031, 0.05, 0.054, 0.058, 0.063, 0.068],
  },
  {
    id: "bear_trend",
    label: "Bear Trend (−5%)",
    movePct: -0.05,
    returnByLevel: [-0.085, -0.008, -0.004, 0.002, 0.01, 0.018],
  },
  {
    id: "flash_crash",
    label: "Flash Crash (−35%)",
    movePct: -0.35,
    returnByLevel: [-0.384, -0.008, -0.005, -0.002, 0.0, 0.056],
  },
] as const;

export const LEVEL_META = [
  {
    level: 0 as DemoLevelId,
    tier: "Native Baseline",
    status: "BASELINE",
    weapons: ["Market dump", "No soil", "No Max SL", "No TWAP"],
  },
  {
    level: 1 as DemoLevelId,
    tier: "v0.8 Core Deliverable",
    status: "GRANT_TARGET",
    weapons: [
      "checkSoilResistance",
      "Dynamic Max SL",
      `AlmgrenChriss ${ALMGREN_CHRISS_PATH_COUNT}-Path`,
      "FractionalKelly",
    ],
  },
  {
    level: 2 as DemoLevelId,
    tier: "v1.5 Citadel Armor",
    status: "CITADEL",
    weapons: ["Dual-Radar", "Sasang", "AF 1.5×", "KumoCloud"],
  },
  {
    level: 3 as DemoLevelId,
    tier: "v2.0 Sovereign Engine",
    status: "SOVEREIGN",
    weapons: [`F1 Pit ≤${F1_PITSTOP_BUDGET_MS}ms`, "RacingLine", "Oracle evade"],
  },
  {
    level: 4 as DemoLevelId,
    tier: "CONFIDENTIAL / COMING SOON",
    status: "CONFIDENTIAL",
    weapons: ["ZK Anti-Reflexivity", "SlotJitterPredictor"],
  },
  {
    level: 5 as DemoLevelId,
    tier: "Santenmoku Apex",
    status: "APEX",
    weapons: [
      "OrderbookElasticityTensionSensor",
      "TensionDivergenceArbitrage",
      `Early-warn ≤${ELASTICITY_EARLY_WARN_MS}ms`,
    ],
  },
] as const;

export { F1_PITSTOP_BUDGET_MS, ELASTICITY_EARLY_WARN_MS };
