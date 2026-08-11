import type { UserMode } from "../../types/step1";
import {
  computeEffectiveMaxSlUsd,
  sanitizeAccountEquityUsd,
} from "../../../services/effective-max-sl";

/** Map XP / trade-count proxy into a UserMode tier */
export function resolveUserMode(xp: number): UserMode {
  if (xp < 30) return "BEGINNER";
  if (xp <= 70) return "INTERMEDIATE";
  return "EXPERT";
}

/** 3-Role Pipeline modes (Shield / Tactical / Flash) */
export type TradeRoleMode = "SHIELD" | "TACTICAL" | "FLASH";

/** HL wallet historical fill / TX thresholds for role unlock */
export const ROLE_TX_THRESHOLDS = {
  SHIELD: 0,
  TACTICAL: 5,
  FLASH: 20,
} as const;

export const ROLE_LOCK_TIPS = {
  TACTICAL: "Requires ≥ 5 HL TXs to unlock",
  FLASH: "Requires ≥ 20 HL TXs",
} as const;

/** Flash Mode physical welds — never bypassed by survey unlock */
export function flashHardLocks(accountEquityUsd?: number) {
  return {
    root1_maxSlUsd: computeEffectiveMaxSlUsd(
      sanitizeAccountEquityUsd(accountEquityUsd),
    ),
    root8_maxSlippage: 0.005 as const,
  };
}

export const FLASH_HARD_LOCKS = flashHardLocks();

export interface RoleEligibilityResult {
  walletAddress: string;
  txCount: number;
  allowedModes: TradeRoleMode[];
  maxMode: TradeRoleMode;
  reasons: Partial<Record<TradeRoleMode, string>>;
  /** Always true — Root 1 dynamic Max SL is physically welded */
  root1HardWeld: true;
  /** Effective Max SL USD at evaluation equity */
  effectiveMaxSlUsd: number;
  /** Always 0.5% — Root 8 slippage breaker ceiling */
  root8SlippageMax: typeof FLASH_HARD_LOCKS.root8_maxSlippage;
}

/**
 * Resolve 3-Role eligibility from HL wallet historical TX / fill count.
 * Shield = default (0 TX). Tactical ≥5. Flash ≥20.
 */
export function checkRoleEligibility(input: {
  walletAddress?: string | null;
  txCount?: number | null;
  accountEquityUsd?: number | null;
}): RoleEligibilityResult {
  const walletAddress = String(input.walletAddress || "").trim();
  const raw = Number(input.txCount);
  const txCount = Number.isFinite(raw) && raw > 0 ? Math.floor(raw) : 0;
  const effectiveMaxSlUsd = computeEffectiveMaxSlUsd(
    sanitizeAccountEquityUsd(input.accountEquityUsd),
  );

  const allowedModes: TradeRoleMode[] = ["SHIELD"];
  const reasons: Partial<Record<TradeRoleMode, string>> = {};

  if (txCount >= ROLE_TX_THRESHOLDS.TACTICAL) {
    allowedModes.push("TACTICAL");
  } else {
    reasons.TACTICAL = ROLE_LOCK_TIPS.TACTICAL;
  }

  if (txCount >= ROLE_TX_THRESHOLDS.FLASH) {
    allowedModes.push("FLASH");
  } else {
    reasons.FLASH = ROLE_LOCK_TIPS.FLASH;
  }

  const maxMode: TradeRoleMode = allowedModes.includes("FLASH")
    ? "FLASH"
    : allowedModes.includes("TACTICAL")
      ? "TACTICAL"
      : "SHIELD";

  return {
    walletAddress,
    txCount,
    allowedModes,
    maxMode,
    reasons,
    root1HardWeld: true,
    effectiveMaxSlUsd,
    root8SlippageMax: FLASH_HARD_LOCKS.root8_maxSlippage,
  };
}

export function isTradeModeAllowed(
  mode: TradeRoleMode,
  eligibility: RoleEligibilityResult,
): boolean {
  return eligibility.allowedModes.includes(mode);
}

/** Assert Flash physical locks (Root 1 + Root 8) — used when entering Flash. */
export function assertFlashHardLocks(accountEquityUsd?: number): {
  root1_lossLock: true;
  root8_slippageLock: true;
  maxLossUSD: number;
  maxSlippage: typeof FLASH_HARD_LOCKS.root8_maxSlippage;
} {
  const locks = flashHardLocks(accountEquityUsd);
  return {
    root1_lossLock: true,
    root8_slippageLock: true,
    maxLossUSD: locks.root1_maxSlUsd,
    maxSlippage: locks.root8_maxSlippage,
  };
}
