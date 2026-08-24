import { describe, expect, it } from "vitest";
import { buildArbitrumCitadelRiskMetrics } from "../../src/routes/grant-audit-lib/grant-audit-citadel-metrics";

describe("grant-audit payload — citadel metrics", () => {
  it("buildArbitrumCitadelRiskMetrics stays cache-only and fast", () => {
    const t0 = Date.now();
    const metrics = buildArbitrumCitadelRiskMetrics();
    expect(Date.now() - t0).toBeLessThan(50);
    expect(metrics.metricsBuildMs).toBeLessThan(50);
  });
});
