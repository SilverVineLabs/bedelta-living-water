import { useState, type ReactNode } from "react";
import type { OperatorUnlockVersion } from "../../../v2/admin/operator-matrix";
import {
  GMX_DATASTORE_DEPTH_PROBE_COPY,
  SECTION1_TOOLTIP_BODY_CLASS,
  SECTION1_TOOLTIP_PANEL_CLASS,
} from "./section1-tooltip-styles";

const LIVE_TELEMETRY_TOOLTIP_COPY = `Live execution metrics from ${GMX_DATASTORE_DEPTH_PROBE_COPY} and verified 5-TX signature pipeline fills.`;
const EXTRAPOLATED_TOOLTIP_COPY = `Non-Linear Orderbook Decay Model: Derived from ${GMX_DATASTORE_DEPTH_PROBE_COPY}. Calculates actual execution drag saved for $100K/$1M rebalances vs passive market fills.`;

export interface SlippageModeTagProps {
  protocolVersion: OperatorUnlockVersion;
  hasLive5TxProof: boolean;
}

function LiveTelemetryModelTag(): ReactNode {
  const [open, setOpen] = useState(false);

  return (
    <span className="group relative inline-flex items-center gap-1">
      <span
        data-testid="slippage-mode-tag"
        className="rounded border border-[#2d42fc]/45 bg-[#101626] px-2 py-0.5 font-data text-[9px] font-semibold text-[#e2e8f0]"
      >
        [ Live Telemetry Model ]
      </span>
      <button
        type="button"
        aria-label="Live Telemetry Model methodology"
        aria-expanded={open}
        data-testid="live-telemetry-model-tooltip-trigger"
        onClick={() => setOpen((prev) => !prev)}
        className="cursor-help rounded px-0.5 text-[10px] text-[#94a3b8] transition-colors hover:text-[#e2e8f0]"
      >
        ℹ️
      </button>
      <span
        role="tooltip"
        data-testid="live-telemetry-model-tooltip"
        className={[
          SECTION1_TOOLTIP_PANEL_CLASS,
          open ? "block" : "hidden group-hover:block group-focus-within:block",
        ].join(" ")}
      >
        <p className={SECTION1_TOOLTIP_BODY_CLASS}>{LIVE_TELEMETRY_TOOLTIP_COPY}</p>
      </span>
    </span>
  );
}

function ExtrapolatedNonLinearModelTag(): ReactNode {
  const [open, setOpen] = useState(false);

  return (
    <span className="group relative inline-flex items-center gap-1">
      <span
        data-testid="slippage-mode-tag"
        className="rounded border border-[#1d2842] bg-[#101626] px-2 py-0.5 font-data text-[9px] font-semibold text-[#94a3b8]"
      >
        [ Extrapolated Non-Linear Model ]
      </span>
      <button
        type="button"
        aria-label="Extrapolated Non-Linear Model methodology"
        aria-expanded={open}
        data-testid="extrapolated-non-linear-model-tooltip-trigger"
        onClick={() => setOpen((prev) => !prev)}
        className="cursor-help rounded px-0.5 text-[10px] text-[#94a3b8] transition-colors hover:text-[#e2e8f0]"
      >
        ℹ️
      </button>
      <span
        role="tooltip"
        data-testid="extrapolated-non-linear-model-tooltip"
        className={[
          SECTION1_TOOLTIP_PANEL_CLASS,
          open ? "block" : "hidden group-hover:block group-focus-within:block",
        ].join(" ")}
      >
        <p className={SECTION1_TOOLTIP_BODY_CLASS}>{EXTRAPOLATED_TOOLTIP_COPY}</p>
      </span>
    </span>
  );
}

export function SlippageModeTag({
  protocolVersion,
}: SlippageModeTagProps): ReactNode {
  if (protocolVersion === "v0.8") {
    return <LiveTelemetryModelTag />;
  }

  if (protocolVersion === "v1.0" || protocolVersion === "v1.5") {
    return <ExtrapolatedNonLinearModelTag />;
  }

  return <ExtrapolatedNonLinearModelTag />;
}
