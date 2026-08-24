/**
 * SPDX-License-Identifier: BUSL-1.1
 * Copyright (c) 2026 SilverVine Labs. All Rights Reserved.
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

/** Internal transfer friction (bps of notional) per switch — hard cap 0.5 bps */
export const DEFAULT_ROTATION_SLIP_BPS = 0.5 as const;
export const MAX_ROTATION_SLIP_BPS = 0.5 as const;
/** Min hours between switches */
export const MIN_HOLD_HOURS = 6;
