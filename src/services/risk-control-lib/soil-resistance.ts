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
import { isArbitrumStatusSequencerHealthy } from "../adapters/arbitrum-status-sentinel";
import { isRpcRadarSequencerHealthy } from "../adapters/rpc-radar";
import { isSequencerSafe } from "../risk/sequencer-guard";
import { isArbitrumGasGuardBlocked } from "../risk/arbitrum-gas-guard";
import { isSoftConfirmationSafe } from "../risk/soft-confirmation-guard";
import { evaluatePendlePoolFactorySoilGate } from "../../adapters/pendle/pendle-pool-factory-adapter";
import { evaluatePendleCrossGuardSoilGate, evaluatePendleOracleSoilGateFromRegistry } from "../../guards/pendle-gmx-cross-guard";
import { evaluateCrossSpreadSoilGate } from "../yield/cross-spread-cache";
import { evaluateGmxPriceImpactSoilGate } from "../yield/gmx-v2-price-impact";
import {
  applySoilRiskCaps,
  computeSoilSlippageMetrics,
} from "./soil-resistance-math";
import {
  appendSoilExternalReasons,
  createSoilReasonScratch,
  materializeSoilReasons,
  SOIL_REASON_GAS_GUARD,
  SOIL_REASON_RPC_OUTAGE,
  SOIL_REASON_SEQUENCER_UNSAFE,
  SOIL_REASON_SOFT_CONFIRMATION,
  SOIL_REASON_STATUS_ANOMALY,
  SOIL_REASON_TSUNAMI,
  type SoilReasonScratch,
} from "./soil-reason-codes";
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

function collectExternalSoilFlags(
  input: SoilResistanceInput,
  minDepthUsd: number,
  scratch: SoilReasonScratch,
): void {
  const { symbol, depthUsd } = input;
  const atMs = input.at?.getTime();

  if (isTsunamiShieldWindow(input.at)) scratch.flags |= SOIL_REASON_TSUNAMI;
  if (!isSequencerSafe(atMs)) scratch.flags |= SOIL_REASON_SEQUENCER_UNSAFE;
  if (!isArbitrumStatusSequencerHealthy(atMs)) scratch.flags |= SOIL_REASON_STATUS_ANOMALY;
  if (!isRpcRadarSequencerHealthy(atMs)) scratch.flags |= SOIL_REASON_RPC_OUTAGE;
  if (isArbitrumGasGuardBlocked()) scratch.flags |= SOIL_REASON_GAS_GUARD;
  if (!isSoftConfirmationSafe(atMs)) scratch.flags |= SOIL_REASON_SOFT_CONFIRMATION;

  if (input.crossSpread) {
    const spreadGate = evaluateCrossSpreadSoilGate(input.crossSpread);
    if (spreadGate.triggered) appendSoilExternalReasons(scratch, spreadGate.reasons);
  }
  if (input.gmxPriceImpact) {
    const impactGate = evaluateGmxPriceImpactSoilGate(input.gmxPriceImpact);
    if (impactGate.triggered) appendSoilExternalReasons(scratch, impactGate.reasons);
  }
  if (input.pendleCrossGuard) {
    const pendleGate = evaluatePendleCrossGuardSoilGate(input.pendleCrossGuard);
    if (pendleGate.triggered) appendSoilExternalReasons(scratch, pendleGate.reasons);
  }
  if (input.pendleOracle) {
    const oracleGate = evaluatePendleOracleSoilGateFromRegistry(input.pendleOracle);
    if (oracleGate.triggered) appendSoilExternalReasons(scratch, oracleGate.reasons);
  }
  if (input.pendlePoolFactory) {
    const poolGate = evaluatePendlePoolFactorySoilGate(input.pendlePoolFactory);
    if (poolGate.triggered) appendSoilExternalReasons(scratch, poolGate.reasons);
  }
  const hlOrderbookGap = evaluateHlOrderbookGapGuard({
    symbol,
    depthUsd,
    minDepthUsd,
    requestedLeverage: input.requestedLeverage,
    at: input.at,
  });
  if (hlOrderbookGap.triggered) appendSoilExternalReasons(scratch, hlOrderbookGap.reasons);
  const rwaSettlement = evaluateRwaSettlementLock({ symbol, at: input.at });
  if (rwaSettlement.locked) appendSoilExternalReasons(scratch, rwaSettlement.reasons);
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
  const scratch = createSoilReasonScratch(metrics.tripFlags);
  collectExternalSoilFlags(input, minDepthUsd, scratch);

  const tripped = scratch.flags !== 0 || scratch.external !== null;
  const crossVenueSlippage = Number.isFinite(metrics.crossVenueSlippage)
    ? metrics.crossVenueSlippage
    : -1;
  const spotPerpSlippage = Number.isFinite(metrics.spotPerpSlippage)
    ? metrics.spotPerpSlippage
    : -1;

  const result: SoilResistanceResult = {
    ok: !tripped,
    tripped,
    crossVenueSlippage,
    spotPerpSlippage,
    crossSpreadBps: input.crossSpread?.crossSpreadBps,
    isSpreadProfitable: input.crossSpread?.isSpreadProfitable,
    priceImpactSubsidiesBps: input.gmxPriceImpact?.priceImpactSubsidiesBps,
    priceImpactPenaltyBps: input.gmxPriceImpact?.priceImpactPenaltyBps,
    gmxReducesImbalance: input.gmxPriceImpact?.reducesImbalance,
    reasons: tripped
      ? materializeSoilReasons(scratch, {
          crossVenueSlippage,
          slippageFuse,
          depthUsd,
          minDepthUsd,
        })
      : [],
  };

  applySoilRiskCaps(input, result, slippageFuse);

  if (tripped) {
    const reasons = result.reasons;
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
