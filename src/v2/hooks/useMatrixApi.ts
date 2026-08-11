import { useCallback, useEffect, useRef, useState } from "react";
import {
  DEFAULT_POLL_MS,
  fetchMatrixApiData,
  MatrixApiBufferError,
  resolveMatrixPollIntervalMs,
  type MatrixApiSnapshot,
} from "../services/matrix-api";
import { logBufferedTelemetryOnce } from "../lib/hud-buffer-log";
import { isBrowser } from "../lib/client-runtime";

export interface UseMatrixApiOptions {
  pollMs?: number;
  enabled?: boolean;
}

export interface UseMatrixApiResult {
  snapshot: MatrixApiSnapshot | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useMatrixApi(
  options: UseMatrixApiOptions = {},
): UseMatrixApiResult {
  const pollMs = resolveMatrixPollIntervalMs(options.pollMs ?? DEFAULT_POLL_MS);
  const enabled = options.enabled ?? true;
  const [snapshot, setSnapshot] = useState<MatrixApiSnapshot | null>(null);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState<string | null>(null);
  const inFlightRef = useRef(false);

  const refresh = useCallback(async () => {
    if (!isBrowser() || inFlightRef.current) return;
    inFlightRef.current = true;
    setLoading(true);
    try {
      const next = await fetchMatrixApiData();
      setSnapshot(next);
      setError(null);
    } catch (err) {
      if (err instanceof MatrixApiBufferError) {
        logBufferedTelemetryOnce();
        setError(null);
        return;
      }
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      inFlightRef.current = false;
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!enabled || !isBrowser()) {
      setLoading(false);
      return;
    }

    void refresh().catch(() => {
      logBufferedTelemetryOnce();
    });
    const timer = window.setInterval(() => {
      void refresh().catch(() => {
        logBufferedTelemetryOnce();
      });
    }, pollMs);

    return () => window.clearInterval(timer);
  }, [enabled, pollMs, refresh]);

  return { snapshot, loading, error, refresh };
}
