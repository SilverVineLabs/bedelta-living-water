/** Glowing green GMX Grant Impact Metrics badge — hover popover explain. */
import { useState, type ReactNode } from "react";
import { formatUsd } from "./grant-audit-v0-utils";

export const GMX_GRANT_IMPACT_POPOVER_COPY =
  "Long-leg liquidity is deployed as a Time-Weighted Retained GM Position in GMX v2 GM Pools, driving organic volume and fee accrual." as const;

export interface GmxGrantImpactBadgeProps {
  harvestUsd?: number;
  gmTvlUsd?: number;
}

export function buildGmxGrantImpactBadgeLabel(harvestUsd?: number, gmTvlUsd?: number): string {
  const harvest =
    harvestUsd != null && Number.isFinite(harvestUsd) ? `+${formatUsd(harvestUsd)}` : "TELEMETRY PROBE";
  const tvl = gmTvlUsd != null && Number.isFinite(gmTvlUsd) ? formatUsd(gmTvlUsd) : "GM TVL PROBE";
  return `[ 🌊 GMX ECOSYSTEM IMPACT: ${harvest} 24H HARVEST / ${tvl} GM TVL ]`;
}

export function GmxGrantImpactBadge({ harvestUsd, gmTvlUsd }: GmxGrantImpactBadgeProps): ReactNode {
  const [open, setOpen] = useState(false);
  const label = buildGmxGrantImpactBadgeLabel(harvestUsd, gmTvlUsd);

  return (
    <div className="group/gmx-impact relative">
      <button
        type="button"
        aria-expanded={open}
        aria-describedby="gmx-grant-impact-tooltip"
        data-testid="grant-audit-gmx-ecosystem-impact-badge"
        onClick={() => setOpen((value) => !value)}
        className="inline-flex animate-pulse rounded-md border border-emerald-400/55 bg-emerald-950/40 px-3 py-1.5 font-mono text-[10px] font-semibold text-emerald-300 shadow-[0_0_20px_rgba(52,211,153,0.55)] transition-shadow hover:shadow-[0_0_28px_rgba(52,211,153,0.75)]"
      >
        {label}
      </button>
      <div
        id="gmx-grant-impact-tooltip"
        role="tooltip"
        data-testid="grant-audit-gmx-ecosystem-impact-popover"
        className={[
          "absolute right-0 top-full z-[9999] mt-2 w-80 rounded border border-emerald-400/45 bg-[#0a1612] p-3 shadow-[0_0_24px_rgba(52,211,153,0.35)]",
          open ? "block" : "pointer-events-none hidden group-hover/gmx-impact:block",
        ].join(" ")}
      >
        <p className="font-mono text-[10px] leading-relaxed text-emerald-100/90">
          {GMX_GRANT_IMPACT_POPOVER_COPY}
        </p>
      </div>
    </div>
  );
}
