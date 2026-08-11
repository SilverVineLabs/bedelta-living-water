/** Header status pill — GMX v2 Arbitrum Citadel primary badge. */
import { useState, type ReactNode } from "react";
import {
  GMX_BADGE_ACTIVE_CLASS,
  GMX_BADGE_DEGRADED_CLASS,
  GMX_CITADEL_HEADER_BADGE_LABEL,
} from "./gmx-citadel-theme";
import { GmxCitadelHeaderPopover } from "./GmxCitadelHeaderPopover";
import type { HlProtocolIndicator } from "./hl-protocol-radar";
import { countActiveAdapters } from "./hl-protocol-header-pill-lib";

const GMX_BADGE_CLASS = [
  GMX_BADGE_ACTIVE_CLASS,
  "px-3 py-1 rounded flex items-center gap-1.5 cursor-pointer",
].join(" ");

export function formatGmxCitadelBadgeLabel(
  _indicators: readonly HlProtocolIndicator[],
): string {
  return GMX_CITADEL_HEADER_BADGE_LABEL;
}

export interface HlProtocolHeaderPillProps {
  indicators: readonly HlProtocolIndicator[];
  l2AdapterMode?: "standby" | "active" | "degraded";
}

export function HlProtocolHeaderPill({
  indicators,
  l2AdapterMode = "active",
}: HlProtocolHeaderPillProps): ReactNode {
  const [open, setOpen] = useState(false);
  const total = indicators.length;
  const active = countActiveAdapters(indicators);
  const allActive = active === total;
  const badgeLabel = formatGmxCitadelBadgeLabel(indicators);
  const badgeClass = allActive ? GMX_BADGE_CLASS : GMX_BADGE_DEGRADED_CLASS;

  return (
    <div
      className="relative"
      onBlur={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        type="button"
        className={badgeClass}
        data-testid="hl-status-pill"
        data-l2-adapter-mode={l2AdapterMode}
        data-hl-active-count={active}
        data-hl-total-count={total}
        aria-expanded={open}
        aria-label="GMX v2 Arbitrum Citadel gateway status"
        title="GMX v2 DataStore primary · Hyperliquid Session Key hedge secondary"
      >
        <span className="whitespace-nowrap">{badgeLabel}</span>
      </button>
      {open ? <GmxCitadelHeaderPopover l2AdapterMode={l2AdapterMode} /> : null}
    </div>
  );
}
