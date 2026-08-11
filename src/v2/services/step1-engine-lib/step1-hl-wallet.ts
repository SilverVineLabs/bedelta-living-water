import type { MockConfig } from "../../types/step1";
import {
  checkRoleEligibility,
  type RoleEligibilityResult,
} from "./step1-role-eligibility";

const HL_INFO_URL = "https://api.hyperliquid.xyz/info";

/**
 * Fetch HL wallet historical fill count (userFills).
 * Returns 0 on empty address, network failure, or non-array payload.
 */
export async function fetchHlWalletTxCount(
  walletAddress: string,
  options?: { signal?: AbortSignal },
): Promise<number> {
  const user = String(walletAddress || "").trim();
  if (!/^0x[a-fA-F0-9]{40}$/.test(user)) return 0;
  try {
    const res = await fetch(HL_INFO_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "userFills", user }),
      signal: options?.signal,
    });
    if (!res.ok) return 0;
    const data: unknown = await res.json();
    if (!Array.isArray(data)) return 0;
    return data.length;
  } catch {
    return 0;
  }
}

/**
 * End-to-end eligibility: resolve TX count (mock or live HL) then check roles.
 */
export async function checkRoleEligibilityForWallet(
  walletAddress: string,
  config?: MockConfig,
): Promise<RoleEligibilityResult> {
  let txCount = 0;
  if (config?.isMockMode && config.mockUserTxCount !== undefined) {
    txCount = Math.max(0, Math.floor(Number(config.mockUserTxCount) || 0));
  } else {
    txCount = await fetchHlWalletTxCount(walletAddress);
  }
  return checkRoleEligibility({ walletAddress, txCount });
}
