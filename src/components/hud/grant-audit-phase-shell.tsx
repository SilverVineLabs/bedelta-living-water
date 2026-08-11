/** Grant Audit — 3-phase layout shell (GMX Dark Citadel). */
import type { ReactNode } from "react";

export const GMX_CANONICAL_DATASTORE_SWR_BADGE =
  "[ 📡 GMX Canonical DataStore SWR: Active ]" as const;

export interface GrantAuditPhaseShellProps {
  phase: "01" | "02" | "03";
  title: string;
  children: ReactNode;
  className?: string;
}

export function GrantAuditPhaseShell({
  phase,
  title,
  children,
  className = "",
}: GrantAuditPhaseShellProps): ReactNode {
  return (
    <section
      className={[
        "space-y-4 rounded border border-[#1d2842] bg-[#090d16] p-4 sm:p-5",
        className,
      ].join(" ")}
      data-testid={`grant-audit-phase-${phase}`}
    >
      <div className="flex flex-wrap items-center gap-2 border-b border-[#1d2842] pb-3">
        <span className="rounded border border-[#2d42fc] bg-[#2d42fc]/15 px-2 py-0.5 font-mono text-[10px] font-bold tracking-wider text-[#2d42fc]">
          PHASE {phase}
        </span>
        <h2 className="font-mono text-xs font-semibold uppercase tracking-[0.14em] text-[#ffffff]">
          {title}
        </h2>
      </div>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

export function GrantAuditDatastoreSwrBadge(): ReactNode {
  return (
    <p
      className="inline-flex rounded border border-[#2d42fc]/45 bg-[#101626] px-3 py-1.5 font-mono text-[10px] font-semibold text-[#ffffff]"
      data-testid="grant-audit-datastore-swr-badge"
    >
      {GMX_CANONICAL_DATASTORE_SWR_BADGE}
    </p>
  );
}
