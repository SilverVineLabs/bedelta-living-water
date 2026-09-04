/**
 * SPDX-License-Identifier: BUSL-1.1
 * Copyright (c) 2026 SilverVine Labs. All Rights Reserved.
 */

/** HKT tsunami shield window — 21:00–23:00 locks soil resistance */
export const TSUNAMI_SHIELD_HKT_START = 21;
export const TSUNAMI_SHIELD_HKT_END = 23;

/** Hong Kong is fixed UTC+8 — no DST; avoids Intl.DateTimeFormat alloc on hot path. */
const HKT_OFFSET_MS = 8 * 3_600_000;

/** Current hour in Hong Kong (UTC+8), 0–23 */
export function getHktHour(now: Date = new Date()): number {
  return new Date(now.getTime() + HKT_OFFSET_MS).getUTCHours();
}

/** True during HKT 21:00–22:59 — US open tsunami volatility window */
export function isTsunamiShieldWindow(now: Date = new Date()): boolean {
  const h = getHktHour(now);
  return h >= TSUNAMI_SHIELD_HKT_START && h < TSUNAMI_SHIELD_HKT_END;
}

/** Hyperliquid orderbook gap / market-close windows — HKT tsunami + UTC weekend. */
export function isHlOrderbookGapWindow(now: Date = new Date()): boolean {
  if (isTsunamiShieldWindow(now)) return true;
  const day = now.getUTCDay();
  return day === 0 || day === 6;
}
