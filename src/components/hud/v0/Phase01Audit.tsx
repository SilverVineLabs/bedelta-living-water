import { FileText, Radio } from "lucide-react";
import { useState, type ReactNode } from "react";
import { Phase01ArmorIndexCard } from "./Phase01ArmorIndexCard";
import { Phase01GmxArbitrumProofCard } from "./Phase01GmxArbitrumProofCard";
import { Phase01MainnetProofCard } from "./Phase01MainnetProofCard";
import { Phase01SepoliaProofCard } from "./Phase01SepoliaProofCard";
import {
  exportPhase01CitadelAuditCertificate,
} from "./phase01-audit-certificate-export";
import type { FullGrantAuditVenueView } from "./grant-audit-view-types";

export interface Phase01AuditProps {
  view: FullGrantAuditVenueView;
}

function PhaseTag({ index, title }: { index: string; title: string }): ReactNode {
  return (
    <div className="flex items-center gap-3">
      <span className="rounded border border-primary/40 bg-primary/10 px-2 py-1 font-mono text-[10px] font-semibold tracking-widest text-primary">
        PHASE {index}
      </span>
      <h2 className="text-pretty font-mono text-sm font-semibold uppercase tracking-wide text-foreground">
        {title}
      </h2>
    </div>
  );
}

export function Phase01Audit({ view }: Phase01AuditProps): ReactNode {
  const [isInspectorGuideOpen, setIsInspectorGuideOpen] = useState(false);

  return (
    <section
      className="flex flex-col gap-4 rounded-lg border border-border bg-card p-4"
      data-testid="grant-audit-phase-01-audit"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
          <PhaseTag index="01" title="GMX v2 Citadel Audit & On-Chain Proofs" />
          <button
            type="button"
            data-testid="grant-audit-inspector-guide-toggle"
            aria-pressed={isInspectorGuideOpen}
            onClick={() => setIsInspectorGuideOpen((open) => !open)}
            className={[
              "inline-flex w-fit items-center rounded border px-2.5 py-1 font-mono text-[10px] font-medium tracking-wide transition-shadow",
              isInspectorGuideOpen
                ? "border-[#2d42fc] bg-[#2d42fc]/20 text-[#2d42fc] shadow-[0_0_16px_rgba(45,66,252,0.45)]"
                : "border-primary/40 bg-primary/10 text-primary shadow-[0_0_12px_-4px_var(--color-primary)]",
            ].join(" ")}
          >
            [ ℹ️ Inspector Guide: How SliverVine Protects GMX ]
          </button>
        </div>
        <div className="inline-flex w-fit items-center gap-2 rounded-md border border-primary/50 bg-primary/10 px-3 py-1.5">
          <span className="relative flex size-2" aria-hidden="true">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-primary opacity-75" />
            <span className="relative inline-flex size-2 rounded-full bg-primary" />
          </span>
          <Radio className="size-3.5 text-primary" aria-hidden="true" />
          <span className="font-mono text-[11px] font-medium tracking-tight text-foreground">
            Arbitrum RPC: {view.arbitrumRpcLabel} | HL Session WS: {view.hlSessionWsLabel}
          </span>
        </div>
      </div>
      <Phase01ArmorIndexCard view={view} inspectorGuideOpen={isInspectorGuideOpen} />
      <p
        className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground"
        data-testid="grant-audit-dual-leg-anchor-label"
      >
        Dual-Leg Δ-Neutral Hedge · GMX v2 GM Pool (Arbitrum) + HL ETH Short (Mainnet)
      </p>
      <div className="grid gap-3 md:grid-cols-2">
        <Phase01GmxArbitrumProofCard />
        <Phase01MainnetProofCard />
      </div>
      <Phase01SepoliaProofCard view={view} />
      <button
        type="button"
        data-testid="grant-audit-export-gmx-certificate"
        onClick={() => void exportPhase01CitadelAuditCertificate(view)}
        className="inline-flex w-full items-center justify-center gap-2 rounded-md border border-primary bg-primary px-4 py-2.5 font-mono text-xs font-medium text-primary-foreground shadow-[0_0_16px_rgba(45,66,252,0.35)]"
      >
        <FileText className="size-4" aria-hidden="true" />
        [ 📥 Export GMX v2 Audit Certificate (.json) ]
      </button>
    </section>
  );
}
