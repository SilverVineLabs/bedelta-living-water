#!/usr/bin/env tsx
/**
 * LangChain DynamicTool-compatible adapter with Zod-style JSON schema.
 * Usage: pnpm tsx examples/adapters/langchain-agent-adapter.ts [--trip]
 */
import { withCitadelShield, type CitadelShieldIntent } from "../../src/sdk/decorator";
import { type SoilResistanceInput } from "../../src/services/risk-control";
import {
  HEALTHY_SOIL,
  hudBackoff,
  hudBlocked,
  hudChannelOpen,
  hudDispatched,
  hudIntent,
  hudSevered,
  hudSoilFuse,
  isCooldownError,
  parseBackoffRemainingSec,
  parseShieldTripReasons,
  printBackoffDivider,
  printBackoffResult,
  printBanner,
  printMode,
  printResult,
  R,
  RED,
  seedAdapterProbes,
  TOXIC_SOIL,
} from "./citadel-ansi-hud";

export const soilInputJsonSchema = {
  type: "object" as const,
  properties: {
    symbol: { type: "string", description: "Asset symbol" },
    hlSpot: { type: "number", description: "Hyperliquid spot reference" },
    hlPerp: { type: "number", description: "Hyperliquid perp mark" },
    dydxPerp: { type: "number", description: "dYdX perp mark" },
    depthUsd: { type: "number", description: "Order book depth USD" },
    intent: { type: "string", description: "Agent intent label" },
    agentId: { type: "string", description: "LangChain agent identifier" },
  },
  required: ["symbol", "hlSpot", "hlPerp", "dydxPerp", "depthUsd"],
};

export interface CitadelToolInput extends SoilResistanceInput {
  intent?: string;
  agentId?: string;
}

function parseToolInput(raw: string): CitadelToolInput {
  const parsed = JSON.parse(raw) as CitadelToolInput;
  return { ...parsed, at: new Date() };
}

async function runCitadelSoilTool(raw: string, hud: boolean): Promise<string> {
  const input = parseToolInput(raw);
  const { symbol, hlSpot, hlPerp, dydxPerp, depthUsd, at, intent, agentId } = input;
  const soil: CitadelShieldIntent = {
    symbol,
    hlSpot,
    hlPerp,
    dydxPerp,
    depthUsd,
    at,
    agentId: agentId ?? "langchain-agent",
  };
  const resolvedAgentId = soil.agentId ?? "langchain-agent";
  const resolvedIntent = intent ?? "TRADE_INTENT";

  if (hud) hudIntent(resolvedAgentId, "LangChain", resolvedIntent, "GMX v2 ETH/USDC GM");

  const shielded = withCitadelShield(async () => "SOIL_PASS: pre-broadcast clearance granted");

  try {
    const pass = await shielded(soil);
    if (hud) {
      hudChannelOpen();
      hudDispatched("LangChain DynamicTool → GMX v2 GM", 0);
    }
    return pass;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (hud) {
      if (isCooldownError(message)) {
        hudBackoff(resolvedAgentId, parseBackoffRemainingSec(message));
      } else {
        hudSoilFuse(false, 0, parseShieldTripReasons(message));
        hudSevered("SOIL_FUSE_TRIP");
        hudBlocked();
      }
    }
    throw err;
  }
}

/** @langchain/core/tools DynamicTool-compatible spec (no runtime dependency). */
export const citadelSoilGuardTool = {
  name: "citadel_soil_guard",
  description:
    "Pre-consensus intent firewall — runs withCitadelShield() before any trade intent is signed or broadcast.",
  schema: soilInputJsonSchema,
  func: (input: string) => runCitadelSoilTool(input, false),
};

export async function invokeCitadelSoilGuardTool(input: CitadelToolInput, hud = false): Promise<string> {
  return runCitadelSoilTool(JSON.stringify(input), hud);
}

async function main(): Promise<void> {
  const trip = process.argv.includes("--trip");
  seedAdapterProbes();
  printBanner("LangChain DynamicTool Adapter");
  printMode(trip);

  const input: CitadelToolInput = trip
    ? { ...TOXIC_SOIL, intent: "PROMPT_INJECTION_HIGH_SLIPPAGE_OPEN", agentId: "langchain-demo" }
    : { ...HEALTHY_SOIL, intent: "DELTA_NEUTRAL_GM_DEPOSIT", agentId: "langchain-demo" };

  if (!trip) {
    try {
      await invokeCitadelSoilGuardTool(input, true);
      printResult(true);
    } catch (err) {
      printResult(false);
      console.error(`${RED}${err instanceof Error ? err.message : String(err)}${R}`);
      process.exit(1);
    }
    return;
  }

  try {
    await invokeCitadelSoilGuardTool(input, true);
    printResult(true);
  } catch (err) {
    printResult(false);
    console.error(`${RED}Phase 1: ${err instanceof Error ? err.message : String(err)}${R}`);
  }

  printBackoffDivider();
  try {
    await invokeCitadelSoilGuardTool(input, true);
    printResult(true);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (isCooldownError(message)) printBackoffResult();
    console.error(`${RED}${message}${R}`);
    process.exit(1);
  }
}

const isMain = process.argv[1]?.includes("langchain-agent-adapter");
if (isMain) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
