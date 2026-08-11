import type { ReactNode } from "react";

export type MetricProvenance =
  | "ONCHAIN_VERIFIED"
  | "LIVE_ONCHAIN"
  | "LIVE_RPC"
  | "LIVE_RPC_DATASTORE_OK"
  | "VERIFIED_TESTNET_LOGS"
  | "SEPOLIA_TX_PENDING"
  | "SWR_CACHED"
  | "ESTIMATED_PROJECTION";

const PROVENANCE_LABEL: Record<MetricProvenance, string> = {
  ONCHAIN_VERIFIED: "ONCHAIN VERIFIED",
  LIVE_ONCHAIN: "LIVE ONCHAIN",
  LIVE_RPC: "LIVE RPC",
  LIVE_RPC_DATASTORE_OK: "LIVE RPC DATASTORE OK",
  VERIFIED_TESTNET_LOGS: "VERIFIED TESTNET LOGS",
  SEPOLIA_TX_PENDING: "SEPOLIA TX PENDING",
  SWR_CACHED: "SWR CACHED",
  ESTIMATED_PROJECTION: "ESTIMATED PROJECTION",
};

const PROVENANCE_STYLE: Record<MetricProvenance, string> = {
  ONCHAIN_VERIFIED: "border-emerald-400/40 bg-emerald-950/30 text-emerald-300",
  LIVE_ONCHAIN: "border-emerald-400/40 bg-emerald-950/30 text-emerald-300",
  LIVE_RPC: "border-primary/40 bg-primary/10 text-primary",
  LIVE_RPC_DATASTORE_OK: "border-primary/40 bg-primary/10 text-primary",
  VERIFIED_TESTNET_LOGS: "border-emerald-400/40 bg-emerald-950/30 text-emerald-300",
  SEPOLIA_TX_PENDING: "border-dashed border-zinc-500/50 bg-zinc-900/30 text-zinc-500",
  SWR_CACHED: "border-amber-400/40 bg-amber-950/30 text-amber-300",
  ESTIMATED_PROJECTION: "border-zinc-500/40 bg-zinc-900/40 text-zinc-400",
};

export interface MetricProvenanceBadgeProps {
  source?: MetricProvenance;
  /** Alias for `source` — e.g. mode="ESTIMATED_PROJECTION". */
  mode?: MetricProvenance;
}

export function MetricProvenanceBadge({ source, mode }: MetricProvenanceBadgeProps): ReactNode {
  const resolved = mode ?? source ?? "ESTIMATED_PROJECTION";
  return (
    <span
      data-testid={`grant-audit-provenance-${resolved.toLowerCase().replace(/_/g, "-")}`}
      className={[
        "inline-flex rounded px-1.5 py-0.5 font-mono text-[8px] font-medium uppercase tracking-wide",
        PROVENANCE_STYLE[resolved],
      ].join(" ")}
    >
      {PROVENANCE_LABEL[resolved]}
    </span>
  );
}

export function resolveTvlProvenance(secured: boolean, arbitrumRpcLabel: string): MetricProvenance {
  if (secured) return "ONCHAIN_VERIFIED";
  if (arbitrumRpcLabel.includes("SWR FALLBACK")) return "SWR_CACHED";
  return "LIVE_RPC";
}

export function resolveDeltaProvenance(secured: boolean): MetricProvenance {
  return secured ? "ONCHAIN_VERIFIED" : "ESTIMATED_PROJECTION";
}
