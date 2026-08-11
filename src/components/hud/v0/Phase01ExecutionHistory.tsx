import { ExternalLink } from "lucide-react";
import { useState, type ReactNode } from "react";
import { GRANT_AUDIT_EXECUTION_PENDING_STATUS } from "../grant-ui-ssot";
import { ExecutionProofModal } from "./ExecutionProofModal";
import { formatUsd, truncateHash } from "./grant-audit-v0-utils";
import { TelemetryIndexValue } from "./TelemetryIndexValue";
import type { FullGrantAuditVenueView, GrantAuditExecution } from "./grant-audit-view-types";

export interface Phase01ExecutionHistoryProps {
  view: FullGrantAuditVenueView;
}

export function Phase01ExecutionHistory({ view }: Phase01ExecutionHistoryProps): ReactNode {
  const [selectedExec, setSelectedExec] = useState<GrantAuditExecution | null>(null);

  return (
    <>
      <div className="flex flex-col gap-2">
        <span className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
          Execution History · {view.executions.length} Verified Mainnet Hashes
        </span>
        <ul className="flex flex-col divide-y divide-border overflow-hidden rounded-md border border-border">
          {view.executions.map((exec) => (
            <li key={exec.id}>
              <button
                type="button"
                data-testid={`grant-audit-exec-item-${exec.id}`}
                onClick={() => setSelectedExec(exec)}
                className="flex w-full flex-col gap-2 bg-background px-4 py-3 text-left transition-colors hover:bg-primary/5 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex flex-col gap-0.5">
                  <div className="flex items-center gap-2">
                    <span
                      className="size-1.5 rounded-full bg-primary shadow-[0_0_6px_1px_var(--color-primary)]"
                      aria-hidden="true"
                    />
                    <span className="text-xs font-medium text-foreground">{exec.action}</span>
                    <span className="rounded border border-border px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider text-muted-foreground">
                      {exec.venue}
                    </span>
                  </div>
                  {exec.explorerUrl ? (
                    <span className="inline-flex w-fit items-center gap-1 font-mono text-[11px] text-muted-foreground">
                      {truncateHash(exec.hash)}
                      <ExternalLink className="size-3" aria-hidden="true" />
                      <span className="text-primary/70">{exec.explorer}</span>
                    </span>
                  ) : (
                    <span
                      className="inline-flex w-fit items-center rounded border border-amber-500/40 bg-amber-500/10 px-2 py-0.5 font-mono text-[10px] text-amber-200"
                      data-testid={`grant-audit-exec-pending-${exec.id}`}
                    >
                      {GRANT_AUDIT_EXECUTION_PENDING_STATUS}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 pl-4 sm:pl-0">
                  <span className="font-mono text-xs text-foreground">
                    {exec.amountUsd > 0 ? (
                      <TelemetryIndexValue value={exec.amountUsd} format={formatUsd} />
                    ) : (
                      "—"
                    )}
                  </span>
                  <span className="rounded border border-primary/40 bg-primary/10 px-2 py-0.5 font-mono text-[9px] font-medium tracking-wider text-primary">
                    {exec.status}
                  </span>
                </div>
              </button>
            </li>
          ))}
        </ul>
      </div>
      <ExecutionProofModal
        open={selectedExec != null}
        exec={selectedExec}
        view={view}
        onClose={() => setSelectedExec(null)}
      />
    </>
  );
}
