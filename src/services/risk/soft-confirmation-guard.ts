/** Arbitrum L2 soft confirmation drift — L2 latest vs L1-finalized batch (L2 finalized tag). */
import { fetchAllowlistedWithTimeout } from "../defense/low-latency-fetch";
import { fetchArbBlockNumberByTag } from "../adapters/arbitrum-rpc-fallback";
import { ON_CHAIN_RPC_FAIL_CLOSED_TIMEOUT_MS } from "../adapters/gmx-v2-rpc-constants";
import { fetchL1BlockNumberByTag, L1_RPC_PROVIDERS } from "../adapters/l1-rpc-fallback";
import { ARBITRUM_RPC_URL } from "./sequencer-guard";

export const SOFT_CONFIRMATION_DRIFT_MAX_BLOCKS = 12_000 as const;
export const SOFT_CONFIRMATION_PROBE_TTL_MS = 5_000 as const;
/** Zero-Trust sync gate — cache older than this is treated as unsafe. */
export const SOFT_CONFIRMATION_CACHE_MAX_AGE_MS = 30_000 as const;
export const ETH_L1_RPC_URL = L1_RPC_PROVIDERS[0];
export { L1_RPC_PROVIDERS, L1_RPC_EXTRA_HOSTS } from "../adapters/l1-rpc-fallback";

export interface SoftConfirmationProbeState {
  l2LatestBlock: number;
  l1FinalizedBatchBlock: number;
  driftBlocks: number;
  fetchedAtMs: number;
  safe: boolean;
  reason: string | null;
}

let probeCache: SoftConfirmationProbeState | null = null;

export function __resetSoftConfirmationGuardForTests(): void {
  probeCache = null;
}

export function __setSoftConfirmationProbeForTests(
  state: SoftConfirmationProbeState | null,
): void {
  probeCache = state;
}

function hexBlockNum(hex: string | undefined): number {
  if (!hex) return 0;
  const n = Number.parseInt(hex, 16);
  return Number.isFinite(n) ? n : 0;
}

export function evaluateSoftConfirmationDrift(
  l2LatestBlock: number,
  l1FinalizedBatchBlock: number,
): { driftBlocks: number; safe: boolean; reason: string | null } {
  const driftBlocks = Math.max(0, l2LatestBlock - l1FinalizedBatchBlock);
  if (driftBlocks > SOFT_CONFIRMATION_DRIFT_MAX_BLOCKS) {
    return {
      driftBlocks,
      safe: false,
      reason: `SOFT_CONFIRMATION_DRIFT_DEADLOCK:${driftBlocks}>${SOFT_CONFIRMATION_DRIFT_MAX_BLOCKS}`,
    };
  }
  return { driftBlocks, safe: true, reason: null };
}

export function isSoftConfirmationSafe(nowMs: number = Date.now()): boolean {
  if (!probeCache) return false;
  if (nowMs - probeCache.fetchedAtMs > SOFT_CONFIRMATION_CACHE_MAX_AGE_MS) return false;
  return probeCache.safe;
}

export function getSoftConfirmationUnsafeReason(nowMs: number = Date.now()): string | null {
  if (!probeCache) return "SOFT_CONFIRMATION_PROBE_MISSING";
  if (nowMs - probeCache.fetchedAtMs > SOFT_CONFIRMATION_CACHE_MAX_AGE_MS) {
    return "SOFT_CONFIRMATION_PROBE_STALE";
  }
  return probeCache.safe ? null : probeCache.reason;
}

export type SoftConfirmationTelemetryStatus = "ARMED_ACTIVE" | "FAIL_CLOSED" | "LIVE_PROBE";

export interface SoftConfirmationHealthMetrics {
  telemetryStatus: SoftConfirmationTelemetryStatus;
  ok: boolean;
  latencyMs: number;
  driftBlocks: number;
  maxDriftBlocks: number;
  status: "SAFE" | "DRIFT_DEADLOCK" | "ARMED_ACTIVE";
  fetchedAt: string | null;
}

const ARMED_SOFT_CONFIRMATION_FALLBACK: SoftConfirmationHealthMetrics = {
  telemetryStatus: "ARMED_ACTIVE",
  ok: false,
  latencyMs: 0,
  driftBlocks: 0,
  maxDriftBlocks: SOFT_CONFIRMATION_DRIFT_MAX_BLOCKS,
  status: "ARMED_ACTIVE",
  fetchedAt: null,
};

export function buildSoftConfirmationHealthMetricsOrFallback(): SoftConfirmationHealthMetrics {
  return buildSoftConfirmationHealthMetrics() ?? ARMED_SOFT_CONFIRMATION_FALLBACK;
}

export function buildSoftConfirmationHealthMetrics(): SoftConfirmationHealthMetrics | null {
  if (!probeCache) return null;
  const nowMs = Date.now();
  const ok = probeCache.safe;
  return {
    telemetryStatus: ok ? "LIVE_PROBE" : "FAIL_CLOSED",
    ok,
    latencyMs: Math.max(0, nowMs - probeCache.fetchedAtMs),
    driftBlocks: probeCache.driftBlocks,
    maxDriftBlocks: SOFT_CONFIRMATION_DRIFT_MAX_BLOCKS,
    status: ok ? "SAFE" : "DRIFT_DEADLOCK",
    fetchedAt: new Date(probeCache.fetchedAtMs).toISOString(),
  };
}

async function fetchArbBlockOrThrow(
  tag: "latest" | "finalized",
  fetchFn: typeof fetch | undefined,
): Promise<number> {
  const n = await fetchArbBlockNumberByTag(tag, { fetchFn });
  if (n === null) throw new Error("Soft confirmation RPC HTTP 429");
  return n;
}

async function fetchL1BlockOrThrow(
  tag: "latest" | "finalized",
  fetchFn: typeof fetch | undefined,
): Promise<number> {
  const n = await fetchL1BlockNumberByTag(tag, fetchFn);
  if (n === null) throw new Error("Soft confirmation L1 RPC HTTP 429");
  return n;
}

async function fetchBlockNumberByTag(
  rpcUrl: string,
  tag: "latest" | "finalized",
  fetchFn: typeof fetch | undefined,
  extraHosts?: readonly string[],
): Promise<number> {
  const body =
    tag === "latest"
      ? { jsonrpc: "2.0", id: tag, method: "eth_blockNumber", params: [] }
      : {
          jsonrpc: "2.0",
          id: tag,
          method: "eth_getBlockByNumber",
          params: [tag, false],
        };
  const init = {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  } as RequestInit;
  const res = extraHosts
    ? fetchFn
      ? await fetchFn(rpcUrl, init)
      : await fetchAllowlistedWithTimeout(rpcUrl, init, extraHosts, ON_CHAIN_RPC_FAIL_CLOSED_TIMEOUT_MS)
    : fetchFn
      ? await fetchFn(rpcUrl, init)
      : await fetchAllowlistedWithTimeout(rpcUrl, init, [], ON_CHAIN_RPC_FAIL_CLOSED_TIMEOUT_MS);
  if (!res.ok) throw new Error(`Soft confirmation RPC HTTP ${res.status}`);
  const json = (await res.json()) as { result?: string | { number?: string } };
  if (typeof json.result === "string") return hexBlockNum(json.result);
  return hexBlockNum((json.result as { number?: string } | undefined)?.number);
}

export async function refreshSoftConfirmationGuard(
  options: {
    fetchFn?: typeof fetch;
    arbitrumRpcUrl?: string;
    l1RpcUrl?: string;
    now?: () => number;
  } = {},
): Promise<SoftConfirmationProbeState> {
  const nowMs = options.now?.() ?? Date.now();
  if (probeCache && nowMs - probeCache.fetchedAtMs < SOFT_CONFIRMATION_PROBE_TTL_MS) {
    return probeCache;
  }
  const arbRpc = options.arbitrumRpcUrl ?? ARBITRUM_RPC_URL;
  try {
    const [l2LatestBlock, l2FinalizedBlock, l1FinalizedBlock] = await Promise.all([
      options.arbitrumRpcUrl
        ? fetchBlockNumberByTag(arbRpc, "latest", options.fetchFn)
        : fetchArbBlockOrThrow("latest", options.fetchFn),
      options.arbitrumRpcUrl
        ? fetchBlockNumberByTag(arbRpc, "finalized", options.fetchFn)
        : fetchArbBlockOrThrow("finalized", options.fetchFn),
      fetchL1BlockOrThrow("finalized", options.fetchFn),
    ]);
    const l1FinalizedBatchBlock = l2FinalizedBlock > 0 ? l2FinalizedBlock : l1FinalizedBlock;
    const verdict = evaluateSoftConfirmationDrift(l2LatestBlock, l1FinalizedBatchBlock);
    probeCache = {
      l2LatestBlock,
      l1FinalizedBatchBlock,
      driftBlocks: verdict.driftBlocks,
      fetchedAtMs: nowMs,
      safe: verdict.safe,
      reason: verdict.reason,
    };
    return probeCache;
  } catch (err) {
    if (
      probeCache &&
      nowMs - probeCache.fetchedAtMs <= SOFT_CONFIRMATION_CACHE_MAX_AGE_MS
    ) {
      return probeCache;
    }
    probeCache = {
      l2LatestBlock: 0,
      l1FinalizedBatchBlock: 0,
      driftBlocks: SOFT_CONFIRMATION_DRIFT_MAX_BLOCKS + 1,
      fetchedAtMs: nowMs,
      safe: false,
      reason: `SOFT_CONFIRMATION_RPC_FAIL:${err instanceof Error ? err.message : String(err)}`,
    };
    return probeCache;
  }
}
