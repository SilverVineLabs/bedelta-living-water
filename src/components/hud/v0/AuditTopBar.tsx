import { AtSign, Globe } from "lucide-react";
import type { ReactNode } from "react";
import { BRAND_LIVING_WATER_TITLE } from "../../../config/constants";
import { SILVERVINE_PROTOCOL_SHIELD_URL } from "../grant-ui-ssot";
import { FailClosedHeroBadge } from "./FailClosedHeroBadge";
import { GmxCitadelBadgePopover } from "./GmxCitadelBadgePopover";
import type { FullGrantAuditVenueView } from "./grant-audit-view-types";

export interface AuditTopBarProps {
  view: FullGrantAuditVenueView;
}

const TOP_BAR_EXTERNAL_LINKS = [
  { label: "silvervinelabs.com", href: SILVERVINE_PROTOCOL_SHIELD_URL, title: "Official Site & Defense Matrix Portal", icon: Globe },
  { label: "x.com/SilverVineLabs", href: "https://x.com/SilverVineLabs", title: "Twitter/X", icon: AtSign },
] as const;

const GATEWAY_STATUS_BADGE = "[ ⚡ Gateway Active · Arbitrum One ]" as const;

function GmxShield(): ReactNode {
  return (
    <svg viewBox="0 0 24 24" className="size-6" fill="none" aria-hidden="true">
      <path
        d="M12 2 4 5v6c0 4.5 3.2 8.4 8 11 4.8-2.6 8-6.5 8-11V5l-8-3Z"
        fill="var(--color-primary)"
        fillOpacity="0.15"
        stroke="var(--color-primary)"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path
        d="m8.5 12 2.5 2.5L15.5 10"
        stroke="var(--color-primary)"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function AuditTopBar({ view }: AuditTopBarProps): ReactNode {
  return (
    <header
      className="grant-audit-v0-glow-card flex flex-col gap-2 border-b border-border bg-card/60 px-4 py-3 md:px-6"
      data-testid="grant-audit-v0-top-bar"
    >
      <div className="flex flex-row flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 flex-1 items-center gap-2.5">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-md border border-primary/40 bg-primary/10">
            <GmxShield />
          </div>
          <div className="min-w-0">
            <h1
              className="truncate font-mono text-sm font-bold tracking-tight text-foreground"
              data-testid="grant-audit-hero-tagline"
            >
              {BRAND_LIVING_WATER_TITLE}
            </h1>
            <p
              className="truncate font-mono text-[11px] text-muted-foreground"
              data-testid="grant-audit-hero-subtitle"
            >
              GMX v2 Toxicity Shield &amp; Gateway
            </p>
            <span className="sr-only">{view.protocolName}</span>
            <span className="sr-only">{view.gatewayName}</span>
          </div>
        </div>
        <div
          className="flex shrink-0 flex-wrap items-center justify-end gap-2"
          data-testid="grant-audit-hero-status-bar"
        >
          <GmxCitadelBadgePopover />
          <FailClosedHeroBadge maxDrawdownPct={view.maxDrawdownPct} />
          <span
            className="inline-flex items-center rounded-md border border-emerald-400/55 bg-emerald-950/35 px-3 py-1.5 font-mono text-[10px] font-semibold text-emerald-300 shadow-[0_0_16px_rgba(52,211,153,0.35)]"
            data-testid="grant-audit-gateway-status-badge"
          >
            {GATEWAY_STATUS_BADGE}
          </span>
        </div>
      </div>
      <nav aria-label="SilverVine Labs links" className="flex flex-wrap items-center gap-2">
        {TOP_BAR_EXTERNAL_LINKS.map((link) => {
          const Icon = link.icon;
          return (
            <a
              key={link.href}
              href={link.href}
              target="_blank"
              rel="noreferrer noopener"
              title={link.title}
              aria-label={link.title}
              className="grant-audit-v0-glow-badge flex items-center gap-1.5 rounded-md border border-border bg-background px-2.5 py-1 font-mono text-[10px] text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground"
            >
              <Icon className="size-3.5 text-primary" aria-hidden="true" />
              {link.label}
            </a>
          );
        })}
      </nav>
    </header>
  );
}
