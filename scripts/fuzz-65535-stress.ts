#!/usr/bin/env tsx
/** Santenmoku v0.9 — 65,535 Property Fuzzer (deterministic mulberry32). */

import {
  checkSoilResistance,
  evaluateGatewayRules,
} from "../src/core/risk-engine";
import { MIN_DEPTH_USD, MAX_SLIPPAGE } from "../src/services/risk-control";
import { DEFAULT_GMX_PENALTY_BPS } from "../src/services/yield/gmx-v2-price-impact";
import {
  ORACLE_LAG_DEADLOCK_MS,
  SAFE_AT,
  muteConsole,
  resetProbes,
  setOracleLag,
} from "./_shared/santenmoku-stress-probes";

const ITERATIONS = 65_535;
const SYMBOL = "ETH";
const BASE = 3500;
const BALANCE = 10_000;

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t = Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const seedFor = (i: number) => ((i + 1) * 0x9e3779b9) >>> 0;

function main(): void {
  const restore = muteConsole();
  const started = Date.now();
  const now = Date.now();
  let crashes = 0;
  let validCases = 0;
  let validCrashes = 0;
  let toxic = 0;
  let toxicBlocked = 0;
  let validBlocked = 0;

  for (let i = 0; i < ITERATIONS; i++) {
    const rng = mulberry32(seedFor(i));
    const oracleLagMs = Math.floor(rng() * 90_000);
    const priceImpactBps = Math.floor(rng() * 250);
    const sequencerDown = rng() > 0.82;
    const payloadPoison = rng() > 0.97;
    const depthUsd = Math.floor(rng() * (MIN_DEPTH_USD * 1.2));
    const slipRatio = rng() * MAX_SLIPPAGE * 2;
    const estimatedLossUsd = Math.floor(rng() * 500);
    const criHardlock = rng() > 0.995;

    const isToxic =
      payloadPoison ||
      criHardlock ||
      oracleLagMs > ORACLE_LAG_DEADLOCK_MS ||
      priceImpactBps > DEFAULT_GMX_PENALTY_BPS ||
      sequencerDown ||
      depthUsd < MIN_DEPTH_USD ||
      slipRatio > MAX_SLIPPAGE ||
      estimatedLossUsd > 200;

    resetProbes(now, sequencerDown);
    setOracleLag(now, oracleLagMs);

    const soil = {
      symbol: SYMBOL,
      hlSpot: BASE,
      hlPerp: BASE,
      dydxPerp: BASE * (1 + slipRatio),
      depthUsd,
      orderSizeUsd: 500,
      accountBalanceUsd: BALANCE,
      at: SAFE_AT,
      gmxPriceImpact: {
        priceImpactPenaltyBps: priceImpactBps,
        priceImpactSubsidiesBps: 0,
        reducesImbalance: false,
      },
    };

    const result = evaluateGatewayRules({
      symbol: SYMBOL,
      payloadPoison,
      criHardlock,
      estimatedLossUsd,
      accountBalanceUsd: BALANCE,
      soil,
    });

    if (result.crashed) {
      crashes += 1;
      if (!isToxic) validCrashes += 1;
    }
    if (isToxic) {
      toxic += 1;
      if (result.blocked) toxicBlocked += 1;
    } else {
      validCases += 1;
      if (result.blocked) validBlocked += 1;
      checkSoilResistance(soil);
    }
  }
  restore();

  const summary = {
    protocol: "Santenmoku v0.9",
    iterations: ITERATIONS,
    crashes,
    validCases,
    validCrashes,
    toxic,
    toxicBlocked,
    toxicInterceptPct: toxic > 0 ? Number(((toxicBlocked / toxic) * 100).toFixed(4)) : 100,
    validBlocked,
    pass: validCrashes === 0 && toxicBlocked === toxic,
    durationMs: Date.now() - started,
  };
  console.log(JSON.stringify(summary, null, 2));
  if (summary.pass !== true) process.exit(1);
}

main();
