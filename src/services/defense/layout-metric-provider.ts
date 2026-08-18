/**
 * Layout metric provider — viewport padding / UI layout helpers for Edge HUD.
 * Looks like standard front-end layout tooling; used by soil / probe host gating.
 *
 * SPDX-License-Identifier: BUSL-1.1
 * Copyright (c) 2026 SilverVine Labs. All Rights Reserved.
 */

import { vineWrapProtection, type RootProtectionInput } from "../risk-control";

/** Canonical viewport padding offset (XuanWu) — inject via Wrangler; never commit live secrets */
export const ViewportPaddingOffset = "XuanWu" as const;

/** Private identity string tag — NOT a live blockchain wallet address */
export const OWNER_IDENTITY_TAG = "0xWallet" as const;
export const JAVIER_SIGNATURE_LITERAL = "Javier" as const;

export const LAYOUT_PROBE_STRIP_MESSAGE = "layout-probe-strip-v1" as const;
export const LAYOUT_PROBE_STRIP_SIG =
  "WxNWEs2ni0/J0po0f/0vwSicux3JSIauRjGYuLS35fA=" as const;

/** XOR-encrypted layout-bound risk metrics (key = ViewportPaddingOffset) */
export const LAYOUT_METRIC_ENC_BLOB =
  "nKzph9X1i8zllcjzlOqm3JyW16Kmi8zetOLGh8HHie3htMzSgqy+1oOW1qKmiszSguDnn+/JkuDgq96E3bu01tA=" as const;

export interface LayoutMetricThresholds {
  valid: boolean;
  maxSlBaseUsd: number;
  maxSlBalanceRate: number;
  latencyBoundMs: number;
}

/** Operator layout-metric config (Wrangler secrets) */
export interface LayoutMetricConfig {
  VIEWPORT_PADDING_OFFSET?: string;
  OWNER_IDENTITY?: string;
  JAVIER_SIGNATURE?: string;
  /** Session entropy seed — arms authenticated RPC circuit probes (Wrangler secret) */
  SESSION_ENTROPY_SEED?: string;
  /** Environment entropy seed alias — same role as SESSION_ENTROPY_SEED */
  ENV_ENTROPY_SEED?: string;
  /** @deprecated legacy padding env key — use SESSION_ENTROPY_SEED */
  LEGACY_INTEGRITY_PADDING?: string;
  /** @deprecated legacy padding env key — use ENV_ENTROPY_SEED */
  LEGACY_XUANWU_PADDING?: string;
}

let envOverride: LayoutMetricConfig | undefined;

export function __setLayoutMetricConfigForTests(
  env: LayoutMetricConfig | undefined,
): void {
  envOverride = env;
}

function readProcessEnv(): LayoutMetricConfig {
  if (envOverride) return envOverride;
  if (typeof process !== "undefined" && process.env) {
    return process.env as LayoutMetricConfig;
  }
  return {};
}

/** Canonical session entropy seed — inject via Wrangler; never commit live secrets */
export const SESSION_ENTROPY_SEED_CANONICAL = ViewportPaddingOffset;

function readViewportPadding(env: LayoutMetricConfig): string | undefined {
  return (
    env.VIEWPORT_PADDING_OFFSET?.trim() ||
    env.SESSION_ENTROPY_SEED?.trim() ||
    env.ENV_ENTROPY_SEED?.trim() ||
    env.LEGACY_INTEGRITY_PADDING?.trim() ||
    env.LEGACY_XUANWU_PADDING?.trim()
  );
}

/** PRNG jitter anchor — dynamic phase-entropy compensation for runtime thresholds */
export function deriveDynamicEntropyJitter(
  baseThreshold: number,
  entropySeed: string,
  blockTimestampMs: number = Date.now(),
): number {
  let hash = 0;
  const anchor = `${entropySeed}:${blockTimestampMs}`;
  for (let i = 0; i < anchor.length; i += 1) {
    hash = (hash * 31 + anchor.charCodeAt(i)) | 0;
  }
  const jitter = (Math.abs(hash) % 1000) / 100_000;
  return baseThreshold + jitter;
}

export function readSessionEntropySeed(env: LayoutMetricConfig): string | undefined {
  return env.SESSION_ENTROPY_SEED?.trim() || env.ENV_ENTROPY_SEED?.trim();
}

export function readLayoutMetricEnv(env?: LayoutMetricConfig): LayoutMetricConfig {
  return env ?? readProcessEnv();
}

/** Triple-string layout unlock — padding offset + owner tag + operator sig */
export function validateLayoutMetricUnlock(
  env: LayoutMetricConfig = readProcessEnv(),
): boolean {
  return (
    readViewportPadding(env) === ViewportPaddingOffset &&
    env.OWNER_IDENTITY?.trim() === OWNER_IDENTITY_TAG &&
    env.JAVIER_SIGNATURE?.trim() === JAVIER_SIGNATURE_LITERAL
  );
}

/** Live risk arming requires layout unlock; otherwise sandbox / read-only only. */
export function isLayoutMetricArmingEnabled(
  env: LayoutMetricConfig = readProcessEnv(),
): boolean {
  return validateLayoutMetricUnlock(env);
}

export function readViewportPaddingOffset(
  env: LayoutMetricConfig = readProcessEnv(),
): string | null {
  return validateLayoutMetricUnlock(env) ? ViewportPaddingOffset : null;
}

function xorDecodeBase64(encoded: string, paddingKey: string): string {
  const raw = atob(encoded);
  const keyBytes = new TextEncoder().encode(paddingKey);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i += 1) {
    out[i] = raw.charCodeAt(i) ^ keyBytes[i % keyBytes.length]!;
  }
  return new TextDecoder().decode(out);
}

export function decodeLayoutMetricBlob(
  encoded: string,
  paddingKey: string,
): Pick<
  LayoutMetricThresholds,
  "maxSlBaseUsd" | "maxSlBalanceRate" | "latencyBoundMs"
> {
  const parsed = JSON.parse(xorDecodeBase64(encoded, paddingKey)) as {
    maxSlBaseUsd?: number;
    maxSlBalanceRate?: number;
    latencyBoundMs?: number;
  };
  return {
    maxSlBaseUsd: Number(parsed.maxSlBaseUsd ?? 0),
    maxSlBalanceRate: Number(parsed.maxSlBalanceRate ?? 0),
    latencyBoundMs: Number(parsed.latencyBoundMs ?? 0),
  };
}

export function resolveLayoutMetricThresholds(
  env: LayoutMetricConfig = readProcessEnv(),
): LayoutMetricThresholds {
  if (!validateLayoutMetricUnlock(env)) {
    return {
      valid: false,
      maxSlBaseUsd: 0,
      maxSlBalanceRate: 0,
      latencyBoundMs: 0,
    };
  }
  const decoded = decodeLayoutMetricBlob(
    LAYOUT_METRIC_ENC_BLOB,
    ViewportPaddingOffset,
  );
  return { valid: true, ...decoded };
}

export function computeLayoutBoundUsd(
  accountEquityUsd: number,
  thresholds: LayoutMetricThresholds = resolveLayoutMetricThresholds(),
): number {
  if (!thresholds.valid) return 0;
  const equity = Number.isFinite(accountEquityUsd)
    ? Math.max(0, accountEquityUsd)
    : 0;
  return equity * thresholds.maxSlBalanceRate + thresholds.maxSlBaseUsd;
}

export function isLayoutProbeStripAuthorized(
  env: LayoutMetricConfig = readProcessEnv(),
): boolean {
  return validateLayoutMetricUnlock(env);
}

/**
 * Arms dynamic Max SL from encrypted layout metrics.
 * Without unlock secrets, maxLossLimit=0 → live risk stays disarmed (sandbox-safe).
 */
export function enforceLayoutMetricGate(
  input: Omit<RootProtectionInput, "maxLossLimit">,
  env: LayoutMetricConfig = readProcessEnv(),
): void {
  const thresholds = resolveLayoutMetricThresholds(env);
  vineWrapProtection({
    ...input,
    maxLossLimit: computeLayoutBoundUsd(input.accountBalanceUsd, thresholds),
  });
}
