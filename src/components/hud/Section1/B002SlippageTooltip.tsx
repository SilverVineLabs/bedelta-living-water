import { useState, type ReactNode } from "react";
import {
  GMX_DATASTORE_DEPTH_PROBE_COPY,
  SECTION1_TOOLTIP_BODY_CLASS,
  SECTION1_TOOLTIP_MUTED_CLASS,
  SECTION1_TOOLTIP_PANEL_CLASS,
  SECTION1_TOOLTIP_TITLE_CLASS,
} from "./section1-tooltip-styles";

const SLIPPAGE_SAVINGS_TOOLTIP_COPY = `Bleed-Bounded Model: Execution drag is bounded by Dynamic Max SL ($200 Cap). Orders are gated by checkSoilResistance() ${GMX_DATASTORE_DEPTH_PROBE_COPY} and 500ms Fail-Closed latency limits.`;

export function B002SlippageTooltip(): ReactNode {
  const [open, setOpen] = useState(false);

  return (
    <span className="group relative inline-flex align-middle">
      <button
        type="button"
        aria-label="Est. slippage savings methodology"
        aria-expanded={open}
        data-testid="b002-slippage-tooltip-trigger"
        onClick={() => setOpen((prev) => !prev)}
        className="ml-1 cursor-help rounded px-0.5 text-[11px] text-[#94a3b8] transition-colors hover:text-[#e2e8f0]"
      >
        ℹ️
      </button>
      <span
        role="tooltip"
        data-testid="b002-slippage-tooltip-card"
        className={[
          SECTION1_TOOLTIP_PANEL_CLASS,
          open ? "block" : "hidden group-hover:block group-focus-within:block",
        ].join(" ")}
      >
        <p className={SECTION1_TOOLTIP_TITLE_CLASS}>Est. Slippage Savings</p>
        <p className={`mt-2 ${SECTION1_TOOLTIP_BODY_CLASS}`}>{SLIPPAGE_SAVINGS_TOOLTIP_COPY}</p>
        <p className="mt-2 font-mono text-xs leading-relaxed text-[#e2e8f0]/90">
          S<sub>saved</sub> = ∫<sub>0</sub>
          <sup>N</sup> (D<sub>baseline</sub>(p) − D<sub>santenmoku</sub>(p)) dp
        </p>
        <p className={`mt-2 ${SECTION1_TOOLTIP_MUTED_CLASS}`}>{SLIPPAGE_SAVINGS_TOOLTIP_COPY}</p>
      </span>
    </span>
  );
}
