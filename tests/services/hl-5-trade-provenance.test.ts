import { describe, expect, it } from "vitest";
import verifiedResultsJson from "../../src/data/verified_5tx_results.json";
import {
  auditHl5TradeSequence,
  buildGrantAuditProvenanceBundle,
  HL_5TX_MARGIN_ALLOCATION_USD,
} from "../../src/data/verified-5tx";
import {
  __resetProvenanceVerifiedCacheForTests,
  loadProvenanceVerifiedTrades,
} from "../../src/routes/grant-audit-lib/grant-audit-provenance";
import type { GrantAuditPayload } from "../../src/routes/grant-audit-lib/grant-audit.types";
import { VERIFIED_5TX_ORDER_COUNT } from "../../src/data/verified-5tx-lib/verified-5tx-constants";

const BASE_AUDIT_PAYLOAD = {
  success: true,
  audit: "ZERO_TRUST_GRANT",
} as GrantAuditPayload;

describe("hl-5-trade-provenance", () => {
  it("audits verified_5tx_results.json — 5 fills with OID/time continuity", () => {
    const audit = auditHl5TradeSequence(verifiedResultsJson as never);
    expect(audit.ok).toBe(true);
    expect(audit.fillCount).toBe(VERIFIED_5TX_ORDER_COUNT);
    expect(audit.oidContinuityOk).toBe(true);
    expect(audit.marginAllocationOk).toBe(true);
    expect(audit.slippageBoundsOk).toBe(true);
    expect(audit.soilPassedOk).toBe(true);
    expect(audit.reasons).toHaveLength(0);
  });

  it("validates margin allocation at ~$10 per leg and monotonic fill times", () => {
    const fills = verifiedResultsJson.fills;
    expect(fills).toHaveLength(5);
    for (let i = 1; i < fills.length; i++) {
      expect(fills[i]!.fillTimeSec).toBeGreaterThanOrEqual(fills[i - 1]!.fillTimeSec);
      expect(fills[i]!.index).toBe(i + 1);
    }
    expect(fills.every((f) => f.notionalUsd === HL_5TX_MARGIN_ALLOCATION_USD)).toBe(true);
    expect(fills.every((f) => f.gatedSlippageBps <= f.rawSlippageBps)).toBe(true);
  });

  it("buildGrantAuditProvenanceBundle exposes provenanceVerified for grant-audit", () => {
    __resetProvenanceVerifiedCacheForTests();
    const bundle = buildGrantAuditProvenanceBundle(BASE_AUDIT_PAYLOAD);
    expect(bundle.hl5TradeSequence.ok).toBe(true);
    expect(bundle.testnetSuite.event).toBe("HL_TESTNET_5TX_VERIFY");
    expect(bundle.testnetSuite.aggregate.sampleCount).toBe(5);
    expect(bundle.provenanceVerified).not.toBeNull();
    expect(bundle.provenanceVerified!.schema).toBe(
      "silvervine.provenance-verified-trades.v1",
    );
    expect(bundle.provenanceVerified!.aggregate.testnetSuite).toContain(
      "HL_TESTNET_5TX_VERIFY",
    );
    expect(loadProvenanceVerifiedTrades(true)!.trades.length).toBeGreaterThan(0);
  });

  it("rejects broken fill sequence (missing index continuity)", () => {
    const broken = {
      ...verifiedResultsJson,
      fills: verifiedResultsJson.fills.map((f, i) => ({
        ...f,
        index: i === 2 ? 9 : f.index,
      })),
    };
    const audit = auditHl5TradeSequence(broken as never);
    expect(audit.ok).toBe(false);
    expect(audit.oidContinuityOk).toBe(false);
    expect(audit.reasons).toContain("OID_OR_FILL_TIME_DISCONTINUITY");
  });
});
