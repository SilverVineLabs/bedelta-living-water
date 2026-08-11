import {
  BASELINE_LOSS_BPS_NO_SHIELD,
  resolvePresetSavedBps,
  TRADE_NOTIONAL_USD,
  type TradeNotionalTier,
} from "../../../data/verified-5tx";
import type { OperatorUnlockVersion } from "../../../v2/admin/operator-matrix";
import type { MevAttackPhase } from "./section1-hud-types";
import { PROTECTION_STATS, resolveShieldTheme, type ShieldTheme } from "./section1-shield-themes";

export interface Section1SlippageDisplayInput {
  notional: TradeNotionalTier;
  protocolVersion: OperatorUnlockVersion;
  savedBpsOverride?: number;
  hasLive5TxProof: boolean;
  liveProofSavedUsd?: number;
  baselineLossBpsOverride?: number;
  forceUltraShield: boolean;
  mevAttackPhase?: MevAttackPhase;
  mevAttackToxicityBps?: number;
}

export interface Section1SlippageDisplayState {
  theme: ShieldTheme;
  savedBps: number;
  savedUsdAmount: number;
  showVerifiedProofSubtitle: boolean;
  baselineLossBps: number;
  baselineLossUsd: number;
  interceptPct: number;
  jitterLabel: string;
}

const DAMAGED_SHIELD_THEME: ShieldTheme = {
  border: "border-red-500/60",
  glow: "shadow-[0_0_28px_rgba(239,68,68,0.35)]",
  accentText: "text-red-300",
  power: "0%",
  label: "[ DAMAGED / UNPROTECTED ]",
};

const REBATE_CAPTURED_THEME: ShieldTheme = {
  border: "border-purple-500/60",
  glow: "shadow-[0_0_28px_rgba(168,85,247,0.42)]",
  accentText: "text-amber-300",
  power: "+15.0 bps",
  label: "[ REBATE CAPTURED ]",
};

export function resolveSection1SlippageDisplay(
  input: Section1SlippageDisplayInput,
): Section1SlippageDisplayState {
  const baseTheme = resolveShieldTheme(input.protocolVersion, input.forceUltraShield);
  const baseSavedBps = input.savedBpsOverride ?? resolvePresetSavedBps(input.protocolVersion);
  const toxicityBps = input.mevAttackToxicityBps ?? 0;
  const isAttackActive =
    input.mevAttackPhase != null && input.mevAttackPhase !== "idle" && toxicityBps > 0;
  const savedBps = isAttackActive
    ? input.protocolVersion === "v1.5"
      ? baseSavedBps + toxicityBps
      : baseSavedBps - toxicityBps
    : baseSavedBps;
  const theme = isAttackActive
    ? input.protocolVersion === "v1.5"
      ? { ...baseTheme, ...REBATE_CAPTURED_THEME }
      : { ...baseTheme, ...DAMAGED_SHIELD_THEME }
    : baseTheme;
  const baselineLossBps = input.baselineLossBpsOverride ?? BASELINE_LOSS_BPS_NO_SHIELD;
  const showVerifiedProofSubtitle =
    input.protocolVersion === "v0.8" &&
    input.notional === "1K" &&
    input.hasLive5TxProof;
  const savedUsdAmount = TRADE_NOTIONAL_USD[input.notional] * (savedBps / 10_000);
  const { interceptPct, jitter } = PROTECTION_STATS[input.protocolVersion];

  return {
    theme,
    savedBps,
    savedUsdAmount,
    showVerifiedProofSubtitle,
    baselineLossBps,
    baselineLossUsd: TRADE_NOTIONAL_USD[input.notional] * (baselineLossBps / 10_000),
    interceptPct,
    jitterLabel: jitter,
  };
}

export function fmtUsd2(n: number): string {
  return Math.abs(n).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}
