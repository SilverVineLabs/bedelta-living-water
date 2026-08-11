import { ExternalLink } from "lucide-react";
import type { ReactNode } from "react";
import {
  buildGrantAuditHlMainnetSessionExplorerUrl,
  GRANT_AUDIT_HL_MAINNET_OID,
  GRANT_AUDIT_HL_MAINNET_SESSION_WALLET,
  GRANT_AUDIT_HL_MAINNET_SHORT_SIZE_ETH,
} from "../grant-ui-ssot";

export function Phase01MainnetProofCard(): ReactNode {
  const explorerUrl = buildGrantAuditHlMainnetSessionExplorerUrl();

  return (
    <div
      className="flex flex-col gap-2 rounded-md border border-slate-600/50 bg-[#1E293B]/40 p-3 shadow-none sm:flex-row sm:items-center sm:justify-between"
      data-testid="grant-audit-mainnet-proof-card"
    >
      <div className="min-w-0 flex-1">
        <span className="font-mono text-[10px] uppercase tracking-widest text-slate-400">
          HL MAINNET · Hedge Protection · OID {GRANT_AUDIT_HL_MAINNET_OID}
        </span>
        <p className="mt-1 font-mono text-sm font-medium text-slate-300">
          {GRANT_AUDIT_HL_MAINNET_SHORT_SIZE_ETH} ETH Short · HL Session Key Active
        </p>
        <a
          href={explorerUrl}
          target="_blank"
          rel="noreferrer noopener"
          className="mt-1 block truncate font-mono text-[11px] text-slate-400 underline-offset-2 hover:text-teal-600/80 hover:underline"
          data-testid="grant-audit-mainnet-session-wallet-link"
          title={GRANT_AUDIT_HL_MAINNET_SESSION_WALLET}
        >
          {GRANT_AUDIT_HL_MAINNET_SESSION_WALLET}
        </a>
      </div>
      <a
        href={explorerUrl}
        target="_blank"
        rel="noreferrer noopener"
        className="inline-flex shrink-0 items-center justify-center gap-2 rounded-md border border-teal-800/40 bg-[#1E293B]/60 px-4 py-2.5 font-mono text-xs font-medium text-slate-400 transition-colors hover:border-teal-700/50 hover:text-slate-300"
        data-testid="grant-audit-mainnet-hl-explorer-link"
      >
        [ Hyperliquid Explorer ↗ ]
        <ExternalLink className="size-4" aria-hidden="true" />
      </a>
    </div>
  );
}
