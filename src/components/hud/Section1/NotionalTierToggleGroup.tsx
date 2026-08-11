import type { ReactNode } from "react";
import {
  isNotionalTierAllowedForPreset,
  type TradeNotionalTier,
} from "../../../data/verified-5tx";
import { formatNotionalTogglePreview } from "../../../data/verified-5tx-display-helpers";
import { PRESET_CASCADE_THEMES } from "../scale-down-presets";
import type { OperatorUnlockVersion } from "../../../v2/admin/operator-matrix";
import { NOTIONAL_OPTIONS } from "./section1-notional-options";

export interface NotionalTierToggleGroupProps {
  notional: TradeNotionalTier;
  protocolVersion: OperatorUnlockVersion;
  onNotionalChange: (tier: TradeNotionalTier) => void;
}

export function NotionalTierToggleGroup({
  notional,
  protocolVersion,
  onNotionalChange,
}: NotionalTierToggleGroupProps): ReactNode {
  const visibleOptions = NOTIONAL_OPTIONS.filter((opt) =>
    isNotionalTierAllowedForPreset(protocolVersion, opt.tier),
  );

  return (
    <>
      <p className="mt-3 font-data text-[10px] uppercase tracking-wider text-zinc-500">
        Notional Trade Size
      </p>
      <div
        className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-3"
        role="group"
        aria-label="Trade notional switch"
        data-testid="notional-tier-toggle-group"
      >
        {visibleOptions.map((opt) => {
          const isActive = notional === opt.tier;
          return (
            <button
              key={opt.tier}
              type="button"
              onClick={() => onNotionalChange(opt.tier)}
              className={[
                "flex flex-col items-start rounded border px-2 py-1.5 font-data text-[10px] transition-all",
                isActive
                  ? PRESET_CASCADE_THEMES[protocolVersion].notionalActive
                  : "border-zinc-700 bg-zinc-900/60 text-zinc-500 hover:text-zinc-300",
              ].join(" ")}
            >
              <span>
                {isActive ? "🟢 " : ""}
                {opt.label}
              </span>
              <span className="mt-0.5 tabular-nums opacity-90">
                {formatNotionalTogglePreview(opt.tier, protocolVersion)}
              </span>
            </button>
          );
        })}
      </div>
    </>
  );
}
