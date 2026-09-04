/**
 * Santenmoku v0.9 pre-execution gateway — soil + root protection fail-closed.
 */

import {
  HardlockError,
  RiskLimitExceeded,
  checkSoilResistance as checkSoilResistanceBase,
  vineWrapProtection,
} from "../risk";
import { isGatewayNominalFastPath } from "./risk-engine-soil-fastpath";
import type {
  CitadelRiskGateVerdict,
  GatewayRulesInput,
  GatewayRulesResult,
} from "./risk-engine-types";

const GATEWAY_CLEAR: GatewayRulesResult = Object.freeze({
  blocked: false, tripped: false, crashed: false, failClosed: false, reasons: Object.freeze([]),
});
const PAYLOAD_POISON_RESULT: GatewayRulesResult = Object.freeze({
  blocked: true, tripped: true, crashed: false, failClosed: true,
  reasons: Object.freeze(["PAYLOAD_POISON_FAIL_CLOSED"]),
});

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
