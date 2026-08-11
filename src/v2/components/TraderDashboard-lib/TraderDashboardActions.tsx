import type { ReactNode } from "react";
import type { OperatorUnlockVersion } from "../../admin/operator-matrix";
import type { Section1ContainerProps } from "../../../components/hud/Section1/Section1Container";
import { Section1Container } from "../../../components/hud/Section1/Section1Container";
import type { MevAttackPhase } from "../../../components/hud/Section1/section1-hud-types";

export interface TraderDashboardActionsProps {
  protocolVersion: OperatorUnlockVersion;
  mevAttackPhase: MevAttackPhase;
  mevAttackToxicityBps: number;
  baselineLossBpsOverride?: number;
  baselineAlarmFlash: boolean;
  section1ShakeActive: boolean;
  forceUltraShield: boolean;
  shieldDemoPulse: boolean;
  savedBpsOverride?: number;
  hasLive5TxProof: boolean;
  liveProofSavedUsd?: number;
  mevAttackDisabled: boolean;
  onInjectMev: () => void;
  section1FocusActive?: boolean;
  onChaosRpcDelay?: Section1ContainerProps["onChaosRpcDelay"];
  onChaosReset?: Section1ContainerProps["onChaosReset"];
  chaosSoilTripped?: boolean;
  embeddedInPhase?: boolean;
}

export function TraderDashboardActions({
  protocolVersion,
  mevAttackPhase,
  mevAttackToxicityBps,
  baselineLossBpsOverride,
  baselineAlarmFlash,
  section1ShakeActive,
  forceUltraShield,
  shieldDemoPulse,
  savedBpsOverride,
  hasLive5TxProof,
  liveProofSavedUsd,
  mevAttackDisabled,
  onInjectMev,
  section1FocusActive = false,
  onChaosRpcDelay,
  onChaosReset,
  chaosSoilTripped = false,
  embeddedInPhase = false,
}: TraderDashboardActionsProps): ReactNode {
  return (
    <Section1Container
      protocolVersion={protocolVersion}
      mevAttackPhase={mevAttackPhase}
      mevAttackToxicityBps={mevAttackToxicityBps}
      baselineLossBpsOverride={baselineLossBpsOverride}
      baselineAlarmFlash={baselineAlarmFlash}
      section1ShakeActive={section1ShakeActive}
      forceUltraShield={forceUltraShield}
      shieldDemoPulse={shieldDemoPulse}
      savedBpsOverride={savedBpsOverride}
      hasLive5TxProof={hasLive5TxProof}
      liveProofSavedUsd={liveProofSavedUsd}
      mevAttackDisabled={mevAttackDisabled}
      onInjectMev={onInjectMev}
      section1FocusActive={section1FocusActive}
      onChaosRpcDelay={onChaosRpcDelay}
      onChaosReset={onChaosReset}
      chaosSoilTripped={chaosSoilTripped}
      embeddedInPhase={embeddedInPhase}
    />
  );
}
