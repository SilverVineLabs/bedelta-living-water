import { Copy, ExternalLink, Fingerprint, X } from "lucide-react";
import { useState, type ReactNode } from "react";
import { Button } from "../../ui/button";
import { formatUsd } from "./grant-audit-v0-utils";
import {
  buildExecutionProofDetails,
  copyExecutionProofJson,
} from "./execution-proof-build";
import type { FullGrantAuditVenueView, GrantAuditExecution } from "./grant-audit-view-types";

export interface ExecutionProofModalProps {
  open: boolean;
  exec: GrantAuditExecution | null;
  view: FullGrantAuditVenueView;
  onClose: () => void;
}

function ProofRow({ label, value }: { label: string; value: string }): ReactNode {
  return (
    <div className="flex flex-col gap-1 rounded-md border border-border bg-background/80 px-3 py-2">
      <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">{label}</span>
      <span className="break-all font-mono text-[11px] text-foreground">{value}</span>
    </div>
  );
}

export function ExecutionProofModal({
  open,
  exec,
  view,
  onClose,
}: ExecutionProofModalProps): ReactNode {
  const [copied, setCopied] = useState(false);
  if (!open || !exec) return null;

  const proof = buildExecutionProofDetails(exec, view);

  async function onCopyProof(): Promise<void> {
    const ok = await copyExecutionProofJson(proof.proofJson);
    if (!ok) return;
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2_000);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#050810]/80 p-4 backdrop-blur-sm"
      role="presentation"
      data-testid="execution-proof-modal-overlay"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="execution-proof-modal-title"
        className="grant-audit-v0-shield-card relative w-full max-w-lg rounded-lg border border-[#2d42fc]/50 bg-[#101626] p-6 shadow-[0_0_32px_rgba(45,66,252,0.35)]"
        data-testid="execution-proof-modal"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          aria-label="Close proof inspection modal"
          className="absolute right-3 top-3 rounded border border-border p-1 text-muted-foreground hover:border-primary/50 hover:text-foreground"
          onClick={onClose}
        >
          <X className="size-4" aria-hidden="true" />
        </button>
        <div className="flex items-center gap-2 pr-8">
          <Fingerprint className="size-4 text-[#2d42fc]" aria-hidden="true" />
          <h2
            id="execution-proof-modal-title"
            className="font-mono text-sm font-semibold tracking-tight text-foreground"
          >
            In-App Proof Inspection
          </h2>
        </div>
        <p className="mt-2 font-mono text-[11px] text-muted-foreground">{exec.action}</p>
        <div className="mt-4 grid grid-cols-1 gap-2">
          <ProofRow label="Transaction Fingerprint (SHA-256 Anchor)" value={proof.sha256Anchor} />
          <ProofRow label="Execution Venue" value={proof.venueLabel} />
          <ProofRow label="Fill Price" value={formatUsd(proof.fillPriceUsd)} />
          <ProofRow
            label="Slippage Saved"
            value={`${formatUsd(proof.slippageSavedUsd)} · ${proof.slippageSavedBps.toFixed(2)} bps`}
          />
          <ProofRow label="Execution Latency" value={`${Math.round(proof.executionLatencyMs)} ms`} />
        </div>
        <div className="mt-5 flex flex-col gap-2 sm:flex-row">
          <Button
            type="button"
            variant="outline"
            className="flex-1 font-mono text-[11px]"
            data-testid="execution-proof-copy-json"
            onClick={() => void onCopyProof()}
          >
            <Copy className="size-3.5" aria-hidden="true" />
            {copied ? "Proof JSON Copied" : "Copy JSON Proof"}
          </Button>
          {exec.explorerUrl ? (
            <a
              href={exec.explorerUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-md border border-primary bg-primary px-3 py-2 font-mono text-[11px] text-primary-foreground"
              data-testid="execution-proof-explorer-link"
            >
              <ExternalLink className="size-3.5" aria-hidden="true" />
              Direct Explorer Link
            </a>
          ) : null}
        </div>
      </div>
    </div>
  );
}
