import { afterEach, describe, expect, it, vi } from "vitest";
import { handleGrantAuditRequest } from "../../src/routes/grant-audit";
import { __resetGrantAuditResponseCacheForTests } from "../../src/api/routes/grant-audit";
import { buildArbitrumCitadelRiskMetrics } from "../../src/routes/grant-audit-lib/grant-audit-citadel-metrics";
import { GMX_V2_DATASTORE } from "../../src/adapters/gmx";
import { __resetGmxDataStoreStatusCacheForTests, __setGmxDataStoreStatusCacheForTests } from "../../src/routes/grant-audit-lib/grant-audit-gmx-datastore";
import type { Env } from "../../src/env";
import {
  __resetArbitrumGasGuardForTests,
  __setArbitrumGasGuardForTests,
} from "../../src/services/risk/arbitrum-gas-guard";
import {
  __resetSequencerGuardCacheForTests,
  __setSequencerProbeForTests,
  SEQUENCER_GRACE_SEC,
} from "../../src/services/risk/sequencer-guard";
import {
  __resetSoftConfirmationGuardForTests,
  __setSoftConfirmationProbeForTests,
} from "../../src/services/risk/soft-confirmation-guard";
import { __setCrossSpreadCacheForTests } from "../../src/services/yield/cross-spread";
import { buildGrantAuditPayload } from "../../src/routes/grant-audit";
import { mockKv } from "./grant-audit-fixtures";

afterEach(() => {
  __resetGrantAuditResponseCacheForTests();
  __resetSequencerGuardCacheForTests();
  __resetArbitrumGasGuardForTests();
  __resetSoftConfirmationGuardForTests();
  __setCrossSpreadCacheForTests(null);
  __resetGmxDataStoreStatusCacheForTests();
});

describe("grant-audit payload", () => {
  it("/api/grant-audit returns Zero-Trust payload", async () => {
    const env = {
      EXECUTION_LOGS_KV: mockKv({
        log_latest: JSON.stringify({ probeLatencyMs: 334 }),
        history_7d: JSON.stringify({ entries: [] }),
      }),
    } as Env;
    const res = await handleGrantAuditRequest(env);
    const body = (await res.json()) as {
      audit: string;
      citadel: { sessionClipUsd: number };
      l1BlockHash: string | null;
      fundingEpochBlockHeight: number | null;
      makerVolumeShare: number | null;
      thunderheadAuditUrl: string | null;
      arbitrumGasGuard: unknown;
      sequencerHealth: unknown;
      softConfirmationHealth: unknown;
      l1GasSurcharge: unknown;
      crossDexSpreadBps: number | null;
      arbitrumCitadel: { metricsBuildMs: number; dualVenueTvlUsd: number };
      gmxDataStoreStatus: {
        longBorrowRateHourly: number;
        shortBorrowRateHourly: number;
        source: string | null;
      };
      onChainProof: {
        network: string;
        dataStoreArbiscanUrl: string;
        verificationAnchor: string;
      };
    };
    expect(body.audit).toBe("ZERO_TRUST_GRANT");
    expect(body.citadel.sessionClipUsd).toBe(30);
    expect(body.l1BlockHash).toBeNull();
    expect(body.fundingEpochBlockHeight).toBeNull();
    expect(body.makerVolumeShare).toBeNull();
    expect(body.thunderheadAuditUrl).toBeNull();
    expect(body).toHaveProperty("arbitrumGasGuard");
    expect(body).toHaveProperty("sequencerHealth");
    expect(body).toHaveProperty("softConfirmationHealth");
    expect(body).toHaveProperty("l1GasSurcharge");
    expect(body.crossDexSpreadBps).toBeNull();
    expect(body.arbitrumCitadel.metricsBuildMs).toBeLessThan(50);
    expect(body.arbitrumCitadel.dualVenueTvlUsd).toBeCloseTo(1302.39, 1);
    expect(body.gmxDataStoreStatus.source).toBe("markets-info-fallback");
    expect(body.onChainProof.network).toBe("arbitrum-one");
    expect(body.onChainProof.dataStoreArbiscanUrl).toContain(GMX_V2_DATASTORE);
    expect(body.onChainProof.verificationAnchor).toContain("arbiscan:datastore:");
  });

  it("/api/grant-audit serializes cached Arbitrum Citadel metrics under 50ms", async () => {
    const now = Date.now();
    __setSequencerProbeForTests({
      answer: 0,
      startedAtSec: Math.floor(now / 1000) - 900,
      updatedAtSec: Math.floor(now / 1000),
      fetchedAtMs: now,
      safe: true,
      reason: null,
    });
    __setSoftConfirmationProbeForTests({
      l2LatestBlock: 1_000_020,
      l1FinalizedBatchBlock: 1_000_000,
      driftBlocks: 20,
      fetchedAtMs: now,
      safe: true,
      reason: null,
    });
    __setArbitrumGasGuardForTests({
      l1BaseFeeWei: 25_000_000_000n,
      l1SurchargeWei: 1_000_000_000_000_000n,
      l1SurchargeUsd: 0.002,
      targetYieldUsd: 0.03,
      gasYieldRatio: 0.0667,
      gasBlocked: false,
      oracleUpdatedAtMs: now,
      l2BlockTimestampMs: now,
      oracleLagMs: 100,
      oracleLagDeadlock: false,
      reason: null,
      fetchedAtMs: now,
    });
    __setCrossSpreadCacheForTests({
      symbol: "ETH",
      executionVenue: "hyperliquid",
      gmxLeg: {
        venue: "gmx-v2",
        fundingRateHourly: 0.00003,
        borrowRateHourly: 0.00001,
        netCarryHourly: 0.00002,
        grossApy: 0.1752,
      },
      executionLeg: {
        venue: "hyperliquid",
        fundingRateHourly: 0.000005,
        borrowRateHourly: 0,
        netCarryHourly: 0.000005,
        grossApy: 0.0438,
      },
      crossSpreadApy: 0.1314,
      crossSpreadBps: 1314,
      isSpreadProfitable: true,
      fetchedAt: new Date(now).toISOString(),
    });
    __setGmxDataStoreStatusCacheForTests({
      symbol: "ETH",
      marketToken: "0x70d95587d40A2caf56bd97485aB3Eec10Bee6336",
      longBorrowRateHourly: 0.000012,
      shortBorrowRateHourly: 0.000004,
      fundingRateHourly: 0.00003,
      source: "datastore",
      fetchedAt: new Date(now).toISOString(),
    });

    const t0 = Date.now();
    const payload = await buildGrantAuditPayload({
      EXECUTION_LOGS_KV: mockKv({
        log_latest: JSON.stringify({ probeLatencyMs: 12 }),
        history_7d: JSON.stringify({ entries: [] }),
      }),
    } as Env);
    expect(Date.now() - t0).toBeLessThan(50);

    expect(payload.sequencerHealth?.status).toBe("UP");
    expect(payload.sequencerHealth?.gracePeriodSec).toBe(SEQUENCER_GRACE_SEC);
    expect(payload.softConfirmationHealth?.driftBlocks).toBe(20);
    expect(payload.softConfirmationHealth?.status).toBe("SAFE");
    expect(payload.l1GasSurcharge?.surchargeBps).toBe(667);
    expect(payload.l1GasSurcharge?.oracleLagMs).toBe(100);
    expect(payload.l1GasSurcharge?.oracleLagDeadlock).toBe(false);
    expect(payload.arbitrumCitadel.oracleLagMs).toBe(100);
    expect(payload.arbitrumCitadel.oracleLagDeadlock).toBe(false);
    expect(payload.crossDexSpreadBps).toBe(1314);
    expect(payload.arbitrumCitadel.metricsBuildMs).toBeLessThan(50);
    expect(payload.gmxDataStoreStatus.source).toBe("datastore");
    expect(payload.gmxDataStoreStatus.longBorrowRateHourly).toBe(0.000012);
    expect(payload.gmxDataStoreStatus.shortBorrowRateHourly).toBe(0.000004);
    expect(payload.onChainProof.verificationAnchor).toContain("arbiscan:datastore:");
  });

  it("/api/grant-audit maps Arbitrum tx hashes to Arbiscan anchors", async () => {
    const txHash =
      "0x566a07f7eb77e71057e304261cd32d0106001fdd867b05e2fa32b34aaa7bc0fa";
    const env = {
      EXECUTION_LOGS_KV: mockKv({
        log_latest: JSON.stringify({
          l1BlockHash: "0xarbstored",
          fundingEpochBlockHeight: 987654,
          txHash,
        }),
        history_7d: JSON.stringify({ entries: [] }),
      }),
    } as Env;

    const res = await handleGrantAuditRequest(env);
    const body = (await res.json()) as {
      onChainProof: {
        txHash: string;
        txArbiscanUrl: string;
        blockArbiscanUrl: string;
        verificationAnchor: string;
      };
    };
    expect(body.onChainProof.txHash).toBe(txHash);
    expect(body.onChainProof.txArbiscanUrl).toBe(`https://arbiscan.io/tx/${txHash}`);
    expect(body.onChainProof.blockArbiscanUrl).toBe("https://arbiscan.io/block/987654");
    expect(body.onChainProof.verificationAnchor).toBe(`arbiscan:tx:${txHash}`);
  });

  it("/api/grant-audit exposes Thunderhead link for on-chain fill hashes", async () => {
    const txHash =
      "0x566a07f7eb77e71057e304261cd32d0106001fdd867b05e2fa32b34aaa7bc0fa";
    const env = {
      EXECUTION_LOGS_KV: mockKv({
        log_latest: JSON.stringify({
          l1BlockHash: "0xl2stored",
          fundingEpochBlockHeight: 12345,
          spotFill: { responseHash: txHash, px: 100, sz: 0.3, crossed: false },
          perpFill: { responseHash: txHash, px: 100, sz: 0.3, crossed: false },
        }),
        history_7d: JSON.stringify({ entries: [] }),
      }),
    } as Env;

    const res = await handleGrantAuditRequest(env);
    const body = (await res.json()) as {
      thunderheadAuditUrl: string;
      makerVolumeShare: number;
      l1BlockHash: string;
      fundingEpochBlockHeight: number;
      txHashes: string[];
    };
    expect(body.txHashes).toContain(txHash);
    expect(body.thunderheadAuditUrl).toBe(
      `https://stats.hyperliquid.xyz/tx/${txHash}`,
    );
    expect(body.makerVolumeShare).toBe(1);
    expect(body.l1BlockHash).toBe("0xl2stored");
    expect(body.fundingEpochBlockHeight).toBe(12345);
  });

  it("buildArbitrumCitadelRiskMetrics stays cache-only and fast", () => {
    const t0 = Date.now();
    const metrics = buildArbitrumCitadelRiskMetrics();
    expect(Date.now() - t0).toBeLessThan(50);
    expect(metrics.metricsBuildMs).toBeLessThan(50);
  });
});
