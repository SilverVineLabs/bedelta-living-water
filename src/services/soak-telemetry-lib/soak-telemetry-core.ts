/**
 * 24/7 sandbox soak telemetry — Hyperliquid testnet soil + counter-attack ticks.
 * Persists rolling metrics to KV (or in-memory fallback for local soak runs).
 */

import type { Env } from "../../env";
import { buildSystemState, type CoreSystemState } from "../../core/state";
import { checkSoilResistance } from "../../core/risk";
import { ALLOWED_SYMBOLS } from "../../services/risk-control";
import {
  auditLiveBookSoilResistance,
  buildSoilInputFromLiveBook,
  type LiveBookSoilProbe,
} from "../check-soil-resistance";
import {
  computeLiveBookMetrics,
  fetchLiveL2Book,
  type FetchLiveL2BookOptions,
} from "../hyperliquid-adapter";
import { recordSoilViolation, recordSpreadSample } from "../circuit-breaker";
import { recordTelemetryProbe } from "../telemetry-analytics-lib/telemetry-analytics-core";
import { KV_KEYS, saveSoakTelemetryToKV } from "../kv-store";

export const SOAK_TELEMETRY_KV_KEY = KV_KEYS.SOAK_TELEMETRY;
export const SOAK_ROLLING_MAX_TICKS = 1440;
export const SOAK_TELEMETRY_COINS = ALLOWED_SYMBOLS;

export interface SoakTelemetryTick {
  at: string;
  coin: string;
  latencyMs: number;
  soilOk: boolean;
  soilReasons: string[];
  crossVenueSlippage: number;
  spotPerpSlippage: number;
  counterVerdict: string;
  counterArmed: boolean;
  imbalanceRatio: number;
  liveSlippageBps: number;
  dynamicMaxSlUsd: number;
  error?: string;
}

export interface SoakTelemetryRollingLog {
  version: 1;
  lastUpdated: string;
  tickCount: number;
  ticks: SoakTelemetryTick[];
}

export interface RunSoakTelemetryTickOptions {
  kv?: Env["SLIVERVINE_KV"];
  fetchFn?: typeof fetch;
  coins?: readonly string[];
  systemState?: CoreSystemState;
  fetchOptions?: FetchLiveL2BookOptions;
  now?: () => number;
}

let inMemoryRollingLog: SoakTelemetryRollingLog = {
  version: 1,
  lastUpdated: new Date(0).toISOString(),
  tickCount: 0,
  ticks: [],
};

function defaultSystemState(): CoreSystemState {
  return {
    ...buildSystemState({
      accountBalanceUsd: 10_000,
      currentCri: 100,
      skipHardlockAssert: true,
    }),
    isHedgeActive: false,
  };
}

export function createEmptySoakLog(): SoakTelemetryRollingLog {
  return {
    version: 1,
    lastUpdated: new Date(0).toISOString(),
    tickCount: 0,
    ticks: [],
  };
}

export function appendSoakTicks(
  log: SoakTelemetryRollingLog,
  ticks: SoakTelemetryTick[],
  maxTicks = SOAK_ROLLING_MAX_TICKS,
): SoakTelemetryRollingLog {
  const merged = [...log.ticks, ...ticks];
  const trimmed =
    merged.length > maxTicks ? merged.slice(merged.length - maxTicks) : merged;

  return {
    version: 1,
    lastUpdated: ticks.at(-1)?.at ?? new Date().toISOString(),
    tickCount: log.tickCount + ticks.length,
    ticks: trimmed,
  };
}

async function loadRollingLog(kv?: Env["SLIVERVINE_KV"]): Promise<SoakTelemetryRollingLog> {
  if (!kv) return inMemoryRollingLog;

  const raw = await kv.get(SOAK_TELEMETRY_KV_KEY);
  if (!raw) return createEmptySoakLog();

  try {
    return JSON.parse(raw) as SoakTelemetryRollingLog;
  } catch {
    return createEmptySoakLog();
  }
}

async function persistRollingLog(
  log: SoakTelemetryRollingLog,
  kv?: Env["SLIVERVINE_KV"],
): Promise<void> {
  const result = await saveSoakTelemetryToKV(kv, log);
  if (!result.skipped) return;

  inMemoryRollingLog = log;
}

/** Evaluate one coin against live testnet L2 + soil + counter-attack gates. */
export async function evaluateSoakCoinTick(
  coin: string,
  state: CoreSystemState,
  options: RunSoakTelemetryTickOptions = {},
): Promise<SoakTelemetryTick> {
  recordTelemetryProbe();
  const started = (options.now ?? Date.now)();
  const at = new Date(started).toISOString();

  try {
    const snapshot = await fetchLiveL2Book(coin, {
      fetchFn: options.fetchFn,
      maxRetries: options.fetchOptions?.maxRetries ?? 1,
      timeoutMs: options.fetchOptions?.timeoutMs,
    });

    const metrics = computeLiveBookMetrics(snapshot.book);
    if (!metrics) {
      return {
        at,
        coin: coin.toUpperCase(),
        latencyMs: (options.now ?? Date.now)() - started,
        soilOk: false,
        soilReasons: ["EMPTY_L2_BOOK"],
        crossVenueSlippage: -1,
        spotPerpSlippage: -1,
        counterVerdict: "REJECT",
        counterArmed: false,
        imbalanceRatio: 0,
        liveSlippageBps: Number.POSITIVE_INFINITY,
        dynamicMaxSlUsd: state.dynamicMaxSL,
        error: "EMPTY_L2_BOOK",
      };
    }

    const liveProbe: LiveBookSoilProbe = {
      symbol: coin.toUpperCase(),
      bestBid: metrics.bestBid,
      bestAsk: metrics.bestAsk,
      midPx: metrics.midPx,
      bidDepthUsd: metrics.bidDepthUsd,
      askDepthUsd: metrics.askDepthUsd,
      spreadBps: metrics.spreadBps,
      priceImpactBps: metrics.priceImpactBps,
      depthUsd: metrics.depthUsd,
    };

    const soilBase = checkSoilResistance(buildSoilInputFromLiveBook(liveProbe));
    const soilAudit = auditLiveBookSoilResistance(liveProbe);

    recordSpreadSample(metrics.spreadBps / 10_000);
    if (soilAudit.tripped) {
      recordSoilViolation(started);
    }

    const counter = {
      verdict: soilBase.ok && soilAudit.ok ? "STANDBY" : "REJECT",
      armed: false,
      imbalanceRatio: 0,
      liveSlippageBps: metrics.priceImpactBps,
      dynamicMaxSlUsd: state.dynamicMaxSL,
    };

    return {
      at,
      coin: coin.toUpperCase(),
      latencyMs: (options.now ?? Date.now)() - started,
      soilOk: soilBase.ok && soilAudit.ok,
      soilReasons: [...new Set([...soilBase.reasons, ...soilAudit.reasons])],
      crossVenueSlippage: soilBase.crossVenueSlippage,
      spotPerpSlippage: soilBase.spotPerpSlippage,
      counterVerdict: counter.verdict,
      counterArmed: counter.armed,
      imbalanceRatio: counter.imbalanceRatio,
      liveSlippageBps: counter.liveSlippageBps,
      dynamicMaxSlUsd: counter.dynamicMaxSlUsd,
    };
  } catch (err) {
    return {
      at,
      coin: coin.toUpperCase(),
      latencyMs: (options.now ?? Date.now)() - started,
      soilOk: false,
      soilReasons: ["TICK_EXCEPTION"],
      crossVenueSlippage: -1,
      spotPerpSlippage: -1,
      counterVerdict: "REJECT",
      counterArmed: false,
      imbalanceRatio: 0,
      liveSlippageBps: Number.POSITIVE_INFINITY,
      dynamicMaxSlUsd: state.dynamicMaxSL,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

/** Run one 1-minute cron-equivalent soak telemetry tick (ETH/USD). */
export async function runSoakTelemetryTick(
  options: RunSoakTelemetryTickOptions = {},
): Promise<SoakTelemetryRollingLog> {
  const state = options.systemState ?? defaultSystemState();
  const coins = options.coins ?? SOAK_TELEMETRY_COINS;
  const ticks: SoakTelemetryTick[] = [];

  for (const coin of coins) {
    ticks.push(await evaluateSoakCoinTick(coin, state, options));
  }

  const current = await loadRollingLog(options.kv);
  const next = appendSoakTicks(current, ticks);
  await persistRollingLog(next, options.kv);

  console.log(
    JSON.stringify({
      level: "info",
      module: "soak-telemetry",
      event: "SOAK_TICK",
      tickCount: next.tickCount,
      bufferSize: next.ticks.length,
      lastUpdated: next.lastUpdated,
      coins: ticks.map((t) => ({
        coin: t.coin,
        soilOk: t.soilOk,
        counterVerdict: t.counterVerdict,
        latencyMs: t.latencyMs,
        error: t.error ?? null,
      })),
    }),
  );

  return next;
}

/** @internal Test hook */
export function __resetSoakTelemetryForTests(): void {
  inMemoryRollingLog = createEmptySoakLog();
}

/** Read in-memory rolling log (local soak harness). */
export function readInMemorySoakLog(): SoakTelemetryRollingLog {
  return inMemoryRollingLog;
}
