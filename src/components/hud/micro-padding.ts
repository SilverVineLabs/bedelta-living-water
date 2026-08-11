/** Spot padding — micro slippage heal without order rejection. */

/** Band-aid zone ceiling — above this, circuit breaker takes over (50 bps = 0.5%). */
export const MICRO_PADDING_CIRCUIT_CEILING_BPS = 50;

export interface MicroPaddingPatchSnapshot {
  applied: boolean;
  savedUsd: number;
  deviationPct: number;
  latencyMs: number;
  label: string;
}

export interface MicroPaddingFillInput {
  rawSlippageBps: number;
  gatedSlippageBps: number;
  notionalUsd: number;
}

export function deriveMicroPaddingPatch(
  input: MicroPaddingFillInput,
): MicroPaddingPatchSnapshot {
  const avoidedBps = Math.max(0, input.rawSlippageBps - input.gatedSlippageBps);
  const applied =
    avoidedBps > 0 &&
    input.rawSlippageBps > 0 &&
    input.rawSlippageBps < MICRO_PADDING_CIRCUIT_CEILING_BPS;
  const savedUsd = applied
    ? input.notionalUsd * (avoidedBps / 10_000)
    : 0;
  const deviationPct = input.rawSlippageBps / 10_000;

  return {
    applied,
    savedUsd,
    deviationPct,
    latencyMs: 2,
    label: applied
      ? `Patch Applied: +${savedUsd.toFixed(2)} USDC Saved`
      : "No patch required",
  };
}

/** HUD fixture — band-aid patch (+0.12 USDC saved). */
export function demoMicroPaddingPatch(): MicroPaddingPatchSnapshot {
  return deriveMicroPaddingPatch({
    rawSlippageBps: 12,
    gatedSlippageBps: 0,
    notionalUsd: 100,
  });
}
