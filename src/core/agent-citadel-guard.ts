/** Pillar 3 — Agent-Citadel-Guard (EIP-712 Intent Shield + Deadman Switch). */

import {
  checkSoilResistance,
  type SoilResistanceInput,
  type SoilResistanceResult,
} from "../services/risk-control";
import { ARBITRUM_ONE_CHAIN_ID } from "../sdk/constants";

export const CITADEL_SLIPPAGE_EXCEEDED = "CITADEL_SLIPPAGE_EXCEEDED" as const;
export const DEADMAN_SWITCH_TRIPPED = "DEADMAN_SWITCH_TRIPPED" as const;
export const AGENT_DEADMAN_SLIPPAGE_BPS = 50 as const;
export const AGENT_GUARD_DOMAIN_NAME = "SliverVineAgentCitadelGuard" as const;
export const AGENT_GUARD_DOMAIN_VERSION = "0.1" as const;
export const AGENT_GUARD_CHAIN_ID = ARBITRUM_ONE_CHAIN_ID;
export const AGENT_GUARD_VERIFYING_CONTRACT = "0x0000000000000000000000000000000000000000" as const;

export interface AgentIntentMessage {
  maxSlippageBps: number;
  soilResistanceThreshold: number;
  targetMarket: string;
}

export interface AgentIntentEip712 {
  domain: {
    name: typeof AGENT_GUARD_DOMAIN_NAME;
    version: typeof AGENT_GUARD_DOMAIN_VERSION;
    chainId: typeof AGENT_GUARD_CHAIN_ID;
    verifyingContract: typeof AGENT_GUARD_VERIFYING_CONTRACT;
  };
  types: {
    AgentIntent: [
      { name: "maxSlippageBps"; type: "uint16" },
      { name: "soilResistanceThreshold"; type: "uint16" },
      { name: "targetMarket"; type: "string" },
    ];
  };
  message: AgentIntentMessage;
}

export interface AgentCitadelGuardInput {
  intent: AgentIntentMessage;
  soil: SoilResistanceInput;
  atMs?: number;
}

export interface AgentMemoryRejectPayload {
  code: typeof CITADEL_SLIPPAGE_EXCEEDED;
  rejected: true;
  deadmanTriggered: true;
  targetMarket: string;
  maxSlippageBps: number;
  soilResistanceThresholdBps: number;
  slippageFailure: boolean;
  depthFailure: boolean;
  crossVenueSlippageBps: number;
  reasons: string[];
  timestamp: string;
  intentEip712: AgentIntentEip712;
}

export interface AgentCitadelGuardSignedReject {
  payload: AgentMemoryRejectPayload;
  signatureStub: string;
}

export interface AgentCitadelGuardResult {
  allowed: boolean;
  reject?: AgentCitadelGuardSignedReject;
}

export function buildAgentIntentEip712(intent: AgentIntentMessage): AgentIntentEip712 {
  return {
    domain: {
      name: AGENT_GUARD_DOMAIN_NAME,
      version: AGENT_GUARD_DOMAIN_VERSION,
      chainId: AGENT_GUARD_CHAIN_ID,
      verifyingContract: AGENT_GUARD_VERIFYING_CONTRACT,
    },
    types: {
      AgentIntent: [
        { name: "maxSlippageBps", type: "uint16" },
        { name: "soilResistanceThreshold", type: "uint16" },
        { name: "targetMarket", type: "string" },
      ],
    },
    message: intent,
  };
}

function bpsToRatio(bps: number): number {
  return bps / 10_000;
}

function crossVenueSlippageBps(soil: SoilResistanceResult): number {
  if (!Number.isFinite(soil.crossVenueSlippage) || soil.crossVenueSlippage < 0) return -1;
  return Math.round(soil.crossVenueSlippage * 10_000);
}

function isSlippageDeadman(soil: SoilResistanceResult, thresholdBps: number): boolean {
  const threshold = bpsToRatio(thresholdBps);
  if (soil.crossVenueSlippage > threshold) return true;
  return soil.reasons.some(
    (r) => r.startsWith("CROSS_VENUE_SLIPPAGE") || r.toUpperCase().includes("SLIPPAGE"),
  );
}

function isDepthDeadman(soil: SoilResistanceResult): boolean {
  return soil.reasons.some(
    (r) =>
      r.startsWith("DEPTH_USD") ||
      r === "INSUFFICIENT_DEPTH_DUAL_VENUE" ||
      r.toUpperCase().includes("DEPTH"),
  );
}

export async function signAgentMemoryPayload(payload: AgentMemoryRejectPayload): Promise<string> {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(JSON.stringify(payload)),
  );
  const hex = Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return `0x${hex}`;
}

export function evaluateAgentCitadelGuard(input: AgentCitadelGuardInput): {
  allowed: boolean;
  soil: SoilResistanceResult;
  slippageFailure: boolean;
  depthFailure: boolean;
  rejectPayload?: AgentMemoryRejectPayload;
} {
  const intentEip712 = buildAgentIntentEip712(input.intent);
  const thresholdBps = input.intent.soilResistanceThreshold ?? AGENT_DEADMAN_SLIPPAGE_BPS;
  const maxSlippageBps = input.intent.maxSlippageBps ?? AGENT_DEADMAN_SLIPPAGE_BPS;

  const soilInput: SoilResistanceInput = {
    ...input.soil,
    symbol: input.soil.symbol ?? input.intent.targetMarket,
    maxSlippage: bpsToRatio(maxSlippageBps),
    at: input.atMs !== undefined ? new Date(input.atMs) : input.soil.at,
  };

  const soil = checkSoilResistance(soilInput);
  const slippageFailure = isSlippageDeadman(soil, thresholdBps);
  const depthFailure = isDepthDeadman(soil);

  if (!slippageFailure && !depthFailure) {
    return { allowed: true, soil, slippageFailure: false, depthFailure: false };
  }

  const rejectPayload: AgentMemoryRejectPayload = {
    code: CITADEL_SLIPPAGE_EXCEEDED,
    rejected: true,
    deadmanTriggered: true,
    targetMarket: input.intent.targetMarket,
    maxSlippageBps,
    soilResistanceThresholdBps: thresholdBps,
    slippageFailure,
    depthFailure,
    crossVenueSlippageBps: crossVenueSlippageBps(soil),
    reasons: soil.reasons,
    timestamp: new Date(input.atMs ?? Date.now()).toISOString(),
    intentEip712,
  };

  return {
    allowed: false,
    soil,
    slippageFailure,
    depthFailure,
    rejectPayload,
  };
}

/** Deadman Switch — reject UserOp + signed JSON for Agent Memory when slippage/depth trips. */
export async function guardAgentUserOp(input: AgentCitadelGuardInput): Promise<AgentCitadelGuardResult> {
  const evalResult = evaluateAgentCitadelGuard(input);
  if (evalResult.allowed) return { allowed: true };

  const signatureStub = await signAgentMemoryPayload(evalResult.rejectPayload!);
  return {
    allowed: false,
    reject: { payload: evalResult.rejectPayload!, signatureStub },
  };
}

export async function assertAgentCitadelGuard(input: AgentCitadelGuardInput): Promise<void> {
  const result = await guardAgentUserOp(input);
  if (!result.allowed && result.reject) {
    throw new Error(
      `${CITADEL_SLIPPAGE_EXCEEDED}:${JSON.stringify(result.reject.payload)}`,
    );
  }
}
