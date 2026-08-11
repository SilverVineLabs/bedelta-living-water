export type { TraderDashboardHandlerDeps } from "./handlers/handler-types";
export { createSessionHandlers } from "./handlers/session-handlers";
export { createSimulationHandlers } from "./handlers/simulation-handlers";
export { createExportProofHandlers } from "./handlers/export-proof-handlers";

import { createExportProofHandlers } from "./handlers/export-proof-handlers";
import { createSessionHandlers } from "./handlers/session-handlers";
import { createSimulationHandlers } from "./handlers/simulation-handlers";
import type { TraderDashboardHandlerDeps } from "./handlers/handler-types";

export function createTraderDashboardHandlers(deps: TraderDashboardHandlerDeps) {
  const session = createSessionHandlers(deps);
  const simulation = createSimulationHandlers(deps);
  const exportProof = createExportProofHandlers(deps);

  return {
    ...session,
    ...simulation,
    ...exportProof,
  };
}
