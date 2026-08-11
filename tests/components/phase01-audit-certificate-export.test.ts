import { describe, expect, it } from "vitest";
import { extendToFullGrantAuditView } from "../../src/components/hud/v0/grant-audit-view-adapter";
import {
  buildPhase01CitadelAuditCertificate,
  PHASE01_ARMOR_INDEX_SCORE,
} from "../../src/components/hud/v0/phase01-audit-certificate-export";
import { GRANT_AUDIT_VENUE_MOCK_VIEW } from "../fixtures/grant-audit-venue-mock";

describe("phase01-audit-certificate-export", () => {
  const view = extendToFullGrantAuditView(GRANT_AUDIT_VENUE_MOCK_VIEW);

  it("builds SHA-256 signed certificate with live telemetry and explorer links", async () => {
    const cert = await buildPhase01CitadelAuditCertificate(view, "2026-08-09T01:00:00.000Z");
    expect(cert.armorIndex.score).toBe(PHASE01_ARMOR_INDEX_SCORE);
    expect(cert.telemetry.combinedTvlUsd).toBe(view.combinedTvlUsd);
    expect(cert.telemetry.soilResistancePct).toBe(100);
    expect(cert.verifiedExecutions.length).toBe(view.executions.length);
    expect(cert.verifiedExecutions[0]?.explorerUrl).toContain("app.hyperliquid.xyz/explorer/address/");
    expect(cert.verifiedExecutions[0]?.explorerUrl).toContain("0xef0752df6387248B897F3A59A180af42D801960d");
    expect(cert.verifiedExecutions[1]?.explorerUrl).toContain("arbiscan.io");
    expect(cert.sha256Signature).toMatch(/^[0-9a-f]{64}$/);
  });
});
