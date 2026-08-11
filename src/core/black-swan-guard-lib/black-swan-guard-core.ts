/**
 * Black-swan defense — extreme liquidity / deviation circuit breaker + 2PC emergency flatten.
 */

import {
  abortIntent,
  listAllIntents,
  type FlattenLegFn,
  type IntentPhase,
} from "../intent-ledger";
import { recordSoilViolation } from "../../services/circuit-breaker";
import { severSigningChannel } from "../../services/session-key-adapter";
import {
  __resetBlackSwanLoggerForTests,
  getBlackSwanDefenseHudLabel,
  isBlackSwanDefenseActive,
  logBlackSwanEmergencyFlatten,
  logBlackSwanTrip,
  readBlackSwanActiveTriggers,
} from "../black-swan-logger";

export {
  BLACK_SWAN_HUD_TAG,
  emitBlackSwanLog,
  getBlackSwanDefenseHudLabel,
  getRecentBlackSwanLogs,
  isBlackSwanDefenseActive,
  readBlackSwanActiveTriggers,
  type BlackSwanLogEvent,
  type BlackSwanLogPayload,
  type LubanBand,
} from "../black-swan-logger";

/** Slippage fuse — trips above 2.5% */
export const BLACK_SWAN_MAX_SLIPPAGE = 0.025;

/** Orderbook depth collapse — trips when depth drops more than 70% vs baseline */
export const BLACK_SWAN_DEPTH_DROP_RATIO = 0.7;

/** HL venue vs ingress index — trips above 3% deviation */
export const BLACK_SWAN_PRICE_DEVIATION = 0.03;

export type BlackSwanTriggerCode =
  | "BLACK_SWAN_LIQUIDITY_HALT"
  | "BLACK_SWAN_DEVIATION_LOCK";

export interface BlackSwanMarketParams {
  symbol: string;
  /** Current slippage ratio (fraction, e.g. 0.03 = 3%) */
  slippage: number;
  /** Live orderbook depth (USD notional proxy) */
  orderbookDepthUsd: number;
  /** Reference depth before collapse */
  baselineDepthUsd: number;
  /** Target venue (HL) mark / mid */
  targetVenuePrice: number;
  /** Ingress index / oracle reference price */
  ingressIndexPrice: number;
  /** Optional normalized spread ratio for telemetry */
  spreadRatio?: number;
  at?: number;
}

export interface BlackSwanRiskResult {
  tripped: boolean;
  triggers: BlackSwanTriggerCode[];
  slippageExceeded: boolean;
  depthDropExceeded: boolean;
  priceDeviationExceeded: boolean;
  slippage: number;
  depthDropRatio: number;
  priceDeviation: number;
  reasons: string[];
}

export interface EmergencyAutoFlattenInput {
  marketParams: BlackSwanMarketParams;
  intentId?: string;
  flattenLeg?: FlattenLegFn;
  now?: () => number;
}

export interface EmergencyAutoFlattenResult {
  ok: boolean;
  tripped: boolean;
  triggers: BlackSwanTriggerCode[];
  flattenedCount: number;
  abortedIntentIds: string[];
  hudTag: string | null;
  reason?: string;
}

const FLATTENABLE_PHASES = new Set<IntentPhase>(["PENDING", "PREPARED"]);

function computeDepthDropRatio(
  baselineDepthUsd: number,
  orderbookDepthUsd: number,
): number {
  if (baselineDepthUsd <= 0) return 0;
  const drop = (baselineDepthUsd - orderbookDepthUsd) / baselineDepthUsd;
  return Math.max(0, drop);
}

function computePriceDeviation(
  targetVenuePrice: number,
  ingressIndexPrice: number,
): number {
  if (ingressIndexPrice <= 0) return Number.POSITIVE_INFINITY;
  return Math.abs(targetVenuePrice - ingressIndexPrice) / ingressIndexPrice;
}

/**
 * Evaluate extreme-market black-swan risk.
 * Liquidity halt: slippage > 2.5% OR depth drop > 70%.
 * Deviation lock: HL vs ingress index deviation > 3%.
 */
export function evaluateBlackSwanRisk(
  marketParams: BlackSwanMarketParams,
): BlackSwanRiskResult {
  const triggers: BlackSwanTriggerCode[] = [];
  const reasons: string[] = [];

  const slippageExceeded = marketParams.slippage > BLACK_SWAN_MAX_SLIPPAGE;
  const depthDropRatio = computeDepthDropRatio(
    marketParams.baselineDepthUsd,
    marketParams.orderbookDepthUsd,
  );
  const depthDropExceeded = depthDropRatio > BLACK_SWAN_DEPTH_DROP_RATIO;

  const priceDeviation = computePriceDeviation(
    marketParams.targetVenuePrice,
    marketParams.ingressIndexPrice,
  );
  const priceDeviationExceeded = priceDeviation > BLACK_SWAN_PRICE_DEVIATION;

  if (slippageExceeded || depthDropExceeded) {
    triggers.push("BLACK_SWAN_LIQUIDITY_HALT");
    if (slippageExceeded) {
      reasons.push(
        `SLIPPAGE=${(marketParams.slippage * 100).toFixed(2)}%>${(BLACK_SWAN_MAX_SLIPPAGE * 100).toFixed(1)}%`,
      );
    }
    if (depthDropExceeded) {
      reasons.push(
        `DEPTH_DROP=${(depthDropRatio * 100).toFixed(1)}%>${(BLACK_SWAN_DEPTH_DROP_RATIO * 100).toFixed(0)}%`,
      );
    }
  }

  if (priceDeviationExceeded) {
    triggers.push("BLACK_SWAN_DEVIATION_LOCK");
    reasons.push(
      `PRICE_DEV=${(priceDeviation * 100).toFixed(2)}%>${(BLACK_SWAN_PRICE_DEVIATION * 100).toFixed(0)}%`,
    );
  }

  return {
    tripped: triggers.length > 0,
    triggers,
    slippageExceeded,
    depthDropExceeded,
    priceDeviationExceeded,
    slippage: marketParams.slippage,
    depthDropRatio,
    priceDeviation,
    reasons,
  };
}

/** Reject new orders when black-swan defense is latched. */
export function assertBlackSwanClear(): { ok: true } | { ok: false; reason: string } {
  if (!isBlackSwanDefenseActive()) return { ok: true };
  const tag = getBlackSwanDefenseHudLabel() ?? "BLACK_SWAN_DEFENSE_ACTIVE";
  const triggers = readBlackSwanActiveTriggers().join("|") || "UNKNOWN";
  return { ok: false, reason: `${tag}:${triggers}` };
}

/**
 * Latch black-swan defense, sever signing channel, and unwind open 2PC intents.
 * Called when evaluateBlackSwanRisk() trips during live ingress.
 */
export async function triggerEmergencyAutoFlatten(
  input: EmergencyAutoFlattenInput,
): Promise<EmergencyAutoFlattenResult> {
  const risk = evaluateBlackSwanRisk(input.marketParams);
  if (!risk.tripped) {
    return {
      ok: false,
      tripped: false,
      triggers: [],
      flattenedCount: 0,
      abortedIntentIds: [],
      hudTag: null,
      reason: "BLACK_SWAN_NOT_TRIPPED",
    };
  }

  const at = input.now?.() ?? input.marketParams.at ?? Date.now();
  recordSoilViolation(at);
  severSigningChannel();

  logBlackSwanTrip({
    symbol: input.marketParams.symbol,
    triggers: risk.triggers,
    details: {
      slippage: risk.slippage,
      depthDropRatio: risk.depthDropRatio,
      priceDeviation: risk.priceDeviation,
      spreadRatio: input.marketParams.spreadRatio ?? null,
      reasons: risk.reasons.join("|"),
    },
    at,
  });

  const flattenLeg = input.flattenLeg ?? (async () => ({ ok: true }));
  const abortedIntentIds: string[] = [];
  let flattenedCount = 0;

  const targetId = input.intentId;
  const intents = targetId
    ? listAllIntents().filter((intent) => intent.id === targetId)
    : listAllIntents().filter((intent) => FLATTENABLE_PHASES.has(intent.phase));

  for (const intent of intents) {
    const result = await abortIntent(intent.id, "BLACK_SWAN_EMERGENCY_FLATTEN", {
      flattenLeg,
      now: () => at,
    });
    if (result.ok || result.intent.phase === "ABORTED") {
      abortedIntentIds.push(intent.id);
      flattenedCount += result.intent.flattenActions.length;
    }
  }

  const primaryIntentId = abortedIntentIds[0] ?? targetId ?? "NONE";
  logBlackSwanEmergencyFlatten({
    symbol: input.marketParams.symbol,
    intentId: primaryIntentId,
    flattenedCount,
    triggers: risk.triggers,
    at,
  });

  return {
    ok: true,
    tripped: true,
    triggers: risk.triggers,
    flattenedCount,
    abortedIntentIds,
    hudTag: getBlackSwanDefenseHudLabel(),
  };
}

/** @internal test reset */
export function __resetBlackSwanGuardForTests(): void {
  __resetBlackSwanLoggerForTests();
}
