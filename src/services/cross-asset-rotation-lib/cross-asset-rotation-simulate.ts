/**
 * SPDX-License-Identifier: BUSL-1.1
 * Copyright (c) 2026 SilverVine Labs. All Rights Reserved.
 */

import {
  type CrossAssetRotationSummary,
  type RotationAsset,
  type RotationDecision,
  MIN_HOLD_HOURS,
  ROTATION_ASSETS,
} from "./cross-asset-rotation-types";
import {
  clampNonNeg,
  locfRate,
  MIN_RATE_EDGE,
  scoreFundingOpportunity,
} from "./cross-asset-rotation-scoring";

export function simulateCrossAssetRotation(input: {
  enabled: boolean;
  rotationSlipBps: number;
  notionalUsd: number;
  series: Record<RotationAsset, Array<{ time: number; hourlyRate: number }>>;
  homeAsset?: RotationAsset;
}): CrossAssetRotationSummary {
  const notional = clampNonNeg(input.notionalUsd);
  const home = input.homeAsset ?? "ETH";
  const assets: RotationAsset[] = [...ROTATION_ASSETS];

  const sorted: Record<
    RotationAsset,
    Array<{ time: number; hourlyRate: number }>
  > = {
    ETH: [...(input.series.ETH ?? [])].sort((a, b) => a.time - b.time),
    SOL: [...(input.series.SOL ?? [])].sort((a, b) => a.time - b.time),
    BTC: [...(input.series.BTC ?? [])].sort((a, b) => a.time - b.time),
  };

  const ethSeries = sorted.ETH;
  let active: RotationAsset = home;
  let fundingPnlUsd = 0;
  let rotationSlipUsd = 0;
  let baselineEthFunding = 0;
  let rotations = 0;
  let holdHours = MIN_HOLD_HOURS;
  const decisions: RotationDecision[] = [];
  const prevRate = new Map<RotationAsset, number>();

  for (let i = 0; i < ethSeries.length; i++) {
    const t = ethSeries[i]!.time;
    const rates = new Map<RotationAsset, number>();
    for (const a of assets) {
      const r = locfRate(sorted[a], t);
      if (r !== undefined) rates.set(a, r);
    }

    const ethR = rates.get("ETH") ?? ethSeries[i]!.hourlyRate;
    baselineEthFunding += notional * ethR;

    if (!input.enabled || rates.size < 3) {
      fundingPnlUsd += notional * ethR;
      if (input.enabled && rates.size < 3) holdHours += 1;
      if (!input.enabled) {
        decisions.push({
          time: t,
          from: home,
          to: home,
          scoreTo: scoreFundingOpportunity(ethR, 0),
          scoreFrom: scoreFundingOpportunity(ethR, 0),
          rotated: false,
        });
      }
      continue;
    }

    const slopes = new Map<RotationAsset, number>();
    for (const a of assets) {
      const r = rates.get(a)!;
      const prev = prevRate.get(a);
      slopes.set(a, prev === undefined ? 0 : r - prev);
      prevRate.set(a, r);
    }

    let best: RotationAsset = "ETH";
    let bestScore = -Infinity;
    for (const a of assets) {
      const s = scoreFundingOpportunity(rates.get(a)!, slopes.get(a) ?? 0);
      if (
        s > bestScore ||
        (s === bestScore && rates.get(a)! > rates.get(best)!)
      ) {
        bestScore = s;
        best = a;
      }
    }

    const from = active;
    const activeRate = rates.get(active)!;
    const bestRate = rates.get(best)!;
    const activeScore = scoreFundingOpportunity(
      activeRate,
      slopes.get(active) ?? 0,
    );

    const slipUsd = (notional * input.rotationSlipBps) / 10_000;
    const edgeUsdPerHour = notional * (bestRate - activeRate);
    const canRotate =
      holdHours >= MIN_HOLD_HOURS &&
      best !== active &&
      bestRate - activeRate >= MIN_RATE_EDGE &&
      edgeUsdPerHour * MIN_HOLD_HOURS > slipUsd;

    let rotated = false;
    if (canRotate) {
      rotations += 1;
      rotationSlipUsd += slipUsd;
      active = best;
      rotated = true;
      holdHours = 0;
    } else {
      holdHours += 1;
    }

    fundingPnlUsd += notional * rates.get(active)!;
    decisions.push({
      time: t,
      from,
      to: active,
      scoreTo: bestScore,
      scoreFrom: activeScore,
      rotated,
    });
  }

  const hours = Math.max(ethSeries.length, 1);
  const netPnlUsd = fundingPnlUsd - rotationSlipUsd;
  const annualizedApy =
    (netPnlUsd / Math.max(notional, 1)) * ((365 * 24) / hours);
  const baselineEthApy =
    (baselineEthFunding / Math.max(notional, 1)) * ((365 * 24) / hours);

  return {
    hours: ethSeries.length,
    rotations,
    fundingPnlUsd,
    rotationSlipUsd,
    netPnlUsd,
    annualizedApy,
    baselineEthApy,
    pureDeltaApy: annualizedApy - baselineEthApy,
    decisions,
    stub: !input.enabled,
    rotationSlipBps: input.rotationSlipBps,
  };
}
