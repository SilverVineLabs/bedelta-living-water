#!/usr/bin/env tsx
/**
 * Q1 — Sepolia Gate telemetry: replay Dune-indexable logs; optional RiskTripBlocked emit.
 * Usage: npx tsx scripts/emit-sepolia-telemetry-events.ts
 * Broadcast: BROADCAST=1 PRIVATE_KEY=0x… npx tsx scripts/emit-sepolia-telemetry-events.ts
 */
import { createPublicClient, createWalletClient, http, parseAbi, type Hex } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { arbitrumSepolia } from "viem/chains";
import { SLIVERVINE_GATE_SEPOLIA_ADDRESS } from "../src/sdk/constants";

const GATE = SLIVERVINE_GATE_SEPOLIA_ADDRESS as Hex;
const RPC = process.env.ARB_SEPOLIA_RPC_URL ?? "https://sepolia-rollup.arbitrum.io/rpc";
const eventsAbi = parseAbi([
  "event IntentAttested(bytes32 indexed intentHash, address indexed agent, uint8 action, uint256 shadowMarginUsd)",
  "event RiskTripBlocked(bytes32 indexed intentHash, address indexed agent, string reason)",
]);
const abi = parseAbi([
  "function halted() view returns (bool)",
  "function tryReportRiskTrip((bytes32 payloadHash,address subject,uint8 verdict,uint16 riskBps,uint64 issuedAt,uint64 expiresAt,uint256 nonce) att, bytes[] signatures, address agent, string reason) returns (bytes4)",
]);

async function main(): Promise<void> {
  const client = createPublicClient({ chain: arbitrumSepolia, transport: http(RPC) });
  const [chainId, halted, latest] = await Promise.all([
    client.getChainId(),
    client.readContract({ address: GATE, abi, functionName: "halted" }),
    client.getBlockNumber(),
  ]);
  console.log("[Q1] Dune Telemetry (Sepolia Live Verification & Production SQL Spec)");
  console.log("[Q1] rpc", RPC, "chainId", chainId, "gate", GATE, "halted", halted, "head", latest.toString());
  const fromBlock = latest > 8_000n ? latest - 8_000n : 0n;
  const logs = await client.getLogs({ address: GATE, events: eventsAbi, fromBlock, toBlock: latest });
  console.log("[Q1] indexed events (last ~8k blocks)", logs.length);
  for (const log of logs.slice(-8)) {
    console.log("[Q1] log", log.eventName, log.transactionHash, log.args);
  }
  if (process.env.BROADCAST !== "1") {
    console.log("[Q1] dry-run — set BROADCAST=1 PRIVATE_KEY=0x… to emit RiskTripBlocked (no consume-once ALLOW)");
    return;
  }
  const pk = process.env.PRIVATE_KEY as Hex | undefined;
  if (!pk?.startsWith("0x")) throw new Error("[Q1] PRIVATE_KEY required for broadcast");
  const account = privateKeyToAccount(pk);
  const wallet = createWalletClient({ account, chain: arbitrumSepolia, transport: http(RPC) });
  const now = BigInt(Math.floor(Date.now() / 1000));
  const hash = await wallet.writeContract({
    address: GATE,
    abi,
    functionName: "tryReportRiskTrip",
    args: [
      {
        payloadHash: `0x${"11".repeat(32)}`,
        subject: account.address,
        verdict: 0,
        riskBps: 9900,
        issuedAt: now,
        expiresAt: now + 30n,
        nonce: now,
      },
      [],
      account.address,
      "Q1_SEPOLIA_TELEMETRY_TRIP",
    ],
  });
  console.log("[Q1] RiskTripBlocked tx", hash);
  console.log("[Q1] arbiscan", `https://sepolia.arbiscan.io/tx/${hash}`);
}

main().catch((err) => {
  console.error("[Q1] fail-closed", err);
  process.exit(1);
});
