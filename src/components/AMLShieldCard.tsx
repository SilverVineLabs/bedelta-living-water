/** BeDeltaLivingWater — Unidirectional AML Safety Shield card. */
import { useState, type ReactNode } from "react";
import { exportDailyRobinhoodComplianceReport } from "../sdk";
import {
  BRIDGE_TIMEOUT_FAIL_CLOSED,
  type ComplianceTripAlert,
} from "./compliance-trip-alerts";
import {
  GMX_ACCENT_TEXT_CLASS,
  GMX_CITADEL_PANEL_CLASS,
  GMX_MUTED_TEXT_CLASS,
  GMX_OFFWHITE_TEXT_CLASS,
} from "./hud/gmx-citadel-theme";

export interface AMLShieldFlowLabels {
  allowedDirection: string;
  blockedDirection: string;
}

export interface AMLShieldCardProps {
  className?: string;
  cardTitle?: string;
  flow?: AMLShieldFlowLabels;
  auditButtonLabel?: string;
  isExporting?: boolean;
  exportDisabled?: boolean;
  /** Reactive bridge / AML fail-closed banners (e.g. BRIDGE_TIMEOUT_FAIL_CLOSED). */
  complianceAlerts?: readonly ComplianceTripAlert[];
  onExportAudit?: () => void;
}

const DEFAULT_FLOW: AMLShieldFlowLabels = {
  allowedDirection:
    "Robinhood Chain (46630) =======( ALLOWED ESCORT )=======> Arbitrum One",
  blockedDirection:
    "Public Mempool / Inbound -------( 🔒 AML BLOCKED )--------> BDLW Vault",
};

function FlowLane({
  text,
  tone,
}: {
  text: string;
  tone: "allowed" | "blocked";
}): ReactNode {
  const toneClass =
    tone === "allowed"
      ? "border-emerald-500/35 bg-emerald-950/20 text-emerald-200"
      : "border-red-500/40 bg-red-950/25 text-red-200";
  return (
    <p
      className={`rounded border px-3 py-2.5 font-mono text-[10px] leading-relaxed whitespace-pre-wrap break-all sm:text-[11px] ${toneClass}`}
      data-testid={tone === "allowed" ? "aml-flow-allowed" : "aml-flow-blocked"}
    >
      {text}
    </p>
  );
}

export function AMLShieldCard({
  className = "",
  cardTitle = "Card 3: Unidirectional AML Safety Shield",
  flow = DEFAULT_FLOW,
  auditButtonLabel = "📄 Download Daily Compliance Audit Snapshot (SHA-256)",
  isExporting = false,
  exportDisabled = false,
  complianceAlerts = [],
  onExportAudit,
}: AMLShieldCardProps): ReactNode {
  const [localExporting, setLocalExporting] = useState(false);
  const exporting = isExporting || localExporting;
  const bridgeTimeout = complianceAlerts.some((a) => a.code === BRIDGE_TIMEOUT_FAIL_CLOSED);
  const blocked = exportDisabled || exporting || bridgeTimeout;

  const onDownload = async (): Promise<void> => {
    if (blocked) return;
    setLocalExporting(true);
    try {
      await exportDailyRobinhoodComplianceReport();
      onExportAudit?.();
    } finally {
      setLocalExporting(false);
    }
  };

  return (
    <section
      className={`${GMX_CITADEL_PANEL_CLASS} flex flex-col gap-4 ${className}`}
      data-testid="aml-shield-card"
    >
      <header className="border-b border-[#1d2842] pb-3">
        <h2 className={`font-mono text-sm font-semibold ${GMX_ACCENT_TEXT_CLASS}`}>{cardTitle}</h2>
        <p className={`mt-1 font-mono text-[10px] ${GMX_MUTED_TEXT_CLASS}`}>
          Unidirectional escort · inbound mempool fail-closed
        </p>
      </header>

      {complianceAlerts.length > 0 ? (
        <div className="space-y-2" data-testid="aml-compliance-alerts">
          {complianceAlerts.map((alert) => (
            <div
              key={alert.code}
              className="rounded border border-red-500/55 bg-red-950/35 px-3 py-2 animate-pulse"
              data-testid={`compliance-alert-${alert.code}`}
              role="alert"
              aria-live="assertive"
            >
              <p className="font-mono text-[10px] font-bold uppercase tracking-widest text-red-200">
                🔒 {alert.code}
              </p>
              <p className="mt-1 font-mono text-[11px] font-semibold text-red-100">{alert.title}</p>
              <p className="mt-0.5 font-mono text-[10px] leading-relaxed text-red-200/90">
                {alert.message}
              </p>
            </div>
          ))}
        </div>
      ) : null}

      <div className="space-y-2" data-testid="aml-flow-map">
        <span className={`font-mono text-[10px] uppercase tracking-widest ${GMX_MUTED_TEXT_CLASS}`}>
          Visual Flow Map
        </span>
        <FlowLane text={flow.allowedDirection} tone="allowed" />
        <FlowLane text={flow.blockedDirection} tone="blocked" />
      </div>

      <p className={`font-mono text-[10px] leading-relaxed ${GMX_OFFWHITE_TEXT_CLASS}`}>
        AML policy enforces one-way capital escort from Robinhood Chain to Arbitrum; reverse
        ingress paths terminate at vault perimeter with SHA-256 anchored daily snapshots.
      </p>

      <button
        type="button"
        disabled={blocked}
        onClick={() => void onDownload()}
        className={[
          "w-full rounded border border-amber-500/45 bg-amber-950/25 px-3 py-2.5 font-mono text-[11px] font-semibold text-amber-100",
          "hover:bg-amber-950/40",
          blocked ? "cursor-not-allowed opacity-50" : "",
          exporting ? "cursor-wait animate-pulse" : "",
        ].join(" ")}
        data-testid="aml-audit-export-button"
        aria-busy={exporting}
      >
        {exporting ? "Generating Snapshot…" : auditButtonLabel}
      </button>
    </section>
  );
}

export default AMLShieldCard;
