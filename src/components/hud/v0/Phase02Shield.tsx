import { useCallback, useState, type ReactNode } from "react";
import { setCitadelChaosMode, useCitadelChaosStore } from "../citadel-chaos-store";
import { SlippageSavingsCard } from "../Section1/SlippageSavingsCard";
import {
  MEV_ATTACK_BASELINE_BPS,
  type MevAttackPhase,
  type SoilResistanceLogEntry,
} from "../Section1/section1-hud-types";
import { CitadelChaosCircuitBanner } from "./CitadelChaosCircuitBanner";
import type { FullGrantAuditVenueView } from "./grant-audit-view-types";

export interface Phase02ShieldProps {
  view: FullGrantAuditVenueView;
}

export function Phase02Shield({ view }: Phase02ShieldProps): ReactNode {
  const chaosMode = useCitadelChaosStore();
  const [mevPhase, setMevPhase] = useState<MevAttackPhase>("idle");
  const [baselineAlarmFlash, setBaselineAlarmFlash] = useState(false);
  const [chaosSoilTripped, setChaosSoilTripped] = useState(false);
  const badges = [view.oiImbalanceBadge, view.priceImpactBadge, view.l1CalldataBadge, view.oracleLagBadge];

  const onInjectMev = useCallback(() => {
    if (mevPhase !== "idle") {
      setMevPhase("idle");
      setBaselineAlarmFlash(false);
      return;
    }
    setMevPhase("alarm");
    setBaselineAlarmFlash(true);
    window.setTimeout(() => setBaselineAlarmFlash(false), 1_500);
  }, [mevPhase]);

  const onChaosRpcDelay = useCallback(
    (_payload: { soilLog: SoilResistanceLogEntry; terminalLine: string }) => {
      setChaosSoilTripped(true);
    },
    [],
  );

  const onChaosReset = useCallback(() => {
    setChaosSoilTripped(false);
    setMevPhase("idle");
    setBaselineAlarmFlash(false);
    setCitadelChaosMode(null);
  }, []);

  return (
    <section
      className="grant-audit-v0-glow-card grant-audit-v0-shield-card flex h-full flex-col gap-5 rounded-lg border border-primary/50 bg-card p-5"
      data-testid="grant-audit-phase-02-shield"
    >
      <div className="flex items-center gap-3">
        <span className="grant-audit-v0-glow-badge rounded border border-primary/40 bg-primary/10 px-2 py-1 font-mono text-[10px] font-semibold tracking-widest text-primary">
          PHASE 02
        </span>
        <h2 className="text-pretty font-mono text-sm font-semibold uppercase tracking-wide text-foreground">
          GMX v2 Price Impact &amp; Slippage Shield
        </h2>
      </div>
      <CitadelChaosCircuitBanner mode={chaosMode} />
      <SlippageSavingsCard
        protocolVersion="v0.8"
        liveProofSavedUsd={view.slippageSavedUsd}
        hasLive5TxProof
        mevAttackPhase={mevPhase}
        mevAttackToxicityBps={view.mevAttackToxicityBps}
        baselineLossBpsOverride={mevPhase === "alarm" ? MEV_ATTACK_BASELINE_BPS : undefined}
        baselineAlarmFlash={baselineAlarmFlash}
        onInjectMev={onInjectMev}
        chaosSoilTripped={chaosSoilTripped}
        onChaosRpcDelay={onChaosRpcDelay}
        onChaosReset={onChaosReset}
      />
      <div className="flex flex-wrap gap-2">
        <span
          className="grant-audit-v0-glow-badge rounded border border-primary/40 bg-primary/10 px-2 py-1 font-mono text-[10px] font-medium tracking-wide text-primary"
          data-testid="grant-audit-price-impact-rebate-badge"
        >
          GMX PRICE IMPACT REBATE: +{(view.rebateBps / 100).toFixed(2)}% Saved
        </span>
        <span className="grant-audit-v0-glow-badge rounded border border-primary/40 bg-primary/10 px-2 py-1 font-mono text-[10px] font-medium tracking-wide text-primary">
          REBATE OPTIMIZER: ACTIVE
        </span>
      </div>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {badges.map((badge) => (
          <div
            key={badge}
            className="grant-audit-v0-glow-card flex items-center gap-2 rounded-md border border-border bg-background px-3 py-2"
          >
            <span
              className="size-1.5 rounded-full bg-primary shadow-[0_0_8px_2px_rgba(45,66,252,0.45)]"
              aria-hidden="true"
            />
            <span className="font-mono text-[10px] leading-tight tracking-tight text-foreground">{badge}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
