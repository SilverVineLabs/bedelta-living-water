import type { TxBatchRecord } from "../section1-hud-types";
import type { TradeNotionalTier } from "../../../../data/verified-5tx";
import type { OperatorUnlockVersion } from "../../../../v2/admin/operator-matrix";

export interface Section1ActionBarProps {
  batches: readonly TxBatchRecord[];
  selectedBatchId: string | null;
  walletConnected: boolean;
  demoRunning: boolean;
  liveRunning: boolean;
  physicalDeadlock: boolean;
  sessionKeyRevoked: boolean;
  sessionKeyBound: boolean;
  ttlExpiryMs: number | null;
  protocolVersion?: OperatorUnlockVersion;
  mevAttackActive?: boolean;
  baselineLossBps?: number;
  baselineLossUsd?: number;
  notional?: TradeNotionalTier;
  baselineAlarmFlash?: boolean;
  onAutoDemo: () => void;
  onConnectOrExecute: () => void;
  onInjectMev: () => void;
  onExportAudit: () => void;
  onExportAuditCertificate: () => void;
  onCopyGrantProof: () => void;
  onBatchSelect: (batchId: string) => void;
  onEmergencyRevoke: () => void;
  walletAddress?: string | null;
  onDisconnectWallet?: () => void;
}

export interface ActionBarControlProps {
  disabled: boolean;
}

export interface TwinEngineButtonsProps extends ActionBarControlProps {
  walletConnected: boolean;
  executeDisabled: boolean;
  signatureDeadlocked: boolean;
  onAutoDemo: () => void;
  onConnectOrExecute: () => void;
}

export interface MevAttackInjectorProps extends ActionBarControlProps {
  mevAttackActive?: boolean;
  protocolVersion?: OperatorUnlockVersion;
  onInjectMev: () => void;
}

export interface BatchHistoryDropdownProps {
  batches: readonly TxBatchRecord[];
  selectedBatchId: string | null;
  onBatchSelect: (batchId: string) => void;
  actionsDisabled?: boolean;
  onExportAudit: () => void;
  onExportAuditCertificate: () => void;
  onCopyGrantProof: () => void;
  walletAddress?: string | null;
}

export interface EmergencyRevokeButtonProps {
  walletConnected: boolean;
  sessionKeyActive: boolean;
  sessionKeyRevoked: boolean;
  demoRunning?: boolean;
  ttlExpiryMs: number | null;
  onEmergencyRevoke: () => void;
}
