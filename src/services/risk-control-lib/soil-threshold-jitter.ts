/**
 * SPDX-License-Identifier: BUSL-1.1
 * Copyright (c) 2026 SilverVine Labs. All Rights Reserved.
 * Dynamic ±2–5 bps threshold jitter — unpredicatable MEV cutoff surface.
 */

import {
  MAX_SLIPPAGE,
  resolveSoilMinDepthUsd,
  type SoilResistanceInput,
} from "./soil-resistance-types";

export const JITTER_MIN_BPS = 2;
export const JITTER_MAX_BPS = 5;

function isJitterEnabled(input: SoilResistanceInput, forceEnable?: boolean): boolean {
  if (forceEnable) return true;
  if (input.disableThresholdJitter) return false;
  if (typeof process !== "undefined" && process.env?.VITEST === "true") return false;
  return true;
}

function sampleJitterBps(): { magnitudeBps: number; sign: 1 | -1 } {
  const buf = new Uint32Array(1);
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    crypto.getRandomValues(buf);
  } else {
    buf[0] = (Date.now() * 2654435761) >>> 0;
  }
  const span = JITTER_MAX_BPS - JITTER_MIN_BPS + 1;
  const word = buf[0];
  const magnitudeBps = JITTER_MIN_BPS + (word % span);
  const sign: 1 | -1 = (word >>> 16) & 1 ? -1 : 1;
  return { magnitudeBps, sign };
}

export function resolveJitteredSoilThresholds(
  input: SoilResistanceInput,
  options?: { forceEnable?: boolean },
): { slippageFuse: number; minDepthUsd: number } {
  const baseSlippage = input.maxSlippage ?? MAX_SLIPPAGE;
  const baseMinDepth = resolveSoilMinDepthUsd(input);

  if (!isJitterEnabled(input, options?.forceEnable)) {
    return { slippageFuse: baseSlippage, minDepthUsd: baseMinDepth };
  }

  const { magnitudeBps, sign } = sampleJitterBps();
  const deltaRatio = (sign * magnitudeBps) / 10_000;
  const slippageFuse = Math.max(0, baseSlippage + deltaRatio);
  const minDepthUsd = Math.max(0, Math.floor(baseMinDepth * (1 + deltaRatio)));
  return { slippageFuse, minDepthUsd };
}
