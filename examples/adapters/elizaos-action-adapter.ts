#!/usr/bin/env tsx
/**
 * ElizaOS Plugin / Action adapter — pre-consensus soil guard via withCitadelShield().
 * Usage: pnpm tsx examples/adapters/elizaos-action-adapter.ts [--trip]
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

export interface ElizaRuntime {
  agentId: string;
  getSetting?: (key: string) => string | null;
}

export interface ElizaContent {
  text: string;
  action?: string;
  source?: string;
}

/** ElizaOS handler response tuple: [content, didRespond] */
export type ElizaActionResponse = [ElizaContent, boolean];

export interface ElizaActionOptions {
  soil?: SoilResistanceInput;
  intent?: string;
  hud?: boolean;
}

export const simulatedRuntime: ElizaRuntime = {
  agentId: "eliza-citadel-demo",
  getSetting: () => null,
};

async function runElizaShieldedAction(
  runtime: ElizaRuntime,
  options?: ElizaActionOptions,
): Promise<ElizaActionResponse> {
  const soil = options?.soil ?? HEALTHY_SOIL;
  const intent = options?.intent ?? "TRADE_INTENT";
  const showHud = options?.hud ?? false;
  const shieldIntent: CitadelShieldIntent = { ...soil, agentId: runtime.agentId, at: new Date() };

  if (showHud) hudIntent(runtime.agentId, "ElizaOS", intent, "GMX v2 ETH/USDC GM");

  const shielded = withCitadelShield(async () => {
    if (showHud) {
      hudChannelOpen();
      hudDispatched("ElizaOS Action Handler → GMX v2 GM", 0);
    }
    return true;
  });

  try {
    await shielded(shieldIntent);
    return [
      { text: "SOIL_PASS: pre-broadcast clearance granted", action: "CITADEL_SOIL_GUARD", source: "slivervine-citadel" },
      true,
    ];
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (showHud) {
      if (isCooldownError(message)) {
        hudBackoff(runtime.agentId, parseBackoffRemainingSec(message));
      } else {
        hudSoilFuse(false, 0, parseShieldTripReasons(message));
        hudSevered("SOIL_FUSE_TRIP");
        hudBlocked();
      }
    }
    return [{ text: message, source: "slivervine-citadel" }, false];
  }
}

export const citadelSoilGuardAction = {
  name: "CITADEL_SOIL_GUARD",
  similes: ["SOIL_CHECK", "PRE_BROADCAST_GUARD", "CITADEL_SHIELD"],
  description:
    "Pre-consensus intent firewall — runs withCitadelShield() before any trade intent is signed or broadcast.",
  validate: async (): Promise<boolean> => true,
  handler: async (
    runtime: ElizaRuntime,
    _message: unknown,
    _state: unknown,
    options?: ElizaActionOptions,
  ): Promise<ElizaActionResponse> => runElizaShieldedAction(runtime, options),
};

export const citadelShieldPlugin = {
  name: "slivervine-citadel-shield",
  description: "Pre-consensus intent firewall plugin for ElizaOS agent swarms.",
  simulatedRuntime,
  actions: [citadelSoilGuardAction],
};

async function main(): Promise<void> {
  const trip = process.argv.includes("--trip");
  seedAdapterProbes();
  printBanner("ElizaOS Action Adapter");
  printMode(trip);

  const options: ElizaActionOptions = {
    soil: trip ? TOXIC_SOIL : HEALTHY_SOIL,
    intent: trip ? "PROMPT_INJECTION_HIGH_SLIPPAGE_OPEN" : "DELTA_NEUTRAL_GM_DEPOSIT",
    hud: true,
  };

  const [, ok] = await runElizaShieldedAction(simulatedRuntime, options);
  if (!trip) {
    if (!ok) {
      printResult(false);
      process.exit(1);
    }
    printResult(true);
    return;
  }

  if (!ok) {
    printResult(false);
    console.error(`${RED}Phase 1: FAIL_CLOSED (soil fuse trip)${R}`);
  } else {
    printResult(true);
    return;
  }

  printBackoffDivider();
  const [, retryOk] = await runElizaShieldedAction(simulatedRuntime, options);
  if (retryOk) {
    printResult(true);
    return;
  }
  printBackoffResult();
  process.exit(1);
}

const isMain = process.argv[1]?.includes("elizaos-action-adapter");
if (isMain) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
