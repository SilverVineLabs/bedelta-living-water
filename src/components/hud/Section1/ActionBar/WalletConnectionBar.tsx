import type { ReactNode } from "react";
import { formatConnectedWalletLabel } from "../../../../data/verified-5tx-display-helpers";

export interface WalletConnectionBarProps {
  walletAddress: string;
  sessionKeyActive: boolean;
  onDisconnect: () => void;
}

export function WalletConnectionBar({
  walletAddress,
  sessionKeyActive,
  onDisconnect,
}: WalletConnectionBarProps): ReactNode {
  const label = formatConnectedWalletLabel(walletAddress);
  const statusLine = sessionKeyActive
    ? `Connected: ${label} · EIP-712 Active · Cap: $5,000 Max Notional`
    : `Connected: ${label}`;

  return (
    <div
      className="mb-2 flex flex-wrap items-center justify-between gap-2 rounded border border-emerald-500/40 bg-emerald-950/25 px-2 py-1.5"
      data-testid="wallet-connection-bar"
    >
      <p className="font-mono text-xs font-semibold leading-tight text-emerald-200">
        {statusLine}
      </p>
      <button
        type="button"
        data-testid="wallet-disconnect-button"
        onClick={onDisconnect}
        className="shrink-0 font-data text-[10px] font-semibold text-zinc-300 hover:text-zinc-100"
      >
        [ 🔌 Disconnect ]
      </button>
    </div>
  );
}
