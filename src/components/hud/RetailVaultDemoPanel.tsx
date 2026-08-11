/** Read-only BeΔ Zero-Delta Vault — live SSOT yield telemetry bindings. */
import type { ReactNode } from "react";
import { useState } from "react";
import { MDD_DRAWDOWN_GUARD_ACTIVE_LABEL, MDD_GUARD_SCOPE_NOTE } from "../../config/constants";
import type { RetailVaultYieldTelemetry } from "../../services/retail-vault-yield-telemetry";
import { DeltaNeutralLabel } from "../ui/brand-delta-ui";
import {
  GMX_ACCENT_TEXT_CLASS,
  GMX_CITADEL_PANEL_CLASS,
  GMX_MUTED_TEXT_CLASS,
  GMX_OFFWHITE_TEXT_CLASS,
  GMX_ROLE_ACTIVE_CLASS,
} from "./gmx-citadel-theme";
import { YieldAlertSubscribeModal } from "./YieldAlertSubscribeModal";

export interface RetailVaultDemoPanelProps extends RetailVaultYieldTelemetry {
  className?: string;
}

export function RetailVaultDemoPanel({
  className = "",
  monitoredTvlUsd,
  gmxPoolApyPct,
  fundingAprPct,
  netYieldBps,
  maxDrawdownPct,
}: RetailVaultDemoPanelProps): ReactNode {
  const [connectHint, setConnectHint] = useState<string | null>(null);

  return (
    <section className={`${GMX_CITADEL_PANEL_CLASS} ${className}`} data-testid="retail-vault-demo-panel">
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
        <h2 className={`font-mono text-xs font-semibold tracking-[0.16em] uppercase ${GMX_ACCENT_TEXT_CLASS}`}>
          BeΔ <DeltaNeutralLabel /> Vault · Read-Only Demo
        </h2>
        <span className={`font-data text-[10px] ${GMX_MUTED_TEXT_CLASS}`}>GMX v2 GM Pool · Arbitrum One</span>
      </div>

      <p className={`mb-4 font-data text-[12px] leading-relaxed ${GMX_MUTED_TEXT_CLASS}`}>
        Live Citadel telemetry sleeve — spot-perp hedge metrics from grant-audit SSOT bindings.
      </p>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          label="GM Pool Yield"
          value={`${gmxPoolApyPct.toFixed(2)}%`}
          sub="Live SSOT · swap-fee probe"
          testId="retail-vault-gmx-pool-apy"
        />
        <MetricCard
          label="Funding APR"
          value={`${fundingAprPct.toFixed(1)}%`}
          sub="Live SSOT · HL carry leg"
          testId="retail-vault-funding-apr"
        />
        <MetricCard
          label="Drawdown Guard"
          value={`${maxDrawdownPct.toFixed(2)}%`}
          sub={`Max observed MDD · ${MDD_GUARD_SCOPE_NOTE}`}
          accent="ok"
        />
        <MetricCard
          label="Net Yield"
          value={`+${netYieldBps} bps`}
          sub="Citadel-adjusted"
          testId="retail-vault-net-yield-bps"
        />
      </div>

      <div
        className="mt-4 rounded border border-[#1d2842] bg-[#090d16]/70 px-3 py-2"
        data-testid="vault-drawdown-guard-badge"
      >
        <p className={`font-data text-[10px] uppercase ${GMX_OFFWHITE_TEXT_CLASS}`}>{MDD_DRAWDOWN_GUARD_ACTIVE_LABEL}</p>
        <p className={`font-mono text-[11px] ${GMX_MUTED_TEXT_CLASS}`}>
          Dynamic Max SL + soil resistance — monitored path holds {maxDrawdownPct.toFixed(2)}% MDD · {MDD_GUARD_SCOPE_NOTE}
        </p>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded border border-[#1d2842] bg-[#090d16]/50 px-3 py-2">
        <div>
          <p className={`font-data text-[10px] uppercase ${GMX_MUTED_TEXT_CLASS}`}>Monitored Citadel TVL</p>
          <p
            className={`font-mono text-sm ${GMX_OFFWHITE_TEXT_CLASS}`}
            data-testid="retail-vault-monitored-tvl"
          >
            ${monitoredTvlUsd.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>
        <button
          type="button"
          data-testid="vault-connect-wallet-cta"
          className={`rounded px-4 py-2 font-mono text-[11px] ${GMX_ROLE_ACTIVE_CLASS}`}
          onClick={() =>
            setConnectHint("Wallet connect opens on user action — read-only demo remains visible.")
          }
        >
          Connect Wallet to Deposit
        </button>
      </div>

      {connectHint ? (
        <p className={`mt-2 font-data text-[11px] ${GMX_MUTED_TEXT_CLASS}`} data-testid="vault-connect-hint">
          {connectHint}
        </p>
      ) : null}

      <YieldAlertSubscribeModal className="mt-4" />

      <p className={`mt-3 font-data text-[10px] ${GMX_MUTED_TEXT_CLASS}`}>
        Read-only view-first UX — no wallet signature required to browse live telemetry.
      </p>
    </section>
  );
}

function MetricCard(props: {
  label: string;
  value: string;
  sub: string;
  accent?: "ok" | "default";
  testId?: string;
}): ReactNode {
  const valueCls = props.accent === "ok" ? GMX_OFFWHITE_TEXT_CLASS : GMX_ACCENT_TEXT_CLASS;
  return (
    <div className="rounded border border-[#1d2842] bg-[#090d16]/60 px-3 py-2">
      <p className={`font-data text-[10px] uppercase ${GMX_MUTED_TEXT_CLASS}`}>{props.label}</p>
      <p
        className={`font-mono text-lg font-semibold ${valueCls}`}
        data-testid={props.testId}
      >
        {props.value}
      </p>
      <p className={`font-data text-[10px] ${GMX_MUTED_TEXT_CLASS}`}>{props.sub}</p>
    </div>
  );
}

export default RetailVaultDemoPanel;
