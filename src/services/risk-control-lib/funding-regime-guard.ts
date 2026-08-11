/**
 * Funding-regime leverage scaling + rebalance halt wired to R20 protective hardlock.
 */

import { severCircuitBreakerPipeline } from "../root-protection-lib/circuit-breaker-sever";
import { emitRiskLog, isoNow } from "./logging";
import {
  evaluateFundingRegime,
  type FundingRegime,
  type FundingRegimeContext,
} from "./funding-rate-history";

export const FUNDING_LEVERAGE_NORMAL = 3.0;
export const FUNDING_LEVERAGE_MILD_CEILING = 1.5;
export const FUNDING_LEVERAGE_MILD_FLOOR = 1.0;

export interface FundingRegimePolicyInput extends FundingRegimeContext {
  currentRateBps: number;
  symbol?: string;
  /** True when intent is a spot↔perp rebalance clip (vs flat/base yield hold) */
  isRebalance?: boolean;
  requestedLeverage?: number;
  baseNotionalUsd?: number;
}

export interface FundingRegimePolicyResult {
  regime: FundingRegime;
  targetLeverage: number;
  scaledNotionalUsd: number;
  haltRebalancing: boolean;
  rebalanceAllowed: boolean;
  routeToBaseYield: boolean;
  r20Triggered: boolean;
  reasons: string[];
}

function clampLeverage(value: number): number {
  return Math.max(FUNDING_LEVERAGE_MILD_FLOOR, Math.min(FUNDING_LEVERAGE_NORMAL, value));
}

/**
 * Dynamic leverage target:
 * NORMAL_POSITIVE → 3.0x · MILD_NEGATIVE → 3.0→1.5→1.0 · PROLONGED → 1.0x flat.
 */
export function resolveFundingLeverage(
  regime: FundingRegime,
  input: { currentRateBps: number; negativeDurationHours?: number },
): number {
  if (regime === "NORMAL_POSITIVE") return FUNDING_LEVERAGE_NORMAL;
  if (regime === "PROLONGED_NEGATIVE") return FUNDING_LEVERAGE_MILD_FLOOR;

  const hours = Math.max(0, input.negativeDurationHours ?? 0);
  const rateMag = Math.abs(Math.min(0, input.currentRateBps));
  const hourSeverity = Math.min(
    1,
    Math.max(0, (hours - 24) / (168 - 24)),
  );
  const rateSeverity = Math.min(1, rateMag / 9);
  const severity = Math.max(hourSeverity, rateSeverity);

  if (severity <= 0.5) {
    return clampLeverage(
      FUNDING_LEVERAGE_NORMAL -
        severity * 2 * (FUNDING_LEVERAGE_NORMAL - FUNDING_LEVERAGE_MILD_CEILING),
    );
  }

  return clampLeverage(
    FUNDING_LEVERAGE_MILD_CEILING -
      (severity - 0.5) * 2 * (FUNDING_LEVERAGE_MILD_CEILING - FUNDING_LEVERAGE_MILD_FLOOR),
  );
}

/** Scale rebalance notional by targetLeverage / normal leverage (3x baseline). */
export function scaleRebalanceNotionalUsd(
  baseNotionalUsd: number,
  targetLeverage: number,
): number {
  const base = Math.max(0, Number(baseNotionalUsd) || 0);
  if (base === 0) return 0;
  const ratio = targetLeverage / FUNDING_LEVERAGE_NORMAL;
  return Math.round(base * ratio * 100) / 100;
}

/** Evaluate funding regime, apply leverage scaling, and escalate prolonged-negative to R20. */
export function evaluateFundingRegimePolicy(
  input: FundingRegimePolicyInput,
): FundingRegimePolicyResult {
  const regime = evaluateFundingRegime(input.currentRateBps, input);
  const targetLeverage = resolveFundingLeverage(regime, input);
  const baseNotional = Math.max(0, Number(input.baseNotionalUsd) || 0);
  const scaledNotionalUsd = scaleRebalanceNotionalUsd(baseNotional, targetLeverage);
  const reasons: string[] = [];

  if (regime === "PROLONGED_NEGATIVE") {
    reasons.push("FUNDING_PROLONGED_NEGATIVE_HALT");
    severCircuitBreakerPipeline("R20");
    emitRiskLog({
      level: "error",
      module: "risk-control",
      event: "CRI_HARDLOCK",
      symbol: input.symbol ?? "ETH",
      timestamp: isoNow(),
      message:
        "Funding regime PROLONGED_NEGATIVE — rebalance halted, R20 hardlock engaged, routing to flat/base yield",
      details: {
        currentRateBps: input.currentRateBps,
        targetLeverage,
        haltRebalancing: true,
        routeToBaseYield: true,
        r20Triggered: true,
      },
    });

    return {
      regime,
      targetLeverage: FUNDING_LEVERAGE_MILD_FLOOR,
      scaledNotionalUsd: scaleRebalanceNotionalUsd(
        baseNotional,
        FUNDING_LEVERAGE_MILD_FLOOR,
      ),
      haltRebalancing: true,
      rebalanceAllowed: false,
      routeToBaseYield: true,
      r20Triggered: true,
      reasons,
    };
  }

  if (regime === "MILD_NEGATIVE") {
    reasons.push(`FUNDING_MILD_NEGATIVE_LEVERAGE=${targetLeverage.toFixed(2)}x`);
  }

  if (
    input.requestedLeverage !== undefined &&
    Number.isFinite(input.requestedLeverage) &&
    input.requestedLeverage > targetLeverage + 1e-6
  ) {
    reasons.push(
      `FUNDING_LEVERAGE_CAP=${targetLeverage.toFixed(2)}<${input.requestedLeverage.toFixed(2)}`,
    );
  }

  return {
    regime,
    targetLeverage,
    scaledNotionalUsd,
    haltRebalancing: false,
    rebalanceAllowed: true,
    routeToBaseYield: false,
    r20Triggered: false,
    reasons,
  };
}
