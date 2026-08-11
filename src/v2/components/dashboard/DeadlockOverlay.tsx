import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  buildDeadlockCryptographicProof,
  copyDeadlockProofJson,
  formatDeadlockProofToast,
} from "./deadlock-proof";
import type { TxBatchRecord } from "../../../components/hud/Section1/section1-hud-types";

export interface DeadlockOverlayProps {
  visible: boolean;
  sessionKeyRevoked: boolean;
  selectedBatch: TxBatchRecord | null;
  onDisconnect: () => void;
  onProofCopied?: (toast: string) => void;
}

export function DeadlockOverlay({
  visible,
  sessionKeyRevoked,
  selectedBatch,
  onDisconnect,
  onProofCopied,
}: DeadlockOverlayProps): ReactNode {
  const [shaking, setShaking] = useState(false);

  const proof = useMemo(
    () => buildDeadlockCryptographicProof(sessionKeyRevoked, selectedBatch),
    [sessionKeyRevoked, selectedBatch],
  );
  const proofJson = useMemo(() => JSON.stringify(proof, null, 2), [proof]);

  useEffect(() => {
    if (!visible) {
      setShaking(false);
      return;
    }
    setShaking(true);
    const timer = window.setTimeout(() => setShaking(false), 200);
    return () => window.clearTimeout(timer);
  }, [visible]);

  if (!visible) return null;

  const handleCopyProof = async () => {
    const copied = await copyDeadlockProofJson(proof);
    onProofCopied?.(
      copied
        ? formatDeadlockProofToast(proof.sha256AnchorTruncated)
        : "[ WARN ] Clipboard unavailable for deadlock proof export",
    );
  };

  return (
    <div
      className={[
        "fixed inset-0 z-[9999] flex items-center justify-center bg-red-950/80 p-4 backdrop-blur-md",
        "pointer-events-auto",
        shaking ? "animate-[deadlock-shake_0.2s_ease-in-out]" : "",
      ].join(" ")}
      data-testid="deadlock-overlay"
      role="alertdialog"
      aria-modal="true"
      aria-label="System Deadlock"
    >
      <style>{`
        @keyframes deadlock-shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-6px); }
          75% { transform: translateX(6px); }
        }
      `}</style>
      <div className="pointer-events-auto relative z-[10000] w-full max-w-lg rounded border-2 border-red-600/80 bg-zinc-950/95 p-5 shadow-[0_0_40px_rgba(220,38,38,0.45)]">
        <p
          className="mb-3 rounded border border-emerald-500/50 bg-emerald-950/50 px-2 py-1.5 text-center font-mono text-[10px] font-semibold text-emerald-300"
          data-testid="deadlock-vault-safety-bar"
        >
          [ 🛡️ VAULT CAPITAL STATUS: 100% INTENDED &amp; SAFE — $0.00 EXPOSURE ]
        </p>
        <h2 className="text-center font-mono text-sm font-bold text-red-200">
          [ 🔒 KV-PERSISTED HARDLOCK — EIP-712 SIGNATURE CHANNEL SEVERED ]
        </h2>
        <p className="mt-3 text-center font-data text-[10px] text-orange-300">
          [ TRIGGERED DEFENSE ROOT ] -&gt; R20 (KV Hardlock) | R17 (Daily Drawdown) |
          BO-01 (Fail-Closed Soil Probe)
        </p>
        <pre
          className="pointer-events-auto my-3 max-h-40 overflow-x-auto rounded border border-red-800/60 bg-black/90 p-3 text-left font-mono text-[11px] text-emerald-400"
          data-testid="deadlock-proof-json-block"
        >
          {proofJson}
        </pre>
        <p className="mt-2 text-center font-mono text-[10px] text-red-300/90">
          [ TTL: 00h 00m 00s · SESSION KEY HARD-EXPIRED &amp; SEVERED ]
        </p>
        <p className="mt-3 text-center font-data text-[10px] leading-relaxed text-zinc-300">
          [ 🔑 RE-AUTHENTICATION REQUIRED ] To clear deadlock: Re-sign EIP-712 Session Key
          via Master Hardware Wallet.
        </p>
        <div className="relative z-[10001] mt-5 flex flex-col gap-2 sm:flex-row sm:justify-center">
          <button
            type="button"
            data-testid="deadlock-copy-proof"
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              void handleCopyProof();
            }}
            className="cursor-pointer rounded border border-amber-500/60 bg-amber-950/40 px-3 py-2 font-data text-[10px] font-semibold text-amber-200 hover:bg-amber-900/40"
          >
            [ 📋 Copy Deadlock Cryptographic Proof ]
          </button>
          <button
            type="button"
            data-testid="deadlock-disconnect-reset"
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              onDisconnect();
            }}
            className="cursor-pointer rounded border border-zinc-500/60 bg-zinc-900/80 px-3 py-2 font-data text-[10px] font-semibold text-zinc-200 hover:bg-zinc-800"
          >
            [ 🔌 Disconnect / Reset Session ]
          </button>
        </div>
      </div>
    </div>
  );
}
