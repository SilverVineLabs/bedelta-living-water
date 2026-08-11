import { enterReadOnlyObserver } from "../../../../adapters/hl/session-key-fallback";
import { clearBrowserSessionKeyMaterial } from "../../../../adapters/hl/wallet/browserSessionKeyMaterial";
import {
  buildLiveFillLogTemplate,
  createBatchFromLiveResults,
  formatSha256VerificationAnchorLine,
  formatTcaAnchorGoldenLog,
} from "../../../../components/hud/Section1/section1-hud-engine-lib/section1-hud-engine-core";
import {
  buildWalletConnectedLog,
  connectTestnetWallet,
} from "../../../../components/hud/Section1/section1-hud-wallet-connect";
import { updateSystemState } from "../../../../core/state";
import { VERIFIED_5TX_NOTIONAL_USD } from "../../../../data/verified-5tx";
import { runBrowserLive5Tx } from "../../../services/hl-browser-live-5tx";
import {
  createTerminalLog,
  EMERGENCY_REVOKE_LOGS,
  SESSION_KEY_REAUTH_LOG,
  SESSION_TTL_MS,
  unwrapErrorDetail,
} from "../../LiveRiskTelemetryConsole";
import {
  appendLogs,
  LIVE_FILL_STREAM_MS,
  MAX_TERMINAL_LOGS,
  MEV_TOAST_DURATION_MS,
  playbackLogs,
} from "../trader-dashboard-log-utils";
import {
  isUserSignatureRejection,
  scrollToSection3Terminal,
  SIGNATURE_CANCELLED_BANNER,
} from "../trader-dashboard-scroll-utils";
import type { TraderDashboardHandlerDeps } from "./handler-types";

export function createSessionHandlers(deps: TraderDashboardHandlerDeps) {
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

  const handleConnectOrExecute = async () => {
    if (deps.physicalDeadlock) return;
    if (!deps.walletAddress) {
      const connected = await connectTestnetWallet();
      if (connected) {
        deps.setWalletAddress(connected);
        appendLogs(deps.setTerminalLogs, [buildWalletConnectedLog(connected)]);
      } else {
        appendLogs(deps.setTerminalLogs, [
          {
            level: "WARN",
            message:
              "WALLET_CONNECT_FAILED: No browser wallet detected — install MetaMask/Rabby",
          },
        ]);
      }
      return;
    }
    scrollToSection3Terminal();
    deps.setTerminalPulseActive(true);
    deps.setLiveRunning(true);
    deps.setFeedPaused(true);
    appendLogs(deps.setTerminalLogs, [
      {
        level: "INFO",
        message:
          "LIVE_5TX: initiating sequential HL testnet market orders via Session Key…",
      },
    ]);
    try {
      const fillStreamBuffer: Array<{
        index: number;
        side: string;
        txHash: string;
        latencyMs: number;
      }> = [];
      const results = await runBrowserLive5Tx(
        {
          walletAddress: deps.walletAddress,
          notionalUsd: VERIFIED_5TX_NOTIONAL_USD,
        },
        {
          onLog: (entry) => appendLogs(deps.setTerminalLogs, [entry]),
          onSessionBound: () => {
            deps.setSessionKeyBound(true);
            deps.setTtlExpiryMs(Date.now() + SESSION_TTL_MS);
          },
          onFillConfirmed: (index, side, txHash, latencyMs) => {
            fillStreamBuffer.push({ index, side, txHash, latencyMs });
          },
        },
      );
      if (results.soilAudit) {
        deps.setSoilResistanceLogs((prev) => [
          ...prev,
          {
            at: results.timestamp,
            tripped: results.soilAudit!.tripped,
            crossVenueSlippagePct: Number(
              (results.soilAudit!.crossVenueSlippage * 100).toFixed(4),
            ),
            reasons: results.soilAudit!.tripped ? ["LIVE_BATCH_SOIL"] : [],
          },
        ]);
      }
      deps.batchCounterRef.current += 1;
      const batch = createBatchFromLiveResults(deps.batchCounterRef.current, results);
      deps.setTxBatches((prev) => [batch, ...prev]);
      deps.setSelectedBatchId(batch.id);
      const fillTemplates = fillStreamBuffer.map((fill) =>
        buildLiveFillLogTemplate(fill.index, fill.side, fill.txHash, fill.latencyMs),
      );
      await new Promise<void>((resolve) => {
        playbackLogs(deps.setTerminalLogs, fillTemplates, LIVE_FILL_STREAM_MS, resolve);
      });
      appendLogs(deps.setTerminalLogs, [
        { level: "SYSTEM", message: formatSha256VerificationAnchorLine(batch) },
        { level: "SYSTEM", message: formatTcaAnchorGoldenLog(batch) },
        {
          level: "SYSTEM",
          message: results.livePost
            ? `LIVE_5TX: batch ${batch.id} committed · 5/5 on-chain fills`
            : `LIVE_5TX: batch ${batch.id} committed · 5/5 telemetry pipeline fills`,
        },
      ]);
    } catch (err) {
      if (isUserSignatureRejection(err)) {
        deps.setSignatureCancelledBanner(SIGNATURE_CANCELLED_BANNER);
        window.setTimeout(() => deps.setSignatureCancelledBanner(null), MEV_TOAST_DURATION_MS);
        appendLogs(deps.setTerminalLogs, [
          {
            level: "WARN",
            message: "LIVE_5TX_ABORT: User rejected EIP-712 signature request",
          },
        ]);
      } else {
        appendLogs(deps.setTerminalLogs, [
          { level: "ERROR", message: `LIVE_5TX_ABORT: ${unwrapErrorDetail(err)}` },
        ]);
      }
    } finally {
      deps.setLiveRunning(false);
      deps.setFeedPaused(false);
      deps.setTerminalPulseActive(false);
    }
  };

  return {
    handleSessionKeyAction,
    handleDisconnectWallet,
    handleConnectOrExecute,
  };
}
