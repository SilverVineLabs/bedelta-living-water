/**
 * Internal Demo Simulator — 4 Roles × 6 Scenarios (24-Cell) matrix.
 * Sensor-to-plan only; adaptiveEngineEnabled ON/OFF benchmark comparison.
 * Unidirectional SystemState flow — no network I/O.
 */

export type DemoSimRole =
  | "RETAIL"
  | "PRO_TRADER"
  | "DAPP_INTEGRATOR"
  | "INSTITUTION";

export type DemoSimScenario =
  | "NORMAL_RANGING"
  | "HIGH_VOLATILITY_SQUEEZE"
  | "PREDATORY_MEV_ATTACK"
  | "FLASH_CRASH_BLACK_SWAN"
  | "LIQUIDITY_HOLE_VACUUM"
  | "ORACLE_RPC_DISTORTION";

export type DemoRiskStatus =
  | "STABLE"
  | "HARD_LOCK_ACTIVE"
  | "LIQUIDATED"
  | "DEGRADED";

export const DEMO_SIM_ROLES: readonly DemoSimRole[] = [
  "RETAIL",
  "PRO_TRADER",
  "DAPP_INTEGRATOR",
  "INSTITUTION",
] as const;

export const DEMO_SIM_SCENARIOS: readonly DemoSimScenario[] = [
  "NORMAL_RANGING",
  "HIGH_VOLATILITY_SQUEEZE",
  "PREDATORY_MEV_ATTACK",
  "FLASH_CRASH_BLACK_SWAN",
  "LIQUIDITY_HOLE_VACUUM",
  "ORACLE_RPC_DISTORTION",
] as const;

/** Notional capital USD by role (SSOT for demo matrix). */
export const DEMO_ROLE_CAPITAL_USD: Readonly<Record<DemoSimRole, number>> = {
  RETAIL: 1_000,
  PRO_TRADER: 50_000,
  DAPP_INTEGRATOR: 200_000,
  INSTITUTION: 2_000_000,
};

/** Extreme scenarios that liquidate when adaptive engine is OFF. */
const EXTREME_SCENARIOS: ReadonlySet<DemoSimScenario> = new Set([
  "HIGH_VOLATILITY_SQUEEZE",
  "PREDATORY_MEV_ATTACK",
  "FLASH_CRASH_BLACK_SWAN",
  "LIQUIDITY_HOLE_VACUUM",
  "ORACLE_RPC_DISTORTION",
]);

export interface DemoSimCellInput {
  role: DemoSimRole;
  scenario: DemoSimScenario;
  /** Adaptive risk engine master switch — default true (ON). */
  adaptiveEngineEnabled?: boolean;
}

export interface DemoSimCellResult {
  role: DemoSimRole;
  scenario: DemoSimScenario;
  capitalUsd: number;
  adaptiveEngineEnabled: boolean;
  slippageBps: number;
  executionLatencyMs: number;
  netYieldBps: number;
  ruinRiskPct: number;
  riskStatus: DemoRiskStatus;
  principalProtected: boolean;
}

export interface DemoSimMatrixInput {
  adaptiveEngineEnabled?: boolean;
}

export interface DemoSimMatrixResult {
  adaptiveEngineEnabled: boolean;
  cellCount: number;
  cells: DemoSimCellResult[];
}

function roleIndex(role: DemoSimRole): number {
  return DEMO_SIM_ROLES.indexOf(role);
}

function scenarioIndex(scenario: DemoSimScenario): number {
  return DEMO_SIM_SCENARIOS.indexOf(scenario);
}

/**
 * Deterministic OFF metrics: high slippage (8–15), slow (1200–1800ms), MEV loss.
 */
function metricsOff(
  role: DemoSimRole,
  scenario: DemoSimScenario,
): Pick<
  DemoSimCellResult,
  | "slippageBps"
  | "executionLatencyMs"
  | "netYieldBps"
  | "ruinRiskPct"
  | "riskStatus"
  | "principalProtected"
> {
  const ri = Math.max(0, roleIndex(role));
  const si = Math.max(0, scenarioIndex(scenario));
  const slippageBps = Number((8 + si * 1.2 + ri * 0.15).toFixed(2));
  const executionLatencyMs = Math.round(1200 + si * 100 + ri * 25);
  const extreme = EXTREME_SCENARIOS.has(scenario);
  const netYieldBps = extreme
    ? -15
    : Number((-2 - si * 0.5).toFixed(2));
  const liquidated = extreme && scenario !== "NORMAL_RANGING";

  return {
    slippageBps: Math.min(15, Math.max(8, slippageBps)),
    executionLatencyMs: Math.min(1800, Math.max(1200, executionLatencyMs)),
    netYieldBps,
    ruinRiskPct: liquidated ? 100 : scenario === "NORMAL_RANGING" ? 5 : 40,
    riskStatus: liquidated
      ? "LIQUIDATED"
      : scenario === "NORMAL_RANGING"
        ? "DEGRADED"
        : "LIQUIDATED",
    principalProtected: false,
  };
}

/**
 * Deterministic ON metrics: adaptive low slippage (0.8–1.2), 50ms, protected.
 */
function metricsOn(
  role: DemoSimRole,
  scenario: DemoSimScenario,
): Pick<
  DemoSimCellResult,
  | "slippageBps"
  | "executionLatencyMs"
  | "netYieldBps"
  | "ruinRiskPct"
  | "riskStatus"
  | "principalProtected"
> {
  const si = Math.max(0, scenarioIndex(scenario));
  const ri = Math.max(0, roleIndex(role));
  const slippageBps = Number((0.8 + si * 0.06 + ri * 0.02).toFixed(2));
  /** Mild positive edge; stress scenarios harvest anti-fragile spread. */
  const netYieldBps = Number(
    (scenario === "NORMAL_RANGING"
      ? 1.2 + ri * 0.1
      : 3.5 + si * 0.2 + ri * 0.05
    ).toFixed(2),
  );

  return {
    slippageBps: Math.min(1.2, Math.max(0.8, slippageBps)),
    executionLatencyMs: 50,
    netYieldBps,
    ruinRiskPct: 0,
    riskStatus: EXTREME_SCENARIOS.has(scenario)
      ? "HARD_LOCK_ACTIVE"
      : "STABLE",
    principalProtected: true,
  };
}

/**
 * Simulate one role × scenario cell under adaptive ON or OFF.
 */
export function simulateDemoCell(input: DemoSimCellInput): DemoSimCellResult {
  const adaptive =
    input.adaptiveEngineEnabled === undefined
      ? true
      : Boolean(input.adaptiveEngineEnabled);
  const capitalUsd = DEMO_ROLE_CAPITAL_USD[input.role];
  const m = adaptive
    ? metricsOn(input.role, input.scenario)
    : metricsOff(input.role, input.scenario);

  return {
    role: input.role,
    scenario: input.scenario,
    capitalUsd,
    adaptiveEngineEnabled: adaptive,
    ...m,
  };
}

/**
 * Build full 24-Cell matrix (4 roles × 6 scenarios).
 */
export function simulateDemoMatrix(
  input: DemoSimMatrixInput = {},
): DemoSimMatrixResult {
  const adaptive =
    input.adaptiveEngineEnabled === undefined
      ? true
      : Boolean(input.adaptiveEngineEnabled);
  const cells: DemoSimCellResult[] = [];
  for (const role of DEMO_SIM_ROLES) {
    for (const scenario of DEMO_SIM_SCENARIOS) {
      cells.push(
        simulateDemoCell({
          role,
          scenario,
          adaptiveEngineEnabled: adaptive,
        }),
      );
    }
  }
  return {
    adaptiveEngineEnabled: adaptive,
    cellCount: cells.length,
    cells,
  };
}

/**
 * Side-by-side ON vs OFF comparison for a single cell.
 */
export function compareDemoCellModes(
  role: DemoSimRole,
  scenario: DemoSimScenario,
): { on: DemoSimCellResult; off: DemoSimCellResult } {
  return {
    on: simulateDemoCell({ role, scenario, adaptiveEngineEnabled: true }),
    off: simulateDemoCell({ role, scenario, adaptiveEngineEnabled: false }),
  };
}

export class DemoSimulatorService {
  simulateCell(input: DemoSimCellInput): DemoSimCellResult {
    return simulateDemoCell(input);
  }

  simulateMatrix(input: DemoSimMatrixInput = {}): DemoSimMatrixResult {
    return simulateDemoMatrix(input);
  }

  compareModes(
    role: DemoSimRole,
    scenario: DemoSimScenario,
  ): { on: DemoSimCellResult; off: DemoSimCellResult } {
    return compareDemoCellModes(role, scenario);
  }
}
