import type { ReactNode } from "react";
import { useCitadelChaosStore } from "../citadel-chaos-store";
import {
  PHASE01_INSPECTOR_GUIDE_COPY,
  Phase01InspectorGuideOverlay,
} from "./Phase01InspectorGuideOverlay";
import { resolveChainlinkOracleStatus } from "./phase01-chainlink-oracle-status";
import { TelemetryIndexValue } from "./TelemetryIndexValue";
import type { FullGrantAuditVenueView } from "./grant-audit-view-types";

export interface Phase01ArmorTelemetryPanelsProps {
  view: FullGrantAuditVenueView;
  inspectorGuideOpen?: boolean;
}

export function Phase01ArmorTelemetryPanels({
  view,
  inspectorGuideOpen = false,
}: Phase01ArmorTelemetryPanelsProps): ReactNode {
  const chaosLag = useCitadelChaosStore() === "oracle_lag_deadlock";
  const oracleStatus = resolveChainlinkOracleStatus(view.oracleLagMs, chaosLag);

  return (
    <div
      className="grid grid-cols-1 gap-2 md:grid-cols-3"
      data-testid="grant-audit-phase01-citadel-telemetry"
    >
      <Phase01InspectorGuideOverlay
        active={inspectorGuideOpen}
        testId="grant-audit-inspector-guide-sequencer"
        copy={PHASE01_INSPECTOR_GUIDE_COPY.sequencer}
      >
        <div
          className="flex flex-col gap-1 rounded border border-[#2d42fc]/25 bg-[#2d42fc]/5 px-2 py-2"
          data-testid="grant-audit-sequencer-card"
        >
          <span className="font-mono text-[9px] uppercase tracking-widest text-[#2d42fc]/70">Sequencer</span>
          <span className="font-mono text-lg font-semibold text-foreground">{view.sequencerStatus}</span>
          <span className="font-mono text-[10px] text-[#2d42fc]" data-testid="grant-audit-sequencer-guard-badge">
            [ Sequencer Guard: ACTIVE ]
          </span>
        </div>
      </Phase01InspectorGuideOverlay>

      <Phase01InspectorGuideOverlay
        active={inspectorGuideOpen}
        testId="grant-audit-inspector-guide-oracle"
        copy={PHASE01_INSPECTOR_GUIDE_COPY.oracle}
      >
        <div
          className="group/oracle relative flex flex-col gap-1 rounded border border-[#2d42fc]/25 bg-[#2d42fc]/5 px-2 py-2"
          data-testid="grant-audit-oracle-lag-card"
        >
          <div className="flex items-center justify-between gap-1">
            <span className="font-mono text-[9px] uppercase tracking-widest text-[#2d42fc]/70">
              Chainlink Oracle Feed
            </span>
            <span className={`font-mono text-[9px] ${view.oracleLagHot || chaosLag ? "text-red-400" : "text-muted-foreground"}`}>
              <TelemetryIndexValue value={view.oracleLagMs} format={(v) => `${Math.round(v)}ms`} />
            </span>
          </div>
          <span className={oracleStatus.className} data-testid={oracleStatus.testId}>
            {oracleStatus.label}
          </span>
          {oracleStatus.tooltip ? (
            <div
              role="tooltip"
              data-testid="grant-audit-oracle-heartbeat-tooltip"
              className="pointer-events-none absolute bottom-full left-1/2 z-[9999] mb-2 hidden w-64 -translate-x-1/2 rounded border border-green-500/30 bg-zinc-950/98 p-2 group-hover/oracle:block"
            >
              <p className="font-mono text-[9px] leading-relaxed text-green-200/90">{oracleStatus.tooltip}</p>
            </div>
          ) : null}
        </div>
      </Phase01InspectorGuideOverlay>

      <Phase01InspectorGuideOverlay
        active={inspectorGuideOpen}
        testId="grant-audit-inspector-guide-l1-gas"
        copy={PHASE01_INSPECTOR_GUIDE_COPY.l1Gas}
      >
        <div
          className="flex flex-col gap-1 rounded border border-[#2d42fc]/25 bg-[#2d42fc]/5 px-2 py-2"
          data-testid="grant-audit-l1-gas-card"
        >
          <span className="font-mono text-[9px] uppercase tracking-widest text-[#2d42fc]/70">L1 Gas vs Yield</span>
          <span className={`font-mono text-[10px] ${view.l1GasBlocked ? "text-red-400" : "text-foreground"}`}>
            {view.l1GasYieldPct != null ? (
              <>
                <TelemetryIndexValue value={view.l1GasYieldPct} format={(v) => `${v.toFixed(1)}%`} /> /{" "}
                <TelemetryIndexValue value={view.l1GasYieldCapPct} format={(v) => `${v.toFixed(1)}%`} />
              </>
            ) : (
              "—"
            )}
          </span>
          <span className="font-mono text-[10px] text-[#2d42fc]" data-testid="grant-audit-l1-gas-protection-badge">
            [ Gas Protection: 0.2% Net Loss Guard ]
          </span>
        </div>
      </Phase01InspectorGuideOverlay>
    </div>
  );
}
