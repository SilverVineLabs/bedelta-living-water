/** Grant Audit — /api/logs zero-Δ & live mainnet tx hash panel. */
import type { ReactNode } from "react";
import { BRAND_ZERO_DELTA_LABEL } from "../config/constants";
import { resolveGrantMainnetExecutionEntries } from "../data/grant-mainnet-execution-ssot";
import {
  GMX_CITADEL_PANEL_CLASS,
  GMX_METRIC_OK_CLASS,
  GMX_MUTED_TEXT_CLASS,
} from "./hud/gmx-citadel-theme";
import { GrantExecutionTxList } from "./grant-execution-tx-list";
import type { GrantAuditLogPayload } from "./grant-audit-page-types";
import { ZeroDeltaLabel } from "./ui/brand-delta-ui";

export interface GrantAuditLogsPanelProps {
  logsPath: string;
  payload: GrantAuditLogPayload | null;
  error: string | null;
  className?: string;
}

export function GrantAuditLogsPanel({
  logsPath,
  payload,
  error,
  className = "",
}: GrantAuditLogsPanelProps): ReactNode {
  const entries = resolveGrantMainnetExecutionEntries(payload?.txHashes ?? []);
  const zeroDelta = payload?.zeroDelta;

  return (
    <section
      className={`${GMX_CITADEL_PANEL_CLASS} ${className}`}
      data-testid="grant-audit-logs-panel"
    >
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
        <h2 className={`font-mono text-xs font-semibold tracking-[0.16em] uppercase ${GMX_METRIC_OK_CLASS}`}>
          Execution History · Tx Hashes · {BRAND_ZERO_DELTA_LABEL}
        </h2>
        <a href={logsPath} target="_blank" rel="noopener noreferrer" className={`font-mono text-[11px] ${GMX_MUTED_TEXT_CLASS} hover:text-[#e2e8f0]`}>
          Open /api/logs ↗
        </a>
      </div>

      {error ? (
        <p className="font-data text-[12px] text-amber-300/90">Logs unavailable: {error}</p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-3">
          <div>
            <p className={`font-data text-[10px] uppercase ${GMX_MUTED_TEXT_CLASS}`}>
              <ZeroDeltaLabel />
            </p>
            <p className={`font-mono text-sm ${GMX_METRIC_OK_CLASS}`} data-testid="grant-audit-zero-delta">
              {zeroDelta?.proven
                ? `PROVEN · |Δ|≤${(zeroDelta.maxAbsNetDelta ?? 0).toFixed(6)}`
                : payload
                  ? "PENDING / NO SAMPLES"
                  : "LOADING…"}
            </p>
          </div>
          <div>
            <p className={`font-data text-[10px] uppercase ${GMX_MUTED_TEXT_CLASS}`}>Verified Testnet Suite & Live Mainnet Order (OID: 513344575969)</p>
            <p className={`font-mono text-sm ${GMX_METRIC_OK_CLASS}`} data-testid="grant-audit-tx-count">
              {entries.length} live execution hash(es)
            </p>
          </div>
          <div>
            <p className={`font-data text-[10px] uppercase ${GMX_MUTED_TEXT_CLASS}`}>Fetched</p>
            <p className={`font-mono text-[11px] ${GMX_MUTED_TEXT_CLASS}`}>{payload?.fetchedAt ?? "—"}</p>
          </div>
        </div>
      )}

      <GrantExecutionTxList entries={entries} />
    </section>
  );
}

export default GrantAuditLogsPanel;
