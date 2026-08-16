/**
 * Hyperliquid WebSocket client — subscriptions, heartbeat, reconnect.
 */

import type {
  HyperliquidWsClientOptions,
  HlWsInboundMessage,
  WsBookData,
  WsHealthSnapshot,
  WsLike,
  WsUserEventData,
} from "./types";
import {
  buildAllMidsSubscription,
  buildL2BookSubscription,
  buildUserEventsSubscription,
  sendSubscribe,
  trackSubscription,
} from "./websocket-subscriptions";
import {
  attachWsSocketHandlers,
  emitWsHealthChange,
  handleWsConnectFailure,
  refreshWsSoilTrip,
} from "./websocket-connection";
import {
  clearHlWsTimers,
  createHlWsClientRuntime,
  patchHlWsHealth,
  resolveHlWsClientDeps,
  type HlWsClientDeps,
  type HlWsClientRuntime,
} from "./websocket-client-runtime";
import {
  createHlWsSocketHost,
  handleHlWsRawMessage,
  onHlWsOpen,
} from "./websocket-client-handlers";
import {
  checkHlWsClientStale,
  scheduleHlWsClientReconnect,
  sendHlWsClientPing,
  startHlWsTimers,
} from "./websocket-client-timers";

const WS_OPEN = 1;

export class HyperliquidWsClient {
  private ws: WsLike | null = null;
  private readonly deps: HlWsClientDeps;
  private readonly onHealthChange?: (health: WsHealthSnapshot) => void;
  private readonly onMessage?: (message: HlWsInboundMessage) => void;
  private readonly runtime: HlWsClientRuntime = createHlWsClientRuntime();

  constructor(options: HyperliquidWsClientOptions = {}) {
    this.deps = resolveHlWsClientDeps(options);
    this.onHealthChange = options.onHealthChange;
    this.onMessage = options.onMessage;
  }

  getHealth(): WsHealthSnapshot {
    return { ...this.runtime.health };
  }

  getLatestAllMids(): Readonly<Record<string, string>> {
    return this.runtime.subState.allMids;
  }

  getLatestL2Book(coin: string): WsBookData | null {
    return this.runtime.subState.l2Books.get(coin.toUpperCase()) ?? null;
  }

  getUserEvents(): readonly WsUserEventData[] {
    return this.runtime.subState.userEvents;
  }

  connect(): void {
    this.runtime.intentionalClose = false;
    this.openSocket();
  }

  disconnect(): void {
    this.runtime.intentionalClose = true;
    clearHlWsTimers(this.runtime, this.deps.clearIntervalFn);
    if (this.runtime.timers.reconnectTimer) {
      this.deps.clearTimeoutFn(this.runtime.timers.reconnectTimer);
      this.runtime.timers.reconnectTimer = null;
    }
    this.ws?.close(1000, "client_disconnect");
    this.ws = null;
    this.setHealth({ connected: false, stale: true });
  }

  subscribeAllMids(dex?: string): void {
    const sub = buildAllMidsSubscription(dex);
    trackSubscription(this.runtime.subState, sub);
    sendSubscribe(this.ws, sub);
  }

  subscribeL2Book(
    coin: string,
    options: { nSigFigs?: number; mantissa?: number; fast?: boolean } = {},
  ): void {
    const sub = buildL2BookSubscription(coin, options);
    if (!sub) return;
    trackSubscription(this.runtime.subState, sub);
    sendSubscribe(this.ws, sub);
  }

  subscribeUserEvents(user: string): void {
    const sub = buildUserEventsSubscription(user);
    trackSubscription(this.runtime.subState, sub);
    sendSubscribe(this.ws, sub);
  }

  reconnect(): void {
    if (this.runtime.intentionalClose || !this.ws) return;
    this.ws.close(4000, "reconnect");
  }

  private openSocket(): void {
    if (this.ws && this.ws.readyState === WS_OPEN) return;
    const { deps } = this;
    const host = createHlWsSocketHost({
      runtime: this.runtime,
      autoReconnect: deps.autoReconnect,
      ws: this.ws,
      setWs: (ws) => {
        this.ws = ws;
      },
      onOpen: () => {
        onHlWsOpen(
          this.runtime,
          this.ws,
          () => this.touchActivity(),
          (patch) => this.setHealth(patch),
          () =>
            startHlWsTimers(
              this.runtime,
              deps.setIntervalFn,
              deps.heartbeatIntervalMs,
              () => this.sendPing(),
              () => this.checkStale(),
              deps.clearIntervalFn,
            ),
        );
      },
      onRawMessage: (raw) => {
        handleHlWsRawMessage({
          runtime: this.runtime,
          raw,
          now: deps.now,
          touchActivity: () => this.touchActivity(),
          setHealth: (patch) => this.setHealth(patch),
          onMessage: this.onMessage,
          refreshSoilTrip: () => this.refreshSoilTrip(),
        });
      },
      clearTimers: () => clearHlWsTimers(this.runtime, deps.clearIntervalFn),
      scheduleReconnect: () =>
        scheduleHlWsClientReconnect(
          this.runtime,
          deps.setTimeoutFn,
          () => this.openSocket(),
          (patch) => this.setHealth(patch),
        ),
      setHealth: (patch) => this.setHealth(patch),
    });
    try {
      const socket = deps.wsFactory(deps.url);
      this.ws = socket;
      attachWsSocketHandlers(host, socket);
    } catch (err) {
      handleWsConnectFailure(host, err);
    }
  }

  private sendPing(): void {
    sendHlWsClientPing(this.runtime, this.ws, this.deps.now, (p) => this.setHealth(p));
  }

  private checkStale(): void {
    checkHlWsClientStale(
      this.runtime,
      this.deps.now,
      this.deps.staleThresholdMs,
      (p) => this.setHealth(p),
      () => this.refreshSoilTrip(),
      () => this.reconnect(),
    );
  }

  private touchActivity(): void {
    this.setHealth({ lastMessageAt: this.deps.now(), stale: false });
  }

  private refreshSoilTrip(): void {
    const { soilTripped, tripReasons } = refreshWsSoilTrip(this.runtime.health);
    this.runtime.health.soilTripped = soilTripped;
    this.runtime.health.tripReasons = tripReasons;
    emitWsHealthChange(() => this.getHealth(), this.onHealthChange);
  }

  private setHealth(patch: Partial<WsHealthSnapshot>): void {
    patchHlWsHealth(this.runtime, patch);
    this.refreshSoilTrip();
  }
}
