/** @module ZeroDevAA gate — types & HUD badge labels */

import type { SoilResistanceInput } from "../../../services/risk-control-lib/soil-resistance";
import type { AaProbeRouteDecision, ZeroDevChainHealthStatus } from "./zerodev-aa-failover";

export const AA_GATEWAY_SECURED_LABEL =
  "[AA GATEWAY: ZERO-FEE SECURED | CITADEL FAIL-CLOSED]" as const;
export const AA_GATEWAY_DISABLED_LABEL = "[AA GATEWAY: DISABLED / V0.8 FALLBACK]" as const;

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

export interface ZeroDevAaGatewayBadgeStatus {
  enabled: boolean;
  gatePass: boolean;
  secured: boolean;
  label: typeof AA_GATEWAY_SECURED_LABEL | typeof AA_GATEWAY_DISABLED_LABEL;
}

export interface ZeroDevAaGateInput {
  symbol: string;
  soil: SoilResistanceInput;
  smartAccount?: string;
  paymaster?: string;
  estimatedLossUsd?: number;
  accountBalanceUsd?: number;
  criHardlock?: boolean;
  payloadPoison?: boolean;
}
