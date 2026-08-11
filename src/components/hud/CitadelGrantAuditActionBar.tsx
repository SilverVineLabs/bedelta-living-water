/** Grant Audit Action Bar — GMX theme export + curl verify + payload copy. */
import { useCallback, useState, type ReactNode } from "react";
import type { ArbitrumCitadelRiskMetrics } from "../../routes/grant-audit-lib/grant-audit-citadel-metrics";
import type { HlTelemetryMetrics } from "../../routes/grant-audit-lib/grant-audit.types";
import { exportGmxGrantAuditCertificate } from "./gmx-grant-audit-certificate";
import { copyGrantAuditPayload } from "./grant-audit-payload-copy";
import type { GrantAuditClientPayload } from "./grant-audit-fetch";
import { GrantAuditCopyToast } from "./GrantAuditCopyToast";

const GMX_BTN =
  "rounded border border-[#1d2842] bg-[#101626] px-3 py-2 font-mono text-[10px] font-semibold text-[#e2e8f0] transition-colors hover:border-[#2d42fc]/45 hover:bg-[#2d42fc]/10";

export interface CitadelGrantAuditActionBarProps {
  curl: string;
  metrics?: ArbitrumCitadelRiskMetrics | null;
  hlTelemetry?: HlTelemetryMetrics | null;
  auditPayload?: GrantAuditClientPayload | null;
}

export function CitadelGrantAuditActionBar({
  curl,
  metrics,
  hlTelemetry,
  auditPayload,
}: CitadelGrantAuditActionBarProps): ReactNode {
  const [toastVisible, setToastVisible] = useState(false);

  const onCopyPayload = useCallback(async () => {
    const ok = await copyGrantAuditPayload(auditPayload);
    if (!ok) return;
    setToastVisible(true);
    window.setTimeout(() => setToastVisible(false), 2_200);
  }, [auditPayload]);

  return (
    <div className="mt-4 space-y-2" data-testid="citadel-grant-audit-action-bar">
      <GrantAuditCopyToast visible={toastVisible} />
      <button
        type="button"
        className={`${GMX_BTN} w-full text-left`}
        data-testid="citadel-copy-audit-payload"
        onClick={() => void onCopyPayload()}
      >
        [ 📋 Copy Live Audit Payload JSON ]
      </button>
      <button
        type="button"
        className={`${GMX_BTN} w-full text-left`}
        data-testid="citadel-export-gmx-certificate"
        onClick={() => exportGmxGrantAuditCertificate(metrics, hlTelemetry)}
      >
        [ 📄 Export GMX v2 Audit Certificate (.json) ]
      </button>
      <button
        type="button"
        className={`${GMX_BTN} w-full text-left`}
        data-testid="citadel-curl-verify"
        onClick={() => void navigator.clipboard?.writeText(curl)}
      >
        Copy curl verify ↗
        <span className="mt-1 block truncate font-mono text-[10px] text-white/70">{curl}</span>
      </button>
    </div>
  );
}

export default CitadelGrantAuditActionBar;
