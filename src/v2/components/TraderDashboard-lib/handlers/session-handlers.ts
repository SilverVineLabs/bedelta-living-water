import { createConnectExecuteHandler } from "./session-handlers-live";
import { createSessionKeyHandlers } from "./session-handlers-key";
import type { TraderDashboardHandlerDeps } from "./handler-types";

export function createSessionHandlers(deps: TraderDashboardHandlerDeps) {
  const { handleSessionKeyAction, handleDisconnectWallet } = createSessionKeyHandlers(deps);
  const handleConnectOrExecute = createConnectExecuteHandler(deps);
  return {
    handleSessionKeyAction,
    handleDisconnectWallet,
    handleConnectOrExecute,
  };
}
