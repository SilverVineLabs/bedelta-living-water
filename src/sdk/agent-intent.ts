/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2026 SilverVine Labs
 *
 * @slivervine/citadel-sdk — verifyAgentIntent
 *
 * Production equation:
 *   AllowedToSign = Injection ∧ Digest ∧ Soil ∧ Session ∧ Gas ∧ Attestation ∧ Armor ∧ Wasm
 * Deadman Switch: Agent-Citadel-Guard (50 bps default) fail-closed on slip/depth.
 */
import { auditSessionKeyConstraints } from "../services/risk/session-audit";
import {
  EIP712_DOMAIN_NAME,
  SLIVERVINE_GATE_ADDRESS,
} from "./constants";
import { evaluateAttestation } from "./attestation";
import { evaluateInjectionAndDigest } from "./agent-intent-lib/agent-intent-injection";
import { evaluateAgentIntentSoil } from "./agent-intent-lib/agent-intent-soil";
import {
  AGENT_ARMOR_SANDWICH_MAX_BPS,
  evaluateArmorGuard,
  evaluateDeadmanGuard,
  evaluateGasBurstGuard,
} from "./agent-intent-lib/agent-intent-guards";
import type { AgentIntentInput, AgentIntentVerdict } from "./agent-intent-lib/agent-intent-types";

export type { CitadelAttestation } from "./agent-intent-lib/agent-intent-types";
export type { AgentIntentInput, AgentIntentVerdict } from "./agent-intent-lib/agent-intent-types";
export { AGENT_ARMOR_SANDWICH_MAX_BPS };

export function verifyAgentIntent(input: AgentIntentInput): AgentIntentVerdict {
  const nowMs = input.nowMs ?? Date.now();
  const preset = input.preset ?? "production";
  const allowDevBypass =
    input.allowDevBypass === true ||
    (preset === "test" && input.soil.isTestnet === true);
  const requireWasm = !allowDevBypass;
  const reasons: string[] = [
    ...evaluateInjectionAndDigest(input.intentDigest, input.soil.symbol),
  ];

  const session = auditSessionKeyConstraints({
    agentAddress: input.sessionKey.agentAddress,
    maxOrderClipUsd: input.sessionKey.maxOrderClipUsd,
    expiresAtMs: input.sessionKey.expiresAtMs,
    approvedAtMs: input.sessionKey.approvedAtMs,
    nowMs,
  });
  reasons.push(...session.reasons);

  const soilEval = evaluateAgentIntentSoil(input, nowMs, requireWasm);
  reasons.push(...soilEval.reasons);

  const deadman = evaluateDeadmanGuard(input, nowMs);
  reasons.push(...deadman.reasons);

  const armor = evaluateArmorGuard(input);
  reasons.push(...armor.reasons);

  const gas = evaluateGasBurstGuard(input, nowMs);
  reasons.push(...gas.reasons);

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
    soilEval.soilOk &&
    deadman.deadmanOk &&
    armor.armorOk &&
    session.ok &&
    gas.gasBurstOk &&
    (att.ok || allowDevBypass);

  return {
    ok: allowedToSign,
    reasons: [...new Set(reasons)],
    allowedToSign,
    clipOk: session.clipOk,
    expiryOk: session.expiryOk,
    soilOk: soilEval.soilOk,
    gasBurstOk: gas.gasBurstOk,
    sessionOk: session.ok,
    deadmanOk: deadman.deadmanOk,
    armorOk: armor.armorOk,
    hasValidAttestation: att.ok,
    wasmUsed: soilEval.wasmUsed,
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
