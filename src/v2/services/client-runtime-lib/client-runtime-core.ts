/**
 * Browser-runtime mirrors for dashboard client script injection.
 * Keep logic identical to server modules — injected via .toString() in dashboard.ts.
 */

import {
  computeDailyLossCapUsd,
  computeEffectiveMaxSlUsd,
  computeOrderAwareMaxSlUsd,
  DYNAMIC_MAX_SL_BALANCE_RATE,
  DYNAMIC_MAX_SL_BASE_USD,
  DAILY_LOSS_CAP_MULTIPLIER,
  DEFAULT_ACCOUNT_EQUITY_USD,
  dynamicMaxSlPct,
  formatDynSlLockTag,
  MAX_DAILY_SL_COUNT,
  sanitizeAccountEquityUsd,
} from "../../../services/effective-max-sl";
import {
  clampTensileScore,
  computeSoilRiskUsd,
} from "../../../core/risk";
import {
  calculateRootDefenseMatrixFromStatuses,
  calculateRootDefenseMatrixScore,
  formatRootDefenseMatrixLabel,
  normalizeTriggeredRoots,
  resolveRootDefenseMatrixBand,
  ROOT_DEFENSE_MATRIX_HUD_CONFIG,
  ROOT_DEFENSE_SCORE_MAX,
  ROOT_DEFENSE_SCORE_MIN,
  ROOT_DEFENSE_TIER_4_ROOTS,
  ROOT_DEFENSE_TIER_PENALTY_BY_ROOT,
  trippedRootsFromStatuses,
} from "../../../services/cri-engine";
import {
  calculateRiskScore,
  calculateRiskScoreFromTrippedRoots,
  CRI_TIER_DEFINITIONS,
  formatRiskIndexLabel,
  isToxicModeTripped,
  resolveRiskIndexBand,
  resolveRootStatus,
  RISK_INDEX_HUD_CONFIG,
  ROOT_STATUS_SCORE,
  rootStatusToScore,
  statusesFromTrippedRoots,
  tierAverageScore,
  TOXIC_MODE_COOLDOWN_MS,
  TOXIC_MODE_THRESHOLD,
  TOXICITY_ELEVATED_THRESHOLD,
} from "../risk-engine";
import {
  checkRoot17DailyLimit,
  createRoot17DailyState,
  normalizeRoot17State,
  recordRoot17SlTrip,
  utcDayKey,
  type Root17DailyState,
} from "../root17-daily";
import {
  checkSoilResistance,
  getHktHour,
  isTsunamiShieldWindow,
  MAX_SLIPPAGE,
  MIN_DEPTH_USD,
} from "../../../services/risk-control";
import {
  EQUILIBRIUM_DYNAMIC_CRI_MIN,
  EQUILIBRIUM_GUARD_CRI_MIN,
  ROOT8_SLIPPAGE_LOCK_LABEL,
  R1018_SLIPPAGE_LOCK_LABEL,
  ROOT_DEFENSE_ELEVATED_MIN,
  ROOT_DEFENSE_OPTIMAL_MIN,
} from "../../../config/constants";
import {
  formatFrictionLabel,
  formatGatewayLabel,
  formatPgateStatusLabel,
  formatTensileLabel,
  resolveLiveFrictionRatio,
} from "../../../services/hmi-formatters";
import {
  TOPOLOGY_NODE_UI,
  TOPOLOGY_DELTA_CRI_MAX,
  TOPOLOGY_LAMBDA_CRI_MIN,
  enrichSystemStateVectorEquilibrium,
  resolveActiveNode,
  resolveEquilibriumMode,
  EQUILIBRIUM_MODE_UI,
} from "../../../services/vector-equilibrium";
import {
  assertFlashHardLocks,
  checkRoleEligibility,
  HL_RESTRICTED_COUNTRIES,
  ROLE_LOCK_TIPS,
  ROLE_TX_THRESHOLDS,
  resolveUserMode,
} from "../step1-engine";
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
  DEMO_ROLE_CONFIG,
  isDemoReadOnly,
  resolveDemoRole,
} from "../demo-roles";

export {
  calculateRootDefenseMatrixFromStatuses,
  calculateRootDefenseMatrixScore,
  formatRootDefenseMatrixLabel,
  normalizeTriggeredRoots,
  resolveRootDefenseMatrixBand,
  ROOT_DEFENSE_MATRIX_HUD_CONFIG,
  ROOT_DEFENSE_SCORE_MAX,
  ROOT_DEFENSE_SCORE_MIN,
  ROOT_DEFENSE_TIER_PENALTY_BY_ROOT,
  trippedRootsFromStatuses,
  assertFlashHardLocks,
  calculateRiskScore,
  calculateRiskScoreFromTrippedRoots,
  checkRoleEligibility,
  checkRoot17DailyLimit,
  computeDailyLossCapUsd,
  computeEffectiveMaxSlUsd,
  computeOrderAwareMaxSlUsd,
  createRoot17DailyState,
  DEFAULT_ACCOUNT_EQUITY_USD,
  DAILY_LOSS_CAP_MULTIPLIER,
  dynamicMaxSlPct,
  formatDynSlLockTag,
  formatRiskIndexLabel,
  isToxicModeTripped,
  MAX_DAILY_SL_COUNT,
  normalizeRoot17State,
  recordRoot17SlTrip,
  resolveAttackLock,
  estimateSlipLossUsd,
  exceedsMaxRiskBoundary,
  resolveRootTelemetryDisplayStatus,
  ROLE_LOCK_TIPS,
  ROLE_TX_THRESHOLDS,
  RISK_INDEX_HUD_CONFIG,
  sanitizeAccountEquityUsd,
  statusesFromTrippedRoots,
  TOXIC_MODE_COOLDOWN_MS,
  TOXIC_MODE_THRESHOLD,
  TOXICITY_ELEVATED_THRESHOLD,
  utcDayKey,
  type Root17DailyState,
  TOPOLOGY_NODE_UI,
  EQUILIBRIUM_MODE_UI,
  enrichSystemStateVectorEquilibrium,
  resolveActiveNode,
  resolveEquilibriumMode,
  formatPgateStatusLabel,
  formatTensileLabel,
  formatFrictionLabel,
  formatGatewayLabel,
  resolveLiveFrictionRatio,
  clampTensileScore,
  computeSoilRiskUsd,
};

/** Serialize injectable client helpers for the vanilla dashboard script block */
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
  const constants = `
const DYNAMIC_MAX_SL_BASE_USD = ${DYNAMIC_MAX_SL_BASE_USD};
const DYNAMIC_MAX_SL_BALANCE_RATE = ${DYNAMIC_MAX_SL_BALANCE_RATE};
const DEFAULT_ACCOUNT_EQUITY_USD = ${DEFAULT_ACCOUNT_EQUITY_USD};
const DAILY_LOSS_CAP_MULTIPLIER = ${DAILY_LOSS_CAP_MULTIPLIER};
const MAX_DAILY_SL_COUNT = ${MAX_DAILY_SL_COUNT};
const TOXIC_MODE_THRESHOLD = ${TOXIC_MODE_THRESHOLD};
const TOXICITY_ELEVATED_THRESHOLD = ${TOXICITY_ELEVATED_THRESHOLD};
const TOXIC_MODE_COOLDOWN_MS = ${TOXIC_MODE_COOLDOWN_MS};
const ROLE_TX_THRESHOLDS = ${JSON.stringify(ROLE_TX_THRESHOLDS)};
const ROLE_LOCK_TIPS = ${JSON.stringify(ROLE_LOCK_TIPS)};
const ROOT_DEFENSE_MATRIX_HUD_CONFIG = ${JSON.stringify(ROOT_DEFENSE_MATRIX_HUD_CONFIG)};
const ROOT_DEFENSE_SCORE_MAX = ${ROOT_DEFENSE_SCORE_MAX};
const ROOT_DEFENSE_SCORE_MIN = ${ROOT_DEFENSE_SCORE_MIN};
const ROOT_DEFENSE_OPTIMAL_MIN = ${ROOT_DEFENSE_OPTIMAL_MIN};
const ROOT_DEFENSE_ELEVATED_MIN = ${ROOT_DEFENSE_ELEVATED_MIN};
const TIER_PENALTY_BY_ROOT = ${JSON.stringify(ROOT_DEFENSE_TIER_PENALTY_BY_ROOT)};
const TIER_4_SET = new Set(${JSON.stringify([...ROOT_DEFENSE_TIER_4_ROOTS])});
const RISK_INDEX_HUD_CONFIG = ${JSON.stringify(RISK_INDEX_HUD_CONFIG)};
const ROOT_STATUS_SCORE = ${JSON.stringify(ROOT_STATUS_SCORE)};
const CRI_TIER_DEFINITIONS = ${JSON.stringify(CRI_TIER_DEFINITIONS)};
const MAX_SLIPPAGE = ${MAX_SLIPPAGE};
const MIN_DEPTH_USD = ${MIN_DEPTH_USD};
const HL_RESTRICTED_COUNTRIES = ${JSON.stringify(HL_RESTRICTED_COUNTRIES)};
const DEMO_ROLE_CONFIG = ${JSON.stringify(DEMO_ROLE_CONFIG)};
const TOPOLOGY_NODE_UI = ${JSON.stringify(TOPOLOGY_NODE_UI)};
const EQUILIBRIUM_MODE_UI = ${JSON.stringify(EQUILIBRIUM_MODE_UI)};
const EQUILIBRIUM_DYNAMIC_CRI_MIN = ${EQUILIBRIUM_DYNAMIC_CRI_MIN};
const EQUILIBRIUM_GUARD_CRI_MIN = ${EQUILIBRIUM_GUARD_CRI_MIN};
const ROOT8_SLIPPAGE_LOCK_LABEL = ${JSON.stringify(ROOT8_SLIPPAGE_LOCK_LABEL)};
const R1018_SLIPPAGE_LOCK_LABEL = ${JSON.stringify(R1018_SLIPPAGE_LOCK_LABEL)};
const TOPOLOGY_DELTA_CRI_MAX = ${TOPOLOGY_DELTA_CRI_MAX};
const TOPOLOGY_LAMBDA_CRI_MIN = ${TOPOLOGY_LAMBDA_CRI_MIN};
`.trim();

  return (
    constants +
    "\n" +
    fns
      .map((fn) => fn.toString())
      .join("\n")
  );
}
