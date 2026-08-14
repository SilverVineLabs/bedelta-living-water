/**
 * Unified cross-chain risk engine — HL policy gate.
 */

import { R20_LOCKED, readActiveSystemState, type SystemState } from "./state";
import { checkFoolProofGuard, type FoolProofProfile } from "../services/fool-proof-guard";
import {
  HardlockError,
  RiskLimitExceeded,
  checkSoilResistance as checkSoilResistanceBase,
  evaluateFundingRegimePolicy,
  isR20Locked,
  vineWrapProtection,
  MAX_SLIPPAGE,
  isTsunamiShieldWindow,
  type FundingRegimePolicyInput,
  type SoilResistanceInput,
} from "./risk";
import { resolveSoilMinDepthUsd, type SoilResistanceResult } from "../services/risk-control";
import { isXyzOrHip3Key } from "../services/exchanges/asset-classifier-lib/asset-classifier-keywords";
import { isArbitrumStatusSequencerHealthy } from "../services/adapters/arbitrum-status-sentinel";
import { isRpcRadarSequencerHealthy } from "../services/adapters/rpc-radar";
import { isSequencerSafe } from "../services/risk/sequencer-guard";
import { isArbitrumGasGuardBlocked } from "../services/risk/arbitrum-gas-guard";
import { isSoftConfirmationSafe } from "../services/risk/soft-confirmation-guard";

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

function deny(reason: string, suggestedHttpCode: number): GlobalRiskPolicyResult {
  return { isAllowed: false, reason, suggestedHttpCode };
}

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
  reasons: readonly string[];
  errorCode?: string;
}

export interface CitadelRiskGateVerdict {
  pass: boolean;
  failClosed: boolean;
  falseNegatives: number;
  result: GatewayRulesResult;
}

const GATEWAY_CLEAR: GatewayRulesResult = Object.freeze({
  blocked: false, tripped: false, crashed: false, failClosed: false, reasons: Object.freeze([]),
});
const PAYLOAD_POISON_RESULT: GatewayRulesResult = Object.freeze({
  blocked: true, tripped: true, crashed: false, failClosed: true,
  reasons: Object.freeze(["PAYLOAD_POISON_FAIL_CLOSED"]),
});

const SOIL_RESISTANCE_CLEAR: SoilResistanceResult = {
  ok: true,
  tripped: false,
  crossVenueSlippage: 0,
  spotPerpSlippage: 0,
  reasons: [],
};

let fastPathSoilRef: SoilResistanceInput | null = null;
let fastPathSoilResult = false;

function isGatewayNominalFastPath(soil: SoilResistanceInput): boolean {
  if (fastPathSoilRef === soil) return fastPathSoilResult;
  if (soil.crossSpread || soil.gmxPriceImpact || isXyzOrHip3Key(soil.symbol)) {
    fastPathSoilRef = soil;
    fastPathSoilResult = false;
    return false;
  }
  const hl = soil.hlPerp;
  const dx = soil.dydxPerp;
  if (hl <= 0 || dx <= 0) {
    fastPathSoilRef = soil;
    fastPathSoilResult = false;
    return false;
  }
  const fuse = soil.maxSlippage ?? MAX_SLIPPAGE;
  if (Math.abs(dx - hl) / hl > fuse) {
    fastPathSoilRef = soil;
    fastPathSoilResult = false;
    return false;
  }
  const depth = soil.depthUsd;
  if (depth !== undefined && depth < resolveSoilMinDepthUsd(soil)) {
    fastPathSoilRef = soil;
    fastPathSoilResult = false;
    return false;
  }
  if (isTsunamiShieldWindow(soil.at)) {
    fastPathSoilRef = soil;
    fastPathSoilResult = false;
    return false;
  }
  const atMs = soil.at?.getTime();
  const ok =
    isSequencerSafe(atMs) &&
    isArbitrumStatusSequencerHealthy(atMs) &&
    isRpcRadarSequencerHealthy(atMs) &&
    !isArbitrumGasGuardBlocked() &&
    isSoftConfirmationSafe(atMs);
  fastPathSoilRef = soil;
  fastPathSoilResult = ok;
  return ok;
}

export { HardlockError, RiskLimitExceeded };

export function checkSoilResistance(input: SoilResistanceInput): SoilResistanceResult {
  return isGatewayNominalFastPath(input) ? SOIL_RESISTANCE_CLEAR : checkSoilResistanceBase(input);
}

/** Santenmoku v0.9 pre-execution gateway — soil + root protection fail-closed matrix. */
export function evaluateGatewayRules(input: GatewayRulesInput): GatewayRulesResult {
  if (input.payloadPoison) return PAYLOAD_POISON_RESULT;
  const hasVine = input.estimatedLossUsd !== undefined && input.accountBalanceUsd !== undefined;
  if (!hasVine && isGatewayNominalFastPath(input.soil)) return GATEWAY_CLEAR;
  try {
    const soil = checkSoilResistanceBase(input.soil);
    if (!soil.tripped) {
      if (!hasVine) return GATEWAY_CLEAR;
      vineWrapProtection({
        symbol: input.symbol,
        estimatedLossUsd: input.estimatedLossUsd!,
        accountBalanceUsd: input.accountBalanceUsd!,
        criHardlock: input.criHardlock,
      });
      return GATEWAY_CLEAR;
    }
    return { blocked: true, tripped: true, crashed: false, failClosed: true, reasons: soil.reasons };
  } catch (err) {
    if (err instanceof HardlockError || err instanceof RiskLimitExceeded) {
      return {
        blocked: true, tripped: true, crashed: false, failClosed: true,
        reasons: Object.freeze([err.code]), errorCode: err.code,
      };
    }
    const message = err instanceof Error ? err.message : String(err);
    return {
      blocked: true, tripped: true, crashed: true, failClosed: false, reasons: Object.freeze([message]),
    };
  }
}

export function assertCitadelRiskGate(input: GatewayRulesInput, expectTrip: boolean): CitadelRiskGateVerdict {
  const result = evaluateGatewayRules(input);
  if (!expectTrip) return { pass: !result.tripped, failClosed: false, falseNegatives: 0, result };
  const failClosed = result.failClosed && result.tripped;
  return { pass: failClosed, failClosed, falseNegatives: result.tripped ? 0 : 1, result };
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
