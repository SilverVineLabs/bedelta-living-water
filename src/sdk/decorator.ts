/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2026 SilverVine Labs
 * Zero-touch decorator — wrap Virtuals / ElizaOS / LangChain agent execution hooks.
 */
import { checkSoilResistance, type SoilResistanceInput } from "../services/risk-control";

export type CitadelShieldIntent = SoilResistanceInput;

export function withCitadelShield<T extends CitadelShieldIntent>(
  executionFn: (intent: T) => Promise<unknown>,
) {
  return async function shielded(intent: T) {
    const soilResult = checkSoilResistance(intent);
    if (!soilResult.ok) {
      const reason = soilResult.reasons.join("; ") || "soil fuse tripped";
      throw new Error(`[Citadel Shield Trip] Execution blocked pre-broadcast: ${reason}`);
    }
    return executionFn(intent);
  };
}
