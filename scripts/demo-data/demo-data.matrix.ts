import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { computeEffectiveMaxSlUsd } from "../../src/services/effective-max-sl";
import {
  DEFAULT_FRACTIONAL_KELLY,
  computeFractionalKellyFraction,
} from "../../src/core/weapons/kelly-risk-engine";
import { LEVEL_META, REGIMES, ROLES } from "./demo-data.constants";
import type {
  DemoLevelId,
  RegimeDef,
  RoleRegimeRow,
  RoleTier,
} from "./demo-data.types";

const __dirname = dirname(fileURLToPath(import.meta.url));
export const ROOT = join(__dirname, "../..");
export const OUT = join(ROOT, "docs/demo-data-matrix.json");

function round2(n: number): number {
  return Number(n.toFixed(2));
}

function computeRoleRegime(role: RoleTier, regime: RegimeDef): RoleRegimeRow {
  const levels = regime.returnByLevel.map((ret, i) => {
    const pnlUsd = round2(role.capitalUsd * ret);
    return {
      level: i as DemoLevelId,
      returnPct: Number((ret * 100).toFixed(2)),
      pnlUsd,
      equityEndUsd: round2(role.capitalUsd + pnlUsd),
    };
  });
  return {
    roleId: role.id,
    roleLabel: role.label,
    capitalUsd: role.capitalUsd,
    levels,
  };
}

export function buildMatrix() {
  const byRegime = REGIMES.map((regime) => ({
    regimeId: regime.id,
    label: regime.label,
    movePct: regime.movePct,
    roles: ROLES.map((role) => computeRoleRegime(role, regime)),
  }));

  const shockHook = REGIMES.map((regime) => {
    const inst = computeRoleRegime(ROLES[4]!, regime);
    const proj = computeRoleRegime(ROLES[2]!, regime);
    const pick = (row: RoleRegimeRow, lv: 0 | 1 | 5) => row.levels[lv]!;
    return {
      regimeId: regime.id,
      label: regime.label,
      institution_1m: {
        lv0: pick(inst, 0),
        lv1: pick(inst, 1),
        lv5: pick(inst, 5),
        shockDeltaLv5VsLv0Usd: round2(
          pick(inst, 5).pnlUsd - pick(inst, 0).pnlUsd,
        ),
      },
      project_50k: {
        lv0: pick(proj, 0),
        lv1: pick(proj, 1),
        lv5: pick(proj, 5),
        shockDeltaLv5VsLv0Usd: round2(
          pick(proj, 5).pnlUsd - pick(proj, 0).pnlUsd,
        ),
      },
    };
  });

  const equity = 100_000;
  const maxSl = computeEffectiveMaxSlUsd(equity);
  const kellyF = computeFractionalKellyFraction({
    winProb: 0.55,
    winLossRatio: 1.2,
    kellyFraction: DEFAULT_FRACTIONAL_KELLY,
  });

  return {
    schema: "silvervine.demo-data-matrix/v3",
    generatedAt: new Date().toISOString(),
    grantTargetLevel: 1,
    presentationOrder: [0, 1, 5, 2, 3, 4] as const,
    presentationNote: "0 → 1 → 5 Shock Hook, then fill Lv2–Lv4 roadmap",
    engine: "Santenmoku Dynamic Tension Engine",
    roles: ROLES,
    levels: LEVEL_META.map((m) => ({
      ...m,
      dynamicMaxSlExample:
        m.level === 1 ? `$${maxSl.toFixed(0)} @ $${equity}` : undefined,
      kellyFractionExample: m.level === 1 ? kellyF : undefined,
    })),
    regimes: byRegime,
    shockHook,
    comparisonHighlights: {
      flash_crash_institution_lv0_pnl: shockHook[3]!.institution_1m.lv0.pnlUsd,
      flash_crash_institution_lv1_pnl: shockHook[3]!.institution_1m.lv1.pnlUsd,
      flash_crash_institution_lv5_pnl: shockHook[3]!.institution_1m.lv5.pnlUsd,
      flash_crash_institution_shock_delta_usd:
        shockHook[3]!.institution_1m.shockDeltaLv5VsLv0Usd,
      grantSlogan:
        "From −38.4% naked cascade to 0% ruin · −0.8% Max DD (v0.8 Grant) · Apex +5.6% under crash",
    },
  };
}

export type DemoMatrix = ReturnType<typeof buildMatrix>;
