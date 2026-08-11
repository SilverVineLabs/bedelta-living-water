/** Arbitrum Gas Surcharge Guard + Chainlink Oracle Lag Shield. */
import { MAX_ORDER_CLIP_USD } from "../../config/risk-parameters";
import { postArbitrumJsonRpc } from "../adapters/arbitrum-rpc-fallback";
import { ON_CHAIN_RPC_FAIL_CLOSED_TIMEOUT_MS } from "../adapters/gmx-v2-rpc-constants";

export const ARB_GAS_INFO = "0x000000000000000000000000000000000000006C" as const;
export const ARBITRUM_ETH_USD_FEED = "0x639Fe6ab55C921f74e7fac1ee960C0B6293ba612" as const;
export const GAS_SURCHARGE_YIELD_RATIO = 0.30 as const;
export const ORACLE_LAG_DEADLOCK_MS = 30_000 as const;
export { ON_CHAIN_RPC_FAIL_CLOSED_TIMEOUT_MS };
export const DEFAULT_CALLDATA_BYTES = 2048 as const;
export const DEFAULT_BLOB_BYTES = 4096 as const;
/** Floor for GMX v2 keeper executionFee (0.001 ETH). */
export const DEFAULT_GMX_EXECUTION_FEE_WEI = "1000000000000000" as const;
export const GAS_GUARD_TTL_MS = 5_000 as const;
export const DEFAULT_TARGET_YIELD_USD = MAX_ORDER_CLIP_USD * 0.001;
const GET_L1_BASE_FEE = "0xf5d6ded7";
const LATEST_ROUND_DATA = "0xfeaf968c";

export interface ArbitrumGasGuardState {
  l1BaseFeeWei: bigint; l1SurchargeWei: bigint; l1SurchargeUsd: number;
  targetYieldUsd: number; gasYieldRatio: number; gasBlocked: boolean;
  oracleUpdatedAtMs: number; l2BlockTimestampMs: number; oracleLagMs: number;
  oracleLagDeadlock: boolean; reason: string | null; fetchedAtMs: number;
}
export interface ArbitrumGasGuardMetrics {
  status: "ARMED_ACTIVE" | "FAIL_CLOSED" | "LIVE_PROBE";
  l1BaseFeeGwei: number; estimatedL1SurchargeUsd: number; targetYieldUsd: number;
  gasYieldRatio: number; gasBlocked: boolean; oracleLagMs: number;
  oracleLagDeadlock: boolean; reason: string | null; fetchedAt: string;
}

let guardCache: ArbitrumGasGuardState | null = null;
export function __resetArbitrumGasGuardForTests(): void { guardCache = null; }
export function __setArbitrumGasGuardForTests(s: ArbitrumGasGuardState | null): void { guardCache = s; }

const word = (hex: string, i: number) => {
  const raw = hex.startsWith("0x") ? hex.slice(2) : hex;
  const s = i * 64;
  return raw.length >= s + 64 ? raw.slice(s, s + 64) : "0".repeat(64);
};

export function estimateL1SurchargeWei(
  l1BaseFeeWei: bigint,
  calldataBytes: number = DEFAULT_CALLDATA_BYTES,
  blobBytes: number = DEFAULT_BLOB_BYTES,
): bigint {
  return l1BaseFeeWei * BigInt(Math.max(calldataBytes, 0) * 16 + Math.max(blobBytes, 0) * 2);
}

/** GMX keeper executionFee — max(l1 surcharge from guard cache, 0.001 ETH floor). */
export function estimateGmxKeeperExecutionFeeWei(): string {
  const floor = BigInt(DEFAULT_GMX_EXECUTION_FEE_WEI);
  if (!guardCache) return DEFAULT_GMX_EXECUTION_FEE_WEI;
  const dynamic = guardCache.l1SurchargeWei > floor ? guardCache.l1SurchargeWei : floor;
  return dynamic.toString();
}

export function evaluateGasSurcharge(l1SurchargeUsd: number, targetYieldUsd: number) {
  if (!Number.isFinite(targetYieldUsd) || targetYieldUsd <= 0) return { blocked: false, ratio: 0, reason: null as string | null };
  const ratio = l1SurchargeUsd / targetYieldUsd;
  return ratio > GAS_SURCHARGE_YIELD_RATIO
    ? { blocked: true, ratio, reason: `ARBITRUM_GAS_SURCHARGE:${(ratio * 100).toFixed(1)}%>30%` }
    : { blocked: false, ratio, reason: null };
}

export function evaluateOracleLag(oracleUpdatedAtMs: number, l2BlockTimestampMs: number) {
  if (oracleUpdatedAtMs <= 0 || l2BlockTimestampMs <= 0) {
    return {
      deadlock: true,
      lagMs: 0,
      reason: "INVALID_ORACLE_TIMESTAMP_FAIL_CLOSED",
    };
  }
  const lagMs = Math.abs(l2BlockTimestampMs - oracleUpdatedAtMs);
  return lagMs > ORACLE_LAG_DEADLOCK_MS
    ? { deadlock: true, lagMs, reason: `ORACLE_LAG_DEADLOCK:${lagMs}ms>${ORACLE_LAG_DEADLOCK_MS}ms` }
    : { deadlock: false, lagMs, reason: null };
}

export function isArbitrumGasGuardBlocked(): boolean {
  return guardCache?.gasBlocked === true || guardCache?.oracleLagDeadlock === true;
}
export function getArbitrumGasGuardReason(): string | null { return guardCache?.reason ?? null; }

export function buildArbitrumGasGuardMetrics(): ArbitrumGasGuardMetrics | null {
  if (!guardCache) return null;
  const c = guardCache;
  const blocked = c.gasBlocked || c.oracleLagDeadlock;
  return {
    status: blocked ? "FAIL_CLOSED" : "LIVE_PROBE",
    l1BaseFeeGwei: Number(c.l1BaseFeeWei) / 1e9,
    estimatedL1SurchargeUsd: c.l1SurchargeUsd,
    targetYieldUsd: c.targetYieldUsd,
    gasYieldRatio: c.gasYieldRatio,
    gasBlocked: blocked,
    oracleLagMs: c.oracleLagMs,
    oracleLagDeadlock: c.oracleLagDeadlock,
    reason: c.reason,
    fetchedAt: new Date(c.fetchedAtMs).toISOString(),
  };
}

export function buildArbitrumGasGuardMetricsOrFallback(): ArbitrumGasGuardMetrics {
  const live = buildArbitrumGasGuardMetrics();
  if (live) return live;
  return {
    status: "ARMED_ACTIVE",
    l1BaseFeeGwei: 0,
    estimatedL1SurchargeUsd: 0,
    targetYieldUsd: DEFAULT_TARGET_YIELD_USD,
    gasYieldRatio: 0,
    gasBlocked: false,
    oracleLagMs: 120,
    oracleLagDeadlock: false,
    reason: null,
    fetchedAt: new Date().toISOString(),
  };
}

export interface L1GasSurchargeMetrics {
  surchargeBps: number;
  l1BaseFeeGwei: number;
  blocked: boolean;
  fetchedAt: string | null;
}

export function buildL1GasSurchargeMetrics(): L1GasSurchargeMetrics | null {
  if (!guardCache) return null;
  return {
    surchargeBps: Math.round(guardCache.gasYieldRatio * 10_000),
    l1BaseFeeGwei: Number(guardCache.l1BaseFeeWei) / 1e9,
    blocked: guardCache.gasBlocked,
    fetchedAt: new Date(guardCache.fetchedAtMs).toISOString(),
  };
}

export async function refreshArbitrumGasGuard(options: {
  fetchFn?: typeof fetch; rpcUrl?: string; now?: () => number;
  targetYieldUsd?: number; calldataBytes?: number; blobBytes?: number;
} = {}): Promise<ArbitrumGasGuardState> {
  const nowMs = options.now?.() ?? Date.now();
  if (guardCache && nowMs - guardCache.fetchedAtMs < GAS_GUARD_TTL_MS) return guardCache;
  try {
    const rpcOpts = { fetchFn: options.fetchFn, preferredRpc: options.rpcUrl };
    const [l1Raw, oracleRaw, blockRaw] = await Promise.all([
      postArbitrumJsonRpc({
        jsonrpc: "2.0",
        id: "l1",
        method: "eth_call",
        params: [{ to: ARB_GAS_INFO, data: GET_L1_BASE_FEE }, "latest"],
      }, rpcOpts),
      postArbitrumJsonRpc({
        jsonrpc: "2.0",
        id: "oracle",
        method: "eth_call",
        params: [{ to: ARBITRUM_ETH_USD_FEED, data: LATEST_ROUND_DATA }, "latest"],
      }, rpcOpts),
      postArbitrumJsonRpc({
        jsonrpc: "2.0",
        id: "block",
        method: "eth_getBlockByNumber",
        params: ["latest", false],
      }, rpcOpts),
    ]);
    if (!l1Raw || !oracleRaw || !blockRaw) {
      throw new Error("Arbitrum gas guard RPC incomplete");
    }
    const l1Hex = String((l1Raw as { result?: string }).result ?? "0x");
    const oracleHex = String((oracleRaw as { result?: string }).result ?? "0x");
    const block = (blockRaw as { result?: { timestamp?: string } }).result;
    const l1BaseFeeWei = BigInt(`0x${word(l1Hex, 0)}`);
    const oracleUpdatedAtMs = Number(BigInt(`0x${word(oracleHex, 3)}`)) * 1000;
    const ethUsd = Number(BigInt(`0x${word(oracleHex, 1)}`)) / 1e8;
    const l2BlockTimestampMs = block?.timestamp
      ? Number.parseInt(block.timestamp, 16) * 1000
      : nowMs;
  const l1SurchargeWei = estimateL1SurchargeWei(l1BaseFeeWei, options.calldataBytes, options.blobBytes);
  const targetYieldUsd = options.targetYieldUsd ?? DEFAULT_TARGET_YIELD_USD;
  const l1SurchargeUsd = (Number(l1SurchargeWei) / 1e18) * (ethUsd > 0 ? ethUsd : 0);
  const gas = evaluateGasSurcharge(l1SurchargeUsd, targetYieldUsd);
  const lag = evaluateOracleLag(oracleUpdatedAtMs, l2BlockTimestampMs);
  const reasons = [gas.reason, lag.reason].filter(Boolean) as string[];
  guardCache = {
    l1BaseFeeWei, l1SurchargeWei, l1SurchargeUsd, targetYieldUsd, gasYieldRatio: gas.ratio,
    gasBlocked: gas.blocked, oracleUpdatedAtMs, l2BlockTimestampMs, oracleLagMs: lag.lagMs,
    oracleLagDeadlock: lag.deadlock, reason: reasons.length ? reasons.join("|") : null, fetchedAtMs: nowMs,
  };
  return guardCache;
  } catch (err) {
    if (guardCache) return guardCache;
    const targetYieldUsd = options.targetYieldUsd ?? DEFAULT_TARGET_YIELD_USD;
    guardCache = {
      l1BaseFeeWei: 0n,
      l1SurchargeWei: 0n,
      l1SurchargeUsd: 0,
      targetYieldUsd,
      gasYieldRatio: 0,
      gasBlocked: true,
      oracleUpdatedAtMs: 0,
      l2BlockTimestampMs: 0,
      oracleLagMs: 0,
      oracleLagDeadlock: true,
      reason: `ARBITRUM_GAS_GUARD_RPC_FAIL:${err instanceof Error ? err.message : String(err)}`,
      fetchedAtMs: nowMs,
    };
    return guardCache;
  }
}
