import { useCallback, useEffect, useRef, useState } from "react";
import type { HudStreamPayload } from "../../api/hud-telemetry";
import { HUD_STREAM_PING_MS } from "../../api/hud-telemetry";
import {
  buildUiHandshakeHeaders,
  HUD_CANARY_EXPECTED,
} from "../../services/defense/ui-canary";
import {
  isSilentBufferFetchFailure,
  logBufferedTelemetryOnce,
} from "../lib/hud-buffer-log";
import { isBrowser } from "../lib/client-runtime";

const HUD_STREAM_POLL_MS = HUD_STREAM_PING_MS;

function isAbortError(err: unknown): boolean {
  if (err instanceof DOMException && err.name === "AbortError") return true;
  return err instanceof Error && err.name === "AbortError";
}

export interface UseHudStreamResult {
  payload: HudStreamPayload | null;
  error: string | null;
  loading: boolean;
  refresh: () => Promise<void>;
}

export function useHudStream(enabled = true): UseHudStreamResult {
  const [payload, setPayload] = useState<HudStreamPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(enabled);
  const inFlightRef = useRef(false);
  const abortRef = useRef<AbortController | null>(null);

  const refresh = useCallback(async (signal?: AbortSignal) => {
    if (!isBrowser() || inFlightRef.current) return;
    if (signal?.aborted) return;
    inFlightRef.current = true;
    setLoading(true);
    try {
      let response: Response;
      try {
        response = await fetch("/api/hud-stream", {
          method: "GET",
          headers: {
            Accept: "application/json",
            "X-Santenmoku-Canary": HUD_CANARY_EXPECTED,
            ...buildUiHandshakeHeaders(),
          },
          signal,
        });
      } catch (fetchErr) {
        if (isAbortError(fetchErr) || signal?.aborted) return;
        if (isSilentBufferFetchFailure(fetchErr)) {
          logBufferedTelemetryOnce();
          setPayload(null);
          setError(null);
          return;
        }
        throw fetchErr;
      }

      if (signal?.aborted) return;

      let body: HudStreamPayload & {
        success?: boolean;
        error?: string;
        locked?: boolean;
      };
      try {
        body = (await response.json()) as typeof body;
      } catch {
        if (signal?.aborted) return;
        logBufferedTelemetryOnce();
        setPayload(null);
        setError(null);
        return;
      }

      if (!response.ok || body.success !== true) {
        if (!response.ok && response.status >= 500) {
          logBufferedTelemetryOnce();
          setPayload(null);
          setError(null);
          return;
        }
        setPayload(null);
        setError(body.error ?? `HUD stream HTTP ${response.status}`);
        return;
      }

      setPayload(body);
      setError(null);
    } catch (err) {
      if (isAbortError(err) || signal?.aborted) return;
      if (isSilentBufferFetchFailure(err)) {
        logBufferedTelemetryOnce();
        setPayload(null);
        setError(null);
        return;
      }
      console.warn(
        "[hud-stream] Network connection lost — client poll suppressed",
        err instanceof Error ? err.message : err,
      );
      setPayload(null);
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      inFlightRef.current = false;
      if (!signal?.aborted) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    if (!enabled || !isBrowser()) {
      setLoading(false);
      return undefined;
    }

    abortRef.current?.abort();
    const ac = new AbortController();
    abortRef.current = ac;

    const tick = () => {
      if (ac.signal.aborted) return;
      void refresh(ac.signal).catch(() => {
        if (!ac.signal.aborted) logBufferedTelemetryOnce();
      });
    };

    tick();
    const timer = window.setInterval(tick, HUD_STREAM_POLL_MS);

    return () => {
      ac.abort();
      abortRef.current = null;
      inFlightRef.current = false;
      window.clearInterval(timer);
    };
  }, [enabled, refresh]);

  return {
    payload,
    error,
    loading,
    refresh: () => refresh(abortRef.current?.signal),
  };
}
