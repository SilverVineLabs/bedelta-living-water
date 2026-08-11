/** Bid/Ask liquidity imbalance — "dual elevator" orderbook balance probe. */

export const ELEVATOR_IMBALANCE_THRESHOLD_PCT = 300;

export interface ElevatorSpreadInput {
  bidDepthUsd: number;
  askDepthUsd: number;
}

export type ElevatorLamp = "green" | "yellow" | "red";

export interface ElevatorSpreadSnapshot {
  bidDepthUsd: number;
  askDepthUsd: number;
  imbalancePct: number;
  soilEngaged: boolean;
  lamp: ElevatorLamp;
  statusLabel: string;
}

export function evaluateElevatorSpread(
  input: ElevatorSpreadInput,
): ElevatorSpreadSnapshot {
  const bidDepthUsd = Math.max(0, input.bidDepthUsd);
  const askDepthUsd = Math.max(0, input.askDepthUsd);
  const minSide = Math.min(bidDepthUsd, askDepthUsd);
  const maxSide = Math.max(bidDepthUsd, askDepthUsd);

  const imbalancePct =
    minSide <= 0 ? (maxSide > 0 ? Infinity : 0) : ((maxSide - minSide) / minSide) * 100;

  const soilEngaged =
    Number.isFinite(imbalancePct) &&
    imbalancePct >= ELEVATOR_IMBALANCE_THRESHOLD_PCT;

  let lamp: ElevatorLamp = "green";
  let statusLabel = "Balanced";

  if (!Number.isFinite(imbalancePct) || imbalancePct >= ELEVATOR_IMBALANCE_THRESHOLD_PCT) {
    lamp = "yellow";
    statusLabel = "Soil Resistance Engaged";
  } else if (imbalancePct >= ELEVATOR_IMBALANCE_THRESHOLD_PCT * 0.5) {
    lamp = "yellow";
    statusLabel = "Elevator drift · monitor";
  }

  if (minSide <= 0 && maxSide > 0) {
    lamp = "red";
    statusLabel = "One-sided book · circuit watch";
  }

  return {
    bidDepthUsd,
    askDepthUsd,
    imbalancePct: Number.isFinite(imbalancePct) ? imbalancePct : 999,
    soilEngaged,
    lamp,
    statusLabel,
  };
}

/** Demo probe — ask-side elevator overload (>300% imbalance). */
export function demoElevatorSpreadInput(): ElevatorSpreadInput {
  return { bidDepthUsd: 42_000, askDepthUsd: 210_000 };
}
