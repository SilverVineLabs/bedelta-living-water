/**
 * Survival benchmark dark-staging stubs (Batch 1 / Batch 2 progressive runs).
 * Colocated with scripts/survival-benchmark — not mounted on Worker hot path.
 */

abstract class SurvivalStubBase {
  constructor(protected readonly enabled: boolean) {}
}

export class UsdYieldLendStub extends SurvivalStubBase {
  simulate(input: {
    idleUsdcUsd: number;
    lendApy: number;
    durationHours: number;
    allocationPct: number;
  }) {
    if (!this.enabled) return { interestUsd: 0, annualizedApy: 0 };
    const interestUsd =
      input.idleUsdcUsd *
      input.lendApy *
      (input.durationHours / (365 * 24)) *
      input.allocationPct;
    return { interestUsd, annualizedApy: input.lendApy };
  }
}

export class AffiliateReinvestingStub extends SurvivalStubBase {
  simulate(input: { builderCommissionUsd: number; hedgePoolNavUsd: number }) {
    return {
      reinvestedUsd: this.enabled ? input.builderCommissionUsd * 0.2 : 0,
    };
  }
}

export class IcebergShadowOrdersStub extends SurvivalStubBase {
  simulate(input: {
    symbol: string;
    side: string;
    probeUsd: number;
    maxProbes: number;
    levels: ReadonlyArray<{ price: number; sizeUsd: number }>;
  }) {
    if (!this.enabled) return { spoofRatio: 0 };
    const shallow = input.levels.filter((l) => l.sizeUsd < input.probeUsd).length;
    const spoofRatio = Math.min(0.45, shallow / Math.max(input.maxProbes, 1));
    return { spoofRatio };
  }
}

export class ZeroSpreadRebalancerStub extends SurvivalStubBase {
  simulate(input: {
    spotUsd: number;
    perpMarginUsd: number;
    targetSpotWeight: number;
    legacyTransferBps: number;
  }) {
    if (!this.enabled) return { savedUsd: 0 };
    const total = input.spotUsd + input.perpMarginUsd;
    const currentSpotWeight = input.spotUsd / total;
    const drift = Math.abs(currentSpotWeight - input.targetSpotWeight);
    const savedUsd = total * drift * (input.legacyTransferBps / 10_000);
    return { savedUsd };
  }
}

export class PreemptiveGasBiddingStub extends SurvivalStubBase {
  simulate(input: {
    currentPriorityGwei: number;
    samples: ReadonlyArray<{
      blockNumber: number;
      baseFeeGwei: number;
      priorityFeeGwei: number;
    }>;
  }) {
    if (!this.enabled) return { triggered: false };
    const maxPriority = Math.max(
      input.currentPriorityGwei,
      ...input.samples.map((s) => s.priorityFeeGwei),
    );
    return { triggered: maxPriority > input.currentPriorityGwei * 1.1 };
  }
}

export class CrossChainIngressBridgeStub extends SurvivalStubBase {
  simulate(input: { sourceChain: string; amountUsdc: number }) {
    if (!this.enabled) return { creditedHlUsdc: 0, feeUsd: 0 };
    const feeBps = input.sourceChain === "SOL" ? 8 : 5;
    const feeUsd = input.amountUsdc * (feeBps / 10_000);
    return { creditedHlUsdc: input.amountUsdc - feeUsd, feeUsd };
  }
}

export class HyperdashWhaleFollowerStub extends SurvivalStubBase {
  simulate(input: {
    maxHedgeUsd: number;
    mode: string;
    signals: ReadonlyArray<{ vaultId: string; deltaUsd: number; winRate: number }>;
  }) {
    if (!this.enabled || input.signals.length === 0) {
      return { hedgeDeltaUsd: 0, hedgeSide: "flat", mode: input.mode };
    }
    const netDelta = input.signals.reduce((sum, s) => sum + s.deltaUsd, 0);
    const scale = input.mode === "counter" ? -0.15 : 0.1;
    const hedgeDeltaUsd = Math.max(
      -input.maxHedgeUsd,
      Math.min(input.maxHedgeUsd, netDelta * scale),
    );
    const hedgeSide =
      hedgeDeltaUsd > 0 ? "long" : hedgeDeltaUsd < 0 ? "short" : "flat";
    return { hedgeDeltaUsd, hedgeSide, mode: input.mode };
  }
}
