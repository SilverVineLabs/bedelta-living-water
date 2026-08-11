/** Grant Audit page header — role switcher + GMX v2 Citadel SSOT copy. */
import type { ReactNode } from "react";
import {
  GRANT_AUDIT_ROLE_LABEL,
  type GrantAuditViewRole,
} from "./grant-audit-role";
import {
  GMX_ACCENT_TEXT_CLASS,
  GMX_CITADEL_ACCENT_BORDER_CLASS,
  GMX_MUTED_TEXT_CLASS,
  GMX_OFFWHITE_TEXT_CLASS,
  GMX_ROLE_ACTIVE_CLASS,
  GMX_ROLE_IDLE_CLASS,
} from "./hud/gmx-citadel-theme";
import { DeltaTip } from "./ui/brand-delta-ui";

export interface GrantAuditPageHeaderProps {
  className?: string;
  role?: GrantAuditViewRole;
  onRoleChange?: (role: GrantAuditViewRole) => void;
}

const ROLES: GrantAuditViewRole[] = ["grant", "vault"];

export function GrantAuditPageHeader({
  className = "",
  role = "grant",
  onRoleChange,
}: GrantAuditPageHeaderProps): ReactNode {
  return (
    <header className={`space-y-3 ${className}`} data-testid="grant-audit-header">
      <div
        className={`inline-flex flex-wrap gap-1 rounded p-1 ${GMX_CITADEL_ACCENT_BORDER_CLASS} bg-[#090d16]/80`}
        role="group"
        aria-label="HUD view role"
        data-testid="grant-audit-role-switcher"
      >
        {ROLES.map((key) => {
          const active = role === key;
          return (
            <button
              key={key}
              type="button"
              data-testid={`grant-audit-role-${key}`}
              aria-pressed={active}
              onClick={() => onRoleChange?.(key)}
              className={[
                "rounded px-3 py-1.5 font-mono text-[11px] transition-colors",
                active ? GMX_ROLE_ACTIVE_CLASS : GMX_ROLE_IDLE_CLASS,
              ].join(" ")}
            >
              {GRANT_AUDIT_ROLE_LABEL[key]}
            </button>
          );
        })}
      </div>

      <p className={`font-mono text-[10px] tracking-[0.2em] uppercase ${GMX_MUTED_TEXT_CLASS}`}>
        Zero-Trust Grant Audit · Arbitrum One
      </p>
      <h1 className={`font-mono text-lg font-semibold leading-snug ${GMX_ACCENT_TEXT_CLASS}`}>
        SliverVine Protocol — GMX v2 / Arbitrum Citadel Safety Gateway
      </h1>
      <p className={`font-data max-w-3xl text-[12px] leading-relaxed ${GMX_MUTED_TEXT_CLASS}`}>
        {role === "grant" ? (
          <>
            Primary telemetry from{" "}
            <code className={GMX_OFFWHITE_TEXT_CLASS}>/api/grant-audit</code> — sequencer guard,
            GMX Balancer qualification, oracle lag, L1 gas surcharge, and zero-
            <DeltaTip />
            execution history via <code className={GMX_OFFWHITE_TEXT_CLASS}>/api/logs</code>.
          </>
        ) : (
          <>
            Read-only vault demo — simulated GM Pool yield, 0.00% drawdown guard, and deposit CTA
            without mandatory wallet connect on page load.
          </>
        )}
      </p>
    </header>
  );
}

export default GrantAuditPageHeader;
