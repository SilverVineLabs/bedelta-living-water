/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2026 SilverVine Labs
 * @slivervine/citadel-sdk — verifyAgentIntent types
 */
import type { CitadelSdkPreset } from "../constants";
import type { CitadelAttestation } from "../attestation";
import { EIP712_DOMAIN_NAME, SLIVERVINE_GATE_ADDRESS } from "../constants";

export type { CitadelAttestation };

export interface AgentIntentInput {
  intentDigest: string;
  sessionKey: {
    agentAddress: string;
    maxOrderClipUsd: number;
    expiresAtMs: number | null;
    approvedAtMs?: number;
  };
  soil: {
    symbol: string;
    hlSpot: number;
    hlPerp: number;
    dydxPerp: number;
    depthUsd?: number;
    isTestnet?: boolean;
  };
  gasBurst?: {
    estimatedGasCostUsd: number;
    sponsored: boolean;
    dailySpentUsd?: number;
    chainId?: number;
  };
  deadman?: {
    maxSlippageBps?: number;
    soilResistanceThreshold?: number;
  };
  armor?: {
    rpcLatencyMs?: number;
    sandwichRiskBps?: number;
  };
  attestation?: CitadelAttestation;
  preset?: CitadelSdkPreset;
  allowDevBypass?: boolean;
  nowMs?: number;
}

export interface AgentIntentVerdict {
  ok: boolean;
  reasons: string[];
  allowedToSign: boolean;
  clipOk: boolean;
  expiryOk: boolean;
  soilOk: boolean;
  gasBurstOk: boolean;
  sessionOk: boolean;
  deadmanOk: boolean;
  armorOk: boolean;
  hasValidAttestation: boolean;
  wasmUsed: boolean;
  attestation?: { digest: string; expiresAtMs: number; sig: string };
  verifyingContract: typeof SLIVERVINE_GATE_ADDRESS;
  domainName: typeof EIP712_DOMAIN_NAME;
}
