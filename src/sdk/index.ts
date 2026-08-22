/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2026 SilverVine Labs
 * @slivervine/citadel-sdk — public surface (+ legacy risk barrel for Worker).
 */
export * from "./legacy-risk";
export { verifyAgentIntent, AGENT_ARMOR_SANDWICH_MAX_BPS } from "./agent-intent";
export type {
  AgentIntentInput,
  AgentIntentVerdict,
  CitadelAttestation,
} from "./agent-intent";
export { assertUnidirectionalBridge } from "./unidirectional-bridge";
export type {
  BridgeEscortVerdict,
  UnidirectionalBridgeInput,
} from "./unidirectional-bridge";
export {
  buildRobinhoodAuditSnapshot,
  exportRobinhoodAuditSnapshot,
} from "./robinhood-audit-snapshot";
export type {
  RobinhoodAuditChainId,
  RobinhoodAuditSnapshot,
  RobinhoodAuditSnapshotInput,
} from "./robinhood-audit-snapshot";
export { AML_INBOUND_TO_ROBINHOOD_BLOCKED } from "../adapters/robinhood/robinhood-across-bridge";
export { quoteRChainYieldToArbitrumGm } from "../adapters/robinhood/r-chain-yield-router";
export type {
  RChainYieldEscortInput,
  RChainYieldEscortQuote,
} from "../adapters/robinhood/r-chain-yield-router";
export {
  AGENT_DEADMAN_SLIPPAGE_BPS,
  CITADEL_SLIPPAGE_EXCEEDED,
  DEADMAN_SWITCH_TRIPPED,
  evaluateAgentCitadelGuard,
  guardAgentUserOp,
} from "../core/agent-citadel-guard";
export {
  ARBITRUM_ONE_CHAIN_ID,
  EIP712_DOMAIN_NAME,
  EIP712_DOMAIN_VERSION,
  ROBINHOOD_MAINNET_CHAIN_ID,
  ROBINHOOD_TESTNET_CHAIN_ID,
  SLIVERVINE_GATE_ADDRESS,
} from "./constants";
export type { CitadelSdkPreset } from "./constants";
export {
  ensureSoilWasm,
  initSoilWasm,
  isSoilWasmReady,
  evaluateSoilCore,
  WASM_BUDGET_BYTES,
  WASM_EXEC_BUDGET_US,
} from "./soil-wasm";
