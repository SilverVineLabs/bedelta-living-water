import { useCallback, useEffect, useRef, useState } from "react";
import { randomPingMs } from "./Section1/section1-hud-engine-lib/section1-hud-engine-core";
import {
  PING_INTERVAL_MS,
  PING_MIN_MS,
} from "./Section1/section1-hud-types";

const HEALTH_PATH = "/api/telemetry/health";
const JITTER_INTERVAL_MS = 800;
export const TELEMETRY_FAIL_CLOSED_MS = 200;

export interface TelemetryHealthPingModel {
  pingMs: number;
  probeLive: boolean;
  isFailClosed: boolean;
  refresh: () => Promise<number | null>;
}

export function useTelemetryHealthPing(): TelemetryHealthPingModel {
  const [pingMs, setPingMs] = useState(() => randomPingMs());
  const [probeLive, setProbeLive] = useState(false);
  const measuredRef = useRef<number | null>(null);

  const refresh = useCallback(async (): Promise<number | null> => {
    const start = performance.now();
    try {
      const res = await fetch(HEALTH_PATH, { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      await res.json();
      const rtt = Math.round(performance.now() - start);
      measuredRef.current = rtt;
      setPingMs(rtt);
      setProbeLive(true);
      return rtt;
    } catch {
      measuredRef.current = null;
      setProbeLive(false);
      return null;
    }
  }, []);

  useEffect(() => {
    void refresh().catch((err) => {
      console.warn(
        "[telemetry-ping] Network connection lost — poll suppressed",
        err instanceof Error ? err.message : err,
      );
    });
    const poll = window.setInterval(() => {
      void refresh().catch((err) => {
        console.warn(
          "[telemetry-ping] Network connection lost — poll suppressed",
          err instanceof Error ? err.message : err,
        );
      });
    }, PING_INTERVAL_MS);
    return () => window.clearInterval(poll);
  }, [refresh]);

  useEffect(() => {
    const jitter = window.setInterval(() => {
      if (probeLive && measuredRef.current !== null) {
        const base = measuredRef.current;
        const delta = Math.floor(Math.random() * 5) - 2;
        setPingMs(Math.max(PING_MIN_MS, base + delta));
        return;
      }
      setPingMs(randomPingMs());
    }, JITTER_INTERVAL_MS);
    return () => window.clearInterval(jitter);
  }, [probeLive]);

  const isFailClosed = pingMs > TELEMETRY_FAIL_CLOSED_MS;

  return { pingMs, probeLive, isFailClosed, refresh };
}
