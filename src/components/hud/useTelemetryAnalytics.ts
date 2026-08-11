import { useCallback, useEffect, useState } from "react";
import { PING_INTERVAL_MS } from "./Section1/section1-hud-types";

import { TOXIC_FILLS_BLOCKED_PCT } from "../../services/telemetry-analytics-lib/telemetry-analytics-core";

const ANALYTICS_PATH = "/api/telemetry/analytics";

export interface TelemetryAnalyticsModel {
  preventedDrawdownUsd: string;
  toxicFillsBlockedPct: string;
  hlOrderbookGapGuardTriggers: number;
  isSimulatedBenchmark: boolean;
  benchmarkImpactModelLabel: string;
  loading: boolean;
  refresh: () => Promise<void>;
}

const DEFAULT_PREVENTED_DRAWDOWN = "$14,250";
const DEFAULT_TOXIC_FILLS_BLOCKED_PCT = TOXIC_FILLS_BLOCKED_PCT;
const DEFAULT_BENCHMARK_LABEL =
  "Simulated Benchmark Impact Model / Illustrative Prevented-Drawdown Scenario";

export function useTelemetryAnalytics(): TelemetryAnalyticsModel {
  const [preventedDrawdownUsd, setPreventedDrawdownUsd] = useState(
    DEFAULT_PREVENTED_DRAWDOWN,
  );
  const [toxicFillsBlockedPct, setToxicFillsBlockedPct] = useState<string>(
    DEFAULT_TOXIC_FILLS_BLOCKED_PCT,
  );
  const [hlOrderbookGapGuardTriggers, setHlOrderbookGapGuardTriggers] = useState(0);
  const [isSimulatedBenchmark, setIsSimulatedBenchmark] = useState(true);
  const [benchmarkImpactModelLabel, setBenchmarkImpactModelLabel] = useState(
    DEFAULT_BENCHMARK_LABEL,
  );
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async (): Promise<void> => {
    try {
      const res = await fetch(ANALYTICS_PATH, { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const body = (await res.json()) as {
        success?: boolean;
        isSimulatedBenchmark?: boolean;
        benchmarkImpactModelLabel?: string;
        simulatedPreventedDrawdownUsd?: string;
        toxicFillsBlockedPct?: string;
        hlOrderbookGapGuardTriggers?: number;
      };
      if (body.success !== true) throw new Error("analytics unavailable");
      if (body.isSimulatedBenchmark === true) {
        setIsSimulatedBenchmark(true);
      }
      if (body.benchmarkImpactModelLabel) {
        setBenchmarkImpactModelLabel(body.benchmarkImpactModelLabel);
      }
      if (body.simulatedPreventedDrawdownUsd) {
        setPreventedDrawdownUsd(body.simulatedPreventedDrawdownUsd);
      }
      if (body.toxicFillsBlockedPct) {
        setToxicFillsBlockedPct(body.toxicFillsBlockedPct);
      }
      if (typeof body.hlOrderbookGapGuardTriggers === "number") {
        setHlOrderbookGapGuardTriggers(body.hlOrderbookGapGuardTriggers);
      }
    } catch (err) {
      console.warn(
        "[telemetry-analytics] Network connection lost — poll suppressed",
        err instanceof Error ? err.message : err,
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
    const poll = window.setInterval(() => {
      void refresh();
    }, PING_INTERVAL_MS);
    return () => window.clearInterval(poll);
  }, [refresh]);

  return {
    preventedDrawdownUsd,
    toxicFillsBlockedPct,
    hlOrderbookGapGuardTriggers,
    isSimulatedBenchmark,
    benchmarkImpactModelLabel,
    loading,
    refresh,
  };
}
