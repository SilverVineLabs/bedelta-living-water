import { useEffect, useState, type ReactNode } from "react";
import type { OperatorUnlockVersion } from "../../../v2/admin/operator-matrix";
import {
  defaultNotionalTierForPreset,
  type TradeNotionalTier,
} from "../../../data/verified-5tx";
import { SlippageSavingsCard } from "./SlippageSavingsCard";
import { PublicGoodTelemetryRadar } from "../PublicGoodTelemetryRadar";
import { resolveSection1SlippageDisplay } from "./section1-slippage-display";
import type { MevAttackPhase } from "./section1-hud-types";

export interface Section1ContainerProps {
  protocolVersion: OperatorUnlockVersion;
  mevAttackPhase: MevAttackPhase;
  mevAttackToxicityBps: number;
  baselineLossBpsOverride?: number;
  baselineAlarmFlash: boolean;
  section1ShakeActive?: boolean;
  forceUltraShield: boolean;
  shieldDemoPulse: boolean;
  savedBpsOverride?: number;
  hasLive5TxProof?: boolean;
  liveProofSavedUsd?: number;
  mevAttackDisabled?: boolean;
  onInjectMev: () => void;
  section1FocusActive?: boolean;
  onChaosRpcDelay?: (payload: {
    soilLog: import("./section1-hud-types").SoilResistanceLogEntry;
    terminalLine: string;
  }) => void;
  onChaosReset?: () => void;
  chaosSoilTripped?: boolean;
  embeddedInPhase?: boolean;
}

export function Section1Container({
  protocolVersion,
  mevAttackPhase,
  mevAttackToxicityBps,
  baselineLossBpsOverride,
  baselineAlarmFlash,
  section1ShakeActive = false,
  forceUltraShield,
  shieldDemoPulse,
  savedBpsOverride,
  hasLive5TxProof = false,
  liveProofSavedUsd,
  mevAttackDisabled = false,
  onInjectMev,
  section1FocusActive = false,
  onChaosRpcDelay,
  chaosSoilTripped = false,
  onChaosReset,
  embeddedInPhase = false,
}: Section1ContainerProps): ReactNode {
  const [notional, setNotional] = useState<TradeNotionalTier>("1K");

  useEffect(() => {
    if (protocolVersion === "v0.8") {
      setNotional("1K");
      return;
    }
    setNotional(defaultNotionalTierForPreset(protocolVersion));
  }, [protocolVersion]);

  const display = resolveSection1SlippageDisplay({
    notional,
    protocolVersion,
    savedBpsOverride:
      mevAttackPhase === "recovered" ? savedBpsOverride : undefined,
    hasLive5TxProof: hasLive5TxProof ?? false,
    liveProofSavedUsd,
    baselineLossBpsOverride,
    forceUltraShield,
    mevAttackPhase,
    mevAttackToxicityBps,
  });
  return (
    <div
      id="section-1-anchor"
      className={[
        "flex w-full min-w-0 flex-col space-y-3 overflow-visible transition-all duration-700 ease-in-out",
        section1ShakeActive ? "animate-section1-shake" : "",
      ].join(" ")}
      aria-label="Section 1: Slippage Savings and Telemetry"
      data-testid="hud-telemetry-region"
      data-shake-active={section1ShakeActive ? "true" : "false"}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        {embeddedInPhase ? null : (
          <p className="font-data text-[10px] uppercase tracking-[0.22em] text-zinc-400">
            [ SECTION 1: SLIPPAGE SAVINGS &amp; TELEMETRY ]
          </p>
        )}
      </div>
      <PublicGoodTelemetryRadar
        variant="inline"
        focusHighlight={section1FocusActive}
      />
      <SlippageSavingsCard
        protocolVersion={protocolVersion}
        notional={notional}
        onNotionalChange={setNotional}
        display={display}
        baselineAlarmFlash={baselineAlarmFlash}
        forceUltraShield={forceUltraShield}
        shieldDemoPulse={shieldDemoPulse}
        hasLive5TxProof={hasLive5TxProof}
        mevAttackDisabled={mevAttackDisabled}
        onInjectMev={onInjectMev}
        mevAttackPhase={mevAttackPhase}
        mevAttackToxicityBps={mevAttackToxicityBps}
        chaosSoilTripped={chaosSoilTripped}
        onChaosRpcDelay={onChaosRpcDelay}
        onChaosReset={onChaosReset}
      />
    </div>
  );
}

/** @deprecated Use Section1Container */
export const Section1SavingsCard = Section1Container;
export type Section1SavingsCardProps = Section1ContainerProps;
