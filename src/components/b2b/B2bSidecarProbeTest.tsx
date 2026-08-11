/** Live Sidecar health probe — `/api/telemetry/health` RTT, fail-closed armed. */
import { useRef, useState, type ReactNode } from "react";
import { TELEMETRY_FAIL_CLOSED_MS } from "../hud/useTelemetryHealthPing";
import { Button } from "../ui/button";

const HEALTH_PATH = "/api/telemetry/health";

export const SIDECAR_PROBE_OFFLINE = "OFFLINE / SIMULATED PROBE" as const;

export function formatSidecarProbeResult(latencyMs: number): string {
  const slo = latencyMs > TELEMETRY_FAIL_CLOSED_MS ? "FAIL-CLOSED TRIPPED" : "FAIL-CLOSED ARMED";
  return `[ ⚡ 500ms DECISION DEADLINE SLO : ${slo} · RTT ${latencyMs}ms ]`;
}

export function B2bSidecarProbeTest(): ReactNode {
  const [probing, setProbing] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [offline, setOffline] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  async function onProbe(): Promise<void> {
    if (probing) return;
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setProbing(true);
    setResult(null);
    setOffline(false);
    const start = performance.now();
    try {
      const res = await fetch(HEALTH_PATH, { cache: "no-store", signal: controller.signal });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      await res.json();
      const rtt = Math.round(performance.now() - start);
      setResult(formatSidecarProbeResult(rtt));
      setOffline(false);
    } catch {
      if (controller.signal.aborted) return;
      setResult(SIDECAR_PROBE_OFFLINE);
      setOffline(true);
    } finally {
      if (!controller.signal.aborted) {
        setProbing(false);
        abortRef.current = null;
      }
    }
  }

  return (
    <div className="mt-4 flex flex-col gap-3" data-testid="b2b-sidecar-probe-panel">
      <Button
        type="button"
        disabled={probing}
        className="w-full font-mono text-[11px] sm:w-auto"
        data-testid="b2b-test-sidecar-probe"
        onClick={() => void onProbe()}
      >
        {probing ? "[ 🧪 Probing Sidecar… ]" : "[ 🧪 Test Live Sidecar Probe ]"}
      </Button>
      {result ? (
        <p
          className={[
            "rounded-md border px-3 py-2 font-mono text-[10px] font-semibold",
            offline
              ? "border-amber-400/55 bg-amber-950/40 text-amber-300 shadow-[0_0_20px_rgba(251,191,36,0.35)]"
              : "animate-pulse border-emerald-400/55 bg-emerald-950/40 text-emerald-300 shadow-[0_0_20px_rgba(52,211,153,0.45)]",
          ].join(" ")}
          data-testid="b2b-sidecar-probe-result"
        >
          {result}
        </p>
      ) : null}
    </div>
  );
}
