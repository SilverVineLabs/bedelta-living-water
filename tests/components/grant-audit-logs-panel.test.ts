import { createElement } from "react";
import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { GrantAuditLogsPanel } from "../../src/components/GrantAuditLogsPanel";
import { GRANT_GMX_GM_DEPOSIT_TX_HASH } from "../../src/data/grant-mainnet-execution-ssot";

describe("GrantAuditLogsPanel execution history", () => {
  it("renders verified mainnet GMX deposit when API txHashes are empty", () => {
    const html = renderToStaticMarkup(
      createElement(GrantAuditLogsPanel, {
        logsPath: "/api/logs",
        payload: { txHashes: [], fetchedAt: "2026-08-08T00:00:00.000Z" },
        error: null,
      }),
    );
    expect(html).toContain('data-testid="grant-audit-execution-tx-list"');
    expect(html).toContain("Verified Testnet Suite &amp; Live Mainnet Order (OID: 513344575969)");
    expect(html).toContain("1 live execution hash(es)");
    expect(html).not.toContain("fingerprint(s)");
    expect(html).not.toContain("stats.hyperliquid.xyz/tx/");
    expect(html).toContain(GRANT_GMX_GM_DEPOSIT_TX_HASH);
    expect(html).toContain(`arbiscan.io/tx/${GRANT_GMX_GM_DEPOSIT_TX_HASH}`);
  });

  it("renders Arbiscan GMX mainnet anchor without testnet HL bleed", () => {
    const html = renderToStaticMarkup(
      createElement(GrantAuditLogsPanel, {
        logsPath: "/api/logs",
        payload: { txHashes: [] },
        error: null,
      }),
    );
    expect(html).not.toContain('data-testid="grant-audit-tx-link-hl"');
    expect(html).toContain('data-testid="grant-audit-tx-link-gmx"');
  });
});
