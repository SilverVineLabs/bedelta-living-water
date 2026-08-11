import { afterEach, describe, expect, it, vi } from "vitest";
import { GMX_SWR_PROOF_LABEL } from "../../src/services/adapters/gmx-swr-guard";
import { GRANT_AUDIT_LIVE_COMBINED_TVL_USD } from "../../src/services/dual-wallet-tvl-fallback";
import {
  GRANT_AUDIT_SWR_ARBITRUM_RPC_MS,
  GRANT_AUDIT_SWR_ORACLE_LAG_MS,
  GRANT_AUDIT_SWR_SEQUENCER_STATUS,
} from "../../src/routes/grant-audit-lib/grant-audit-swr-telemetry";
import {
  buildGrantAuditPayload,
  handleGrantAuditRequest,
} from "../../src/routes/grant-audit";
import * as guardRefresh from "../../src/routes/grant-audit-lib/grant-audit-guard-refresh";
import type { Env } from "../../src/env";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("/api/grant-audit fetch resilience", () => {
  it("returns HTTP 200 SWR cached fallback when guard refresh throws", async () => {
    vi.spyOn(guardRefresh, "ensureGrantAuditGuardsFresh").mockRejectedValue(
      new Error("RPC timeout"),
    );

    const res = await handleGrantAuditRequest({} as Env);
    const body = (await res.json()) as {
      success: boolean;
      citadel: { probeLatencyMs: number | null };
      arbitrumCitadel: {
        dualVenueTvlUsd: number;
        gmxSwrIsCached: boolean;
        gmxSwrProofLabel: string;
        oracleLagMs: number | null;
      };
      sequencerHealth: { status: string } | null;
      error?: string;
    };

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.citadel.probeLatencyMs).toBe(GRANT_AUDIT_SWR_ARBITRUM_RPC_MS);
    expect(body.sequencerHealth?.status).toBe(GRANT_AUDIT_SWR_SEQUENCER_STATUS);
    expect(body.arbitrumCitadel.oracleLagMs).toBe(GRANT_AUDIT_SWR_ORACLE_LAG_MS);
    expect(body.arbitrumCitadel.dualVenueTvlUsd).toBe(GRANT_AUDIT_LIVE_COMBINED_TVL_USD);
    expect(body.arbitrumCitadel.gmxSwrIsCached).toBe(true);
    expect(body.arbitrumCitadel.gmxSwrProofLabel).toBe(GMX_SWR_PROOF_LABEL);
  });

  it("returns HTTP 200 SWR cached fallback when EXECUTION_LOGS_KV missing", async () => {
    const payload = await buildGrantAuditPayload({} as Env);
    expect(payload.success).toBe(true);
    expect(payload.citadel.probeLatencyMs).toBe(GRANT_AUDIT_SWR_ARBITRUM_RPC_MS);
    expect(payload.sequencerHealth?.status).toBe(GRANT_AUDIT_SWR_SEQUENCER_STATUS);
    expect(payload.arbitrumCitadel.oracleLagMs).toBe(GRANT_AUDIT_SWR_ORACLE_LAG_MS);
    expect(payload.arbitrumCitadel.gmxSwrIsCached).toBe(true);
    expect(payload.arbitrumCitadel.gmxSwrProofLabel).toBe(GMX_SWR_PROOF_LABEL);
    expect(payload.error).toContain("EXECUTION_LOGS_KV");
  });
});
