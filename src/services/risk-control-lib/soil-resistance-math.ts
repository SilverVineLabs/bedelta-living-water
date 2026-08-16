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
  MAX_SLIPPAGE,
  resolveSoilMinDepthUsd,
  type SoilResistanceInput,
  type SoilResistanceResult,
} from "./soil-resistance-types";

export function computeSoilSlippageMetrics(input: SoilResistanceInput): {
  crossVenueSlippage: number;
  spotPerpSlippage: number;
  reasons: string[];
} {
  const { hlSpot, hlPerp, dydxPerp, depthUsd } = input;
  const reasons: string[] = [];

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

  return { crossVenueSlippage, spotPerpSlippage, reasons };
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
