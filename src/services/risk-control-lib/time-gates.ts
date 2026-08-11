/**
 * SPDX-License-Identifier: BUSL-1.1
 * Copyright (c) 2026 SilverVine Labs. All Rights Reserved.
 */

/** HKT tsunami shield window — 21:00–23:00 locks soil resistance */
export const TSUNAMI_SHIELD_HKT_START = 21;
export const TSUNAMI_SHIELD_HKT_END = 23;

/** Current hour in Hong Kong (UTC+8), 0–23 */
export function getHktHour(now: Date = new Date()): number {
  const hour = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Hong_Kong",
    hour: "2-digit",
    hour12: false,
  }).format(now);
  return parseInt(hour, 10);
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
