#!/usr/bin/env tsx
/**
 * 24h sandbox soak harness — sequential 1-minute ticks against Hyperliquid testnet.
 * Default: 1,440 iterations (24h). Short run: `--iterations 10`
 */

import { performance } from "node:perf_hooks";
import {
  SOAK_ROLLING_MAX_TICKS,
  SOAK_TELEMETRY_COINS,
  __resetSoakTelemetryForTests,
  readInMemorySoakLog,
  runSoakTelemetryTick,
  type SoakTelemetryTick,
} from "../src/services/soak-telemetry";
import { __resetCircuitBreakerForTests } from "../src/services/circuit-breaker";
import { __clearL2BookCacheForTests } from "../src/services/hyperliquid-adapter";

const DEFAULT_ITERATIONS = SOAK_ROLLING_MAX_TICKS;
const WARMUP_ITERATIONS = 5;
const MAX_HEAP_VARIANCE_RATIO = 0.2;
const MOCK_LATENCY_MS = 12;
const MOCK_FAULT_EVERY = 173;

const SAMPLE_BOOK = {
  coin: "BTC",
  levels: [
    [{ px: "65000", sz: "1000" }],
    [{ px: "65002", sz: "8000" }],
  ],
  time: Date.now(),
};

const ETH_BOOK = {
  coin: "ETH",
  levels: [
    [{ px: "3500", sz: "1200" }],
    [{ px: "3500.5", sz: "9000" }],
  ],
  time: Date.now(),
};

interface SoakCliOptions {
  iterations: number;
  useMock: boolean;
}

interface TickMetricsLog {
  event: "SOAK_TICK_METRICS";
  iteration: number;
  heapUsedMb: number;
  networkMs: number;
  failures: number;
  coins: Array<{
    coin: string;
    soilOk: boolean;
    counterVerdict: string;
    latencyMs: number;
    error: string | null;
  }>;
}

function parseCliOptions(argv: readonly string[]): SoakCliOptions {
  const iterationsFlag = argv.indexOf("--iterations");
  const parsed =
    iterationsFlag >= 0 ? Number(argv[iterationsFlag + 1]) : DEFAULT_ITERATIONS;

  return {
    iterations:
      Number.isFinite(parsed) && parsed > 0
        ? Math.floor(parsed)
        : DEFAULT_ITERATIONS,
    useMock: argv.includes("--mock"),
  };
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function createMockFetch(iteration: number): typeof fetch {
  return (async (_input: RequestInfo | URL, init?: RequestInit) => {
    await sleep(MOCK_LATENCY_MS);

    if (iteration > 0 && iteration % MOCK_FAULT_EVERY === 0) {
      throw new Error("SOAK_INJECTED_NETWORK_FAULT");
    }

    const body = init?.body ? JSON.parse(String(init.body)) : {};
    const coin = String(body.coin ?? "BTC").toUpperCase();
    return Response.json(coin === "ETH" ? ETH_BOOK : SAMPLE_BOOK);
  }) as typeof fetch;
}

function heapMb(bytes: number): number {
  return Number((bytes / (1024 * 1024)).toFixed(3));
}

function summarizeTicks(ticks: SoakTelemetryTick[]): {
  failureCount: number;
  failureRate: number;
  avgNetworkMs: number;
  maxNetworkMs: number;
} {
  if (ticks.length === 0) {
    return {
      failureCount: 0,
      failureRate: 0,
      avgNetworkMs: 0,
      maxNetworkMs: 0,
    };
  }

  const failureCount = ticks.filter(
    (t) => !!t.error || !t.soilOk,
  ).length;

  const latencies = ticks.map((t) => t.latencyMs);
  const avgNetworkMs =
    latencies.reduce((sum, ms) => sum + ms, 0) / latencies.length;

  return {
    failureCount,
    failureRate: Number((failureCount / ticks.length).toFixed(4)),
    avgNetworkMs: Number(avgNetworkMs.toFixed(3)),
    maxNetworkMs: Math.max(...latencies),
  };
}

function logTickMetrics(
  iteration: number,
  ticks: SoakTelemetryTick[],
  heapUsed: number,
  cumulativeFailures: number,
): void {
  const networkMs = ticks.reduce((sum, t) => sum + t.latencyMs, 0);

  const payload: TickMetricsLog = {
    event: "SOAK_TICK_METRICS",
    iteration,
    heapUsedMb: heapMb(heapUsed),
    networkMs: Number(networkMs.toFixed(3)),
    failures: cumulativeFailures,
    coins: ticks.map((t) => ({
      coin: t.coin,
      soilOk: t.soilOk,
      counterVerdict: t.counterVerdict,
      latencyMs: t.latencyMs,
      error: t.error ?? null,
    })),
  };

  console.log(JSON.stringify(payload));
}

async function main(): Promise<void> {
  const options = parseCliOptions(process.argv.slice(2));

  __resetSoakTelemetryForTests();
  __resetCircuitBreakerForTests();
  __clearL2BookCacheForTests();

  let iterationFailures = 0;
  let lastBatchTicks: SoakTelemetryTick[] = [];
  let fatalErrors = 0;

  for (let i = 0; i < WARMUP_ITERATIONS; i++) {
    await runSoakTelemetryTick({
      fetchFn: options.useMock ? createMockFetch(i) : undefined,
      fetchOptions: {
        maxRetries: options.useMock ? 1 : 2,
        timeoutMs: options.useMock ? 50 : 8_000,
      },
    }).catch(() => {
      fatalErrors += 1;
    });
  }

  if (global.gc) {
    global.gc();
  }

  const heapStart = process.memoryUsage().heapUsed;
  const heapSamples: number[] = [heapStart];
  const started = performance.now();

  for (let i = 1; i <= options.iterations; i++) {
    const tickStarted = performance.now();

    try {
      const rolling = await runSoakTelemetryTick({
        fetchFn: options.useMock ? createMockFetch(i) : undefined,
        fetchOptions: {
          maxRetries: options.useMock ? 1 : 2,
          timeoutMs: options.useMock ? 50 : 8_000,
        },
      });

      lastBatchTicks = rolling.ticks.slice(-SOAK_TELEMETRY_COINS.length);
      const batchFailures = lastBatchTicks.filter(
        (t) => !!t.error || !t.soilOk,
      ).length;
      iterationFailures += batchFailures;
    } catch {
      fatalErrors += 1;
      iterationFailures += SOAK_TELEMETRY_COINS.length;
      lastBatchTicks = SOAK_TELEMETRY_COINS.map((coin) => ({
        at: new Date().toISOString(),
        coin,
        latencyMs: performance.now() - tickStarted,
        soilOk: false,
        soilReasons: ["ITERATION_EXCEPTION"],
        crossVenueSlippage: -1,
        spotPerpSlippage: -1,
        counterVerdict: "REJECT",
        counterArmed: false,
        imbalanceRatio: 0,
        liveSlippageBps: Number.POSITIVE_INFINITY,
        dynamicMaxSlUsd: 0,
        error: "ITERATION_EXCEPTION",
      }));
    }

    const heapUsed = process.memoryUsage().heapUsed;
    heapSamples.push(heapUsed);
    logTickMetrics(i, lastBatchTicks, heapUsed, iterationFailures);
  }

  const elapsedMs = performance.now() - started;
  const heapEnd = process.memoryUsage().heapUsed;
  const heapGrowthRatio = (heapEnd - heapStart) / Math.max(heapStart, 1);
  const heapMin = Math.min(...heapSamples);
  const heapMax = Math.max(...heapSamples);
  const heapVarianceRatio = (heapMax - heapMin) / Math.max(heapStart, 1);

  const log = readInMemorySoakLog();
  const recentTicks = log.ticks.slice(-options.iterations * SOAK_TELEMETRY_COINS.length);
  const network = summarizeTicks(recentTicks);

  const summary = {
    event: "SOAK_SUMMARY",
    mode: options.useMock ? "mock" : "live-testnet",
    iterations: options.iterations,
    elapsedMs: Number(elapsedMs.toFixed(2)),
    avgTickMs: Number((elapsedMs / options.iterations).toFixed(3)),
    tickCount: log.tickCount,
    bufferSize: log.ticks.length,
    iterationFailures,
    failureRate: Number(
      (iterationFailures / (options.iterations * SOAK_TELEMETRY_COINS.length)).toFixed(4),
    ),
    fatalErrors,
    network,
    heapStartMb: heapMb(heapStart),
    heapEndMb: heapMb(heapEnd),
    heapGrowthRatio: Number(heapGrowthRatio.toFixed(4)),
    heapVarianceRatio: Number(heapVarianceRatio.toFixed(4)),
    memoryOk:
      heapGrowthRatio <= MAX_HEAP_VARIANCE_RATIO &&
      heapVarianceRatio <= MAX_HEAP_VARIANCE_RATIO,
  };

  console.log(JSON.stringify(summary));

  if (!summary.memoryOk || summary.fatalErrors > 0) {
    process.exitCode = 1;
  }
}

main().catch((err) => {
  console.error("[soak-test] fatal", err);
  process.exitCode = 1;
});
