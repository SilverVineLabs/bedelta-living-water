#!/usr/bin/env tsx
/**
 * 96-hour Live Network Telemetry Daemon — Triangle Topology RTT / jitter (non-blocking).
 *
 * Usage:
 *   pnpm telemetry:96h
 *   pnpm telemetry:96h -- --once
 *   pnpm telemetry:96h -- --interval 30 --duration-hours 96
 */

import { readFileSync } from "node:fs";
import { mkdir, rename, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { performance } from "node:perf_hooks";
import { fileURLToPath } from "node:url";
import {
  HL_L2_STALE_THRESHOLD_MS,
  HL_TESTNET_INFO_URL,
  PGATE_MAX_LATENCY_MS,
} from "../src/config/constants";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT_PATH = join(ROOT, "docs/audit/live-96h-telemetry.json");
const FETCH_TIMEOUT_MS = 5_000;
const DEFAULT_INTERVAL_SEC = 30;
const DEFAULT_DURATION_HOURS = 96;
/** 96h @ 30s × 3 venues ≈ 34,560 samples (~3 MB JSON). No truncation — full stream retained. */
const SCHEMA = "silvervine.live-96h-telemetry.v1" as const;

export type TelemetryStatus = "OK" | "Degraded" | "Trip";
export type TelemetryVenue =
  | "arbitrum-sepolia"
  | "hyperliquid-testnet"
  | "robinhood-worker";

export interface TelemetrySample {
  timestamp: string;
  venue: TelemetryVenue;
  rttMs: number | null;
  jitterMs: number | null;
  status: TelemetryStatus;
  detail?: string;
}

export interface Live96hTelemetryDoc {
  schema: typeof SCHEMA;
  startedAt: string;
  lastUpdatedAt: string;
  daemonEndsAt: string;
  intervalSec: number;
  durationHours: number;
  snapshot: Partial<Record<TelemetryVenue, TelemetrySample>>;
  recentSamples: TelemetrySample[];
  totals: { probes: number; ok: number; degraded: number; trip: number };
}

const lastRttByVenue = new Map<TelemetryVenue, number>();

export function classifyTelemetryStatus(
  rttMs: number | null,
  jitterMs: number | null,
  tripThresholdMs: number,
): TelemetryStatus {
  if (rttMs === null || !Number.isFinite(rttMs)) return "Trip";
  if (rttMs > tripThresholdMs) return "Trip";
  const degradedFloor = Math.round(tripThresholdMs * 0.7);
  if (rttMs > degradedFloor) return "Degraded";
  if (jitterMs !== null && jitterMs > Math.round(tripThresholdMs * 0.5)) return "Degraded";
  return "OK";
}

export function computeJitterMs(venue: TelemetryVenue, rttMs: number | null): number | null {
  if (rttMs === null || !Number.isFinite(rttMs)) return null;
  const prev = lastRttByVenue.get(venue);
  lastRttByVenue.set(venue, rttMs);
  return prev === undefined ? 0 : Math.abs(rttMs - prev);
}

async function fetchJson(
  url: string,
  init: RequestInit,
): Promise<{ rttMs: number; json: unknown }> {
  const t0 = performance.now();
  const res = await fetch(url, {
    ...init,
    cache: "no-store",
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
  });
  const rttMs = Math.round(performance.now() - t0);
  if (!res.ok) throw new Error(`HTTP_${res.status}`);
  return { rttMs, json: await res.json() };
}

async function probeArbitrumSepolia(): Promise<TelemetrySample> {
  const venue: TelemetryVenue = "arbitrum-sepolia";
  const url =
    process.env.ARB_SEPOLIA_RPC_URL?.trim() ||
    "https://sepolia-rollup.arbitrum.io/rpc";
  const ts = new Date().toISOString();
  try {
    const { rttMs, json } = await fetchJson(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: "live96h",
        method: "eth_blockNumber",
        params: [],
      }),
    });
    const block = (json as { result?: string }).result ?? "unknown";
    const jitterMs = computeJitterMs(venue, rttMs);
    return {
      timestamp: ts,
      venue,
      rttMs,
      jitterMs,
      status: classifyTelemetryStatus(rttMs, jitterMs, PGATE_MAX_LATENCY_MS),
      detail: `eth_blockNumber=${block}`,
    };
  } catch (err) {
    const jitterMs = computeJitterMs(venue, null);
    return {
      timestamp: ts,
      venue,
      rttMs: null,
      jitterMs,
      status: "Trip",
      detail: err instanceof Error ? err.message : "fetch_failed",
    };
  }
}

function hlSpreadBps(book: {
  levels?: Array<Array<{ px?: string }>>;
}): number | null {
  const bid = Number(book.levels?.[0]?.[0]?.px);
  const ask = Number(book.levels?.[1]?.[0]?.px);
  if (!Number.isFinite(bid) || !Number.isFinite(ask) || bid <= 0 || ask <= bid) return null;
  const mid = (bid + ask) / 2;
  return Math.round(((ask - bid) / mid) * 10_000 * 100) / 100;
}

async function probeHyperliquidTestnet(): Promise<TelemetrySample> {
  const venue: TelemetryVenue = "hyperliquid-testnet";
  const ts = new Date().toISOString();
  try {
    const t0 = performance.now();
    const metaRes = await fetch(HL_TESTNET_INFO_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "meta" }),
      cache: "no-store",
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });
    if (!metaRes.ok) throw new Error(`meta_HTTP_${metaRes.status}`);
    await metaRes.json();

    const bookRes = await fetch(HL_TESTNET_INFO_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "l2Book", coin: "ETH" }),
      cache: "no-store",
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });
    if (!bookRes.ok) throw new Error(`l2Book_HTTP_${bookRes.status}`);
    const book = (await bookRes.json()) as { levels?: Array<Array<{ px?: string }>> };
    const rttMs = Math.round(performance.now() - t0);
    const spreadBps = hlSpreadBps(book);
    const jitterMs = computeJitterMs(venue, rttMs);
    return {
      timestamp: ts,
      venue,
      rttMs,
      jitterMs,
      status: classifyTelemetryStatus(rttMs, jitterMs, HL_L2_STALE_THRESHOLD_MS),
      detail:
        spreadBps === null
          ? "meta+l2Book ETH"
          : `meta+l2Book ETH spreadBps=${spreadBps}`,
    };
  } catch (err) {
    const jitterMs = computeJitterMs(venue, null);
    return {
      timestamp: ts,
      venue,
      rttMs: null,
      jitterMs,
      status: "Trip",
      detail: err instanceof Error ? err.message : "fetch_failed",
    };
  }
}

async function probeRobinhoodWorker(): Promise<TelemetrySample> {
  const venue: TelemetryVenue = "robinhood-worker";
  const ts = new Date().toISOString();
  const workerUrl =
    process.env.LOCAL_WORKER_TELEMETRY_URL?.trim() ||
    process.env.TELEMETRY_UPSTREAM?.trim() ||
    "https://bedeltawater.slivervine.xyz/api/telemetry/health";
  const rhRpc = process.env.ROBINHOOD_TESTNET_RPC_URL?.trim();
  try {
    const t0 = performance.now();
    const workerRes = await fetch(workerUrl, {
      cache: "no-store",
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });
    if (!workerRes.ok) throw new Error(`worker_HTTP_${workerRes.status}`);
    await workerRes.json().catch(() => null);

    let rhDetail = "";
    if (rhRpc) {
      try {
        const rh = await fetchJson(rhRpc, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            jsonrpc: "2.0",
            id: "rh96h",
            method: "eth_blockNumber",
            params: [],
          }),
        });
        rhDetail = ` · robinhoodRpcRttMs=${rh.rttMs}`;
      } catch {
        rhDetail = " · robinhoodRpc=Trip";
      }
    }

    const rttMs = Math.round(performance.now() - t0);
    const jitterMs = computeJitterMs(venue, rttMs);
    return {
      timestamp: ts,
      venue,
      rttMs,
      jitterMs,
      status: classifyTelemetryStatus(rttMs, jitterMs, HL_L2_STALE_THRESHOLD_MS),
      detail: `worker=${workerUrl}${rhDetail}`,
    };
  } catch (err) {
    const jitterMs = computeJitterMs(venue, null);
    return {
      timestamp: ts,
      venue,
      rttMs: null,
      jitterMs,
      status: "Trip",
      detail: err instanceof Error ? err.message : "fetch_failed",
    };
  }
}

function loadDoc(
  startedAt: string,
  daemonEndsAt: string,
  intervalSec: number,
  durationHours: number,
): Live96hTelemetryDoc {
  try {
    const raw = readFileSync(OUT_PATH, "utf8");
    const parsed = JSON.parse(raw) as Live96hTelemetryDoc;
    if (parsed.schema === SCHEMA) return parsed;
  } catch {
    /* auto-create */
  }
  return {
    schema: SCHEMA,
    startedAt,
    lastUpdatedAt: startedAt,
    daemonEndsAt,
    intervalSec,
    durationHours,
    snapshot: {},
    recentSamples: [],
    totals: { probes: 0, ok: 0, degraded: 0, trip: 0 },
  };
}

export function mergeSamples(
  doc: Live96hTelemetryDoc,
  samples: TelemetrySample[],
): Live96hTelemetryDoc {
  const now = new Date().toISOString();
  for (const s of samples) {
    doc.snapshot[s.venue] = s;
    doc.recentSamples.push(s);
    doc.totals.probes += 1;
    if (s.status === "OK") doc.totals.ok += 1;
    else if (s.status === "Degraded") doc.totals.degraded += 1;
    else doc.totals.trip += 1;
  }
  doc.lastUpdatedAt = now;
  return doc;
}

let persistChain: Promise<void> = Promise.resolve();

async function persistDocAsync(payload: string): Promise<void> {
  await mkdir(dirname(OUT_PATH), { recursive: true });
  const tmp = `${OUT_PATH}.tmp`;
  await writeFile(tmp, payload, "utf8");
  await rename(tmp, OUT_PATH);
}

/** Non-blocking chained write — snapshots JSON at enqueue time. */
export function persistDoc(doc: Live96hTelemetryDoc): void {
  const payload = `${JSON.stringify(doc, null, 2)}\n`;
  persistChain = persistChain
    .then(() => persistDocAsync(payload))
    .catch((err) => {
      console.error(
        "[telemetry:96h] persist error (fail-safe):",
        err instanceof Error ? err.message : err,
      );
    });
}

export async function flushPersistDoc(): Promise<void> {
  await persistChain;
}

export async function runTelemetryTick(): Promise<TelemetrySample[]> {
  return Promise.all([
    probeArbitrumSepolia(),
    probeHyperliquidTestnet(),
    probeRobinhoodWorker(),
  ]);
}

function parseArgs(argv: string[]) {
  const once = argv.includes("--once");
  const intervalFlag = argv.indexOf("--interval");
  const durationFlag = argv.indexOf("--duration-hours");
  const intervalSec =
    intervalFlag >= 0 ? Number(argv[intervalFlag + 1]) : DEFAULT_INTERVAL_SEC;
  const durationHours =
    durationFlag >= 0 ? Number(argv[durationFlag + 1]) : DEFAULT_DURATION_HOURS;
  return {
    once,
    intervalSec:
      Number.isFinite(intervalSec) && intervalSec > 0
        ? Math.floor(intervalSec)
        : DEFAULT_INTERVAL_SEC,
    durationHours:
      Number.isFinite(durationHours) && durationHours > 0
        ? durationHours
        : DEFAULT_DURATION_HOURS,
  };
}

async function main(): Promise<void> {
  const { once, intervalSec, durationHours } = parseArgs(process.argv.slice(2));
  const startedAt = new Date().toISOString();
  const endsAtMs = Date.now() + durationHours * 3_600_000;
  const daemonEndsAt = new Date(endsAtMs).toISOString();
  let doc = loadDoc(startedAt, daemonEndsAt, intervalSec, durationHours);

  const tick = async () => {
    try {
      const samples = await runTelemetryTick();
      doc = mergeSamples(doc, samples);
      persistDoc(doc);
      const line = samples
        .map((s) => `${s.venue} rtt=${s.rttMs ?? "null"}ms jitter=${s.jitterMs ?? "null"}ms ${s.status}`)
        .join(" | ");
      console.log(`[telemetry:96h] ${doc.lastUpdatedAt} ${line}`);
    } catch (err) {
      console.error(
        "[telemetry:96h] tick error (fail-safe):",
        err instanceof Error ? err.message : err,
      );
    }
  };

  await tick();
  if (once) return;

  console.log(
    `[telemetry:96h] daemon started interval=${intervalSec}s duration=${durationHours}h → ${OUT_PATH}`,
  );

  const timer = setInterval(() => {
    if (Date.now() >= endsAtMs) {
      clearInterval(timer);
      console.log("[telemetry:96h] 96h window complete — exiting");
      return;
    }
    void tick();
  }, intervalSec * 1000);

  const shutdown = () => {
    clearInterval(timer);
    persistDoc(doc);
    void flushPersistDoc().then(() => {
      console.log("[telemetry:96h] shutdown — snapshot flushed");
      process.exit(0);
    });
  };
  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

const isMain = process.argv[1]?.includes("live-96h-telemetry-daemon");
if (isMain) {
  main().catch((err) => {
    console.error("[telemetry:96h] fatal:", err instanceof Error ? err.message : err);
    process.exit(1);
  });
}
