/**
 * WS Exponential Backoff Heartbeat + REST Fail-over State Machine core.
 */

import { HL_INFO_URL } from "../../config/constants";
import { postHlInfo } from "../exchanges/hl-l2-book";
import {
  WS_BACKOFF_SCHEDULE_MS,
  WS_HEARTBEAT_PING_INTERVAL_MS,
  WS_HEARTBEAT_PONG_TIMEOUT_MS,
  WS_DISCONNECTION_KV_KEY,
  WS_REST_FAILOVER_THRESHOLD,
  type RestPollResult,
  type WsDisconnectionEvent,
  type WsHeartbeatControllerOptions,
  type WsHeartbeatState,
  type WsReconnectPlan,
} from "./ws-heartbeat.types";

export function createWsHeartbeatState(): WsHeartbeatState {
  return {
    mode: "websocket",
    reconnectAttempts: 0,
    consecutiveFailures: 0,
    lastPingAt: null,
    lastPongAt: null,
    lastDisconnectReason: null,
    restFallbackActive: false,
    connected: false,
  };
}

export function computeWsBackoffDelayMs(attemptIndex: number): number {
  const idx = Math.max(0, Math.min(attemptIndex, WS_BACKOFF_SCHEDULE_MS.length - 1));
  return WS_BACKOFF_SCHEDULE_MS[idx]!;
}

export function shouldActivateRestFallback(consecutiveFailures: number): boolean {
  return consecutiveFailures >= WS_REST_FAILOVER_THRESHOLD;
}

export function evaluatePingPong(input: {
  lastPingAt: number | null;
  lastPongAt: number | null;
  now: number;
  pongTimeoutMs?: number;
}): { alive: boolean; stale: boolean; idleMs: number } {
  const timeout = input.pongTimeoutMs ?? WS_HEARTBEAT_PONG_TIMEOUT_MS;
  const { lastPingAt, lastPongAt, now } = input;

  if (lastPingAt === null) {
    return { alive: true, stale: false, idleMs: 0 };
  }

  const pongOk = lastPongAt !== null && lastPongAt >= lastPingAt;
  const idleMs = now - lastPingAt;

  if (!pongOk && idleMs > timeout) {
    return { alive: false, stale: true, idleMs };
  }

  return { alive: true, stale: false, idleMs };
}

export function shouldSendHeartbeatPing(
  state: WsHeartbeatState,
  now: number,
  intervalMs = WS_HEARTBEAT_PING_INTERVAL_MS,
): boolean {
  if (!state.connected || state.mode !== "websocket") return false;
  if (state.lastPingAt === null) return true;
  return now - state.lastPingAt >= intervalMs;
}

export function recordWsPing(state: WsHeartbeatState, now: number): WsHeartbeatState {
  return { ...state, lastPingAt: now };
}

export function recordWsPong(state: WsHeartbeatState, now: number): WsHeartbeatState {
  return { ...state, lastPongAt: now };
}

export function planWsReconnect(
  state: WsHeartbeatState,
  reason: string,
): { plan: WsReconnectPlan; nextState: WsHeartbeatState } {
  const attempt = state.reconnectAttempts;
  const delayMs = computeWsBackoffDelayMs(attempt);
  const consecutiveFailures = state.consecutiveFailures + 1;
  const activateRestFallback = shouldActivateRestFallback(consecutiveFailures);

  const nextState: WsHeartbeatState = {
    ...state,
    connected: false,
    reconnectAttempts: attempt + 1,
    consecutiveFailures,
    lastDisconnectReason: reason,
    restFallbackActive: activateRestFallback,
    mode: activateRestFallback ? "rest_polling" : "websocket",
  };

  return {
    plan: {
      delayMs,
      attempt: attempt + 1,
      activateRestFallback,
      reason,
    },
    nextState,
  };
}

export function onWsReconnectSuccess(state: WsHeartbeatState): WsHeartbeatState {
  return {
    ...state,
    mode: "websocket",
    connected: true,
    reconnectAttempts: 0,
    consecutiveFailures: 0,
    restFallbackActive: false,
    lastDisconnectReason: null,
    lastPingAt: null,
    lastPongAt: null,
  };
}

export function buildWsDisconnectionEvent(input: {
  reason: string;
  state: WsHeartbeatState;
  backoffDelayMs: number;
  channel?: string;
  now?: () => number;
  idFactory?: () => string;
}): WsDisconnectionEvent {
  const now = input.now ?? (() => Date.now());
  const idFactory =
    input.idFactory ?? (() => `ws-disc-${now().toString(36)}`);
  return {
    id: idFactory(),
    timestamp: new Date(now()).toISOString(),
    reason: input.reason,
    reconnectAttempts: input.state.reconnectAttempts,
    consecutiveFailures: input.state.consecutiveFailures,
    backoffDelayMs: input.backoffDelayMs,
    restFallbackActivated: input.state.restFallbackActive,
    channel: input.channel,
    transportMode: input.state.mode,
  };
}

export async function persistWsDisconnectionEvent(
  kv: KVNamespace,
  event: WsDisconnectionEvent,
): Promise<void> {
  const raw = await kv.get(WS_DISCONNECTION_KV_KEY);
  let entries: WsDisconnectionEvent[] = [];
  if (raw) {
    try {
      const parsed = JSON.parse(raw) as
        | { entries?: WsDisconnectionEvent[] }
        | WsDisconnectionEvent[];
      entries = Array.isArray(parsed)
        ? parsed
        : Array.isArray(parsed.entries)
          ? parsed.entries
          : [];
    } catch {
      entries = [];
    }
  }
  entries = [...entries, event].slice(-100);
  await kv.put(
    WS_DISCONNECTION_KV_KEY,
    JSON.stringify({ updatedAt: event.timestamp, entries }),
  );
}

export async function restPollL2Book(input: {
  coin: string;
  postInfo?: typeof postHlInfo;
  now?: () => number;
}): Promise<RestPollResult> {
  const now = input.now ?? (() => Date.now());
  const started = now();
  const post = input.postInfo ?? postHlInfo;
  try {
    const res = await post({ type: "l2Book", coin: input.coin });
    if (!res.ok) {
      return {
        ok: false,
        source: "rest_polling",
        coin: input.coin,
        data: null,
        latencyMs: now() - started,
        error: `HTTP ${res.status}`,
      };
    }
    const data = await res.json();
    return {
      ok: true,
      source: "rest_polling",
      coin: input.coin,
      data,
      latencyMs: now() - started,
    };
  } catch (err) {
    return {
      ok: false,
      source: "rest_polling",
      coin: input.coin,
      data: null,
      latencyMs: now() - started,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

export class WsHeartbeatController {
  state: WsHeartbeatState;
  private readonly kv?: KVNamespace;
  private readonly channel?: string;
  private readonly coin: string;
  private readonly now: () => number;
  private readonly postInfo: typeof postHlInfo;
  private readonly onRestFallback?: (event: WsDisconnectionEvent) => void;
  private readonly persistEvent: typeof persistWsDisconnectionEvent;

  constructor(options: WsHeartbeatControllerOptions = {}) {
    this.state = createWsHeartbeatState();
    this.kv = options.kv;
    this.channel = options.channel;
    this.coin = options.coin ?? "ETH";
    this.now = options.now ?? (() => Date.now());
    this.postInfo = options.postInfo ?? postHlInfo;
    this.onRestFallback = options.onRestFallback;
    this.persistEvent = options.persistEvent ?? persistWsDisconnectionEvent;
  }

  markConnected(): void {
    this.state = onWsReconnectSuccess(this.state);
  }

  markDisconnected(reason: string): WsReconnectPlan {
    const { plan, nextState } = planWsReconnect(this.state, reason);
    this.state = nextState;
    void this.auditDisconnect(plan);
    if (plan.activateRestFallback) {
      const event = buildWsDisconnectionEvent({
        reason: `REST_FAILOVER:${reason}`,
        state: this.state,
        backoffDelayMs: plan.delayMs,
        channel: this.channel,
        now: this.now,
      });
      this.onRestFallback?.(event);
    }
    return plan;
  }

  tickPing(): boolean {
    if (!shouldSendHeartbeatPing(this.state, this.now())) return false;
    this.state = recordWsPing(this.state, this.now());
    return true;
  }

  onPongReceived(): void {
    this.state = recordWsPong(this.state, this.now());
  }

  checkHeartbeatStale(): boolean {
    const { stale } = evaluatePingPong({
      lastPingAt: this.state.lastPingAt,
      lastPongAt: this.state.lastPongAt,
      now: this.now(),
    });
    return stale;
  }

  async runRestFallbackPoll(): Promise<RestPollResult> {
    return restPollL2Book({
      coin: this.coin,
      postInfo: this.postInfo,
      now: this.now,
    });
  }

  private async auditDisconnect(plan: WsReconnectPlan): Promise<void> {
    if (!this.kv) return;
    const event = buildWsDisconnectionEvent({
      reason: plan.reason,
      state: this.state,
      backoffDelayMs: plan.delayMs,
      channel: this.channel,
      now: this.now,
    });
    await this.persistEvent(this.kv, event);
  }
}

export { HL_INFO_URL };
