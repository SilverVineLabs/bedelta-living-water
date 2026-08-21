import { describe, expect, it, vi, afterEach } from "vitest";
import {
  FUNDING_EPOCH_LOCK_WINDOW_SEC,
  fundingEpochGuard,
  negativeFundingTrap,
  evaluateSoilProtectionGates,
} from "../../src/services/risk/soil-protection";
import {
  auditSessionKeyConstraints,
  SESSION_KEY_AUTO_EXPIRE_MS,
  SESSION_KEY_CLIP_USD,
} from "../../src/services/risk/session-audit";
import {
  buildFlashUnwindPlan,
  dispatchEscalationFlashUnwind,
  executeFlashUnwindPlan,
  FLASH_UNWIND_BUDGET_MS,
} from "../../src/services/risk/flash-unwind";
import { evaluateEscalationLadder } from "../../src/services/risk/escalation-ladder";
import { __resetTelegramAlertForTests } from "../../src/services/telemetry/telegram-alert";

afterEach(() => {
  __resetTelegramAlertForTests();
  vi.restoreAllMocks();
});

describe("fundingEpochGuard", () => {
  const HOUR = 3_600_000;

  it("locks in the 6s window around the hour (:59:57–:00:03)", () => {
    expect(FUNDING_EPOCH_LOCK_WINDOW_SEC).toBe(6);

    // xx:59:57.000
    const pre = fundingEpochGuard(HOUR - 3_000);
    expect(pre.locked).toBe(true);
    expect(pre.reason).toMatch(/FUNDING_EPOCH_LOCK:pre/);

    // xx:00:00.000
    const onHour = fundingEpochGuard(0);
    expect(onHour.locked).toBe(true);

    // xx:00:02.999
    const post = fundingEpochGuard(2_999);
    expect(post.locked).toBe(true);
    expect(post.reason).toMatch(/FUNDING_EPOCH_LOCK:post/);
  });

  it("clears outside the funding-epoch sandwich window", () => {
    const clear = fundingEpochGuard(60_000); // xx:01:00
    expect(clear.locked).toBe(false);
    expect(clear.lockRemainingMs).toBe(0);
    expect(clear.reason).toBe("FUNDING_EPOCH_CLEAR");
  });
});

describe("negativeFundingTrap", () => {
  it("triggers unwind when funding APY < 0%", () => {
    const trap = negativeFundingTrap(-0.01, { alert: false });
    expect(trap.unwind).toBe(true);
    expect(trap.reason).toMatch(/NEGATIVE_FUNDING_TRAP/);
  });

  it("does not unwind when funding APY is non-negative", () => {
    expect(negativeFundingTrap(0, { alert: false }).unwind).toBe(false);
    expect(negativeFundingTrap(0.025, { alert: false }).unwind).toBe(false);
  });

  it("evaluateSoilProtectionGates blocks placement on epoch lock or negative funding", () => {
    const locked = evaluateSoilProtectionGates({
      nowMs: 3_600_000 - 1_000,
      fundingApy: 0.1,
    });
    expect(locked.orderPlacementAllowed).toBe(false);

    const trap = evaluateSoilProtectionGates({
      nowMs: 120_000,
      fundingApy: -0.05,
    });
    expect(trap.orderPlacementAllowed).toBe(false);
    expect(trap.fundingTrap?.unwind).toBe(true);

    const ok = evaluateSoilProtectionGates({
      nowMs: 120_000,
      fundingApy: 0.05,
    });
    expect(ok.orderPlacementAllowed).toBe(true);
  });
});

describe("session-audit $30 + 7d", () => {
  it("passes when clip ≤ $30 and expiry within 7 days", () => {
    const now = 1_700_000_000_000;
    const result = auditSessionKeyConstraints({
      agentAddress: "0x1111111111111111111111111111111111111111",
      maxOrderClipUsd: SESSION_KEY_CLIP_USD,
      expiresAtMs: now + SESSION_KEY_AUTO_EXPIRE_MS,
      nowMs: now,
    });
    expect(result.ok).toBe(true);
    expect(result.clipOk).toBe(true);
    expect(result.expiryOk).toBe(true);
  });

  it("fails clip > $30 or missing/overlong expiry", () => {
    const now = 1_700_000_000_000;
    expect(
      auditSessionKeyConstraints({
        agentAddress: "0x1111111111111111111111111111111111111111",
        maxOrderClipUsd: 31,
        expiresAtMs: now + 86_400_000,
        nowMs: now,
      }).clipOk,
    ).toBe(false);

    expect(
      auditSessionKeyConstraints({
        agentAddress: "0x1111111111111111111111111111111111111111",
        maxOrderClipUsd: 30,
        expiresAtMs: null,
        nowMs: now,
      }).expiryOk,
    ).toBe(false);

    expect(
      auditSessionKeyConstraints({
        agentAddress: "0x1111111111111111111111111111111111111111",
        maxOrderClipUsd: 30,
        expiresAtMs: now + SESSION_KEY_AUTO_EXPIRE_MS + 1,
        nowMs: now,
      }).expiryOk,
    ).toBe(false);
  });
});

describe("flash-unwind engine", () => {
  it("pre-builds Cancel-All + Reduce-Only closes for Spot & Perp", () => {
    const plan = buildFlashUnwindPlan({
      openOrders: [
        { asset: 1, oid: 101 },
        { asset: 10001, oid: 202 },
      ],
      positions: [
        {
          market: "perp",
          asset: 1,
          szi: -0.5,
          midPx: 100,
          szDecimals: 4,
          coin: "ETH",
        },
        {
          market: "spot",
          asset: 10001,
          szi: 0.4,
          midPx: 100,
          szDecimals: 4,
          coin: "ETH",
        },
      ],
    });
    expect(plan.cancelCount).toBe(2);
    expect(plan.cancelAction?.type).toBe("cancel");
    expect(plan.closeActions).toHaveLength(2);
    expect(plan.closeActions.every((c) => c.wire.r === true)).toBe(true);
    // short perp → buy to close
    expect(plan.closeActions.find((c) => c.market === "perp")?.isBuy).toBe(true);
    // long spot → sell to close
    expect(plan.closeActions.find((c) => c.market === "spot")?.isBuy).toBe(false);
  });

  it("executes within 1000ms budget", async () => {
    const plan = buildFlashUnwindPlan({
      openOrders: [{ asset: 0, oid: 1 }],
      positions: [
        {
          market: "perp",
          asset: 0,
          szi: 1,
          midPx: 50,
          szDecimals: 2,
        },
      ],
    });
    const timed = await executeFlashUnwindPlan(plan, async () => {
      await new Promise((r) => setTimeout(r, 1));
    });
    expect(timed.withinBudget).toBe(true);
    expect(timed.elapsedMs).toBeLessThan(FLASH_UNWIND_BUDGET_MS);
    expect(timed.ok).toBe(true);
    expect(timed.budgetMs).toBe(FLASH_UNWIND_BUDGET_MS);
  });

  it("dispatchEscalationFlashUnwind executes on RED and skips GREEN", async () => {
    const plan = buildFlashUnwindPlan({
      openOrders: [],
      positions: [
        { market: "perp", asset: 0, szi: -1, midPx: 50, szDecimals: 2 },
      ],
    });
    const broadcast = vi.fn(async () => {});
    const red = evaluateEscalationLadder({
      liquidationDistancePct: 20,
      shortNotionalUsd: 500,
    });
    const redTimed = await dispatchEscalationFlashUnwind({
      ladder: red,
      plan,
      broadcast,
    });
    expect(red.state).toBe("RED");
    expect(redTimed?.ok).toBe(true);
    expect(broadcast).toHaveBeenCalled();

    broadcast.mockClear();
    const green = evaluateEscalationLadder({
      liquidationDistancePct: 200,
      shortNotionalUsd: 100,
    });
    const skipped = await dispatchEscalationFlashUnwind({
      ladder: green,
      plan,
      broadcast,
    });
    expect(skipped).toBeNull();
    expect(broadcast).not.toHaveBeenCalled();
  });

  it("dispatchEscalationFlashUnwind executes on severe soil trip even if GREEN", async () => {
    const plan = buildFlashUnwindPlan({
      openOrders: [{ asset: 0, oid: 1 }],
      positions: [],
    });
    const broadcast = vi.fn(async () => {});
    const green = evaluateEscalationLadder({
      liquidationDistancePct: 180,
      shortNotionalUsd: 50,
    });
    const timed = await dispatchEscalationFlashUnwind({
      ladder: green,
      soilTripped: true,
      plan,
      broadcast,
    });
    expect(timed?.ok).toBe(true);
    expect(broadcast).toHaveBeenCalled();
  });
});
