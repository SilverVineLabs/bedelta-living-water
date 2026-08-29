import { useEffect, useState, type ReactNode } from "react";
import {
  SLIVERVINE_GATE_SEPOLIA_ADDRESS,
  verifyGateDomainSeparator,
  type GateDomainFingerprintResult,
} from "../../../services/gate-domain-fingerprint";

export interface GateDomainFingerprintBadgeProps {
  className?: string;
}

type BadgeState = "pending" | "verified" | "mismatch";

function resolveBadgeState(result: GateDomainFingerprintResult | null): BadgeState {
  if (!result) return "pending";
  return result.ok ? "verified" : "mismatch";
}

const BADGE_COPY: Record<BadgeState, string> = {
  pending: "[ ⏳ Gate Domain · Verifying… ]",
  verified: "[ 🔒 Gate Domain · EIP-712 Verified ]",
  mismatch: "[ ⚠ Gate Domain · FINGERPRINT MISMATCH ]",
};

const BADGE_CLASS: Record<BadgeState, string> = {
  pending:
    "border-amber-400/45 bg-amber-950/30 text-amber-200 shadow-[0_0_12px_rgba(251,191,36,0.2)]",
  verified:
    "border-emerald-400/55 bg-emerald-950/35 text-emerald-300 shadow-[0_0_16px_rgba(52,211,153,0.35)]",
  mismatch:
    "border-rose-400/55 bg-rose-950/35 text-rose-300 shadow-[0_0_16px_rgba(244,63,94,0.35)]",
};

/** Demo HUD badge — compares on-chain domainSeparator() vs local EIP-712 recompute (G11). */
export function GateDomainFingerprintBadge({
  className = "",
}: GateDomainFingerprintBadgeProps): ReactNode {
  const [result, setResult] = useState<GateDomainFingerprintResult | null>(null);
  const state = resolveBadgeState(result);

  useEffect(() => {
    let cancelled = false;
    void verifyGateDomainSeparator({
      gateAddress: SLIVERVINE_GATE_SEPOLIA_ADDRESS,
    }).then((verdict) => {
      if (!cancelled) setResult(verdict);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <span
      className={`inline-flex items-center rounded-md border px-3 py-1.5 font-mono text-[10px] font-semibold ${BADGE_CLASS[state]} ${className}`}
      data-testid="grant-audit-gate-domain-fingerprint-badge"
      data-gate-domain-state={state}
      title={
        result
          ? `expected=${result.expected} onChain=${result.onChain ?? "null"}`
          : SLIVERVINE_GATE_SEPOLIA_ADDRESS
      }
    >
      {BADGE_COPY[state]}
    </span>
  );
}
