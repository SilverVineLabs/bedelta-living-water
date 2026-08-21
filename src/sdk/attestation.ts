/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2026 SilverVine Labs
 *
 * L1 attestation equations (point-form):
 * - digestOk  ⇔ digest = intentDigest ∧ |digest| = 32 bytes hex
 * - freshOk   ⇔ expiresAtMs > nowMs
 * - sigOk     ⇔ sig matches 0x[0-9a-fA-F]+
 * - gateOk    ⇔ verifyingContract = SLIVERVINE_GATE_ADDRESS
 * - domainOk  ⇔ domainName = "SliverVineCitadel"
 * - attOk     ⇔ digestOk ∧ freshOk ∧ sigOk ∧ gateOk ∧ domainOk
 */
import {
  EIP712_DOMAIN_NAME,
  SLIVERVINE_GATE_ADDRESS,
} from "./constants";

export interface CitadelAttestation {
  digest: string;
  expiresAtMs: number;
  sig: string;
  verifyingContract?: string;
  domainName?: string;
}

/** Evaluate Gate-anchored attestation; missing ⇒ fail when requireAttestation. */
export function evaluateAttestation(
  intentDigest: string,
  attestation: CitadelAttestation | undefined,
  nowMs: number,
  requireAttestation: boolean,
): { ok: boolean; reasons: string[] } {
  const reasons: string[] = [];
  if (!attestation) {
    if (requireAttestation) reasons.push("ATTESTATION_REQUIRED");
    return { ok: false, reasons };
  }
  const digest = attestation.digest?.trim() ?? "";
  if (!/^0x[a-fA-F0-9]{64}$/.test(digest)) reasons.push("ATTESTATION_DIGEST_INVALID");
  else if (digest.toLowerCase() !== intentDigest.trim().toLowerCase()) {
    reasons.push("ATTESTATION_DIGEST_MISMATCH");
  }
  if (!Number.isFinite(attestation.expiresAtMs) || attestation.expiresAtMs <= nowMs) {
    reasons.push("ATTESTATION_EXPIRED");
  }
  if (!attestation.sig || !/^0x[a-fA-F0-9]+$/.test(attestation.sig.trim())) {
    reasons.push("ATTESTATION_SIG_INVALID");
  }
  const vc = (attestation.verifyingContract ?? SLIVERVINE_GATE_ADDRESS).toLowerCase();
  if (vc !== SLIVERVINE_GATE_ADDRESS.toLowerCase()) {
    reasons.push("ATTESTATION_VERIFYING_CONTRACT_MISMATCH");
  }
  if ((attestation.domainName ?? EIP712_DOMAIN_NAME) !== EIP712_DOMAIN_NAME) {
    reasons.push("ATTESTATION_DOMAIN_MISMATCH");
  }
  return { ok: reasons.length === 0, reasons };
}
