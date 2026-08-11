import type { ReactNode } from "react";
import type { TwinEngineButtonsProps } from "./types";

export function TwinEngineButtons({
  disabled,
  walletConnected,
  executeDisabled,
  signatureDeadlocked,
  onAutoDemo,
  onConnectOrExecute,
}: TwinEngineButtonsProps): ReactNode {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
      <button
        type="button"
        data-testid="action-auto-demo"
        disabled={disabled}
        onClick={onAutoDemo}
        className="w-full rounded border border-cyan-500/70 bg-cyan-950/50 px-3 py-3.5 font-mono text-sm font-bold tracking-wide text-cyan-200 transition hover:bg-cyan-900/70 hover:shadow-[0_0_15px_rgba(34,211,238,0.18)] disabled:cursor-not-allowed disabled:opacity-50 sm:text-base"
      >
        [ 🤖 Auto-Demo (Read-Only) ]
      </button>
      <button
        type="button"
        data-testid="action-connect-execute"
        disabled={executeDisabled}
        onClick={onConnectOrExecute}
        className={
          signatureDeadlocked
            ? "w-full cursor-not-allowed rounded border border-red-700 bg-red-950 px-3 py-3.5 font-mono text-sm font-bold tracking-wide text-red-200 shadow-[0_0_16px_rgba(127,29,29,0.45)] sm:text-base"
            : "w-full rounded border border-amber-500 bg-amber-950/70 px-3 py-3.5 font-mono text-sm font-bold tracking-wide text-amber-200 shadow-[0_0_15px_rgba(245,158,11,0.25)] transition hover:border-amber-400 hover:bg-amber-900 hover:shadow-[0_0_18px_rgba(245,158,11,0.35)] disabled:cursor-not-allowed disabled:opacity-50 sm:text-base"
        }
      >
        {signatureDeadlocked
          ? "[ 🔒 DEAD LOCKED — SIGNATURE CHANNEL SEVERED ]"
          : walletConnected
            ? "[ ⚡ Execute 5-TX On-Chain ]"
            : "[ ⚡ Connect Testnet Wallet / Execute 5-TX On-Chain ]"}
      </button>
    </div>
  );
}
