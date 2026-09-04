/**
 * SPDX-License-Identifier: BUSL-1.1
 * Copyright (c) 2026 SilverVine Labs. All Rights Reserved.
 */

import {
  DEFAULT_ROTATION_SLIP_BPS,
  MAX_ROTATION_SLIP_BPS,
  MIN_HOLD_HOURS,
  ROTATION_ASSETS,
  type CrossAssetRotationSummary,
  type RotationAsset,
  type RotationDecision,
} from "./cross-asset-rotation-types";
import {
  clampNonNeg,
  MIN_RATE_EDGE,
  scoreFundingOpportunity,
} from "./cross-asset-rotation-scoring";
import { simulateCrossAssetRotation } from "./cross-asset-rotation-simulate";

/**
 * Phase-5 weapon — cross-asset funding rotation across ETH / SOL / BTC.
 * Selection: max(rate + λ·dF/dt) with hold + edge gates; accrue max(active,…) only after rotate.
 */
export class CrossAssetRotationService {
  readonly rotationSlipBps: number;

  constructor(
    readonly enabled: boolean = true,
    rotationSlipBps: number = DEFAULT_ROTATION_SLIP_BPS,
  ) {
    this.rotationSlipBps = Math.min(
      MAX_ROTATION_SLIP_BPS,
      Math.max(0, rotationSlipBps),
    );
  }

  evaluateBestAsset(input: {
    notionalUsd: number;
    active: RotationAsset;
    rates: Record<RotationAsset, number>;
    slopes?: Partial<Record<RotationAsset, number>>;
    holdHours?: number;
  }): RotationDecision {
    const notional = clampNonNeg(input.notionalUsd);
    const holdHours = input.holdHours ?? MIN_HOLD_HOURS;
    const slopes = input.slopes ?? {};
    let best: RotationAsset = input.active;
    let bestScore = -Infinity;
    for (const a of ROTATION_ASSETS) {
      const rate = input.rates[a] ?? 0;
      const s = scoreFundingOpportunity(rate, slopes[a] ?? 0);
      if (
        s > bestScore ||
        (s === bestScore && rate > (input.rates[best] ?? 0))
      ) {
        bestScore = s;
        best = a;
      }
    }
    const activeRate = input.rates[input.active] ?? 0;
    const bestRate = input.rates[best] ?? 0;
    const activeScore = scoreFundingOpportunity(
      activeRate,
      slopes[input.active] ?? 0,
    );
    const slipUsd = (notional * this.rotationSlipBps) / 10_000;
    const edgeUsdPerHour = notional * (bestRate - activeRate);
    const rotated =
      this.enabled &&
      holdHours >= MIN_HOLD_HOURS &&
      best !== input.active &&
      bestRate - activeRate >= MIN_RATE_EDGE &&
      edgeUsdPerHour * MIN_HOLD_HOURS > slipUsd;

    return {
      time: Date.now(),
      from: input.active,
      to: rotated ? best : input.active,
      scoreTo: bestScore,
      scoreFrom: activeScore,
      rotated,
    };
  }

  simulate(input: {
    notionalUsd: number;
    series: Record<RotationAsset, Array<{ time: number; hourlyRate: number }>>;
    homeAsset?: RotationAsset;
  }): CrossAssetRotationSummary {
    return simulateCrossAssetRotation({
      enabled: this.enabled,
      rotationSlipBps: this.rotationSlipBps,
      notionalUsd: input.notionalUsd,
      series: input.series,
      homeAsset: input.homeAsset,
    });
  }
}
