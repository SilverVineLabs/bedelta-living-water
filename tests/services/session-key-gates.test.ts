import { afterEach, describe, expect, it } from "vitest";
import {
  assertSessionKeyExecutionGates,
  signAndExecuteOrder,
} from "../../src/services/session-key-adapter";
import {
  __setSystemStateForTests,
  buildSystemState,
  readActiveSystemState,
} from "../../src/core/state";
import { BASE_ORDER } from "./session-key-adapter-lib/fixtures";

afterEach(() => {
  __setSystemStateForTests(null);
});

describe("session-key-adapter — execution gates", () => {
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
});
