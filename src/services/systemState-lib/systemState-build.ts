/**
 * SystemState — authoritative state builders and client serialization.
 */

import {
  HEALTH_CRI_MAX,
  HEALTH_CRI_MIN,
} from "../../config/constants";
import { assertCriHardlock } from "../criEngine";
import { computeEffectiveMaxSlUsd } from "../effective-max-sl";
import { enrichSystemStateVectorEquilibrium } from "../vector-equilibrium";
import { deriveCriFromRiskSignals, resolveHudState } from "./systemState-cri";
import {
  DEFAULT_ACCOUNT_BALANCE_USD,
  type BuildSystemStateInput,
  type RiskSignalSnapshot,
  type SystemState,
} from "./systemState-types";

/**
 * Build authoritative SystemState. Throws HardlockError (403) when CRI === 0.
 */
export function buildSystemState(input: BuildSystemStateInput = {}): SystemState {
  const accountBalanceUsd =
    input.accountBalanceUsd ?? DEFAULT_ACCOUNT_BALANCE_USD;
  const currentCri =
    input.currentCri ?? HEALTH_CRI_MAX;
  const dynamicMaxSL = computeEffectiveMaxSlUsd(accountBalanceUsd);
  const hardlock = currentCri <= HEALTH_CRI_MIN;
  const hudState = resolveHudState(currentCri, hardlock, true);

  if (!input.skipHardlockAssert && hardlock) {
    assertCriHardlock({
      symbol: input.symbol ?? "SYSTEM",
      cri: HEALTH_CRI_MIN,
      accountBalanceUsd,
    });
  }

  const sessionKeyMode = input.sessionKeyMode ?? "TRADE_ACTIVE";
  const sessionKeyStatus = input.sessionKeyStatus ?? "OK";
  const signingOpen =
    !hardlock &&
    sessionKeyMode !== "READ_ONLY_OBSERVER" &&
    (input.sessionKeyMode == null ? true : sessionKeyMode === "TRADE_ACTIVE");

  const base: SystemState = {
    accountBalanceUsd,
    currentCri,
    dynamicMaxSL,
    hudState,
    hardlock,
    signingChannelOpen: signingOpen,
    isSandboxMode: input.isSandboxMode ?? false,
    isStale: false,
    liquidationEventCount: Math.max(0, input.liquidationEventCount ?? 0),
    sessionKeyMode,
    sessionKeyStatus,
  };

  return enrichSystemStateVectorEquilibrium(base, {
    soilTripped: input.soilTripped,
    isHedgeActive: input.isHedgeActive,
  });
}

/** Build SystemState from matrix pipeline snapshot (API /api/data) */
export function buildSystemStateFromSignals(
  signals: RiskSignalSnapshot,
  accountBalanceUsd = DEFAULT_ACCOUNT_BALANCE_USD,
): SystemState {
  const currentCri = deriveCriFromRiskSignals(signals);
  const rows = signals.matrixRows ?? [];
  const anySoilTrip = rows.some(
    (r) =>
      r.risk_tripped === true &&
      !(r.risk_reasons ?? []).includes("RISK_LIMIT_EXCEEDED"),
  );
  return buildSystemState({
    accountBalanceUsd,
    currentCri,
    symbol: "SYSTEM",
    soilTripped: anySoilTrip,
  });
}

/** Blocked state payload for 403 responses (no re-throw) */
export function buildBlockedSystemState(
  accountBalanceUsd = DEFAULT_ACCOUNT_BALANCE_USD,
): SystemState {
  return enrichSystemStateVectorEquilibrium({
    accountBalanceUsd,
    currentCri: HEALTH_CRI_MIN,
    dynamicMaxSL: computeEffectiveMaxSlUsd(accountBalanceUsd),
    hudState: "BLOCKED",
    hardlock: true,
    signingChannelOpen: false,
    isSandboxMode: false,
    isStale: false,
    liquidationEventCount: 0,
    sessionKeyMode: "READ_ONLY_OBSERVER",
    sessionKeyStatus: "SESSION_KEY_INVALID",
  });
}

/** JSON-safe clone for embedding in dashboard script */
export function serializeSystemStateForClient(state: SystemState): SystemState {
  return { ...state };
}
