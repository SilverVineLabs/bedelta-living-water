import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PGATE_MAX_LATENCY_MS } from "../../../src/adapters/hl/execution";
import {
  HL_WS_URL,
  HyperliquidWsClient,
  WS_HEARTBEAT_INTERVAL_MS,
  WS_STALE_THRESHOLD_MS,
  buildPingFrame,
  buildSubscribeFrame,
  computeBookSpreadBps,
  createMockWsFactory,
  evaluateWsSoilResistance,
  evaluateWsTripReasons,
  parseWsMessage,
  type MockWebSocket,
} from "../../../src/adapters/hl/websocket";
import { SAFE_TRADING_TIME } from "../../helpers/system-time";

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(SAFE_TRADING_TIME);
});

afterEach(() => {
  vi.useRealTimers();
});

describe("hl/websocket — message helpers", () => {
  it("builds subscribe and ping frames", () => {
    expect(JSON.parse(buildSubscribeFrame({ type: "allMids" }))).toEqual({
      method: "subscribe",
      subscription: { type: "allMids" },
    });
    expect(JSON.parse(buildPingFrame())).toEqual({ method: "ping" });
  });

  it("parses inbound HL WS messages", () => {
    const msg = parseWsMessage(
      JSON.stringify({ channel: "allMids", data: { mids: { BTC: "50000" } } }),
    );
    expect(msg?.channel).toBe("allMids");
    expect((msg?.data as { mids: Record<string, string> }).mids.BTC).toBe("50000");
    expect(parseWsMessage("not-json")).toBeNull();
  });

  it("computes book spread in bps", () => {
    const bps = computeBookSpreadBps({
      coin: "BTC",
      time: Date.now(),
      levels: [
        [{ px: "100", sz: "1" }],
        [{ px: "100.2", sz: "1" }],
      ],
    });
    expect(bps).toBeCloseTo(19.96, 1);
  });
});

describe("hl/websocket — soil / risk integration", () => {
  it("trips when disconnected or stale or high latency", () => {
    expect(
      evaluateWsTripReasons({
        connected: false,
        latencyMs: null,
        lastMessageAt: null,
        lastPingAt: null,
        stale: false,
        reconnectAttempts: 0,
        soilTripped: true,
        tripReasons: [],
      }),
    ).toContain("WS_DISCONNECTED");

    expect(
      evaluateWsTripReasons({
        connected: true,
        latencyMs: 250,
        lastMessageAt: Date.now(),
        lastPingAt: null,
        stale: false,
        reconnectAttempts: 0,
        soilTripped: false,
        tripReasons: [],
      }).some((r) => r.includes("WS_LATENCY_MS")),
    ).toBe(true);

    expect(PGATE_MAX_LATENCY_MS).toBe(200);
  });

  it("evaluateWsSoilResistance merges WS trip with signing gate", () => {
    const result = evaluateWsSoilResistance(
      {
        connected: false,
        latencyMs: null,
        lastMessageAt: null,
        lastPingAt: null,
        stale: true,
        reconnectAttempts: 1,
        soilTripped: true,
        tripReasons: ["WS_DISCONNECTED"],
      },
      {
        symbol: "BTC",
        hlSpot: 50000,
        hlPerp: 50010,
        dydxPerp: 50005,
        depthUsd: 500_000,
      },
    );

    expect(result.tripped).toBe(true);
    expect(result.gate.soilResistanceTripped).toBe(true);
    expect(result.reasons.some((r) => r.startsWith("WS_"))).toBe(true);
  });
});

describe("hl/websocket — HyperliquidWsClient", () => {
  let now: number;
  let sockets: MockWebSocket[];
  let client: HyperliquidWsClient;

  beforeEach(() => {
    vi.useRealTimers();
    vi.useFakeTimers();
    vi.setSystemTime(SAFE_TRADING_TIME);
    now = SAFE_TRADING_TIME.getTime();
    sockets = [];
    client = new HyperliquidWsClient({
      url: HL_WS_URL,
      wsFactory: createMockWsFactory(sockets),
      now: () => now,
      heartbeatIntervalMs: WS_HEARTBEAT_INTERVAL_MS,
      staleThresholdMs: WS_STALE_THRESHOLD_MS,
    });
  });

  afterEach(() => {
    client.disconnect();
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  function activeSocket(): MockWebSocket {
    const ws = sockets[sockets.length - 1];
    if (!ws) throw new Error("no mock socket");
    return ws;
  }

  it("connects and sends subscription frames", () => {
    client.connect();
    const ws = activeSocket();
    ws.simulateOpen();

    client.subscribeAllMids();
    client.subscribeL2Book("ETH", { fast: true });
    client.subscribeUserEvents("0xAbC123");

    expect(ws.sent).toHaveLength(3);
    expect(JSON.parse(ws.sent[0] as string)).toEqual({
      method: "subscribe",
      subscription: { type: "allMids" },
    });
    expect(JSON.parse(ws.sent[1] as string).subscription).toEqual({
      type: "l2Book",
      coin: "ETH",
      fast: true,
    });
    expect(JSON.parse(ws.sent[2] as string).subscription).toEqual({
      type: "userEvents",
      user: "0xabc123",
    });
  });

  it("parses allMids, l2Book, and user event channels", () => {
    client.connect();
    const ws = activeSocket();
    ws.simulateOpen();

    ws.simulateMessage({
      channel: "allMids",
      data: { mids: { BTC: "51000", ETH: "3000" } },
    });
    expect(client.getLatestAllMids().BTC).toBe("51000");

    ws.simulateMessage({
      channel: "l2Book",
      data: {
        coin: "ETH",
        time: now,
        levels: [[{ px: "3099", sz: "1" }], [{ px: "3101", sz: "1" }]],
      },
    });
    expect(client.getLatestL2Book("eth")?.coin).toBe("ETH");

    ws.simulateMessage({
      channel: "user",
      data: { fills: [{ coin: "BTC", px: "51000" }] },
    });
    expect(client.getUserEvents()).toHaveLength(1);
    expect(client.getHealth().connected).toBe(true);
    expect(client.getHealth().soilTripped).toBe(false);
  });

  it("sends heartbeat ping every 30 seconds", () => {
    client.connect();
    const ws = activeSocket();
    ws.simulateOpen();
    ws.sent.length = 0;

    vi.advanceTimersByTime(WS_HEARTBEAT_INTERVAL_MS);
    expect(ws.sent.some((s) => JSON.parse(s).method === "ping")).toBe(true);
  });

  it("records latency from ping to next inbound message", () => {
    client.connect();
    const ws = activeSocket();
    ws.simulateOpen();

    vi.advanceTimersByTime(WS_HEARTBEAT_INTERVAL_MS);
    now += 120;
    ws.simulateMessage({ channel: "pong", data: {} });

    expect(client.getHealth().latencyMs).toBe(120);
  });
});
