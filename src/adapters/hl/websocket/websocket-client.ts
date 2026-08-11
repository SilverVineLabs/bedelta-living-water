/**
 * Hyperliquid WebSocket client — subscriptions, heartbeat, reconnect.
 */

import { inspectWsPayloadForInvalidNonce, touchSessionKeyHeartbeat } from "../../../services/session-key-adapter-lib/nonce-auto-healing";
import {
  HL_WS_URL,
  HL_WS_TESTNET_URL,
  WS_HEARTBEAT_INTERVAL_MS,
  WS_STALE_THRESHOLD_MS,
  type HyperliquidWsClientOptions,
  type HlWsInboundMessage,
  type WsBookData,
  type WsHealthSnapshot,
  type WsLike,
  type WsUserEventData,
} from "./types";
import { parseWsMessage } from "./websocket-frames";
import {
  applyInboundChannelMessage,
  buildAllMidsSubscription,
  buildL2BookSubscription,
  buildUserEventsSubscription,
  createSubscriptionState,
  resubscribeAll,
  sendSubscribe,
  trackSubscription,
  type WsSubscriptionState,
} from "./websocket-subscriptions";
import {
  attachWsSocketHandlers,
  checkWsStale,
  clearConnectionTimers,
  createConnectionTimers,
  emitWsHealthChange,
  handleWsConnectFailure,
  refreshWsSoilTrip,
  scheduleWsReconnect,
  sendWsPing,
  startConnectionTimers,
  type WsConnectionTimers,
} from "./websocket-connection";

const WS_OPEN = 1;

export class HyperliquidWsClient {
  private ws: WsLike | null = null;
  private readonly url: string;
  private readonly wsFactory: (url: string) => WsLike;
  private readonly now: () => number;
  private readonly setTimeoutFn: typeof setTimeout;
  private readonly clearTimeoutFn: typeof clearTimeout;
  private readonly setIntervalFn: typeof setInterval;
  private readonly clearIntervalFn: typeof clearInterval;
  private readonly autoReconnect: boolean;
  private readonly heartbeatIntervalMs: number;
  private readonly staleThresholdMs: number;
  private readonly onHealthChange?: (health: WsHealthSnapshot) => void;
  private readonly onMessage?: (message: HlWsInboundMessage) => void;

  private readonly timers: WsConnectionTimers = createConnectionTimers();
  private readonly subState: WsSubscriptionState = createSubscriptionState();
  private pendingPingAt: number | null = null;
  private reconnectAttempts = 0;
  private intentionalClose = false;

  private health: WsHealthSnapshot = {
    connected: false,
    latencyMs: null,
    lastMessageAt: null,
    lastPingAt: null,
    stale: false,
    reconnectAttempts: 0,
    soilTripped: true,
    tripReasons: ["WS_DISCONNECTED"],
  };

  constructor(options: HyperliquidWsClientOptions = {}) {
    this.url =
      options.url ??
      (options.isTestnet ? HL_WS_TESTNET_URL : HL_WS_URL);
    this.wsFactory =
      options.wsFactory ??
      ((url: string) => {
        const Impl = options.WebSocketImpl ?? WebSocket;
        return new Impl(url) as unknown as WsLike;
      });
    this.now = options.now ?? (() => Date.now());
    this.setTimeoutFn = options.setTimeoutFn ?? setTimeout;
    this.clearTimeoutFn = options.clearTimeoutFn ?? clearTimeout;
    this.setIntervalFn = options.setIntervalFn ?? setInterval;
    this.clearIntervalFn = options.clearIntervalFn ?? clearInterval;
    this.autoReconnect = options.autoReconnect ?? true;
    this.heartbeatIntervalMs =
      options.heartbeatIntervalMs ?? WS_HEARTBEAT_INTERVAL_MS;
    this.staleThresholdMs = options.staleThresholdMs ?? WS_STALE_THRESHOLD_MS;
    this.onHealthChange = options.onHealthChange;
    this.onMessage = options.onMessage;
  }

  getHealth(): WsHealthSnapshot {
    return { ...this.health };
  }

  getLatestAllMids(): Readonly<Record<string, string>> {
    return this.subState.allMids;
  }

  getLatestL2Book(coin: string): WsBookData | null {
    return this.subState.l2Books.get(coin.toUpperCase()) ?? null;
  }

  getUserEvents(): readonly WsUserEventData[] {
    return this.subState.userEvents;
  }

  connect(): void {
    this.intentionalClose = false;
    this.openSocket();
  }

  disconnect(): void {
    this.intentionalClose = true;
    this.clearTimers();
    if (this.timers.reconnectTimer) {
      this.clearTimeoutFn(this.timers.reconnectTimer);
      this.timers.reconnectTimer = null;
    }
    this.ws?.close(1000, "client_disconnect");
    this.ws = null;
    this.setHealth({ connected: false, stale: true });
  }

  subscribeAllMids(dex?: string): void {
    const sub = buildAllMidsSubscription(dex);
    trackSubscription(this.subState, sub);
    sendSubscribe(this.ws, sub);
  }

  subscribeL2Book(
    coin: string,
    options: { nSigFigs?: number; mantissa?: number; fast?: boolean } = {},
  ): void {
    const sub = buildL2BookSubscription(coin, options);
    if (!sub) return;
    trackSubscription(this.subState, sub);
    sendSubscribe(this.ws, sub);
  }

  subscribeUserEvents(user: string): void {
    const sub = buildUserEventsSubscription(user);
    trackSubscription(this.subState, sub);
    sendSubscribe(this.ws, sub);
  }

  reconnect(): void {
    if (this.intentionalClose || !this.ws) return;
    this.ws.close(4000, "reconnect");
  }

  private openSocket(): void {
    if (this.ws && this.ws.readyState === WS_OPEN) return;

    const host = this.createSocketHost();

    try {
      const socket = this.wsFactory(this.url);
      this.ws = socket;
      attachWsSocketHandlers(host, socket);
    } catch (err) {
      handleWsConnectFailure(host, err);
    }
  }

  private createSocketHost() {
    return {
      intentionalClose: this.intentionalClose,
      autoReconnect: this.autoReconnect,
      ws: this.ws,
      setWs: (ws: WsLike | null) => {
        this.ws = ws;
      },
      onOpen: () => {
        this.reconnectAttempts = 0;
        this.touchActivity();
        this.setHealth({ connected: true, stale: false, reconnectAttempts: 0 });
        resubscribeAll(this.ws, this.subState.subscriptions);
        this.startTimers();
      },
      onRawMessage: (raw: string) => {
        this.handleRawMessage(raw);
      },
      clearTimers: () => {
        this.clearTimers();
      },
      scheduleReconnect: () => {
        this.scheduleReconnect();
      },
      setHealth: (patch: Partial<WsHealthSnapshot>) => {
        this.setHealth(patch);
      },
    };
  }

  private handleRawMessage(raw: string): void {
    inspectWsPayloadForInvalidNonce(raw, this.now());
    this.touchActivity();

    if (this.pendingPingAt !== null) {
      const latencyMs = this.now() - this.pendingPingAt;
      this.pendingPingAt = null;
      this.setHealth({ latencyMs });
    }

    const message = parseWsMessage(raw);
    if (!message) return;

    this.onMessage?.(message);

    if (message.channel === "pong") {
      touchSessionKeyHeartbeat(this.now());
    } else {
      applyInboundChannelMessage(this.subState, message);
    }

    this.refreshSoilTrip();
  }

  private startTimers(): void {
    this.clearTimers();
    startConnectionTimers(
      this.timers,
      this.setIntervalFn,
      this.heartbeatIntervalMs,
      () => this.sendPing(),
      () => this.checkStale(),
    );
  }

  private clearTimers(): void {
    clearConnectionTimers(this.timers, this.clearIntervalFn);
  }

  private sendPing(): void {
    sendWsPing(
      this.ws,
      this.now(),
      (pingAt) => {
        this.pendingPingAt = pingAt;
        this.setHealth({ lastPingAt: pingAt });
      },
      () => {
        this.pendingPingAt = null;
        this.setHealth({ connected: false, stale: true });
      },
    );
  }

  private checkStale(): void {
    checkWsStale(this.health, this.now(), this.staleThresholdMs, () => {
      this.setHealth({ stale: true });
      this.refreshSoilTrip();
      this.reconnect();
    });
  }

  private scheduleReconnect(): void {
    this.reconnectAttempts = scheduleWsReconnect(
      this.timers,
      this.reconnectAttempts,
      this.intentionalClose,
      this.setTimeoutFn,
      () => this.openSocket(),
    );
    this.setHealth({ reconnectAttempts: this.reconnectAttempts });
  }

  private touchActivity(): void {
    this.setHealth({
      lastMessageAt: this.now(),
      stale: false,
    });
  }

  private refreshSoilTrip(): void {
    const { soilTripped, tripReasons } = refreshWsSoilTrip(this.health);
    this.health.soilTripped = soilTripped;
    this.health.tripReasons = tripReasons;
    this.emitHealth();
  }

  private setHealth(patch: Partial<WsHealthSnapshot>): void {
    this.health = { ...this.health, ...patch };
    this.refreshSoilTrip();
  }

  private emitHealth(): void {
    emitWsHealthChange(() => this.getHealth(), this.onHealthChange);
  }
}
