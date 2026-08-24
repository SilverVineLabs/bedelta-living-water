import { useState, type ReactNode } from "react";
import {
  DEFAULT_SCALE_DOWN_COMBO,
  formatActiveOperators,
  formatMasterPresetLabel,
  isPresetUnlocked,
  PRESET_CASCADE_THEMES,
  SCALE_DOWN_COMBO_PRESETS,
  SCALE_DOWN_COMBO_VERSION,
  SHIELD_BREAKDOWN_BY_VERSION,
  SHIELD_STATUS_TEXT_CLASS,
  type ScaleDownComboId,
} from "./scale-down-presets";
import { CITADEL_CHAOS_OPERATOR_LOCK } from "./citadel-chaos-store";
import { HUD_TOOLTIP_PANEL_CLASS } from "./Section1/section1-tooltip-styles";
import {
  MASTER_COMBOS,
  PRESET_HOVER_TOOLTIPS,
  R15_BREAKDOWN_LINE,
  ShieldBreakdownLabel,
  splitPresetLabelTrail,
  TREE_PREFIX,
} from "./ScaleDownCombobox-lib/scale-down-combobox-helpers";

export interface ScaleDownComboboxProps {
  defaultCombo?: ScaleDownComboId;
  matrixDetails?: Record<string, boolean>;
  chaosHardLocked?: boolean;
  onComboChange?: (comboId: ScaleDownComboId) => void;
}

export function ScaleDownCombobox({
  defaultCombo = DEFAULT_SCALE_DOWN_COMBO,
  matrixDetails: _matrixDetails = {},
  chaosHardLocked = false,
  onComboChange,
}: ScaleDownComboboxProps): ReactNode {
  const [selectedCombo, setSelectedCombo] =
    useState<ScaleDownComboId>(defaultCombo);

  const active = SCALE_DOWN_COMBO_PRESETS[selectedCombo];
  const version = SCALE_DOWN_COMBO_VERSION[selectedCombo];
  const shieldLines = SHIELD_BREAKDOWN_BY_VERSION[version];

  const selectCombo = (comboId: ScaleDownComboId) => {
    setSelectedCombo(comboId);
    onComboChange?.(comboId);
  };

  return (
    <section
      className="flex h-full min-h-[220px] flex-col rounded border border-zinc-800 bg-zinc-900/80 p-4 text-white"
      aria-label="Santenmoku preset matrix"
      data-testid="scale-down-combobox"
    >
      <p className="mb-2 font-data text-[9px] uppercase tracking-wider text-zinc-500">
        Preset &amp; Tier Combined Matrix (select to toggle):
      </p>
      <div className="mb-3 space-y-1.5" role="tablist">
        {MASTER_COMBOS.map((comboId) => {
          const isSelected = selectedCombo === comboId;
          const comboActive = isPresetUnlocked(comboId, selectedCombo);
          const label = formatMasterPresetLabel(comboId, selectedCombo);
          const { text: labelText, locked } = splitPresetLabelTrail(label);
          const comboVersion = SCALE_DOWN_COMBO_VERSION[comboId];
          const cascade = PRESET_CASCADE_THEMES[comboVersion];
          const buttonTone = comboActive
            ? isSelected
              ? cascade.selected
              : cascade.active
            : "border-zinc-700/80 bg-zinc-900/60 text-zinc-500 hover:border-zinc-600 hover:text-zinc-300";
          return (
            <div key={comboId} className="group/preset relative">
              <button
                type="button"
                role="tab"
                aria-selected={isSelected}
                onClick={() => selectCombo(comboId)}
                className={[
                  "flex w-full min-w-0 items-start gap-1 rounded border px-2 py-1.5 text-left font-data text-[10px] font-semibold transition-all",
                  "whitespace-normal leading-snug break-words",
                  buttonTone,
                ].join(" ")}
              >
                <span className="text-zinc-600">{TREE_PREFIX[comboId]}</span>
                <span className="min-w-0 flex-1 truncate">
                  [ {labelText} ]
                  <span className="ml-1 inline-flex shrink-0 items-center gap-0.5">
                    {locked ? <span aria-hidden="true">🔒</span> : null}
                    <span
                      aria-hidden="true"
                      data-testid={`preset-info-tooltip-${comboId}`}
                    >
                      ℹ️
                    </span>
                  </span>
                </span>
              </button>
              <div
                role="tooltip"
                data-testid={`preset-info-tooltip-panel-${comboId}`}
                className={`${HUD_TOOLTIP_PANEL_CLASS} right-0 whitespace-pre-line group-hover/preset:block`}
              >
                {PRESET_HOVER_TOOLTIPS[comboId]}
              </div>
            </div>
          );
        })}
      </div>
      <div
        className="rounded border border-zinc-800/50 bg-black/50 p-2 font-data text-xs text-zinc-500"
        data-testid="scale-down-combobox-active"
      >
        ACTIVE OPERATORS:{" "}
        <span className={chaosHardLocked ? "text-rose-300" : SHIELD_STATUS_TEXT_CLASS[version]}>
          {chaosHardLocked ? CITADEL_CHAOS_OPERATOR_LOCK : formatActiveOperators(active.items)}
        </span>
      </div>
      <div
        className="mt-3 rounded border border-zinc-800/50 bg-black/40 p-3 font-data text-xs"
        data-testid="active-shield-breakdown"
      >
        <p className="mb-2 text-[10px] uppercase tracking-wider text-zinc-500">
          Active Shield Breakdown
        </p>
        <ul className="space-y-1.5 text-zinc-400">
          {shieldLines.map((line) => (
            <li key={line.label} className="flex flex-wrap items-baseline gap-x-2">
              <span className="text-zinc-500">├─</span>
              <ShieldBreakdownLabel label={line.label} />
              <span className={SHIELD_STATUS_TEXT_CLASS[version]}>: [ {line.status} ]</span>
              {line.detail ? (
                <span className="text-zinc-500">{line.detail}</span>
              ) : null}
            </li>
          ))}
          <li className="flex flex-wrap items-baseline gap-x-2" data-testid="r15-leverage-cap-breakdown">
            <span className="text-zinc-500">└─</span>
            <span className="text-zinc-300">{R15_BREAKDOWN_LINE.label}</span>
            <span className={SHIELD_STATUS_TEXT_CLASS[version]}>: [ {R15_BREAKDOWN_LINE.status} ]</span>
            <span className="text-zinc-500">{R15_BREAKDOWN_LINE.detail}</span>
          </li>
        </ul>
      </div>
    </section>
  );
}

export default ScaleDownCombobox;
