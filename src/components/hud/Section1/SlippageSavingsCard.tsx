import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import type { TradeNotionalTier } from "../../../data/verified-5tx";
import { defaultNotionalTierForPreset } from "../../../data/verified-5tx";
import { resolveSection1SlippageDisplay } from "./section1-slippage-display";
import type { SlippageSavingsCardProps } from "./SlippageSavingsCard.types";
export type { SlippageSavingsCardProps, TradeNotionalMode } from "./SlippageSavingsCard.types";
import { SlippageSavingsCardBody } from "./SlippageSavingsCardBody";

export function SlippageSavingsCard({
  hidden = false,
  savedUsd: _savedUsd,
  avoidedBps: _avoidedBps,
  protocolVersion = "v0.8",
  notional: externalNotional,
  onNotionalChange,
  display: externalDisplay,
  showProofsButton = false,
  baselineLossBpsOverride,
  savedBpsOverride,
  liveProofSavedUsd,
  mevAttackDisabled = false,
  onInjectMev = () => undefined,
  forceUltraShield = false,
  mevAttackPhase,
  mevAttackToxicityBps,
  shieldDemoPulse = false,
  hasLive5TxProof = false,
  baselineAlarmFlash = false,
  chaosSoilTripped = false,
  onChaosRpcDelay,
  onChaosReset,
}: SlippageSavingsCardProps): ReactNode {
  const [internalNotional, setInternalNotional] = useState<TradeNotionalTier>("1K");
  const [modalOpen, setModalOpen] = useState(false);
  const notional = externalNotional ?? internalNotional;
  const setNotional = onNotionalChange ?? setInternalNotional;

  useEffect(() => {
    if (externalNotional == null) {
      setInternalNotional(defaultNotionalTierForPreset(protocolVersion));
    }
  }, [externalNotional, protocolVersion]);

  if (hidden) return null;

  const display =
    externalDisplay ??
    resolveSection1SlippageDisplay({
      notional,
      protocolVersion,
      savedBpsOverride,
      hasLive5TxProof,
      liveProofSavedUsd,
      baselineLossBpsOverride,
      forceUltraShield,
      mevAttackPhase,
      mevAttackToxicityBps,
    });

  return (
    <SlippageSavingsCardBody
      hidden={hidden}
      protocolVersion={protocolVersion}
      notional={notional}
      setNotional={setNotional}
      display={display}
      modalOpen={modalOpen}
      setModalOpen={setModalOpen}
      showProofsButton={showProofsButton}
      mevAttackDisabled={mevAttackDisabled}
      onInjectMev={onInjectMev}
      forceUltraShield={forceUltraShield}
      mevAttackPhase={mevAttackPhase}
      shieldDemoPulse={shieldDemoPulse}
      hasLive5TxProof={hasLive5TxProof}
      baselineAlarmFlash={baselineAlarmFlash}
      chaosSoilTripped={chaosSoilTripped}
      onChaosRpcDelay={onChaosRpcDelay}
      onChaosReset={onChaosReset}
    />
  );
}

/** @deprecated Use SlippageSavingsCard */
export const SlippageSavedCard = SlippageSavingsCard;
export type SlippageSavedCardProps = SlippageSavingsCardProps;

export default SlippageSavingsCard;
