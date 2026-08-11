import { afterEach, describe, expect, it, vi } from "vitest";
import {
  checkSoilResistance,
  emitRiskLog,
  formatSoilTelemetryTerminalLine,
  getHktHour,
  isAllowedTelemetrySymbol,
  isTsunamiShieldWindow,
  ALLOWED_SYMBOLS,
  MAX_SLIPPAGE,
  MIN_DEPTH_USD,
  HL_TESTNET_MIN_DEPTH_USD,
  type RiskLogPayload,
} from "../../src/services/risk-control";
import {
  SAFE_TRADING_TIME,
  TSUNAMI_SHIELD_TIME,
} from "../helpers/system-time";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("risk-control — soil resistance", () => {
  describe("Scenario A — soil resistance circuit breaker", () => {
    it("trips and rejects when cross-venue slippage is 0.51% (> 0.5%)", () => {
      const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

      const result = checkSoilResistance({
        symbol: "ETH",
        hlSpot: 100,
        hlPerp: 100,
        dydxPerp: 100.51,
      });

      expect(result.crossVenueSlippage).toBeCloseTo(0.0051, 6);
      expect(result.crossVenueSlippage).toBeGreaterThan(MAX_SLIPPAGE);
      expect(result.tripped).toBe(true);
      expect(result.ok).toBe(false);
      expect(result.reasons.some((r) => r.startsWith("CROSS_VENUE_SLIPPAGE"))).toBe(
        true,
      );
      expect(warnSpy).toHaveBeenCalledOnce();

      const log = JSON.parse(String(warnSpy.mock.calls[0]?.[0])) as RiskLogPayload;
      expect(log.module).toBe("risk-control");
      expect(log.event).toBe("SOIL_RESISTANCE_TRIP");
      expect(log.details.tradeAllowed).toBe(false);
    });
  });

  describe("Scenario C — healthy boundary pass (soil)", () => {
    it("passes when slippage is 0.1%", () => {
      const soil = checkSoilResistance({
        symbol: "SOL",
        hlSpot: 100,
        hlPerp: 100,
        dydxPerp: 100.1,
        depthUsd: MIN_DEPTH_USD,
      });

      expect(soil.crossVenueSlippage).toBeCloseTo(0.001, 6);
      expect(soil.tripped).toBe(false);
      expect(soil.ok).toBe(true);
      expect(soil.reasons).toEqual([]);
    });
  });

  describe("coverage edges — depth, missing venue, helpers", () => {
    it("trips when dual-venue depth is missing (dydx price = 0)", () => {
      vi.spyOn(console, "warn").mockImplementation(() => {});

      const result = checkSoilResistance({
        symbol: "ARB",
        hlSpot: 1,
        hlPerp: 1,
        dydxPerp: 0,
      });

      expect(result.tripped).toBe(true);
      expect(result.crossVenueSlippage).toBe(-1);
      expect(result.reasons).toContain("INSUFFICIENT_DEPTH_DUAL_VENUE");
    });

    it("trips when explicit depthUsd is below MIN_DEPTH_USD", () => {
      vi.spyOn(console, "warn").mockImplementation(() => {});

      const result = checkSoilResistance({
        symbol: "LINK",
        hlSpot: 10,
        hlPerp: 10,
        dydxPerp: 10.01,
        depthUsd: MIN_DEPTH_USD - 1,
      });

      expect(result.tripped).toBe(true);
      expect(
        result.reasons.some((r) => r.startsWith("DEPTH_USD=")),
      ).toBe(true);
    });

    it("passes HL testnet depth at $42K against $5K gate", () => {
      vi.spyOn(console, "log").mockImplementation(() => {});

      const result = checkSoilResistance({
        symbol: "ETH",
        hlSpot: 3500,
        hlPerp: 3501,
        dydxPerp: 3500.5,
        depthUsd: 42_000,
        isTestnet: true,
      });
      expect(result.tripped).toBe(false);
      expect(result.ok).toBe(true);
    });

    it("passes HL testnet depth at $5K gate when minDepthUsd override is set", () => {
      vi.spyOn(console, "log").mockImplementation(() => {});

      const pass = checkSoilResistance({
        symbol: "ETH",
        hlSpot: 3500,
        hlPerp: 3501,
        dydxPerp: 3500.5,
        depthUsd: HL_TESTNET_MIN_DEPTH_USD,
        minDepthUsd: HL_TESTNET_MIN_DEPTH_USD,
      });
      expect(pass.tripped).toBe(false);

      const fail = checkSoilResistance({
        symbol: "ETH",
        hlSpot: 3500,
        hlPerp: 3501,
        dydxPerp: 3500.5,
        depthUsd: HL_TESTNET_MIN_DEPTH_USD - 1,
        minDepthUsd: HL_TESTNET_MIN_DEPTH_USD,
      });
      expect(fail.tripped).toBe(true);
      expect(fail.reasons.some((r) => r.includes(String(HL_TESTNET_MIN_DEPTH_USD)))).toBe(
        true,
      );
    });

    it("reports infinite spot–perp telemetry as -1 when hlSpot is 0", () => {
      vi.spyOn(console, "log").mockImplementation(() => {});

      const result = checkSoilResistance({
        symbol: "NEAR",
        hlSpot: 0,
        hlPerp: 10,
        dydxPerp: 10,
      });

      expect(result.ok).toBe(true);
      expect(result.spotPerpSlippage).toBe(-1);
    });

    it("returns cappedMaxSlUsd when order size and balance are provided", () => {
      const result = checkSoilResistance({
        symbol: "SOL",
        hlSpot: 100,
        hlPerp: 100,
        dydxPerp: 100.1,
        orderSizeUsd: 1_000,
        accountBalanceUsd: 10_000,
      });

      expect(result.cappedMaxSlUsd).toBe(5);
      expect(result.soilRiskUsd).toBeCloseTo(1, 6);
    });

    it("resolves HKT hour via Asia/Hong_Kong timezone", () => {
      expect(getHktHour(SAFE_TRADING_TIME)).toBe(14);
      expect(isTsunamiShieldWindow(SAFE_TRADING_TIME)).toBe(false);
      expect(getHktHour(TSUNAMI_SHIELD_TIME)).toBe(21);
      expect(isTsunamiShieldWindow(TSUNAMI_SHIELD_TIME)).toBe(true);
    });

    it("trips soil resistance during HKT tsunami window 21:00–23:00", () => {
      const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

      const clear = checkSoilResistance({
        symbol: "ETH",
        hlSpot: 100,
        hlPerp: 100,
        dydxPerp: 100,
        at: SAFE_TRADING_TIME,
      });
      expect(clear.tripped).toBe(false);

      const tsunami = checkSoilResistance({
        symbol: "ETH",
        hlSpot: 100,
        hlPerp: 100,
        dydxPerp: 100,
        at: TSUNAMI_SHIELD_TIME,
      });
      expect(tsunami.tripped).toBe(true);
      expect(tsunami.reasons).toContain("TSUNAMI_SHIELD_LOCKED_HKT_21_23");
      expect(warnSpy).toHaveBeenCalled();
    });
  });

  describe("target pair telemetry whitelist", () => {
    it("ALLOWED_SYMBOLS SSOT is ETH-only (GMX v2 / HL cron)", () => {
      expect(ALLOWED_SYMBOLS).toEqual(["ETH"]);
    });

    it("filters non-target symbols from terminal soil lines", () => {
      expect(isAllowedTelemetrySymbol("KAITO")).toBe(false);
      expect(isAllowedTelemetrySymbol("KBONK")).toBe(false);
      expect(isAllowedTelemetrySymbol("btc")).toBe(false);
      expect(isAllowedTelemetrySymbol("eth")).toBe(true);
      expect(
        formatSoilTelemetryTerminalLine("KAITO", { tripped: true, reasons: ["X"] }),
      ).toBeNull();
      expect(
        formatSoilTelemetryTerminalLine("ETH", { tripped: false, reasons: [] }, 120_000),
      ).toContain("symbol: ETH");
    });

    it("does not emit structured trip logs for non-whitelist symbols", () => {
      const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
      checkSoilResistance({
        symbol: "KAITO",
        hlSpot: 0,
        hlPerp: 0,
        dydxPerp: 0,
      });
      expect(warnSpy).not.toHaveBeenCalled();
    });
  });

  describe("emitRiskLog", () => {
    it("emitRiskLog silences info; routes warn / error to the correct console sink", () => {
      const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
      const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
      const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      const base = {
        module: "risk-control" as const,
        symbol: "TEST",
        timestamp: new Date().toISOString(),
        message: "probe",
        details: { blocked: false },
      };

      emitRiskLog({ ...base, level: "info", event: "SOIL_RESISTANCE_PASS" });
      emitRiskLog({ ...base, level: "warn", event: "SOIL_RESISTANCE_TRIP" });
      emitRiskLog({ ...base, level: "error", event: "ROOT_PROTECTION_TRIP" });

      expect(logSpy).not.toHaveBeenCalled();
      expect(warnSpy).toHaveBeenCalledOnce();
      expect(errorSpy).toHaveBeenCalledOnce();
    });
  });
});
