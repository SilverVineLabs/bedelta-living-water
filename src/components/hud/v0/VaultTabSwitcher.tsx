import { Droplets, Shield } from "lucide-react";
import type { ReactNode } from "react";

export type VaultTab = "zero-delta" | "audit";

export interface VaultTabSwitcherProps {
  active: VaultTab;
  onChange: (tab: VaultTab) => void;
}

const tabs: { id: VaultTab; label: string; icon: typeof Shield }[] = [
  { id: "audit", label: "1. Grant Audit & On-Chain Proofs", icon: Shield },
  { id: "zero-delta", label: "2. Yield & Risk Reference Model", icon: Droplets },
];

export function VaultTabSwitcher({ active, onChange }: VaultTabSwitcherProps): ReactNode {
  return (
    <div
      role="tablist"
      aria-label="Vault view switcher"
      className="flex w-full flex-col gap-1 rounded-lg border border-border bg-card p-1 sm:flex-row"
      data-testid="grant-audit-vault-tab-switcher"
    >
      {tabs.map((tab) => {
        const isActive = tab.id === active;
        const Icon = tab.icon;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(tab.id)}
            className={[
              "flex flex-1 items-center justify-center gap-2 rounded-md px-3 py-2 font-mono text-[11px] font-medium tracking-tight transition-colors",
              isActive
                ? "bg-primary text-primary-foreground shadow-[0_0_16px_-2px_var(--color-primary)]"
                : "text-muted-foreground hover:bg-secondary hover:text-foreground",
            ].join(" ")}
          >
            <Icon className="size-4" aria-hidden="true" />
            <span className="text-balance">{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
}
