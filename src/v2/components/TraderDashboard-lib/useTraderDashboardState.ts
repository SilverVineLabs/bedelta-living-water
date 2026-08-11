import { useCallback, useMemo, useRef, useState } from "react";
import {
  type MevAttackPhase,
  type SoilResistanceLogEntry,
  type TxBatchRecord,
} from "../../../components/hud/Section1/section1-hud-types";
import { comboToProtocolVersion } from "../../../components/hud/scale-down-presets";
import {
  createSampleHistoricalBatch,
} from "../../../components/hud/Section1/section1-hud-engine-lib/section1-hud-engine-core";
import { useHudStream } from "../../hooks/useHudStream";
import type { LiveDashboardViewModel } from "../../services/live-dashboard";
import type { Step1ScanResult } from "../../types/step1";
import { createTraderDashboardHandlers } from "./trader-dashboard-handlers";
import { buildTraderDashboardViewState } from "./buildTraderDashboardViewState";
import type { ApiSyncState, TraderDashboardViewState } from "./trader-dashboard-types";
import type { SessionKeyStatusTag } from "../../../services/systemState";
import {
  resolveInitialComboFromUrl,
  resolveSelectedBatch,
  seedTerminalLogs,
} from "./trader-dashboard-log-utils";
import { useTraderDashboardEffects } from "./useTraderDashboardEffects";

export function useTraderDashboardState({
  initialResult,
  liveView,
  apiSync,
}: {
  initialResult: Step1ScanResult;
  liveView?: LiveDashboardViewModel;
  apiSync?: ApiSyncState;
}): TraderDashboardViewState {
  const [step1Result] = useState(initialResult);
  const [scaleDownCombo, setScaleDownCombo] = useState(resolveInitialComboFromUrl);
  const [proofsModalOpen, setProofsModalOpen] = useState(false);
  const [mevToast, setMevToast] = useState<string | null>(null);
  const [emergencyToast, setEmergencyToast] = useState<string | null>(null);
  const [signatureCancelledBanner, setSignatureCancelledBanner] = useState<string | null>(null);
  const [deadlockProofToast, setDeadlockProofToast] = useState<string | null>(null);
  const [terminalPulseActive, setTerminalPulseActive] = useState(false);
  const [terminalLogs, setTerminalLogs] = useState(seedTerminalLogs);
  const [feedPaused, setFeedPaused] = useState(false);
  const [sessionKeyRevoked, setSessionKeyRevoked] = useState(false);
  const [sessionKeyBound, setSessionKeyBound] = useState(false);
  const [ttlExpiryMs, setTtlExpiryMs] = useState<number | null>(null);
  const [initialSampleBatch] = useState(() => createSampleHistoricalBatch());
  const [txBatches, setTxBatches] = useState<TxBatchRecord[]>(() => [initialSampleBatch]);
  const [selectedBatchId, setSelectedBatchId] = useState<string | null>(() => initialSampleBatch.id);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [mevAttackPhase, setMevAttackPhase] = useState<MevAttackPhase>("idle");
  const [mevAttackToxicityBps, setMevAttackToxicityBps] = useState(0);
  const [baselineAlarmFlash, setBaselineAlarmFlash] = useState(false);
  const [section1ShakeActive, setSection1ShakeActive] = useState(false);
  const [forceUltraShield, setForceUltraShield] = useState(false);
  const [shieldDemoPulse, setShieldDemoPulse] = useState(false);
  const [demoRunning, setDemoRunning] = useState(false);
  const [liveRunning, setLiveRunning] = useState(false);
  const [soilResistanceLogs, setSoilResistanceLogs] = useState<SoilResistanceLogEntry[]>([]);
  const [chaosSoilTripped, setChaosSoilTripped] = useState(false);
  const batchCounterRef = useRef(0);
  const rotateIndexRef = useRef(0);
  const reviewBootRef = useRef(false);
  const protocolVersion = comboToProtocolVersion(scaleDownCombo);
  const { payload: hudStream, error: hudStreamError } = useHudStream(true);

  const isLocked = step1Result.status === "LOCKED" || liveView?.hardlock === true;
  const isStale = liveView?.systemState?.isStale === true || hudStream?.isStale === true;
  const sessionKeyStatus: SessionKeyStatusTag = sessionKeyRevoked
    ? "SESSION_KEY_REVOKED"
    : liveView?.systemState?.sessionKeyStatus ?? "OK";
  const circuitBreakerTripped =
    isLocked ||
    hudStream?.leftEyeDefense.hardlock === true ||
    hudStream?.leftEyeDefense.status === "LOCKED";
  const telemetryDisconnected =
    Boolean(apiSync?.error) || Boolean(hudStreamError) || isStale;
  const physicalDeadlock = sessionKeyRevoked || circuitBreakerTripped;
  const selectedBatch = resolveSelectedBatch(txBatches, selectedBatchId);
  const hasLive5TxProof = txBatches.some((batch) => batch.batchNumber > 0);

  const resetMevAttackState = useCallback(() => {
    setMevAttackPhase("idle");
    setMevAttackToxicityBps(0);
    setBaselineAlarmFlash(false);
    setSection1ShakeActive(false);
    setForceUltraShield(false);
    setMevToast(null);
    setFeedPaused(false);
  }, []);

  const handlers = useMemo(
    () =>
      createTraderDashboardHandlers({
        physicalDeadlock,
        walletAddress,
        setWalletAddress,
        txBatches,
        setTxBatches,
        selectedBatchId,
        setSelectedBatchId,
        batchCounterRef,
        setTerminalLogs,
        setFeedPaused,
        setDemoRunning,
        setLiveRunning,
        setShieldDemoPulse,
        setSoilResistanceLogs,
        sessionKeyRevoked,
        setSessionKeyRevoked,
        sessionKeyBound,
        setSessionKeyBound,
        setTtlExpiryMs,
        setEmergencyToast,
        setSignatureCancelledBanner,
        setTerminalPulseActive,
        setSection1ShakeActive,
        mevAttackPhase,
        mevAttackToxicityBps,
        protocolVersion,
        setMevAttackPhase,
        setMevAttackToxicityBps,
        setBaselineAlarmFlash,
        setForceUltraShield,
        setMevToast,
        setScaleDownCombo,
        soilResistanceLogs,
        chaosSoilTripped,
        setChaosSoilTripped,
        resetMevAttackState,
      }),
    [
      physicalDeadlock,
      walletAddress,
      txBatches,
      selectedBatchId,
      sessionKeyRevoked,
      sessionKeyBound,
      mevAttackPhase,
      mevAttackToxicityBps,
      protocolVersion,
      soilResistanceLogs,
      chaosSoilTripped,
      resetMevAttackState,
    ],
  );

  useTraderDashboardEffects({
    circuitBreakerTripped,
    sessionKeyRevoked,
    hudStream,
    setTerminalLogs,
    setFeedPaused,
    feedPaused,
    rotateIndexRef,
    reviewBootRef,
    handleAutoDemo: handlers.handleAutoDemo,
  });

  return buildTraderDashboardViewState({
    step1Result, protocolVersion, scaleDownCombo, proofsModalOpen, setProofsModalOpen,
    telemetryDisconnected, sessionKeyRevoked, circuitBreakerTripped, isLocked, isStale,
    physicalDeadlock, mevAttackPhase, mevAttackToxicityBps, baselineAlarmFlash,
    section1ShakeActive, forceUltraShield, shieldDemoPulse, hasLive5TxProof, selectedBatch,
    txBatches, selectedBatchId, walletAddress, demoRunning, liveRunning, sessionKeyBound,
    ttlExpiryMs, handlers, chaosSoilTripped, terminalLogs, feedPaused, setFeedPaused,
    sessionKeyStatus, mevToast, emergencyToast, signatureCancelledBanner, terminalPulseActive,
    deadlockProofToast, setDeadlockProofToast, setSessionKeyRevoked, setSessionKeyBound, setTtlExpiryMs,
  });
}
