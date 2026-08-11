import { BRAND_DELTA_SYMBOL } from "../../../config/constants";
import {
  computeEffectiveMaxSlUsd,
  DEFAULT_ACCOUNT_EQUITY_USD,
} from "../../../services/effective-max-sl";

export type RootTelemetryStatus =
  | "ACTIVE"
  | "ENGAGED"
  | "READY"
  | "STANDBY"
  | "PASS"
  | "FAIL"
  | "TRIPPED";

export interface RootTelemetryRow {
  root: number;
  label: string;
  status: RootTelemetryStatus;
}

function dynamicMaxSlLabel(equity = DEFAULT_ACCOUNT_EQUITY_USD): string {
  return `$${computeEffectiveMaxSlUsd(equity).toFixed(0)}`;
}

function dynamicDailyCapLabel(equity = DEFAULT_ACCOUNT_EQUITY_USD): string {
  return `$${(computeEffectiveMaxSlUsd(equity) * 3).toFixed(0)}`;
}

/** Canonical 20-Root Defense Matrix telemetry labels for Demo Control Hub. */
export const ROOT_DEFENSE_TELEMETRY: ReadonlyArray<{
  root: number;
  label: string;
  defaultStatus: RootTelemetryStatus;
}> = [
  {
    root: 1,
    label: `Max Loss Weld (${dynamicMaxSlLabel()})`,
    defaultStatus: "ENGAGED",
  },
  { root: 2, label: "Geo Jurisdiction Lock", defaultStatus: "READY" },
  { root: 3, label: "checkSoilResistance()", defaultStatus: "ACTIVE" },
  { root: 4, label: "Close Spike Window", defaultStatus: "READY" },
  { root: 5, label: "VIX / DVOL Macro Fuse", defaultStatus: "ACTIVE" },
  {
    root: 6,
    label: "Beginner Cap Gate & Preset Modes",
    defaultStatus: "READY",
  },
  {
    root: 7,
    label: "Pre-Calculated Risk Boundary Lock",
    defaultStatus: "ENGAGED",
  },
  { root: 8, label: "Slippage Breaker (0.5%)", defaultStatus: "ACTIVE" },
  {
    root: 9,
    label: "Cross-Venue Yield Discrepancy",
    defaultStatus: "READY",
  },
  {
    root: 10,
    label: "Settlement Lockdown (<5m Window)",
    defaultStatus: "READY",
  },
  {
    root: 11,
    label: "Funding Extreme Simulation",
    defaultStatus: "READY",
  },
  {
    root: 12,
    label: `${BRAND_DELTA_SYMBOL}-Neutral Basis Arbitrage Shield`,
    defaultStatus: "STANDBY",
  },
  {
    root: 13,
    label: "Session & Address Auth Gatekeeper",
    defaultStatus: "ACTIVE",
  },
  {
    root: 14,
    label: "ClOID Anti-Replay & Deduplication",
    defaultStatus: "READY",
  },
  {
    root: 15,
    label: "Friction & Gas Cost Safeguard",
    defaultStatus: "READY",
  },
  {
    root: 16,
    label: "Order Depth-Impact Circuit Breaker",
    defaultStatus: "STANDBY",
  },
  {
    root: 17,
    label: `Daily Drawdown Cap (${dynamicDailyCapLabel()} · 3 SL/day)`,
    defaultStatus: "READY",
  },
  {
    root: 18,
    label: "Direct Access & Direct Bypass Circuit Lock",
    defaultStatus: "READY",
  },
  {
    root: 19,
    label: "ClOID Live Order Status & Execution Audit",
    defaultStatus: "ACTIVE",
  },
  { root: 20, label: "Post-Trade Review Closure", defaultStatus: "ACTIVE" },
];

/** Tier 1–4 root index ranges for Demo Control Hub telemetry grouping */
export const ROOT_TELEMETRY_TIER_ROOTS = {
  TIER1: [1, 2, 3, 4, 5, 6],
  TIER2: [7, 8, 9, 10, 11, 12],
  TIER3: [13, 14, 15, 16, 17, 18],
  TIER4: [19, 20],
} as const;

export function buildRootTelemetryRows(
  overrides: Partial<Record<number, RootTelemetryStatus>> = {},
): RootTelemetryRow[] {
  return ROOT_DEFENSE_TELEMETRY.map((row) => ({
    root: row.root,
    label: row.label,
    status: overrides[row.root] ?? row.defaultStatus,
  }));
}

/** CRI demo statuses mapped to telemetry badge labels — never returns undefined. */
export type RootCriDemoStatus = "PASS" | "WARN" | "TRIPPED";

export function resolveRootTelemetryDisplayStatus(
  row: {
    status?: RootTelemetryStatus;
    defaultStatus: RootTelemetryStatus;
  },
  criStatus?: RootCriDemoStatus,
): RootTelemetryStatus {
  if (criStatus === "TRIPPED") return "TRIPPED";
  if (criStatus === "WARN") return "ENGAGED";
  return row.status ?? row.defaultStatus ?? "PASS";
}
