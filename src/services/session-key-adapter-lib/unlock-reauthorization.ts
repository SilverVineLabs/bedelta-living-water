/**
 * EIP-712 master re-authorization — SSOT for clearing R17/R20 hardlocks.
 */

import { verifyTypedData, type TypedDataField } from "ethers";
import { normalizeAddress } from "../../adapters/hl/crypto";
import { buildUserSignedDomain } from "../../adapters/hl/auth/chain-id";
import { HL_USER_SIGNED_CHAIN_ID } from "../../adapters/hl/auth/domains";
import {
  HEALTH_CRI_MAX,
} from "../../config/constants";
import {
  readActiveSystemState,
  updateSystemState,
  type SystemState,
} from "../../core/state";
import { saveSystemStateToKV } from "../kv-lib/system-state";
import type { SliverVineKv } from "../kv-lib/keys";
import { clearCircuitBreakerSever } from "../root-protection-lib/circuit-breaker-sever";
import { appendStateTransactionLog } from "../state/system-state";
import { resolveHudState } from "../systemState";

/** Max age for re-authorization signatures (replay protection). */
export const REAUTH_MAX_AGE_MS = 5 * 60 * 1000;

/** Allowed future clock drift when validating timestampMs. */
export const REAUTH_CLOCK_DRIFT_MS = 30_000;

export const HL_RELEASE_HARDLOCK_TYPES: Record<string, TypedDataField[]> = {
  "HyperliquidTransaction:ReleaseHardlock": [
    { name: "masterAddress", type: "address" },
    { name: "timestampMs", type: "uint64" },
  ],
};

export interface VerifyAndReleaseHardlockParams {
  masterAddress: string;
  eip712Signature: string;
  timestampMs: number;
  /** Optional wallet chain id hex for user-signed domain (defaults HL testnet sepolia). */
  signatureChainId?: string;
  /** Override clock for tests */
  nowMs?: number;
}

export type VerifyAndReleaseHardlockResult =
  | { ok: true; state: SystemState }
  | { ok: false; reason: string };

let unlockKvBinding: SliverVineKv | undefined;

/** Wire Worker KV for hardlock release persistence. */
export function configureUnlockReauthorizationKv(kv: SliverVineKv | undefined): void {
  unlockKvBinding = kv;
}

/** @internal test reset */
export function __resetUnlockReauthorizationKvForTests(): void {
  unlockKvBinding = undefined;
}

export function buildHardlockReleaseTypedData(
  masterAddress: string,
  timestampMs: number,
  signatureChainId: string = HL_USER_SIGNED_CHAIN_ID,
) {
  const normalizedMaster = normalizeAddress(masterAddress);
  return {
    domain: buildUserSignedDomain(signatureChainId),
    types: HL_RELEASE_HARDLOCK_TYPES,
    message: {
      masterAddress: normalizedMaster,
      timestampMs,
    },
  };
}

export function isReauthorizationTimestampFresh(
  timestampMs: number,
  nowMs = Date.now(),
): boolean {
  if (!Number.isFinite(timestampMs) || timestampMs <= 0) return false;
  if (timestampMs > nowMs + REAUTH_CLOCK_DRIFT_MS) return false;
  return nowMs - timestampMs <= REAUTH_MAX_AGE_MS;
}

export function verifyHardlockReleaseSignature(
  masterAddress: string,
  timestampMs: number,
  eip712Signature: string,
  signatureChainId?: string,
): boolean {
  try {
    const normalizedMaster = normalizeAddress(masterAddress);
    const chainId = signatureChainId ?? HL_USER_SIGNED_CHAIN_ID;
    const { domain, types, message } = buildHardlockReleaseTypedData(
      normalizedMaster,
      timestampMs,
      chainId,
    );
    const recovered = verifyTypedData(domain, types, message, eip712Signature);
    return normalizeAddress(recovered) === normalizedMaster;
  } catch {
    return false;
  }
}

function buildReleasedSystemState(current: SystemState): SystemState {
  const cri = HEALTH_CRI_MAX;
  const hardlock = false;
  return updateSystemState({
    patch: {
      accountBalanceUsd: current.accountBalanceUsd,
      currentCri: cri,
      hardlock,
      signingChannelOpen: true,
      hudState: resolveHudState(cri, hardlock),
      sessionKeyMode: "TRADE_ACTIVE",
      sessionKeyStatus: "OK",
      isStale: false,
    },
  });
}

/**
 * Verify master EIP-712 re-authorization and release R17/R20 hardlock.
 * SSOT — all manual hardlock clears must flow through this function.
 */
export async function verifyAndReleaseHardlock(
  params: VerifyAndReleaseHardlockParams,
): Promise<VerifyAndReleaseHardlockResult> {
  const nowMs = params.nowMs ?? Date.now();

  if (!params.masterAddress?.trim()) {
    return { ok: false, reason: "MASTER_ADDRESS_REQUIRED" };
  }

  if (!params.eip712Signature?.trim()) {
    return { ok: false, reason: "EIP712_SIGNATURE_REQUIRED" };
  }

  if (!isReauthorizationTimestampFresh(params.timestampMs, nowMs)) {
    return { ok: false, reason: "REAUTH_TIMESTAMP_EXPIRED" };
  }

  let normalizedMaster: string;
  try {
    normalizedMaster = normalizeAddress(params.masterAddress);
  } catch {
    return { ok: false, reason: "MASTER_ADDRESS_INVALID" };
  }

  const signatureOk = verifyHardlockReleaseSignature(
    normalizedMaster,
    params.timestampMs,
    params.eip712Signature,
    params.signatureChainId,
  );

  if (!signatureOk) {
    return { ok: false, reason: "EIP712_SIGNATURE_INVALID" };
  }

  const current = readActiveSystemState();
  if (!current.hardlock && current.signingChannelOpen) {
    return { ok: false, reason: "HARDLOCK_NOT_ACTIVE" };
  }

  clearCircuitBreakerSever();
  const released = buildReleasedSystemState(current);
  appendStateTransactionLog(
    "SESSION_KEY_REAUTHORIZED: EIP-712 pipeline restored for 24h",
    "R20",
  );

  await saveSystemStateToKV(unlockKvBinding, released);

  return { ok: true, state: released };
}
