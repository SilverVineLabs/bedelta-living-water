import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { GrantAuditPhaseShell } from "../../src/components/hud/grant-audit-phase-shell";

describe("GrantAuditPhaseShell", () => {
  it("renders GMX Dark Citadel phase header and badge styling", () => {
    const html = renderToStaticMarkup(
      createElement(
        GrantAuditPhaseShell,
        { phase: "03", title: "SANTENMOKU 20-ROOT DEFENSE MATRIX" },
        createElement("p", null, "phase body"),
      ),
    );
    expect(html).toContain('data-testid="grant-audit-phase-03"');
    expect(html).toContain("PHASE 03");
    expect(html).toContain("bg-[#090d16]");
    expect(html).toContain("border-[#1d2842]");
    expect(html).toContain("border-[#2d42fc]");
    expect(html).toContain("text-[#ffffff]");
  });
});
