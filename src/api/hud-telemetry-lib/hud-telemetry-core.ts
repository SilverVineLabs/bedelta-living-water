/**
 * GET /api/hud-stream — debounced Santenmoku HUD telemetry (JSON or SSE).
 */

import { CORS_JSON_HEADERS } from "../../services/config";
import { validateHudStreamRequest } from "../../services/defense/ui-canary";
import {
  buildHudStreamPayloadSafe,
  HUD_STREAM_DEBOUNCE_MS,
  probeHudBookDepthSafe,
  type HudStreamPayload,
} from "./hud-telemetry-log-helpers";

export {
  attachCircuitBreakerTerminalLogs,
  buildHudStreamPayload,
  buildHudStreamPayloadSafe,
  HUD_FALLBACK_LIVE_PAIRS,
  HUD_FALLBACK_MARKET_PROBE,
  HUD_STREAM_DEBOUNCE_MS,
  HUD_STREAM_PING_MS,
  mapCircuitBreakerEntriesForTerminal,
  type CircuitBreakerTerminalEntry,
  type HudConnectivityMode,
  type HudMarketPair,
  type HudMarketProbe,
  type HudStreamPayload,
  type HudTerminalSeverLog,
} from "./hud-telemetry-log-helpers";

const HUD_SSE_HEADERS: Record<string, string> = {
  "Content-Type": "text/event-stream; charset=utf-8",
  "Cache-Control": "no-cache, no-transform",
  Connection: "keep-alive",
  "Access-Control-Allow-Origin": "*",
};

let lastStream: { at: number; body: HudStreamPayload } | null = null;

function wantsHudStreamSse(request: Request): boolean {
  const accept = request.headers.get("Accept") ?? "";
  return accept.includes("text/event-stream");
}

function closeHudStreamSse(
  controller: ReadableStreamDefaultController<Uint8Array>,
  pingTimer: ReturnType<typeof setInterval> | undefined,
): void {
  if (pingTimer !== undefined) clearInterval(pingTimer);
  try {
    controller.close();
  } catch {
    /* already closed */
  }
}

function isStreamOrNetworkError(err: unknown): boolean {
  if (!(err instanceof Error)) return false;
  if (err instanceof TypeError && /closed|invalid state/i.test(err.message)) {
    return true;
  }
  return /network connection lost|connection lost|broken pipe|reset by peer|aborted|cancel|fetch failed|networkerror/i.test(
    err.message,
  );
}

function handleHudStreamSse(request: Request): Response {
  const encoder = new TextEncoder();
  const timers = new Set<ReturnType<typeof setInterval>>();
  const state = {
    closed: false,
    pingTimer: undefined as ReturnType<typeof setInterval> | undefined,
  };

  const clearAllTimers = () => {
    for (const timer of timers) clearInterval(timer);
    timers.clear();
    state.pingTimer = undefined;
  };

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      const shutdown = () => {
        if (state.closed) return;
        state.closed = true;
        clearAllTimers();
        closeHudStreamSse(controller, state.pingTimer);
      };

      const pushPayload = () => {
        if (state.closed || request.signal.aborted) {
          shutdown();
          return;
        }
        void (async () => {
          try {
            await probeHudBookDepthSafe("ETH");
            if (state.closed || request.signal.aborted) {
              shutdown();
              return;
            }
            const body = buildHudStreamPayloadSafe();
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify(body)}\n\n`),
            );
          } catch (err) {
            if (isStreamOrNetworkError(err) || request.signal.aborted) {
              shutdown();
              return;
            }
            const message = err instanceof Error ? err.message : String(err);
            console.warn("[hud-stream] Fallback depth used:", message);
            try {
              const body = buildHudStreamPayloadSafe();
              if (!state.closed && !request.signal.aborted) {
                controller.enqueue(
                  encoder.encode(`data: ${JSON.stringify(body)}\n\n`),
                );
              }
            } catch {
              shutdown();
            }
          }
        })().catch(() => {
          shutdown();
        });
      };

      request.signal.addEventListener("abort", shutdown, { once: true });

      if (request.signal.aborted) {
        shutdown();
        return;
      }

      try {
        pushPayload();
      } catch (err) {
        if (!isStreamOrNetworkError(err)) {
          console.error("[hud-stream] SSE start failed", err);
        }
        shutdown();
        return;
      }

      if (state.closed) return;

      state.pingTimer = setInterval(() => {
        if (request.signal.aborted || state.closed) {
          shutdown();
          return;
        }
        pushPayload();
      }, HUD_STREAM_DEBOUNCE_MS);
      timers.add(state.pingTimer);
    },
    cancel() {
      if (state.closed) return;
      state.closed = true;
      clearAllTimers();
    },
  });

  return new Response(stream, { status: 200, headers: HUD_SSE_HEADERS });
}

export function handleHudStreamRequest(request: Request): Response {
  try {
    const auth = validateHudStreamRequest(request);
    if (!auth.ok) {
      return new Response(
        JSON.stringify({ success: false, error: auth.message, locked: true }),
        { status: auth.status, headers: CORS_JSON_HEADERS },
      );
    }

    if (request.signal.aborted) {
      return new Response(null, { status: 499, headers: CORS_JSON_HEADERS });
    }

    if (wantsHudStreamSse(request)) {
      return handleHudStreamSse(request);
    }

    const now = Date.now();
    if (lastStream && now - lastStream.at < HUD_STREAM_DEBOUNCE_MS) {
      return new Response(JSON.stringify(lastStream.body), {
        status: 200,
        headers: CORS_JSON_HEADERS,
      });
    }

    const body = buildHudStreamPayloadSafe(now);
    lastStream = { at: now, body };
    return new Response(JSON.stringify(body), {
      status: 200,
      headers: CORS_JSON_HEADERS,
    });
  } catch (err) {
    if (!isStreamOrNetworkError(err) && !request.signal.aborted) {
      console.warn(
        "[hud-stream] request handler fallback:",
        err instanceof Error ? err.message : err,
      );
    }
    return new Response(JSON.stringify(buildHudStreamPayloadSafe()), {
      status: 200,
      headers: CORS_JSON_HEADERS,
    });
  }
}

/** @internal test reset */
export function __resetHudStreamDebounceForTests(): void {
  lastStream = null;
}
