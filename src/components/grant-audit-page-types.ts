/** Shared types for Grant Audit page. */

export interface GrantAuditLogPayload {
  success?: boolean;
  zeroDelta?: {
    proven: boolean;
    maxAbsNetDelta?: number;
    sampleCount?: number;
  };
  txHashes?: string[];
  executionHistory?: unknown[];
  fetchedAt?: string;
  error?: string;
}

export interface GrantAuditPageProps {
  className?: string;
}
