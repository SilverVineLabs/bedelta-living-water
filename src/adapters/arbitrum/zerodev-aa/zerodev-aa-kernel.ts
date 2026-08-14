import { createPublicClient, http, type Hex } from "viem";
import { arbitrum, arbitrumNova, arbitrumSepolia } from "viem/chains";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import { createKernelAccount } from "@zerodev/sdk";
import { signerToEcdsaValidator } from "@zerodev/ecdsa-validator";
import type { SmartAccount } from "viem/account-abstraction";
import {
  ARBITRUM_ONE_CHAIN_ID,
  ARBITRUM_NOVA_CHAIN_ID,
  ZERODEV_ENTRY_POINT_ADDRESS,
  ZERODEV_KERNEL_VERSION,
} from "./zerodev-aa-constants";
import { ARBITRUM_SEPOLIA_CHAIN_ID } from "./zerodev-aa-chain";
import { resolveArbitrumRpcUrl } from "./zerodev-aa-chain";

export type ZeroDevViemChain = typeof arbitrum | typeof arbitrumNova | typeof arbitrumSepolia;

export interface KernelBuildInput {
  chainId?: number;
  chain?: ZeroDevViemChain;
  rpcUrl?: string;
  ownerPrivateKey?: Hex;
  kernelVersion?: string;
}

export interface KernelBuildResult {
  address: `0x${string}`;
  account: SmartAccount;
  owner: ReturnType<typeof privateKeyToAccount>;
  chainId: number;
}

function resolveChain(chainId: number): ZeroDevViemChain {
  if (chainId === ARBITRUM_ONE_CHAIN_ID) return arbitrum;
  if (chainId === ARBITRUM_NOVA_CHAIN_ID) return arbitrumNova;
  if (chainId === ARBITRUM_SEPOLIA_CHAIN_ID) return arbitrumSepolia;
  throw new Error(`zerodev-aa: unsupported chainId ${chainId}`);
}

export async function buildKernelAccount(input: KernelBuildInput = {}): Promise<KernelBuildResult> {
  const chainId = input.chainId ?? ARBITRUM_ONE_CHAIN_ID;
  const chain = input.chain ?? resolveChain(chainId);
  const rpcUrl = input.rpcUrl ?? resolveArbitrumRpcUrl(process.env as Record<string, string>, chainId);
  const owner = privateKeyToAccount(input.ownerPrivateKey ?? generatePrivateKey());
  const publicClient = createPublicClient({ chain, transport: http(rpcUrl) });
  const kernelVersion = (input.kernelVersion ?? ZERODEV_KERNEL_VERSION) as "0.3.1";

  const validator = await signerToEcdsaValidator(publicClient, {
    signer: owner,
    entryPoint: { address: ZERODEV_ENTRY_POINT_ADDRESS, version: "0.7" },
    kernelVersion,
  });

  const account = await createKernelAccount(publicClient, {
    plugins: { sudo: validator },
    entryPoint: { address: ZERODEV_ENTRY_POINT_ADDRESS, version: "0.7" },
    kernelVersion,
  });

  return { address: account.address, account, owner, chainId };
}
