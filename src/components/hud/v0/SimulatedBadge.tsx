import type { ReactNode } from "react";

export interface SimulatedBadgeProps {
  label?: string;
}

export function SimulatedBadge({ label = "SIMULATED PROJECTION" }: SimulatedBadgeProps): ReactNode {
  return (
    <span
      data-testid="grant-audit-simulated-badge"
      className="inline-flex rounded border border-amber-400/35 bg-amber-950/25 px-1.5 py-0.5 font-mono text-[9px] font-medium uppercase tracking-wide text-amber-300/90"
    >
      {label}
    </span>
  );
}
