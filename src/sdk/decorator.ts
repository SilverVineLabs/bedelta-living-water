/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2026 SilverVine Labs
 *
 * Pre-Consensus Intent Firewall — zero-touch decorator for Virtuals / ElizaOS / LangChain
 * agent execution hooks. Wraps `checkSoilResistance()` as the Edge clearing layer before
 * EIP-712 signing or Bundler dispatch (0-Gas fail-closed on trip).
 */
import { checkSoilResistance, type SoilResistanceInput } from "../services/risk-control";

export type CitadelShieldIntent = SoilResistanceInput & { agentId?: string };

const COOLDOWN_MS = 60_000;
const activeCooldowns = new Map<string, number>();

export function __clearCitadelCooldownsForTests(): void {
  activeCooldowns.clear();
}

function resolveAgentId(intent: CitadelShieldIntent): string {
  return intent.agentId?.trim() || "default-agent";
}

function activateCooldown(agentId: string): void {
  activeCooldowns.set(agentId, Date.now() + COOLDOWN_MS);
}

function assertCooldownClear(agentId: string): void {
  const cooldownUntil = activeCooldowns.get(agentId);
  if (!cooldownUntil) return;
  const now = Date.now();
  if (now < cooldownUntil) {
    const remainingSec = Math.max(1, Math.ceil((cooldownUntil - now) / 1000));
    throw new Error(
      `[Citadel Back-off] MANDATORY_COOLDOWN_ACTIVE: Agent '${agentId}' tripped soil fuse recently. DO NOT RETRY or invoke LLM inference for the next ${remainingSec} seconds to prevent token burn and RPC rate limits.`,
    );
  }
  activeCooldowns.delete(agentId);
}

function isCooldownTrigger(message: string): boolean {
  const upper = message.toUpperCase();
  return (
    upper.includes("SOIL_RESISTANCE_TRIP") ||
    upper.includes("FAIL_CLOSED") ||
    upper.includes("[CITADEL SHIELD TRIP]")
  );
}

export function withCitadelShield<T extends CitadelShieldIntent>(
  executionFn: (intent: T) => Promise<unknown>,
) {
  return async function shielded(intent: T) {
    const agentId = resolveAgentId(intent);
    assertCooldownClear(agentId);

    const soilResult = checkSoilResistance(intent);
    if (!soilResult.ok) {
      activateCooldown(agentId);
      const reason = soilResult.reasons.join("; ") || "SOIL_RESISTANCE_TRIP";
      throw new Error(`[Citadel Shield Trip] Execution blocked pre-broadcast: ${reason}`);
    }

    try {
      return await executionFn(intent);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      if (isCooldownTrigger(message)) activateCooldown(agentId);
      throw err;
    }
  };
}
