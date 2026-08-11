import type { SystemState } from "../../services/systemState";
import type { MatrixRow } from "../../types/matrix";
import type { MatrixApiSnapshot } from "../services/matrix-api";
import type { Step1ScanResult } from "../types/step1";
import { calculateRiskScoreFromTrippedRoots } from "../services/risk-engine";
import { STEP1_ROOT_KEYS } from "../types/step1";

export interface LiveDashboardViewModel {
  criScore: number;
  hardlock: boolean;
  maxLossUsd: number;
  vix: number;
  dvol: number;
  matrixRows: MatrixRow[];
  timestampHkt?: string;
  systemState?: SystemState;
}

function trippedRootNums(matrixDetails: Record<string, boolean>): number[] {
  return Object.entries(matrixDetails)
    .filter(([, passed]) => !passed)
    .map(([key]) => {
      const match = /^root(\d+)_/.exec(key);
      return match ? Number(match[1]) : 0;
    })
    .filter((n) => n > 0);
}

/** Merge authoritative `/api/data` systemState into the Step 1 scan shell. */
export function mergeStep1WithApiSnapshot(
  step1: Step1ScanResult,
  snapshot: MatrixApiSnapshot | null,
): Step1ScanResult {
  if (!snapshot) return step1;

  const { payload } = snapshot;
  const systemState = payload.systemState;
  if (!systemState) return step1;

  const hardlock = systemState.hardlock;
  const riskScore =
    100 - Math.max(0, Math.min(100, systemState.currentCri));

  return {
    ...step1,
    status: hardlock ? "LOCKED" : step1.status,
    maxLossUSD: systemState.dynamicMaxSL,
    risk_score: riskScore,
    activeLockReason: hardlock
      ? (step1.activeLockReason ?? "System hardlock — signing channel severed")
      : step1.activeLockReason,
    matrixDetails: {
      ...step1.matrixDetails,
      root10_tsunamiShield: payload.tsunami_shield_active !== true,
    },
  };
}

export function buildLiveDashboardViewModel(
  step1: Step1ScanResult,
  snapshot: MatrixApiSnapshot | null,
  fallbackVix: number,
  fallbackDvol: number,
): LiveDashboardViewModel {
  const merged = mergeStep1WithApiSnapshot(step1, snapshot);
  const systemState = snapshot?.payload.systemState;
  const riskScore =
    merged.risk_score ??
    calculateRiskScoreFromTrippedRoots(trippedRootNums(merged.matrixDetails));

  return {
    criScore: systemState?.currentCri ?? Math.max(0, Math.min(100, 100 - riskScore)),
    hardlock: systemState?.hardlock ?? merged.status === "LOCKED",
    maxLossUsd: systemState?.dynamicMaxSL ?? merged.maxLossUSD,
    vix: snapshot?.payload.vix_traditional ?? snapshot?.payload.vix ?? fallbackVix,
    dvol: snapshot?.payload.dvol_crypto ?? fallbackDvol,
    matrixRows: snapshot?.payload.data ?? snapshot?.payload.matrix ?? [],
    timestampHkt: snapshot?.payload.timestamp_hkt,
    systemState,
  };
}

export function allStep1RootsPassing(
  matrixDetails: Record<string, boolean>,
): boolean {
  return STEP1_ROOT_KEYS.every((key) => matrixDetails[key] === true);
}
