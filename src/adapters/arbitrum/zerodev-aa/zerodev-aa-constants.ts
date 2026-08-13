import { entryPoint07Address } from "viem/account-abstraction";

export const ARBITRUM_ONE_CHAIN_ID = 42161 as const;
export const ARBITRUM_NOVA_CHAIN_ID = 42170 as const;
export const ZERODEV_KERNEL_VERSION = "0.3.1" as const;
export const ZERODEV_ENTRY_POINT_VERSION = "0.7" as const;
export const ZERODEV_ENTRY_POINT_ADDRESS = entryPoint07Address;

export function buildZeroDevRpcUrl(projectId: string, chainId: number): string {
  return `https://rpc.zerodev.app/api/v3/${projectId}/chain/${chainId}`;
}

export function resolveKernelVersion(envVersion?: string): typeof ZERODEV_KERNEL_VERSION {
  return envVersion === "0.3.1" || !envVersion ? ZERODEV_KERNEL_VERSION : ZERODEV_KERNEL_VERSION;
}
