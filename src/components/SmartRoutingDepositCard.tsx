/** BeDeltaLivingWater — ZeroDev Smart Routing Deposit card (Pillar 2). */
import { useState, type ReactNode } from "react";
import { formatConnectedWalletLabel } from "../data/verified-5tx-display-helpers";
import type { DepositTrancheId } from "./deposit-tranche-config";
import {
  GMX_ACCENT_TEXT_CLASS,
  GMX_CITADEL_ACCENT_BORDER_CLASS,
  GMX_CITADEL_PANEL_CLASS,
  GMX_MUTED_TEXT_CLASS,
  GMX_OFFWHITE_TEXT_CLASS,
} from "./hud/gmx-citadel-theme";
import { DepositSel, INP, type DepositSelectOption } from "./sub/DepositSel";
import { DepositStatusRow, DepositTrancheSwitch } from "./sub/DepositStatusRow";

export type { DepositSelectOption };

export interface SmartRoutingDepositCardProps {
  className?: string;
  cardTitle?: string;
  depositTranche?: DepositTrancheId;
  onDepositTrancheChange?: (tranche: DepositTrancheId) => void;
  trancheSubtitle?: string;
  bridgeStateLines?: readonly string[];
  bridgeStateActive?: string;
  sendAmount: string;
  onSendAmountChange: (value: string) => void;
  sendToken: string;
  sendTokenOptions?: readonly DepositSelectOption[];
  onSendTokenChange?: (value: string) => void;
  sendChain: string;
  sendChainOptions?: readonly DepositSelectOption[];
  onSendChainChange?: (value: string) => void;
  smartRouteAddress: string;
  onCopySmartRouteAddress?: () => void;
  receiveAmount: string;
  receiveToken: string;
  receiveTokenOptions?: readonly DepositSelectOption[];
  onReceiveTokenChange?: (value: string) => void;
  receiveChain: string;
  receiveChainOptions?: readonly DepositSelectOption[];
  onReceiveChainChange?: (value: string) => void;
  safetyBadgeLabel?: string;
  actionLabel?: string;
  depositingLabel?: string;
  isDepositing?: boolean;
  depositDisabled?: boolean;
  onDeposit?: () => void;
}

const LBL = `font-mono text-[10px] uppercase tracking-widest ${GMX_MUTED_TEXT_CLASS}`;

export function SmartRoutingDepositCard({
  className = "",
  cardTitle = "Card 2: ZeroDev Smart Routing Deposit (Pillar 2)",
  depositTranche = "tranche-a-native",
  onDepositTrancheChange,
  trancheSubtitle,
  bridgeStateLines = [],
  bridgeStateActive,
  sendAmount,
  onSendAmountChange,
  sendToken,
  sendTokenOptions,
  onSendTokenChange,
  sendChain,
  sendChainOptions,
  onSendChainChange,
  smartRouteAddress,
  onCopySmartRouteAddress,
  receiveAmount,
  receiveToken,
  receiveTokenOptions,
  onReceiveTokenChange,
  receiveChain,
  receiveChainOptions,
  onReceiveChainChange,
  safetyBadgeLabel = "Calldata Hash Bound via payloadHash (Zero EIP-712 Struct Change)",
  actionLabel = "🌊 Deposit & Escort Capital to BDLW Vault",
  depositingLabel = "Escorting Capital…",
  isDepositing = false,
  depositDisabled = false,
  onDeposit,
}: SmartRoutingDepositCardProps): ReactNode {
  const [copied, setCopied] = useState(false);
  const blocked = depositDisabled || isDepositing || !smartRouteAddress;
  const copyAddress = async (): Promise<void> => {
    if (!smartRouteAddress) return;
    try {
      await navigator.clipboard.writeText(smartRouteAddress);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1_500);
    } catch { /* parent fallback */ }
    onCopySmartRouteAddress?.();
  };
  return (
    <section className={`${GMX_CITADEL_PANEL_CLASS} flex flex-col gap-4 ${className}`} data-testid="smart-routing-deposit-card">
      <header className="border-b border-[#1d2842] pb-3">
        <h2 className={`font-mono text-sm font-semibold ${GMX_ACCENT_TEXT_CLASS}`}>{cardTitle}</h2>
        {trancheSubtitle ? <p className={`mt-1 font-mono text-[10px] leading-relaxed ${GMX_MUTED_TEXT_CLASS}`}>{trancheSubtitle}</p> : null}
      </header>
      <DepositTrancheSwitch depositTranche={depositTranche} onDepositTrancheChange={onDepositTrancheChange} />
      <DepositStatusRow bridgeStateLines={bridgeStateLines} bridgeStateActive={bridgeStateActive} />
      <div className="space-y-2" data-testid="smart-routing-send-row">
        <span className={LBL}>You Send</span>
        <div className="grid gap-2 sm:grid-cols-[1.4fr_0.8fr_1fr]">
          <input type="text" inputMode="decimal" className={INP} value={sendAmount} onChange={(e) => onSendAmountChange(e.target.value)} data-testid="smart-routing-send-amount" aria-label="Send amount" />
          <DepositSel value={sendToken} options={sendTokenOptions} onChange={onSendTokenChange} />
          <DepositSel value={sendChain} options={sendChainOptions} onChange={onSendChainChange} />
        </div>
      </div>
      <div className="space-y-2" data-testid="smart-routing-address-row">
        <span className={LBL}>Smart Route Address</span>
        <div className="flex gap-2">
          <input type="text" readOnly className={`${INP} flex-1 text-[#94a3b8]`} value={formatConnectedWalletLabel(smartRouteAddress)} title={smartRouteAddress} data-testid="smart-routing-address-display" aria-label="Smart route address" />
          <button type="button" onClick={() => void copyAddress()} className="shrink-0 rounded border border-[#2d42fc]/45 px-3 py-2 font-mono text-[10px] font-semibold text-[#2d42fc] hover:bg-[#2d42fc]/10" data-testid="smart-routing-address-copy">{copied ? "Copied" : "Copy"}</button>
        </div>
      </div>
      <div className="space-y-2" data-testid="smart-routing-receive-row">
        <span className={LBL}>You Receive</span>
        <div className="grid gap-2 sm:grid-cols-[1.4fr_0.8fr_1fr]">
          <output className={`${INP} block`} data-testid="smart-routing-receive-amount">{receiveAmount}</output>
          <DepositSel value={receiveToken} options={receiveTokenOptions} onChange={onReceiveTokenChange} />
          <DepositSel value={receiveChain} options={receiveChainOptions} onChange={onReceiveChainChange} />
        </div>
      </div>
      <p className={`rounded border px-3 py-2 text-center font-mono text-[10px] ${GMX_CITADEL_ACCENT_BORDER_CLASS} ${GMX_OFFWHITE_TEXT_CLASS}`} data-testid="smart-routing-safety-badge">{safetyBadgeLabel}</p>
      <button type="button" disabled={blocked} onClick={onDeposit} aria-busy={isDepositing} data-testid="smart-routing-deposit-button" className={["w-full rounded border border-cyan-500/50 bg-cyan-950/30 px-3 py-2.5 font-mono text-xs font-bold text-cyan-100 shadow-[0_0_16px_rgba(34,211,238,0.2)] hover:bg-cyan-950/45", blocked ? "cursor-not-allowed opacity-50" : "", isDepositing ? "cursor-wait animate-pulse" : ""].join(" ")}>{isDepositing ? depositingLabel : actionLabel}</button>
    </section>
  );
}

export default SmartRoutingDepositCard;
