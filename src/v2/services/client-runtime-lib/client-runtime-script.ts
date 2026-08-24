/**
 * Serialize injectable client helpers for the vanilla dashboard script block.
 */

import {
  calculateRiskScore,
  calculateRiskScoreFromTrippedRoots,
  formatRiskIndexLabel,
  isToxicModeTripped,
  resolveRiskIndexBand,
  resolveRootStatus,
  rootStatusToScore,
  statusesFromTrippedRoots,
  tierAverageScore,
} from "../risk-engine";
import {
  checkRoot17DailyLimit,
  createRoot17DailyState,
  normalizeRoot17State,
  recordRoot17SlTrip,
  utcDayKey,
} from "../root17-daily";
import { checkSoilResistance, getHktHour, isTsunamiShieldWindow } from "../../../services/risk-control";
import {
  formatFrictionLabel,
  formatGatewayLabel,
  formatPgateStatusLabel,
  formatTensileLabel,
  resolveLiveFrictionRatio,
} from "../../../services/hmi-formatters";
import {
  enrichSystemStateVectorEquilibrium,
  resolveActiveNode,
  resolveEquilibriumMode,
} from "../../../services/vector-equilibrium";
import { assertFlashHardLocks, checkRoleEligibility, resolveUserMode } from "../step1-engine";
import {
  estimateSlipLossUsd,
  exceedsMaxRiskBoundary,
  resolveAttackLock,
  resolveRoot8SlippageLock,
  resolveRootTelemetryDisplayStatus,
} from "../trade-pipeline";
import {
  canAccessFaultInjection,
  canAccessTelemetryAudit,
  canEditRiskPresets,
  canToggleMasterBreaker,
  canUseOrderEntry,
  isDemoReadOnly,
  resolveDemoRole,
} from "../demo-roles";
import {
  calculateRootDefenseMatrixFromStatuses,
  calculateRootDefenseMatrixScore,
  clampTensileScore,
  computeDailyLossCapUsd,
  computeEffectiveMaxSlUsd,
  computeOrderAwareMaxSlUsd,
  computeSoilRiskUsd,
  dynamicMaxSlPct,
  formatDynSlLockTag,
  formatRootDefenseMatrixLabel,
  normalizeTriggeredRoots,
  resolveRootDefenseMatrixBand,
  sanitizeAccountEquityUsd,
  trippedRootsFromStatuses,
} from "./client-runtime-reexports";
import { buildClientRuntimeConstantsBlock } from "./client-runtime-script-constants";

export function clientRuntimeScript(): string {
  const fns = [
    normalizeTriggeredRoots,
    calculateRootDefenseMatrixFromStatuses,
    calculateRootDefenseMatrixScore,
    formatRootDefenseMatrixLabel,
    resolveRootDefenseMatrixBand,
    trippedRootsFromStatuses,
    computeEffectiveMaxSlUsd,
    computeOrderAwareMaxSlUsd,
    computeDailyLossCapUsd,
    computeSoilRiskUsd,
    sanitizeAccountEquityUsd,
    dynamicMaxSlPct,
    formatDynSlLockTag,
    clampTensileScore,
    estimateSlipLossUsd,
    exceedsMaxRiskBoundary,
    rootStatusToScore,
    resolveRootStatus,
    tierAverageScore,
    calculateRiskScore,
    calculateRiskScoreFromTrippedRoots,
    statusesFromTrippedRoots,
    resolveRiskIndexBand,
    formatRiskIndexLabel,
    isToxicModeTripped,
    getHktHour,
    isTsunamiShieldWindow,
    checkSoilResistance,
    resolveRoot8SlippageLock,
    resolveAttackLock,
    resolveRootTelemetryDisplayStatus,
    checkRoleEligibility,
    assertFlashHardLocks,
    utcDayKey,
    createRoot17DailyState,
    normalizeRoot17State,
    checkRoot17DailyLimit,
    recordRoot17SlTrip,
    resolveUserMode,
    resolveDemoRole,
    isDemoReadOnly,
    canAccessFaultInjection,
    canUseOrderEntry,
    canEditRiskPresets,
    canAccessTelemetryAudit,
    canToggleMasterBreaker,
    enrichSystemStateVectorEquilibrium,
    resolveActiveNode,
    resolveEquilibriumMode,
    formatPgateStatusLabel,
    formatTensileLabel,
    formatFrictionLabel,
    formatGatewayLabel,
    resolveLiveFrictionRatio,
  ];

  return (
    buildClientRuntimeConstantsBlock() +
    "\n" +
    fns
      .map((fn) => fn.toString())
      .join("\n")
  );
}
