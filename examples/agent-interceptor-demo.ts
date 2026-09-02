#!/usr/bin/env tsx
/**
 * Q2 — Virtuals / ElizaOS pre-broadcast hook (Edge Citadel, 0-Gas).
 * Usage: npx tsx examples/agent-interceptor-demo.ts
 * Trip:  npx tsx examples/agent-interceptor-demo.ts --trip
 */
import { assertCitadelRiskGate, type CitadelRiskGateInput } from "../src/adapters/arbitrum/zerodev-aa/zerodev-aa-gate";
import { __resetArbitrumGasGuardForTests } from "../src/services/risk/arbitrum-gas-guard";
import {
  __resetSequencerGuardCacheForTests,
  __setSequencerProbeForTests,
  SEQUENCER_GRACE_SEC,
} from "../src/services/risk/sequencer-guard";
import { __resetSoftConfirmationGuardForTests, __setSoftConfirmationProbeForTests } from "../src/services/risk/soft-confirmation-guard";

const HEALTHY: CitadelRiskGateInput = {
  symbol: "ETH",
  hlSpot: 3500,
  hlPerp: 3500,
  dydxPerp: 3500,
  depthUsd: 200_000,
  at: new Date(),
};

const TOXIC: CitadelRiskGateInput = { ...HEALTHY, depthUsd: 1, hlPerp: 4200 };

function seedDemoProbes(nowMs: number): void {
  const nowSec = Math.floor(nowMs / 1000);
  __resetArbitrumGasGuardForTests();
  __resetSequencerGuardCacheForTests();
  __resetSoftConfirmationGuardForTests();
  __setSequencerProbeForTests({
    answer: 0,
    startedAtSec: nowSec - SEQUENCER_GRACE_SEC - 1,
    updatedAtSec: nowSec,
    fetchedAtMs: nowMs,
    safe: true,
    reason: null,
  });
  __setSoftConfirmationProbeForTests({
    l2LatestBlock: 1_000_020,
    l1FinalizedBatchBlock: 1_000_000,
    driftBlocks: 20,
    fetchedAtMs: nowMs,
    safe: true,
    reason: null,
  });
}

export async function virtualsAgentExecutionHook(userOpDraft: { soil?: CitadelRiskGateInput }) {
  console.log("[Agent] AI Intent Generated. Intercepting via SliverVine Citadel...");
  try {
    const result = assertCitadelRiskGate(userOpDraft.soil ?? HEALTHY);
    const sequencerSafe = result.chainHealth?.sequencerSafe !== false;
    console.log("[Q2] citadel", {
      sponsored: result.sponsored,
      sequencerSafe,
      gasGuardReason: result.gasGuardReason,
      dailySpentUsd: result.dailySpentUsd,
    });
    if (!sequencerSafe) {
      throw new Error("[Citadel] Blocked Rogue Agent UserOp: RiskLimitExceeded");
    }
    return { ...result, sequencerSafe };
  } catch (err) {
    console.error("[Q2] fail-closed interceptor", err);
    throw err instanceof Error && err.message.startsWith("[Citadel]")
      ? err
      : new Error("[Citadel] Blocked Rogue Agent UserOp: RiskLimitExceeded");
  }
}

async function main(): Promise<void> {
  const trip = process.argv.includes("--trip");
  seedDemoProbes(Date.now());
  console.log("[Q2] Virtuals / ElizaOS Agent Pre-Broadcast Hook", trip ? "TOXIC" : "HEALTHY");
  const out = await virtualsAgentExecutionHook({ soil: trip ? TOXIC : HEALTHY });
  console.log("[Q2] allow path", out.sequencerSafe, "sponsored", out.sponsored);
}

const isMain = process.argv[1]?.includes("agent-interceptor-demo");
if (isMain) {
  main().catch((err) => {
    console.error("[Q2]", err.message ?? err);
    process.exit(1);
  });
}
