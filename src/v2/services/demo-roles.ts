/**
 * Demo Control Hub persona roles — Trader / Auditor / Risk Manager.
 */

export type DemoPersonaRole = "TRADER" | "AUDITOR" | "RISK_MANAGER";

export interface DemoRoleConfig {
  id: DemoPersonaRole;
  label: string;
  themeClass: string;
  readOnly: boolean;
  faultInjection: boolean;
  orderEntry: boolean;
  riskPresetOverrides: boolean;
  telemetryAudit: boolean;
  masterBreaker: boolean;
  banner: string;
}

export const DEMO_ROLE_CONFIG: Readonly<Record<DemoPersonaRole, DemoRoleConfig>> =
  {
    TRADER: {
      id: "TRADER",
      label: "Trader",
      themeClass: "role-trader",
      readOnly: false,
      faultInjection: false,
      orderEntry: true,
      riskPresetOverrides: false,
      telemetryAudit: false,
      masterBreaker: false,
      banner: "[ TRADER MODE · ORDER ENTRY ENABLED ]",
    },
    AUDITOR: {
      id: "AUDITOR",
      label: "Auditor",
      themeClass: "role-auditor",
      readOnly: true,
      faultInjection: false,
      orderEntry: false,
      riskPresetOverrides: false,
      telemetryAudit: true,
      masterBreaker: false,
      banner: "[ AUDIT READ-ONLY MODE · 20-ROOT TELEMETRY UNLOCKED ]",
    },
    RISK_MANAGER: {
      id: "RISK_MANAGER",
      label: "Risk Manager",
      themeClass: "role-risk-manager",
      readOnly: false,
      faultInjection: true,
      orderEntry: true,
      riskPresetOverrides: true,
      telemetryAudit: true,
      masterBreaker: true,
      banner: "[ RISK MANAGER · FULL RISK SANDBOX UNLOCKED ]",
    },
  };

export type FaultInjectionPreset =
  | "HIGH_SLIPPAGE"
  | "TOXIC_OVERLOAD"
  | "RESET_TOXIC"
  /** @deprecated Prefer TOXIC_OVERLOAD */
  | "HIGH_VOLATILITY"
  /** @deprecated Prefer TOXIC_OVERLOAD */
  | "RISK_SCORE_SPIKE";

export interface FaultInjectionAction {
  id: FaultInjectionPreset;
  label: string;
  description: string;
}

export const FAULT_INJECTION_ACTIONS: ReadonlyArray<FaultInjectionAction> = [
  {
    id: "HIGH_SLIPPAGE",
    label: "[Simulate High Slippage > 0.5%]",
    description: "Trips Root 8 (Tier 2) slippage breaker — soil danger path",
  },
  {
    id: "TOXIC_OVERLOAD",
    label: "[Simulate Toxic Overload (CRI 85)]",
    description: "Forces ROOT DEFENSE MATRIX to 20 and trips Toxic Mode",
  },
  {
    id: "RESET_TOXIC",
    label: "[Reset Toxic Circuit Breaker]",
    description: "Clears Toxic Mode override, modal, and execution cooldown",
  },
];

export function resolveDemoRole(raw: unknown): DemoPersonaRole {
  const id = String(raw ?? "").toUpperCase();
  if (id === "AUDITOR") return "AUDITOR";
  if (id === "RISK_MANAGER" || id === "JAVIER") return "RISK_MANAGER";
  return "TRADER";
}

export function isDemoReadOnly(role: DemoPersonaRole): boolean {
  return DEMO_ROLE_CONFIG[role].readOnly;
}

export function canAccessFaultInjection(role: DemoPersonaRole): boolean {
  return DEMO_ROLE_CONFIG[role].faultInjection;
}

export function canUseOrderEntry(role: DemoPersonaRole): boolean {
  return DEMO_ROLE_CONFIG[role].orderEntry;
}

export function canEditRiskPresets(role: DemoPersonaRole): boolean {
  return DEMO_ROLE_CONFIG[role].riskPresetOverrides;
}

export function canAccessTelemetryAudit(role: DemoPersonaRole): boolean {
  return DEMO_ROLE_CONFIG[role].telemetryAudit;
}

export function canToggleMasterBreaker(role: DemoPersonaRole): boolean {
  return DEMO_ROLE_CONFIG[role].masterBreaker;
}
