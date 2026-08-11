import { useMemo, type ReactNode } from "react";
import {
  demoHlProtocolRadar,
  resolveHlProtocolRadar,
  type HlProtocolIndicator,
  type HlProtocolIndicatorId,
  type HlProtocolRadarInput,
  type HlProtocolStatus,
} from "./hl-protocol-radar";
import { HlProtocolHeaderPill } from "./HlProtocolHeaderPill";

const STATUS_CLASS: Record<HlProtocolStatus, string> = {
  ACTIVE: "border-[#2d42fc]/40 text-white",
  COMPATIBLE: "border-[#2d42fc]/30 text-white/90",
  STANDBY: "border-amber-500/40 text-amber-300",
};

const STATUS_LAMP: Record<HlProtocolStatus, string> = {
  ACTIVE: "🟢",
  COMPATIBLE: "🔵",
  STANDBY: "🟡",
};

const STRIP_LABELS: Record<HlProtocolIndicatorId, string> = {
  PORTFOLIO_MARGIN_GUARD: "Portfolio Margin",
  DYNAMIC_TWAP_SHIELD: "Dynamic TWAP",
  MARGIN_TIER_SCALER: "Margin Scaler",
  INSTITUTIONAL_SESSION_KEY: "Session Key",
};

export interface HlProtocolRadarProps {
  input?: HlProtocolRadarInput;
  hidden?: boolean;
  variant?: "strip" | "header";
  sessionKeyRevoked?: boolean;
  l2AdapterMode?: "standby" | "active" | "degraded";
}

function formatBadgeStatus(item: HlProtocolIndicator): string {
  if (item.id === "INSTITUTIONAL_SESSION_KEY" && item.status === "ACTIVE") {
    return "EIP-712 ACTIVE";
  }
  return item.status;
}

function CompatibilityBadge({
  item,
  sessionKeyRevoked = false,
}: {
  item: HlProtocolIndicator;
  sessionKeyRevoked?: boolean;
}): ReactNode {
  if (sessionKeyRevoked && item.id === "INSTITUTIONAL_SESSION_KEY") {
    return (
      <span
        className="inline-flex shrink-0 items-center rounded border border-red-500/50 bg-red-950/30 px-2.5 py-1 font-data text-[11px] font-semibold tabular-nums text-red-300"
        data-indicator={item.id}
        data-status="REVOKED"
        title="Session key physically severed — READ_ONLY_LOCKOUT active"
      >
        [🔴 {STRIP_LABELS[item.id]}: REVOKED]
      </span>
    );
  }

  const badgeTitle =
    item.id === "INSTITUTIONAL_SESSION_KEY" && item.status === "ACTIVE"
      ? "Scope: L2 Trade Only | Cap: $5,000 USD | Master Withdrawal: PERMANENTLY DISABLED"
      : item.detail;

  return (
    <span
      className={[
        "inline-flex shrink-0 items-center rounded border bg-black/50 px-2.5 py-1 font-data text-[11px] font-semibold tabular-nums",
        STATUS_CLASS[item.status],
      ].join(" ")}
      data-indicator={item.id}
      data-status={item.status}
      title={badgeTitle}
    >
      [{STATUS_LAMP[item.status]} {item.label}: {formatBadgeStatus(item)}]
    </span>
  );
}

export function HlProtocolRadar({
  input,
  hidden = false,
  variant = "strip",
  sessionKeyRevoked = false,
  l2AdapterMode = "active",
}: HlProtocolRadarProps): ReactNode {
  const indicators = useMemo(
    () => (input ? resolveHlProtocolRadar(input) : demoHlProtocolRadar()),
    [input],
  );

  if (hidden) return null;

  if (variant === "header") {
    return (
      <div aria-label="GMX v2 Arbitrum Citadel protocol radar" data-testid="hl-protocol-radar">
        <HlProtocolHeaderPill indicators={indicators} l2AdapterMode={l2AdapterMode} />
      </div>
    );
  }

  return (
    <section
      className="font-data"
      aria-label="GMX v2 Arbitrum Citadel protocol radar"
      data-testid="hl-protocol-radar"
    >
      <div className="flex flex-wrap gap-2 rounded border border-zinc-800/80 bg-zinc-950/40 px-3 py-2.5">
        {indicators.map((item) => (
          <CompatibilityBadge
            key={item.id}
            item={item}
            sessionKeyRevoked={sessionKeyRevoked}
          />
        ))}
      </div>
    </section>
  );
}

export default HlProtocolRadar;
