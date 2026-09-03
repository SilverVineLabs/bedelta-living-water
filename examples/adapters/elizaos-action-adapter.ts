#!/usr/bin/env tsx
/**
 * ElizaOS Action adapter — pre-consensus soil guard via checkSoilResistance().
 * Usage: pnpm tsx examples/adapters/elizaos-action-adapter.ts
 */
import { checkSoilResistance, type SoilResistanceInput } from "../../src/services/risk-control";
import { seedSafeArbitrumProbes } from "../../tests/helpers/arbitrum-probe-seed";
import { __resetArbitrumGasGuardForTests } from "../../src/services/risk/arbitrum-gas-guard";
import { __resetSequencerGuardCacheForTests } from "../../src/services/risk/sequencer-guard";
import { __resetSoftConfirmationGuardForTests } from "../../src/services/risk/soft-confirmation-guard";

export interface ElizaCitadelActionOptions {
  soil?: SoilResistanceInput;
}

export interface ElizaActionResult {
  success: boolean;
  text: string;
}

/** ElizaOS-compatible Action export (name / description / handler). */
export const citadelSoilGuardAction = {
  name: "CITADEL_SOIL_GUARD",
  similes: ["SOIL_CHECK", "PRE_BROADCAST_GUARD", "CITADEL_SHIELD"],
  description:
    "Pre-consensus intent firewall — runs checkSoilResistance() before any trade intent is signed or broadcast.",
  validate: async (): Promise<boolean> => true,
  handler: async (
    _runtime: unknown,
    _message: unknown,
    _state: unknown,
    options?: ElizaCitadelActionOptions,
  ): Promise<ElizaActionResult> => {
    const soil: SoilResistanceInput = options?.soil ?? {
      symbol: "ETH",
      hlSpot: 3500,
      hlPerp: 3500,
      dydxPerp: 3500,
      depthUsd: 200_000,
    };
    const result = checkSoilResistance(soil);
    if (!result.ok) {
      const reason = result.reasons.join("; ") || "soil fuse tripped";
      return { success: false, text: `[Citadel Shield Trip] Execution blocked pre-broadcast: ${reason}` };
    }
    return { success: true, text: "SOIL_PASS: pre-broadcast clearance granted" };
  },
};

async function main(): Promise<void> {
  const now = Date.now();
  __resetArbitrumGasGuardForTests();
  __resetSequencerGuardCacheForTests();
  __resetSoftConfirmationGuardForTests();
  seedSafeArbitrumProbes(now);
  const pass = await citadelSoilGuardAction.handler(null, null, null, {});
  console.log(JSON.stringify({ demo: "elizaos-action-adapter", ...pass }));
}

const isMain = process.argv[1]?.includes("elizaos-action-adapter");
if (isMain) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
