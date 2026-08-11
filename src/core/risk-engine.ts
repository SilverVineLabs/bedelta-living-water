/**
 * Unified cross-chain risk engine — HL policy gate.
 */

import { R20_LOCKED, readActiveSystemState, type SystemState } from "./state";
import {
  checkFoolProofGuard,
  type FoolProofProfile,
} from "../services/fool-proof-guard";
import {
  HardlockError,
  RiskLimitExceeded,
  checkSoilResistance,
  evaluateFundingRegimePolicy,
  isR20Locked,
  vineWrapProtection,
  type FundingRegimePolicyInput,
  type SoilResistanceInput,
} from "./risk";

export type RiskVenue = "HL";

export interface FoolProofIntent {
  leverage?: number;
  contractTarget?: string;
  profile?: FoolProofProfile;
  reduceOnly?: boolean;
}

export interface FundingRegimeIntent extends FundingRegimePolicyInput {}

export interface RiskIntent {
  venue: RiskVenue;
  amountUsd: number;
  symbol?: string;
  systemState?: SystemState;
  foolProof?: FoolProofIntent;
  soil?: SoilResistanceInput;
  funding?: FundingRegimeIntent;
}

export interface GlobalRiskPolicyResult {
  isAllowed: boolean;
  reason?: string;
  suggestedHttpCode?: number;
  fundingRegime?: ReturnType<typeof evaluateFundingRegimePolicy>["regime"];
  targetLeverage?: number;
  scaledNotionalUsd?: number;
}

function deny(
  reason: string,
  suggestedHttpCode: number,
): GlobalRiskPolicyResult {
  return { isAllowed: false, reason, suggestedHttpCode };
}

function evaluateRootProtection(
  intent: RiskIntent,
  state: SystemState,
): GlobalRiskPolicyResult | null {
  try {
    vineWrapProtection({
      symbol: intent.symbol ?? intent.venue,
      estimatedLossUsd: intent.amountUsd,
      accountBalanceUsd: state.accountBalanceUsd,
      criHardlock: state.hardlock,
    });
    return null;
  } catch (err) {
    if (err instanceof HardlockError) {
      return deny(err.message, 403);
    }
    if (err instanceof RiskLimitExceeded) {
      return deny(err.message, 422);
    }
    throw err;
  }
}

function evaluateFoolProofGate(
  intent: RiskIntent,
  state: SystemState,
): GlobalRiskPolicyResult | null {
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
  return deny(
    `Fool-proof guard rejected — ${result.reasons.join("|")}`,
    422,
  );
}

function evaluateSoilGate(
  soil: SoilResistanceInput,
): GlobalRiskPolicyResult | null {
  const result = checkSoilResistance(soil);
  if (!result.tripped) return null;
  return deny(
    `Soil resistance tripped — ${result.reasons.join("|")}`,
    422,
  );
}

function buildFundingPolicy(intent: RiskIntent) {
  if (!intent.funding) return null;
  return evaluateFundingRegimePolicy({
    ...intent.funding,
    symbol: intent.funding.symbol ?? intent.symbol,
    baseNotionalUsd: intent.funding.baseNotionalUsd ?? intent.amountUsd,
    requestedLeverage:
      intent.funding.requestedLeverage ?? intent.foolProof?.leverage,
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

  if (
    intent.foolProof?.leverage !== undefined &&
    policy.reasons.some((r) => r.startsWith("FUNDING_LEVERAGE_CAP"))
  ) {
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

export interface GatewayRulesInput {
  symbol: string;
  soil: SoilResistanceInput;
  estimatedLossUsd?: number;
  accountBalanceUsd?: number;
  criHardlock?: boolean;
  payloadPoison?: boolean;
}

export interface GatewayRulesResult {
  blocked: boolean;
  tripped: boolean;
  crashed: boolean;
  failClosed: boolean;
  reasons: string[];
  errorCode?: string;
}

export { checkSoilResistance, HardlockError, RiskLimitExceeded };

/** Santenmoku v0.9 pre-execution gateway — soil + root protection fail-closed matrix. */
export function evaluateGatewayRules(input: GatewayRulesInput): GatewayRulesResult {
  if (input.payloadPoison) {
    return {
      blocked: true,
      tripped: true,
      crashed: false,
      failClosed: true,
      reasons: ["PAYLOAD_POISON_FAIL_CLOSED"],
    };
  }

  const reasons: string[] = [];
  try {
    const soil = checkSoilResistance(input.soil);
    if (soil.tripped) reasons.push(...soil.reasons);

    if (
      input.estimatedLossUsd !== undefined &&
      input.accountBalanceUsd !== undefined
    ) {
      vineWrapProtection({
        symbol: input.symbol,
        estimatedLossUsd: input.estimatedLossUsd,
        accountBalanceUsd: input.accountBalanceUsd,
        criHardlock: input.criHardlock,
      });
    }

    const blocked = reasons.length > 0;
    return {
      blocked,
      tripped: blocked,
      crashed: false,
      failClosed: blocked,
      reasons,
    };
  } catch (err) {
    if (err instanceof HardlockError || err instanceof RiskLimitExceeded) {
      return {
        blocked: true,
        tripped: true,
        crashed: false,
        failClosed: true,
        reasons: [...reasons, err.code],
        errorCode: err.code,
      };
    }
    return {
      blocked: true,
      tripped: true,
      crashed: true,
      failClosed: false,
      reasons: [
        ...reasons,
        err instanceof Error ? err.message : String(err),
      ],
    };
  }
}

/** Single policy evaluation for Hyperliquid intents. */
export function evaluateGlobalRiskPolicy(
  intent: RiskIntent,
): GlobalRiskPolicyResult {
  const state = intent.systemState ?? readActiveSystemState();
  const fundingPolicy = buildFundingPolicy(intent);

  if (isR20Locked(state)) {
    return deny(`${R20_LOCKED} — signing channel severed`, 403);
  }

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
