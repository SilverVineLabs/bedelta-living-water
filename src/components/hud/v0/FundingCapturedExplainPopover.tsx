import { useState, type ReactNode } from "react";

export function FundingCapturedExplainPopover(): ReactNode {
  const [open, setOpen] = useState(false);

  return (
    <div className="group/funding-info relative">
      <button
        type="button"
        aria-expanded={open}
        aria-describedby="funding-captured-explain-tooltip"
        data-testid="grant-audit-funding-captured-explain-badge"
        onClick={() => setOpen((value) => !value)}
        className="inline-flex rounded border border-[#2d42fc]/35 bg-[#2d42fc]/10 px-2 py-0.5 font-mono text-[9px] font-medium text-[#2d42fc] transition-shadow hover:shadow-[0_0_12px_rgba(45,66,252,0.35)]"
      >
        [ ℹ️ Funding Source ]
      </button>
      <div
        id="funding-captured-explain-tooltip"
        role="tooltip"
        data-testid="grant-audit-funding-captured-explain-popover"
        className={[
          "absolute left-0 top-full z-[9999] mt-2 w-72 rounded border border-[#2d42fc]/45 bg-[#101626] p-3 shadow-[0_0_24px_rgba(45,66,252,0.35)]",
          open ? "block" : "pointer-events-none hidden group-hover/funding-info:block",
        ].join(" ")}
      >
        <p className="font-mono text-[10px] leading-relaxed text-zinc-300">
          Real 24h short-leg funding interest harvested from Hyperliquid
        </p>
      </div>
    </div>
  );
}
