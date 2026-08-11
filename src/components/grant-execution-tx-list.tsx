/** Grant Audit — live mainnet execution tx links (Hyperscan / Arbiscan). */
import type { ReactNode } from "react";
import {
  buildGrantExecutionExplorerUrl,
  type GrantMainnetExecutionEntry,
} from "../data/grant-mainnet-execution-ssot";
import { GMX_LINK_CLASS, GMX_MUTED_TEXT_CLASS } from "./hud/gmx-citadel-theme";

export interface GrantExecutionTxListProps {
  entries: GrantMainnetExecutionEntry[];
  className?: string;
}

export function GrantExecutionTxList({
  entries,
  className = "",
}: GrantExecutionTxListProps): ReactNode {
  if (entries.length === 0) return null;
  return (
    <ul
      className={`mt-3 max-h-48 space-y-2 overflow-y-auto ${className}`}
      data-testid="grant-audit-execution-tx-list"
    >
      {entries.map((entry) => (
        <li key={entry.hash} className="rounded border border-[#1d2842] bg-[#090d16]/60 px-2 py-1.5">
          <p className={`font-data text-[9px] uppercase ${GMX_MUTED_TEXT_CLASS}`}>{entry.label}</p>
          <a
            href={buildGrantExecutionExplorerUrl(entry)}
            target="_blank"
            rel="noopener noreferrer"
            className={`mt-0.5 block truncate font-mono text-[10px] ${GMX_LINK_CLASS}`}
            data-testid={`grant-audit-tx-link-${entry.venue.toLowerCase()}`}
          >
            {entry.hash} ↗
          </a>
        </li>
      ))}
    </ul>
  );
}
