/** Grant audit — refresh Arbitrum guards when probe cache is missing or stale. */
import type { Env } from "../../env";
import { raceProbeWithTimeout } from "../../services/defense/low-latency-fetch";
import { refreshDualWalletTelemetry, type DualWalletEnv } from "../../services/dual-wallet-telemetry";
import { runHlAutoHedgeForGmxGm } from "../../services/hl-auto-hedge";
import { refreshGmxGmTelemetry } from "../../services/yield/gmx-v2-gm-telemetry";
import {
  buildArbitrumGasGuardMetrics,
  buildArbitrumGasGuardMetricsOrFallback,
  refreshArbitrumGasGuard,
} from "../../services/risk/arbitrum-gas-guard";
import {
  getArbitrumStatusSentinelSnapshot,
  refreshArbitrumStatusSentinel,
  STATUS_SENTINEL_CACHE_MAX_AGE_MS,
} from "../../services/adapters/arbitrum-status-sentinel";
import {
  getRpcRadarSnapshot,
  refreshRpcRadar,
  RPC_RADAR_CACHE_MAX_AGE_MS,
} from "../../services/adapters/rpc-radar";
import {
  buildSequencerHealthMetrics,
  refreshSequencerGuard,
  SEQUENCER_GUARD_CACHE_MAX_AGE_MS,
} from "../../services/risk/sequencer-guard";

function probeAgeMs(fetchedAt: string | null | undefined, nowMs: number): number | null {
  if (!fetchedAt) return null;
  const ts = Date.parse(fetchedAt);
  return Number.isFinite(ts) ? nowMs - ts : null;
}

function isProbeStale(fetchedAt: string | null | undefined, nowMs: number): boolean {
  const age = probeAgeMs(fetchedAt, nowMs);
  return age === null || age > SEQUENCER_GUARD_CACHE_MAX_AGE_MS;
}

export function needsSequencerGuardRefresh(nowMs: number = Date.now()): boolean {
  const health = buildSequencerHealthMetrics();
  return !health || isProbeStale(health.fetchedAt, nowMs);
}

export function needsArbitrumGasGuardRefresh(nowMs: number = Date.now()): boolean {
  const metrics = buildArbitrumGasGuardMetricsOrFallback();
  return isProbeStale(metrics.fetchedAt, nowMs);
}

export function needsArbitrumStatusSentinelRefresh(nowMs: number = Date.now()): boolean {
  const snapshot = getArbitrumStatusSentinelSnapshot();
  if (!snapshot) return true;
  return nowMs - snapshot.fetchedAtMs > STATUS_SENTINEL_CACHE_MAX_AGE_MS;
}

export function needsRpcRadarRefresh(nowMs: number = Date.now()): boolean {
  const snapshot = getRpcRadarSnapshot();
  if (!snapshot) return true;
  return nowMs - snapshot.fetchedAtMs > RPC_RADAR_CACHE_MAX_AGE_MS;
}

/** Oracle lag snapshot for grant-audit l1GasSurcharge / arbitrumCitadel blocks. */
export function readGrantAuditOracleLagFields(): {
  oracleLagMs: number | null;
  oracleLagDeadlock: boolean | null;
  rpcFail: boolean;
} {
  const metrics = buildArbitrumGasGuardMetrics();
  if (!metrics) return { oracleLagMs: null, oracleLagDeadlock: null, rpcFail: false };
  const rpcFail =
    metrics.status === "FAIL_CLOSED" &&
    (metrics.reason?.includes("ARBITRUM_GAS_GUARD_RPC_FAIL") ?? false);
  return {
    oracleLagMs: metrics.oracleLagMs,
    oracleLagDeadlock: metrics.oracleLagDeadlock,
    rpcFail,
  };
}

/** Active refresh — dual-wallet TVL + GMX GM + optional HL auto-hedge for `/api/grant-audit`. */
export async function ensureGrantAuditGuardsFresh(
  env?: DualWalletEnv &
    Pick<Env, "ARB_MAINNET_USER_ADDRESS" | "ARB_MAINNET_SESSION_PK" | "IS_MAINNET">,
  nowMs: number = Date.now(),
): Promise<void> {
  const tasks: Promise<unknown>[] = [];
  if (needsSequencerGuardRefresh(nowMs)) {
    tasks.push(refreshSequencerGuard({ now: () => nowMs }));
  }
  if (needsArbitrumGasGuardRefresh(nowMs)) {
    tasks.push(refreshArbitrumGasGuard({ now: () => nowMs }));
  }
  if (needsArbitrumStatusSentinelRefresh(nowMs)) {
    tasks.push(refreshArbitrumStatusSentinel({ now: () => nowMs }));
  }
  if (needsRpcRadarRefresh(nowMs)) {
    tasks.push(refreshRpcRadar({ now: () => nowMs }));
  }
  if (env) {
    tasks.push(refreshGmxGmTelemetry(env, nowMs));
    tasks.push(refreshDualWalletTelemetry(env, nowMs));
  }
  if (tasks.length > 0) {
    await Promise.allSettled(
      tasks.map((task) =>
        raceProbeWithTimeout(() => task).catch(() => undefined),
      ),
    );
  }
  if (env?.SRV_200_MAINNET_SESSION_PK?.trim()) {
    await raceProbeWithTimeout(() =>
      runHlAutoHedgeForGmxGm(env, { dryRun: env.IS_MAINNET !== "true" }),
    ).catch(() => undefined);
  }
}
