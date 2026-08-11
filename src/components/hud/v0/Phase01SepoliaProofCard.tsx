import { ExternalLink } from "lucide-react";
import type { ReactNode } from "react";
import type { FullGrantAuditVenueView } from "./grant-audit-view-types";

export interface Phase01SepoliaProofCardProps {
  view: FullGrantAuditVenueView;
}

export function Phase01SepoliaProofCard({ view }: Phase01SepoliaProofCardProps): ReactNode {
  const hash = view.sepoliaTxHash?.trim();
  const explorerUrl = view.sepoliaTxExplorerUrl?.trim();
  if (!hash || !explorerUrl) return null;

  return (
    <div
      className="flex flex-col gap-2 rounded-md border border-[#2d42fc]/40 bg-[#0a1020]/60 p-3 sm:flex-row sm:items-center sm:justify-between"
      data-testid="grant-audit-sepolia-proof-card"
    >
      <div className="min-w-0 flex-1">
        <span className="font-mono text-[10px] uppercase tracking-widest text-[#2d42fc]/80">
          SEP_PROOF · Arbiscan Sepolia TxHash
        </span>
        <a
          href={explorerUrl}
          target="_blank"
          rel="noreferrer noopener"
          className="mt-1 block truncate font-mono text-[11px] text-foreground underline-offset-2 hover:text-[#2d42fc] hover:underline"
          data-testid="grant-audit-sepolia-tx-link"
          title={hash}
        >
          {hash}
        </a>
        {view.sepoliaLatencyMs != null ? (
          <span className="font-mono text-[10px] text-muted-foreground">
            {Math.round(view.sepoliaLatencyMs)}ms dual-leg
          </span>
        ) : null}
      </div>
      <a
        href={explorerUrl}
        target="_blank"
        rel="noreferrer noopener"
        className="inline-flex shrink-0 items-center justify-center gap-2 rounded-md border border-primary bg-primary px-4 py-2.5 font-mono text-xs font-medium text-primary-foreground shadow-[0_0_16px_rgba(45,66,252,0.35)] transition-colors hover:bg-primary/90"
        data-testid="grant-audit-sepolia-arbiscan-link"
      >
        [ Arbiscan Sepolia ↗ ]
        <ExternalLink className="size-4" aria-hidden="true" />
      </a>
    </div>
  );
}
