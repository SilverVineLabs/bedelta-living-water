/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2026 SilverVine Labs
 */
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  __clearCitadelCooldownsForTests,
  withCitadelShield,
} from "../../src/sdk/decorator";
import * as riskControl from "../../src/services/risk-control";

afterEach(() => {
  __clearCitadelCooldownsForTests();
  vi.restoreAllMocks();
  vi.useRealTimers();
});

const healthyIntent = {
  symbol: "ETH",
  hlSpot: 3500,
  hlPerp: 3500,
  dydxPerp: 3500,
  depthUsd: 200_000,
  agentId: "virtuals-agent-0xbeef",
};

describe("withCitadelShield", () => {
  it("allows execution when checkSoilResistance() passes", async () => {
    vi.spyOn(riskControl, "checkSoilResistance").mockReturnValue({
      ok: true,
      tripped: false,
      crossVenueSlippage: 0,
      spotPerpSlippage: 0,
      reasons: [],
    });
    const executionFn = vi.fn().mockResolvedValue("ok");
    const shielded = withCitadelShield(executionFn);
    const result = await shielded(healthyIntent);
    expect(result).toBe("ok");
    expect(executionFn).toHaveBeenCalledWith(healthyIntent);
    expect(riskControl.checkSoilResistance).toHaveBeenCalledWith(healthyIntent);
  });

  it("blocks execution and throws [Citadel Shield Trip] when soil resistance fails", async () => {
    vi.spyOn(riskControl, "checkSoilResistance").mockReturnValue({
      ok: false,
      tripped: true,
      crossVenueSlippage: 0.2,
      spotPerpSlippage: 0.1,
      reasons: ["CROSS_VENUE_SLIPPAGE=20%>0.5%", "DEPTH_USD=1<100000"],
    });
    const executionFn = vi.fn();
    const shielded = withCitadelShield(executionFn);
    await expect(shielded(healthyIntent)).rejects.toThrow(
      "[Citadel Shield Trip] Execution blocked pre-broadcast: CROSS_VENUE_SLIPPAGE=20%>0.5%; DEPTH_USD=1<100000",
    );
    expect(executionFn).not.toHaveBeenCalled();
  });

  it("uses fallback reason when soil trips with empty reasons", async () => {
    vi.spyOn(riskControl, "checkSoilResistance").mockReturnValue({
      ok: false,
      tripped: true,
      crossVenueSlippage: -1,
      spotPerpSlippage: -1,
      reasons: [],
    });
    const shielded = withCitadelShield(vi.fn());
    await expect(shielded(healthyIntent)).rejects.toThrow(
      "[Citadel Shield Trip] Execution blocked pre-broadcast: SOIL_RESISTANCE_TRIP",
    );
  });

  it("activates cooldown on SOIL_RESISTANCE_TRIP and blocks immediate retry with MANDATORY_COOLDOWN_ACTIVE", async () => {
    vi.useFakeTimers();
    const soilSpy = vi.spyOn(riskControl, "checkSoilResistance");
    soilSpy
      .mockReturnValueOnce({
        ok: false,
        tripped: true,
        crossVenueSlippage: 0.2,
        spotPerpSlippage: 0.1,
        reasons: ["SOIL_RESISTANCE_TRIP"],
      })
      .mockReturnValue({
        ok: true,
        tripped: false,
        crossVenueSlippage: 0,
        spotPerpSlippage: 0,
        reasons: [],
      });
    const executionFn = vi.fn().mockResolvedValue("ok");
    const shielded = withCitadelShield(executionFn);

    await expect(shielded(healthyIntent)).rejects.toThrow("[Citadel Shield Trip]");
    await expect(shielded(healthyIntent)).rejects.toThrow("MANDATORY_COOLDOWN_ACTIVE");
    await expect(shielded(healthyIntent)).rejects.toThrow(
      "Agent 'virtuals-agent-0xbeef' tripped soil fuse recently",
    );
    expect(executionFn).not.toHaveBeenCalled();
    expect(soilSpy).toHaveBeenCalledTimes(1);

    vi.advanceTimersByTime(60_001);
    await expect(shielded(healthyIntent)).resolves.toBe("ok");
    expect(executionFn).toHaveBeenCalledOnce();
  });

  it("activates cooldown when executionFn throws FAIL_CLOSED", async () => {
    vi.useFakeTimers();
    vi.spyOn(riskControl, "checkSoilResistance").mockReturnValue({
      ok: true,
      tripped: false,
      crossVenueSlippage: 0,
      spotPerpSlippage: 0,
      reasons: [],
    });
    const executionFn = vi
      .fn()
      .mockRejectedValueOnce(new Error("FAIL_CLOSED_PRE_BROADCAST"))
      .mockResolvedValue("ok");
    const shielded = withCitadelShield(executionFn);

    await expect(shielded(healthyIntent)).rejects.toThrow("FAIL_CLOSED_PRE_BROADCAST");
    await expect(shielded(healthyIntent)).rejects.toThrow("MANDATORY_COOLDOWN_ACTIVE");
    expect(executionFn).toHaveBeenCalledTimes(1);

    vi.advanceTimersByTime(60_001);
    await expect(shielded(healthyIntent)).resolves.toBe("ok");
    expect(executionFn).toHaveBeenCalledTimes(2);
  });
});
