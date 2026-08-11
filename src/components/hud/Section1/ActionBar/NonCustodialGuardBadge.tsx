import type { ReactNode } from "react";
import {
  CITADEL_EIP712_SESSION_ACTIVE,
  CITADEL_EIP712_SESSION_PAUSED,
} from "../../citadel-chaos-store";
import { GLACIER_BADGE_CORE_CLASS } from "../../glacier-badge-styles";

export interface NonCustodialGuardBadgeProps {
  chaosHardLocked?: boolean;
}

export function NonCustodialGuardBadge({
  chaosHardLocked = false,
}: NonCustodialGuardBadgeProps): ReactNode {
  const label = chaosHardLocked ? CITADEL_EIP712_SESSION_PAUSED : CITADEL_EIP712_SESSION_ACTIVE;

  return (
    <div className="group/eip712 relative mb-0">
      <button
        type="button"
        data-testid="non-custodial-guard-badge"
        aria-label="EIP-712 hardware-isolated session status"
        className={[
          "flex w-full items-center justify-center gap-2 rounded px-3 py-2 text-center border-0",
          chaosHardLocked
            ? "border border-red-500/50 bg-red-950/40 font-mono text-[11px] font-semibold text-red-300 animate-pulse"
            : GLACIER_BADGE_CORE_CLASS,
        ].join(" ")}
      >
        {chaosHardLocked ? (
          <span
            className="relative inline-flex size-2 shrink-0"
            aria-hidden="true"
            data-testid="eip712-chaos-pulse-indicator"
          >
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-red-400 opacity-75" />
            <span className="relative inline-flex size-2 rounded-full bg-red-400" />
          </span>
        ) : null}
        <span data-testid="eip712-session-status-label">{label}</span>
        {!chaosHardLocked ? (
          <span
            aria-hidden="true"
            data-testid="non-custodial-guard-info-trigger"
            className="text-[16px] text-black"
          >
            ℹ️
          </span>
        ) : null}
      </button>
      {!chaosHardLocked ? (
        <div
          role="tooltip"
          data-testid="non-custodial-guard-tooltip"
          className="pointer-events-none absolute bottom-full left-1/2 z-[9999] mb-2 hidden w-80 -translate-x-1/2 rounded border border-sky-500/40 bg-zinc-950/98 p-4 shadow-[0_0_24px_rgba(56,189,248,0.25)] group-hover/eip712:block"
        >
          <p className="mb-2 font-data text-[11px] font-bold uppercase tracking-wide text-sky-200">
            🛡️ EIP-712 HARDWARE-ISOLATED SESSION AGENT
          </p>
          <ul className="space-y-1.5 font-data text-[10px] leading-relaxed text-zinc-300">
            <li>
              • Scope: L2 Trading ONLY | Master Withdrawal: 0x00 (DISABLED AT CONTRACT LEVEL)
            </li>
            <li>• Hard Cap: $5,000 USD Notional Limit | Hardware Key Isolated</li>
            <li>• Instant On-Chain Revocation via Emergency Button</li>
          </ul>
        </div>
      ) : null}
    </div>
  );
}
