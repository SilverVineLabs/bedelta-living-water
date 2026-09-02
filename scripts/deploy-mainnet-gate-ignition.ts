#!/usr/bin/env tsx
/**
 * Q3 — Arbitrum One (42161) Gate ignition checklist. Default DRY_RUN (no broadcast).
 * Usage: npx tsx scripts/deploy-mainnet-gate-ignition.ts
 * Live:  CONFIRM_MAINNET_IGNITION=YES BROADCAST=1 PRIVATE_KEY=0x… npx tsx …
 * Forge: forge script scripts/deploy-sepolia-gate.sol:DeploySepoliaGate --rpc-url https://arb1.arbitrum.io/rpc
 */
import { createPublicClient, http } from "viem";
import { arbitrum } from "viem/chains";

const RPC = process.env.ARB_MAINNET_RPC_URL ?? "https://arb1.arbitrum.io/rpc";
const CHAIN_ID = 42161;

async function main(): Promise<void> {
  const client = createPublicClient({ chain: arbitrum, transport: http(RPC) });
  const chainId = await client.getChainId();
  const head = await client.getBlockNumber();
  console.log("[Q3] Arbitrum One Mainnet Ignition Gate — non-custodial / no proxy / chainId", CHAIN_ID);
  console.log("[Q3] rpc", RPC, "observedChainId", chainId, "head", head.toString());
  if (chainId !== CHAIN_ID) throw new Error(`[Q3] refuse: expected ${CHAIN_ID} got ${chainId}`);
  console.log("[Q3] ctor: SliverVineGate(signers ascending, threshold, guardian, admin) + SliverVineAgentPolicyGuard(guardian)");
  console.log("[Q3] Arbiscan Tx placeholder: PASTE_AFTER_BROADCAST (https://arbiscan.io/tx/<hash>)");
  const armed = process.env.BROADCAST === "1" && process.env.CONFIRM_MAINNET_IGNITION === "YES";
  if (!armed) {
    console.log("[Q3] dry-run — set CONFIRM_MAINNET_IGNITION=YES BROADCAST=1 PRIVATE_KEY=0x… to broadcast");
    return;
  }
  if (!process.env.PRIVATE_KEY?.startsWith("0x")) throw new Error("[Q3] PRIVATE_KEY required");
  console.log("[Q3] ignition armed — use Foundry DeploySepoliaGate against arb1 (same ctor, different chainId)");
  console.log("[Q3] forge script scripts/deploy-sepolia-gate.sol:DeploySepoliaGate --rpc-url", RPC, "--broadcast --verify");
}

main().catch((err) => {
  console.error("[Q3] fail-closed", err);
  process.exit(1);
});
