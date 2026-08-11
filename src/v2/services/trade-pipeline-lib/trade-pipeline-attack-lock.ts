import { ROOT8_SLIPPAGE_LOCK_LABEL } from "../../../config/constants";
import {
  computeOrderAwareMaxSlUsd,
  sanitizeAccountEquityUsd,
} from "../../../services/effective-max-sl";
import {
  checkSoilResistance,
  MAX_SLIPPAGE,
} from "../../../services/risk-control";
import { isToxicModeTripped } from "../risk-engine";
import {
  exceedsMaxRiskBoundary,
  hasInsufficientMargin,
  requiredMarginUsd,
} from "./trade-pipeline-order-sizing";

export type AttackLockReason =
  | null
  | "NO_TARGET"
  | "STEP3_LOCKED"
  | "INSUFFICIENT_MARGIN"
  | "SOIL_EXCEEDS_MAX_SL"
  | "ROOT8_SLIPPAGE_EXCEEDED"
  | "ROOT17_DAILY_LIMIT"
  | "EXECUTION_DISABLED"
  | "TOXIC_MODE"
  | "AUDIT_READ_ONLY";

export { ROOT8_SLIPPAGE_LOCK_LABEL };

/** Root 8 — HL soil resistance + 0.5% order slippage breaker (client attack path). */
export function resolveRoot8SlippageLock(input: {
  slipRatio: number;
  symbol?: string;
  hlSpot?: number;
  hlPerp?: number;
  dydxPerp?: number;
}): { locked: true; reason: "ROOT8_SLIPPAGE_EXCEEDED"; label: string } | null {
  const label =
    typeof ROOT8_SLIPPAGE_LOCK_LABEL !== "undefined"
      ? ROOT8_SLIPPAGE_LOCK_LABEL
      : "SLIPPAGE_LOCK";
  const symbol = String(input.symbol ?? "").trim();
  const hlSpot = Number(input.hlSpot);
  const hlPerp = Number(input.hlPerp);
  const dydxRaw = Number(input.dydxPerp);
  const dydxPerp =
    Number.isFinite(dydxRaw) && dydxRaw > 0 ? dydxRaw : 0;

  if (
    symbol &&
    Number.isFinite(hlSpot) &&
    Number.isFinite(hlPerp) &&
    hlSpot > 0 &&
    hlPerp > 0
  ) {
    const soil = checkSoilResistance({
      symbol,
      hlSpot,
      hlPerp,
      dydxPerp,
    });
    if (soil.tripped) {
      return {
        locked: true,
        reason: "ROOT8_SLIPPAGE_EXCEEDED",
        label,
      };
    }
  }
  if (input.slipRatio > MAX_SLIPPAGE) {
    return {
      locked: true,
      reason: "ROOT8_SLIPPAGE_EXCEEDED",
      label,
    };
  }
  return null;
}

export function resolveAttackLock(input: {
  hasTarget: boolean;
  step3Unlocked: boolean;
  withdrawableCollateral: number;
  orderSizeUsd: number;
  slipRatio: number;
  accountEquityUsd?: number;
  symbol?: string;
  hlSpot?: number;
  hlPerp?: number;
  dydxPerp?: number;
  root17Tripped?: boolean;
  executionDisabled?: boolean;
  riskScore?: number;
  toxicCooldownUntil?: number;
  auditReadOnly?: boolean;
  now?: number;
}): { locked: boolean; reason: AttackLockReason; label: string } {
  const now = input.now ?? Date.now();
  if (input.executionDisabled) {
    return {
      locked: true,
      reason: "EXECUTION_DISABLED",
      label: "LOCKED / EXECUTION DISABLED",
    };
  }
  const riskScore = input.riskScore ?? 0;
  const cooldownUntil = input.toxicCooldownUntil ?? 0;
  if (isToxicModeTripped(riskScore) || cooldownUntil > now) {
    const remainingSec =
      cooldownUntil > now ? Math.ceil((cooldownUntil - now) / 1000) : 0;
    const cooldownSuffix =
      remainingSec > 0 ? ` · COOLDOWN ${remainingSec}s` : "";
    return {
      locked: true,
      reason: "TOXIC_MODE",
      label: `[ TOXIC MODE TRIPPED · EXECUTION LOCKED${cooldownSuffix} ]`,
    };
  }
  if (input.auditReadOnly) {
    return {
      locked: true,
      reason: "AUDIT_READ_ONLY",
      label: "[ AUDIT READ-ONLY MODE · EXECUTION DISABLED ]",
    };
  }
  if (input.root17Tripped) {
    return {
      locked: true,
      reason: "ROOT17_DAILY_LIMIT",
      label: "[ ROOT 17: DAILY DRAWDOWN / SL CAP · ERROR 403 ]",
    };
  }
  if (!input.step3Unlocked) {
    return {
      locked: true,
      reason: "STEP3_LOCKED",
      label: "LOCKED / COMPLETE MODE GATES",
    };
  }
  if (!input.hasTarget) {
    return {
      locked: true,
      reason: "NO_TARGET",
      label: "ATTACK / EXECUTE ORDER",
    };
  }
  const required = requiredMarginUsd(input.orderSizeUsd);
  if (hasInsufficientMargin(input.withdrawableCollateral, required)) {
    return {
      locked: true,
      reason: "INSUFFICIENT_MARGIN",
      label: "INSUFFICIENT MARGIN",
    };
  }
  const root8Lock = resolveRoot8SlippageLock({
    slipRatio: input.slipRatio,
    symbol: input.symbol,
    hlSpot: input.hlSpot,
    hlPerp: input.hlPerp,
    dydxPerp: input.dydxPerp,
  });
  if (root8Lock) {
    return root8Lock;
  }
  const equity = sanitizeAccountEquityUsd(input.accountEquityUsd);
  const maxSl = computeOrderAwareMaxSlUsd(
    equity,
    input.orderSizeUsd,
    input.slipRatio,
  );
  if (
    exceedsMaxRiskBoundary({
      orderSizeUsd: input.orderSizeUsd,
      slipRatio: input.slipRatio,
      accountEquityUsd: equity,
    })
  ) {
    return {
      locked: true,
      reason: "SOIL_EXCEEDS_MAX_SL",
      label: `[ SOIL DANGER: EXCEEDS $${maxSl.toFixed(0)} RISK ]`,
    };
  }
  return {
    locked: false,
    reason: null,
    label: "ATTACK / EXECUTE ORDER",
  };
}
