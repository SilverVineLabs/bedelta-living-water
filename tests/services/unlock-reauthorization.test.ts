import { Wallet } from "ethers";
import { afterEach, describe, expect, it } from "vitest";
import {
  __resetCircuitBreakerSeverForTests,
  readActiveCircuitBreakerSeverTarget,
} from "../../src/services/root-protection-lib/circuit-breaker-sever";
import {
  buildHardlockReleaseTypedData,
  REAUTH_MAX_AGE_MS,
  verifyAndReleaseHardlock,
  __resetUnlockReauthorizationKvForTests,
} from "../../src/services/session-key-adapter-lib/unlock-reauthorization";
import {
  __setSystemStateForTests,
  buildBlockedSystemState,
  readActiveSystemState,
} from "../../src/core/state";
import { resolveHlTestnetDryRunPrivateKey } from "../../src/env/hl-testnet-key";

const TEST_PRIVATE_KEY = resolveHlTestnetDryRunPrivateKey();
const TEST_MASTER_ADDRESS = new Wallet(TEST_PRIVATE_KEY).address;
const OTHER_MASTER_ADDRESS = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8";

afterEach(() => {
  __setSystemStateForTests(null);
  __resetCircuitBreakerSeverForTests();
  __resetUnlockReauthorizationKvForTests();
});

async function signRelease(
  wallet: Wallet,
  timestampMs: number,
  masterAddress = TEST_MASTER_ADDRESS,
): Promise<string> {
  const { domain, types, message } = buildHardlockReleaseTypedData(
    masterAddress,
    timestampMs,
  );
  return wallet.signTypedData(domain, types, message);
}

describe("verifyAndReleaseHardlock", () => {
  it("releases R20 hardlock on valid master EIP-712 signature", async () => {
    __setSystemStateForTests(buildBlockedSystemState());
    const wallet = new Wallet(TEST_PRIVATE_KEY);
    const timestampMs = Date.now();
    const signature = await signRelease(wallet, timestampMs);

    const result = await verifyAndReleaseHardlock({
      masterAddress: TEST_MASTER_ADDRESS,
      eip712Signature: signature,
      timestampMs,
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.state.hardlock).toBe(false);
    expect(result.state.signingChannelOpen).toBe(true);
    expect(result.state.hudState).toBe("GREEN");
    expect(result.state.sessionKeyMode).toBe("TRADE_ACTIVE");
    expect(result.state.sessionKeyStatus).toBe("OK");
    expect(readActiveCircuitBreakerSeverTarget()).toBeNull();
    expect(readActiveSystemState().hardlock).toBe(false);
  });

  it("rejects invalid EIP-712 signature", async () => {
    __setSystemStateForTests(buildBlockedSystemState());

    const result = await verifyAndReleaseHardlock({
      masterAddress: TEST_MASTER_ADDRESS,
      eip712Signature: "0x" + "11".repeat(65),
      timestampMs: Date.now(),
    });

    expect(result).toEqual({ ok: false, reason: "EIP712_SIGNATURE_INVALID" });
    expect(readActiveSystemState().hardlock).toBe(true);
  });

  it("rejects expired re-authorization timestamp", async () => {
    __setSystemStateForTests(buildBlockedSystemState());
    const wallet = new Wallet(TEST_PRIVATE_KEY);
    const timestampMs = Date.now() - REAUTH_MAX_AGE_MS - 60_000;
    const signature = await signRelease(wallet, timestampMs);

    const result = await verifyAndReleaseHardlock({
      masterAddress: TEST_MASTER_ADDRESS,
      eip712Signature: signature,
      timestampMs,
      nowMs: Date.now(),
    });

    expect(result).toEqual({ ok: false, reason: "REAUTH_TIMESTAMP_EXPIRED" });
    expect(readActiveSystemState().hardlock).toBe(true);
  });

  it("rejects mismatched master address", async () => {
    __setSystemStateForTests(buildBlockedSystemState());
    const wallet = new Wallet(TEST_PRIVATE_KEY);
    const timestampMs = Date.now();
    const signature = await signRelease(wallet, timestampMs, TEST_MASTER_ADDRESS);

    const result = await verifyAndReleaseHardlock({
      masterAddress: OTHER_MASTER_ADDRESS,
      eip712Signature: signature,
      timestampMs,
    });

    expect(result).toEqual({ ok: false, reason: "EIP712_SIGNATURE_INVALID" });
    expect(readActiveSystemState().hardlock).toBe(true);
  });

  it("rejects release when hardlock is not active", async () => {
    const wallet = new Wallet(TEST_PRIVATE_KEY);
    const timestampMs = Date.now();
    const signature = await signRelease(wallet, timestampMs);

    const result = await verifyAndReleaseHardlock({
      masterAddress: TEST_MASTER_ADDRESS,
      eip712Signature: signature,
      timestampMs,
    });

    expect(result).toEqual({ ok: false, reason: "HARDLOCK_NOT_ACTIVE" });
  });
});
