#!/usr/bin/env tsx
/**
 * BeDelta / SliverVine chaos harness — 255-case black-swan & fail-closed matrix.
 *
 * Usage: npx tsx scripts/chaos-blackswan-stress.ts
 */

import { spawnSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { resolveAuditArtifactBinding } from "./audit-artifact-bindings";
import { evaluateBlackSwanRisk } from "../src/core/black-swan-guard";
import { SESSION_KEY_CLIP_USD } from "../src/services/risk/session-audit";
import {
  HardlockError,
  RiskLimitExceeded,
  checkSoilResistance,
  vineWrapProtection,
} from "../src/services/risk-control";
import { checkRoot17DailyLimit } from "../src/services/root17-daily";
import {
  __resetArbitrumGasGuardForTests,
  __setArbitrumGasGuardForTests,
  evaluateGasSurcharge,
  evaluateOracleLag,
  ORACLE_LAG_DEADLOCK_MS,
} from "../src/services/risk/arbitrum-gas-guard";
import {
  __resetSequencerGuardCacheForTests,
  __setSequencerProbeForTests,
  evaluateSequencerProbe,
  SEQUENCER_GRACE_SEC,
} from "../src/services/risk/sequencer-guard";
import {
  __setSoftConfirmationProbeForTests,
  evaluateSoftConfirmationDrift,
  SOFT_CONFIRMATION_DRIFT_MAX_BLOCKS,
} from "../src/services/risk/soft-confirmation-guard";
import {
  evaluateGmxPriceImpactSoilGate,
  type GmxV2PriceImpactSoilInput,
} from "../src/services/yield/gmx-v2-price-impact";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const EVAL_AT = new Date("2026-07-25T06:00:00.000Z");
const EVAL_MS = EVAL_AT.getTime();
const EVAL_SEC = Math.floor(EVAL_MS / 1000);

export const CHAOS_ATTACK_COUNT = 255;
export const ORACLE_LAG_SPIKE_MS = 31_000;
export const PRICE_IMPACT_TOXIC_BPS = 55;
export const SEQUENCER_DOWN_ANSWER = 0;
export const CHAOS_METRICS_PATH = join(ROOT, "docs/audit/chaos-blackswan-metrics.json");
export const BME_CHAOS_AUDIT_LINE =
  "[BeDelta-Living-Water- SLI\\verVine CHAOS AUDIT] 255 / 255 Simulated Toxic Attacks Blocked (100% Fail-Closed, 0 Capital Loss)";

export type ChaosGroup = "A" | "B" | "C" | "D" | "E" | "F" | "G" | "H" | "I" | "J";
export type ChaosScenarioId =
  | "oracle_lag_spike"
  | "price_impact_toxicity"
  | "sequencer_down"
  | "malformed_telemetry"
  | ChaosGroup;

export interface ChaosAttackResult {
  scenario: ChaosScenarioId;
  id?: number;
  blocked: boolean;
  trigger: string;
  capitalLossUsd: number;
  crashed: boolean;
  reasons: string[];
  expectedReasonPrefix?: string;
  reasonPrefixMatched?: boolean;
}

export interface ChaosAuditReport {
  blocked: number;
  total: number;
  crashed: number;
  prefixMismatches: number;
  capitalLossUsd: number;
  line: string;
  pass: boolean;
  byScenario: Record<ChaosScenarioId, { blocked: number; total: number; crashed: number }>;
  timestamp: string;
}

export interface GatewayRuleInput {
  oracleUpdatedAtMs?: number;
  l2BlockTimestampMs?: number;
  sequencerAnswer?: number;
  sequencerElapsedSec?: number;
  gmxPenaltyBps?: number;
  depthUsd?: number;
  hlSpot?: number;
  hlPerp?: number;
  dydxPerp?: number;
  l1SurchargeUsd?: number;
  targetYieldUsd?: number;
  estimatedLossUsd?: number;
  accountBalanceUsd?: number;
  criHardlock?: boolean;
  dailyLossUsd?: number;
  dailySlCount?: number;
  orderSizeUsd?: number;
  sagaRetries?: number;
  payload?: string;
  payloadBytes?: number;
  blackSwanSlippage?: number;
  usdcUsd?: number;
  protocolPaused?: boolean;
  driftBlocks?: number;
  timeboostDelayMs?: number;
  skipArm?: boolean;
}

const HEALTHY_SOIL = {
  symbol: "ETH",
  hlSpot: 3500,
  hlPerp: 3500,
  dydxPerp: 3500,
  depthUsd: 200_000,
  at: EVAL_AT,
} as const;

const ILLIQUID_ORDER_IMPACT: GmxV2PriceImpactSoilInput = {
  priceImpactPenaltyBps: PRICE_IMPACT_TOXIC_BPS,
  priceImpactSubsidiesBps: 0,
  reducesImbalance: false,
};

const MALFORMED_PAYLOADS = [
  "{",
  "not-json",
  "\u0000{\"broken\"",
  '{"hlSpot":NaN}',
  "null",
  '{"centroids_vector":null,"reynolds_number":"x"}',
  '{"__proto__":{"polluted":true}}',
  "[",
] as const;

const GROUPS: ChaosGroup[] = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J"];

function armPassThroughGates(): void {
  __resetArbitrumGasGuardForTests();
  __setSequencerProbeForTests({
    answer: 0,
    startedAtSec: EVAL_SEC - SEQUENCER_GRACE_SEC - 1,
    updatedAtSec: EVAL_SEC,
    fetchedAtMs: EVAL_MS,
    safe: true,
    reason: null,
  });
  __setSoftConfirmationProbeForTests({
    l2LatestBlock: 1_000_020,
    l1FinalizedBatchBlock: 1_000_000,
    driftBlocks: 20,
    fetchedAtMs: EVAL_MS,
    safe: true,
    reason: null,
  });
}

function resetGates(): void {
  __resetArbitrumGasGuardForTests();
  __resetSequencerGuardCacheForTests();
  __setSoftConfirmationProbeForTests(null);
}

function blockedResult(
  scenario: ChaosScenarioId,
  trigger: string,
  reasons: string[],
  blocked: boolean,
  id?: number,
  meta?: Pick<ChaosAttackResult, "expectedReasonPrefix" | "reasonPrefixMatched" | "crashed">,
): ChaosAttackResult {
  return {
    scenario,
    id,
    blocked,
    trigger,
    capitalLossUsd: blocked ? 0 : 1,
    crashed: meta?.crashed ?? false,
    reasons,
    expectedReasonPrefix: meta?.expectedReasonPrefix,
    reasonPrefixMatched: meta?.reasonPrefixMatched,
  };
}

const HANDLED_FAIL_CLOSED_ERROR_MARKERS = [
  "FAIL_CLOSED",
  "DEADLOCK",
  "TRIP",
  "SOIL",
  "UNSAFE",
] as const;

function isHandledFailClosedError(err: unknown): boolean {
  if (err instanceof HardlockError || err instanceof RiskLimitExceeded) return true;
  if (err instanceof SyntaxError) return true;
  const msg = err instanceof Error ? err.message : String(err);
  return HANDLED_FAIL_CLOSED_ERROR_MARKERS.some((marker) => msg.includes(marker));
}

function classifyGatewayIsolateError(err: unknown): {
  failClosed: boolean;
  reasons: string[];
  crashed: boolean;
} {
  if (err instanceof HardlockError) {
    return { failClosed: true, reasons: ["R20_PHYSICAL_DEADLOCK"], crashed: false };
  }
  if (err instanceof RiskLimitExceeded) {
    return { failClosed: true, reasons: ["ROOT_PROTECTION_TRIP"], crashed: false };
  }
  if (isHandledFailClosedError(err)) {
    const msg = err instanceof Error ? err.message : String(err);
    return { failClosed: true, reasons: [msg], crashed: false };
  }
  return { failClosed: true, reasons: ["ISOLATE_CRASH_FAIL_CLOSED"], crashed: true };
}

function setOracleGuard(lag: ReturnType<typeof evaluateOracleLag>): void {
  __setArbitrumGasGuardForTests({
    l1BaseFeeWei: 1n,
    l1SurchargeWei: 1n,
    l1SurchargeUsd: 0.001,
    targetYieldUsd: 0.1,
    gasYieldRatio: 0.01,
    gasBlocked: false,
    oracleUpdatedAtMs: EVAL_MS - lag.lagMs,
    l2BlockTimestampMs: EVAL_MS,
    oracleLagMs: lag.lagMs,
    oracleLagDeadlock: lag.deadlock,
    reason: lag.reason,
    fetchedAtMs: EVAL_MS,
  });
}

function setGasGuard(reason: string, ratio: number): void {
  __setArbitrumGasGuardForTests({
    l1BaseFeeWei: 1n,
    l1SurchargeWei: 1n,
    l1SurchargeUsd: 1,
    targetYieldUsd: 0.01,
    gasYieldRatio: ratio,
    gasBlocked: true,
    oracleUpdatedAtMs: EVAL_MS,
    l2BlockTimestampMs: EVAL_MS,
    oracleLagMs: 0,
    oracleLagDeadlock: false,
    reason,
    fetchedAtMs: EVAL_MS,
  });
}

/** Gateway composition — soil + oracle/sequencer/gas + root/R17 + payload validation. */
export function evaluateGatewayRules(input: GatewayRuleInput): {
  failClosed: boolean;
  reasons: string[];
  crashed: boolean;
} {
  const reasons: string[] = [];
  try {
    if (input.skipArm) {
      resetGates();
    } else {
      armPassThroughGates();
    }

    if ((input.payloadBytes ?? 0) > 1_000_000) {
      reasons.push("PAYLOAD_INFLATION_FAIL_CLOSED");
    }
    if (input.payload !== undefined) {
      try {
        const parsed = JSON.parse(input.payload) as unknown;
        try {
          checkSoilResistance(parsed as typeof HEALTHY_SOIL);
        } catch {
          reasons.push("SOIL_EVAL_FAIL_CLOSED");
        }
        reasons.push("UNTRUSTED_TELEMETRY_FAIL_CLOSED");
      } catch {
        reasons.push("MALFORMED_JSON_FAIL_CLOSED");
      }
    }

    const oracleAt = input.oracleUpdatedAtMs;
    const l2At = input.l2BlockTimestampMs;
    if (oracleAt !== undefined || l2At !== undefined) {
      const oracle = oracleAt ?? EVAL_MS;
      const l2 = l2At ?? EVAL_MS;
      if (oracle <= 0 || l2 <= 0) {
        reasons.push("ORACLE_TIMESTAMP_STALE_FAIL_CLOSED");
      } else {
        const lag = evaluateOracleLag(oracle, l2);
        if (lag.deadlock) {
          setOracleGuard(lag);
          if (lag.reason) reasons.push(lag.reason);
        }
      }
    }

    if (input.sequencerAnswer !== undefined || input.sequencerElapsedSec !== undefined) {
      const answer = input.sequencerAnswer ?? 0;
      const elapsed = input.sequencerElapsedSec ?? 1;
      const startedAtSec = EVAL_SEC - elapsed;
      const probe = evaluateSequencerProbe(answer, startedAtSec, EVAL_SEC);
      __setSequencerProbeForTests({
        answer,
        startedAtSec,
        updatedAtSec: EVAL_SEC,
        fetchedAtMs: EVAL_MS,
        safe: probe.safe,
        reason: probe.reason,
      });
      if (!probe.safe && probe.reason) reasons.push(probe.reason);
    }

    if (input.l1SurchargeUsd !== undefined) {
      const target = input.targetYieldUsd ?? 0.1;
      const gas = evaluateGasSurcharge(input.l1SurchargeUsd, target);
      if (gas.blocked && gas.reason) {
        setGasGuard(gas.reason, gas.ratio);
        reasons.push(gas.reason);
      }
    }

    if (input.driftBlocks !== undefined) {
      const drift = evaluateSoftConfirmationDrift(
        1_000_000 + input.driftBlocks,
        1_000_000,
      );
      __setSoftConfirmationProbeForTests({
        l2LatestBlock: 1_000_000 + input.driftBlocks,
        l1FinalizedBatchBlock: 1_000_000,
        driftBlocks: drift.driftBlocks,
        fetchedAtMs: EVAL_MS,
        safe: drift.safe,
        reason: drift.reason,
      });
      if (!drift.safe && drift.reason) reasons.push(drift.reason);
    }

    if ((input.timeboostDelayMs ?? 0) > 500) {
      reasons.push(`TIMEBOOST_EXPRESS_LANE_DELAY:${input.timeboostDelayMs}ms>500ms`);
    }

    const impact: GmxV2PriceImpactSoilInput | undefined =
      input.gmxPenaltyBps !== undefined
        ? {
            priceImpactPenaltyBps: input.gmxPenaltyBps,
            priceImpactSubsidiesBps: 0,
            reducesImbalance: false,
          }
        : undefined;
    if (impact) {
      const gate = evaluateGmxPriceImpactSoilGate(impact);
      if (gate.triggered) reasons.push(...gate.reasons);
    }

    const soil = checkSoilResistance({
      ...HEALTHY_SOIL,
      hlSpot: input.hlSpot ?? HEALTHY_SOIL.hlSpot,
      hlPerp: input.hlPerp ?? HEALTHY_SOIL.hlPerp,
      dydxPerp: input.dydxPerp ?? HEALTHY_SOIL.dydxPerp,
      depthUsd: input.depthUsd ?? HEALTHY_SOIL.depthUsd,
      ...(impact ? { gmxPriceImpact: impact } : {}),
    });
    if (soil.tripped) reasons.push(...soil.reasons);

    if (input.estimatedLossUsd !== undefined || input.criHardlock) {
      try {
        vineWrapProtection({
          symbol: "ETH",
          estimatedLossUsd: input.estimatedLossUsd ?? 1,
          accountBalanceUsd: input.accountBalanceUsd ?? 10_000,
          criHardlock: input.criHardlock === true,
        });
      } catch (err) {
        if (err instanceof HardlockError) reasons.push("R20_PHYSICAL_DEADLOCK");
        else if (err instanceof RiskLimitExceeded) reasons.push("ROOT_PROTECTION_TRIP");
        else throw err;
      }
    }

    if (input.dailyLossUsd !== undefined || input.dailySlCount !== undefined) {
      const r17 = checkRoot17DailyLimit({
        accountEquityUsd: input.accountBalanceUsd ?? 10_000,
        state: {
          utcDay: EVAL_AT.toISOString().slice(0, 10),
          cumulativeDailyLossUsd: input.dailyLossUsd ?? 0,
          dailySlCount: input.dailySlCount ?? 0,
        },
        now: EVAL_AT,
      });
      if (r17.tripped) reasons.push(r17.reason ?? "R17_DAILY_DRAWDOWN");
    }

    if ((input.sagaRetries ?? 0) >= 3) reasons.push("SAGA_TTL_RETRY_EXHAUSTED");
    if ((input.orderSizeUsd ?? 0) > SESSION_KEY_CLIP_USD) {
      reasons.push(`SESSION_KEY_CLIP:${input.orderSizeUsd}>${SESSION_KEY_CLIP_USD}`);
    }

    if (input.blackSwanSlippage !== undefined) {
      const swan = evaluateBlackSwanRisk({
        symbol: "ETH",
        slippage: input.blackSwanSlippage,
        orderbookDepthUsd: 10_000,
        baselineDepthUsd: 200_000,
        targetVenuePrice: 2100,
        ingressIndexPrice: 3500,
      });
      if (swan.tripped) reasons.push(...swan.reasons);
    }

    if (input.usdcUsd !== undefined && input.usdcUsd < 0.95) {
      reasons.push(`USDC_DEPEG:${input.usdcUsd}<0.95`);
    }
    if (input.protocolPaused) reasons.push("PROTOCOL_PAUSED_FAIL_CLOSED");

    return { failClosed: reasons.length > 0, reasons: [...new Set(reasons)], crashed: false };
  } catch (err) {
    return classifyGatewayIsolateError(err);
  }
}

export function injectOracleLagSpike(): ChaosAttackResult {
  const lag = evaluateOracleLag(EVAL_MS - ORACLE_LAG_SPIKE_MS, EVAL_MS);
  const gw = evaluateGatewayRules({
    oracleUpdatedAtMs: EVAL_MS - ORACLE_LAG_SPIKE_MS,
    l2BlockTimestampMs: EVAL_MS,
  });
  const reasons = [lag.reason, ...gw.reasons].filter((r): r is string => Boolean(r));
  const blocked =
    lag.deadlock === true &&
    lag.lagMs === ORACLE_LAG_SPIKE_MS &&
    lag.lagMs > ORACLE_LAG_DEADLOCK_MS &&
    gw.failClosed &&
    reasons.some((r) => r.includes("ORACLE_LAG_DEADLOCK"));
  return blockedResult("oracle_lag_spike", "ORACLE_LAG_DEADLOCK", reasons, blocked);
}

export function injectPriceImpactToxicity(): ChaosAttackResult {
  const gate = evaluateGmxPriceImpactSoilGate(ILLIQUID_ORDER_IMPACT);
  const gw = evaluateGatewayRules({ gmxPenaltyBps: PRICE_IMPACT_TOXIC_BPS });
  const reasons = [...gate.reasons, ...gw.reasons];
  const blocked =
    gate.triggered &&
    gw.failClosed &&
    reasons.some((r) => r.startsWith("GMX_PRICE_IMPACT_PENALTY"));
  return blockedResult("price_impact_toxicity", "SOIL_TRIPPED", reasons, blocked);
}

export function injectSequencerDown(): ChaosAttackResult {
  const gw = evaluateGatewayRules({
    sequencerAnswer: SEQUENCER_DOWN_ANSWER,
    sequencerElapsedSec: 1,
  });
  const blocked =
    gw.failClosed &&
    gw.reasons.some((r) => r.includes("ARBITRUM_SEQUENCER_GRACE")) &&
    gw.reasons.some((r) => r.includes(`${SEQUENCER_GRACE_SEC}s`));
  return blockedResult("sequencer_down", "GRACE_FREEZE_600S", gw.reasons, blocked);
}

export function injectMalformedTelemetry(raw: string): ChaosAttackResult {
  const gw = evaluateGatewayRules({ payload: raw });
  const expectedReasonPrefix = expectedMalformedPayloadPrefix(raw);
  const reasonPrefixMatched = reasonMatchesExpectedPrefix(gw.reasons, expectedReasonPrefix);
  const blocked = gw.failClosed && !gw.crashed && reasonPrefixMatched;
  const reasons = gw.reasons.length ? gw.reasons : [expectedReasonPrefix];
  return {
    scenario: "malformed_telemetry",
    blocked,
    trigger: reasons[0] ?? "FAIL_CLOSED",
    capitalLossUsd: blocked ? 0 : 1,
    crashed: gw.crashed,
    reasons,
    expectedReasonPrefix,
    reasonPrefixMatched,
  };
}

function groupForId(id: number): ChaosGroup {
  if (id <= 25) return "A";
  if (id <= 50) return "B";
  if (id <= 75) return "C";
  if (id <= 100) return "D";
  if (id <= 125) return "E";
  if (id <= 150) return "F";
  if (id <= 175) return "G";
  if (id <= 200) return "H";
  if (id <= 225) return "I";
  return "J";
}

function specForId(id: number): GatewayRuleInput {
  if (id <= 15) {
    return { oracleUpdatedAtMs: EVAL_MS - (ORACLE_LAG_DEADLOCK_MS + id), l2BlockTimestampMs: EVAL_MS };
  }
  if (id <= 20) {
    return { oracleUpdatedAtMs: EVAL_MS, l2BlockTimestampMs: EVAL_MS - (ORACLE_LAG_DEADLOCK_MS + id) };
  }
  if (id <= 25) return { oracleUpdatedAtMs: 0, l2BlockTimestampMs: EVAL_MS };

  if (id <= 40) {
    const bps = id === 26 ? 49.9 : 50 + (id - 26) * 18;
    return { gmxPenaltyBps: bps, depthUsd: id === 26 ? 1_000 : 200_000 };
  }
  if (id <= 45) return { depthUsd: id * 100 };
  if (id <= 50) return { hlPerp: 3500, dydxPerp: 3500 * (1 + 0.006 + (id - 46) * 0.01) };

  if (id <= 58) return { sequencerAnswer: 1, sequencerElapsedSec: 0 };
  if (id <= 67) return { sequencerAnswer: 0, sequencerElapsedSec: id === 67 ? 599 : Math.max(1, (id - 58) * 60) };
  if (id === 68) return { sequencerAnswer: 0, sequencerElapsedSec: 601, l1SurchargeUsd: 1, targetYieldUsd: 0.1 };
  if (id <= 75) return { l1SurchargeUsd: 1 + (id - 69), targetYieldUsd: 0.1 };

  if (id <= 85) {
    return {
      oracleUpdatedAtMs: EVAL_MS - ORACLE_LAG_SPIKE_MS,
      l2BlockTimestampMs: EVAL_MS,
      gmxPenaltyBps: 55 + id,
    };
  }
  if (id <= 92) return { sequencerAnswer: 1, hlPerp: 3500, dydxPerp: 3800 };
  if (id <= 100) {
    return {
      sequencerElapsedSec: 10,
      l1SurchargeUsd: 5,
      targetYieldUsd: 0.1,
      gmxPenaltyBps: 80,
    };
  }

  if (id <= 108) return { orderSizeUsd: SESSION_KEY_CLIP_USD + id };
  if (id <= 116) return { estimatedLossUsd: 500 + id, accountBalanceUsd: 10_000 };
  if (id <= 125) return { sagaRetries: 3 + (id - 117), estimatedLossUsd: 250, accountBalanceUsd: 10_000 };

  if (id === 140) return { payloadBytes: 10_000_000, payload: '{"flood":true}' };
  if (id <= 135) {
    const poison = [
      "' OR 1=1 --",
      "'; DROP TABLE orders; --",
      '{"__proto__":{"polluted":true}}',
      '{"constructor":{"prototype":{"admin":true}}}',
      '{"hlSpot":NaN}',
    ];
    return { payload: poison[(id - 126) % poison.length]! };
  }
  if (id <= 145) return { payload: `\u0000${"x".repeat(id)}{` };
  return { payload: MALFORMED_PAYLOADS[(id - 146) % MALFORMED_PAYLOADS.length]! };

  // G–J fall through via later checks
}

function specForIdTail(id: number): GatewayRuleInput {
  if (id <= 150) return specForId(id);
  if (id <= 160) return { usdcUsd: 0.8 - (id - 151) * 0.01, hlPerp: 3500, dydxPerp: 2800 };
  if (id <= 168) return { hlSpot: 3500, hlPerp: 2100, dydxPerp: 2100, blackSwanSlippage: 0.4 };
  if (id <= 175) return { protocolPaused: true, criHardlock: true, estimatedLossUsd: 1 };

  if (id <= 185) return { timeboostDelayMs: 500 + id, oracleUpdatedAtMs: EVAL_MS - 31_000, l2BlockTimestampMs: EVAL_MS };
  if (id <= 192) return { driftBlocks: SOFT_CONFIRMATION_DRIFT_MAX_BLOCKS + id };
  if (id <= 200) {
    return {
      driftBlocks: SOFT_CONFIRMATION_DRIFT_MAX_BLOCKS + 50,
      sequencerAnswer: 1,
      timeboostDelayMs: 800,
    };
  }

  if (id <= 208) return { skipArm: true, depthUsd: 0 };
  if (id <= 216) return { payloadBytes: 2_000_000 + id * 1000, payload: "not-json" };
  if (id <= 225) return { gmxPenaltyBps: 55, hlPerp: 3500, dydxPerp: 4000, sagaRetries: 5 };

  if (id <= 235) return { dailyLossUsd: 10_000, accountBalanceUsd: 10_000, dailySlCount: 3 };
  if (id <= 242) return { criHardlock: true, estimatedLossUsd: 1, accountBalanceUsd: 10_000 };
  if (id <= 248) return { estimatedLossUsd: 5_000, accountBalanceUsd: 10_000 };
  return {
    oracleUpdatedAtMs: EVAL_MS - ORACLE_LAG_SPIKE_MS,
    l2BlockTimestampMs: EVAL_MS,
    sequencerAnswer: 1,
    gmxPenaltyBps: 500,
    criHardlock: true,
    dailyLossUsd: 50_000,
    protocolPaused: true,
    blackSwanSlippage: 0.5,
    timeboostDelayMs: 2_000,
  };
}

function poisonPayloadForId(id: number): string {
  const poison = [
    "' OR 1=1 --",
    "'; DROP TABLE orders; --",
    '{"__proto__":{"polluted":true}}',
    '{"constructor":{"prototype":{"admin":true}}}',
    '{"hlSpot":NaN}',
  ];
  return poison[(id - 126) % poison.length]!;
}

export function expectedMalformedPayloadPrefix(raw: string): string {
  try {
    JSON.parse(raw);
    return "UNTRUSTED_TELEMETRY_FAIL_CLOSED";
  } catch {
    return "MALFORMED_JSON_FAIL_CLOSED";
  }
}

/** Spec-asserted reason prefix for each matrix id (1–255) — prevents false-negative masking. */
export function expectedReasonPrefixForId(id: number): string {
  if (id <= 20) return "ORACLE_LAG_DEADLOCK";
  if (id <= 25) return "ORACLE_TIMESTAMP_STALE_FAIL_CLOSED";
  if (id === 26) return "DEPTH_USD=";
  if (id <= 40) return "GMX_PRICE_IMPACT_PENALTY";
  if (id <= 45) return "DEPTH_USD=";
  if (id <= 50) return "CROSS_VENUE_SLIPPAGE=";
  if (id <= 58) return "ARBITRUM_SEQUENCER_DOWN";
  if (id <= 67) return "ARBITRUM_SEQUENCER_GRACE";
  if (id === 68) return "ARBITRUM_GAS_SURCHARGE";
  if (id <= 75) return "ARBITRUM_GAS_SURCHARGE";
  if (id <= 85) return "ORACLE_LAG_DEADLOCK";
  if (id <= 92) return "ARBITRUM_SEQUENCER_DOWN";
  if (id <= 100) return "ARBITRUM_SEQUENCER_GRACE";
  if (id <= 108) return "SESSION_KEY_CLIP:";
  if (id <= 125) return "ROOT_PROTECTION_TRIP";
  if (id === 140) return "PAYLOAD_INFLATION_FAIL_CLOSED";
  if (id <= 135) return expectedMalformedPayloadPrefix(poisonPayloadForId(id));
  if (id <= 145) return "MALFORMED_JSON_FAIL_CLOSED";
  if (id <= 150) {
    const raw = MALFORMED_PAYLOADS[(id - 146) % MALFORMED_PAYLOADS.length]!;
    return expectedMalformedPayloadPrefix(raw);
  }
  if (id <= 160) return "CROSS_VENUE_SLIPPAGE=";
  if (id <= 168) return "SLIPPAGE=";
  if (id <= 175) return "R20_PHYSICAL_DEADLOCK";
  if (id <= 185) return "ORACLE_LAG_DEADLOCK";
  if (id <= 192) return "SOFT_CONFIRMATION_DRIFT_DEADLOCK";
  if (id <= 200) return "ARBITRUM_SEQUENCER_DOWN";
  if (id <= 208) return "ARBITRUM_SEQUENCER_PROBE_MISSING";
  if (id <= 216) return "PAYLOAD_INFLATION_FAIL_CLOSED";
  if (id <= 225) return "GMX_PRICE_IMPACT_PENALTY";
  if (id <= 235) return "ROOT17_DAILY_LOSS_EXCEEDED";
  if (id <= 242) return "R20_PHYSICAL_DEADLOCK";
  if (id <= 248) return "ROOT_PROTECTION_TRIP";
  return "ORACLE_LAG_DEADLOCK";
}

export function reasonMatchesExpectedPrefix(
  reasons: string[],
  expectedReasonPrefix: string,
): boolean {
  return reasons.some(
    (reason) => reason.startsWith(expectedReasonPrefix) || reason.includes(expectedReasonPrefix),
  );
}

export function runMatrixCase(id: number): ChaosAttackResult {
  const group = groupForId(id);
  const input = specForIdTail(id);
  const expectedReasonPrefix = expectedReasonPrefixForId(id);
  const gw = evaluateGatewayRules(input);
  const reasonPrefixMatched = reasonMatchesExpectedPrefix(gw.reasons, expectedReasonPrefix);
  const blocked = gw.failClosed && !gw.crashed && reasonPrefixMatched;
  return blockedResult(
    group,
    gw.reasons[0] ?? "FAIL_CLOSED",
    gw.reasons,
    blocked,
    id,
    { expectedReasonPrefix, reasonPrefixMatched, crashed: gw.crashed },
  );
}

function emptyScenarioTally(): ChaosAuditReport["byScenario"] {
  return {
    oracle_lag_spike: { blocked: 0, total: 0, crashed: 0 },
    price_impact_toxicity: { blocked: 0, total: 0, crashed: 0 },
    sequencer_down: { blocked: 0, total: 0, crashed: 0 },
    malformed_telemetry: { blocked: 0, total: 0, crashed: 0 },
    A: { blocked: 0, total: 0, crashed: 0 },
    B: { blocked: 0, total: 0, crashed: 0 },
    C: { blocked: 0, total: 0, crashed: 0 },
    D: { blocked: 0, total: 0, crashed: 0 },
    E: { blocked: 0, total: 0, crashed: 0 },
    F: { blocked: 0, total: 0, crashed: 0 },
    G: { blocked: 0, total: 0, crashed: 0 },
    H: { blocked: 0, total: 0, crashed: 0 },
    I: { blocked: 0, total: 0, crashed: 0 },
    J: { blocked: 0, total: 0, crashed: 0 },
  };
}

function muteConsole(): () => void {
  const warn = console.warn;
  const error = console.error;
  console.warn = () => {};
  console.error = () => {};
  return () => {
    console.warn = warn;
    console.error = error;
  };
}

export function runChaosBlackSwanStress(
  attacks: number = CHAOS_ATTACK_COUNT,
): ChaosAuditReport {
  const byScenario = emptyScenarioTally();
  let blocked = 0;
  let crashed = 0;
  let prefixMismatches = 0;
  let capitalLossUsd = 0;
  const restore = muteConsole();
  try {
    for (let i = 1; i <= attacks; i++) {
      resetGates();
      let result: ChaosAttackResult;
      try {
        result = runMatrixCase(i);
      } catch {
        result = {
          scenario: groupForId(i),
          id: i,
          blocked: true,
          trigger: "FAIL_CLOSED",
          capitalLossUsd: 0,
          crashed: true,
          reasons: ["ISOLATE_CRASH_CAUGHT"],
        };
      }
      const bucket = byScenario[result.scenario];
      bucket.total += 1;
      if (result.crashed) {
        bucket.crashed += 1;
        crashed += 1;
      }
      if (result.reasonPrefixMatched === false) {
        prefixMismatches += 1;
      }
      if (result.blocked && !result.crashed) {
        bucket.blocked += 1;
        blocked += 1;
      } else {
        capitalLossUsd += result.capitalLossUsd;
      }
    }
  } finally {
    restore();
    resetGates();
  }

  const timestamp = new Date().toISOString();
  const pass = blocked === attacks && crashed === 0 && capitalLossUsd === 0 && prefixMismatches === 0;
  return {
    blocked,
    total: attacks,
    crashed,
    prefixMismatches,
    capitalLossUsd,
    line: pass
      ? BME_CHAOS_AUDIT_LINE
      : `[BeDelta-Living-Water- SLI\\verVine CHAOS AUDIT] ${blocked} / ${attacks} Simulated Toxic Attacks Blocked (${((blocked / attacks) * 100).toFixed(2)}% Fail-Closed, ${capitalLossUsd} Capital Loss)`,
    pass,
    byScenario,
    timestamp,
  };
}

export function writeChaosMetrics(report: ChaosAuditReport): void {
  const binding = resolveAuditArtifactBinding(new Date(report.timestamp));
  mkdirSync(dirname(CHAOS_METRICS_PATH), { recursive: true });
  writeFileSync(
    CHAOS_METRICS_PATH,
    `${JSON.stringify(
      {
        ...binding,
        totalScenarios: report.total,
        blockedToxicAttacks: report.blocked,
        failClosedRate: `${((report.blocked / report.total) * 100).toFixed(2)}%`,
        reasonPrefixMismatches: report.prefixMismatches,
        isolateCrashes: report.crashed,
        capitalLossUsd: report.capitalLossUsd,
      },
      null,
      2,
    )}\n`,
  );
}

export function compileNotebookLmExports(): void {
  const compiled = spawnSync("python3", ["scripts/compile_notebooklm_exports.py"], {
    cwd: ROOT,
    encoding: "utf8",
  });
  if (compiled.stdout) process.stdout.write(compiled.stdout);
  if (compiled.stderr) process.stderr.write(compiled.stderr);
  if (compiled.status !== 0) {
    throw new Error("compile_notebooklm_exports.py failed");
  }
}

export function printChaosAudit(report: ChaosAuditReport): void {
  const labels: Record<ChaosGroup, string> = {
    A: "A001-025 ORACLE/CLOCK",
    B: "B026-050 IMPACT/LIQ",
    C: "C051-075 SEQUENCER/GAS",
    D: "D076-100 DOUBLE-FAULT",
    E: "E101-125 SIZING/SAGA",
    F: "F126-150 POISON",
    G: "G151-175 MARKET SWAN",
    H: "H176-200 L2/REORG",
    I: "I201-225 ISOLATE/RACE",
    J: "J226-255 R17/R20/CASCADE",
  };
  for (const g of GROUPS) {
    const row = report.byScenario[g];
    console.log(`[${labels[g]}] ${row.blocked}/${row.total} BLOCKED`);
  }
  console.log(report.line);
}

function isDirectRun(): boolean {
  const entry = process.argv[1];
  if (!entry) return false;
  return fileURLToPath(import.meta.url) === resolve(entry);
}

if (isDirectRun()) {
  const report = runChaosBlackSwanStress();
  printChaosAudit(report);
  writeChaosMetrics(report);
  compileNotebookLmExports();
  if (!report.pass) process.exitCode = 1;
}
