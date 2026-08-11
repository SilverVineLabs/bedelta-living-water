#!/usr/bin/env tsx
/** Santenmoku v0.9 — Blackswan Chaos Matrix (Groups A–K). */

import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  evaluateGatewayRules,
  type GatewayRulesResult,
} from "../src/core/risk-engine";
import {
  __resetSequencerGuardCacheForTests,
  __setSequencerProbeForTests,
} from "../src/services/risk/sequencer-guard";
import { MIN_DEPTH_USD, MAX_SLIPPAGE } from "../src/services/risk-control";
import {
  DEFAULT_GMX_PENALTY_BPS,
} from "../src/services/yield/gmx-v2-price-impact";
import { buildGroupKCases } from "./_shared/chaos-group-k";
import {
  ORACLE_LAG_DEADLOCK_MS,
  SAFE_AT,
  muteConsole,
  resetProbes,
  setOracleLag,
} from "./_shared/santenmoku-stress-probes";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const METRICS_PATH = join(ROOT, "docs/audit/chaos-blackswan-metrics.json");
const SYMBOL = "ETH";
const BALANCE = 10_000;
const BASE = 3500;
type GroupId = "A" | "B" | "C" | "D" | "E" | "F" | "G" | "H" | "I" | "J" | "K";
const GROUPS: GroupId[] = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K"];

interface ChaosCase {
  group: GroupId;
  expectTrip: boolean;
  setup: (now: number) => void;
  run: () => GatewayRulesResult;
}

const soil = (depthUsd = MIN_DEPTH_USD, dydx = BASE, bps?: number) => ({
  symbol: SYMBOL,
  hlSpot: BASE,
  hlPerp: BASE,
  dydxPerp: dydx,
  depthUsd,
  orderSizeUsd: 500,
  accountBalanceUsd: BALANCE,
  at: SAFE_AT,
  ...(bps !== undefined
    ? {
        gmxPriceImpact: {
          priceImpactPenaltyBps: bps,
          priceImpactSubsidiesBps: 0,
          reducesImbalance: false,
        },
      }
    : {}),
});

function buildMatrix(): ChaosCase[] {
  const cases: ChaosCase[] = [];
  const push = (c: ChaosCase) => cases.push(c);

  for (let i = 0; i < 26; i++) {
    const lag = i === 0 ? 95 : 28_000 + i * 1_200;
    push({
      group: "A",
      expectTrip: lag > ORACLE_LAG_DEADLOCK_MS,
      setup: (n) => {
        resetProbes(n);
        setOracleLag(n, lag);
      },
      run: () => evaluateGatewayRules({ symbol: SYMBOL, soil: soil() }),
    });
  }

  for (let i = 0; i < 26; i++) {
    const bps = i === 0 ? 30 : 51 + i * 6;
    push({
      group: "B",
      expectTrip: bps > DEFAULT_GMX_PENALTY_BPS,
      setup: (n) => resetProbes(n),
      run: () => evaluateGatewayRules({ symbol: SYMBOL, soil: soil(MIN_DEPTH_USD, BASE, bps) }),
    });
  }

  const seqModes = [
    { answer: 1, safe: false, reason: "ARBITRUM_SEQUENCER_DOWN" },
    { answer: 0, safe: false, reason: "ARBITRUM_SEQUENCER_GRACE:300s<600s" },
    null,
  ] as const;
  for (let i = 0; i < 26; i++) {
    const mode = seqModes[i % 3];
    push({
      group: "C",
      expectTrip: true,
      setup: (n) => {
        resetProbes(n);
        const sec = Math.floor(n / 1000);
        if (mode === null) return __resetSequencerGuardCacheForTests();
        __setSequencerProbeForTests({
          answer: mode.answer,
          startedAtSec: mode.answer === 0 ? sec - 300 : sec - 900,
          updatedAtSec: sec,
          fetchedAtMs: n,
          safe: mode.safe,
          reason: mode.reason,
        });
      },
      run: () => evaluateGatewayRules({ symbol: SYMBOL, soil: soil() }),
    });
  }

  for (let i = 0; i < 26; i++) {
    const depth = i === 25 ? MIN_DEPTH_USD : Math.max(0, MIN_DEPTH_USD - i * 4_500);
    push({
      group: "D",
      expectTrip: depth < MIN_DEPTH_USD,
      setup: (n) => resetProbes(n),
      run: () => evaluateGatewayRules({ symbol: SYMBOL, soil: soil(depth) }),
    });
  }

  const comboGroups: GroupId[] = ["E", "F", "G", "H", "I", "J"];
  let comboIdx = 0;
  for (let g = 0; g < comboGroups.length; g++) {
    for (let j = 0; j < (g === 0 ? 26 : 25); j++) {
      const i = comboIdx++;
      const lag = 5_000 + (i % 17) * 2_000;
      const bps = 20 + (i % 13) * 8;
      const depth = MIN_DEPTH_USD - (i % 9) * 12_000;
      const slip = MAX_SLIPPAGE * (1 + (i % 5) * 0.25);
      const loss = 50 + (i % 20) * 25;
      const cri = i % 11 === 0;
      const poison = i % 13 === 0;
      push({
        group: comboGroups[g]!,
        expectTrip:
          poison ||
          cri ||
          lag > ORACLE_LAG_DEADLOCK_MS ||
          bps > DEFAULT_GMX_PENALTY_BPS ||
          depth < MIN_DEPTH_USD ||
          slip > MAX_SLIPPAGE ||
          loss > 200,
        setup: (n) => {
          resetProbes(n);
          setOracleLag(n, lag);
        },
        run: () =>
          evaluateGatewayRules({
            symbol: SYMBOL,
            payloadPoison: poison,
            criHardlock: cri,
            estimatedLossUsd: loss,
            accountBalanceUsd: BALANCE,
            soil: soil(Math.max(0, depth), BASE * (1 + slip), bps),
          }),
      });
    }
  }

  for (const k of buildGroupKCases(SYMBOL, () => soil())) cases.push(k);

  return cases;
}

function main(): void {
  const restore = muteConsole();
  const started = Date.now();
  const now = Date.now();
  const matrix = buildMatrix();
  const groupStats: Record<string, { total: number; trips: number; crashes: number; mismatches: number }> = {};
  for (const g of GROUPS) groupStats[g] = { total: 0, trips: 0, crashes: 0, mismatches: 0 };

  let crashes = 0;
  let failClosedTrips = 0;
  let mismatches = 0;
  for (const c of matrix) {
    c.setup(now);
    const result = c.run();
    const gs = groupStats[c.group]!;
    gs.total += 1;
    if (result.tripped) gs.trips += 1;
    if (result.crashed) {
      crashes += 1;
      gs.crashes += 1;
    }
    if (result.failClosed && result.tripped) failClosedTrips += 1;
    if (result.tripped !== c.expectTrip) {
      mismatches += 1;
      gs.mismatches += 1;
    }
  }
  restore();

  const metrics = {
    protocol: "Santenmoku v0.9",
    matrix: "Blackswan Chaos A–K",
    totalCases: matrix.length,
    crashes,
    failClosedTrips,
    mismatches,
    pass: mismatches === 0 && crashes === 0,
    groups: groupStats,
    durationMs: Date.now() - started,
    generatedAt: new Date().toISOString(),
  };
  mkdirSync(dirname(METRICS_PATH), { recursive: true });
  writeFileSync(METRICS_PATH, `${JSON.stringify(metrics, null, 2)}\n`);
  console.log(JSON.stringify(metrics, null, 2));
  if (mismatches > 0 || crashes > 0) process.exit(1);
}

main();
