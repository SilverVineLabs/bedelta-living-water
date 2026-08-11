import type { Dispatch, MutableRefObject, SetStateAction } from "react";
import type {
  MevAttackPhase,
  SoilResistanceLogEntry,
  TxBatchRecord,
} from "../../../../components/hud/Section1/section1-hud-types";
import type { ScaleDownComboId } from "../../../../components/hud/scale-down-presets";
import type { OperatorUnlockVersion } from "../../../admin/operator-matrix";
import type { TerminalLogLine } from "../../LiveRiskTelemetryConsole";

export interface TraderDashboardHandlerDeps {
  physicalDeadlock: boolean;
  walletAddress: string | null;
  setWalletAddress: Dispatch<SetStateAction<string | null>>;
  txBatches: TxBatchRecord[];
  setTxBatches: Dispatch<SetStateAction<TxBatchRecord[]>>;
  selectedBatchId: string | null;
  setSelectedBatchId: Dispatch<SetStateAction<string | null>>;
  batchCounterRef: MutableRefObject<number>;
  setTerminalLogs: Dispatch<SetStateAction<TerminalLogLine[]>>;
  setFeedPaused: Dispatch<SetStateAction<boolean>>;
  setDemoRunning: Dispatch<SetStateAction<boolean>>;
  setLiveRunning: Dispatch<SetStateAction<boolean>>;
  setShieldDemoPulse: Dispatch<SetStateAction<boolean>>;
  setSoilResistanceLogs: Dispatch<SetStateAction<SoilResistanceLogEntry[]>>;
  sessionKeyRevoked: boolean;
  setSessionKeyRevoked: Dispatch<SetStateAction<boolean>>;
  sessionKeyBound: boolean;
  setSessionKeyBound: Dispatch<SetStateAction<boolean>>;
  setTtlExpiryMs: Dispatch<SetStateAction<number | null>>;
  setEmergencyToast: Dispatch<SetStateAction<string | null>>;
  setSignatureCancelledBanner: Dispatch<SetStateAction<string | null>>;
  setTerminalPulseActive: Dispatch<SetStateAction<boolean>>;
  setSection1ShakeActive: Dispatch<SetStateAction<boolean>>;
  mevAttackPhase: MevAttackPhase;
  mevAttackToxicityBps: number;
  protocolVersion: OperatorUnlockVersion;
  setMevAttackPhase: Dispatch<SetStateAction<MevAttackPhase>>;
  setMevAttackToxicityBps: Dispatch<SetStateAction<number>>;
  setBaselineAlarmFlash: Dispatch<SetStateAction<boolean>>;
  setForceUltraShield: Dispatch<SetStateAction<boolean>>;
  setMevToast: Dispatch<SetStateAction<string | null>>;
  setScaleDownCombo: Dispatch<SetStateAction<ScaleDownComboId>>;
  soilResistanceLogs: SoilResistanceLogEntry[];
  chaosSoilTripped: boolean;
  setChaosSoilTripped: Dispatch<SetStateAction<boolean>>;
  resetMevAttackState: () => void;
}
