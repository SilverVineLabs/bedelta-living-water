import type { OperatorUnlockVersion } from "../../../v2/admin/operator-matrix";
import type { ReactNode } from "react";

export interface MevAttackBannerProps {
  visible: boolean;
  protocolVersion: OperatorUnlockVersion;
  inline?: boolean;
}

const MEV_ATTACK_BANNER_TEXT: Record<OperatorUnlockVersion, string> = {
  "v0.8": "🚨 [MEV ATTACK ACTIVE]: 15.0 bps Toxicity Injected -> Unprotected (v0.8 GMX Blue Shield)",
  "v1.0": "🚨 [MEV ATTACK ACTIVE]: 15.0 bps Toxicity Injected -> Partial Intercept (v1.0 Circuit Breaker)",
  "v1.5": "🚨 [MEV ATTACK ACTIVE]: 15.0 bps Toxicity Injected -> 100% Intercepted by UM-03 Bitwise Invert",
};

export function MevAttackBanner({
  visible,
  protocolVersion,
  inline = false,
}: MevAttackBannerProps): ReactNode {
  if (!visible) return null;

  return (
    <p
      className={
        inline
          ? "animate-pulse rounded border border-amber-500/80 bg-amber-950/80 px-2 py-0.5 font-mono text-xs font-semibold text-amber-200"
          : "animate-mev-attack-banner mb-2 rounded border border-amber-400/70 bg-amber-950/60 px-2 py-1.5 font-data text-[10px] font-semibold leading-snug text-amber-100 shadow-[0_0_22px_rgba(251,191,36,0.45)]"
      }
      data-testid="mev-attack-banner"
      role="status"
    >
      {MEV_ATTACK_BANNER_TEXT[protocolVersion]}
    </p>
  );
}
