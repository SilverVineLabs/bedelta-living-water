/** Shared SWR hook for Grant Audit Citadel panels. */
import { useEffect, useState, useSyncExternalStore } from "react";
import useSWR from "swr";
import { GAS_SURCHARGE_YIELD_RATIO, ORACLE_LAG_DEADLOCK_MS } from "../../services/risk/arbitrum-gas-guard";
import type { SequencerHealthMetrics } from "../../services/risk/sequencer-guard";
import {
  applyCitadelChaosOverlay,
  getCitadelChaosMode,
  subscribeCitadelChaos,
} from "./citadel-chaos-store";
import {
  fetchGrantAuditWithCache,
  getGrantAuditClientCache,
  type GrantAuditClientPayload,
} from "./grant-audit-fetch";

const DEFAULT_AUDIT = "/api/grant-audit";
export const GRANT_AUDIT_CURL =
  "curl bedeltawater.slivervine.xyz/api/grant-audit | jq .arbitrumCitadel" as const;
export const GAS_CAP_PCT = GAS_SURCHARGE_YIELD_RATIO * 100;

export const seqStatusClass = (
  s: SequencerHealthMetrics["status"],
  chaosDown: boolean,
): string =>
  chaosDown || s === "DOWN"
    ? "border-rose-400/40 text-rose-200"
    : s === "UP"
      ? "border-[#2d42fc]/40 text-[#e2e8f0]"
      : s === "GRACE"
        ? "border-amber-400/40 text-amber-200"
        : "border-[#1d2842] text-[#94a3b8]";

export function useArbitrumCitadelAudit(auditPath = DEFAULT_AUDIT) {
  const chaosMode = useSyncExternalStore(subscribeCitadelChaos, getCitadelChaosMode, getCitadelChaosMode);
  const [pollSeq, setPollSeq] = useState(0);
  const { data, error, isLoading } = useSWR<GrantAuditClientPayload>(
    auditPath,
    fetchGrantAuditWithCache,
    { refreshInterval: 2000, revalidateOnFocus: true },
  );
  useEffect(() => {
    if (data) setPollSeq((n) => n + 1);
  }, [data]);

  const cached = getGrantAuditClientCache();
  const resolved = data ?? cached;
  const view = applyCitadelChaosOverlay(resolved ?? {});
  const c = view.arbitrumCitadel;
  const hl = view.hlTelemetry ?? resolved?.hlTelemetry;
  const seq = view.sequencerHealth ?? c?.sequencerHealth;
  const gas = view.l1GasSurcharge ?? c?.l1GasSurcharge;
  const lagMs = gas?.oracleLagMs ?? c?.oracleLagMs;
  const lagTrip = gas?.oracleLagDeadlock ?? c?.oracleLagDeadlock;
  const seqStatus = seq?.status ?? "UNKNOWN";
  const chaosSeq = chaosMode === "sequencer_down";
  const chaosLag = chaosMode === "oracle_lag_deadlock";
  const graceLeft =
    seqStatus === "GRACE" && seq?.gracePeriodSec != null && seq.graceElapsedSec != null
      ? Math.max(0, seq.gracePeriodSec - seq.graceElapsedSec)
      : null;
  const gasPct = gas?.surchargeBps != null ? gas.surchargeBps / 100 : null;
  const gasFill = gasPct != null ? Math.min(100, (gasPct / GAS_CAP_PCT) * 100) : 0;
  const lagPct = lagMs != null ? Math.min(100, (lagMs / ORACLE_LAG_DEADLOCK_MS) * 100) : 0;
  const lagHot = chaosLag || lagTrip === true || (lagMs ?? 0) > ORACLE_LAG_DEADLOCK_MS;
  const balOn = c?.isGmxBalancerQualified === true;
  const showUnavailable = Boolean(error && !resolved && !chaosMode && !c?.gmxSwrIsCached);

  return {
    auditPath,
    chaosMode,
    pollSeq,
    error,
    isLoading,
    c,
    hl,
    seq,
    gas,
    lagMs,
    chaosSeq,
    chaosLag,
    graceLeft,
    gasPct,
    gasFill,
    lagPct,
    lagHot,
    balOn,
    showUnavailable,
    resolved,
  };
}
