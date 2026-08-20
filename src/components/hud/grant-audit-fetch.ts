/** Grant audit client fetch — stale cache fallback on 429 / transient errors. */
import type { ArbitrumCitadelRiskMetrics } from "../../routes/grant-audit-lib/grant-audit-citadel-metrics";
import type { HlTelemetryMetrics } from "../../routes/grant-audit-lib/grant-audit.types";
import type { SepoliaDualLegProof } from "../../routes/grant-audit-lib/sepolia-dual-leg-proof.types";
import type { ZeroDevAaGatewayBadgeStatus } from "../../adapters/arbitrum/zerodev-aa/zerodev-aa-gate";
import type { SequencerHealthMetrics } from "../../services/risk/sequencer-guard";
import { buildGrantAuditClientFallbackPayload } from "./grant-audit-client-fallback";

export type GrantAuditClientPayload = {
  arbitrumCitadel?: ArbitrumCitadelRiskMetrics;
  hlTelemetry?: HlTelemetryMetrics;
  sequencerHealth?: SequencerHealthMetrics | null;
  l1GasSurcharge?: ArbitrumCitadelRiskMetrics["l1GasSurcharge"];
  sepoliaDualLegProof?: SepoliaDualLegProof | null;
  zeroDevAaGateway?: ZeroDevAaGatewayBadgeStatus;
  success?: boolean;
  error?: string;
};

let lastGoodAudit: GrantAuditClientPayload | null = null;

export function getGrantAuditClientCache(): GrantAuditClientPayload | null {
  return lastGoodAudit;
}

export function __setGrantAuditClientCacheForTests(payload: GrantAuditClientPayload | null): void {
  lastGoodAudit = payload;
}

export function __resetGrantAuditClientCacheForTests(): void {
  lastGoodAudit = null;
}

/** SWR fetcher — never surfaces unavailable text when stale cache exists. */
export async function fetchGrantAuditWithCache(url: string): Promise<GrantAuditClientPayload> {
  try {
    const res = await fetch(url, { cache: "no-store" });
    const json = (await res.json()) as GrantAuditClientPayload;
    if (res.ok) {
      lastGoodAudit = json;
      return json;
    }
    if (lastGoodAudit) return lastGoodAudit;
    return buildGrantAuditClientFallbackPayload();
  } catch {
    if (lastGoodAudit) return lastGoodAudit;
    return buildGrantAuditClientFallbackPayload();
  }
}
