import { describe, expect, it } from "vitest";
import { runSmartRouteDepositPreview } from "../../src/components/hud/smart-route-deposit-flow";

const WALLET = "0xcccccccccccccccccccccccccccccccccccccccc";

describe("smart-route-deposit-flow", () => {
  it("runs deposit → soil → gate payloadHash preview without error", () => {
    const preview = runSmartRouteDepositPreview({ amountUsd: 1_000, wallet: WALLET });
    expect(preview.ok).toBe(true);
    expect(preview.phase).toBe("ready");
    expect(preview.gateSimVerdict).toBe("ALLOW");
    expect(preview.soilTripped).toBe(false);
    expect(preview.payloadHash).toMatch(/^0x[a-f0-9]{64}$/);
    expect(preview.smartRoutingAddress).toMatch(/^0x[a-fA-F0-9]{40}$/);
  });

  it("fail-closes on undersized deposit", () => {
    const preview = runSmartRouteDepositPreview({ amountUsd: 1, wallet: WALLET });
    expect(preview.ok).toBe(false);
    expect(preview.gateSimVerdict).toBe("DENY");
    expect(preview.payloadHash).toBeNull();
  });
});
