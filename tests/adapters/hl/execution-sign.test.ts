import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import * as auth from "../../../src/adapters/hl/auth";
import {
  HL_EXCHANGE_URL,
  HyperliquidExecutionError,
  buildCancelAction,
  buildCancelByCloidAction,
  buildLimitOrderWire,
  buildMarketOrderWire,
  buildOrderAction,
  buildTriggerOrderWire,
  cancelOrder,
  cancelOrderByCloid,
  executeSignedAction,
  floatToWire,
  placeLimitWithStopLoss,
  sessionKeyFromAgentResult,
  __resetRpcFailoverForTests,
} from "../../../src/adapters/hl/execution";
import { SigningChannelLockedError } from "../../../src/adapters/hl/auth";
import { __setSystemStateForTests } from "../../../src/core/state";
import {
  jsonResponse,
  PASSING_PRE_TRADE,
  TEST_AGENT_ADDRESS,
  testWallet,
} from "./execution-fixtures";

describe("hl/execution — wire builders", () => {
  it("floatToWire normalizes prices to HL string format", () => {
    expect(floatToWire(1.5)).toBe("1.5");
    expect(floatToWire(50000)).toBe("50000");
  });

  it("builds limit, market, and trigger order wires", () => {
    expect(buildLimitOrderWire({
      asset: 0,
      isBuy: true,
      size: 0.01,
      limitPx: 50000,
    })).toEqual({
      a: 0,
      b: true,
      p: "50000",
      s: "0.01",
      r: false,
      t: { limit: { tif: "Gtc" } },
    });

    expect(buildMarketOrderWire({
      asset: 0,
      isBuy: false,
      size: 0.02,
      limitPx: 49000,
    }).t).toEqual({ limit: { tif: "Ioc" } });

    expect(buildTriggerOrderWire({
      asset: 0,
      isBuy: false,
      size: 0.01,
      triggerPx: 48000,
      tpsl: "sl",
    })).toMatchObject({
      p: "0",
      r: true,
      t: { trigger: { triggerPx: "48000", isMarket: true, tpsl: "sl" } },
    });
  });

  it("builds cancel and cancelByCloid actions", () => {
    expect(buildCancelAction([{ asset: 0, oid: 999 }])).toEqual({
      type: "cancel",
      cancels: [{ a: 0, o: 999 }],
    });
    expect(buildCancelByCloidAction([{ asset: 0, cloid: "0xabc" }])).toEqual({
      type: "cancelByCloid",
      cancels: [{ a: 0, cloid: "0xabc" }],
    });
  });
});

describe("hl/execution — signed HTTP POST", () => {
  let fetchSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    fetchSpy = vi.spyOn(globalThis, "fetch");
    __setSystemStateForTests(null);
    __resetRpcFailoverForTests();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    __setSystemStateForTests(null);
    __resetRpcFailoverForTests();
  });

  it("posts signed order payload with correct structure", async () => {
    fetchSpy.mockResolvedValueOnce(
      jsonResponse({ status: "ok", response: { type: "order" } }),
    );

    const signSpy = vi.spyOn(auth, "signHyperliquidAction").mockResolvedValue(
      "0x" + "11".repeat(65),
    );
    vi.spyOn(auth, "splitHyperliquidSignature").mockReturnValue({
      r: "0x" + "a".repeat(64),
      s: "0x" + "b".repeat(64),
      v: 27,
    });

    const action = buildOrderAction([
      buildLimitOrderWire({ asset: 0, isBuy: true, size: 0.01, limitPx: 50000 }),
    ]);

    const result = await executeSignedAction(action, {
      signer: testWallet,
      sessionKey: {
        agentAddress: TEST_AGENT_ADDRESS,
        expiresAt: Date.now() + 60_000,
        masterWalletAddress: TEST_AGENT_ADDRESS,
      },
    }, {
      nonce: 1_700_000_000_000,
      preTrade: PASSING_PRE_TRADE,
    });

    expect(signSpy).toHaveBeenCalledOnce();
    expect(fetchSpy).toHaveBeenCalledOnce();

    const [url, init] = fetchSpy.mock.calls[0] as [string, RequestInit];
    expect(url).toBe(HL_EXCHANGE_URL);
    expect(init.method).toBe("POST");
    expect(init.headers).toMatchObject({ "Content-Type": "application/json" });

    const body = JSON.parse(init.body as string) as {
      action: { type: string; orders: unknown[] };
      nonce: number;
      signature: { r: string; s: string; v: number };
      vaultAddress?: string;
    };

    expect(body.action.type).toBe("order");
    expect(body.action.orders).toHaveLength(1);
    expect(body.nonce).toBe(1_700_000_000_000);
    expect(body.vaultAddress).toBeUndefined();
    expect(body.signature).toMatchObject({ r: expect.stringMatching(/^0x/), s: expect.stringMatching(/^0x/), v: expect.any(Number) });
    expect(result.response.status).toBe("ok");
    expect(result.sessionKeyAddress).toBe(TEST_AGENT_ADDRESS);
  });

  it("dryRun skips fetch but still signs", async () => {
    const signSpy = vi.spyOn(auth, "signHyperliquidAction").mockResolvedValue(
      "0x" + "22".repeat(65),
    );
    vi.spyOn(auth, "splitHyperliquidSignature").mockReturnValue({
      r: "0x" + "c".repeat(64),
      s: "0x" + "d".repeat(64),
      v: 28,
    });

    const action = buildCancelAction([{ asset: 0, oid: 1 }]);
    const result = await executeSignedAction(action, {
      signer: testWallet,
      dryRun: true,
    }, { skipPreTrade: true });

    expect(signSpy).toHaveBeenCalledOnce();
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(result.dryRun).toBe(true);
    expect(result.response.status).toBe("dry_run");
  });

  it("cancelOrder skips pre-trade but requires signing", async () => {
    vi.spyOn(auth, "signHyperliquidAction").mockResolvedValue(
      "0x" + "33".repeat(65),
    );
    fetchSpy.mockResolvedValueOnce(jsonResponse({ status: "ok" }));

    const result = await cancelOrder({ asset: 0, oid: 42 }, { signer: testWallet });
    expect(result.request.action).toEqual({
      type: "cancel",
      cancels: [{ a: 0, o: 42 }],
    });
  });

  it("cancelOrderByCloid posts cancelByCloid action", async () => {
    vi.spyOn(auth, "signHyperliquidAction").mockResolvedValue(
      "0x" + "44".repeat(65),
    );
    fetchSpy.mockResolvedValueOnce(jsonResponse({ status: "ok" }));

    const result = await cancelOrderByCloid(
      { asset: 1, cloid: "0xdeadbeef" },
      { signer: testWallet },
    );
    expect(result.request.action.type).toBe("cancelByCloid");
  });

  it("rejects expired session key before signing", async () => {
    await expect(
      executeSignedAction(
        buildCancelAction([{ asset: 0, oid: 1 }]),
        {
          signer: testWallet,
          sessionKey: {
            agentAddress: TEST_AGENT_ADDRESS,
            expiresAt: Date.now() - 1,
            masterWalletAddress: TEST_AGENT_ADDRESS,
          },
          dryRun: true,
        },
        { skipPreTrade: true },
      ),
    ).rejects.toBeInstanceOf(SigningChannelLockedError);
  });

  it("placeLimitWithStopLoss sends atomic entry + SL grouping", async () => {
    vi.spyOn(auth, "signHyperliquidAction").mockResolvedValue(
      "0x" + "55".repeat(65),
    );
    fetchSpy.mockResolvedValueOnce(jsonResponse({ status: "ok" }));

    const result = await placeLimitWithStopLoss(
      {
        asset: 0,
        isBuy: true,
        size: 0.01,
        limitPx: 50000,
        stopTriggerPx: 48000,
        preTrade: PASSING_PRE_TRADE,
      },
      { signer: testWallet },
    );

    const action = result.request.action as {
      type: string;
      orders: unknown[];
      grouping: string;
    };
    expect(action.type).toBe("order");
    expect(action.orders).toHaveLength(2);
    expect(action.grouping).toBe("normalTpsl");
  });

  it("sessionKeyFromAgentResult maps auth result to execution context", () => {
    const ctx = sessionKeyFromAgentResult({
      action: {
        type: "approveAgent",
        signatureChainId: "0x66eee",
        hyperliquidChain: "Mainnet",
        agentAddress: TEST_AGENT_ADDRESS,
        agentName: "BeDeltaAgent",
        nonce: 1,
      },
      signature: "0x",
      agentAddress: TEST_AGENT_ADDRESS,
      expiresAt: 999,
      nonce: 1,
      hyperliquidChain: "Mainnet",
    }, testWallet.address);

    expect(ctx.agentAddress).toBe(TEST_AGENT_ADDRESS.toLowerCase());
    expect(ctx.expiresAt).toBe(999);
    expect(ctx.masterWalletAddress).toBe(testWallet.address.toLowerCase());
    expect(ctx.vaultAddress).toBeUndefined();
  });
});

describe("hl/execution — HyperliquidExecutionError shape", () => {
  it("exposes code and httpStatus", () => {
    const err = new HyperliquidExecutionError("test", "RATE_LIMIT", 429);
    expect(err.code).toBe("RATE_LIMIT");
    expect(err.httpStatus).toBe(429);
  });
});
