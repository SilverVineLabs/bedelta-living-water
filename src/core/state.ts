/**
 * Core system state — authoritative gate for adapters (Pgate.md / systemState.ts).
 */

import {
  checkSoilResistance,
  type SoilResistanceInput,
} from "../services/risk-control";
import { enrichSystemStateVectorEquilibrium } from "../services/vector-equilibrium";
import {
  buildSystemState,
  resolveHudState,
  type SystemState,
} from "../services/systemState";
import { isHedgeActive, isR20Locked } from "./risk";

export type { SystemState, HudState } from "../services/systemState";
export {
  buildSystemState,
  buildBlockedSystemState,
  buildSystemStateFromSignals,
  deriveCriFromRiskSignals,
  resolveHudState,
} from "../services/systemState";
export { isR20Locked, isHedgeActive } from "./risk";

/** Internal R20 / physical deadlock signal used by tactical logs */
export const R20_LOCKED = "R20_LOCKED" as const;

export interface CoreSystemState extends SystemState {
  isHedgeActive: boolean;
}

export interface UpdateSystemStateInput {
  patch?: Partial<SystemState>;
  soil?: SoilResistanceInput;
}

let activeStateOverride: CoreSystemState | null = null;

/** Read the active system snapshot (overrideable in tests). */
export function readActiveSystemState(): CoreSystemState {
  if (activeStateOverride) return activeStateOverride;
  const base = buildSystemState();
  return enrichSystemStateVectorEquilibrium(
    { ...base, isHedgeActive: false },
    { isHedgeActive: false },
  );
}

/** Merge patch (+ optional soil probe) into the active system snapshot. */
export function updateSystemState(input: UpdateSystemStateInput = {}): CoreSystemState {
  const current = readActiveSystemState();
  const patch = input.patch ?? {};

  const merged = buildSystemState({
    accountBalanceUsd: patch.accountBalanceUsd ?? current.accountBalanceUsd,
    currentCri: patch.currentCri ?? current.currentCri,
    liquidationEventCount:
      patch.liquidationEventCount ?? current.liquidationEventCount ?? 0,
    skipHardlockAssert: true,
  });

  const cri = patch.currentCri ?? merged.currentCri;
  const hardlock = patch.hardlock ?? merged.hardlock;

  const sessionKeyMode =
    patch.sessionKeyMode ??
    merged.sessionKeyMode ??
    current.sessionKeyMode ??
    "TRADE_ACTIVE";
  const sessionKeyStatus =
    patch.sessionKeyStatus ??
    merged.sessionKeyStatus ??
    current.sessionKeyStatus ??
    "OK";
  const observer = sessionKeyMode === "READ_ONLY_OBSERVER";

  const next: SystemState = {
    ...merged,
    ...patch,
    dynamicMaxSL: patch.dynamicMaxSL ?? merged.dynamicMaxSL,
    hudState: patch.hudState ?? resolveHudState(cri, hardlock),
    signingChannelOpen:
      patch.signingChannelOpen ??
      (!observer && !(hardlock || cri <= 0)),
    isStale: patch.isStale ?? current.isStale ?? false,
    liquidationEventCount:
      patch.liquidationEventCount ??
      merged.liquidationEventCount ??
      current.liquidationEventCount ??
      0,
    sessionKeyMode,
    sessionKeyStatus,
  };

  const hedgeActive = input.soil
    ? isHedgeActive(input.soil, next)
    : current.isHedgeActive;

  const soilTripped = input.soil
    ? checkSoilResistance(input.soil).tripped
    : undefined;

  activeStateOverride = enrichSystemStateVectorEquilibrium(
    { ...next, isHedgeActive: hedgeActive },
    { soilTripped, isHedgeActive: hedgeActive },
  );
  return activeStateOverride;
}

/** @internal Test hook — reset with `null` after each test. */
export function __setSystemStateForTests(state: CoreSystemState | SystemState | null): void {
  if (state === null) {
    activeStateOverride = null;
    return;
  }
  activeStateOverride = {
    ...state,
    isHedgeActive: (state as CoreSystemState).isHedgeActive ?? false,
  };
}

/** Resolve the tactical state label for logging when hedges are blocked. */
export function resolveRiskLockLabel(state: SystemState): typeof R20_LOCKED | null {
  return isR20Locked(state) ? R20_LOCKED : null;
}
