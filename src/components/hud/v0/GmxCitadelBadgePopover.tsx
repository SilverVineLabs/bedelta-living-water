import type { ReactNode } from "react";

const GMX_HERO_BADGE_LABEL = "[ 🛡️ 20-ROOT DEFENSE MATRIX: 6/20 ACTIVE ]" as const;

export function GmxCitadelBadgePopover(): ReactNode {
  return (
    <span
      data-testid="grant-audit-gmx-citadel-badge"
      className="inline-flex animate-pulse rounded-md border border-emerald-400/55 bg-emerald-950/35 px-3 py-1.5 font-mono text-[10px] font-semibold text-emerald-300 shadow-[0_0_20px_rgba(52,211,153,0.45)]"
    >
      {GMX_HERO_BADGE_LABEL}
    </span>
  );
}
