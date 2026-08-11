/**
 * SPDX-License-Identifier: BUSL-1.1
 * Copyright (c) 2026 SilverVine Labs. All Rights Reserved.
 */

export type RiskLogLevel = "info" | "warn" | "error";

export type RiskEvent =
  | "SOIL_RESISTANCE_PASS"
  | "SOIL_RESISTANCE_TRIP"
  | "ROOT_PROTECTION_PASS"
  | "ROOT_PROTECTION_TRIP"
  | "CRI_HARDLOCK";

/** Structured risk log payload — always JSON-serializable */
export interface RiskLogPayload {
  level: RiskLogLevel;
  module: "risk-control";
  event: RiskEvent;
  symbol: string;
  timestamp: string;
  message: string;
  details: Record<string, number | string | boolean | null>;
}

export function isoNow(): string {
  return new Date().toISOString();
}

/**
 * Emit structured risk logs for CF Workers / log drains.
 * Info/PASS emissions are intentionally silent — only warn/error (trips) surface.
 */
export function emitRiskLog(payload: RiskLogPayload): void {
  if (payload.level === "info") return;
  const line = JSON.stringify(payload);
  if (payload.level === "error") {
    console.error(line);
  } else {
    console.warn(line);
  }
}

/**
 * Serialize trip reasons for structured logs.
 * Empty / blank joins fall back to `"none"` so log drains never see `reasons: ""`.
 */
export function formatTripReasons(reasons: string[]): string {
  return reasons.join("|") || "none";
}
