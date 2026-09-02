/** Tranche A/B switcher + bridge state rows. */
import type { ReactNode } from "react";
import type { DepositTrancheId } from "../deposit-tranche-config";
import { GMX_MUTED_TEXT_CLASS, GMX_OFFWHITE_TEXT_CLASS } from "../hud/gmx-citadel-theme";

const LBL = `font-mono text-[10px] uppercase tracking-widest ${GMX_MUTED_TEXT_CLASS}`;

function trancheBtn(active: boolean): string {
  return [
    "rounded border px-2.5 py-2 text-left font-mono text-[10px] transition",
    active ? "border-cyan-500/55 bg-cyan-950/35 text-cyan-100" : "border-[#1d2842] bg-[#090d16]/60 text-zinc-400 hover:border-cyan-500/30",
  ].join(" ");
}

export function DepositTrancheSwitch({
  depositTranche,
  onDepositTrancheChange,
}: {
  depositTranche: DepositTrancheId;
  onDepositTrancheChange?: (tranche: DepositTrancheId) => void;
}): ReactNode {
  return (
    <div className="space-y-2" data-testid="smart-routing-tranche-switcher" role="group" aria-label="Deposit tranche">
      <span className={LBL}>Vault Tranche</span>
      <div className="grid gap-2 sm:grid-cols-2">
        <button type="button" data-testid="smart-routing-tranche-a" aria-pressed={depositTranche === "tranche-a-native"} onClick={() => onDepositTrancheChange?.("tranche-a-native")} className={trancheBtn(depositTranche === "tranche-a-native")}>
          <span className="block font-bold uppercase tracking-wider">Tranche A</span>
          <span className="mt-0.5 block opacity-80">Arbitrum Native Vault</span>
        </button>
        <button type="button" data-testid="smart-routing-tranche-b" aria-pressed={depositTranche === "tranche-b-robinhood"} onClick={() => onDepositTrancheChange?.("tranche-b-robinhood")} className={trancheBtn(depositTranche === "tranche-b-robinhood")}>
          <span className="block font-bold uppercase tracking-wider">Tranche B</span>
          <span className="mt-0.5 block opacity-80">Robinhood Ingress Escort</span>
        </button>
      </div>
    </div>
  );
}

export function DepositStatusRow({
  bridgeStateLines,
  bridgeStateActive,
}: {
  bridgeStateLines: readonly string[];
  bridgeStateActive?: string;
}): ReactNode {
  if (bridgeStateLines.length === 0) return null;
  return (
    <div className="rounded border border-[#1d2842] bg-[#090d16]/50 px-3 py-2" data-testid="smart-routing-bridge-state">
      <p className={`font-mono text-[10px] uppercase tracking-widest ${GMX_MUTED_TEXT_CLASS}`}>Bridge State Machine</p>
      {bridgeStateActive ? (
        <p className="mt-1 font-mono text-[11px] font-semibold text-amber-200" data-testid="smart-routing-bridge-active">
          Active: {bridgeStateActive}
        </p>
      ) : null}
      <ul className="mt-1 space-y-0.5">
        {bridgeStateLines.map((line) => (
          <li key={line} className={`font-mono text-[10px] ${GMX_OFFWHITE_TEXT_CLASS}`}>{line}</li>
        ))}
      </ul>
    </div>
  );
}
