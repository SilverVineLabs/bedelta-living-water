/**
 * Mock analytics pipeline — CRI · R17/R20 breakers · PnL · session-key latency.
 */

import { HEALTH_CRI_MAX, HEALTH_CRI_MIN } from "../config/constants";
import { applyTieredRootPenalty } from "../services/criEngine";
import { computeEffectiveMaxSlUsd } from "../services/effective-max-sl";

export interface MockCriSample {
  timestamp: number;
  cri: number;
}

export interface MockBreakerEvent {
  timestamp: number;
  target: "R17" | "R20";
  tripped: boolean;
  reason: string;
}

export interface MockPnLSample {
  timestamp: number;
  equityUsd: number;
  unrealizedPnlUsd: number;
  cumulativePnlUsd: number;
}

export interface MockSessionKeyLatencySample {
  timestamp: number;
  latencyMs: number;
  sessionKeyWarning: boolean;
}

export interface MockAnalyticsSnapshot {
  generatedAt: string;
  accountBalanceUsd: number;
  dynamicMaxSlUsd: number;
  criHistory: MockCriSample[];
  breakerEvents: MockBreakerEvent[];
  pnlCurve: MockPnLSample[];
  sessionKeyLatency: MockSessionKeyLatencySample[];
}

export interface MockAnalyticsConfig {
  accountBalanceUsd?: number;
  sampleCount?: number;
  startTimestamp?: number;
  intervalMs?: number;
  seed?: number;
}

function rng(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s * 1_664_525 + 1_013_904_223) >>> 0;
    return s / 0x1_0000_0000;
  };
}

/** Generate UI-ready dynamic state history for demo / dashboard mocks. */
export function generateMockAnalytics(
  config: MockAnalyticsConfig = {},
): MockAnalyticsSnapshot {
  const balance = config.accountBalanceUsd ?? 10_000;
  const count = config.sampleCount ?? 120;
  const start = config.startTimestamp ?? Date.parse("2026-05-12T00:00:00.000Z");
  const interval = config.intervalMs ?? 60_000;
  const rand = rng(config.seed ?? 0x5110_0001);

  const dynamicMaxSlUsd = computeEffectiveMaxSlUsd(balance);
  let cri = HEALTH_CRI_MAX;
  let equity = balance;
  let cumulativePnl = 0;

  const criHistory: MockCriSample[] = [];
  const breakerEvents: MockBreakerEvent[] = [];
  const pnlCurve: MockPnLSample[] = [];
  const sessionKeyLatency: MockSessionKeyLatencySample[] = [];

  for (let i = 0; i < count; i += 1) {
    const ts = start + i * interval;
    const shock = rand() > 0.93;

    if (shock) {
      cri = applyTieredRootPenalty(cri, rand() > 0.85 ? 3 : 2);
      if (rand() > 0.7) {
        breakerEvents.push({
          timestamp: ts,
          target: cri <= 25 ? "R20" : "R17",
          tripped: true,
          reason: cri <= HEALTH_CRI_MIN ? "R20_HARDLOCK" : "ROOT17_DAILY_LIMIT",
        });
      }
    } else if (rand() > 0.6) {
      cri = Math.min(HEALTH_CRI_MAX, cri + 2);
    }

    const unrealized = (rand() - 0.52) * dynamicMaxSlUsd * 0.8;
    const realizedTick = shock ? -(rand() * dynamicMaxSlUsd * 0.25) : rand() * 15;
    cumulativePnl += realizedTick;
    equity = Math.max(balance * 0.7, balance + cumulativePnl + unrealized * 0.2);

    criHistory.push({ timestamp: ts, cri });
    pnlCurve.push({
      timestamp: ts,
      equityUsd: equity,
      unrealizedPnlUsd: unrealized,
      cumulativePnlUsd: cumulativePnl,
    });

    const latencyMs = 8 + rand() * 42 + (shock ? rand() * 80 : 0);
    sessionKeyLatency.push({
      timestamp: ts,
      latencyMs,
      sessionKeyWarning: latencyMs > 35 || rand() > 0.97,
    });
  }

  return {
    generatedAt: new Date(start + count * interval).toISOString(),
    accountBalanceUsd: balance,
    dynamicMaxSlUsd,
    criHistory,
    breakerEvents,
    pnlCurve,
    sessionKeyLatency,
  };
}
