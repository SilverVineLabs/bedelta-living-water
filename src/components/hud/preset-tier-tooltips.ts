import { CRI_TIER_DEFINITIONS } from "../../v2/services/risk-engine";
import { BRAND_DELTA_NEUTRAL_LABEL } from "../../config/constants";
import { STEP1_ROOT_KEYS, type Step1RootKey } from "../../v2/types/step1";
import type { ScaleDownComboId } from "./scale-down-presets";

export const R15_LEVERAGE_CAP_TOOLTIP =
  `R15 Leverage Cap Lock (Armed): Hard-locked at 1x Collateralized ${BRAND_DELTA_NEUTRAL_LABEL} mode in v0.8 to eliminate leverage liquidation risk.`;

const R15_ARMED_KEY = "root15_leverageCap" as const;

/** Non-tripped defense roots — always show PASS in preset tooltips. */
const ALWAYS_PASS_ROOT_NUMS = new Set([3, 7, 10]);

const ROOT_TOOLTIP_LABELS: Record<Step1RootKey, string> = {
  root1_lossLock: "R1: Daily Loss Hard-Lock",
  root2_geoLock: "R2: Geo-Fence Lock",
  root3_openSpikeLock: "R3: Spike Volatility Lock",
  root4_closeSpikeLock: "R4: Close Spike Lock",
  root5_vixLock: "R5: VIX Macro Lock",
  root6_beginnerCap: "R6: Beginner Notional Cap",
  root7_equityLock: "R7: Equity Floor Lock",
  root8_slippageLock: "R8: Slippage Circuit Breaker",
  root9_depthLock: "R9: Book Depth Lock",
  root10_tsunamiShield: "R10: Tsunami Shield",
  root11_fundingExtreme: "R11: Funding Rate Extreme Lock",
  root12_crossVenue: "R12: Cross-Venue Divergence Lock",
  root13_sessionAuth: "R13: Session Auth Guard",
  root14_capitalFloor: "R14: Capital Floor Lock",
  root15_leverageCap: "R15: Leverage Cap Lock (Armed)",
  root16_correlation: "R16: Correlation Risk Lock",
  root17_drawdownDay: "R17: Daily Drawdown Lock",
  root18_rateLimit: "R18: Rate Limit Shield",
  root19_dataFreshness: "R19: Data Freshness Lock",
  root20_killSwitch: "R20: Kill Switch",
};

/** Cumulative defense tiers unlocked per preset milestone. */
const CUMULATIVE_TIER_IDS: Readonly<
  Record<ScaleDownComboId, (typeof CRI_TIER_DEFINITIONS)[number]["id"][]>
> = {
  COMBO_A: ["TIER1"],
  COMBO_B: ["TIER1", "TIER2"],
  COMBO_C: ["TIER1", "TIER2", "TIER3", "TIER4"],
};

function rootNumFromKey(key: string): number {
  const match = /^root(\d+)_/.exec(key);
  return match ? Number(match[1]) : 0;
}

export function buildPresetTierTooltip(
  comboId: ScaleDownComboId,
  matrixDetails: Record<string, boolean>,
  groupActive: boolean,
): string {
  const tierRootNums = new Set<number>(
    CUMULATIVE_TIER_IDS[comboId].flatMap((tierId) => {
      const tier = CRI_TIER_DEFINITIONS.find((t) => t.id === tierId);
      return tier ? [...tier.roots] : [];
    }),
  );
  const tierRoots = STEP1_ROOT_KEYS.map(
    (key) => [key, matrixDetails[key] ?? false] as const,
  ).filter(([key]) => tierRootNums.has(rootNumFromKey(key)));

  return tierRoots
    .map(([key, passed]) => {
      const rootNum = rootNumFromKey(key);
      if (key === R15_ARMED_KEY && groupActive) {
        return "R15 🔒 Leverage Cap Lock (Armed)";
      }
      const label =
        ROOT_TOOLTIP_LABELS[key as Step1RootKey] ?? `R${rootNum}`;
      if (!groupActive) return `${label} 🔒`;
      if (ALWAYS_PASS_ROOT_NUMS.has(rootNum)) return `${label} ✓`;
      return `${label} ${passed ? "✓" : "✗"}`;
    })
    .join("\n");
}
