/**
 * SPDX-License-Identifier: BUSL-1.1
 * Copyright (c) 2026 SilverVine Labs. All Rights Reserved.
 */

import { emitRiskLog, formatTripReasons, isoNow } from "./logging";
import {
  isAllowedTelemetrySymbol,
  normalizeTelemetrySymbol,
} from "./telemetry-symbols";
import { isTsunamiShieldWindow } from "./time-gates";
import { evaluateHlOrderbookGapGuard } from "./hl-orderbook-gap-guard";
import { evaluateRwaSettlementLock } from "./rwa-settlement-lock";
import { recordTelemetrySoilTrip } from "../telemetry-analytics-lib/telemetry-analytics-core";
import { notifyFailClosedLock } from "../telemetry/telegram-alert";
import {
  getArbitrumStatusAnomalyReason,
  isArbitrumStatusSequencerHealthy,
} from "../adapters/arbitrum-status-sentinel";
import {
  getRpcRadarOutageReason,
  isRpcRadarSequencerHealthy,
} from "../adapters/rpc-radar";
import { getSequencerUnsafeReason, isSequencerSafe } from "../risk/sequencer-guard";
import { getArbitrumGasGuardReason, isArbitrumGasGuardBlocked } from "../risk/arbitrum-gas-guard";
import {
  getSoftConfirmationUnsafeReason,
  isSoftConfirmationSafe,
} from "../risk/soft-confirmation-guard";
import { evaluateCrossSpreadSoilGate } from "../yield/cross-spread-cache";
import { evaluateGmxPriceImpactSoilGate } from "../yield/gmx-v2-price-impact";
import {
  applySoilRiskCaps,
  computeSoilSlippageMetrics,
} from "./soil-resistance-math";
import { resolveJitteredSoilThresholds } from "./soil-threshold-jitter";
import {
  VINE_SOIL_MAX_SLIPPAGE,
  type SoilResistanceInput,
  type SoilResistanceResult,
} from "./soil-resistance-types";

export {
  HL_TESTNET_MIN_DEPTH_USD,
  MAX_SLIPPAGE,
  MIN_DEPTH_USD,
  resolveSoilMinDepthUsd,
  VINE_SOIL_MAX_SLIPPAGE,
  type SoilResistanceInput,
  type SoilResistanceResult,
} from "./soil-resistance-types";

function collectExternalSoilReasons(
  input: SoilResistanceInput,
  minDepthUsd: number,
): string[] {
  const reasons: string[] = [];
  const { symbol, depthUsd } = input;

  if (isTsunamiShieldWindow(input.at)) {
    reasons.push("TSUNAMI_SHIELD_LOCKED_HKT_21_23");
  }
  if (!isSequencerSafe(input.at?.getTime())) {
    reasons.push(getSequencerUnsafeReason() ?? "ARBITRUM_SEQUENCER_UNSAFE");
  }
  if (!isArbitrumStatusSequencerHealthy(input.at?.getTime())) {
    reasons.push(getArbitrumStatusAnomalyReason() ?? "SEQUENCER_ANOMALY_DETECTED");
  }
  if (!isRpcRadarSequencerHealthy(input.at?.getTime())) {
    reasons.push(getRpcRadarOutageReason() ?? "SEQUENCER_OUTAGE_CONFIRMED");
  }
  if (isArbitrumGasGuardBlocked()) {
    reasons.push(getArbitrumGasGuardReason() ?? "ARBITRUM_GAS_GUARD_BLOCKED");
  }
  if (!isSoftConfirmationSafe(input.at?.getTime())) {
    reasons.push(getSoftConfirmationUnsafeReason() ?? "SOFT_CONFIRMATION_DRIFT_UNSAFE");
  }
  if (input.crossSpread) {
    const spreadGate = evaluateCrossSpreadSoilGate(input.crossSpread);
    if (spreadGate.triggered) reasons.push(...spreadGate.reasons);
  }
  if (input.gmxPriceImpact) {
    const impactGate = evaluateGmxPriceImpactSoilGate(input.gmxPriceImpact);
    if (impactGate.triggered) reasons.push(...impactGate.reasons);
  }
  const hlOrderbookGap = evaluateHlOrderbookGapGuard({
    symbol,
    depthUsd,
    minDepthUsd,
    requestedLeverage: input.requestedLeverage,
    at: input.at,
  });
  if (hlOrderbookGap.triggered) reasons.push(...hlOrderbookGap.reasons);
  const rwaSettlement = evaluateRwaSettlementLock({ symbol, at: input.at });
  if (rwaSettlement.locked) reasons.push(...rwaSettlement.reasons);
  return reasons;
}

/**
 * Soil resistance — slippage & depth circuit breaker.
 * Trips when cross-venue / cross-book slippage > 0.5%, or liquidity depth is insufficient.
 */
export function checkSoilResistance(
  input: SoilResistanceInput,
): SoilResistanceResult {
  const { symbol, depthUsd } = input;
  const { slippageFuse, minDepthUsd } = resolveJitteredSoilThresholds(input);
  const metrics = computeSoilSlippageMetrics(input, {
    maxSlippage: slippageFuse,
    minDepthUsd,
  });
  const reasons = collectExternalSoilReasons(input, minDepthUsd);
  if (metrics.reasons.length > 0) {
    reasons.push(...metrics.reasons);
  }

  const tripped = reasons.length > 0;
  const result: SoilResistanceResult = {
    ok: !tripped,
    tripped,
    crossVenueSlippage: Number.isFinite(metrics.crossVenueSlippage)
      ? metrics.crossVenueSlippage
      : -1,
    spotPerpSlippage: Number.isFinite(metrics.spotPerpSlippage)
      ? metrics.spotPerpSlippage
      : -1,
    crossSpreadBps: input.crossSpread?.crossSpreadBps,
    isSpreadProfitable: input.crossSpread?.isSpreadProfitable,
    priceImpactSubsidiesBps: input.gmxPriceImpact?.priceImpactSubsidiesBps,
    priceImpactPenaltyBps: input.gmxPriceImpact?.priceImpactPenaltyBps,
    gmxReducesImbalance: input.gmxPriceImpact?.reducesImbalance,
    reasons,
  };

  applySoilRiskCaps(input, result, slippageFuse);

  if (tripped) {
    if (isAllowedTelemetrySymbol(symbol)) {
      recordTelemetrySoilTrip();
      emitRiskLog({
        level: "warn",
        module: "risk-control",
        event: "SOIL_RESISTANCE_TRIP",
        symbol: normalizeTelemetrySymbol(symbol),
        timestamp: isoNow(),
        message: "Soil resistance circuit breaker tripped — trade rejected",
        details: {
          crossVenueSlippage: result.crossVenueSlippage,
          spotPerpSlippage: result.spotPerpSlippage,
          maxSlippage: slippageFuse,
          depthUsd: depthUsd ?? null,
          minDepthUsd,
          reasons: formatTripReasons(reasons),
          tradeAllowed: false,
        },
      });
    }
    notifyFailClosedLock(
      `checkSoilResistance() TRIP ${normalizeTelemetrySymbol(symbol)} — ${formatTripReasons(reasons)}`,
    );
  }

  return result;
}

/** Vine soil gate — live L2 slippage/spread fuse at 0.3%. */
export function checkSoilResistanceWithVine(
  input: SoilResistanceInput,
): SoilResistanceResult {
  return checkSoilResistance({
    ...input,
    maxSlippage: input.maxSlippage ?? VINE_SOIL_MAX_SLIPPAGE,
  });
}
