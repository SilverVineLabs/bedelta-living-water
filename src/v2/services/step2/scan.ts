/**
 * Step 2 scan orchestrator — Hyperliquid meta + L2 weak-target selection.
 * @see universe.ts — meta parsing + assemble-matrix alignment
 * @see l2-features.ts — L2 depth probe (500ms fail-closed)
 */

import {
  MAX_TARGETS,
  STEP2_HANDSHAKE_TTL_MS,
  TIER2_L2_TOP_N,
} from "../../../config/constants";
import { postHlInfo } from "../../../services/exchanges/hl-l2-book";
import {
  FALLBACK_NATIVE_USDC_EARN_APY,
  probeNativeUsdcEarnApy,
} from "../../../services/hyperliquid/earn-probe";
import { computeNetFundingApy } from "../../../services/yield/apy-calculator";
import {
  fundingHourlyToGrossApy,
  passesDeltaNeutralHurdle,
  resolveCapitalAllocation,
} from "../../../services/yield/rebalance-rules";
import type { Step1ScanResult } from "../../types/step1";
import type {
  Step2AnalysisResult,
  Step2MockConfig,
  WeakTargetMetric,
} from "../../types/step2-targets";
import { fetchL2BookFeatures } from "./l2-features";
import { defaultMockL2Books, defaultMockUniverse } from "./mocks";
import { buildWeakTargetMetric, passesTier1Filter, tier1Priority } from "./scoring";
import { emptyStep2Result, type Tier1Candidate } from "./types";
import {
  alignCandidatesWithAssembleMatrix,
  mockRowsToCandidates,
  parseMetaAndAssetCtxs,
} from "./universe";

export async function runStep2Scan(
  step1Result: Step1ScanResult,
  config?: Step2MockConfig,
): Promise<Step2AnalysisResult> {
  const startedAt = Date.now();
  const step1Timestamp = step1Result.timestamp;
  const ageMs = startedAt - step1Timestamp;
  const isHandshakeValid = ageMs < STEP2_HANDSHAKE_TTL_MS;

  if (!isHandshakeValid) {
    return emptyStep2Result({
      startedAt,
      timestamp: Date.now(),
      handshake: {
        step1Timestamp,
        isHandshakeValid: false,
        handshakeMessage: `Step 1 handshake stale (${ageMs}ms >= ${STEP2_HANDSHAKE_TTL_MS}ms)`,
      },
      status: "HANDSHAKE_FAILED",
    });
  }

  if (step1Result.status !== "SAFE") {
    return emptyStep2Result({
      startedAt,
      timestamp: Date.now(),
      handshake: {
        step1Timestamp,
        isHandshakeValid: true,
        handshakeMessage: "Handshake OK; Step 1 not SAFE — scan skipped",
      },
      status: "SKIPPED_DUE_TO_STEP1",
    });
  }

  let universe: Tier1Candidate[] = [];
  let usedMock = false;
  const mockBooks = config?.mockL2Books ?? defaultMockL2Books();

  if (config?.isMockMode) {
    usedMock = true;
    universe = mockRowsToCandidates(
      config.mockUniverse?.length ? config.mockUniverse : defaultMockUniverse(),
    );
  } else {
    try {
      if (config?.forceApiFailure) throw new Error("Forced API failure");
      const res = await postHlInfo({ type: "metaAndAssetCtxs" });
      if (!res.ok) throw new Error(`Hyperliquid info HTTP ${res.status}`);
      const raw = await res.json();
      universe = alignCandidatesWithAssembleMatrix(raw, parseMetaAndAssetCtxs(raw));
    } catch {
      usedMock = true;
      universe = mockRowsToCandidates(defaultMockUniverse());
    }
  }

  const totalUniverseScanned = universe.length;
  const filtered = universe.filter(passesTier1Filter);
  filtered.sort((a, b) => tier1Priority(b) - tier1Priority(a));
  const tier2 = filtered.slice(0, TIER2_L2_TOP_N);

  const metrics: WeakTargetMetric[] = [];
  for (const candidate of tier2) {
    try {
      const book = await fetchL2BookFeatures(
        candidate.symbol,
        candidate.midPx,
        usedMock
          ? (mockBooks[candidate.symbol] ?? {
              bidDepthUsd: 100_000,
              askDepthUsd: 100_000,
              estimatedLiquidationDistancePct: 2.0,
            })
          : undefined,
      );
      metrics.push(buildWeakTargetMetric(candidate, book));
    } catch {
      // Skip candidate if L2 fail-closed / fetch fails
    }
  }

  metrics.sort((a, b) => b.weaknessScore - a.weaknessScore);

  const earn = usedMock
    ? {
        nativeUsdcEarnApy: FALLBACK_NATIVE_USDC_EARN_APY,
        HURDLE_RATE_APY: FALLBACK_NATIVE_USDC_EARN_APY,
      }
    : await probeNativeUsdcEarnApy();
  const nativeEarnApy = earn.HURDLE_RATE_APY;

  const netApyOf = (fundingRateHourly: number): number =>
    computeNetFundingApy({
      grossFundingApy: fundingHourlyToGrossApy(fundingRateHourly),
    }).netApy;

  const hurdleCleared = metrics.filter(
    (t) =>
      t.weaknessScore > 0 &&
      passesDeltaNeutralHurdle({
        targetNetApy: netApyOf(t.metrics.fundingRateHourly),
        nativeEarnApy,
      }),
  );
  const targets = hurdleCleared.slice(0, MAX_TARGETS);

  const bestNetApy =
    metrics.length > 0
      ? Math.max(...metrics.map((t) => netApyOf(t.metrics.fundingRateHourly)))
      : 0;
  const allocation = resolveCapitalAllocation({
    targetNetApy: bestNetApy,
    nativeEarnApy,
  });

  return {
    timestamp: Date.now(),
    handshake: {
      step1Timestamp,
      isHandshakeValid: true,
      handshakeMessage: usedMock
        ? "Handshake OK; dry-run/mock market data"
        : "Handshake OK; live Hyperliquid scan",
    },
    status: targets.length > 0 ? "TARGETS_FOUND" : "NO_WEAK_TARGETS",
    targets,
    nativeEarnApy,
    excessYieldOverEarn: allocation.excessYieldOverEarn,
    capitalAllocation: allocation.action,
    executionMetadata: {
      totalUniverseScanned,
      filteredCandidatesCount: filtered.length,
      executionTimeMs: Date.now() - startedAt,
    },
  };
}
