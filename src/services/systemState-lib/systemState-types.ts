/**
 * SystemState — types and default balance constant.
 */

import type { EquilibriumMode, TopologyNode } from "../vector-equilibrium";

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
  matrixRows?: import("../../types/matrix").MatrixRow[];
  vix?: number;
  dvol?: number;
  macroBlocking?: boolean;
}
