/** @module ZeroDevAA — Opt-in CLI/SDK Citadel Risk Gate (Not mounted on Worker hot path) */

import { checkSoilResistance, RiskLimitExceeded } from "../../../services/risk-control";
import type { SoilResistanceInput } from "../../../services/risk-control-lib/soil-resistance";
import type { RiskLogPayload } from "../../../services/risk-control-lib/logging";
import {
  DAILY_SPONSORSHIP_LIMIT_USD,
  getGasLedgerSnapshot,
  isDailySponsorshipExhausted,
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

export const TRIP_SOIL_RESISTANCE = "TRIP_SOIL_RESISTANCE" as const;
export const ZERODEV_GAS_LIMIT_EXCEEDED_TRIP = "ZERODEV_GAS_LIMIT_EXCEEDED_TRIP" as const;

function zerodevGateRiskContext(
  symbol: string,
  message: string,
  event: RiskLogPayload["event"],
  details: Record<string, number | string | boolean | null>,
): RiskLogPayload {
  return {
    level: "warn",
    module: "risk-control",
    event,
    symbol,
    timestamp: new Date().toISOString(),
    message,
    details,
  };
}

function throwSoilResistanceTrip(symbol: string, reasons: string[]): never {
  throw new RiskLimitExceeded(
    `${TRIP_SOIL_RESISTANCE}:${reasons.join("|")}`,
    zerodevGateRiskContext(symbol, TRIP_SOIL_RESISTANCE, "SOIL_RESISTANCE_TRIP", {
      reasons: reasons.join("|"),
      gate: "zerodev-aa",
    }),
  );
}

function throwGasLimitExceededTrip(estimatedGasCostUsd: number): never {
  throw new RiskLimitExceeded(
    `${ZERODEV_GAS_LIMIT_EXCEEDED_TRIP}:${estimatedGasCostUsd.toFixed(4)}>${MAX_GAS_COST_PER_USEROP_USD}`,
    zerodevGateRiskContext("AA", ZERODEV_GAS_LIMIT_EXCEEDED_TRIP, "ROOT_PROTECTION_TRIP", {
      estimatedGasCostUsd,
      maxGasCostPerUserOpUsd: MAX_GAS_COST_PER_USEROP_USD,
      gate: "zerodev-aa",
    }),
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
  /** Estimated sponsored gas cost (USD) for this UserOp — required for per-op cap. */
  estimatedGasCostUsd?: number;
  /** Whether caller intends paymaster sponsorship. */
  requestedSponsorship?: boolean;
  /** Evaluation timestamp (tests / replay). */
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

/** Sequencer + Oracle health snapshot for telemetry (read-only; does not bypass soil). */
export function evaluateZeroDevChainHealth(
  rpcLatencyMs?: number,
  nowMs?: number,
): ZeroDevChainHealthStatus {
  return evaluateArbitrumOneHealth(nowMs ?? Date.now(), rpcLatencyMs);
}

export function evaluateZeroDevGasGuards(input: {
  estimatedGasCostUsd?: number;
  requestedSponsorship?: boolean;
  snapshot?: GasLedgerSnapshot;
  nowMs?: number;
}): CitadelRiskGateResult {
  const nowMs = input.nowMs ?? Date.now();
  const requested = input.requestedSponsorship === true;
  const snapshot = input.snapshot ?? getGasLedgerSnapshot(nowMs);

  if (
    input.estimatedGasCostUsd !== undefined &&
    Number.isFinite(input.estimatedGasCostUsd) &&
    input.estimatedGasCostUsd > MAX_GAS_COST_PER_USEROP_USD
  ) {
    throwGasLimitExceededTrip(input.estimatedGasCostUsd);
  }

  if (requested && isDailySponsorshipExhausted(snapshot, nowMs)) {
    return {
      sponsored: false,
      gasGuardReason: `ZERODEV_DAILY_SPONSORSHIP_EXHAUSTED:${snapshot.cumulativeSpentUsd.toFixed(4)}>=${DAILY_SPONSORSHIP_LIMIT_USD}`,
      dailySpentUsd: snapshot.cumulativeSpentUsd,
    };
  }

  return { sponsored: requested, dailySpentUsd: snapshot.cumulativeSpentUsd };
}

/**
 * AA execution MUST pass v0.8 soil gate first — never bypass risk-control.ts.
 * Gas soft-limits: per-UserOp hard reject ($0.50); daily sponsorship fallback ($10/24h).
 */
export function assertCitadelRiskGate(input: CitadelRiskGateInput): CitadelRiskGateResult {
  const nowMs = input.atMs ?? (input.at ? input.at.getTime() : Date.now());
  const chainHealth = evaluateArbitrumOneHealth(nowMs);
  const aaProbeRoute = resolveAaProbeRoute(undefined, nowMs);

  const result = checkSoilResistance(input);
  if (result.tripped) {
    throwSoilResistanceTrip(input.symbol, result.reasons);
  }

  const snapshot = getGasLedgerSnapshot(nowMs);
  const gas = evaluateZeroDevGasGuards({
    estimatedGasCostUsd: input.estimatedGasCostUsd,
    requestedSponsorship: input.requestedSponsorship,
    snapshot,
    nowMs,
  });

  return { ...gas, chainHealth, aaProbeRoute };
}

/** KV-backed gate path for Edge Workers — loads ledger before guard evaluation. */
export async function assertCitadelRiskGateAsync(
  input: CitadelRiskGateInput,
): Promise<CitadelRiskGateResult> {
  const nowMs = input.atMs ?? (input.at ? input.at.getTime() : Date.now());
  const aaProbeRoute = await resolveAaProbeRouteAsync(undefined, nowMs);
  const chainHealth = aaProbeRoute.health;

  const result = checkSoilResistance(input);
  if (result.tripped) {
    throwSoilResistanceTrip(input.symbol, result.reasons);
  }

  const snapshot = input.kv ? await loadGasLedgerFromKv(input.kv, nowMs) : getGasLedgerSnapshot(nowMs);
  const gas = evaluateZeroDevGasGuards({
    estimatedGasCostUsd: input.estimatedGasCostUsd,
    requestedSponsorship: input.requestedSponsorship,
    snapshot,
    nowMs,
  });

  return { ...gas, chainHealth, aaProbeRoute };
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

/** HUD badge resolver — mirrors assertCitadelRiskGate without throwing. */
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
