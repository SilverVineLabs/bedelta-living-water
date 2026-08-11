/**
 * Arbitrum Sequencer Uptime — Chainlink feed guard (Workers-safe eth_call).
 */

import { fetchArbitrumRpc } from "../adapters/arbitrum-rpc-fallback";
import { GMX_RPC_EXTRA_HOSTS } from "../adapters/gmx-v2-rpc-constants";

export const ARBITRUM_SEQUENCER_UPTIME_FEED =
  "0xFdB631F5EE196F0ed6FAa767959853A9F217697D" as const;
export const ARBITRUM_RPC_URL = "https://arb1.arbitrum.io/rpc" as const;
export const SEQUENCER_GRACE_SEC = 600 as const;
export const SEQUENCER_PROBE_TTL_MS = 5_000 as const;
/** Zero-Trust sync gate — cache older than this is treated as unsafe. */
export const SEQUENCER_GUARD_CACHE_MAX_AGE_MS = 30_000 as const;
const LATEST_ROUND_DATA_SELECTOR = "0xfeaf968c";

export interface SequencerProbeState {
  answer: number;
  startedAtSec: number;
  updatedAtSec: number;
  fetchedAtMs: number;
  safe: boolean;
  reason: string | null;
}

let probeCache: SequencerProbeState | null = null;

export function __resetSequencerGuardCacheForTests(): void {
  probeCache = null;
}

export function __setSequencerProbeForTests(state: SequencerProbeState | null): void {
  probeCache = state;
}

function decodeLatestRoundData(hex: string): {
  answer: number;
  startedAtSec: number;
  updatedAtSec: number;
} {
  const raw = hex.startsWith("0x") ? hex.slice(2) : hex;
  if (raw.length < 256) {
    return { answer: 1, startedAtSec: 0, updatedAtSec: 0 };
  }
  const answer = Number(BigInt(`0x${raw.slice(64, 128)}`));
  const startedAtSec = Number(BigInt(`0x${raw.slice(128, 192)}`));
  const updatedAtSec = Number(BigInt(`0x${raw.slice(192, 256)}`));
  return { answer, startedAtSec, updatedAtSec };
}

export function evaluateSequencerProbe(
  answer: number,
  startedAtSec: number,
  nowSec: number = Math.floor(Date.now() / 1000),
): { safe: boolean; reason: string | null } {
  if (answer !== 0) {
    return { safe: false, reason: "ARBITRUM_SEQUENCER_DOWN" };
  }
  const elapsed = nowSec - startedAtSec;
  if (startedAtSec > 0 && elapsed < SEQUENCER_GRACE_SEC) {
    return {
      safe: false,
      reason: `ARBITRUM_SEQUENCER_GRACE:${elapsed}s<${SEQUENCER_GRACE_SEC}s`,
    };
  }
  return { safe: true, reason: null };
}

/** Sync gate — Zero-Trust fail-closed: missing, stale, or RPC-failed probes block execution. */
export function isSequencerSafe(nowMs: number = Date.now()): boolean {
  if (!probeCache) return false;
  if (nowMs - probeCache.fetchedAtMs > SEQUENCER_GUARD_CACHE_MAX_AGE_MS) return false;
  return probeCache.safe;
}

export function getSequencerUnsafeReason(nowMs: number = Date.now()): string | null {
  if (!probeCache) return "ARBITRUM_SEQUENCER_PROBE_MISSING";
  if (nowMs - probeCache.fetchedAtMs > SEQUENCER_GUARD_CACHE_MAX_AGE_MS) {
    return "ARBITRUM_SEQUENCER_PROBE_STALE";
  }
  return probeCache.safe ? null : probeCache.reason;
}

export type SequencerTelemetryStatus = "ARMED_ACTIVE" | "FAIL_CLOSED" | "LIVE_PROBE";

export interface SequencerHealthMetrics {
  telemetryStatus: SequencerTelemetryStatus;
  ok: boolean;
  latencyMs: number;
  uptimeSafe: boolean;
  gracePeriodSec: number;
  graceElapsedSec: number | null;
  status: "UP" | "DOWN" | "GRACE" | "UNKNOWN" | "ARMED_ACTIVE";
  fetchedAt: string | null;
}

const ARMED_SEQUENCER_FALLBACK: SequencerHealthMetrics = {
  telemetryStatus: "ARMED_ACTIVE",
  ok: false,
  latencyMs: 0,
  uptimeSafe: false,
  gracePeriodSec: SEQUENCER_GRACE_SEC,
  graceElapsedSec: null,
  status: "ARMED_ACTIVE",
  fetchedAt: null,
};

export function buildSequencerHealthMetricsOrFallback(): SequencerHealthMetrics {
  return buildSequencerHealthMetrics() ?? ARMED_SEQUENCER_FALLBACK;
}

export function buildSequencerHealthMetrics(): SequencerHealthMetrics | null {
  if (!probeCache) return null;
  const nowMs = Date.now();
  const nowSec = Math.floor(nowMs / 1000);
  const graceElapsedSec =
    probeCache.startedAtSec > 0 ? Math.max(0, nowSec - probeCache.startedAtSec) : null;
  let status: SequencerHealthMetrics["status"] = "UNKNOWN";
  if (probeCache.answer !== 0) status = "DOWN";
  else if (graceElapsedSec !== null && graceElapsedSec < SEQUENCER_GRACE_SEC) status = "GRACE";
  else status = "UP";
  const ok = probeCache.safe && status === "UP";
  const telemetryStatus: SequencerTelemetryStatus = ok ? "LIVE_PROBE" : "FAIL_CLOSED";
  return {
    telemetryStatus,
    ok,
    latencyMs: Math.max(0, nowMs - probeCache.fetchedAtMs),
    uptimeSafe: probeCache.safe,
    gracePeriodSec: SEQUENCER_GRACE_SEC,
    graceElapsedSec,
    status,
    fetchedAt: new Date(probeCache.fetchedAtMs).toISOString(),
  };
}

export async function refreshSequencerGuard(options: {
  fetchFn?: typeof fetch;
  rpcUrl?: string;
  now?: () => number;
} = {}): Promise<SequencerProbeState> {
  const nowMs = options.now?.() ?? Date.now();
  if (probeCache && nowMs - probeCache.fetchedAtMs < SEQUENCER_PROBE_TTL_MS) {
    return probeCache;
  }
  const init = {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: 1,
      method: "eth_call",
      params: [
        { to: ARBITRUM_SEQUENCER_UPTIME_FEED, data: LATEST_ROUND_DATA_SELECTOR },
        "latest",
      ],
    }),
  } as RequestInit;
  try {
    const res = await fetchArbitrumRpc(init, {
      fetchFn: options.fetchFn,
      preferredRpc: options.rpcUrl,
      extraHosts: [...GMX_RPC_EXTRA_HOSTS],
    });
    if (!res) {
      if (probeCache) return probeCache;
      probeCache = {
        answer: 1,
        startedAtSec: 0,
        updatedAtSec: 0,
        fetchedAtMs: nowMs,
        safe: false,
        reason: "ARBITRUM_SEQUENCER_RPC_FAIL:ALL_PROVIDERS_EXHAUSTED",
      };
      return probeCache;
    }
    const json = (await res.json()) as { result?: string; error?: { message?: string } };
    if (json.error) {
      probeCache = {
        answer: 1,
        startedAtSec: 0,
        updatedAtSec: 0,
        fetchedAtMs: nowMs,
        safe: false,
        reason: `ARBITRUM_SEQUENCER_RPC_FAIL:${json.error.message ?? "RPC_ERROR"}`,
      };
      return probeCache;
    }
    const decoded = decodeLatestRoundData(json.result ?? "0x");
    const verdict = evaluateSequencerProbe(
      decoded.answer,
      decoded.startedAtSec,
      Math.floor(nowMs / 1000),
    );
    probeCache = {
      answer: decoded.answer,
      startedAtSec: decoded.startedAtSec,
      updatedAtSec: decoded.updatedAtSec,
      fetchedAtMs: nowMs,
      safe: verdict.safe,
      reason: verdict.reason,
    };
    return probeCache;
  } catch (err) {
    if (probeCache) return probeCache;
    probeCache = {
      answer: 1,
      startedAtSec: 0,
      updatedAtSec: 0,
      fetchedAtMs: nowMs,
      safe: false,
      reason: `ARBITRUM_SEQUENCER_RPC_FAIL:${err instanceof Error ? err.message : String(err)}`,
    };
    return probeCache;
  }
}
