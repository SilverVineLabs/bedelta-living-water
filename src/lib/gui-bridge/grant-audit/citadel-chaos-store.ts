/** Local Citadel chaos overlay — injects grant-audit failure modes without page refresh. */
import { useSyncExternalStore } from "react";
import { ORACLE_LAG_DEADLOCK_MS } from "../../../services/risk/arbitrum-gas-guard";
import { SEQUENCER_GRACE_SEC } from "../../../services/risk/sequencer-guard";
import type { ArbitrumCitadelRiskMetrics } from "../../../routes/grant-audit-lib/grant-audit-citadel-metrics";
import type { SequencerHealthMetrics } from "../../../services/risk/sequencer-guard";

export type CitadelChaosMode = "sequencer_down" | "oracle_lag_deadlock";

export type CitadelAuditView = {
  arbitrumCitadel?: ArbitrumCitadelRiskMetrics;
  sequencerHealth?: SequencerHealthMetrics | null;
  l1GasSurcharge?: ArbitrumCitadelRiskMetrics["l1GasSurcharge"];
};

let activeMode: CitadelChaosMode | null = null;
const listeners = new Set<() => void>();

export function getCitadelChaosMode(): CitadelChaosMode | null {
  return activeMode;
}

export function setCitadelChaosMode(mode: CitadelChaosMode | null): void {
  activeMode = mode;
  listeners.forEach((l) => l());
}

export function toggleCitadelChaosMode(mode: CitadelChaosMode): void {
  setCitadelChaosMode(activeMode === mode ? null : mode);
}

export function subscribeCitadelChaos(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function applyCitadelChaosOverlay<T extends CitadelAuditView>(data: T): T {
  if (!activeMode) return data;
  const now = new Date().toISOString();
  if (activeMode === "sequencer_down") {
    const seq: SequencerHealthMetrics = {
      telemetryStatus: "FAIL_CLOSED",
      ok: false,
      latencyMs: 0,
      uptimeSafe: false,
      gracePeriodSec: SEQUENCER_GRACE_SEC,
      graceElapsedSec: null,
      status: "DOWN",
      fetchedAt: now,
    };
    return {
      ...data,
      sequencerHealth: seq,
      arbitrumCitadel: data.arbitrumCitadel
        ? { ...data.arbitrumCitadel, sequencerHealth: seq }
        : ({ sequencerHealth: seq } as ArbitrumCitadelRiskMetrics),
    };
  }
  const lagMs = ORACLE_LAG_DEADLOCK_MS + 500;
  const gas = {
    surchargeBps: data.l1GasSurcharge?.surchargeBps ?? 0,
    l1BaseFeeGwei: data.l1GasSurcharge?.l1BaseFeeGwei ?? 0,
    blocked: true,
    fetchedAt: now,
    oracleLagMs: lagMs,
    oracleLagDeadlock: true,
  };
  return {
    ...data,
    l1GasSurcharge: gas,
    arbitrumCitadel: data.arbitrumCitadel
      ? { ...data.arbitrumCitadel, oracleLagMs: lagMs, oracleLagDeadlock: true }
      : ({ oracleLagMs: lagMs, oracleLagDeadlock: true } as ArbitrumCitadelRiskMetrics),
  };
}

export const CITADEL_CHAOS_LABEL: Record<CitadelChaosMode, string> = {
  sequencer_down: "SEQUENCER_DOWN",
  oracle_lag_deadlock: "ORACLE_LAG_DEADLOCK",
};

export const CITADEL_CIRCUIT_BREAKER_BANNER =
  "[ 🔴 CIRCUIT BREAKER ARMED: tradeAllowed = FALSE ]" as const;

export const CITADEL_CHAOS_OPERATOR_LOCK = "[ FAIL-CLOSED HARD-LOCKED ]" as const;

export const CITADEL_EIP712_SESSION_ACTIVE =
  "[ 🔑 EIP-712 HARDWARE-ISOLATED SESSION ACTIVE - $5,000 CAP ]" as const;

export const CITADEL_EIP712_SESSION_PAUSED =
  "[ 🔒 EIP-712 SESSION PAUSED BY CIRCUIT BREAKER (rootProtection: ARMED) ]" as const;

export function isCitadelChaosHardLocked(mode: CitadelChaosMode | null): mode is CitadelChaosMode {
  return mode === "sequencer_down" || mode === "oracle_lag_deadlock";
}

export function useCitadelChaosStore(): CitadelChaosMode | null {
  return useSyncExternalStore(subscribeCitadelChaos, getCitadelChaosMode, getCitadelChaosMode);
}
