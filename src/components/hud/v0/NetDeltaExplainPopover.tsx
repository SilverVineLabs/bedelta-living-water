import { useState, type ReactNode } from "react";

const NET_DELTA_EXPLAIN_COPY = [
  "Delta measures price exposure. SliverVine splits deposits 50% GMX GM Pool (Long) and 50% Hyperliquid Perp (Short).",
  "Dual-venue hedging targets a Target Delta Band (Δ ≈ 0.00); residual basis risk remains under Residual Basis Risk Guard Active monitoring.",
] as const;

export function NetDeltaExplainPopover(): ReactNode {
  const [open, setOpen] = useState(false);

  return (
    <div className="group/delta-info relative">
      <button
        type="button"
        aria-expanded={open}
        aria-describedby="net-delta-explain-tooltip"
        data-testid="grant-audit-net-delta-explain-badge"
        onClick={() => setOpen((value) => !value)}
        className="inline-flex rounded border border-[#2d42fc]/35 bg-[#2d42fc]/10 px-2 py-0.5 font-mono text-[9px] font-medium text-[#2d42fc] transition-shadow hover:shadow-[0_0_12px_rgba(45,66,252,0.35)]"
      >
        [ ℹ️ Target Delta Band (Δ ≈ 0.00) ]
      </button>
      <div
        id="net-delta-explain-tooltip"
        role="tooltip"
        data-testid="grant-audit-net-delta-explain-popover"
        className={[
          "absolute left-0 top-full z-[9999] mt-2 w-72 rounded border border-[#2d42fc]/45 bg-[#101626] p-3 shadow-[0_0_24px_rgba(45,66,252,0.35)]",
          open ? "block" : "pointer-events-none hidden group-hover/delta-info:block",
        ].join(" ")}
      >
        <div className="space-y-2">
          {NET_DELTA_EXPLAIN_COPY.map((paragraph) => (
            <p key={paragraph} className="font-mono text-[10px] leading-relaxed text-zinc-300">
              {paragraph}
            </p>
          ))}
        </div>
      </div>
    </div>
  );
}
