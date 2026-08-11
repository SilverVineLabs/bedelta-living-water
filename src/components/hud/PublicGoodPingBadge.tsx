import { useState, type ReactNode } from "react";
import {
  SECTION1_TOOLTIP_BODY_CLASS,
  SECTION1_TOOLTIP_PANEL_CLASS,
  SECTION1_TOOLTIP_TITLE_CLASS,
} from "./Section1/section1-tooltip-styles";
import { PING_TOOLTIP_COPY } from "./public-good-telemetry-copy";

export interface PublicGoodPingBadgeProps {
  pingMs: number;
  probeLive: boolean;
  failClosedActive: boolean;
  isGate: boolean;
}

export function PublicGoodPingBadge({
  pingMs,
  probeLive,
  failClosedActive,
  isGate,
}: PublicGoodPingBadgeProps): ReactNode {
  const [pingTooltipOpen, setPingTooltipOpen] = useState(false);

  const pingTone = failClosedActive
    ? "border-red-500/50 bg-red-950/40 text-red-200"
    : probeLive
      ? "border-emerald-500/40 bg-emerald-950/30 text-emerald-200"
      : "border-amber-500/40 bg-amber-950/30 text-amber-200";

  const pingDot = failClosedActive ? "🔴" : probeLive ? "🟢" : "🟡";

  return (
    <span
      className={[
        "inline-flex shrink-0 items-center overflow-visible whitespace-nowrap rounded border px-2 py-1.5 font-data font-semibold tabular-nums leading-relaxed",
        isGate ? "text-xs" : "text-[10px]",
        pingTone,
      ].join(" ")}
      data-testid="latency-pulse-indicator"
      aria-live="polite"
    >
      [ <span className="inline-block animate-pulse" aria-hidden="true">{pingDot}</span> Ping: {pingMs}ms (Citadel Edge) ]
      <span className="group relative inline-flex align-middle">
        <button
          type="button"
          aria-label="Ping latency probe details"
          aria-expanded={pingTooltipOpen}
          data-testid="ping-latency-tooltip-trigger"
          onClick={() => setPingTooltipOpen((prev) => !prev)}
          className="ml-1 cursor-help rounded px-0.5 text-[11px] text-sky-300/90 transition-colors hover:text-sky-200"
        >
          ℹ️
        </button>
        <span
          role="tooltip"
          data-testid="ping-latency-tooltip"
          className={[
            SECTION1_TOOLTIP_PANEL_CLASS,
            pingTooltipOpen
              ? "block"
              : "hidden group-hover:block group-focus-within:block",
          ].join(" ")}
        >
          <p className={SECTION1_TOOLTIP_TITLE_CLASS}>Citadel Edge Latency Probe</p>
          <p className={`mt-2 ${SECTION1_TOOLTIP_BODY_CLASS}`}>{PING_TOOLTIP_COPY}</p>
        </span>
      </span>
    </span>
  );
}
