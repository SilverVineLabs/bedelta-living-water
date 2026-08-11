import type { ReactNode } from "react";
import type { TxBatchRecord } from "../section1-hud-types";
import { computeVerified5TxSha256Anchor } from "../../../../data/verified-5tx";

const HL_TESTNET_TX_EXPLORER = "https://app.hyperliquid-testnet.xyz/explorer/tx";

export interface TcaSha256AnchorModalProps {
  batch: TxBatchRecord;
  isOpen: boolean;
  onClose: () => void;
}

export function TcaSha256AnchorModal({
  batch,
  isOpen,
  onClose,
}: TcaSha256AnchorModalProps): ReactNode {
  if (!isOpen) return null;

  const anchor = computeVerified5TxSha256Anchor(batch.results.fills);
  const sessionKey = batch.results.wallet;

  return (
    <div
      className="fixed inset-0 z-[9998] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="TCA SHA-256 Immutable Anchor"
      data-testid="tca-sha256-anchor-modal"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded border border-emerald-600/50 bg-zinc-950/95 p-4 shadow-[0_0_32px_rgba(16,185,129,0.2)]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-3 flex items-center justify-between gap-2">
          <p className="font-data text-[10px] font-semibold uppercase tracking-[0.16em] text-emerald-300">
            TCA SHA-256 Immutable Anchor
          </p>
          <button
            type="button"
            data-testid="tca-sha256-anchor-close"
            onClick={onClose}
            className="rounded border border-zinc-600 px-2 py-0.5 font-data text-[10px] text-zinc-300 hover:bg-zinc-800"
          >
            Close
          </button>
        </div>

        <dl className="space-y-3 font-data text-[10px]">
          <div>
            <dt className="text-zinc-500">SHA-256 Hash</dt>
            <dd
              className="mt-1 break-all font-mono text-[9px] leading-relaxed text-emerald-200"
              data-testid="tca-sha256-full-hash"
            >
              {anchor}
            </dd>
          </div>
          <div>
            <dt className="text-zinc-500">On-Chain Fill Hashes</dt>
            <dd className="mt-1 space-y-1" data-testid="tca-fill-hash-list">
              {batch.results.fills.map((fill, index) => (
                <p
                  key={fill.txHash}
                  className="break-all font-mono text-[9px] leading-relaxed text-zinc-300"
                  data-testid={`tca-fill-hash-${index}`}
                >
                  {index + 1}.{" "}
                  <a
                    href={`${HL_TESTNET_TX_EXPLORER}/${fill.txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sky-300 underline decoration-sky-500/50 hover:text-sky-200"
                    data-testid={`tca-fill-hash-link-${index}`}
                  >
                    {fill.txHash}
                  </a>
                </p>
              ))}
            </dd>
          </div>
          <div>
            <dt className="text-zinc-500">Session Key Signer</dt>
            <dd
              className="mt-1 break-all font-mono text-[9px] text-sky-200"
              data-testid="tca-session-key-signer"
            >
              {sessionKey}
            </dd>
          </div>
        </dl>
      </div>
    </div>
  );
}
