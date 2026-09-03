#!/usr/bin/env tsx
/**
 * Virtuals GAME Framework FunctionDefinition / worker action adapter.
 * Usage: pnpm tsx examples/adapters/virtuals-game-adapter.ts [--trip]
 */
import { withCitadelShield } from "../../src/sdk/decorator";
import { type SoilResistanceInput } from "../../src/services/risk-control";
import {
  HEALTHY_SOIL,
  hudBlocked,
  hudChannelOpen,
  hudDispatched,
  hudIntent,
  hudSevered,
  hudSoilFuse,
  printBanner,
  printMode,
  printResult,
  R,
  RED,
  seedAdapterProbes,
  TOXIC_SOIL,
} from "./citadel-ansi-hud";

export interface VirtualsGameWorkerPayload {
  symbol: string;
  hlSpot: number;
  hlPerp: number;
  dydxPerp: number;
  depthUsd: number;
  intent?: string;
  agentId?: string;
}

export interface VirtualsGameWorkerResult {
  success: boolean;
  status: "ALLOW" | "FAIL_CLOSED";
  message: string;
  latencyUs?: number;
  reasons?: string[];
}

function payloadToSoil(payload: VirtualsGameWorkerPayload): SoilResistanceInput {
  return {
    symbol: payload.symbol,
    hlSpot: payload.hlSpot,
    hlPerp: payload.hlPerp,
    dydxPerp: payload.dydxPerp,
    depthUsd: payload.depthUsd,
    at: new Date(),
  };
}

const shieldedExecute = withCitadelShield(
  async (soil: SoilResistanceInput): Promise<VirtualsGameWorkerResult> => ({
    success: true,
    status: "ALLOW",
    message: "GAME worker: pre-broadcast clearance granted",
  }),
);

export const citadelSoilGuardFunction: {
  name: string;
  description: string;
  parameters: {
    type: "object";
    properties: Record<string, { type: string; description?: string }>;
    required: string[];
  };
  execute: (payload: VirtualsGameWorkerPayload, options?: { hud?: boolean }) => Promise<VirtualsGameWorkerResult>;
} = {
  name: "citadel_soil_guard",
  description:
    "Virtuals GAME worker action — wraps withCitadelShield() for pre-consensus soil resistance before on-chain dispatch.",
  parameters: {
    type: "object",
    properties: {
      symbol: { type: "string", description: "Asset symbol (e.g. ETH)" },
      hlSpot: { type: "number", description: "Hyperliquid spot reference" },
      hlPerp: { type: "number", description: "Hyperliquid perp mark" },
      dydxPerp: { type: "number", description: "dYdX perp mark" },
      depthUsd: { type: "number", description: "Order book depth USD" },
      intent: { type: "string", description: "Agent intent label" },
      agentId: { type: "string", description: "Virtuals agent identifier" },
    },
    required: ["symbol", "hlSpot", "hlPerp", "dydxPerp", "depthUsd"],
  },
  execute: async (payload, options) => {
    const soil = payloadToSoil(payload);
    const showHud = options?.hud ?? false;
    const agentId = payload.agentId ?? "virtuals-game-agent";
    const intent = payload.intent ?? "GAME_TRADE_INTENT";

    if (showHud) {
      hudIntent(agentId, "Virtuals GAME", intent, "GMX v2 ETH/USDC GM");
    }

    const t0 = performance.now();
    try {
      const result = await shieldedExecute(soil);
      const latencyUs = (performance.now() - t0) * 1000;
      if (showHud) {
        hudSoilFuse(true, latencyUs, []);
        hudChannelOpen();
        hudDispatched("Virtuals GAME Worker → GMX v2 GM", latencyUs);
      }
      return { ...result, latencyUs };
    } catch (err) {
      const latencyUs = (performance.now() - t0) * 1000;
      const reasons = err instanceof Error ? err.message.split("; ") : ["SOIL_FUSE_TRIP"];
      if (showHud) {
        hudSoilFuse(false, latencyUs, reasons);
        hudSevered("SOIL_FUSE_TRIP");
        hudBlocked();
      }
      return {
        success: false,
        status: "FAIL_CLOSED",
        message: err instanceof Error ? err.message : "Citadel Shield trip",
        latencyUs,
        reasons,
      };
    }
  },
};

async function main(): Promise<void> {
  const trip = process.argv.includes("--trip");
  seedAdapterProbes();
  printBanner("Virtuals GAME Adapter");
  printMode(trip);

  const payload: VirtualsGameWorkerPayload = trip
    ? { ...TOXIC_SOIL, intent: "PROMPT_INJECTION_HIGH_SLIPPAGE_OPEN", agentId: "virtuals-game-demo" }
    : { ...HEALTHY_SOIL, intent: "DELTA_NEUTRAL_GM_DEPOSIT", agentId: "virtuals-game-demo" };

  const result = await citadelSoilGuardFunction.execute(payload, { hud: true });
  if (!result.success) {
    printResult(false);
    console.error(`${RED}${result.message}${R}`);
    process.exit(1);
  }
  printResult(true);
}

const isMain = process.argv[1]?.includes("virtuals-game-adapter");
if (isMain) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
