/**
 * Core risk primitives — Pgate.md circuit breakers (delegates to risk-control.ts).
 */

import type { SystemState } from "../services/systemState";
import type { SoilResistanceInput } from "../services/risk-control";
import {
  checkSoilResistance,
  checkSoilResistanceWithVine,
  vineWrapProtection,
  rootProtection,
  computeEffectiveMaxSlUsd,
  computeOrderAwareMaxSlUsd,
  computeSoilRiskUsd,
  estimateEntryLossUsd,
  emitRiskLog,
  formatTripReasons,
  getHktHour,
  isTsunamiShieldWindow,
  DYNAMIC_MAX_SL_BASE_USD,
  DYNAMIC_MAX_SL_BALANCE_RATE,
  MAX_SLIPPAGE,
  VINE_SOIL_MAX_SLIPPAGE,
  MIN_DEPTH_USD,
  RiskLimitExceeded,
  HardlockError,
} from "../services/risk-control";
export {
  evaluateFundingRegime,
  evaluateFundingRegimePolicy,
  resolveFundingLeverage,
  scaleRebalanceNotionalUsd,
  ETH_FUNDING_HISTORY,
  type FundingRegime,
  type FundingRegimeContext,
  type FundingRegimePolicyInput,
  type FundingRegimePolicyResult,
} from "../services/risk-control";
export {
  FoolProofRejectedError,
  VineShieldRejectedError,
  checkVineShield,
  checkFoolProofGuard,
  runVineShieldSoilGate,
  checkSoilResistanceWithFoolProofGuard,
} from "../services/fool-proof-guard";

export type {
  RootProtectionInput,
  SoilResistanceInput,
  SoilResistanceResult,
  RiskLogPayload,
  RiskEvent,
  RiskLogLevel,
} from "../services/risk-control";

export {
  checkSoilResistance,
  checkSoilResistanceWithVine,
  vineWrapProtection,
  rootProtection,
  computeEffectiveMaxSlUsd,
  computeOrderAwareMaxSlUsd,
  computeSoilRiskUsd,
  estimateEntryLossUsd,
  emitRiskLog,
  formatTripReasons,
  getHktHour,
  isTsunamiShieldWindow,
  DYNAMIC_MAX_SL_BASE_USD,
  DYNAMIC_MAX_SL_BALANCE_RATE,
  MAX_SLIPPAGE,
  VINE_SOIL_MAX_SLIPPAGE,
  MIN_DEPTH_USD,
  RiskLimitExceeded,
  HardlockError,
};

export function clampTensileScore(score: number): number {
  if (typeof score !== "number" || Number.isNaN(score)) return 0;
  return Math.max(0, Math.min(100, Math.round(score)));
}

/** True when R20 physical deadlock / signing channel is severed. */
export function isR20Locked(state: SystemState): boolean {
  return (
    state.hardlock ||
    state.currentCri <= 0 ||
    state.signingChannelOpen === false
  );
}

/** Tail hedge channel — active only when unlocked and soil resistance passes. */
export function isHedgeActive(
  soil: SoilResistanceInput,
  state: SystemState,
): boolean {
  if (isR20Locked(state)) return false;
  return !checkSoilResistance(soil).tripped;
}
