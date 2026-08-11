import type { ReactNode } from "react";
import { Shield } from "lucide-react";
import { Button } from "../../ui/button";

export interface InstitutionalGmxProtectCardProps {
  onConnectWallet: () => void;
}

export function InstitutionalGmxProtectCard({ onConnectWallet }: InstitutionalGmxProtectCardProps): ReactNode {
  return (
    <section
      className="flex flex-col gap-5 rounded-lg border border-primary/40 bg-primary/5 p-5"
      data-testid="grant-audit-institutional-gmx-protect"
    >
      <div className="flex items-center gap-3">
        <div className="flex size-9 items-center justify-center rounded-md border border-primary/40 bg-primary/10">
          <Shield className="size-4 text-primary" aria-hidden="true" />
        </div>
        <div className="flex flex-col gap-1">
          <h2 className="font-mono text-sm font-semibold uppercase tracking-wide text-foreground">
            Institutional GMX / GM Bag Protection
          </h2>
          <p className="font-mono text-[11px] leading-relaxed text-muted-foreground">
            Protect your GMX positions without selling. Connect wallet to auto-detect or access Sidecar API.
          </p>
        </div>
      </div>
      <ul className="flex flex-col gap-2 font-mono text-[10px] text-muted-foreground">
        <li>• Auto-detect existing GMX GM exposure on Arbitrum</li>
        <li>• Deploy 1:1 Hyperliquid short hedge without unwinding LP</li>
        <li>• Sidecar API for funds, MMs, and custom routing stacks</li>
      </ul>
      <div className="flex flex-col gap-2 sm:flex-row">
        <Button
          type="button"
          className="flex-1 font-mono text-[11px] shadow-[0_0_16px_rgba(45,66,252,0.35)]"
          data-testid="grant-audit-institutional-connect-wallet"
          onClick={onConnectWallet}
        >
          Connect Wallet to Auto-Detect GMX Bags
        </Button>
        <a
          href="/b2b"
          className="inline-flex flex-1 items-center justify-center rounded-md border border-primary/40 bg-background px-3 py-2 font-mono text-[11px] font-semibold text-primary hover:border-primary/60"
          data-testid="grant-audit-institutional-b2b-link"
        >
          [ 🛡️ B2B / Developer API ]
        </a>
      </div>
    </section>
  );
}
