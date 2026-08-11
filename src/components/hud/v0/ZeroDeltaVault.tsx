/** Tab 2 — minimal reference vault view; live proof lives on Tab 1. */
import type { ReactNode } from "react";
import { RetailVaultDemoPanel } from "../RetailVaultDemoPanel";
import { resolveRetailVaultYieldTelemetry } from "../../../services/retail-vault-yield-telemetry";
import type { FullGrantAuditVenueView } from "./grant-audit-view-types";

export interface ZeroDeltaVaultProps {
  view: FullGrantAuditVenueView;
}

export function ZeroDeltaVault({ view }: ZeroDeltaVaultProps): ReactNode {
  const yieldTelemetry = resolveRetailVaultYieldTelemetry({
    combinedTvlUsd: view.combinedTvlUsd,
    gmPoolUsd: view.gmPoolUsd,
    netApyPct: view.netApyPct,
    maxDrawdownPct: view.maxDrawdownPct,
  });

  return (
    <div className="flex flex-col gap-4" data-testid="grant-audit-zero-delta-vault">
      <p className="font-mono text-[11px] leading-relaxed text-muted-foreground">
        Reference vault sleeve — live Citadel TVL, Armor Index, and Provenance Verified OID are on Tab 1.
      </p>
      <RetailVaultDemoPanel {...yieldTelemetry} />
    </div>
  );
}
