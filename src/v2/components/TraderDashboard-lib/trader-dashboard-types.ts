import type { Dispatch, SetStateAction } from "react";
import type { Section1ContainerProps } from "../../../components/hud/Section1/Section1Container";
import type { Section1ActionBarProps } from "../../../components/hud/Section1/ActionBar/types";
import type { MevAttackPhase } from "../../../components/hud/Section1/section1-hud-types";
import type { ScaleDownComboId } from "../../../components/hud/scale-down-presets";
import type { Verified5TxResults } from "../../../data/verified-5tx";
import type { SessionKeyStatusTag } from "../../../services/systemState";
import type { LiveDashboardViewModel } from "../../services/live-dashboard";
import { runStep1Scan } from "../../services/step1-engine";
import type { OperatorUnlockVersion } from "../../admin/operator-matrix";
import type { MockConfig, Step1ScanResult } from "../../types/step1";
import type { TerminalLogLine } from "../LiveRiskTelemetryConsole";

export type DashboardViewMode = "santenmoku" | "minimal";
export const DEFAULT_DASHBOARD_VIEW_MODE: DashboardViewMode = "santenmoku";

export interface ApiSyncState {
  loading: boolean;
  error: string | null;
  refresh: () => void;
  pairCount: number;
}

export interface TraderDashboardProps {
  result: Step1ScanResult;
  onFire?: () => void;
  defaultViewMode?: DashboardViewMode;
  viewMode?: DashboardViewMode;
  onViewModeChange?: (mode: DashboardViewMode) => void;
  isMockMode?: boolean;
  defaultVix?: number;
  defaultDvol?: number;
  mockScanConfig?: MockConfig;
  onBootstrapScan?: typeof runStep1Scan;
  liveView?: LiveDashboardViewModel;
  apiSync?: ApiSyncState;
}

export interface TraderDashboardViewState {
  step1Result: Step1ScanResult;
  protocolVersion: OperatorUnlockVersion;
  scaleDownCombo: ScaleDownComboId;
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
  baselineLossBpsOverride: number | undefined;
  savedBpsOverride: number | undefined;
  baselineAlarmFlash: boolean;
  section1ShakeActive: boolean;
  section1FocusActive: boolean;
  forceUltraShield: boolean;
  shieldDemoPulse: boolean;
  hasLive5TxProof: boolean;
  liveProofSavedUsd: number | undefined;
  actionBar: Section1ActionBarProps;
  onChaosRpcDelay: NonNullable<Section1ContainerProps["onChaosRpcDelay"]>;
  onChaosReset: NonNullable<Section1ContainerProps["onChaosReset"]>;
  chaosSoilTripped: boolean;
  onExportAuditCertificate: () => void;
  onExportDryRunPlaybook: () => void;
  onExportFailClosedProofs: () => void;
  handleComboChange: (combo: ScaleDownComboId) => void;
  terminalLogs: TerminalLogLine[];
  feedPaused: boolean;
  setFeedPaused: Dispatch<SetStateAction<boolean>>;
  ttlExpiryMs: number | null;
  sessionKeyStatus: SessionKeyStatusTag;
  mevToast: string | null;
  emergencyToast: string | null;
  signatureCancelledBanner: string | null;
  terminalPulseActive: boolean;
  selectedBatchResults: Verified5TxResults | undefined;
  selectedBatch: import("../../../components/hud/Section1/section1-hud-types").TxBatchRecord | null;
  deadlockProofToast: string | null;
  setDeadlockProofToast: Dispatch<SetStateAction<string | null>>;
  showHardlockModal: boolean;
  handleDeadlockDisconnect: () => void;
}
