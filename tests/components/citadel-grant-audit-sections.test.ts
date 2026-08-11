import { createElement } from "react";
import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { CitadelGrantAuditActionBar } from "../../src/components/hud/CitadelGrantAuditActionBar";
import { extendToFullGrantAuditView } from "../../src/components/hud/v0/grant-audit-view-adapter";
import { Phase03Defense } from "../../src/components/hud/v0/Phase03Defense";
import { ScaleDownCombobox } from "../../src/components/hud/ScaleDownCombobox";
import { GRANT_AUDIT_VENUE_MOCK_VIEW } from "../fixtures/grant-audit-venue-mock";

describe("CitadelGrantAuditActionBar", () => {
  it("renders GMX action bar export + curl verify controls", () => {
    const html = renderToStaticMarkup(
      createElement(CitadelGrantAuditActionBar, {
        curl: "curl bedeltawater.slivervine.xyz/api/grant-audit | jq .arbitrumCitadel",
      }),
    );
    expect(html).toContain("[ 📄 Export GMX v2 Audit Certificate (.json) ]");
    expect(html).toContain("[ 📋 Copy Live Audit Payload JSON ]");
    expect(html).toContain('data-testid="citadel-copy-audit-payload"');
    expect(html).toContain('data-testid="citadel-export-gmx-certificate"');
    expect(html).toContain('data-testid="citadel-curl-verify"');
    expect(html).toContain("jq .arbitrumCitadel");
  });
});

describe("Phase03Defense tier toggles", () => {
  const view = extendToFullGrantAuditView(GRANT_AUDIT_VENUE_MOCK_VIEW);

  it("renders interactive Section2PresetMatrix with three Santenmoku tier tabs", () => {
    const html = renderToStaticMarkup(createElement(Phase03Defense, { view }));
    expect(html).toContain('data-testid="grant-audit-phase-03-defense"');
    expect(html).toContain('data-testid="scale-down-combobox"');
    expect(html).toContain("Tier 1 Base Depth");
    expect(html).toContain("Tier 1+2 Circuit Breakers");
    expect(html).toContain("Tier 1+2+3 Counter-MEV");
    expect(html).toContain("v0.8 GMX Blue Shield");
    expect(html).toContain("v1.0 Institutional");
    expect(html).toContain("v1.5 Black Swan");
  });

  it("defaults to v0.8 active operators and 20-root shield breakdown", () => {
    const html = renderToStaticMarkup(createElement(Phase03Defense, { view }));
    expect(html).toContain('data-testid="scale-down-combobox-active"');
    expect(html).toContain("Toxic-Fill &amp; Stale-Book Mitigation");
    expect(html).toContain('data-testid="active-shield-breakdown"');
    expect(html).toContain('data-testid="matrix-20-root-status-badge"');
    expect(html).toContain("20-ROOT MATRIX STATUS");
  });

  it("reflects v1.0 tier operators when Institutional preset is selected", () => {
    const html = renderToStaticMarkup(
      createElement(ScaleDownCombobox, { defaultCombo: "COMBO_B" }),
    );
    expect(html).toContain("Soil Resistance + Dynamic Fee Rebate + Saga Circuit");
    expect(html).toContain("[V1.0 RESERVED]");
  });

  it("reflects v1.5 tier operators and Counter-MEV breakdown when Black Swan is selected", () => {
    const html = renderToStaticMarkup(
      createElement(ScaleDownCombobox, { defaultCombo: "COMBO_C" }),
    );
    expect(html).toContain("Root Lock-down + Auto-Flatten");
    expect(html).toContain("[ V1.5 Counter-MEV Simulation ]");
  });
});
