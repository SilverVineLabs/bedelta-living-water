/** GMX v2 CreateOrderParams fail-closed guards + FLOAT_PRECISION encoders. */

import { HardlockError, RiskLimitExceeded } from "../risk-control";
import {
  getArbitrumGasGuardReason,
  isArbitrumGasGuardBlocked,
} from "../risk/arbitrum-gas-guard";
import {
  DEFAULT_GMX_PENALTY_BPS,
  estimatePreliminaryImpact,
  evaluateGmxPriceImpactSoilGate,
  type GmxV2PoolWeights,
} from "../yield/gmx-v2-price-impact";

export const GMX_FLOAT_PRECISION = 10n ** 30n;
export const GMX_PAYLOAD_PRICE_IMPACT_TRIP = "GMX_PAYLOAD_PRICE_IMPACT_TRIP" as const;
export const GMX_PAYLOAD_EXECUTION_FEE_TRIP = "GMX_PAYLOAD_EXECUTION_FEE_TRIP" as const;

function riskContext(symbol: string, message: string) {
  return {
    level: "warn" as const,
    module: "risk-control" as const,
    event: "ROOT_PROTECTION_TRIP" as const,
    symbol,
    timestamp: new Date().toISOString(),
    message,
    details: { gate: "gmx-v2-payload" },
  };
}

export function toGmxUsd30(usd: number): string {
  if (!Number.isFinite(usd) || usd < 0) {
    throw new RiskLimitExceeded("GMX_PAYLOAD_INVALID_USD", riskContext("GMX", GMX_PAYLOAD_EXECUTION_FEE_TRIP));
  }
  const [whole, frac = ""] = usd.toFixed(6).split(".");
  const micro = BigInt(whole + (frac + "000000").slice(0, 6));
  return (micro * 10n ** 24n).toString();
}

export function toGmxPrice30(priceUsd: number): string {
  return toGmxUsd30(priceUsd);
}

export function assertGmxPayloadFailClosed(input: {
  skipFailClosedGuards?: boolean;
  sizeUsd: number;
  isLong: boolean;
  pool?: GmxV2PoolWeights;
  executionFee: string;
}): void {
  if (input.skipFailClosedGuards) return;
  if (isArbitrumGasGuardBlocked()) {
    throw new HardlockError(
      getArbitrumGasGuardReason() ?? "ARBITRUM_GAS_GUARD_BLOCKED",
      { ...riskContext("GMX", "ARBITRUM_GAS_GUARD_BLOCKED"), level: "error", event: "CRI_HARDLOCK" },
    );
  }
  let fee = 0n;
  try {
    fee = BigInt(input.executionFee);
  } catch {
    fee = 0n;
  }
  if (fee <= 0n) {
    throw new RiskLimitExceeded(
      `${GMX_PAYLOAD_EXECUTION_FEE_TRIP}:invalid`,
      riskContext("GMX", GMX_PAYLOAD_EXECUTION_FEE_TRIP),
    );
  }
  if (!input.pool) return;
  const impact = estimatePreliminaryImpact({
    orderSizeUsd: input.sizeUsd,
    isLong: input.isLong,
    pool: input.pool,
  });
  const gate = evaluateGmxPriceImpactSoilGate(impact, DEFAULT_GMX_PENALTY_BPS);
  if (gate.triggered) {
    throw new RiskLimitExceeded(
      `${GMX_PAYLOAD_PRICE_IMPACT_TRIP}:${gate.reasons.join("|")}`,
      riskContext("GMX", GMX_PAYLOAD_PRICE_IMPACT_TRIP),
    );
  }
}
