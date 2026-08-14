/** @module ZeroDevAA — Opt-in CLI/SDK Citadel Risk Gate (Not mounted on Worker hot path) */

import { checkSoilResistance, RiskLimitExceeded } from "../../../services/risk-control";
import type { SoilResistanceInput } from "../../../services/risk-control-lib/soil-resistance";
import {
  evaluateSponsoredGasLimits,
  getGasLedgerSnapshot,
  loadGasLedgerFromKv,
  MAX_GAS_COST_PER_USEROP_USD,
  type GasLedgerSnapshot,
} from "./zerodev-aa-gas-ledger";
import {
  evaluateArbitrumOneHealth,
  resolveAaProbeRoute,
  resolveAaProbeRouteAsync,
  type AaProbeRouteDecision,
  type ZeroDevChainHealthStatus,
} from "./zerodev-aa-failover";
import {
  evaluateStaticBreakerMatrix,
  tripStaticCircuitBreaker,
  ZERODEV_GAS_LIMIT_EXCEEDED_TRIP,
} from "./zerodev-aa-static-breaker";

export {
  ARBITRUM_ONE_RPC_FAILOVER_LATENCY_MS,
  canProceedAaProbeRoute,
  evaluateArbitrumOneHealth,
  resolveAaProbeRoute,
  resolveAaProbeRouteAsync,
  ZERO_DEV_FAILOVER_CHAIN_ORDER,
  type AaProbeRouteDecision,
  type ZeroDevChainHealthStatus,
} from "./zerodev-aa-failover";

export {
  DAILY_SPONSORSHIP_LIMIT_USD as dailySponsorshipLimitUSD,
  MAX_GAS_COST_PER_USEROP_USD as maxGasCostPerUserOpUSD,
} from "./zerodev-aa-gas-ledger";

export { TRIP_SOIL_RESISTANCE, ZERODEV_GAS_LIMIT_EXCEEDED_TRIP } from "./zerodev-aa-static-breaker";

function throwGasLimitExceededTrip(estimatedGasCostUsd: number): never {
  throw new RiskLimitExceeded(
    `${ZERODEV_GAS_LIMIT_EXCEEDED_TRIP}:${estimatedGasCostUsd.toFixed(4)}>${MAX_GAS_COST_PER_USEROP_USD}`,
    {
      level: "warn",
      module: "risk-control",
      event: "ROOT_PROTECTION_TRIP",
      symbol: "AA",
      timestamp: new Date().toISOString(),
      message: ZERODEV_GAS_LIMIT_EXCEEDED_TRIP,
      details: {
        estimatedGasCostUsd,
        maxGasCostPerUserOpUsd: MAX_GAS_COST_PER_USEROP_USD,
        gate: "zerodev-aa",
      },
    },
  );
}

function readEnv(env?: Record<string, string>): Record<string, string> {
  if (env) return env;
  return typeof process !== "undefined" ? (process.env as Record<string, string>) : {};
}

/** Feature flag — default off; v0.8 Citadel hot path unchanged when false. */
export function isZeroDevAAEnabled(env?: Record<string, string>): boolean {
  return readEnv(env).USE_ZERODEV_AA === "true";
}

export interface CitadelRiskGateInput extends SoilResistanceInput {
  estimatedGasCostUsd?: number;
  requestedSponsorship?: boolean;
  atMs?: number;
  kv?: KVNamespace;
}

export interface CitadelRiskGateResult {
  sponsored: boolean;
  gasGuardReason?: string;
  dailySpentUsd: number;
  chainHealth?: ZeroDevChainHealthStatus;
  aaProbeRoute?: AaProbeRouteDecision;
}

export function evaluateZeroDevGasGuards(input: {
  estimatedGasCostUsd?: number;
  requestedSponsorship?: boolean;
  snapshot?: GasLedgerSnapshot;
  nowMs?: number;
}): CitadelRiskGateResult {
  const nowMs = input.nowMs ?? Date.now();
  const snapshot = input.snapshot ?? getGasLedgerSnapshot(nowMs);
  const gas = evaluateSponsoredGasLimits({
    estimatedGasCostUsd: input.estimatedGasCostUsd,
    requestedSponsorship: input.requestedSponsorship,
    snapshot,
    nowMs,
  });
  if (gas.perUserOp.exceeded && gas.perUserOp.estimatedGasCostUsd !== undefined) {
    throwGasLimitExceededTrip(gas.perUserOp.estimatedGasCostUsd);
  }
  return {
    sponsored: gas.sponsored,
    gasGuardReason: gas.gasGuardReason,
    dailySpentUsd: gas.dailySpentUsd,
  };
}

/**
 * Static circuit breaker — pure matrix evaluation, fail-fast trip, then telemetry enrich.
 * Gas soft-limits: per-UserOp hard reject ($0.50); daily sponsorship fallback ($10/24h).
 */
export function assertCitadelRiskGate(input: CitadelRiskGateInput): CitadelRiskGateResult {
  const nowMs = input.atMs ?? (input.at ? input.at.getTime() : Date.now());
  const matrix = evaluateStaticBreakerMatrix({
    soil: input,
    estimatedGasCostUsd: input.estimatedGasCostUsd,
    requestedSponsorship: input.requestedSponsorship,
    snapshot: getGasLedgerSnapshot(nowMs),
    nowMs,
  });
  tripStaticCircuitBreaker(matrix, input.symbol);

  return {
    sponsored: matrix.sponsored,
    gasGuardReason: matrix.gasGuardReason,
    dailySpentUsd: matrix.dailySpentUsd,
    chainHealth: evaluateArbitrumOneHealth(nowMs),
    aaProbeRoute: resolveAaProbeRoute(undefined, nowMs),
  };
}

/** KV-backed gate path — ledger load, then static breaker (same fail-fast semantics). */
export async function assertCitadelRiskGateAsync(
  input: CitadelRiskGateInput,
): Promise<CitadelRiskGateResult> {
  const nowMs = input.atMs ?? (input.at ? input.at.getTime() : Date.now());
  const snapshot = input.kv ? await loadGasLedgerFromKv(input.kv, nowMs) : getGasLedgerSnapshot(nowMs);
  const matrix = evaluateStaticBreakerMatrix({
    soil: input,
    estimatedGasCostUsd: input.estimatedGasCostUsd,
    requestedSponsorship: input.requestedSponsorship,
    snapshot,
    nowMs,
  });
  tripStaticCircuitBreaker(matrix, input.symbol);

  const aaProbeRoute = await resolveAaProbeRouteAsync(undefined, nowMs);
  return {
    sponsored: matrix.sponsored,
    gasGuardReason: matrix.gasGuardReason,
    dailySpentUsd: matrix.dailySpentUsd,
    chainHealth: aaProbeRoute.health,
    aaProbeRoute,
  };
}

export const AA_GATEWAY_SECURED_LABEL =
  "[AA GATEWAY: ZERO-FEE SECURED | CITADEL FAIL-CLOSED]" as const;
export const AA_GATEWAY_DISABLED_LABEL = "[AA GATEWAY: DISABLED / V0.8 FALLBACK]" as const;

export interface ZeroDevAaGatewayBadgeStatus {
  enabled: boolean;
  gatePass: boolean;
  secured: boolean;
  label: typeof AA_GATEWAY_SECURED_LABEL | typeof AA_GATEWAY_DISABLED_LABEL;
}

/** HUD badge resolver — mirrors soil leg of static breaker without throwing. */
export function evaluateZeroDevAaGatewayBadge(
  soil: SoilResistanceInput,
  env?: Record<string, string>,
): ZeroDevAaGatewayBadgeStatus {
  const enabled = isZeroDevAAEnabled(env);
  if (!enabled) {
    return { enabled: false, gatePass: false, secured: false, label: AA_GATEWAY_DISABLED_LABEL };
  }
  const gatePass = !checkSoilResistance(soil).tripped;
  return {
    enabled: true,
    gatePass,
    secured: gatePass,
    label: gatePass ? AA_GATEWAY_SECURED_LABEL : AA_GATEWAY_DISABLED_LABEL,
  };
}
