/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2026 SilverVine Labs
 *
 * @slivervine/citadel-sdk — verifyAgentIntent
 *
 * Production equation:
 *   allowedToSign = injectionOk ∧ digestOk ∧ soilOk ∧ sessionOk ∧ gasOk ∧ attOk ∧ wasmOk ∧ deadmanOk ∧ armorOk
 * Deadman Switch: Agent-Citadel-Guard (50 bps default) fail-closed on slip/depth.
 * Armor: RPC lag (PGATE_MAX_LATENCY_MS) + sandwich risk fuse.
 */
import { auditSessionKeyConstraints } from "../services/risk/session-audit";
import { checkSoilResistance } from "../services/risk-control";
import {
  evaluateSponsoredGasLimits,
  getGasLedgerSnapshot,
} from "../adapters/arbitrum/zerodev-aa/zerodev-aa-gas-ledger";
import {
  AGENT_DEADMAN_SLIPPAGE_BPS,
  CITADEL_SLIPPAGE_EXCEEDED,
  DEADMAN_SWITCH_TRIPPED,
  evaluateAgentCitadelGuard,
} from "../core/agent-citadel-guard";
import { PGATE_MAX_LATENCY_MS } from "../config/constants";
import {
  WASM_SOIL_DEFAULT_SLIPPAGE_FUSE,
  WASM_SOIL_MIN_DEPTH_USD,
  WASM_SOIL_TESTNET_MIN_DEPTH_USD,
} from "../services/wasm-feasibility-lib/soil-core-sim";
import {
  EIP712_DOMAIN_NAME,
  SLIVERVINE_GATE_ADDRESS,
  type CitadelSdkPreset,
} from "./constants";
import { evaluateAttestation, type CitadelAttestation } from "./attestation";
import { ensureSoilWasm, evaluateSoilCore } from "./soil-wasm";

export type { CitadelAttestation };

/** Sandwich / adverse-selection risk fuse (bps of mid). */
export const AGENT_ARMOR_SANDWICH_MAX_BPS = 25 as const;

const PROMPT_INJECTION_RE =
  /(ignore\s+(all\s+)?(previous|prior)\s+instructions|system\s*:|<\s*script|DROP\s+TABLE|;\s*rm\s+-rf)/i;

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

export function verifyAgentIntent(input: AgentIntentInput): AgentIntentVerdict {
  const nowMs = input.nowMs ?? Date.now();
  const preset = input.preset ?? "production";
  const allowDevBypass =
    input.allowDevBypass === true ||
    (preset === "test" && input.soil.isTestnet === true);
  const requireWasm = !allowDevBypass;
  if (requireWasm) ensureSoilWasm();
  const reasons: string[] = [];

  if (PROMPT_INJECTION_RE.test(input.intentDigest) || PROMPT_INJECTION_RE.test(input.soil.symbol)) {
    reasons.push("PROMPT_INJECTION_REJECTED");
  }
  if (!/^0x[a-fA-F0-9]{64}$/.test(input.intentDigest.trim())) {
    reasons.push("INTENT_DIGEST_INVALID");
  }

  const session = auditSessionKeyConstraints({
    agentAddress: input.sessionKey.agentAddress,
    maxOrderClipUsd: input.sessionKey.maxOrderClipUsd,
    expiresAtMs: input.sessionKey.expiresAtMs,
    approvedAtMs: input.sessionKey.approvedAtMs,
    nowMs,
  });
  reasons.push(...session.reasons);

  const isTestnet = input.soil.isTestnet === true;
  const core = evaluateSoilCore({
    hlSpot: input.soil.hlSpot,
    hlPerp: input.soil.hlPerp,
    dydxPerp: input.soil.dydxPerp,
    depthUsd: input.soil.depthUsd ?? 0,
    orderSizeUsd: 0,
    accountBalanceUsd: 0,
    maxSlippage: WASM_SOIL_DEFAULT_SLIPPAGE_FUSE,
    minDepthUsd: isTestnet ? WASM_SOIL_TESTNET_MIN_DEPTH_USD : WASM_SOIL_MIN_DEPTH_USD,
  });
  if (requireWasm && !core.wasmUsed) reasons.push("WASM_CORE_REQUIRED");
  if (core.output.tripped) reasons.push("WASM_SOIL_CORE_TRIP");

  const soil = checkSoilResistance({
    symbol: input.soil.symbol,
    hlSpot: input.soil.hlSpot,
    hlPerp: input.soil.hlPerp,
    dydxPerp: input.soil.dydxPerp,
    depthUsd: input.soil.depthUsd,
    isTestnet,
    at: new Date(nowMs),
  });
  const soilOk =
    !soil.tripped && !core.output.tripped && !(requireWasm && !core.wasmUsed);
  if (soil.tripped) reasons.push(...soil.reasons.map((r) => `SOIL_${r}`));

  const maxSlippageBps = input.deadman?.maxSlippageBps ?? AGENT_DEADMAN_SLIPPAGE_BPS;
  const soilResistanceThreshold =
    input.deadman?.soilResistanceThreshold ?? AGENT_DEADMAN_SLIPPAGE_BPS;
  const deadman = evaluateAgentCitadelGuard({
    intent: {
      maxSlippageBps,
      soilResistanceThreshold,
      targetMarket: input.soil.symbol,
    },
    soil: {
      symbol: input.soil.symbol,
      hlSpot: input.soil.hlSpot,
      hlPerp: input.soil.hlPerp,
      dydxPerp: input.soil.dydxPerp,
      depthUsd: input.soil.depthUsd,
      isTestnet,
      at: new Date(nowMs),
    },
    atMs: nowMs,
  });
  const deadmanOk = deadman.allowed;
  if (!deadmanOk) {
    reasons.push(DEADMAN_SWITCH_TRIPPED, CITADEL_SLIPPAGE_EXCEEDED);
  }

  let armorOk = true;
  const rpcMs = input.armor?.rpcLatencyMs;
  if (rpcMs !== undefined && Number.isFinite(rpcMs) && rpcMs > PGATE_MAX_LATENCY_MS) {
    armorOk = false;
    reasons.push(`AGENT_ARMOR_RPC_LAG:${rpcMs}>${PGATE_MAX_LATENCY_MS}`);
  }
  const sandwichBps = input.armor?.sandwichRiskBps;
  if (
    sandwichBps !== undefined &&
    Number.isFinite(sandwichBps) &&
    sandwichBps > AGENT_ARMOR_SANDWICH_MAX_BPS
  ) {
    armorOk = false;
    reasons.push(`AGENT_ARMOR_SANDWICH_RISK:${sandwichBps}>${AGENT_ARMOR_SANDWICH_MAX_BPS}`);
  }

  let gasBurstOk = true;
  if (input.gasBurst) {
    const base = getGasLedgerSnapshot(nowMs);
    const snap = {
      ...base,
      cumulativeSpentUsd: input.gasBurst.dailySpentUsd ?? base.cumulativeSpentUsd,
    };
    const gas = evaluateSponsoredGasLimits({
      estimatedGasCostUsd: input.gasBurst.estimatedGasCostUsd,
      requestedSponsorship: input.gasBurst.sponsored,
      snapshot: snap,
      nowMs,
    });
    gasBurstOk = !gas.perUserOp.exceeded && (!input.gasBurst.sponsored || gas.sponsored);
    if (gas.perUserOp.exceeded) {
      reasons.push(`ZERODEV_GAS_LIMIT_EXCEEDED_TRIP:${input.gasBurst.estimatedGasCostUsd}`);
    }
    if (gas.gasGuardReason) reasons.push(gas.gasGuardReason);
  }

  const att = evaluateAttestation(
    input.intentDigest,
    input.attestation,
    nowMs,
    !allowDevBypass,
  );
  reasons.push(...att.reasons);

  const allowedToSign =
    !reasons.includes("PROMPT_INJECTION_REJECTED") &&
    !reasons.includes("INTENT_DIGEST_INVALID") &&
    soilOk &&
    deadmanOk &&
    armorOk &&
    session.ok &&
    gasBurstOk &&
    (att.ok || allowDevBypass);

  return {
    ok: allowedToSign,
    reasons: [...new Set(reasons)],
    allowedToSign,
    clipOk: session.clipOk,
    expiryOk: session.expiryOk,
    soilOk,
    gasBurstOk,
    sessionOk: session.ok,
    deadmanOk,
    armorOk,
    hasValidAttestation: att.ok,
    wasmUsed: core.wasmUsed,
    attestation: input.attestation
      ? {
          digest: input.attestation.digest,
          expiresAtMs: input.attestation.expiresAtMs,
          sig: input.attestation.sig,
        }
      : undefined,
    verifyingContract: SLIVERVINE_GATE_ADDRESS,
    domainName: EIP712_DOMAIN_NAME,
  };
}
