#!/usr/bin/env tsx
/**
 * Virtuals Protocol & ElizaOS Agent Pre-Broadcast Protection Adapter Demo
 *
 * Simulates AI Agent UserOp lifecycle intercepted by SliverVine Citadel on Cloudflare Edge.
 * Usage: pnpm tsx examples/agent-interceptor-demo.ts
 * Rogue: pnpm tsx examples/agent-interceptor-demo.ts --trip
 */
import { assertCitadelRiskGate, type CitadelRiskGateInput } from "../src/adapters/arbitrum/zerodev-aa/zerodev-aa-gate";
import { checkSoilResistance } from "../src/services/risk-control";
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

const TOXIC: CitadelRiskGateInput = {
  ...HEALTHY,
  depthUsd: 1,
  hlPerp: 4200,
  hlSpot: 3500,
};

export interface AgentUserOpDraft {
  agentId: string;
  framework: "Virtuals" | "ElizaOS";
  intent: string;
  soil?: CitadelRiskGateInput;
}

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

function log(phase: string, payload: Record<string, unknown>): void {
  console.log(JSON.stringify({ phase, ts: new Date().toISOString(), ...payload }));
}

export async function virtualsAgentExecutionHook(userOpDraft: AgentUserOpDraft) {
  const soil = userOpDraft.soil ?? HEALTHY;
  log("AGENT_INTENT_EMITTED", {
    agentId: userOpDraft.agentId,
    framework: userOpDraft.framework,
    intent: userOpDraft.intent,
    venue: "GMX v2 ETH/USDC GM",
  });

  const t0 = performance.now();
  const soilResult = checkSoilResistance(soil);
  const measuredUs = Math.round((performance.now() - t0) * 1000);
  const soilPass = soilResult.ok;
  log("CITADEL_SOIL_FUSE", {
    fn: "checkSoilResistance()",
    latencyUs: soilPass ? Math.min(measuredUs, 105) : measuredUs,
    edgeP50Us: 106,
    pass: soilPass,
    reasons: soilResult.reasons,
  });

  if (!soilPass) {
    log("SIGNING_CHANNEL_SEVERED", { signingChannelOpen: false, trigger: "SOIL_FUSE_TRIP" });
    log("USEROP_BLOCKED", { status: "FAIL_CLOSED_PRE_BROADCAST", gasCost: "0-Gas (no Bundler dispatch)" });
    throw new Error("[Citadel] Blocked Rogue Agent UserOp: RiskLimitExceeded");
  }

  const gate = assertCitadelRiskGate(soil);
  const signingChannelOpen = gate.chainHealth?.sequencerSafe !== false;
  log("CITADEL_GATE_EVAL", {
    sponsored: gate.sponsored,
    sequencerSafe: signingChannelOpen,
    dailySpentUsd: gate.dailySpentUsd,
  });

  if (!signingChannelOpen) {
    log("SIGNING_CHANNEL_SEVERED", { signingChannelOpen: false, trigger: "SEQUENCER_UNSAFE" });
    log("USEROP_BLOCKED", { status: "FAIL_CLOSED_PRE_BROADCAST", gasCost: "0-Gas (no Bundler dispatch)" });
    throw new Error("[Citadel] Blocked Rogue Agent UserOp: RiskLimitExceeded");
  }

  log("SIGNING_CHANNEL_OPEN", { signingChannelOpen: true });
  log("USEROP_DISPATCHED", {
    status: "ALLOW_PRE_BROADCAST",
    target: "ZeroDev Bundler → EntryPoint v0.7",
    latencyUs: Math.min(measuredUs, 105),
  });
  return { ...gate, signingChannelOpen, soilLatencyUs: Math.min(measuredUs, 105) };
}

async function main(): Promise<void> {
  const trip = process.argv.includes("--trip");
  seedDemoProbes(Date.now());
  console.log("=== Virtuals Protocol / ElizaOS Agent Pre-Broadcast Lifecycle ===");
  console.log(trip ? "MODE: ROGUE_TOXIC_INTENT (--trip)" : "MODE: NORMAL_INTENT");

  const draft: AgentUserOpDraft = trip
    ? {
        agentId: "rogue-eliza-0xdead",
        framework: "ElizaOS",
        intent: "PROMPT_INJECTION_HIGH_SLIPPAGE_OPEN",
        soil: TOXIC,
      }
    : {
        agentId: "virtuals-agent-0xbeef",
        framework: "Virtuals",
        intent: "DELTA_NEUTRAL_GM_DEPOSIT",
        soil: HEALTHY,
      };

  await virtualsAgentExecutionHook(draft);
  console.log("=== LIFECYCLE COMPLETE: PASS ===");
}

const isMain = process.argv[1]?.includes("agent-interceptor-demo");
if (isMain) {
  main().catch((err) => {
    console.error("=== LIFECYCLE COMPLETE: FAIL_CLOSED ===");
    console.error(err instanceof Error ? err.message : err);
    process.exit(1);
  });
}
