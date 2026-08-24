/**
 * SPDX-License-Identifier: BUSL-1.1
 * Copyright (c) 2026 SilverVine Labs. All Rights Reserved.
 */

const SLOPE_WEIGHT = 6;
/** Min hourly-rate edge to justify a switch */
const MIN_RATE_EDGE = 0.000008;
const LOCF_MAX_AGE_MS = 3 * 60 * 60_000;

export { MIN_RATE_EDGE };

export function clampNonNeg(n: number): number {
  return Number.isFinite(n) && n > 0 ? n : 0;
}

export function scoreFundingOpportunity(
  hourlyRate: number,
  dFdt: number,
): number {
  const rateTerm = hourlyRate < 0 ? hourlyRate * 2.5 : hourlyRate;
  return rateTerm + SLOPE_WEIGHT * dFdt;
}

export function locfRate(
  sorted: Array<{ time: number; hourlyRate: number }>,
  t: number,
): number | undefined {
  for (let i = sorted.length - 1; i >= 0; i--) {
    const p = sorted[i]!;
    if (p.time > t) continue;
    if (t - p.time <= LOCF_MAX_AGE_MS) return p.hourlyRate;
    break;
  }
  return undefined;
}
