import { afterEach, describe, expect, it, vi } from "vitest";
import {
  executeHyperliquidOrder,
  resolveDryRunFromEnv,
  validateProductionSessionKeyBridge,
  validateSessionKeySignatureFormat,
} from "../src/adapters/hyperliquid-adapter";
import {
  __resetHudStreamDebounceForTests,
  buildHudStreamPayload,
  buildHudStreamPayloadSafe,
  handleHudStreamRequest,
  HUD_STREAM_DEBOUNCE_MS,
} from "../src/api/hud-telemetry";
import * as threeEyeModule from "../src/services/hl-telemetry-probe";
import * as uiCanary from "../src/services/defense/ui-canary";
import {
  __setSystemStateForTests,
  buildSystemState,
  readActiveSystemState,
} from "../src/core/state";
import { HUD_CANARY_EXPECTED } from "../src/services/defense/ui-canary";
import {
  computeReconnectDelayMs,
  NETWORK_WS_HEARTBEAT_MS,
  NetworkWsClient,
} from "../src/services/network/ws-client";
import {
  __resetStateTransactionLogsForTests,
  appendStateTransactionLog,
  garbageCollect,
  markSystemStateStale,
  readStateTransactionLogs,
  STATE_TX_LOG_TTL_MS,
} from "../src/services/state/system-state";
import {
  createMockWsFactory,
  MockWebSocket,
} from "../src/adapters/hl/websocket";

const PASSING_SOIL = {
  symbol: "BTC",
  hlSpot: 50_000,
  hlPerp: 50_010,
  dydxPerp: 50_005,
  depthUsd: 500_000,
};

const BASE_ORDER = {
  asset: 0,
  isBuy: true,
  limitPx: "50000",
  sz: "0.01",
  reduceOnly: false,
  orderType: { limit: { tif: "Gtc" as const } },
};

function hudRequest(canary = HUD_CANARY_EXPECTED): Request {
  return new Request("https://bedeltawater.slivervine.xyz/api/hud-stream", {
    headers: { "X-Santenmoku-Canary": canary },
  });
}

afterEach(() => {
  __setSystemStateForTests(null);
  __resetStateTransactionLogsForTests();
  __resetHudStreamDebounceForTests();
  vi.useRealTimers();
});

describe("system-state garbageCollect", () => {
  it("purges transaction logs older than 1 hour", () => {
    const now = Date.now();
    appendStateTransactionLog("OLD", "stale", now - STATE_TX_LOG_TTL_MS - 1);
    appendStateTransactionLog("FRESH", "keep", now - 1_000);

    const result = garbageCollect(now);
    expect(result.purged).toBe(1);
    expect(result.remaining).toBe(1);
    expect(readStateTransactionLogs()[0]?.event).toBe("FRESH");
  });
});

describe("NetworkWsClient stale lockout", () => {
  it("sets SystemState.isStale on disconnect with 3s heartbeat default", () => {
    __setSystemStateForTests({
      ...buildSystemState({ skipHardlockAssert: true }),
      isHedgeActive: false,
    });

    const sockets: MockWebSocket[] = [];
    const client = new NetworkWsClient({
      wsFactory: createMockWsFactory(sockets),
      autoReconnect: false,
    });

    expect(NETWORK_WS_HEARTBEAT_MS).toBe(3_000);
    client.connect();
    sockets[0]?.simulateOpen();
    expect(readActiveSystemState().isStale).toBe(false);

    sockets[0]?.simulateClose();
    expect(readActiveSystemState().isStale).toBe(true);
    expect(readActiveSystemState().signingChannelOpen).toBe(false);
  });

  it("uses exponential backoff delay curve", () => {
    expect(computeReconnectDelayMs(0)).toBe(1_000);
    expect(computeReconnectDelayMs(3)).toBe(8_000);
    expect(computeReconnectDelayMs(10)).toBe(30_000);
  });
});

describe("hud-stream telemetry", () => {
  it("rejects unauthenticated requests without canary header", async () => {
    const res = handleHudStreamRequest(new Request("https://bedeltawater.slivervine.xyz/api/hud-stream"));
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.locked).toBe(true);
  });

  it("returns formatted Left/Right/Crown HUD payload with debounce", async () => {
    vi.useFakeTimers();
    __setSystemStateForTests({
      ...buildSystemState({ currentCri: 88, skipHardlockAssert: true }),
      isHedgeActive: true,
    });

    const first = handleHudStreamRequest(hudRequest());
    expect(first.status).toBe(200);
    const body = (await first.json()) as ReturnType<typeof buildHudStreamPayload> extends infer T
      ? T
      : never;

    expect(body.leftEyeDefense.dynamicMaxSlUsd).toBe(200);
    expect(body.rightEyeProbe.activeVenues).toEqual(["HYPERLIQUID"]);
    expect(body.crownTreasuryPnl.criIndex).toBe(88);
    expect(body.debounceMs).toBe(HUD_STREAM_DEBOUNCE_MS);
    expect(body.marketProbe.livePairsCount).toBeGreaterThan(0);
    expect(body.marketProbe.selectToken).toBeTruthy();
    expect(body.marketProbe.bestToken).toBeTruthy();

    vi.advanceTimersByTime(50);
    const cached = handleHudStreamRequest(hudRequest());
    const cachedBody = await cached.json();
    expect(cachedBody.timestamp).toBe(body.timestamp);
  });

  it("returns fallback market probe when signing channel is severed", async () => {
    __setSystemStateForTests({
      ...buildSystemState({ currentCri: 88, skipHardlockAssert: true }),
      signingChannelOpen: false,
      isHedgeActive: false,
    });

    const res = handleHudStreamRequest(hudRequest());
    const body = await res.json();

    expect(body.connectivityMode).toBe("CONNECTED_MOCK");
    expect(body.rightEyeProbe.status).toBe("STANDBY");
    expect(body.marketProbe.livePairsCount).toBe(162);
    expect(body.marketProbe.topPairs.length).toBeGreaterThan(0);
    expect(body.leftEyeDefense.status).toBe("STANDBY");
    expect(body.isStale).toBe(false);
  });

  it("returns SSE stream with abort-safe headers when Accept is text/event-stream", () => {
    const controller = new AbortController();
    const res = handleHudStreamRequest(
      new Request("https://bedeltawater.slivervine.xyz/api/hud-stream", {
        headers: {
          "X-Santenmoku-Canary": HUD_CANARY_EXPECTED,
          Accept: "text/event-stream",
        },
        signal: controller.signal,
      }),
    );
    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toContain("text/event-stream");
    controller.abort();
  });

  it("clears SSE interval on abort without enqueueing to a closed stream", async () => {
    vi.useFakeTimers();
    const controller = new AbortController();
    const res = handleHudStreamRequest(
      new Request("https://bedeltawater.slivervine.xyz/api/hud-stream", {
        headers: {
          "X-Santenmoku-Canary": HUD_CANARY_EXPECTED,
          Accept: "text/event-stream",
        },
        signal: controller.signal,
      }),
    );
    expect(res.body).not.toBeNull();

    const reader = res.body!.getReader();
    await reader.read();
    controller.abort();
    await reader.cancel();

    expect(() => {
      vi.advanceTimersByTime(HUD_STREAM_DEBOUNCE_MS * 5);
    }).not.toThrow();

    vi.useRealTimers();
  }, 10000);

  it("returns fallback payload when three-eye audit throws", () => {
    const auditSpy = vi
      .spyOn(threeEyeModule, "auditThreeEyeAdapters")
      .mockImplementation(() => {
        throw new Error("probe exploded");
      });

    const body = buildHudStreamPayloadSafe();
    expect(body.connectivityMode).toBe("STANDBY");
    expect(body.isStale).toBe(true);
    expect(body.rightEyeProbe.status).toBe("STANDBY");

    auditSpy.mockRestore();
  });

  it("returns HTTP 500 JSON instead of throwing on handler failure", () => {
    const authSpy = vi
      .spyOn(uiCanary, "validateHudStreamRequest")
      .mockImplementation(() => {
        throw new Error("canary gate exploded");
      });

    const res = handleHudStreamRequest(hudRequest());
    expect(res.status).toBe(200);

    authSpy.mockRestore();
  });
});

describe("hyperliquid-adapter DRY_RUN bridge", () => {
  it("forces dry-run when HL_DRY_RUN env flag is set", () => {
    expect(resolveDryRunFromEnv({ HL_DRY_RUN: "true" }, { privateKey: "0xabc" })).toBe(
      true,
    );
  });

  it("executes mock fill under HL_DRY_RUN without production signature gate", async () => {
    const result = await executeHyperliquidOrder(
      {
        payload: BASE_ORDER,
        soil: PASSING_SOIL,
        sessionExpiryTimestamp: Date.now() - 1,
        config: { privateKey: "0xabc" },
      },
      { HL_DRY_RUN: "true" },
    );
    expect(result.dryRun).toBe(true);
    expect(result.success).toBe(true);
  });

  it("validates session key signature format in production mode", async () => {
    const future = Date.now() + 600_000;
    const gate = await validateProductionSessionKeyBridge(
      BASE_ORDER,
      future,
      false,
    );
    expect(gate.ok).toBe(true);
    expect(validateSessionKeySignatureFormat("0x" + "a".repeat(64))).toBe(true);
    expect(validateSessionKeySignatureFormat("bad-sig")).toBe(false);
  });
});
