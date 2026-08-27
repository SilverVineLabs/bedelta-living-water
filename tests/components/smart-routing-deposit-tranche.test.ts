import { createElement } from "react";
import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import SmartRoutingDepositCard from "../../src/components/SmartRoutingDepositCard";
import { DEPOSIT_TRANCHE_B } from "../../src/components/deposit-tranche-config";

describe("SmartRoutingDepositCard tranche switcher", () => {
  it("renders Tranche A and Tranche B toggle with native defaults", () => {
    const html = renderToStaticMarkup(
      createElement(SmartRoutingDepositCard, {
        sendAmount: "100",
        onSendAmountChange: () => {},
        sendToken: "USDC",
        sendChain: "arbitrum",
        smartRouteAddress: "0x511E111111111111111111111111111111111111",
        receiveAmount: "100",
        receiveToken: "GM_LP",
        receiveChain: "arbitrum",
      }),
    );
    expect(html).toContain('data-testid="smart-routing-tranche-switcher"');
    expect(html).toContain('data-testid="smart-routing-tranche-a"');
    expect(html).toContain('data-testid="smart-routing-tranche-b"');
    expect(html).toContain("Arbitrum Native Vault");
    expect(html).toContain("Robinhood Ingress Escort");
  });

  it("shows bridge state machine panel for Tranche B escort", () => {
    const html = renderToStaticMarkup(
      createElement(SmartRoutingDepositCard, {
        depositTranche: "tranche-b-robinhood",
        trancheSubtitle: DEPOSIT_TRANCHE_B.subtitle,
        bridgeStateLines: DEPOSIT_TRANCHE_B.bridgeStateMachine,
        bridgeStateActive: "AVAILABLE",
        sendAmount: "100",
        onSendAmountChange: () => {},
        sendToken: "USDG",
        sendChain: "rh-46630",
        smartRouteAddress: "0x511E111111111111111111111111111111111111",
        receiveAmount: "100",
        receiveToken: "USDG",
        receiveChain: "arbitrum",
        actionLabel: DEPOSIT_TRANCHE_B.actionLabel,
      }),
    );
    expect(html).toContain('data-testid="smart-routing-bridge-state"');
    expect(html).toContain("IN_FLIGHT_BRIDGE_CAPITAL");
    expect(html).toContain("BRIDGE_TIMEOUT_FAIL_CLOSED");
    expect(html).toContain('data-testid="smart-routing-bridge-active"');
  });
});
