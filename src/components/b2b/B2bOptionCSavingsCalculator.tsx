/** Option C vs traditional SaaS — simulated fund TVL slider ($1M–$10M). */
import { useMemo, useState, type ReactNode } from "react";

const TVL_MIN_M = 1;
const TVL_MAX_M = 10;
const OPTION_C_MONTHLY_USD = 2_500;
/** Traditional SaaS: $4.5k base + 2 bps/mo on AUM. */
const SAAS_BASE_MONTHLY_USD = 4_500;
const SAAS_BPS_MONTHLY = 0.0002;

function formatUsd(n: number): string {
  return `$${n.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
}

export function estimateOptionCMonthlySavings(tvlUsd: number): number {
  const saas = SAAS_BASE_MONTHLY_USD + tvlUsd * SAAS_BPS_MONTHLY;
  return Math.max(0, saas - OPTION_C_MONTHLY_USD);
}

export function B2bOptionCSavingsCalculator(): ReactNode {
  const [tvlM, setTvlM] = useState(5);
  const tvlUsd = tvlM * 1_000_000;
  const monthlySavings = useMemo(() => estimateOptionCMonthlySavings(tvlUsd), [tvlUsd]);
  const annualSavings = monthlySavings * 12;

  return (
    <section
      className="mt-3 rounded-md border border-primary/35 bg-primary/5 p-4"
      data-testid="b2b-option-c-savings-calculator"
    >
      <label
        htmlFor="b2b-option-c-tvl-slider"
        className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground"
      >
        Simulated Fund TVL: $1M - $10M
      </label>
      <div className="mt-2 flex items-center gap-3">
        <input
          id="b2b-option-c-tvl-slider"
          type="range"
          min={TVL_MIN_M}
          max={TVL_MAX_M}
          step={1}
          value={tvlM}
          onChange={(e) => setTvlM(Number(e.target.value))}
          className="w-full accent-primary"
          data-testid="b2b-option-c-tvl-slider"
        />
        <span className="shrink-0 font-mono text-[11px] font-semibold text-foreground" data-testid="b2b-option-c-tvl-value">
          ${tvlM}M
        </span>
      </div>
      <p className="mt-3 font-mono text-[10px] text-muted-foreground">
        Option C flat {formatUsd(OPTION_C_MONTHLY_USD)}/mo vs traditional SaaS
      </p>
      <p
        className="mt-1 font-mono text-[11px] font-semibold text-emerald-400"
        data-testid="b2b-option-c-savings"
      >
        Est. Fee Savings: {formatUsd(monthlySavings)}/mo · {formatUsd(annualSavings)}/yr
      </p>
    </section>
  );
}
