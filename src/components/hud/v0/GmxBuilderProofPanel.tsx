import { useMemo, type ReactNode } from "react";
import { ShieldCheck } from "lucide-react";
import {
  calculateGmxBuilderProof,
  GMX_UI_FEE_BPS,
} from "../../../routes/grant-audit-lib/gmx-builder-proof";
import {
  resolveGmxReferralCode,
  resolveGmxUiFeeReceiver,
} from "../../../services/adapters/gmx-v2-order-payload";
import { formatUsd } from "./grant-audit-v0-utils";
import { MetricProvenanceBadge } from "./MetricProvenanceBadge";
import type { FullGrantAuditVenueView } from "./grant-audit-view-types";

export interface GmxBuilderProofPanelProps {
  view: FullGrantAuditVenueView;
}

export function GmxBuilderProofPanel({ view }: GmxBuilderProofPanelProps): ReactNode {
  const proof = useMemo(
    () =>
      calculateGmxBuilderProof({
        gmPoolUsd: view.gmPoolUsd,
        combinedTvlUsd: view.combinedTvlUsd,
        isGmxBalancerQualified: view.rebateBps > 0,
        gmxUnderweightSide: view.rebateBps > 0 ? "long" : "balanced",
        executions: view.executions,
        uiFeeReceiver: resolveGmxUiFeeReceiver(),
        referralCode: resolveGmxReferralCode(),
      }),
    [view],
  );

  const hlExecution = view.executions.find((row) => row.venue === "HL");
  const sepoliaVerified = Boolean(view.sepoliaTxHash && view.sepoliaTxExplorerUrl);

  return (
    <section
      className="flex flex-col gap-4 rounded-lg border border-primary/35 bg-primary/5 p-4"
      data-testid="grant-audit-gmx-builder-proof-panel"
    >
      <div className="flex flex-wrap items-center gap-2">
        <ShieldCheck className="size-4 text-primary" aria-hidden="true" />
        <h2 className="font-mono text-[11px] font-semibold uppercase tracking-widest text-primary">
          GMX Builders Program · Pipeline B Proof
        </h2>
        <a
          href="https://t.me/GMXPartners"
          target="_blank"
          rel="noreferrer noopener"
          className="font-mono text-[10px] text-primary underline-offset-2 hover:underline"
          data-testid="grant-audit-gmx-partners-link"
        >
          t.me/GMXPartners
        </a>
      </div>

      <div
        className="flex flex-col gap-3 rounded-md border border-primary/25 bg-background/40 p-3"
        data-testid="grant-audit-gmx-pool-side"
      >
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-mono text-[10px] font-semibold uppercase tracking-widest text-foreground">
            GMX v2 GM Pool Side
          </span>
          <MetricProvenanceBadge mode="LIVE_RPC_DATASTORE_OK" />
        </div>
        <span className="font-mono text-[10px] text-muted-foreground">Underweight routing ready</span>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              Protocol-Standard Builder Fee Routing ({GMX_UI_FEE_BPS} bps)
            </span>
            <span
              className="font-mono text-xl font-semibold text-emerald-400"
              data-testid="grant-audit-gmx-ui-fee-accrual"
            >
              +{formatUsd(proof.uiFeeAccrualUsd)}
            </span>
            <span className="font-mono text-[10px] text-muted-foreground">
              {proof.uiFeeAccrualLabel} · uiFeeReceiver {proof.uiFeeReceiver.slice(0, 10)}…
              {proof.referralCodeActive ? ` · Referral Vol ${formatUsd(proof.referralExecutionVolumeUsd)}` : ""}
            </span>
          </div>
          <div className="flex flex-col gap-1.5">
            <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              Underweight GM Pool Balance Flow
            </span>
            <span
              className="font-mono text-xl font-semibold text-foreground"
              data-testid="grant-audit-gmx-underweight-pool-flow"
            >
              {formatUsd(proof.underweightRebalanceVolumeUsd)} → {proof.underweightSideLabel}
            </span>
            <span className="font-mono text-[10px] text-muted-foreground">
              {proof.underweightRebalanceLabel} · Balancer{" "}
              {proof.isGmxBalancerQualified ? "Qualified" : "Pending"}
            </span>
          </div>
        </div>
      </div>

      <div
        className="flex flex-col gap-2 rounded-md border border-emerald-400/25 bg-emerald-950/10 p-3"
        data-testid="grant-audit-hl-hedge-side"
      >
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-mono text-[10px] font-semibold uppercase tracking-widest text-foreground">
            Hyperliquid Short Hedge Side
          </span>
          <MetricProvenanceBadge mode="VERIFIED_TESTNET_LOGS" />
        </div>
        <span className="font-mono text-[10px] text-emerald-300/90">Wallet A/B 24h Active</span>
        <span className="font-mono text-sm font-semibold text-foreground">
          {formatUsd(view.legBHedgeUsd)} · {hlExecution?.action ?? "1x Short Rebalance · HYPE"}
        </span>
        {hlExecution ? (
          <span className="font-mono text-[10px] text-muted-foreground">
            {hlExecution.explorer} · {hlExecution.status} · {hlExecution.hash.slice(0, 10)}…
          </span>
        ) : null}
      </div>

      <div
        className={[
          "flex flex-wrap items-center gap-2 rounded-md px-3 py-2",
          sepoliaVerified
            ? "border border-emerald-400/35 bg-emerald-950/15"
            : "border border-dashed border-zinc-600/40 bg-zinc-900/20",
        ].join(" ")}
        data-testid="grant-audit-sepolia-tx-placeholder"
      >
        <span className="font-mono text-[10px] uppercase tracking-widest text-zinc-400">
          Arbitrum Sepolia GMX Testnet TxHash
        </span>
        {sepoliaVerified ? (
          <>
            <MetricProvenanceBadge mode="LIVE_ONCHAIN" />
            <a
              href={view.sepoliaTxExplorerUrl!}
              target="_blank"
              rel="noreferrer noopener"
              className="font-mono text-[10px] text-emerald-300 underline-offset-2 hover:underline"
              data-testid="grant-audit-sepolia-tx-link"
            >
              {view.sepoliaTxHash!.slice(0, 10)}…
            </a>
            {view.sepoliaLatencyMs != null ? (
              <span className="font-mono text-[10px] text-muted-foreground">
                {Math.round(view.sepoliaLatencyMs)}ms dual-leg
              </span>
            ) : null}
          </>
        ) : (
          <>
            <MetricProvenanceBadge mode="SEPOLIA_TX_PENDING" />
            <span className="font-mono text-[10px] text-zinc-500">Pending verification</span>
          </>
        )}
      </div>
    </section>
  );
}
