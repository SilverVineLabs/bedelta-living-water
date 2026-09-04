/**
 * SPDX-License-Identifier: Apache-2.0
 * Prompt-injection + intent-digest gates.
 */

const PROMPT_INJECTION_RE =
  /(ignore\s+(all\s+)?(previous|prior)\s+instructions|system\s*:|<\s*script|DROP\s+TABLE|;\s*rm\s+-rf)/i;

export function evaluateInjectionAndDigest(
  intentDigest: string,
  soilSymbol: string,
): string[] {
  const reasons: string[] = [];
  if (PROMPT_INJECTION_RE.test(intentDigest) || PROMPT_INJECTION_RE.test(soilSymbol)) {
    reasons.push("PROMPT_INJECTION_REJECTED");
  }
  if (!/^0x[a-fA-F0-9]{64}$/.test(intentDigest.trim())) {
    reasons.push("INTENT_DIGEST_INVALID");
  }
  return reasons;
}
