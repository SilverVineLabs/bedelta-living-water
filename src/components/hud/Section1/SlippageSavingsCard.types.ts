import type { TradeNotionalTier } from "../../../data/verified-5tx";
import type { OperatorUnlockVersion } from "../../../v2/admin/operator-matrix";
import type { SoilResistanceLogEntry } from "./section1-hud-types";
import type { Section1SlippageDisplayState } from "./section1-slippage-display";

export type { TradeNotionalTier as TradeNotionalMode };

export interface SlippageSavingsCardProps {
  hidden?: boolean;
  savedUsd?: number;
  avoidedBps?: number;
  sampleCount?: number;
  windowLabel?: string;
  protocolVersion?: OperatorUnlockVersion;
  notional?: TradeNotionalTier;
  onNotionalChange?: (tier: TradeNotionalTier) => void;
  display?: Section1SlippageDisplayState;
  /** MEV alarm baseline override (bps, positive magnitude). */
  baselineLossBpsOverride?: number;
  /** Override saved bps display (e.g. +142 after MEV recovery). */
  savedBpsOverride?: number;
  /** Aggregate saved USDC from the latest live 5-TX batch (v0.8 proof path). */
  liveProofSavedUsd?: number;
  /** True after at least one successful Live 5-TX batch is recorded. */
  hasLive5TxProof?: boolean;
  mevAttackDisabled?: boolean;
  onInjectMev?: () => void;
  /** Force ultra-vibrant shield glow after MEV recovery. */
  forceUltraShield?: boolean;
  mevAttackPhase?: import("./section1-hud-types").MevAttackPhase;
  mevAttackToxicityBps?: number;
  /** Pulse shield during auto-demo playback. */
  shieldDemoPulse?: boolean;
  /** When false, proofs CTA is rendered by the parent section header. */
  showProofsButton?: boolean;
  baselineAlarmFlash?: boolean;
  chaosSoilTripped?: boolean;
  onChaosRpcDelay?: (payload: {
    soilLog: SoilResistanceLogEntry;
    terminalLine: string;
  }) => void;
  onChaosReset?: () => void;
}
