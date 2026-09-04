/**
 * SPDX-License-Identifier: BUSL-1.1
 * Copyright (c) 2026 SilverVine Labs. All Rights Reserved.
 * Pure soil math — cross-venue / spot-perp slippage + Max SL caps.
 */

import {
  computeOrderAwareMaxSlUsd,
  computeSoilRiskUsd,
} from "../effective-max-sl";
import {
  SOIL_REASON_CROSS_VENUE,
  SOIL_REASON_DEPTH_USD,
  SOIL_REASON_INSUFFICIENT_DEPTH,
} from "./soil-reason-codes";
import {
  MAX_SLIPPAGE,
  resolveSoilMinDepthUsd,
  type SoilResistanceInput,
  type SoilResistanceResult,
} from "./soil-resistance-types";

/** Packed soil lane — mirrors Wasm `#[repr(C)]` f64 layout (6 × 8 B). */
const SOIL_PACK_LEN = 6;
const SOIL_IDX_HL_SPOT = 0;
const SOIL_IDX_HL_PERP = 1;
const SOIL_IDX_DYDX_PERP = 2;
const SOIL_IDX_DEPTH_USD = 3;
const SOIL_IDX_SLIPPAGE_FUSE = 4;
const SOIL_IDX_MIN_DEPTH_USD = 5;

export function packSoilLane(
  hlSpot: number,
  hlPerp: number,
  dydxPerp: number,
  depthUsd: number,
  slippageFuse: number,
  minDepthUsd: number,
  out?: Float64Array,
): Float64Array {
  const lane = out ?? new Float64Array(SOIL_PACK_LEN);
  lane[SOIL_IDX_HL_SPOT] = hlSpot;
  lane[SOIL_IDX_HL_PERP] = hlPerp;
  lane[SOIL_IDX_DYDX_PERP] = dydxPerp;
  lane[SOIL_IDX_DEPTH_USD] = depthUsd;
  lane[SOIL_IDX_SLIPPAGE_FUSE] = slippageFuse;
  lane[SOIL_IDX_MIN_DEPTH_USD] = minDepthUsd;
  return lane;
}

/** Pointer-style slippage eval — no object churn; depth NaN = absent. */
export function evaluateSoilSlippagePacked(lane: Float64Array): {
  crossVenueSlippage: number;
  spotPerpSlippage: number;
  tripFlags: number;
} {
  const hlPerp = lane[SOIL_IDX_HL_PERP];
  const dydxPerp = lane[SOIL_IDX_DYDX_PERP];
  const hlSpot = lane[SOIL_IDX_HL_SPOT];
  const depthUsd = lane[SOIL_IDX_DEPTH_USD];
  const slippageFuse = lane[SOIL_IDX_SLIPPAGE_FUSE];
  const minDepthUsd = lane[SOIL_IDX_MIN_DEPTH_USD];

  const crossVenueSlippage =
    hlPerp > 0 && dydxPerp > 0
      ? Math.abs(dydxPerp - hlPerp) / hlPerp
      : Number.POSITIVE_INFINITY;
  const spotPerpSlippage =
    hlSpot > 0 ? Math.abs(hlPerp - hlSpot) / hlSpot : Number.POSITIVE_INFINITY;

  let tripFlags = 0;
  if (hlPerp <= 0 || dydxPerp <= 0) tripFlags |= SOIL_REASON_INSUFFICIENT_DEPTH;
  if (hlPerp > 0 && dydxPerp > 0 && crossVenueSlippage > slippageFuse) {
    tripFlags |= SOIL_REASON_CROSS_VENUE;
  }
  if (Number.isFinite(depthUsd) && depthUsd < minDepthUsd) {
    tripFlags |= SOIL_REASON_DEPTH_USD;
  }

  return { crossVenueSlippage, spotPerpSlippage, tripFlags };
}

export interface SoilSlippageOverrides {
  maxSlippage?: number;
  minDepthUsd?: number;
}

export function computeSoilSlippageMetrics(
  input: SoilResistanceInput,
  overrides?: SoilSlippageOverrides,
): {
  crossVenueSlippage: number;
  spotPerpSlippage: number;
  tripFlags: number;
} {
  const slippageFuse = overrides?.maxSlippage ?? input.maxSlippage ?? MAX_SLIPPAGE;
  const minDepthUsd = overrides?.minDepthUsd ?? resolveSoilMinDepthUsd(input);
  const depthRaw = input.depthUsd;

  const lane = packSoilLane(
    input.hlSpot,
    input.hlPerp,
    input.dydxPerp,
    depthRaw ?? Number.NaN,
    slippageFuse,
    minDepthUsd,
  );
  return evaluateSoilSlippagePacked(lane);
}

export function applySoilRiskCaps(
  input: SoilResistanceInput,
  result: SoilResistanceResult,
  slippageFuse: number,
): void {
  const orderSize = Number(input.orderSizeUsd);
  const balance = Number(input.accountBalanceUsd);
  if (!(Number.isFinite(orderSize) && orderSize > 0)) return;

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
