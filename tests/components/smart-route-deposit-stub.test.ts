import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ZeroDevSmartRouteDepositStub } from "../../src/components/hud/v0/ZeroDevSmartRouteDepositStub";

describe("ZeroDevSmartRouteDepositStub", () => {
  it("renders cross-chain deposit preview stub", () => {
    const html = renderToStaticMarkup(createElement(ZeroDevSmartRouteDepositStub));
    expect(html).toContain('data-testid="zerodev-smart-route-deposit-stub"');
    expect(html).toContain('data-testid="smart-route-deposit-preview-btn"');
    expect(html).toContain("ZeroDev Smart Routing");
  });
});
