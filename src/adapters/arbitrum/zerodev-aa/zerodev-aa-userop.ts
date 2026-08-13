import { zeroAddress, type Address, type Hex } from "viem";
import { ZERODEV_ENTRY_POINT_ADDRESS } from "./zerodev-aa-constants";
import type { KernelBuildResult } from "./zerodev-aa-kernel";

export const ZERODEV_SPONSORED_DEFAULT = true as const;

export interface ZeroDevPaymasterMiddleware {
  sponsored: true;
  paymaster: true;
  bundlerRpc: string;
  chainId: number;
  sponsorMethod: "zerodev.sponsorUserOperation";
}

export interface UserOpDraft {
  sender: Address;
  callData: Hex;
  entryPoint: Address;
  kernelVersion: string;
  sponsored: boolean;
  paymasterMiddleware?: ZeroDevPaymasterMiddleware;
}

export interface UserOpBuildOptions {
  sponsored?: boolean;
  bundlerRpc?: string;
  chainId?: number;
}

/** Attach ZeroDev paymaster sponsorship middleware — explicit `sponsored: true` path. */
export function attachPaymasterMiddleware(
  bundlerRpc: string,
  chainId: number,
): ZeroDevPaymasterMiddleware {
  return {
    sponsored: true,
    paymaster: true,
    bundlerRpc,
    chainId,
    sponsorMethod: "zerodev.sponsorUserOperation",
  };
}

/** Local UserOp callData + paymaster middleware — no bundler broadcast; dry-run / smoke. */
export async function buildUserOpDraft(
  kernel: KernelBuildResult,
  options: UserOpBuildOptions = {},
): Promise<UserOpDraft> {
  const sponsored = options.sponsored ?? ZERODEV_SPONSORED_DEFAULT;
  const chainId = options.chainId ?? kernel.chainId;
  const callData = await kernel.account.encodeCalls([{ to: zeroAddress, value: 0n, data: "0x" }]);
  const draft: UserOpDraft = {
    sender: kernel.address,
    callData,
    entryPoint: ZERODEV_ENTRY_POINT_ADDRESS,
    kernelVersion: "0.3.1",
    sponsored,
  };
  if (sponsored && options.bundlerRpc) {
    draft.paymasterMiddleware = attachPaymasterMiddleware(options.bundlerRpc, chainId);
  }
  return draft;
}
