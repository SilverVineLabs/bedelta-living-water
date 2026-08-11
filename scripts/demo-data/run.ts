import { mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { buildMatrix, OUT } from "./demo-data.matrix";
import {
  printFullLevelPct,
  printRegimeRoleTables,
  printShockTable,
} from "./demo-data.print";

export function main(): void {
  const matrix = buildMatrix();
  mkdirSync(dirname(OUT), { recursive: true });
  writeFileSync(OUT, `${JSON.stringify(matrix, null, 2)}\n`, "utf8");

  console.log("");
  console.log("══ 4-Regime Multi-Dimensional Real-Money Matrix ══");
  console.log(
    "Presentation: 0 → 1 → 5 Shock Hook  ·  then Lv2–Lv4 roadmap fill",
  );
  console.log(`Engine: ${matrix.engine}`);
  printShockTable(matrix);
  printRegimeRoleTables(matrix);
  printFullLevelPct();
  console.log(`Wrote ${OUT}`);
}

export type {
  RegimeId,
  DemoLevelId,
  LevelPnlCell,
  RoleRegimeRow,
} from "./demo-data.types";
