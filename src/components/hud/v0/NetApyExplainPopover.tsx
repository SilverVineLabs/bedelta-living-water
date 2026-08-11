import { useState, type ReactNode } from "react";
import { MetricProvenanceBadge } from "./MetricProvenanceBadge";

import {
  RETAIL_VAULT_GMX_SWAP_FEES_APY_PCT,
  RETAIL_VAULT_HL_FUNDING_APR_PCT,
  RETAIL_VAULT_SLIPPAGE_GUARD_APY_PCT,
} from "../../../services/retail-vault-yield-telemetry";

export interface NetApyExplainPopoverProps {
  netApyPct: number;
}

export function NetApyExplainPopover({ netApyPct }: NetApyExplainPopoverProps): ReactNode {
  const [open, setOpen] = useState(false);
  const formula = `Observed 30d Window: GMX Swap Fees (${RETAIL_VAULT_GMX_SWAP_FEES_APY_PCT.toFixed(2)}%) + HL Funding (${RETAIL_VAULT_HL_FUNDING_APR_PCT.toFixed(2)}%) - Slippage Guard (${RETAIL_VAULT_SLIPPAGE_GUARD_APY_PCT.toFixed(2)}%) = ${netApyPct.toFixed(2)}% Estimated Dynamic Yield`;

  return (
    <div className="group/apy-info relative">
      <button
        type="button"
        aria-expanded={open}
        aria-describedby="net-apy-explain-tooltip"
        data-testid="grant-audit-net-apy-explain-badge"
        onClick={() => setOpen((value) => !value)}
        className="inline-flex rounded border border-[#2d42fc]/35 bg-[#2d42fc]/10 px-2 py-0.5 font-mono text-[9px] font-medium text-[#2d42fc] transition-shadow hover:shadow-[0_0_12px_rgba(45,66,252,0.35)]"
      >
        [ ℹ️ Estimated Dynamic Yield ]
      </button>
      <div
        id="net-apy-explain-tooltip"
        role="tooltip"
        data-testid="grant-audit-net-apy-explain-popover"
        className={[
          "absolute left-0 top-full z-[9999] mt-2 w-80 rounded border border-[#2d42fc]/45 bg-[#101626] p-3 shadow-[0_0_24px_rgba(45,66,252,0.35)]",
          open ? "block" : "pointer-events-none hidden group-hover/apy-info:block",
        ].join(" ")}
      >
        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-[9px] uppercase tracking-wide text-zinc-400">Estimated Dynamic Yield</span>
            <MetricProvenanceBadge mode="ESTIMATED_PROJECTION" />
          </div>
          <p className="font-mono text-[10px] leading-relaxed text-zinc-300">{formula}</p>
        </div>
      </div>
    </div>
  );
}
