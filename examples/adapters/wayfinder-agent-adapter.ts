#!/usr/bin/env tsx
/**
 * Wayfinder (Arbitrum Native AI Agent Engine) adapter.
 * Usage: pnpm tsx examples/adapters/wayfinder-agent-adapter.ts [--trip]
 */
import { verifyAgentIntent } from "../../src/sdk/agent-intent";
import { withCitadelShield, type CitadelShieldIntent } from "../../src/sdk/decorator";
import { checkSoilResistance, type SoilResistanceInput } from "../../src/services/risk-control";
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

export interface WayfinderAgentIntentPayload {
  symbol: string;
  hlSpot: number;
  hlPerp: number;
  dydxPerp: number;
  depthUsd: number;
  intent?: string;
  agentId?: string;
  chainId?: number;
}

export interface WayfinderAgentResult {
  success: boolean;
  status: "ALLOW" | "FAIL_CLOSED" | "MANDATORY_COOLDOWN_ACTIVE";
  message: string;
  latencyUs?: number;
  reasons?: string[];
  allowedToSign?: boolean;
}

function payloadToSoil(payload: WayfinderAgentIntentPayload): SoilResistanceInput {
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
  async (_intent: CitadelShieldIntent): Promise<WayfinderAgentResult> => ({
    success: true,
    status: "ALLOW",
    message: "Wayfinder agent: pre-broadcast clearance granted",
  }),
);

export const wayfinderCitadelShieldHook = {
  name: "wayfinder_citadel_shield",
  description:
    "Wayfinder Arbitrum-native AI agent hook — wraps withCitadelShield() and checkSoilResistance() before on-chain intent dispatch.",
  parameters: {
    type: "object" as const,
    properties: {
      symbol: { type: "string", description: "Asset symbol (e.g. ETH)" },
      hlSpot: { type: "number", description: "Hyperliquid spot reference" },
      hlPerp: { type: "number", description: "Hyperliquid perp mark" },
      dydxPerp: { type: "number", description: "dYdX perp mark" },
      depthUsd: { type: "number", description: "Order book depth USD" },
      intent: { type: "string", description: "Wayfinder on-chain intent label" },
      agentId: { type: "string", description: "Wayfinder agent identifier" },
      chainId: { type: "number", description: "Target Arbitrum chain ID (42161 / 421614)" },
    },
    required: ["symbol", "hlSpot", "hlPerp", "dydxPerp", "depthUsd"],
  },
  execute: async (
    payload: WayfinderAgentIntentPayload,
    options?: { hud?: boolean },
  ): Promise<WayfinderAgentResult> => {
    const soil = payloadToSoil(payload);
    const showHud = options?.hud ?? false;
    const agentId = payload.agentId ?? "wayfinder-agent";
    const intent = payload.intent ?? "WAYFINDER_ONCHAIN_INTENT";
    const chainId = payload.chainId ?? 42161;

    if (showHud) hudIntent(agentId, "Wayfinder", intent, `Arbitrum ${chainId} · GMX v2 ETH/USDC GM`);

    const t0 = performance.now();
    const soilProbe = checkSoilResistance(soil);
    if (showHud) hudSoilFuse(soilProbe.ok, (performance.now() - t0) * 1000, soilProbe.reasons);

    const intentVerdict = verifyAgentIntent({
      preset: "test",
      allowDevBypass: true,
      intentDigest: `0x${"00".repeat(32)}`,
      soil: { ...soil, isTestnet: true },
      sessionKey: {
        agentAddress: "0x0000000000000000000000000000000000000001",
        maxOrderClipUsd: 5_000,
        expiresAtMs: Date.now() + 60_000,
        approvedAtMs: Date.now() - 1_000,
      },
      attestation: undefined,
      deadman: { maxSlippageBps: 50 },
      armor: { sandwichRiskBps: 30 },
      gasBurst: { estimatedGasCostUsd: 0.25, sponsored: true, dailySpentUsd: 1.0, chainId },
    });

    try {
      const result = await shieldedExecute({ ...soil, agentId });
      const latencyUs = (performance.now() - t0) * 1000;
      if (showHud) {
        hudChannelOpen();
        hudDispatched(`Wayfinder Agent Engine → Arbitrum ${chainId}`, latencyUs);
      }
      return { ...result, latencyUs, allowedToSign: intentVerdict.allowedToSign };
    } catch (err) {
      const latencyUs = (performance.now() - t0) * 1000;
      const message = err instanceof Error ? err.message : "Citadel Shield trip";
      if (showHud) {
        if (isCooldownError(message)) {
          hudBackoff(agentId, parseBackoffRemainingSec(message));
        } else {
          hudSoilFuse(false, latencyUs, parseShieldTripReasons(message).join("; "));
          hudSevered("SOIL_FUSE_TRIP");
          hudBlocked();
        }
      }
      return {
        success: false,
        status: isCooldownError(message) ? "MANDATORY_COOLDOWN_ACTIVE" : "FAIL_CLOSED",
        message,
        latencyUs,
        reasons: parseShieldTripReasons(message),
        allowedToSign: false,
      };
    }
  },
};

async function main(): Promise<void> {
  const trip = process.argv.includes("--trip");
  seedAdapterProbes();
  printBanner("Wayfinder Agent Adapter");
  printMode(trip);

  const payload: WayfinderAgentIntentPayload = trip
    ? { ...TOXIC_SOIL, intent: "PROMPT_INJECTION_HIGH_SLIPPAGE_OPEN", agentId: "wayfinder-demo" }
    : { ...HEALTHY_SOIL, intent: "DELTA_NEUTRAL_GM_DEPOSIT", agentId: "wayfinder-demo" };

  const result = await wayfinderCitadelShieldHook.execute(payload, { hud: true });
  if (!trip) {
    if (!result.success) {
      printResult(false);
      console.error(`${RED}${result.message}${R}`);
      process.exit(1);
    }
    printResult(true);
    return;
  }

  if (!result.success && result.status === "FAIL_CLOSED") {
    printResult(false);
    console.error(`${RED}Phase 1: ${result.message}${R}`);
    printBackoffDivider();
    const retry = await wayfinderCitadelShieldHook.execute(payload, { hud: true });
    if (retry.status === "MANDATORY_COOLDOWN_ACTIVE") {
      printBackoffResult();
      console.error(`${RED}${retry.message}${R}`);
      process.exit(1);
    }
  }

  if (result.success) printResult(true);
}

const isMain = process.argv[1]?.includes("wayfinder-agent-adapter");
if (isMain) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
