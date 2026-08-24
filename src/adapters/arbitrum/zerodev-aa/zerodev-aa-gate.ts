/** @module ZeroDevAA — Opt-in CLI/SDK Citadel Risk Gate (Not mounted on Worker hot path) */

import { checkSoilResistance } from "../../../services/risk-control";
import type { SoilResistanceInput } from "../../../services/risk-control-lib/soil-resistance";
import {
  getGasLedgerSnapshot,
  loadGasLedgerFromKv,
} from "./zerodev-aa-gas-ledger";
import {
  evaluateArbitrumOneHealth,
  resolveAaProbeRoute,
  resolveAaProbeRouteAsync,
} from "./zerodev-aa-failover";
import {
  assertCitadelRiskGate as assertGatewayCitadelRiskGate,
  evaluateGatewayRules,
  type CitadelRiskGateVerdict,
  type GatewayRulesResult,
} from "../../../core/risk-engine";
import {
  evaluateStaticBreakerMatrix,
  tripStaticCircuitBreaker,
} from "./zerodev-aa-static-breaker";
import {
  AA_GATEWAY_DISABLED_LABEL,
  AA_GATEWAY_SECURED_LABEL,
  type CitadelRiskGateInput,
  type CitadelRiskGateResult,
  type ZeroDevAaGateInput,
  type ZeroDevAaGatewayBadgeStatus,
} from "./zerodev-aa-gate-types";
import {
  assertAaDeadmanOrThrow,
  evaluateZeroDevGasGuards,
  readEnv,
  toGatewayInput,
} from "./zerodev-aa-gate-helpers";

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

export {
  AA_GATEWAY_DISABLED_LABEL,
  AA_GATEWAY_SECURED_LABEL,
  type CitadelRiskGateInput,
  type CitadelRiskGateResult,
  type ZeroDevAaGateInput,
  type ZeroDevAaGatewayBadgeStatus,
} from "./zerodev-aa-gate-types";

export { evaluateZeroDevGasGuards };

/** Feature flag — default off; v0.8 Citadel hot path unchanged when false. */
export function isZeroDevAAEnabled(env?: Record<string, string>): boolean {
  return readEnv(env).USE_ZERODEV_AA === "true";
}

/** Static circuit breaker — pure matrix evaluation, fail-fast trip, then telemetry enrich. */
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
  assertAaDeadmanOrThrow(input, nowMs);
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
  assertAaDeadmanOrThrow(input, nowMs);
  const aaProbeRoute = await resolveAaProbeRouteAsync(undefined, nowMs);
  return {
    sponsored: matrix.sponsored,
    gasGuardReason: matrix.gasGuardReason,
    dailySpentUsd: matrix.dailySpentUsd,
    chainHealth: aaProbeRoute.health,
    aaProbeRoute,
  };
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

/** ZeroDev ERC-4337 UserOp preflight — fail-closed soil + oracle gate. */
export function evaluateZeroDevAaGate(input: ZeroDevAaGateInput): GatewayRulesResult {
  return evaluateGatewayRules(toGatewayInput(input));
}

export function assertZeroDevAaRiskGate(
  input: ZeroDevAaGateInput,
  expectTrip: boolean,
): CitadelRiskGateVerdict {
  return assertGatewayCitadelRiskGate(toGatewayInput(input), expectTrip);
}
