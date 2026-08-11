import { afterEach, describe, expect, it } from "vitest";
import {
  DefenseMatrixError,
  assertSessionKeyExecutionGates,
  buildSessionKeyEip712Stub,
  signAndExecuteOrder,
  stubSignSessionKeyPayload,
} from "../../src/services/session-key-adapter";
import {
  __setSystemStateForTests,
  buildSystemState,
  readActiveSystemState,
} from "../../src/core/state";

const BASE_ORDER = {
  asset: 0,
  isBuy: true,
  limitPx: "100",
  sz: "1",
  reduceOnly: false,
  orderType: { limit: { tif: "Gtc" as const } },
};

afterEach(() => {
  __setSystemStateForTests(null);
});

describe("session-key-adapter", () => {
  it("signAndExecuteOrder succeeds when gates pass", async () => {
    const state = buildSystemState({
      accountBalanceUsd: 10_000,
      currentCri: 100,
      skipHardlockAssert: true,
    });

    const result = await signAndExecuteOrder(BASE_ORDER, { systemState: state });

    expect(result.success).toBe(true);
    expect(result.signatureHash).toMatch(/^0x[0-9a-f]{64}$/);
    expect(result.errorReason).toBeNull();
  });

  it("dryRun skips stub signing", async () => {
    const state = buildSystemState({
      currentCri: 100,
      skipHardlockAssert: true,
    });

    const result = await signAndExecuteOrder(BASE_ORDER, {
      systemState: state,
      dryRun: true,
    });

    expect(result).toEqual({
      success: true,
      signatureHash: null,
      errorReason: null,
    });
  });

  it("intercepts and severs when signingChannelOpen=false", async () => {
    const state = buildSystemState({
      currentCri: 100,
      skipHardlockAssert: true,
    });
    __setSystemStateForTests({ ...state, signingChannelOpen: true });

    await expect(
      signAndExecuteOrder(BASE_ORDER, {
        systemState: { ...state, signingChannelOpen: false },
      }),
    ).rejects.toMatchObject({
      code: "SESSION_KEY_HARDLOCK_INTERCEPTED",
    });

    expect(readActiveSystemState().signingChannelOpen).toBe(false);
  });

  it("intercepts when R20 locked (hardlock)", async () => {
    const state = buildSystemState({
      currentCri: 0,
      skipHardlockAssert: true,
    });

    await expect(
      signAndExecuteOrder(BASE_ORDER, { systemState: state }),
    ).rejects.toMatchObject({
      code: "SESSION_KEY_HARDLOCK_INTERCEPTED",
      reasons: expect.arrayContaining(["R20_LOCKED=true"]),
    });

    expect(readActiveSystemState().signingChannelOpen).toBe(false);
  });

  it("intercepts when order notional exceeds dynamicMaxSlUsd", async () => {
    const state = buildSystemState({
      accountBalanceUsd: 10_000,
      currentCri: 100,
      skipHardlockAssert: true,
    });

    await expect(
      signAndExecuteOrder(
        { ...BASE_ORDER, limitPx: "500", sz: "10" },
        { systemState: state, profile: "institutional", leverage: 1 },
      ),
    ).rejects.toMatchObject({
      code: "SESSION_KEY_HARDLOCK_INTERCEPTED",
      reasons: expect.arrayContaining([
        expect.stringMatching(/ORDER_NOTIONAL=.*>dynamicMaxSlUsd=200\.00/),
      ]),
    });

    expect(readActiveSystemState().signingChannelOpen).toBe(false);
  });

  it("intercepts when open order exceeds position cap", async () => {
    const state = buildSystemState({
      accountBalanceUsd: 10_000,
      currentCri: 100,
      skipHardlockAssert: true,
    });

    await expect(
      signAndExecuteOrder(
        { ...BASE_ORDER, limitPx: "150", sz: "1" },
        { systemState: state, maxPositionUsd: 100 },
      ),
    ).rejects.toMatchObject({
      code: "SESSION_KEY_HARDLOCK_INTERCEPTED",
      reasons: expect.arrayContaining([
        expect.stringMatching(/POSITION_LIMIT=150\.00>maxPositionUsd=100\.00/),
      ]),
    });
  });

  it("allows reduceOnly orders above position cap", () => {
    const state = buildSystemState({
      accountBalanceUsd: 10_000,
      currentCri: 100,
      skipHardlockAssert: true,
    });

    expect(
      assertSessionKeyExecutionGates(
        { ...BASE_ORDER, limitPx: "150", sz: "1", reduceOnly: true },
        state,
        100,
      ),
    ).toBe(150);
  });

  it("intercepts when order notional exceeds session authorization cap", async () => {
    const state = buildSystemState({
      accountBalanceUsd: 1_000_000,
      currentCri: 100,
      skipHardlockAssert: true,
    });
    __setSystemStateForTests({ ...state, signingChannelOpen: true });

    await expect(
      signAndExecuteOrder(
        { ...BASE_ORDER, limitPx: "6000", sz: "1" },
        { systemState: state },
      ),
    ).rejects.toMatchObject({
      code: "SESSION_KEY_HARDLOCK_INTERCEPTED",
      reasons: expect.arrayContaining([
        expect.stringMatching(/SESSION_CAP=6000\.00>5000/),
      ]),
    });

    expect(readActiveSystemState().signingChannelOpen).toBe(false);
  });

  it("rejects invalid order notional before intercept", () => {
    const state = buildSystemState({
      currentCri: 100,
      skipHardlockAssert: true,
    });

    expect(() =>
      assertSessionKeyExecutionGates(
        { ...BASE_ORDER, limitPx: "0", sz: "1" },
        state,
      ),
    ).toThrow(DefenseMatrixError);

    try {
      assertSessionKeyExecutionGates(
        { ...BASE_ORDER, limitPx: "0", sz: "1" },
        state,
      );
    } catch (err) {
      expect(err).toMatchObject({ code: "SESSION_KEY_INVALID_ORDER" });
    }
  });

  it("buildSessionKeyEip712Stub matches Hyperliquid order envelope", () => {
    const stub = buildSessionKeyEip712Stub(BASE_ORDER, 42, "0xabc", true);

    expect(stub.domain.chainId).toBe(1337);
    expect(stub.message.source).toBe("b");
    expect(stub.message.action.orders[0]).toEqual({
      a: 0,
      b: true,
      p: "100",
      s: "1",
      r: false,
      t: { limit: { tif: "Gtc" } },
    });
    expect(stub.message.agentName).toBe("BeDeltaAgent");
  });

  it("stubSignSessionKeyPayload is deterministic", async () => {
    const stub = buildSessionKeyEip712Stub(BASE_ORDER, 1, "0xseed");
    const a = await stubSignSessionKeyPayload(stub);
    const b = await stubSignSessionKeyPayload(stub);
    expect(a).toBe(b);
  });
});
