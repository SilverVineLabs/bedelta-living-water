import { useState, type ReactNode } from "react";
import {
  buildHlTestnetAccountExplorerUrl,
  HL_TESTNET_EXPLORER_FALLBACK_WALLET,
} from "../../../../data/verified-5tx";
import { createSampleHistoricalBatch } from "../section1-hud-engine-lib/section1-hud-engine-core";
import { formatBatchDropdownLabel } from "../section1-hud-log-formatters";
import { TcaSha256AnchorBadge } from "./TcaSha256AnchorBadge";
import type { BatchHistoryDropdownProps } from "./types";

export function BatchHistoryDropdown({
  batches,
  selectedBatchId,
  onBatchSelect,
  actionsDisabled = false,
  onExportAudit,
  onExportAuditCertificate,
  onCopyGrantProof,
  walletAddress = null,
}: BatchHistoryDropdownProps): ReactNode {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const displayBatches = batches.length > 0 ? batches : [createSampleHistoricalBatch()];
  const selected =
    displayBatches.find((b) => b.id === selectedBatchId) ?? displayBatches[0]!;
  const explorerWallet =
    walletAddress ?? HL_TESTNET_EXPLORER_FALLBACK_WALLET;
  const explorerUrl = buildHlTestnetAccountExplorerUrl(explorerWallet);
  const toolbarLocked = actionsDisabled || !selected;

  return (
    <div className="relative z-50 mt-2">
      <p className="mb-1 font-data text-[10px] text-zinc-500">Batch History:</p>
      <button
        type="button"
        data-testid="batch-history-toggle"
        disabled={actionsDisabled}
        onClick={() => setDropdownOpen((prev) => !prev)}
        className="relative z-50 flex w-full items-center justify-between rounded border border-zinc-700 bg-zinc-900/70 px-2 py-1.5 font-data text-[10px] text-zinc-300 hover:border-zinc-500 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <span className="truncate text-left">
          [ {formatBatchDropdownLabel(selected)} ▾ ]
        </span>
      </button>
      {dropdownOpen ? (
        <ul
          className="absolute z-50 mt-1 max-h-36 w-full overflow-y-auto rounded border border-zinc-700 bg-zinc-950 shadow-lg"
          data-testid="batch-history-menu"
          role="listbox"
        >
          {displayBatches.map((batch) => (
            <li key={batch.id} className="relative z-50">
              <button
                type="button"
                role="option"
                aria-selected={batch.id === selectedBatchId}
                data-testid={`batch-option-${batch.id}`}
                disabled={actionsDisabled}
                onClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  onBatchSelect(batch.id);
                  setDropdownOpen(false);
                }}
                className={[
                  "block w-full px-2 py-1.5 text-left font-data text-[10px] hover:bg-zinc-800/80 disabled:cursor-not-allowed disabled:opacity-50",
                  batch.id === selectedBatchId
                    ? "bg-zinc-800/60 text-emerald-300"
                    : "text-zinc-400",
                ].join(" ")}
              >
                {formatBatchDropdownLabel(batch)}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
      <div
        className="mt-2 flex flex-wrap gap-x-3 gap-y-1 border-t border-zinc-800/60 pt-2"
        data-testid="batch-history-action-toolbar"
      >
        <a
          href={explorerUrl}
          target="_blank"
          rel="noopener noreferrer"
          data-testid="batch-action-verify-explorer"
          className={[
            "font-data text-[10px] font-semibold text-sky-300 hover:text-sky-200",
            toolbarLocked ? "pointer-events-none opacity-50" : "",
          ].join(" ")}
          aria-disabled={toolbarLocked}
          onClick={(event) => {
            if (toolbarLocked) event.preventDefault();
          }}
        >
          [ 🔗 Verify on Explorer ]
        </a>
        <button
          type="button"
          data-testid="batch-action-copy-grant-proof"
          disabled={toolbarLocked}
          onClick={onCopyGrantProof}
          className="font-data text-[10px] font-semibold text-amber-200 hover:text-amber-100 disabled:cursor-not-allowed disabled:opacity-50"
        >
          [ 📋 Copy Proof ]
        </button>
        <button
          type="button"
          data-testid="batch-action-export-audit-certificate"
          disabled={toolbarLocked}
          onClick={onExportAuditCertificate}
          className="font-data text-[10px] font-semibold text-cyan-200 hover:text-cyan-100 disabled:cursor-not-allowed disabled:opacity-50"
        >
          [ 📜 Export SHA-256 Audit Certificate ]
        </button>
        <button
          type="button"
          data-testid="batch-action-download-json"
          disabled={toolbarLocked}
          onClick={onExportAudit}
          className="font-data text-[10px] font-semibold text-emerald-200 hover:text-emerald-100 disabled:cursor-not-allowed disabled:opacity-50"
        >
          [ 📥 Download Latest 5-TX JSON ]
        </button>
        <TcaSha256AnchorBadge batch={selected} disabled={toolbarLocked} />
      </div>
    </div>
  );
}
