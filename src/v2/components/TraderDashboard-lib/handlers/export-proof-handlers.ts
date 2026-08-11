import {
  buildBatchConsoleHydrationLogs,
  buildGrantProofMarkdown,
  createSampleHistoricalBatch,
  exportDryRunPlaybookJson,
  exportNegativeProofsArtifact,
  exportSha256AuditCertificate,
  exportSilvervineTcaAuditProof,
  formatSha256VerificationAnchorLine,
} from "../../../../components/hud/Section1/section1-hud-engine-lib/section1-hud-engine-core";
import { createTerminalLog } from "../../LiveRiskTelemetryConsole";
import {
  appendLogs,
  MAX_TERMINAL_LOGS,
  resolveSelectedBatch,
} from "../trader-dashboard-log-utils";
import type { TraderDashboardHandlerDeps } from "./handler-types";

export function createExportProofHandlers(deps: TraderDashboardHandlerDeps) {
  const resolveExportBatch = () =>
    resolveSelectedBatch(deps.txBatches, deps.selectedBatchId) ??
    createSampleHistoricalBatch();

  const handleBatchSelect = (batchId: string) => {
    deps.setSelectedBatchId(batchId);
    const batch = resolveSelectedBatch(deps.txBatches, batchId);
    if (!batch) return;
    deps.setFeedPaused(true);
    const hydration = buildBatchConsoleHydrationLogs(batch).map((entry) =>
      createTerminalLog(entry.level, entry.message),
    );
    hydration.push(createTerminalLog("SYSTEM", formatSha256VerificationAnchorLine(batch)));
    deps.setTerminalLogs((prev) => [...hydration, ...prev].slice(-MAX_TERMINAL_LOGS));
  };

  const handleExportAudit = () => {
    const batch = resolveSelectedBatch(deps.txBatches, deps.selectedBatchId);
    if (!batch) return;
    exportSilvervineTcaAuditProof(batch, deps.soilResistanceLogs);
    appendLogs(deps.setTerminalLogs, [
      { level: "INFO", message: "AUDIT_EXPORT: silvervine_tca_audit_proof.json downloaded" },
    ]);
  };

  const handleCopyGrantProof = async () => {
    const batch = resolveSelectedBatch(deps.txBatches, deps.selectedBatchId);
    if (!batch) return;
    try {
      await navigator.clipboard.writeText(buildGrantProofMarkdown(batch));
      appendLogs(deps.setTerminalLogs, [
        { level: "INFO", message: "GRANT_PROOF: Markdown proof block copied to clipboard" },
      ]);
    } catch {
      appendLogs(deps.setTerminalLogs, [
        {
          level: "WARN",
          message: "GRANT_PROOF: Clipboard unavailable in this browser context",
        },
      ]);
    }
  };

  const handleExportAuditCertificate = () => {
    const batch = resolveExportBatch();
    exportSha256AuditCertificate(batch, deps.soilResistanceLogs);
    appendLogs(deps.setTerminalLogs, [
      {
        level: "INFO",
        message: "AUDIT_CERTIFICATE: silvervine_sha256_audit_certificate.json downloaded",
      },
    ]);
  };

  const handleExportDryRunPlaybook = () => {
    const batch = resolveExportBatch();
    exportDryRunPlaybookJson(batch, deps.soilResistanceLogs);
    appendLogs(deps.setTerminalLogs, [
      {
        level: "INFO",
        message: "DRY_RUN_PLAYBOOK: silvervine_dry_run_playbook.json downloaded",
      },
    ]);
  };

  const handleExportFailClosedProofs = () => {
    exportNegativeProofsArtifact();
    appendLogs(deps.setTerminalLogs, [
      {
        level: "INFO",
        message: "FAIL_CLOSED_PROOFS: negative-proofs-artifact.json downloaded",
      },
    ]);
  };

  return {
    handleBatchSelect,
    handleExportAudit,
    handleExportAuditCertificate,
    handleExportDryRunPlaybook,
    handleExportFailClosedProofs,
    handleCopyGrantProof,
  };
}
