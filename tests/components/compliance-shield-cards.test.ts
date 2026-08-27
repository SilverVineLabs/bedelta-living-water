import { createElement } from "react";
import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import AMLShieldCard from "../../src/components/AMLShieldCard";
import LivingWaterShieldCard from "../../src/components/LivingWaterShieldCard";
import {
  BRIDGE_TIMEOUT_FAIL_CLOSED,
  COMPLIANCE_TRIP_ALERTS,
  ORACLE_LAG_DEADLOCK,
  SYSTEM_FAIL_CLOSED_TRIP,
} from "../../src/components/compliance-trip-alerts";

describe("compliance shield cards", () => {
  it("LivingWaterShieldCard renders SYSTEM_FAIL_CLOSED_TRIP alert with assertive live region", () => {
    const html = renderToStaticMarkup(
      createElement(LivingWaterShieldCard, {
        status: {
          marketState: "CLEAR",
          marketStateVariant: "clear",
          edgeEngineLabel: "test",
          skewPremiumLabel: "test",
        },
        apyRange: { minPercent: 8.2, maxPercent: 11.8 },
        yieldSources: ["GMX yield"],
        logLines: [],
        complianceAlerts: [COMPLIANCE_TRIP_ALERTS[SYSTEM_FAIL_CLOSED_TRIP]],
      }),
    );
    expect(html).toContain('data-testid="living-water-compliance-alerts"');
    expect(html).toContain(`compliance-alert-${SYSTEM_FAIL_CLOSED_TRIP}`);
    expect(html).toContain("SYSTEM_FAIL_CLOSED_TRIP");
    expect(html).toContain('aria-live="assertive"');
    expect(html).toContain("STORM (Fail-Closed — Dispatch Blocked)");
    expect(html).toContain("8.2% ~ 11.8%");
    expect(html).toContain("Hurdle Gate +0.5%");
  });

  it("LivingWaterShieldCard renders ORACLE_LAG_DEADLOCK and appends trip to log viewport", () => {
    const html = renderToStaticMarkup(
      createElement(LivingWaterShieldCard, {
        status: {
          marketState: "CLEAR",
          marketStateVariant: "clear",
          edgeEngineLabel: "test",
          skewPremiumLabel: "test",
        },
        apyRange: { minPercent: 8.2, maxPercent: 11.8 },
        yieldSources: ["GMX yield"],
        logLines: ["[edge] telemetry ok"],
        complianceAlerts: [COMPLIANCE_TRIP_ALERTS[ORACLE_LAG_DEADLOCK]],
      }),
    );
    expect(html).toContain(`compliance-alert-${ORACLE_LAG_DEADLOCK}`);
    expect(html).toContain("ORACLE_LAG_DEADLOCK");
    expect(html).toContain("[FAIL-CLOSED] ORACLE_LAG_DEADLOCK");
  });

  it("AMLShieldCard renders BRIDGE_TIMEOUT_FAIL_CLOSED alert banner", () => {
    const html = renderToStaticMarkup(
      createElement(AMLShieldCard, {
        complianceAlerts: [COMPLIANCE_TRIP_ALERTS[BRIDGE_TIMEOUT_FAIL_CLOSED]],
      }),
    );
    expect(html).toContain('data-testid="aml-compliance-alerts"');
    expect(html).toContain(`compliance-alert-${BRIDGE_TIMEOUT_FAIL_CLOSED}`);
    expect(html).toContain("BRIDGE_TIMEOUT_FAIL_CLOSED");
    expect(html).toContain("lostUsd ≡ 0");
    expect(html).toContain('aria-live="assertive"');
  });
});
