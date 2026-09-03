#!/usr/bin/env tsx
/**
 * Virtuals GAME Framework worker adapter — withCitadelShield() pre-broadcast wrapper.
 * Usage: pnpm tsx examples/adapters/virtuals-game-adapter.ts
 */
import { withCitadelShield, type CitadelShieldIntent } from "../../src/sdk/decorator";
import { seedSafeArbitrumProbes } from "../../tests/helpers/arbitrum-probe-seed";
import { __resetArbitrumGasGuardForTests } from "../../src/services/risk/arbitrum-gas-guard";
import { __resetSequencerGuardCacheForTests } from "../../src/services/risk/sequencer-guard";
import { __resetSoftConfirmationGuardForTests } from "../../src/services/risk/soft-confirmation-guard";

export interface VirtualsGameWorkerPayload {
  action: string;
  intent: CitadelShieldIntent;
}

export interface VirtualsGameWorkerResult {
  status: "ALLOW";
  action: string;
  symbol: string;
  soilLatencyUs?: number;
}

const shieldedGameWorker = withCitadelShield(
  async (intent: CitadelShieldIntent & { action?: string }): Promise<VirtualsGameWorkerResult> => ({
    status: "ALLOW",
    action: intent.action ?? "GAME_TRADE",
    symbol: intent.symbol,
  }),
);

/** Virtuals GAME custom worker entry — soil fuse runs before handler body. */
export async function virtualsGameWorkerHandler(
  payload: VirtualsGameWorkerPayload,
): Promise<VirtualsGameWorkerResult> {
  return shieldedGameWorker({ ...payload.intent, action: payload.action }) as Promise<VirtualsGameWorkerResult>;
}

const DEMO_INTENT: CitadelShieldIntent = {
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
  const result = await virtualsGameWorkerHandler({ action: "DELTA_NEUTRAL_GM_DEPOSIT", intent: DEMO_INTENT });
  console.log(JSON.stringify({ demo: "virtuals-game-adapter", ...result }));
}

const isMain = process.argv[1]?.includes("virtuals-game-adapter");
if (isMain) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
