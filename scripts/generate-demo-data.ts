/**
 * 4-Regime × 5-Role × 6-Level Real-Money Demo Matrix
 *
 * Usage: pnpm demo:data
 * Output: docs/demo-data-matrix.json (+ terminal tables)
 */

export type {
  RegimeId,
  DemoLevelId,
  LevelPnlCell,
  RoleRegimeRow,
} from "./demo-data/run.js";

import { main } from "./demo-data/run.js";

main();
