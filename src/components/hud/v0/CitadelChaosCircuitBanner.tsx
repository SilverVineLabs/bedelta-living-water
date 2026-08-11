import type { ReactNode } from "react";
import {
  CITADEL_CIRCUIT_BREAKER_BANNER,
  isCitadelChaosHardLocked,
  type CitadelChaosMode,
} from "../citadel-chaos-store";

export interface CitadelChaosCircuitBannerProps {
  mode: CitadelChaosMode | null;
}

export function CitadelChaosCircuitBanner({ mode }: CitadelChaosCircuitBannerProps): ReactNode {
  if (!isCitadelChaosHardLocked(mode)) return null;
  return (
    <p
      className="rounded border border-red-500/50 bg-red-950/40 px-3 py-2 font-mono text-[10px] font-semibold text-red-300"
      data-testid="citadel-chaos-circuit-breaker-banner"
    >
      {CITADEL_CIRCUIT_BREAKER_BANNER}
    </p>
  );
}
