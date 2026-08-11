/**
 * SPDX-License-Identifier: BUSL-1.1
 * Copyright (c) 2026 SilverVine Labs. All Rights Reserved.
 */

import {
  computeOrderAwareMaxSlUsd,
  computeSoilRiskUsd,
} from "../effective-max-sl";
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
import { evaluateCrossSpreadSoilGate, type CrossSpreadSoilInput } from "../yield/cross-spread";
import {
  evaluateGmxPriceImpactSoilGate,
  type GmxV2PriceImpactSoilInput,
} from "../yield/gmx-v2-price-impact";

/** Cross-venue / cross-book slippage trip threshold (0.5%) */
export const MAX_SLIPPAGE = 0.005;

/**
 * Minimum liquidity depth (USD notional proxy). Rows without an explicit
 * depth reading are judged by dual-venue price presence only.
 */
export const MIN_DEPTH_USD = 100_000;

/** Relaxed depth gate for HL HyperEVM testnet (chainId 998) low-liquidity books. */
export const HL_TESTNET_MIN_DEPTH_USD = 5_000;

/** Vine soil fuse — L2 slippage isolation threshold (0.3%) */
export const VINE_SOIL_MAX_SLIPPAGE = 0.003;

export interface SoilResistanceInput {
  symbol: string;
  hlSpot: number;
  hlPerp: number;
  dydxPerp: number;
  /** Optional order-book / volume depth in USD */
  depthUsd?: number;
  /** Optional slippage fuse override (default MAX_SLIPPAGE) */
  maxSlippage?: number;
  /** Optional order notional — enables soil-risk Max SL cap */
  orderSizeUsd?: number;
  /** Optional account equity — enables soil-risk Max SL cap */
  accountBalanceUsd?: number;
  /** Override MIN_DEPTH_USD — HL testnet uses HL_TESTNET_MIN_DEPTH_USD ($5K). */
  minDepthUsd?: number;
  /** HyperEVM testnet (chainId 998) — relaxes depth gate to HL_TESTNET_MIN_DEPTH_USD. */
  isTestnet?: boolean;
  /** Optional evaluation timestamp (tests / replay) */
  at?: Date;
  /** Optional requested leverage — HIP-3 gap guard scales 3x → 1x during RWA windows */
  requestedLeverage?: number;
  /** Cross-DEX funding spread gate (GMX v2 vs HL/Vertex) */
  crossSpread?: CrossSpreadSoilInput;
  /** GMX v2 GM pool price-impact penalty / subsidy probe */
  gmxPriceImpact?: GmxV2PriceImpactSoilInput;
}

/** Resolve effective depth floor — $5K on HL testnet, $100K mainnet unless overridden. */
export function resolveSoilMinDepthUsd(input: SoilResistanceInput): number {
  if (input.minDepthUsd !== undefined) return input.minDepthUsd;
  if (input.isTestnet) return HL_TESTNET_MIN_DEPTH_USD;
  return MIN_DEPTH_USD;
}

export interface SoilResistanceResult {
  ok: boolean;
  tripped: boolean;
  /** Absolute cross-venue perp slippage ratio */
  crossVenueSlippage: number;
  /** Absolute HL spot–perp basis ratio */
  spotPerpSlippage: number;
  crossSpreadBps?: number;
  isSpreadProfitable?: boolean;
  priceImpactSubsidiesBps?: number;
  priceImpactPenaltyBps?: number;
  gmxReducesImbalance?: boolean;
  reasons: string[];
  /** Measured slippage loss USD when orderSizeUsd is provided */
  soilRiskUsd?: number;
  /** min(dynamic Max SL, orderSize×fuse) when order + balance provided */
  cappedMaxSlUsd?: number;
}

/**
 * Soil resistance — slippage & depth circuit breaker.
 * Trips when cross-venue / cross-book slippage > 0.5%, or liquidity depth is insufficient.
 * Spot–perp basis is reported for telemetry only (it is often the arb edge, not a fuse).
 * On trip: refuse actionable trade signals (caller must not trigger execution).
 *
 * @theory Kyle (1985) — Kyle's Lambda (λ) linear price-impact coefficient.
 * @theory Almgren & Chriss (2000) — transient market impact / optimal execution model.
 */
export function checkSoilResistance(
  input: SoilResistanceInput,
): SoilResistanceResult {
  const { symbol, hlSpot, hlPerp, dydxPerp, depthUsd } = input;
  const reasons: string[] = [];

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
    minDepthUsd: resolveSoilMinDepthUsd(input),
    requestedLeverage: input.requestedLeverage,
    at: input.at,
  });
  if (hlOrderbookGap.triggered) {
    reasons.push(...hlOrderbookGap.reasons);
  }

  const rwaSettlement = evaluateRwaSettlementLock({ symbol, at: input.at });
  if (rwaSettlement.locked) {
    reasons.push(...rwaSettlement.reasons);
  }

  const crossVenueSlippage =
    hlPerp > 0 && dydxPerp > 0
      ? Math.abs(dydxPerp - hlPerp) / hlPerp
      : Number.POSITIVE_INFINITY;

  const spotPerpSlippage =
    hlSpot > 0 ? Math.abs(hlPerp - hlSpot) / hlSpot : Number.POSITIVE_INFINITY;

  if (hlPerp <= 0 || dydxPerp <= 0) {
    reasons.push("INSUFFICIENT_DEPTH_DUAL_VENUE");
  }

  const slippageFuse = input.maxSlippage ?? MAX_SLIPPAGE;
  if (hlPerp > 0 && dydxPerp > 0 && crossVenueSlippage > slippageFuse) {
    reasons.push(
      `CROSS_VENUE_SLIPPAGE=${(crossVenueSlippage * 100).toFixed(4)}%>${slippageFuse * 100}%`,
    );
  }

  if (depthUsd !== undefined && depthUsd < resolveSoilMinDepthUsd(input)) {
    const minDepthUsdResolved = resolveSoilMinDepthUsd(input);
    reasons.push(`DEPTH_USD=${depthUsd}<${minDepthUsdResolved}`);
  }

  const tripped = reasons.length > 0;
  const result: SoilResistanceResult = {
    ok: !tripped,
    tripped,
    crossVenueSlippage: Number.isFinite(crossVenueSlippage)
      ? crossVenueSlippage
      : -1,
    spotPerpSlippage: Number.isFinite(spotPerpSlippage) ? spotPerpSlippage : -1,
    crossSpreadBps: input.crossSpread?.crossSpreadBps,
    isSpreadProfitable: input.crossSpread?.isSpreadProfitable,
    priceImpactSubsidiesBps: input.gmxPriceImpact?.priceImpactSubsidiesBps,
    priceImpactPenaltyBps: input.gmxPriceImpact?.priceImpactPenaltyBps,
    gmxReducesImbalance: input.gmxPriceImpact?.reducesImbalance,
    reasons,
  };

  const orderSize = Number(input.orderSizeUsd);
  const balance = Number(input.accountBalanceUsd);
  if (Number.isFinite(orderSize) && orderSize > 0) {
    const slipForRisk =
      Number.isFinite(result.crossVenueSlippage) && result.crossVenueSlippage >= 0
        ? result.crossVenueSlippage
        : slippageFuse;
    result.soilRiskUsd = computeSoilRiskUsd(orderSize, slipForRisk);
    if (Number.isFinite(balance) && balance >= 0) {
      result.cappedMaxSlUsd = computeOrderAwareMaxSlUsd(
        balance,
        orderSize,
        slippageFuse,
      );
    }
  }

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
          minDepthUsd: resolveSoilMinDepthUsd(input),
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

/**
 * Vine soil gate — live L2 slippage/spread fuse at 0.3%.
 * Trips when cross-venue slippage exceeds VINE_SOIL_MAX_SLIPPAGE.
 */
export function checkSoilResistanceWithVine(
  input: SoilResistanceInput,
): SoilResistanceResult {
  return checkSoilResistance({
    ...input,
    maxSlippage: input.maxSlippage ?? VINE_SOIL_MAX_SLIPPAGE,
  });
}
