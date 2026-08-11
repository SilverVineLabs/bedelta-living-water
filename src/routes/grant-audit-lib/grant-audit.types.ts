/** Grant audit — shared payload types. */
import type { ArbitrumGasGuardMetrics } from "../../services/risk/arbitrum-gas-guard";
import type { EscalationStatePayload } from "../../services/risk/escalation-logs";
import type { EngineModeStatus } from "../../middleware/engine-mode-router";
import type { ArbitrumCitadelRiskMetrics } from "./grant-audit-citadel-metrics";
import type { GmxDataStoreStatus } from "./grant-audit-gmx-datastore";
import type { GrantAuditOnChainProof } from "./grant-audit-onchain-proof";
import type { GmxBuilderProof } from "./gmx-builder-proof";
import type { ProvenanceVerifiedTrades } from "./grant-audit-provenance";
import type { SepoliaDualLegProof } from "./sepolia-dual-leg-proof.types";

export type { ArbitrumCitadelRiskMetrics, EngineModeStatus, GmxBuilderProof, GmxDataStoreStatus, GrantAuditOnChainProof, ProvenanceVerifiedTrades, SepoliaDualLegProof };

export interface HlTelemetryMetrics {
  totalUsd: number;
  walletAHlTotalUsd: number | null;
  walletBHlTotalUsd: number | null;
  fetchedAt: string | null;
}

export interface ZeroDeltaProof {
  proven: boolean;
  maxAbsNetDelta: number;
  sampleCount: number;
  reason: string;
}

export interface GrantAuditPayload {
  success: boolean;
  audit: "ZERO_TRUST_GRANT";
  citadel: {
    probeLatencyMs: number | null;
    soilResistanceOk: boolean | null;
    sessionClipUsd: number;
    maxDrawdownPct: number;
  };
  zeroDelta: ZeroDeltaProof;
  txHashes: string[];
  executionHistory: unknown[];
  latest: unknown;
  history: unknown;
  escalationState: EscalationStatePayload;
  l1BlockHash: string | null;
  fundingEpochBlockHeight: number | null;
  makerVolumeShare: number | null;
  thunderheadAuditUrl: string | null;
  arbitrumGasGuard: ArbitrumGasGuardMetrics | null;
  sequencerHealth: ArbitrumCitadelRiskMetrics["sequencerHealth"];
  softConfirmationHealth: ArbitrumCitadelRiskMetrics["softConfirmationHealth"];
  l1GasSurcharge: ArbitrumCitadelRiskMetrics["l1GasSurcharge"];
  crossDexSpreadBps: number | null;
  arbitrumCitadel: ArbitrumCitadelRiskMetrics;
  hlTelemetry: HlTelemetryMetrics;
  gmxDataStoreStatus: GmxDataStoreStatus;
  onChainProof: GrantAuditOnChainProof;
  engineMode: EngineModeStatus;
  fetchedAt: string;
  sepoliaDualLegProof?: SepoliaDualLegProof | null;
  provenanceVerified?: ProvenanceVerifiedTrades | null;
  gmxBuilderProof: GmxBuilderProof;
  error?: string;
}
