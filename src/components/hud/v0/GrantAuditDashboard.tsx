import { useState, type ReactNode } from "react";
import { Phase01Audit } from "./Phase01Audit";
import type { FullGrantAuditVenueView } from "./grant-audit-view-types";
import { VaultTabSwitcher, type VaultTab } from "./VaultTabSwitcher";
import { ZeroDeltaVault } from "./ZeroDeltaVault";

export interface GrantAuditDashboardProps {
  view: FullGrantAuditVenueView;
}

export function GrantAuditDashboard({ view }: GrantAuditDashboardProps): ReactNode {
  const [tab, setTab] = useState<VaultTab>("audit");

  return (
    <div className="flex flex-1 flex-col bg-background" data-testid="grant-audit-v0-dashboard">
      <main className="flex-1 px-4 py-4 md:px-6 md:py-5">
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-4">
          <VaultTabSwitcher active={tab} onChange={setTab} />
          {tab === "zero-delta" ? (
            <ZeroDeltaVault view={view} />
          ) : (
            <Phase01Audit view={view} />
          )}
        </div>
      </main>
      <footer className="border-t border-border bg-card/60 px-4 py-3 md:px-6">
        <div className="mx-auto flex w-full max-w-5xl flex-col items-center justify-between gap-2 sm:flex-row">
          <span className="font-mono text-[11px] text-muted-foreground">
            {view.protocolName} · {view.gatewayName}
          </span>
          <span className="font-mono text-[11px] text-muted-foreground">
            Target Delta Band (Δ ≈ 0.00) · Fail-Closed Shielded · Not financial advice
          </span>
        </div>
      </footer>
    </div>
  );
}
