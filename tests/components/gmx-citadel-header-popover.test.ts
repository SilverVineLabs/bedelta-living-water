import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { GmxCitadelHeaderPopover } from "../../src/components/hud/GmxCitadelHeaderPopover";
import {
  GMX_HEADER_MICROSERVICES,
  resolveHlSecondaryLegStatus,
} from "../../src/components/hud/gmx-header-microservices";

describe("GmxCitadelHeaderPopover", () => {
  it("renders GMX microservices and demotes HL to secondary leg", () => {
    const html = renderToStaticMarkup(
      createElement(GmxCitadelHeaderPopover, { l2AdapterMode: "active" }),
    );
    expect(html).toContain('data-testid="gmx-citadel-header-popover"');
    expect(html).toContain('border-[#2d42fc]');
    expect(html).toContain('bg-[#101626]');
    for (const row of GMX_HEADER_MICROSERVICES) {
      expect(html).toContain(row.label);
      if (row.id !== "oracle") expect(html).toContain(row.value);
    }
    expect(html).toContain("&lt;30s (FAIL-CLOSED)");
    expect(html).toContain("Secondary Leg (HL Session)");
    expect(html).toContain("CONNECTED");
    expect(html).not.toContain("Portfolio Margin");
  });

  it("maps standby HL adapter to STANDBY secondary leg", () => {
    expect(resolveHlSecondaryLegStatus("standby")).toBe("STANDBY");
    const html = renderToStaticMarkup(
      createElement(GmxCitadelHeaderPopover, { l2AdapterMode: "standby" }),
    );
    expect(html).toContain("STANDBY");
  });
});
