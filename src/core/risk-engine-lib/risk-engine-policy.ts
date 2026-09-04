/**
 * Global HL risk policy — root / fool-proof / soil / funding gates.
 */

import { R20_LOCKED, readActiveSystemState, type SystemState } from "../state";
import { checkFoolProofGuard } from "../../services/fool-proof-guard";
import {
  HardlockError,
  RiskLimitExceeded,
  evaluateFundingRegimePolicy,
  isR20Locked,
  vineWrapProtection,
  type SoilResistanceInput,
} from "../risk";
import { checkSoilResistance } from "./risk-engine-soil-fastpath";
import {
  deny,
  type GlobalRiskPolicyResult,
  type RiskIntent,
} from "./risk-engine-types";

function evaluateRootProtection(intent: RiskIntent, state: SystemState): GlobalRiskPolicyResult | null {
  try {
    vineWrapProtection({
      symbol: intent.symbol ?? intent.venue,
      estimatedLossUsd: intent.amountUsd,
      accountBalanceUsd: state.accountBalanceUsd,
      criHardlock: state.hardlock,
    });
    return null;
  } catch (err) {
    if (err instanceof HardlockError) return deny(err.message, 403);
    if (err instanceof RiskLimitExceeded) return deny(err.message, 422);
    throw err;
  }
}

function evaluateFoolProofGate(intent: RiskIntent, state: SystemState): GlobalRiskPolicyResult | null {
  const result = checkFoolProofGuard({
    order: {
      positionValueUsd: intent.amountUsd,
      leverage: intent.foolProof?.leverage,
      contractTarget: intent.foolProof?.contractTarget,
      profile: intent.foolProof?.profile,
      reduceOnly: intent.foolProof?.reduceOnly,
    },
    accountBalanceUsd: state.accountBalanceUsd,
  });
  if (!result.rejected) return null;
  return deny(`Fool-proof guard rejected — ${result.reasons.join("|")}`, 422);
}

function evaluateSoilGate(soil: SoilResistanceInput): GlobalRiskPolicyResult | null {
  const result = checkSoilResistance(soil);
  if (!result.tripped) return null;
  return deny(`Soil resistance tripped — ${result.reasons.join("|")}`, 422);
}

function buildFundingPolicy(intent: RiskIntent) {
  if (!intent.funding) return null;
  return evaluateFundingRegimePolicy({
    ...intent.funding,
    symbol: intent.funding.symbol ?? intent.symbol,
    baseNotionalUsd: intent.funding.baseNotionalUsd ?? intent.amountUsd,
    requestedLeverage: intent.funding.requestedLeverage ?? intent.foolProof?.leverage,
  });
}

function evaluateFundingGate(
  intent: RiskIntent,
  policy: NonNullable<ReturnType<typeof buildFundingPolicy>>,
): GlobalRiskPolicyResult | null {
  if (policy.r20Triggered || !policy.rebalanceAllowed) {
    return {
      isAllowed: false,
      reason: policy.reasons.join("|") || "FUNDING_REGIME_HALT",
      suggestedHttpCode: 403,
      fundingRegime: policy.regime,
      targetLeverage: policy.targetLeverage,
      scaledNotionalUsd: policy.scaledNotionalUsd,
    };
  }
  if (intent.foolProof?.leverage !== undefined && policy.reasons.some((r) => r.startsWith("FUNDING_LEVERAGE_CAP"))) {
    return {
      isAllowed: false,
      reason: policy.reasons.join("|"),
      suggestedHttpCode: 422,
      fundingRegime: policy.regime,
      targetLeverage: policy.targetLeverage,
      scaledNotionalUsd: policy.scaledNotionalUsd,
    };
  }
  return null;
}

/** Single policy evaluation for Hyperliquid intents. */
export function evaluateGlobalRiskPolicy(intent: RiskIntent): GlobalRiskPolicyResult {
  const state = intent.systemState ?? readActiveSystemState();
  const fundingPolicy = buildFundingPolicy(intent);
  if (isR20Locked(state)) return deny(`${R20_LOCKED} — signing channel severed`, 403);
  const rootBlock = evaluateRootProtection(intent, state);
  if (rootBlock) return rootBlock;
  if (fundingPolicy) {
    const fundingBlock = evaluateFundingGate(intent, fundingPolicy);
    if (fundingBlock) return fundingBlock;
  }
  const foolProofBlock = evaluateFoolProofGate(intent, state);
  if (foolProofBlock) return foolProofBlock;
  if (intent.soil) {
    const soilBlock = evaluateSoilGate(intent.soil);
    if (soilBlock) return soilBlock;
  }
  return {
    isAllowed: true,
    fundingRegime: fundingPolicy?.regime,
    targetLeverage: fundingPolicy?.targetLeverage,
    scaledNotionalUsd: fundingPolicy?.scaledNotionalUsd,
  };
}
