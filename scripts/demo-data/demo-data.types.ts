export type RegimeId = "sideways" | "bull_trend" | "bear_trend" | "flash_crash";
export type DemoLevelId = 0 | 1 | 2 | 3 | 4 | 5;

export interface RoleTier {
  id: string;
  label: string;
  capitalUsd: number;
}

export interface RegimeDef {
  id: RegimeId;
  label: string;
  movePct: number;
  returnByLevel: readonly [
    number,
    number,
    number,
    number,
    number,
    number,
  ];
}

export interface LevelPnlCell {
  level: DemoLevelId;
  returnPct: number;
  pnlUsd: number;
  equityEndUsd: number;
}

export interface RoleRegimeRow {
  roleId: string;
  roleLabel: string;
  capitalUsd: number;
  levels: LevelPnlCell[];
}
