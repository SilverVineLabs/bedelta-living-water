/**
 * SPDX-License-Identifier: BUSL-1.1
 * Copyright (c) 2026 SilverVine Labs. All Rights Reserved.
 */

import { computeEffectiveMaxSlUsd } from "../effective-max-sl";
import {
  emitRiskLog,
  isoNow,
  type RiskLogPayload,
} from "./logging";
import { severCircuitBreakerPipeline } from "../root-protection-lib/circuit-breaker-sever";
import { notifyFailClosedLock } from "../telemetry/telegram-alert";

export interface RootProtectionInput {
  symbol: string;
  /** Worst-case estimated loss in USD for this trade notion */
  estimatedLossUsd: number;
  /** Account balance used to derive dynamic Max SL */
  accountBalanceUsd: number;
  /** Pre-computed dynamic limit; defaults to computeEffectiveMaxSlUsd(accountBalanceUsd) */
  maxLossLimit?: number;
  frictionUsd?: number;
  /** CRI deadlocked at 0 — physical hardlock (403), signing channel blocked */
  criHardlock?: boolean;
}

/**
 * Thrown when estimated P&L loss exceeds the dynamic Max SL limit.
 * Callers that execute trades must let this propagate to block fills.
 */
export class RiskLimitExceeded extends Error {
  readonly code = "RISK_LIMIT_EXCEEDED" as const;
  readonly httpStatus = 422 as const;
  readonly context: RiskLogPayload;

  constructor(message: string, context: RiskLogPayload) {
    super(message);
    this.name = "RiskLimitExceeded";
    this.context = context;
  }
}

/**
 * Thrown when CRI reaches 0 — physical root deadlock; HTTP 403 hardlock.
 * Signing / execution channels must abort immediately.
 */
export class HardlockError extends Error {
  readonly code = "HARDLOCK" as const;
  readonly httpStatus = 403 as const;
  readonly context: RiskLogPayload;

  constructor(message: string, context: RiskLogPayload) {
    super(message);
    this.name = "HardlockError";
    this.context = context;
  }
}

/**
 * Vine wrap protection — wraps Hot Key signing during extreme drawdown.
 * Dynamic Max SL (Balance × 1% + $100) · R20 physical deadlock at CRI === 0.
 *
 * @theory Embrechts et al. (1997) — Extreme Value Theory (EVT) tail exceedance bounds.
 * @theory Mandelbrot (1963) — fat-tail defense via hard loss-cap circuit breakers.
 */
export function vineWrapProtection(input: RootProtectionInput): void {
  const {
    symbol,
    estimatedLossUsd,
    accountBalanceUsd,
    frictionUsd,
    criHardlock = false,
  } = input;
  const maxLossLimit =
    input.maxLossLimit ?? computeEffectiveMaxSlUsd(accountBalanceUsd);
  const loss = Math.abs(estimatedLossUsd);

  if (criHardlock) {
    const context: RiskLogPayload = {
      level: "error",
      module: "risk-control",
      event: "CRI_HARDLOCK",
      symbol,
      timestamp: isoNow(),
      message: `CRI hardlock — vine wrap protection deadlock at 0/100; signing channel blocked`,
      details: {
        cri: 0,
        accountBalanceUsd,
        maxLossLimit,
        frictionUsd: frictionUsd ?? null,
        blocked: true,
        httpStatus: 403,
      },
    };

    emitRiskLog(context);
    severCircuitBreakerPipeline("R20");
    throw new HardlockError(context.message, context);
  }

  if (loss > maxLossLimit) {
    const context: RiskLogPayload = {
      level: "error",
      module: "risk-control",
      event: "ROOT_PROTECTION_TRIP",
      symbol,
      timestamp: isoNow(),
      message: `Vine wrap protection — estimated loss $${loss.toFixed(2)} exceeds dynamic Max SL $${maxLossLimit.toFixed(2)}`,
      details: {
        estimatedLossUsd: loss,
        maxLossLimit,
        accountBalanceUsd,
        frictionUsd: frictionUsd ?? null,
        blocked: true,
      },
    };

    emitRiskLog(context);
    notifyFailClosedLock(
      `rootProtection() TRIP ${symbol} — loss $${loss.toFixed(2)} > Max SL $${maxLossLimit.toFixed(2)} (hot-key lock)`,
    );
    throw new RiskLimitExceeded(context.message, context);
  }
}

/** Alias for {@link vineWrapProtection} — physical root deadlock & dynamic Max SL gate. @see checkCircuitBreaker */
export const rootProtection = vineWrapProtection;
