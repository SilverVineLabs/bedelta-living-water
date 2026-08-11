/**
 * Hyperliquid WebSocket connection lifecycle — reconnect, heartbeat, health.
 */

import { buildPingFrame } from "./websocket-frames";
import { touchSessionKeyHeartbeat } from "../../../services/session-key-adapter-lib/nonce-auto-healing";
import { evaluateWsTripReasons } from "./websocket-health";
import {
  WS_RECONNECT_BASE_MS,
  WS_RECONNECT_MAX_MS,
  type WsHealthSnapshot,
  type WsLike,
} from "./types";

const WS_OPEN = 1;

export interface WsConnectionTimers {
  heartbeatTimer: ReturnType<typeof setInterval> | null;
  staleTimer: ReturnType<typeof setInterval> | null;
  reconnectTimer: ReturnType<typeof setTimeout> | null;
}

export function createConnectionTimers(): WsConnectionTimers {
  return {
    heartbeatTimer: null,
    staleTimer: null,
    reconnectTimer: null,
  };
}

export function clearConnectionTimers(
  timers: WsConnectionTimers,
  clearIntervalFn: typeof clearInterval,
): void {
  if (timers.heartbeatTimer) {
    clearIntervalFn(timers.heartbeatTimer);
    timers.heartbeatTimer = null;
  }
  if (timers.staleTimer) {
    clearIntervalFn(timers.staleTimer);
    timers.staleTimer = null;
  }
}

export function startConnectionTimers(
  timers: WsConnectionTimers,
  setIntervalFn: typeof setInterval,
  heartbeatIntervalMs: number,
  onPing: () => void,
  onStaleCheck: () => void,
): void {
  timers.heartbeatTimer = setIntervalFn(onPing, heartbeatIntervalMs);
  timers.staleTimer = setIntervalFn(onStaleCheck, 1_000);
}

export function sendWsPing(
  ws: WsLike | null,
  now: number,
  onSent: (pingAt: number) => void,
  onFailed: () => void,
): void {
  if (!ws || ws.readyState !== WS_OPEN) return;
  try {
    const pingAt = now;
    ws.send(buildPingFrame());
    touchSessionKeyHeartbeat(pingAt);
    onSent(pingAt);
  } catch (err) {
    console.warn(
      "[HL_WS] Network connection lost — ping send suppressed",
      err instanceof Error ? err.message : err,
    );
    onFailed();
  }
}

export function checkWsStale(
  health: WsHealthSnapshot,
  now: number,
  staleThresholdMs: number,
  onStale: () => void,
): void {
  if (!health.connected) return;
  const last = health.lastMessageAt;
  if (last === null) return;

  const idleMs = now - last;
  if (idleMs > staleThresholdMs) {
    onStale();
  }
}

export function scheduleWsReconnect(
  timers: WsConnectionTimers,
  reconnectAttempts: number,
  intentionalClose: boolean,
  setTimeoutFn: typeof setTimeout,
  onReconnect: () => void,
): number {
  if (timers.reconnectTimer || intentionalClose) return reconnectAttempts;
  const delay = Math.min(
    WS_RECONNECT_BASE_MS * 2 ** reconnectAttempts,
    WS_RECONNECT_MAX_MS,
  );
  const nextAttempts = reconnectAttempts + 1;
  timers.reconnectTimer = setTimeoutFn(() => {
    timers.reconnectTimer = null;
    onReconnect();
  }, delay);
  return nextAttempts;
}

export function refreshWsSoilTrip(health: WsHealthSnapshot): {
  soilTripped: boolean;
  tripReasons: string[];
} {
  const tripReasons = evaluateWsTripReasons(health);
  return {
    soilTripped: tripReasons.length > 0,
    tripReasons,
  };
}

export function emitWsHealthChange(
  getHealth: () => WsHealthSnapshot,
  onHealthChange?: (health: WsHealthSnapshot) => void,
): void {
  try {
    onHealthChange?.(getHealth());
  } catch (err) {
    console.warn(
      "[HL_WS] Network connection lost — health callback suppressed",
      err instanceof Error ? err.message : err,
    );
  }
}

export interface WsSocketHandlerHost {
  intentionalClose: boolean;
  autoReconnect: boolean;
  ws: WsLike | null;
  setWs(ws: WsLike | null): void;
  onOpen(): void;
  onRawMessage(raw: string): void;
  clearTimers(): void;
  scheduleReconnect(): void;
  setHealth(patch: Partial<WsHealthSnapshot>): void;
}

/** Wire socket lifecycle handlers — open, message, error, close, connect failure. */
export function attachWsSocketHandlers(
  host: WsSocketHandlerHost,
  socket: WsLike,
): void {
  socket.onopen = () => {
    try {
      host.onOpen();
    } catch (err) {
      console.warn(
        "[HL_WS] Network connection lost — open handler suppressed",
        err instanceof Error ? err.message : err,
      );
      host.setHealth({ connected: false, stale: true });
    }
  };

  socket.onmessage = (event: MessageEvent) => {
    try {
      host.onRawMessage(String(event.data));
    } catch (err) {
      console.warn(
        "[HL_WS] Network connection lost — message handler suppressed",
        err instanceof Error ? err.message : err,
      );
    }
  };

  socket.onerror = () => {
    console.warn("[HL_WS] Network connection lost — socket error");
    host.setHealth({ connected: false, stale: true });
  };

  socket.onclose = () => {
    try {
      host.clearTimers();
      host.setWs(null);
      host.setHealth({ connected: false, stale: true });
      if (!host.intentionalClose && host.autoReconnect) {
        host.scheduleReconnect();
      }
    } catch (err) {
      console.warn(
        "[HL_WS] Network connection lost — close handler suppressed",
        err instanceof Error ? err.message : err,
      );
    }
  };
}

export function handleWsConnectFailure(
  host: WsSocketHandlerHost,
  err: unknown,
): void {
  console.warn(
    "[HL_WS] Network connection lost — connect failed",
    err instanceof Error ? err.message : err,
  );
  host.setWs(null);
  host.setHealth({ connected: false, stale: true });
  if (!host.intentionalClose && host.autoReconnect) {
    host.scheduleReconnect();
  }
}
