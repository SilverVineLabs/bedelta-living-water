/**
 * SPDX-License-Identifier: BUSL-1.1
 * Copyright (c) 2026 SilverVine Labs. All Rights Reserved.
 */

import type { SoilResistanceResult } from "./soil-resistance";

/** SSOT — GMX v2 / HL cron + soil telemetry: ETH + BTC GM pools */
export const ALLOWED_SYMBOLS = ["ETH", "BTC"] as const;

export type AllowedTelemetrySymbol = (typeof ALLOWED_SYMBOLS)[number];

/** Normalize HL / DEX tickers for whitelist checks (strip -PERP / /USD suffixes). */
export function normalizeTelemetrySymbol(symbol: string): string {
  const base = symbol.trim().toUpperCase().split(/[-/]/)[0];
  return base || symbol.trim().toUpperCase();
}

/** True when symbol is in the Santenmoku target-pair whitelist SSOT. */
export function isAllowedTelemetrySymbol(symbol: string): boolean {
  return (ALLOWED_SYMBOLS as readonly string[]).includes(
    normalizeTelemetrySymbol(symbol),
  );
}

/** Drop non-target symbols before soil telemetry / depth probe loops. */
export function filterAllowedTelemetrySymbols(
  symbols: readonly string[],
): AllowedTelemetrySymbol[] {
  return symbols
    .map(normalizeTelemetrySymbol)
    .filter((sym): sym is AllowedTelemetrySymbol =>
      (ALLOWED_SYMBOLS as readonly string[]).includes(sym),
    );
}

/** Terminal log line for whitelisted soil probes — null when symbol filtered out. */
export function formatSoilTelemetryTerminalLine(
  symbol: string,
  result: Pick<SoilResistanceResult, "tripped" | "reasons">,
  depthUsd?: number,
): string | null {
  if (!isAllowedTelemetrySymbol(symbol)) return null;
  const sym = normalizeTelemetrySymbol(symbol);
  const depthLabel =
    depthUsd != null && Number.isFinite(depthUsd)
      ? `$${Math.round(depthUsd / 1000)}K`
      : "—";
  if (result.tripped) {
    return `SOIL_RESISTANCE_TRIP: REJECTED | symbol: ${sym} | reason: ${result.reasons[0] ?? "UNKNOWN"}`;
  }
  return `SOIL_RESISTANCE_PROBE: PASS | symbol: ${sym} | depth: ${depthLabel} | Tensile: 100%/20%`;
}

/** Target-pair depth probe presets for Section 3 terminal rotation. */
export function buildTargetPairTerminalLogTemplates(): readonly {
  level: "INFO" | "WARN";
  message: string;
}[] {
  const presets: readonly {
    symbol: AllowedTelemetrySymbol;
    depthUsd: number;
    tripped?: boolean;
    reason?: string;
  }[] = [
    { symbol: "ETH", depthUsd: 142_000 },
    {
      symbol: "ETH",
      depthUsd: 42_000,
      tripped: true,
      reason: "DEPTH_USD=42000<100000",
    },
  ];

  return presets.flatMap((preset) => {
    const line = formatSoilTelemetryTerminalLine(
      preset.symbol,
      {
        tripped: preset.tripped === true,
        reasons: preset.reason ? [preset.reason] : [],
      },
      preset.depthUsd,
    );
    if (!line) return [];
    return [
      {
        level: preset.tripped ? ("WARN" as const) : ("INFO" as const),
        message: line,
      },
    ];
  });
}
