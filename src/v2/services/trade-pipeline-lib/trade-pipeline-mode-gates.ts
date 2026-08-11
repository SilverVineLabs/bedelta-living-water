import { STATUS_DICTIONARY } from "../../../config/statusDictionary";
import {
  computeEffectiveMaxSlUsd,
  DEFAULT_ACCOUNT_EQUITY_USD,
} from "../../../services/effective-max-sl";
import {
  normalizeTradeMode,
  type LegacyTradeMode,
  type TradeMode,
} from "./trade-pipeline-order-sizing";

export interface AutoGuardSnapshot {
  /** Mindset / DEFCON clear (no ALL-RED) */
  mindsetClear: boolean;
  /** VIX & DVOL within normal band */
  vixDvolNormal: boolean;
  /** Weak target injected into sniper console */
  targetLocked: boolean;
  /** Settlement countdown > 5 minutes */
  settlementClear: boolean;
  /** Soil resistance not exceeding dynamic Max SL risk */
  soilSafe: boolean;
}

export interface ModeGateInput {
  mode: TradeMode | LegacyTradeMode;
  /** Automated guard snapshot — no manual checkboxes */
  guards: AutoGuardSnapshot;
}

/** Step 3 unlock from automated guards. Flash bypasses survey. */
export function isStep3Unlocked(input: ModeGateInput): boolean {
  const mode = normalizeTradeMode(input.mode);
  const g = input.guards;
  if (mode === "FLASH") return true;
  if (mode === "TACTICAL") {
    return g.vixDvolNormal && g.settlementClear && g.soilSafe;
  }
  // SHIELD: full automated safety pipeline (mindset + target + risk trio)
  return (
    g.mindsetClear &&
    g.vixDvolNormal &&
    g.targetLocked &&
    g.settlementClear &&
    g.soilSafe
  );
}

export function formatAutoGuardBanner(
  mode: TradeMode | LegacyTradeMode,
  guards: AutoGuardSnapshot,
  accountEquityUsd: number = DEFAULT_ACCOUNT_EQUITY_USD,
): string {
  const m = normalizeTradeMode(mode);
  const unlocked = isStep3Unlocked({ mode: m, guards });
  const R = STATUS_DICTIONARY.ROOT_TAGS;
  const maxSlUsd = computeEffectiveMaxSlUsd(accountEquityUsd);
  if (m === "FLASH") {
    const flashLabel =
      R.FLASH_ACTIVE?.label || "[ ⚡ FLASH ACTIVE: SURVEY BYPASSED ]";
    const root1 = `[ R1: SL $${maxSlUsd.toFixed(0)} WELD ]`;
    const root8 = R.ROOT8_SLIPPAGE_BREAKER.ok;
    const direct = R.ROOT18_STEP3?.direct || "[ 🔓 STEP 3 DIRECT ACCESS 🎯 ]";
    return `${flashLabel} · ${root1} · ${root8} -> ${direct}`;
  }
  const vix = guards.vixDvolNormal ? R.ROOT5_VIX.pass : R.ROOT5_VIX.fail;
  const sett = guards.settlementClear
    ? R.ROOT10_SETTLEMENT.clear
    : R.ROOT10_SETTLEMENT.lockdown;
  const soil = guards.soilSafe ? R.ROOT3_SOIL.safe : R.ROOT3_SOIL.danger;
  const tail = unlocked ? R.ROOT18_STEP3.unlocked : R.ROOT18_STEP3.locked;
  return `${vix} · ${sett} · ${soil} -> ${tail}`;
}
