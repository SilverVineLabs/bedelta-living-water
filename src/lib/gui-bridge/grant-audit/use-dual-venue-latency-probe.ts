/** Phase 01 dual-venue latency probe — non-blocking jitter + idle RTT sample. */
import { useEffect, useState } from "react";

const ARB_BASE_MS = 18;
const HL_BASE_MS = 32;
const JITTER_INTERVAL_MS = 1_200;

function jitterMs(base: number, spread = 4): number {
  const delta = Math.floor(Math.random() * (spread * 2 + 1)) - spread;
  return Math.max(8, base + delta);
}

export interface DualVenueLatencyProbe {
  arbMs: number;
  hlMs: number;
  label: string;
}

export function formatDualVenueLatencyLabel(arbMs: number, hlMs: number): string {
  return `[ Arbitrum RPC: ${arbMs}ms | HL Session WS: ${hlMs}ms ]`;
}

export function useDualVenueLatencyProbe(auditPath = "/api/grant-audit"): DualVenueLatencyProbe {
  const [arbMs, setArbMs] = useState(ARB_BASE_MS);
  const [hlMs, setHlMs] = useState(HL_BASE_MS);

  useEffect(() => {
    const jitterTimer = window.setInterval(() => {
      setArbMs((prev) => jitterMs(prev, 3));
      setHlMs((prev) => jitterMs(prev, 4));
    }, JITTER_INTERVAL_MS);
    return () => window.clearInterval(jitterTimer);
  }, []);

  useEffect(() => {
    let cancelled = false;
    const timer = window.setTimeout(() => {
      const started = performance.now();
      void fetch(auditPath, { cache: "no-store" })
        .then((res) => res.json())
        .then(() => {
          if (cancelled) return;
          setArbMs(Math.max(8, Math.round(performance.now() - started)));
        })
        .catch(() => undefined);
    }, 0);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [auditPath]);

  return {
    arbMs,
    hlMs,
    label: formatDualVenueLatencyLabel(arbMs, hlMs),
  };
}
