import type { ReactNode } from "react";

export function Eip712SignGuidanceBanner(): ReactNode {
  return (
    <p
      className="mb-2 rounded border border-sky-500/50 bg-sky-950/40 px-2 py-1.5 text-center font-mono text-[11px] font-semibold leading-relaxed text-sky-200 shadow-[0_0_12px_rgba(56,189,248,0.2)]"
      data-testid="eip712-sign-guidance-banner"
      role="status"
    >
      [ 🛡️ EIP-712 SIGNATURE GUIDANCE ] Scope: L2 Trading Only | Master Withdrawal:
      DISABLED | Max Cap: $5,000
    </p>
  );
}
