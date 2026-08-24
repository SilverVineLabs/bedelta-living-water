/**
 * Unified cross-chain risk engine — HL policy gate (thin re-export).
 */

export { HardlockError, RiskLimitExceeded } from "./risk";

export type {
  RiskVenue,
  FoolProofIntent,
  FundingRegimeIntent,
  RiskIntent,
  GlobalRiskPolicyResult,
  GatewayRulesInput,
  GatewayRulesResult,
  CitadelRiskGateVerdict,
} from "./risk-engine-lib/risk-engine-types";

export { checkSoilResistance } from "./risk-engine-lib/risk-engine-soil-fastpath";
export {
  evaluateGatewayRules,
  assertCitadelRiskGate,
} from "./risk-engine-lib/risk-engine-gateway";
export { evaluateGlobalRiskPolicy } from "./risk-engine-lib/risk-engine-policy";
