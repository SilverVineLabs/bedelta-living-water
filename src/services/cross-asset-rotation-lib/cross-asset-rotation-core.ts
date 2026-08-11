/**
 * SPDX-License-Identifier: BUSL-1.1
 * Copyright (c) 2026 SilverVine Labs. All Rights Reserved.
 */

/**
 * v1.5 Dark Citadel — Cross-Asset Funding Rotation (Cat E / Phase 5).
 * Routes hedge notional across ETH / SOL / BTC by funding slope dF/dt.
 * Switch cost capped at 0.5 bps of notional — not Wave-1 grant surface.
 */

export type RotationAsset = "ETH" | "SOL" | "BTC";

export const ROTATION_ASSETS: readonly RotationAsset[] = ["ETH", "SOL", "BTC"] as const;

export interface AssetFundingTick {
  asset: RotationAsset;
  time: number;
  /** Hourly funding rate (HL native) */
  hourlyRate: number;
}

export interface RotationDecision {
  time: number;
  from: RotationAsset;
  to: RotationAsset;
  /** Score = rate + λ·dF/dt (shorts prefer positive) */
  scoreTo: number;
  scoreFrom: number;
  rotated: boolean;
}

export interface CrossAssetRotationHourResult {
  time: number;
  activeAsset: RotationAsset;
  fundingPnlUsd: number;
  rotationSlipUsd: number;
  decision: RotationDecision;
}

export interface CrossAssetRotationSummary {
  hours: number;
  rotations: number;
  fundingPnlUsd: number;
  rotationSlipUsd: number;
  netPnlUsd: number;
  annualizedApy: number;
  baselineEthApy: number;
  pureDeltaApy: number;
  decisions: RotationDecision[];
  /** false when service enabled and simulation ran full path */
  stub: boolean;
  /** Switch friction used (bps) — SSOT 0.5 */
  rotationSlipBps: number;
}

const SLOPE_WEIGHT = 6;
/** Internal transfer friction (bps of notional) per switch — hard cap 0.5 bps */
export const DEFAULT_ROTATION_SLIP_BPS = 0.5 as const;
export const MAX_ROTATION_SLIP_BPS = 0.5 as const;
/** Min hours between switches */
export const MIN_HOLD_HOURS = 6;
/** Min hourly-rate edge to justify a switch */
const MIN_RATE_EDGE = 0.000008;
const LOCF_MAX_AGE_MS = 3 * 60 * 60_000;

function clampNonNeg(n: number): number {
  return Number.isFinite(n) && n > 0 ? n : 0;
}

export function scoreFundingOpportunity(
  hourlyRate: number,
  dFdt: number,
): number {
  const rateTerm = hourlyRate < 0 ? hourlyRate * 2.5 : hourlyRate;
  return rateTerm + SLOPE_WEIGHT * dFdt;
}

function locfRate(
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
    // Never allow switch cost above 0.5 bps Citadel cap
    this.rotationSlipBps = Math.min(
      MAX_ROTATION_SLIP_BPS,
      Math.max(0, rotationSlipBps),
    );
  }

  /**
   * Live one-shot pick — best of ETH/SOL/BTC given current rates + slopes.
   * Returns rotate=false when edge cannot clear 0.5 bps switch cost over hold window.
   */
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

      if (!this.enabled || rates.size < 3) {
        fundingPnlUsd += notional * ethR;
        if (this.enabled && rates.size < 3) holdHours += 1;
        if (!this.enabled) {
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

      // Rank by score; prefer strictly higher rate for short capture
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

      // Amortize switch cost over MIN_HOLD_HOURS of expected edge
      const slipUsd = (notional * this.rotationSlipBps) / 10_000;
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
      stub: !this.enabled,
      rotationSlipBps: this.rotationSlipBps,
    };
  }
}
