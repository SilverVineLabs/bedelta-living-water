/** Shield fail-closed trip badge + status rows. */
import type { ReactNode } from "react";
import type { ComplianceTripAlert } from "../compliance-trip-alerts";
import { GMX_MUTED_TEXT_CLASS, GMX_OFFWHITE_TEXT_CLASS } from "../hud/gmx-citadel-theme";

export function ShieldTripBadge({ alert }: { alert: ComplianceTripAlert }): ReactNode {
  return (
    <div className="rounded border border-red-500/55 bg-red-950/35 px-3 py-2 animate-pulse" data-testid={`compliance-alert-${alert.code}`} role="alert" aria-live="assertive">
      <p className="font-mono text-[10px] font-bold uppercase tracking-widest text-red-200">🔴 {alert.code}</p>
      <p className="mt-1 font-mono text-[11px] font-semibold text-red-100">{alert.title}</p>
      <p className="mt-0.5 font-mono text-[10px] leading-relaxed text-red-200/90">{alert.message}</p>
    </div>
  );
}

export function ShieldStatusRow({ label, value }: { label: string; value: string }): ReactNode {
  return (
    <div className="flex flex-col gap-0.5 sm:flex-row sm:items-baseline sm:gap-2">
      <span className={`shrink-0 font-mono text-[10px] uppercase tracking-widest ${GMX_MUTED_TEXT_CLASS}`}>{label}</span>
      <span className={`font-mono text-[11px] font-semibold ${GMX_OFFWHITE_TEXT_CLASS}`}>{value}</span>
    </div>
  );
}
