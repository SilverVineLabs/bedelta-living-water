import type { ReactNode } from "react";

export type VaultUserMode = "retail" | "institutional";

export interface VaultUserModeSelectorProps {
  mode: VaultUserMode;
  onModeChange: (mode: VaultUserMode) => void;
  netApyPct: number;
}

export function VaultUserModeSelector({ mode, onModeChange, netApyPct }: VaultUserModeSelectorProps): ReactNode {
  const options: { id: VaultUserMode; label: string }[] = [
    { id: "retail", label: `[ 💰 Option A: Deposit USDC (${netApyPct.toFixed(1)}% APY Vault) ]` },
    { id: "institutional", label: "[ 🛡️ Option B: Protect Existing GMX/GM Bags (B2B / API) ]" },
  ];

  return (
    <div
      className="grid grid-cols-1 gap-2 sm:grid-cols-2"
      data-testid="grant-audit-vault-mode-selector"
      role="tablist"
      aria-label="Vault user mode"
    >
      {options.map((option) => {
        const active = mode === option.id;
        return (
          <button
            key={option.id}
            type="button"
            role="tab"
            aria-selected={active}
            data-testid={`grant-audit-vault-mode-${option.id}`}
            onClick={() => onModeChange(option.id)}
            className={[
              "rounded-md border px-3 py-2.5 text-left font-mono text-[10px] font-semibold transition-shadow",
              active
                ? "border-primary bg-primary/10 text-primary shadow-[0_0_16px_rgba(45,66,252,0.35)]"
                : "border-border bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground",
            ].join(" ")}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
