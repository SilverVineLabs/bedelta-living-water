import { ExternalLink } from "lucide-react";
import type { ReactNode } from "react";
import {
  buildGrantAuditArbitrumExplorerUrl,
  GRANT_AUDIT_GMX_ARBITRUM_TX_HASH,
} from "../grant-ui-ssot";

export function Phase01GmxArbitrumProofCard(): ReactNode {
  const explorerUrl = buildGrantAuditArbitrumExplorerUrl(GRANT_AUDIT_GMX_ARBITRUM_TX_HASH);

  return (
    <div
      className="flex flex-col gap-2 rounded-md border-2 border-[#0052FF] bg-[#0052FF]/10 p-3 shadow-[0_0_28px_-4px_rgba(0,82,255,0.65)] sm:flex-row sm:items-center sm:justify-between"
      data-testid="grant-audit-gmx-arbitrum-proof-card"
    >
      <div className="min-w-0 flex-1">
        <span className="font-mono text-[10px] uppercase tracking-widest text-[#3B82F6]">
          GMX v2 ARBITRUM · GM Pool Anchor · Wallet B · Primary Leg
        </span>
        <p className="mt-1 font-mono text-sm font-bold text-[#3B82F6]">
          CreateOrder / GM Deposit · Dual-Leg Long Sleeve
        </p>
        <a
          href={explorerUrl}
          target="_blank"
          rel="noreferrer noopener"
          className="mt-1 block truncate font-mono text-[11px] text-foreground underline-offset-2 hover:text-[#3B82F6] hover:underline"
          data-testid="grant-audit-gmx-arbitrum-tx-link"
          title={GRANT_AUDIT_GMX_ARBITRUM_TX_HASH}
        >
          {GRANT_AUDIT_GMX_ARBITRUM_TX_HASH}
        </a>
      </div>
      <a
        href={explorerUrl}
        target="_blank"
        rel="noreferrer noopener"
        className="inline-flex shrink-0 items-center justify-center gap-2 rounded-md border-2 border-[#0052FF] bg-[#0052FF] px-4 py-2.5 font-mono text-xs font-bold text-white shadow-[0_0_20px_rgba(0,82,255,0.55)] transition-colors hover:bg-[#3B82F6]"
        data-testid="grant-audit-gmx-arbiscan-link"
      >
        [ GMX V2 ARBITRUM GM POOL ANCHOR ↗ ]
        <ExternalLink className="size-4" aria-hidden="true" />
      </a>
    </div>
  );
}
