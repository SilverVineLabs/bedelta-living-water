#!/usr/bin/env tsx
/**
 * ElizaOS Plugin / Action adapter — pre-consensus soil guard via checkSoilResistance().
 * Usage: pnpm tsx examples/adapters/elizaos-action-adapter.ts [--trip]
 */
import { checkSoilResistance, type SoilResistanceInput } from "../../src/services/risk-control";
import {
  HEALTHY_SOIL,
  hudBlocked,
  hudChannelOpen,
  hudDispatched,
  hudSevered,
  printBanner,
  printMode,
  printResult,
  R,
  RED,
  runSoilCheckHud,
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

export const citadelSoilGuardAction = {
  name: "CITADEL_SOIL_GUARD",
  similes: ["SOIL_CHECK", "PRE_BROADCAST_GUARD", "CITADEL_SHIELD"],
  description:
    "Pre-consensus intent firewall — runs checkSoilResistance() before any trade intent is signed or broadcast.",
  validate: async (): Promise<boolean> => true,
  handler: async (
    runtime: ElizaRuntime,
    _message: unknown,
    _state: unknown,
    options?: ElizaActionOptions,
  ): Promise<ElizaActionResponse> => {
    const soil = options?.soil ?? HEALTHY_SOIL;
    const intent = options?.intent ?? "TRADE_INTENT";
    const showHud = options?.hud ?? false;
    const { result, measuredUs, pass } = showHud
      ? runSoilCheckHud(soil, { agentId: runtime.agentId, framework: "ElizaOS", intent })
      : (() => {
          const t0 = performance.now();
          const r = checkSoilResistance(soil);
          return { result: r, measuredUs: (performance.now() - t0) * 1000, pass: r.ok };
        })();

    if (!pass) {
      if (showHud) {
        hudSevered("SOIL_FUSE_TRIP");
        hudBlocked();
      }
      const reason = result.reasons.join("; ") || "soil fuse tripped";
      return [{ text: `[Citadel Shield Trip] Execution blocked pre-broadcast: ${reason}`, source: "slivervine-citadel" }, false];
    }
    if (showHud) {
      hudChannelOpen();
      hudDispatched("ElizaOS Action Handler → GMX v2 GM", measuredUs);
    }
    return [
      { text: "SOIL_PASS: pre-broadcast clearance granted", action: "CITADEL_SOIL_GUARD", source: "slivervine-citadel" },
      true,
    ];
  },
};

export const citadelShieldPlugin = {
  name: "slivervine-citadel-shield",
  description: "Pre-consensus intent firewall plugin for ElizaOS agent swarms.",
  actions: [citadelSoilGuardAction],
};

async function main(): Promise<void> {
  const trip = process.argv.includes("--trip");
  seedAdapterProbes();
  printBanner("ElizaOS Action Adapter");
  printMode(trip);
  const [content, ok] = await citadelSoilGuardAction.handler(simulatedRuntime, null, null, {
    soil: trip ? TOXIC_SOIL : HEALTHY_SOIL,
    intent: trip ? "PROMPT_INJECTION_HIGH_SLIPPAGE_OPEN" : "DELTA_NEUTRAL_GM_DEPOSIT",
    hud: true,
  });
  if (!ok) {
    printResult(false);
    console.error(`${RED}${content.text}${R}`);
    process.exit(1);
  }
  printResult(true);
}

const isMain = process.argv[1]?.includes("elizaos-action-adapter");
if (isMain) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
