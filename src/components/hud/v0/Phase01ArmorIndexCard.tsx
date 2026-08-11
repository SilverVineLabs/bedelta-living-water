import { Shield } from "lucide-react";
import type { ReactNode } from "react";
import { Phase01ArmorTelemetryPanels } from "./Phase01ArmorTelemetryPanels";
import type { FullGrantAuditVenueView } from "./grant-audit-view-types";

export interface Phase01ArmorIndexCardProps {
  view: FullGrantAuditVenueView;
  inspectorGuideOpen?: boolean;
}

export function Phase01ArmorIndexCard({
  view,
  inspectorGuideOpen = false,
}: Phase01ArmorIndexCardProps): ReactNode {
  return (
    <div
      className="relative overflow-hidden rounded-lg border border-[#2d42fc]/45 bg-[#0a1020]/80 p-2.5 shadow-[0_0_28px_-10px_rgba(45,66,252,0.7)]"
      data-testid="grant-audit-phase01-armor-index-card"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(45,66,252,0.16),transparent_65%)]"
      />
      <div className="relative flex flex-col gap-2">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="inline-flex items-center gap-2">
            <Shield className="size-4 text-[#2d42fc]" aria-hidden="true" />
            <span
              className="font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-[#2d42fc]"
              data-testid="grant-audit-armor-index-title"
            >
              GMX Citadel Armor Index
            </span>
          </div>
          <span
            className="inline-flex w-fit items-center rounded border border-[#2d42fc]/40 bg-[#2d42fc]/10 px-2.5 py-1 font-mono text-[10px] font-medium tracking-wide text-[#2d42fc]"
            data-testid="grant-audit-armor-index-badge"
          >
            [ 🛡️ OPTIMAL INSTITUTIONAL GRADE ]
          </span>
        </div>

        <div className="flex items-baseline justify-center gap-1 leading-none" data-testid="grant-audit-armor-index-score">
          <span className="font-mono text-4xl font-bold tracking-tight text-[#2d42fc]">98</span>
          <span className="font-mono text-lg font-semibold text-[#2d42fc]/75">/100</span>
        </div>

        <Phase01ArmorTelemetryPanels view={view} inspectorGuideOpen={inspectorGuideOpen} />
      </div>
    </div>
  );
}
