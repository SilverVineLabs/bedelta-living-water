import type { ReactNode } from "react";
import { BRAND_DELTA_NEUTRAL_LABEL } from "../../../config/constants";
import {
  PRESET_HOVER_TOOLTIPS,
  ROOT_PROTECTION_TOOLTIP,
} from "../scale-down-combobox-tooltips";
import { HUD_TOOLTIP_PANEL_CLASS } from "../Section1/section1-tooltip-styles";
import type { ScaleDownComboId } from "../scale-down-presets";

export const MASTER_COMBOS: readonly ScaleDownComboId[] = [
  "COMBO_A",
  "COMBO_B",
  "COMBO_C",
];

export const TREE_PREFIX: Record<ScaleDownComboId, string> = {
  COMBO_A: "├─",
  COMBO_B: "├─",
  COMBO_C: "└─",
};

export const R15_BREAKDOWN_LINE = {
  label: "R15 Leverage Cap Lock",
  status: "ARMED",
  detail: `1x ${BRAND_DELTA_NEUTRAL_LABEL} Collateralized Mode`,
} as const;

export function isRootProtectionLine(label: string): boolean {
  return label.includes("rootProtection");
}

export function splitPresetLabelTrail(label: string): {
  text: string;
  locked: boolean;
} {
  const locked = label.includes("🔒");
  const text = label.replace(/\s*[🔒ℹ️]/gu, "").trim();
  return { text, locked };
}

export function ShieldBreakdownLabel({
  label,
}: {
  label: string;
}): ReactNode {
  if (!isRootProtectionLine(label)) {
    return <span className="text-zinc-300">{label}</span>;
  }

  return (
    <span className="group/root relative inline-flex items-center gap-1">
      <span className="cursor-help text-zinc-300" data-testid="root-protection-breakdown-label">
        {label}
      </span>
      <span
        role="tooltip"
        data-testid="root-protection-breakdown-tooltip"
        className={`${HUD_TOOLTIP_PANEL_CLASS} left-0 whitespace-pre-line group-hover/root:block`}
      >
        {ROOT_PROTECTION_TOOLTIP}
      </span>
    </span>
  );
}

export { PRESET_HOVER_TOOLTIPS };
