import type { ReactNode } from "react";
import { formatEstSavedAmountUsd } from "../../../data/verified-5tx-display-helpers";
import type { TradeNotionalTier } from "../../../data/verified-5tx";
import type { OperatorUnlockVersion } from "../../../v2/admin/operator-matrix";
import { B002SlippageTooltip } from "./B002SlippageTooltip";
import { SlippageModeTag } from "./SlippageModeTag";
import type { ShieldTheme } from "./section1-shield-themes";

export interface EstSavedAmountDisplayProps {
  protocolVersion: OperatorUnlockVersion;
  notional: TradeNotionalTier;
  savedUsdAmount: number;
  savedBps: number;
  showVerifiedProofSubtitle: boolean;
  hasLive5TxProof: boolean;
  forceUltraShield?: boolean;
  theme: ShieldTheme;
  interceptPct: number;
  jitterLabel: string;
}

export function EstSavedAmountDisplay({
  protocolVersion,
  notional,
  savedUsdAmount,
  savedBps,
  showVerifiedProofSubtitle,
  hasLive5TxProof,
  forceUltraShield = false,
  theme,
  interceptPct,
  jitterLabel,
}: EstSavedAmountDisplayProps): ReactNode {
  return (
    <div className="w-full flex flex-col items-start gap-1">
      <div className="flex flex-wrap items-center gap-2">
        <p className="font-data text-[10px] uppercase tracking-wider text-zinc-500">
          Est. Saved Amount
          {showVerifiedProofSubtitle ? (
            <span className="ml-1 normal-case text-zinc-400">
              (Verified 5-TX Testnet Proof)
            </span>
          ) : null}
        </p>
        <SlippageModeTag
          protocolVersion={protocolVersion}
          hasLive5TxProof={hasLive5TxProof}
        />
      </div>
      <div className="flex w-full flex-wrap items-center gap-2 overflow-visible">
        <p
          className={[
            "mt-0.5 animate-pulse rounded px-1 font-data text-xl font-semibold tabular-nums shadow-[0_0_18px_rgba(45,66,252,0.22)]",
            forceUltraShield ? "text-purple-400" : theme.accentText,
          ].join(" ")}
          data-testid="saved-amount-line"
        >
          {formatEstSavedAmountUsd(savedUsdAmount, notional)}{" "}
          {savedBps < 0 ? `(${savedBps.toFixed(2)} bps)` : `(+${savedBps.toFixed(2)} bps)`}
        </p>
        <B002SlippageTooltip />
        <span
          className="inline-flex items-center overflow-visible rounded border border-[#2d42fc]/40 bg-[#101626] px-3 py-1.5 font-data text-[9px] font-semibold leading-relaxed text-[#2d42fc] shadow-[0_0_10px_rgba(45,66,252,0.3)] whitespace-normal"
          data-testid="bleed-bounded-dynamic-max-sl-badge"
        >
          [ 🛡️ BLEED-BOUNDED BY DYNAMIC MAX SL ($200 CAP) ]
        </span>
      </div>
      <p className={`mt-1 font-data text-[11px] font-medium tabular-nums ${theme.accentText} opacity-80`}>
        Protection: {interceptPct.toFixed(1)}% Intercepted · Jitter: {jitterLabel}
      </p>
      <p className="mt-1 font-data text-[10px] text-zinc-400">
        Includes +0.5 bps Dynamic Fee Rebate via EIP-712 Session Adapter
      </p>
    </div>
  );
}
