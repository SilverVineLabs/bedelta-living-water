import { GAS_SURCHARGE_YIELD_RATIO } from "../../../services/risk/arbitrum-gas-guard";
import type { ArbitrumCitadelRiskMetrics } from "../../../routes/grant-audit-lib/grant-audit-citadel-metrics";
import type { HlTelemetryMetrics } from "../../../routes/grant-audit-lib/grant-audit.types";
import type { SepoliaDualLegProof } from "../../../routes/grant-audit-lib/sepolia-dual-leg-proof.types";
import type { SequencerHealthMetrics } from "../../../services/risk/sequencer-guard";
import type { GrantAuditClientPayload } from "./grant-audit-fetch";

export const GRANT_AUDIT_CURL =
  "curl bedeltawater.slivervine.xyz/api/grant-audit | jq .arbitrumCitadel" as const;

export const GAS_CAP_PCT = GAS_SURCHARGE_YIELD_RATIO * 100;

/** Pure grant-audit view resolver input — replaces legacy React hook return type. */
export interface GrantAuditViewInput {
  c?: ArbitrumCitadelRiskMetrics | null;
  hl?: HlTelemetryMetrics | null;
  pollSeq?: number;
  lagMs?: number | null;
  seq?: SequencerHealthMetrics | null;
  gas?: ArbitrumCitadelRiskMetrics["l1GasSurcharge"] | null;
  resolved?: GrantAuditClientPayload | Record<string, unknown> | null;
  lagHot?: boolean;
  gasPct?: number | null;
  gasFill?: number | string;
  lagPct?: number;
  graceLeft?: number | null;
  sepoliaDualLegProof?: SepoliaDualLegProof | null;
}
