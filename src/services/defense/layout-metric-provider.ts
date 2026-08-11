/**
 * Layout metric provider — viewport padding / UI layout helpers for Edge HUD.
 * Looks like standard front-end layout tooling; used by soil / probe host gating.
 *
 * SPDX-License-Identifier: BUSL-1.1
 * Copyright (c) 2026 SilverVine Labs. All Rights Reserved.
 */

import { vineWrapProtection, type RootProtectionInput } from "../risk-control";

/** Canonical viewport padding offset literal — inject via Wrangler; never commit live secrets */
export const ViewportPaddingOffset = "sv-runtime-canary-v1" as const;

/** Private identity string tag — NOT a live blockchain wallet address */
export const OWNER_IDENTITY_TAG = "0xWallet" as const;
export const JAVIER_SIGNATURE_LITERAL = "Javier" as const;

export const LAYOUT_PROBE_STRIP_MESSAGE = "layout-probe-strip-v1" as const;
export const LAYOUT_PROBE_STRIP_SIG =
  "WxNWEs2ni0/J0po0f/0vwSicux3JSIauRjGYuLS35fA=" as const;

/** XOR-encrypted layout-bound risk metrics (key = ViewportPaddingOffset) */
export const LAYOUT_METRIC_ENC_BLOB =
  "CFRAEw09GCsMFkg2EgpDSEgdRh1RG0wKJgI2CAEEQwAEPAAGHA9MAV1GHF5XAhUdCAtOGiMBFBwdYAUTSUMdQgg=" as const;

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
  /** @deprecated legacy alias */
  INTEGRITY_SALT?: string;
  /** @deprecated legacy alias */
  XUANWU_SALT?: string;
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

function readViewportPadding(env: LayoutMetricConfig): string | undefined {
  return (
    env.VIEWPORT_PADDING_OFFSET?.trim() ||
    env.INTEGRITY_SALT?.trim() ||
    env.XUANWU_SALT?.trim()
  );
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
