import {
  MEV_ATTACK_BASELINE_BPS,
  MEV_RECOVERY_SAVED_BPS,
  type MevAttackPhase,
  type TxBatchRecord,
} from "../../../components/hud/Section1/section1-hud-types";
import type { SessionKeyStatusTag } from "../../../services/systemState";
import type { Step1ScanResult } from "../../types/step1";
import type { OperatorUnlockVersion } from "../../admin/operator-matrix";
import type { createTraderDashboardHandlers } from "./trader-dashboard-handlers";
import type { TraderDashboardViewState } from "./trader-dashboard-types";
import {
  resetHudSystemStateAfterDeadlock,
  resolveHasActiveSessionKey,
  shouldShowHardlockModal,
} from "../dashboard/deadlock-proof";

type Handlers = ReturnType<typeof createTraderDashboardHandlers>;

export function buildTraderDashboardViewState(input: {
  step1Result: Step1ScanResult;
  protocolVersion: OperatorUnlockVersion;
  scaleDownCombo: TraderDashboardViewState["scaleDownCombo"];
  proofsModalOpen: boolean;
  setProofsModalOpen: (open: boolean) => void;
  telemetryDisconnected: boolean;
  sessionKeyRevoked: boolean;
  circuitBreakerTripped: boolean;
  isLocked: boolean;
  isStale: boolean;
  physicalDeadlock: boolean;
  mevAttackPhase: MevAttackPhase;
  mevAttackToxicityBps: number;
  baselineAlarmFlash: boolean;
  section1ShakeActive: boolean;
  forceUltraShield: boolean;
  shieldDemoPulse: boolean;
  hasLive5TxProof: boolean;
  selectedBatch: TxBatchRecord | null;
  txBatches: TxBatchRecord[];
  selectedBatchId: string | null;
  walletAddress: string | null;
  demoRunning: boolean;
  liveRunning: boolean;
  sessionKeyBound: boolean;
  ttlExpiryMs: number | null;
  handlers: Handlers;
  chaosSoilTripped: boolean;
  terminalLogs: TraderDashboardViewState["terminalLogs"];
  feedPaused: boolean;
  setFeedPaused: React.Dispatch<React.SetStateAction<boolean>>;
  sessionKeyStatus: SessionKeyStatusTag;
  mevToast: string | null;
  emergencyToast: string | null;
  signatureCancelledBanner: string | null;
  terminalPulseActive: boolean;
  deadlockProofToast: string | null;
  setDeadlockProofToast: React.Dispatch<React.SetStateAction<string | null>>;
  setSessionKeyRevoked: React.Dispatch<React.SetStateAction<boolean>>;
  setSessionKeyBound: React.Dispatch<React.SetStateAction<boolean>>;
  setTtlExpiryMs: React.Dispatch<React.SetStateAction<number | null>>;
}): TraderDashboardViewState {
  const {
    step1Result,
    protocolVersion,
    scaleDownCombo,
    proofsModalOpen,
    setProofsModalOpen,
    telemetryDisconnected,
    sessionKeyRevoked,
    circuitBreakerTripped,
    isLocked,
    isStale,
    physicalDeadlock,
    mevAttackPhase,
    mevAttackToxicityBps,
    baselineAlarmFlash,
    section1ShakeActive,
    forceUltraShield,
    shieldDemoPulse,
    hasLive5TxProof,
    selectedBatch,
    txBatches,
    selectedBatchId,
    walletAddress,
    demoRunning,
    liveRunning,
    sessionKeyBound,
    ttlExpiryMs,
    handlers,
    chaosSoilTripped,
    terminalLogs,
    feedPaused,
    setFeedPaused,
    sessionKeyStatus,
    mevToast,
    emergencyToast,
    signatureCancelledBanner,
    terminalPulseActive,
    deadlockProofToast,
    setDeadlockProofToast,
    setSessionKeyRevoked,
    setSessionKeyBound,
    setTtlExpiryMs,
  } = input;

  const isWalletConnected = Boolean(walletAddress);
  const hasActiveSessionKey = resolveHasActiveSessionKey({
    sessionKeyBound,
    sessionKeyRevoked,
    ttlExpiryMs,
  });
  const showHardlockModal = shouldShowHardlockModal({
    isHardlocked: physicalDeadlock,
    isWalletConnected,
    hasActiveSessionKey,
  });

  return {
    step1Result,
    protocolVersion,
    scaleDownCombo,
    proofsModalOpen,
    setProofsModalOpen,
    telemetryDisconnected,
    sessionKeyRevoked,
    circuitBreakerTripped,
    isLocked,
    isStale,
    physicalDeadlock,
    mevAttackPhase,
    mevAttackToxicityBps,
    baselineLossBpsOverride:
      mevAttackPhase === "alarm" ? MEV_ATTACK_BASELINE_BPS : undefined,
    savedBpsOverride:
      mevAttackPhase === "recovered" ? MEV_RECOVERY_SAVED_BPS : undefined,
    baselineAlarmFlash,
    section1ShakeActive,
    section1FocusActive: false,
    forceUltraShield,
    shieldDemoPulse,
    hasLive5TxProof,
    liveProofSavedUsd: selectedBatch?.results.aggregate.savedUsd,
    actionBar: {
      batches: txBatches,
      selectedBatchId,
      walletConnected: Boolean(walletAddress),
      demoRunning,
      liveRunning,
      physicalDeadlock,
      sessionKeyRevoked,
      sessionKeyBound,
      ttlExpiryMs,
      onAutoDemo: handlers.handleAutoDemo,
      onConnectOrExecute: () => void handlers.handleConnectOrExecute(),
      onInjectMev: handlers.handleInjectMev,
      onExportAudit: handlers.handleExportAudit,
      onExportAuditCertificate: handlers.handleExportAuditCertificate,
      onCopyGrantProof: () => void handlers.handleCopyGrantProof(),
      onBatchSelect: handlers.handleBatchSelect,
      onEmergencyRevoke: handlers.handleSessionKeyAction,
      walletAddress,
      onDisconnectWallet: handlers.handleDisconnectWallet,
    },
    handleComboChange: handlers.handleComboChange,
    onChaosRpcDelay: handlers.handleInjectChaosRpcDelay,
    onChaosReset: handlers.handleResetChaosRpcDelay,
    chaosSoilTripped,
    onExportAuditCertificate: handlers.handleExportAuditCertificate,
    onExportDryRunPlaybook: handlers.handleExportDryRunPlaybook,
    onExportFailClosedProofs: handlers.handleExportFailClosedProofs,
    terminalLogs,
    feedPaused,
    setFeedPaused,
    ttlExpiryMs,
    sessionKeyStatus,
    mevToast,
    emergencyToast,
    signatureCancelledBanner,
    terminalPulseActive,
    selectedBatchResults: selectedBatch?.results,
    selectedBatch,
    deadlockProofToast,
    setDeadlockProofToast,
    showHardlockModal,
    handleDeadlockDisconnect: () => {
      resetHudSystemStateAfterDeadlock();
      handlers.handleDisconnectWallet();
      setSessionKeyRevoked(false);
      setSessionKeyBound(false);
      setTtlExpiryMs(null);
      setFeedPaused(false);
      setDeadlockProofToast(null);
      window.location.reload();
    },
  };
}
