#!/usr/bin/env tsx
/**
 * LangChain DynamicTool-compatible adapter — checkSoilResistance() fail-closed guard.
 * Usage: pnpm tsx examples/adapters/langchain-agent-adapter.ts
 *
 * With @langchain/core installed:
 *   import { DynamicTool } from "@langchain/core/tools";
 *   const tool = new DynamicTool(createCitadelSoilDynamicTool());
 */
import { checkSoilResistance, type SoilResistanceInput } from "../../src/services/risk-control";
import { seedSafeArbitrumProbes } from "../../tests/helpers/arbitrum-probe-seed";
import { __resetArbitrumGasGuardForTests } from "../../src/services/risk/arbitrum-gas-guard";
import { __resetSequencerGuardCacheForTests } from "../../src/services/risk/sequencer-guard";
import { __resetSoftConfirmationGuardForTests } from "../../src/services/risk/soft-confirmation-guard";

export interface CitadelDynamicToolFields {
  name: string;
  description: string;
  func: (input: string) => Promise<string>;
}

/** Fields accepted by `new DynamicTool({ ... })` from `@langchain/core/tools`. */
export function createCitadelSoilDynamicTool(): CitadelDynamicToolFields {
  return {
    name: "citadel_soil_guard",
    description:
      "Pre-consensus soil fuse. Input: JSON SoilResistanceInput. Throws on trip; returns JSON pass payload on success.",
    func: async (input: string): Promise<string> => {
      const soil = JSON.parse(input) as SoilResistanceInput;
      const result = checkSoilResistance(soil);
      if (!result.ok) {
        const reason = result.reasons.join("; ") || "soil fuse tripped";
        throw new Error(`[Citadel Shield Trip] Execution blocked pre-broadcast: ${reason}`);
      }
      return JSON.stringify({ ok: true, tripped: false, reasons: result.reasons });
    },
  };
}

/** Runnable tool surface for agents without installing @langchain/core. */
export const citadelSoilLangChainTool = createCitadelSoilDynamicTool();

const DEMO_INPUT: SoilResistanceInput = {
  symbol: "ETH",
  hlSpot: 3500,
  hlPerp: 3500,
  dydxPerp: 3500,
  depthUsd: 200_000,
};

async function main(): Promise<void> {
  const now = Date.now();
  __resetArbitrumGasGuardForTests();
  __resetSequencerGuardCacheForTests();
  __resetSoftConfirmationGuardForTests();
  seedSafeArbitrumProbes(now);
  const out = await citadelSoilLangChainTool.func(JSON.stringify(DEMO_INPUT));
  console.log(JSON.stringify({ demo: "langchain-agent-adapter", result: JSON.parse(out) }));
}

const isMain = process.argv[1]?.includes("langchain-agent-adapter");
if (isMain) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
