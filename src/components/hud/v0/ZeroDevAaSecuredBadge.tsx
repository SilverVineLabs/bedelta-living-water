import type { ReactNode } from "react";
import { AA_GATEWAY_DISABLED_LABEL } from "../../../adapters/arbitrum/zerodev-aa/zerodev-aa-gate";

export interface ZeroDevAaSecuredBadgeProps {
  secured?: boolean;
  label?: string;
}

export function ZeroDevAaSecuredBadge({
  secured = false,
  label = AA_GATEWAY_DISABLED_LABEL,
}: ZeroDevAaSecuredBadgeProps): ReactNode {
  const metalSecured =
    "inline-flex animate-pulse rounded-md border border-emerald-400/55 bg-gradient-to-b from-emerald-950/50 to-emerald-950/25 px-3 py-1.5 font-mono text-[10px] font-semibold tracking-wide text-emerald-300 shadow-[0_0_20px_rgba(52,211,153,0.45)] ring-1 ring-emerald-500/25";
  const metalDisabled =
    "inline-flex rounded-md border border-zinc-500/45 bg-gradient-to-b from-zinc-900/80 to-zinc-950/60 px-3 py-1.5 font-mono text-[10px] font-semibold tracking-wide text-zinc-400 shadow-[inset_0_1px_0_rgba(255,255,255,0.07)] ring-1 ring-zinc-600/30";

  return (
    <span
      data-testid="grant-audit-zerodev-aa-badge"
      className={secured ? metalSecured : metalDisabled}
    >
      {label}
    </span>
  );
}
