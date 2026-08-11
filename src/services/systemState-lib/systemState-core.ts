/**
 * SystemState — single source of truth for Santenmoku v0.8 risk HUD + execution gates.
 * UI and API must read/write only through this module (no parallel risk state).
 */

import {
  HEALTH_CRI_MAX,
  HEALTH_CRI_MIN,
} from "../../config/constants";
import {
  applyTieredRootPenalty,
  assertCriHardlock,
} from "../criEngine";
import { computeEffectiveMaxSlUsd } from "../effective-max-sl";
import {
  enrichSystemStateVectorEquilibrium,
  type TopologyNode,
  type EquilibriumMode,
} from "../vector-equilibrium";
import type { MatrixRow } from "../../types/matrix";

/** Default evaluation balance aligned with matrix assembly */
export const DEFAULT_ACCOUNT_BALANCE_USD = 10_000;

export type HudState = "IDLE" | "GREEN" | "AMBER" | "SANTENMOKU" | "BLOCKED";

/** Session-key runtime posture — READ_ONLY_OBSERVER halts sign retries */
export type SessionKeyRuntimeMode = "TRADE_ACTIVE" | "READ_ONLY_OBSERVER";

export type SessionKeyStatusTag =
  | "OK"
  | "SESSION_KEY_EXPIRED"
  | "SESSION_KEY_REVOKED"
  | "SESSION_KEY_INVALID"
  | "R17_DAILY_LIMIT"
  | "R20_DEADLOCK";

export interface SystemState {
  accountBalanceUsd: number;
  /** Cumulative Risk Index — 100 (healthy) → 0 (deadlock) */
  currentCri: number;
  /** Dynamic Max SL = Balance × 1% + $100 */
  dynamicMaxSL: number;
  hudState: HudState;
  /** Physical hardlock — HTTP 403 + signing channel severed */
  hardlock: boolean;
  /** Hot-key / session signing channel — false when hardlocked */
  signingChannelOpen: boolean;
  /** Zero-key dry-run sandbox — forces mock fills when true */
  isSandboxMode: boolean;
  /** WS disconnect / stale feed — temporary trade lockout */
  isStale: boolean;
  /** Lifetime vault liquidation events (0 → VERIFIED_ZERO_LIQUIDATION) */
  liquidationEventCount: number;
  /** Session key trade vs observer mode */
  sessionKeyMode: SessionKeyRuntimeMode;
  /** Last session-key status tag (expired / revoked) */
  sessionKeyStatus: SessionKeyStatusTag;
  /** Derived — Taiji dual-engine posture */
  equilibriumMode?: EquilibriumMode;
  /** Derived — Bagua 8-gate routing label */
  activeNode?: TopologyNode;
}

export interface BuildSystemStateInput {
  accountBalanceUsd?: number;
  currentCri?: number;
  /** Skip hardlock assertion (e.g. serializing blocked state after trip) */
  skipHardlockAssert?: boolean;
  symbol?: string;
  isSandboxMode?: boolean;
  /** Optional soil trip hint for Taiji/Bagua enrichment */
  soilTripped?: boolean;
  isHedgeActive?: boolean;
  /** Lifetime liquidation events — default 0 (zero-liq verified) */
  liquidationEventCount?: number;
  sessionKeyMode?: SessionKeyRuntimeMode;
  sessionKeyStatus?: SessionKeyStatusTag;
}

export interface RiskSignalSnapshot {
  tsunamiShieldActive?: boolean;
  matrixRows?: MatrixRow[];
  vix?: number;
  dvol?: number;
  macroBlocking?: boolean;
}

/** Map CRI + hardlock to HUD posture (cat / banner) */
export function resolveHudState(
  currentCri: number,
  hardlock: boolean,
  synced = true,
): HudState {
  if (hardlock || currentCri <= HEALTH_CRI_MIN) return "BLOCKED";
  if (!synced) return "IDLE";
  if (currentCri <= 25) return "SANTENMOKU";
  if (currentCri <= 50) return "AMBER";
  if (currentCri <= 85) return "GREEN";
  return "GREEN";
}

/** Derive CRI from live risk signals using Tiered Root penalties (100 → 0) */
export function deriveCriFromRiskSignals(signals: RiskSignalSnapshot): number {
  let cri = HEALTH_CRI_MAX;

  if (signals.tsunamiShieldActive) {
    cri = applyTieredRootPenalty(cri, 1);
  }
  if (
    signals.macroBlocking ||
    (signals.vix ?? 0) > 20 ||
    (signals.dvol ?? 0) > 55
  ) {
    cri = applyTieredRootPenalty(cri, 1);
  }

  const rows = signals.matrixRows ?? [];
  const anyRootTrip = rows.some((r) =>
    (r.risk_reasons ?? []).includes("RISK_LIMIT_EXCEEDED"),
  );
  const anySoilTrip = rows.some(
    (r) =>
      r.risk_tripped === true &&
      !(r.risk_reasons ?? []).includes("RISK_LIMIT_EXCEEDED"),
  );

  if (anyRootTrip) {
    cri = applyTieredRootPenalty(cri, 3);
  } else if (anySoilTrip) {
    cri = applyTieredRootPenalty(cri, 2);
  }

  return cri;
}

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
