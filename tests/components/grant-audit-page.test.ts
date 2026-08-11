import { createElement } from "react";
import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { GrantAuditPage } from "../../src/components/GrantAuditPage";
import { GrantAuditPageHeader } from "../../src/components/GrantAuditPageHeader";
import { RetailVaultDemoPanel } from "../../src/components/hud/RetailVaultDemoPanel";
import { resolveRetailVaultYieldFallback } from "../../src/services/retail-vault-yield-telemetry";
import {
  grantAuditRoleSearch,
  parseGrantAuditRole,
} from "../../src/components/grant-audit-role";

describe("GrantAuditPage", () => {
  it("mounts v0 GrantAuditDashboard with Grant Audit tab default and AuditTopBar", () => {
    const html = renderToStaticMarkup(createElement(GrantAuditPage));
    expect(html).toContain('data-testid="grant-audit-page"');
    expect(html).toContain('data-testid="grant-audit-v0-dashboard"');
    expect(html).toContain('data-testid="grant-audit-v0-top-bar"');
    expect(html).toContain("BeΔLivingWater");
    expect(html).toContain("SliverVine Protocol — GMX v2 / Arbitrum Citadel Safety Gateway");
    expect(html).toContain("2. Yield &amp; Risk Reference Model");
    expect(html).toContain('data-testid="grant-audit-mainnet-proof-card"');
    expect(html).toContain('data-testid="grant-audit-gmx-arbitrum-proof-card"');
    expect(html).toContain("Dual-Leg");
    expect(html).not.toContain("0xcf8038aff0c5753fd0f9043cf4049502051b00958bc894117348e402afc94f2a");
    expect(html).not.toContain("0xee09cc70a267e59307dd7e1a86bb8cf75ec41572d783fc0a65666fc27a7aaa7d");
    expect(html).toContain("0x9af4d7224639e5e72289fec7688ecbff19978ecf84d1bb06471ef1daf129f760");
    expect(html).toContain("GMX V2 ARBITRUM GM POOL ANCHOR");
    expect(html).toContain("HL Session Key Active");
    expect(html).toContain("0xef0752df6387248B897F3A59A180af42D801960d");
    expect(html).toContain("513344575969");
    expect(html).toContain("Hyperliquid Explorer");
    expect(html).toContain("Gateway Active · Arbitrum One");
    expect(html).not.toContain('data-testid="grant-audit-connect-wallet"');
    expect(html).toContain('data-testid="grant-audit-vault-tab-switcher"');
    expect(html).toContain("1. Grant Audit &amp; On-Chain Proofs");
    expect(html).toContain('data-testid="grant-audit-phase-01-audit"');
    expect(html).toContain('data-testid="grant-audit-phase01-armor-index-card"');
    expect(html).not.toContain('data-testid="grant-audit-passcode-gate"');
    expect(html).not.toContain('data-testid="grant-audit-guard-coverage-matrix"');
    expect(html).not.toContain('data-testid="grant-audit-zero-delta-vault"');
    expect(html).not.toContain('data-testid="arbitrum-citadel-panel"');
    expect(html).not.toContain('data-testid="citadel-copy-audit-payload"');
    expect(html).not.toContain('data-testid="grant-audit-logs-panel"');
    expect(html).not.toContain('data-testid="grant-audit-role-switcher"');
  });

  it("GrantAuditPageHeader omits hero vitest bar on grant role", () => {
    const html = renderToStaticMarkup(createElement(GrantAuditPageHeader, { role: "grant" }));
    expect(html).not.toContain('data-testid="grant-audit-vitest-metric-bar"');
    expect(html).not.toContain("623 Vitest PASS (115 test files, 100% Clean)");
  });

  it("GrantAuditPageHeader shows Zero-Delta Vault label on vault role", () => {
    const html = renderToStaticMarkup(createElement(GrantAuditPageHeader, { role: "vault" }));
    expect(html).not.toContain('data-testid="grant-audit-vitest-metric-bar"');
    expect(html).toContain("BeΔ Zero-Delta Vault");
    expect(html).not.toContain("BeΔ Δ-Neutral Vault");
  });
});

describe("RetailVaultDemoPanel", () => {
  it("renders read-only yield and drawdown guard without wallet force", () => {
    const html = renderToStaticMarkup(
      createElement(RetailVaultDemoPanel, resolveRetailVaultYieldFallback()),
    );
    expect(html).toContain('data-testid="retail-vault-demo-panel"');
    expect(html).toContain("0.00% Drawdown Guard Active (Santenmoku Verified Window · Machine-Readable Telemetry");
    expect(html).toContain("Connect Wallet to Deposit");
    expect(html).toContain("yield-alert-subscribe-banner");
    expect(html).toContain("BeΔ Yield &amp; Safety Alerts");
    expect(html).toContain("Read-only view-first UX");
  });
});

describe("grant-audit role query SSOT", () => {
  it("defaults to grant without query param", () => {
    expect(parseGrantAuditRole("")).toBe("grant");
    expect(parseGrantAuditRole("?role=grant")).toBe("grant");
    expect(grantAuditRoleSearch("grant")).toBe("");
  });

  it("maps ?role=vault to vault view", () => {
    expect(parseGrantAuditRole("?role=vault")).toBe("vault");
    expect(grantAuditRoleSearch("vault")).toBe("?role=vault");
  });
});
