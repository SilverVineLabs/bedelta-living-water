/**
 * SPDX-License-Identifier: BUSL-1.1
 * Copyright (c) 2026 SilverVine Labs. All Rights Reserved.
 * Soil resistance types + depth/slippage constants.
 */

import type {
  PendleCrossGuardSoilInput,
  PendleOracleSoilInput,
  PendlePoolFactorySoilInput,
} from "../../core/pendle-types";
import type { CrossSpreadSoilInput } from "../yield/cross-spread-cache";
import type { GmxV2PriceImpactSoilInput } from "../yield/gmx-v2-price-impact";

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
  /** Pendle PT × GMX shadow-margin cross-guard probe */
  pendleCrossGuard?: PendleCrossGuardSoilInput;
  /** Pendle oracle freshness probe — trips with PENDLE_ORACLE_STALE */
  pendleOracle?: PendleOracleSoilInput;
  /** Pendle AI pool-factory pre-flight — PENDLE_CREATE_POOL / PENDLE_ADD_LIQUIDITY */
  pendlePoolFactory?: PendlePoolFactorySoilInput;
  /** Disable dynamic ±2–5 bps threshold jitter (tests / replay) */
  disableThresholdJitter?: boolean;
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

/** Resolve effective depth floor — $5K on HL testnet, $100K mainnet unless overridden. */
export function resolveSoilMinDepthUsd(input: SoilResistanceInput): number {
  if (input.minDepthUsd !== undefined) return input.minDepthUsd;
  if (input.isTestnet) return HL_TESTNET_MIN_DEPTH_USD;
  return MIN_DEPTH_USD;
}
