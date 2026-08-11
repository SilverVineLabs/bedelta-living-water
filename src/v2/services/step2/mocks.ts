import type { Step2MockL2Book, Step2MockUniverseRow } from "../../types/step2-targets";

export function defaultMockUniverse(): Step2MockUniverseRow[] {
  return [
    {
      symbol: "WEAKLONG",
      fundingRateHourly: 0.0008,
      openInterest: 2_500_000,
      oiChange24hRatio: 0.22,
      midPx: 1.0,
      prevDayPx: 1.08,
      dayNtlVlm: 12_000_000,
    },
    {
      symbol: "WEAKSHORT",
      fundingRateHourly: -0.0007,
      openInterest: 1_800_000,
      oiChange24hRatio: -0.18,
      midPx: 2.1,
      prevDayPx: 1.95,
      dayNtlVlm: 9_500_000,
    },
    {
      symbol: "HEALTHY",
      fundingRateHourly: 0.00001,
      openInterest: 500_000,
      oiChange24hRatio: 0.01,
      midPx: 10,
      prevDayPx: 10.05,
      dayNtlVlm: 8_000_000,
    },
  ];
}

export function defaultMockL2Books(): Record<string, Step2MockL2Book> {
  return {
    WEAKLONG: {
      bidDepthUsd: 40_000,
      askDepthUsd: 220_000,
      estimatedLiquidationDistancePct: 0.9,
    },
    WEAKSHORT: {
      bidDepthUsd: 300_000,
      askDepthUsd: 55_000,
      estimatedLiquidationDistancePct: 1.1,
    },
    HEALTHY: {
      bidDepthUsd: 800_000,
      askDepthUsd: 780_000,
      estimatedLiquidationDistancePct: 3.5,
    },
  };
}
