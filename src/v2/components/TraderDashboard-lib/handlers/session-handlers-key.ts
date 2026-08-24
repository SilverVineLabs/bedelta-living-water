import { enterReadOnlyObserver } from "../../../../adapters/hl/session-key-fallback";
import { clearBrowserSessionKeyMaterial } from "../../../../adapters/hl/wallet/browserSessionKeyMaterial";
import { updateSystemState } from "../../../../core/state";
import {
  createTerminalLog,
  EMERGENCY_REVOKE_LOGS,
  SESSION_KEY_REAUTH_LOG,
} from "../../LiveRiskTelemetryConsole";
import {
  appendLogs,
  MAX_TERMINAL_LOGS,
  MEV_TOAST_DURATION_MS,
} from "../trader-dashboard-log-utils";
import type { TraderDashboardHandlerDeps } from "./handler-types";

export function createSessionKeyHandlers(deps: TraderDashboardHandlerDeps) {
  const handleSessionKeyAction = () => {
    if (deps.sessionKeyRevoked) {
      deps.setSessionKeyRevoked(false);
      deps.setSessionKeyBound(false);
      deps.setTtlExpiryMs(null);
      deps.setFeedPaused(false);
      updateSystemState({
        patch: {
          signingChannelOpen: true,
          sessionKeyMode: "TRADE_ACTIVE",
          sessionKeyStatus: "OK",
          hardlock: false,
        },
      });
      deps.setTerminalLogs((prev) =>
        [...prev, createTerminalLog("INFO", SESSION_KEY_REAUTH_LOG)].slice(
          -MAX_TERMINAL_LOGS,
        ),
      );
      return;
    }
    if (deps.walletAddress) {
      clearBrowserSessionKeyMaterial(deps.walletAddress);
    }
    deps.setSessionKeyRevoked(true);
    deps.setSessionKeyBound(false);
    deps.setTtlExpiryMs(null);
    deps.setFeedPaused(true);
    enterReadOnlyObserver("SESSION_KEY_REVOKED");
    deps.setTerminalLogs((prev) =>
      [
        ...prev,
        ...EMERGENCY_REVOKE_LOGS.map((entry) =>
          createTerminalLog(entry.level, entry.message),
        ),
      ].slice(-MAX_TERMINAL_LOGS),
    );
    deps.setEmergencyToast("Session keys revoked · Hot pipeline severed");
    window.setTimeout(() => deps.setEmergencyToast(null), MEV_TOAST_DURATION_MS);
  };

  const handleDisconnectWallet = () => {
    if (deps.walletAddress) {
      clearBrowserSessionKeyMaterial(deps.walletAddress);
    }
    deps.setWalletAddress(null);
    deps.setSessionKeyBound(false);
    deps.setTtlExpiryMs(null);
    deps.setLiveRunning(false);
    deps.setFeedPaused(false);
    appendLogs(deps.setTerminalLogs, [
      {
        level: "INFO",
        message: "WALLET_DISCONNECTED: Session unlinked from Master Command Console",
      },
    ]);
  };

  return { handleSessionKeyAction, handleDisconnectWallet };
}
