/** BeDeltaLivingWater — Pre-Execution Living Water Shield card (Pillar 3). */
import { useEffect, useMemo, useRef, type ReactNode } from "react";
import {
  type ComplianceTripAlert,
  hasCriticalComplianceTrip,
} from "./compliance-trip-alerts";
import {
  GMX_ACCENT_TEXT_CLASS,
  GMX_CITADEL_PANEL_CLASS,
  GMX_MUTED_TEXT_CLASS,
  GMX_OFFWHITE_TEXT_CLASS,
} from "./hud/gmx-citadel-theme";

export type LivingWaterMarketVariant = "clear" | "storm";

export interface LivingWaterShieldStatus {
  marketState: string;
  marketStateVariant: LivingWaterMarketVariant;
  edgeEngineLabel: string;
  skewPremiumLabel: string;
}

export interface LivingWaterApyRange {
  minPercent: number;
  maxPercent: number;
}

export interface LivingWaterShieldCardProps {
  className?: string;
  cardTitle?: string;
  status: LivingWaterShieldStatus;
  apyRange: LivingWaterApyRange;
  yieldSources: readonly string[];
  logLines: readonly string[];
  safetyFootnote?: string;
  joinVaultLabel?: string;
  inspectSoilLabel?: string;
  /** Reactive fail-closed trip banners (SYSTEM_FAIL_CLOSED · ORACLE_LAG_DEADLOCK). */
  complianceAlerts?: readonly ComplianceTripAlert[];
  isExecuting?: boolean;
  actionDisabled?: boolean;
  onJoinVault?: () => void;
  onInspectSoilRadar?: () => void;
}

const MARKET_VARIANT_CLASS: Record<LivingWaterMarketVariant, string> = {
  clear: "border-emerald-500/40 bg-emerald-950/25 text-emerald-200",
  storm: "border-red-500/50 bg-red-950/30 text-red-200 animate-pulse",
};

function StatusRow({ label, value }: { label: string; value: string }): ReactNode {
  return (
    <div className="flex flex-col gap-0.5 sm:flex-row sm:items-baseline sm:gap-2">
      <span className={`shrink-0 font-mono text-[10px] uppercase tracking-widest ${GMX_MUTED_TEXT_CLASS}`}>
        {label}
      </span>
      <span className={`font-mono text-[11px] font-semibold ${GMX_OFFWHITE_TEXT_CLASS}`}>{value}</span>
    </div>
  );
}

function ComplianceAlertBanner({ alert }: { alert: ComplianceTripAlert }): ReactNode {
  return (
    <div
      className="rounded border border-red-500/55 bg-red-950/35 px-3 py-2 animate-pulse"
      data-testid={`compliance-alert-${alert.code}`}
      role="alert"
      aria-live="assertive"
    >
      <p className="font-mono text-[10px] font-bold uppercase tracking-widest text-red-200">
        🔴 {alert.code}
      </p>
      <p className="mt-1 font-mono text-[11px] font-semibold text-red-100">{alert.title}</p>
      <p className="mt-0.5 font-mono text-[10px] leading-relaxed text-red-200/90">{alert.message}</p>
    </div>
  );
}

export function LivingWaterShieldCard({
  className = "",
  cardTitle = "Card 1: Pre-Execution Living Water Shield (Pillar 3)",
  status,
  apyRange,
  yieldSources,
  logLines,
  safetyFootnote = "*Yields fluctuate with market skew. Citadel 106µs Shield enforces lostUsd ≡ 0 during market storms.",
  joinVaultLabel = "🌊 Join Vault (One-Click Deposit)",
  inspectSoilLabel = "📄 Inspect Soil Radar",
  complianceAlerts = [],
  isExecuting = false,
  actionDisabled = false,
  onJoinVault,
  onInspectSoilRadar,
}: LivingWaterShieldCardProps): ReactNode {
  const logViewportRef = useRef<HTMLDivElement>(null);

  const criticalTripped = hasCriticalComplianceTrip(complianceAlerts);
  const effectiveVariant = criticalTripped ? "storm" : status.marketStateVariant;
  const marketClass = MARKET_VARIANT_CLASS[effectiveVariant];
  const actionsDisabled =
    actionDisabled || isExecuting || effectiveVariant === "storm";
  const apyLabel = `Dynamic Target Range: ${apyRange.minPercent.toFixed(1)}% ~ ${apyRange.maxPercent.toFixed(1)}% (Non-Guaranteed · Hurdle Gate +0.5%)`;

  const logLinesWithTrips = useMemo(() => {
    if (complianceAlerts.length === 0) return logLines;
    const tripLines = complianceAlerts.map(
      (a) => `[FAIL-CLOSED] ${a.code} · ${a.title}`,
    );
    return [...logLines, ...tripLines].slice(-12);
  }, [complianceAlerts, logLines]);

  useEffect(() => {
    const el = logViewportRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [logLinesWithTrips]);

  return (
    <section
      className={`${GMX_CITADEL_PANEL_CLASS} flex flex-col gap-4 ${className}`}
      data-testid="living-water-shield-card"
    >
      <header className="space-y-1 border-b border-[#1d2842] pb-3">
        <h2 className={`font-mono text-sm font-semibold leading-snug ${GMX_ACCENT_TEXT_CLASS}`}>
          {cardTitle}
        </h2>
      </header>

      {complianceAlerts.length > 0 ? (
        <div className="space-y-2" data-testid="living-water-compliance-alerts">
          {complianceAlerts.map((alert) => (
            <ComplianceAlertBanner key={alert.code} alert={alert} />
          ))}
        </div>
      ) : null}

      <div
        className="space-y-2 rounded border border-[#2d42fc]/40 bg-[#2d42fc]/10 px-3 py-2.5"
        data-testid="living-water-apy-banner"
      >
        <p className="font-mono text-xs font-bold leading-snug text-[#e2e8f0]">{apyLabel}</p>
        <ul className={`list-inside list-disc space-y-0.5 font-mono text-[10px] leading-relaxed ${GMX_MUTED_TEXT_CLASS}`}>
          {yieldSources.map((source) => (
            <li key={source}>{source}</li>
          ))}
        </ul>
        <p className={`font-mono text-[9px] italic leading-relaxed ${GMX_MUTED_TEXT_CLASS}`}>{safetyFootnote}</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-1" data-testid="living-water-shield-status">
        <div
          className={`rounded border px-3 py-2 font-mono text-[11px] font-semibold ${marketClass}`}
          data-testid="living-water-market-state"
          data-market-variant={effectiveVariant}
          role="status"
        >
          <span className={`mr-2 text-[9px] uppercase tracking-widest opacity-70`}>Market State</span>
          {criticalTripped ? "⛈ STORM (Fail-Closed — Dispatch Blocked)" : status.marketState}
        </div>
        <StatusRow label="Edge Engine" value={status.edgeEngineLabel} />
        <StatusRow label="Skew Premium" value={status.skewPremiumLabel} />
      </div>

      <div className="space-y-2" data-testid="living-water-action-area">
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <button
            type="button"
            data-testid="living-water-join-vault-button"
            disabled={actionsDisabled}
            onClick={onJoinVault}
            className={[
              "rounded border border-[#2d42fc]/55 bg-[#2d42fc]/20 px-3 py-2.5 font-mono text-[11px] font-bold text-[#e2e8f0]",
              "shadow-[0_0_16px_rgba(45,66,252,0.3)] transition-colors hover:bg-[#2d42fc]/30",
              actionsDisabled ? "cursor-not-allowed opacity-50" : "",
              isExecuting ? "cursor-wait animate-pulse" : "",
            ].join(" ")}
            aria-busy={isExecuting}
          >
            {isExecuting ? "Depositing…" : joinVaultLabel}
          </button>
          <button
            type="button"
            data-testid="living-water-inspect-soil-button"
            disabled={actionsDisabled}
            onClick={onInspectSoilRadar}
            className={[
              "rounded border border-[#1d2842] bg-[#101626] px-3 py-2.5 font-mono text-[11px] font-semibold text-[#e2e8f0]",
              "transition-colors hover:border-[#2d42fc]/45 hover:bg-[#151d30]",
              actionsDisabled ? "cursor-not-allowed opacity-50" : "",
            ].join(" ")}
          >
            {inspectSoilLabel}
          </button>
        </div>
      </div>

      <div className="space-y-1.5">
        <p className={`font-mono text-[9px] uppercase tracking-[0.2em] ${GMX_MUTED_TEXT_CLASS}`}>
          Live Shield Log
        </p>
        <div
          ref={logViewportRef}
          className="h-36 overflow-y-auto rounded border border-zinc-800 bg-black p-2.5 font-mono text-[11px] leading-relaxed text-emerald-400/90"
          data-testid="living-water-log-window"
          role="log"
          aria-live="polite"
          aria-relevant="additions"
        >
          {logLinesWithTrips.length === 0 ? (
            <p className="text-zinc-600">— awaiting edge telemetry —</p>
          ) : (
            logLinesWithTrips.map((line, index) => (
              <p key={`${index}-${line.slice(0, 24)}`} className="whitespace-pre-wrap break-all">
                {line}
              </p>
            ))
          )}
        </div>
      </div>
    </section>
  );
}

export default LivingWaterShieldCard;
