import type { ReactNode } from "react";
import type { TradeNotionalTier } from "../../../data/verified-5tx";
import { fmtUsd2 } from "./section1-slippage-display";

export interface SlippageDualProgressBarProps {
  notional: TradeNotionalTier;
  baselineLossBps: number;
  savedBps: number;
  baselineLossUsd: number;
  savedUsd: number;
  forceUltraShield?: boolean;
  baselineAlarmFlash?: boolean;
}

export function SlippageDualProgressBar({
  notional,
  baselineLossBps,
  savedBps,
  baselineLossUsd,
  savedUsd,
  forceUltraShield = false,
  baselineAlarmFlash = false,
}: SlippageDualProgressBarProps): ReactNode {
  const total = Math.max(baselineLossBps + Math.max(savedBps, 0), 1);
  const baselinePct = Math.min(100, (baselineLossBps / total) * 100);
  const savedPct = Math.min(100, (Math.max(savedBps, 0) / total) * 100);
  const savedBarClass = forceUltraShield
    ? "bg-purple-500/80 shadow-[0_0_10px_rgba(168,85,247,0.45)]"
    : "bg-[#2d42fc]/80 shadow-[0_0_10px_rgba(45,66,252,0.35)]";
  const savedTextClass = forceUltraShield ? "text-purple-300" : "text-[#2d42fc]/90";

  return (
    <div
      className="mt-3 w-full space-y-2"
      data-testid="slippage-dual-progress"
      data-notional-tier={notional}
    >
      <div>
        <div className="mb-0.5 flex items-center justify-between font-mono text-[10px]">
          <span className="text-red-400/90">Baseline Loss (No Shield)</span>
          <span className="text-red-400/90">
            -{baselineLossBps.toFixed(2)} bps · -${fmtUsd2(baselineLossUsd)} USD
          </span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded bg-zinc-900/80">
          <div
            className={[
              "h-full rounded bg-red-500/70 transition-all duration-500",
              baselineAlarmFlash ? "animate-pulse" : "",
            ].join(" ")}
            style={{ width: `${baselinePct}%` }}
          />
        </div>
      </div>
      <div>
        <div className="mb-0.5 flex items-center justify-between font-mono text-[10px]">
          <span className={savedTextClass}>
            Santenmoku Saved
          </span>
          <span className={savedTextClass}>
            {savedBps >= 0 ? "+" : ""}
            {savedBps.toFixed(2)} bps · +${fmtUsd2(savedUsd)} USD
          </span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded bg-zinc-900/80">
          <div
            className={["h-full rounded transition-all duration-500", savedBarClass].join(" ")}
            style={{ width: `${savedPct}%` }}
          />
        </div>
      </div>
    </div>
  );
}
