import { describe, expect, it } from "vitest";
import {
  CRON_DRIFT_MIN_USD,
  computeCronDriftUsd,
} from "../../src/scheduled-gmx-hedge";

describe("scheduled-gmx-hedge", () => {
  it("computeCronDriftUsd returns unhedged USD exposure", () => {
    expect(computeCronDriftUsd(200, 0.05, 3500)).toBeCloseTo(25, 1);
    expect(computeCronDriftUsd(100, 0.03, 3500)).toBe(0);
  });

  it("CRON_DRIFT_MIN_USD gate is $10", () => {
    expect(CRON_DRIFT_MIN_USD).toBe(10);
    expect(computeCronDriftUsd(802, 0.2223, 3500)).toBeGreaterThan(10);
  });
});
