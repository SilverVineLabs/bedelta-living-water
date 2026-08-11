import { useEffect, useState, type ReactNode } from "react";
import type { TradeNotionalTier } from "../../../data/verified-5tx";
import { defaultNotionalTierForPreset } from "../../../data/verified-5tx";
import { VerifiedTxTcaModal } from "../../../v2/admin/components/VerifiedTxTcaModal";
import type { OperatorUnlockVersion } from "../../../v2/admin/operator-matrix";
import { EstSavedAmountDisplay } from "./EstSavedAmountDisplay";
import { SlippageDualProgressBar } from "./SlippageDualProgressBar";
import type { SoilResistanceLogEntry } from "./section1-hud-types";
import { ChaosRpcDelayInjector } from "./ActionBar/ChaosRpcDelayInjector";
import { MevAttackInjector } from "./ActionBar/MevAttackInjector";
import { NotionalTierToggleGroup } from "./NotionalTierToggleGroup";
import { ShieldPowerBadge } from "./ShieldPowerBadge";
import { SlippageSavingsHeader } from "./SlippageSavingsHeader";
import { GLACIER_BADGE_CORE_CLASS } from "../glacier-badge-styles";
import type { Section1SlippageDisplayState } from "./section1-slippage-display";
import { resolveSection1SlippageDisplay } from "./section1-slippage-display";

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
    <>
      <section
        className={[
          "relative flex h-full min-h-[320px] flex-col overflow-visible rounded border bg-black/40 px-3 py-3",
          display.theme.border,
          display.theme.glow,
        ].join(" ")}
        aria-label="Estimated slippage saved"
        data-telemetry="slippage-saved"
        data-testid="verified-5tx-telemetry"
        data-protocol-version={protocolVersion}
      >
        <p
          className={[
            "mb-2 inline-flex items-center justify-center gap-1.5 rounded px-3 py-1 text-center",
            GLACIER_BADGE_CORE_CLASS,
          ].join(" ")}
          data-testid="l2-depth-probed-vault-badge"
        >
          [ ⚡ L2 ORDERBOOK DEPTH-PROBED DELTA VAULT · 500ms FAIL-CLOSED ]
        </p>
        <SlippageSavingsHeader
          mevAttackActive={mevAttackPhase != null && mevAttackPhase !== "idle"}
          protocolVersion={protocolVersion}
        />
        <div className="mt-3 flex w-full min-w-0 items-start gap-3 overflow-visible">
          <ShieldPowerBadge
            protocolVersion={protocolVersion}
            theme={display.theme}
            forceUltraShield={forceUltraShield}
            shieldDemoPulse={shieldDemoPulse}
          />
          <div className="min-w-0 flex-1 overflow-visible">
            <EstSavedAmountDisplay
              protocolVersion={protocolVersion}
              notional={notional}
              savedUsdAmount={display.savedUsdAmount}
              savedBps={display.savedBps}
              showVerifiedProofSubtitle={display.showVerifiedProofSubtitle}
              hasLive5TxProof={hasLive5TxProof}
              forceUltraShield={forceUltraShield}
              theme={display.theme}
              interceptPct={display.interceptPct}
              jitterLabel={display.jitterLabel}
            />
            <p
              className={`mt-1 font-data text-[9px] uppercase tracking-[0.14em] ${display.theme.accentText} opacity-80`}
              data-testid="live-l2-telemetry-badge"
            >
              [ LIVE L2 TELEMETRY MODEL ]
            </p>
            <SlippageDualProgressBar
              notional={notional}
              baselineLossBps={display.baselineLossBps}
              savedBps={display.savedBps}
              baselineLossUsd={display.baselineLossUsd}
              savedUsd={display.savedUsdAmount}
              forceUltraShield={forceUltraShield}
              baselineAlarmFlash={baselineAlarmFlash}
            />
            <div
              className="mt-2 w-full min-w-0 rounded border border-zinc-800/80 bg-zinc-950/50 px-2 py-2"
              data-testid="live-telemetry-sandbox"
            >
              <p className="mb-1.5 font-data text-[9px] uppercase tracking-[0.14em] text-zinc-500">
                [ Live Telemetry Sandbox ]
              </p>
              <div className="flex flex-wrap items-start gap-2">
                <ChaosRpcDelayInjector
                  chaosTripped={chaosSoilTripped}
                  onChaosTrip={onChaosRpcDelay}
                  onChaosReset={onChaosReset}
                />
                <MevAttackInjector
                  disabled={mevAttackDisabled}
                  mevAttackActive={mevAttackPhase != null && mevAttackPhase !== "idle"}
                  protocolVersion={protocolVersion}
                  onInjectMev={onInjectMev}
                />
              </div>
            </div>
          </div>
        </div>
        <NotionalTierToggleGroup
          notional={notional}
          protocolVersion={protocolVersion}
          onNotionalChange={setNotional}
        />
        {showProofsButton ? (
          <button
            type="button"
            data-testid="open-5tx-tca-modal"
            onClick={() => setModalOpen(true)}
            className="mt-2 self-start rounded border border-sky-500/40 bg-sky-950/30 px-2 py-1 font-data text-[10px] font-semibold text-sky-200 hover:bg-sky-900/40"
          >
            [ 🛡️ View 5-TX Live Proofs ]
          </button>
        ) : null}
      </section>
      {showProofsButton ? (
        <VerifiedTxTcaModal
          isOpen={modalOpen}
          locale="en"
          onClose={() => setModalOpen(false)}
        />
      ) : null}
    </>
  );
}

/** @deprecated Use SlippageSavingsCard */
export const SlippageSavedCard = SlippageSavingsCard;
export type SlippageSavedCardProps = SlippageSavingsCardProps;

export default SlippageSavingsCard;
