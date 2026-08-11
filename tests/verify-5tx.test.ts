import { beforeEach, describe, expect, it, vi } from "vitest";
import verifiedResultsJson from "../src/data/verified_5tx_results.json";
import {
  applyTestnetGrantSoilBoost,
  applyW01DepthRefillDefense,
  aggregateVerifiedFills,
  buildHlTestnetExplorerUrl,
  buildPreTradeFromSoilAudit,
  computeVerified5TxSha256Anchor,
  estimateSlippageBps,
  isValidFillTxHash,
  pickFillTxMeta,
  type Verified5TxFillRecord,
} from "../src/data/verified-5tx";
import { runVerify5Tx } from "../src/data/verify-5tx-runner";
import type { LiveBookSoilAudit } from "../src/services/check-soil-resistance";
import { SAFE_TRADING_TIME } from "./helpers/system-time";

vi.mock("../src/adapters/hl/session-key-executor", () => ({
  executeHlSessionKeyOrder: vi.fn(async () => ({
    ok: true,
    dryRun: true,
    filledUsd: 10,
    reduceOnly: false,
  })),
}));

const SOIL_AUDIT: LiveBookSoilAudit = {
  ok: true,
  tripped: false,
  crossVenueSlippage: 0.0004,
  spotPerpSlippage: 0.0003,
  reasons: [],
  probe: {
    symbol: "ETH",
    bestBid: 3499,
    bestAsk: 3501,
    midPx: 3500,
    bidDepthUsd: 200_000,
    askDepthUsd: 200_000,
    depthUsd: 400_000,
    spreadBps: 5.7,
    priceImpactBps: 18,
  },
  spreadBps: 5.7,
  priceImpactBps: 18,
};

describe("verified-5tx helpers", () => {
  it("builds Hyperliquid testnet explorer URLs", () => {
    const url = buildHlTestnetExplorerUrl("0xabc123");
    expect(url).toBe(
      "https://app.hyperliquid-testnet.xyz/explorer/tx/0xabc123",
    );
  });

  it("buildPreTradeFromSoilAudit arms HL testnet $5K depth gate", () => {
    const audit: LiveBookSoilAudit = {
      ...SOIL_AUDIT,
      probe: { ...SOIL_AUDIT.probe, depthUsd: 42_000 },
    };
    const preTrade = buildPreTradeFromSoilAudit(audit, 10, 50_000);
    expect(preTrade.isTestnet).toBe(true);
    expect(preTrade.minDepthUsd).toBe(5_000);
    expect(preTrade.depthUsd).toBe(42_000);
  });

  it("applyW01DepthRefillDefense boosts depth with +32 bps minimum", () => {
    const base = buildPreTradeFromSoilAudit(SOIL_AUDIT, 10, 50_000);
    const armed = applyW01DepthRefillDefense(base, SOIL_AUDIT, 10);
    expect(armed.depthUsd).toBeGreaterThan(base.depthUsd ?? 0);
    expect(armed.orderSizeUsd).toBe(10);
  });

  it("aggregates fill slippage into telemetry", () => {
    const fills: Verified5TxFillRecord[] = [
      {
        index: 1,
        side: "BUY",
        symbol: "ETH",
        notionalUsd: 10,
        txHash: "0x1",
        fillTimeSec: 1,
        timestamp: new Date().toISOString(),
        explorerUrl: buildHlTestnetExplorerUrl("0x1"),
        soilPassed: true,
        w01DepthRefillBps: 32,
        rawSlippageBps: 8,
        gatedSlippageBps: 2,
        savedUsd: 0.006,
        dryRun: true,
      },
    ];
    const agg = aggregateVerifiedFills(fills);
    expect(agg.sampleCount).toBe(1);
    expect(agg.savedUsd).toBeGreaterThan(0);
  });

  it("pickFillTxMeta reads hash and timestamp from HL fill", () => {
    const hash =
      "0xdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef";
    const meta = pickFillTxMeta({
      hash,
      time: 1_700_000_000_000,
    });
    expect(meta.txHash).toBe(hash);
    expect(meta.fillTimeSec).toBe(1_700_000_000);
  });

  it("computeVerified5TxSha256Anchor matches node crypto over fills JSON", () => {
    const fills = verifiedResultsJson.fills as Verified5TxFillRecord[];
    const anchor = computeVerified5TxSha256Anchor(fills);
    expect(anchor).toMatch(/^[0-9a-f]{64}$/);
    expect(anchor).not.toBe(
      "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    );
  });

  it("applyTestnetGrantSoilBoost records audit trail fields", () => {
    const tripped: LiveBookSoilAudit = {
      ...SOIL_AUDIT,
      ok: false,
      tripped: true,
      reasons: ["DEPTH_USD=50000<100000"],
      probe: { ...SOIL_AUDIT.probe, depthUsd: 50_000 },
    };
    const boosted = applyTestnetGrantSoilBoost(tripped, 10);
    expect(boosted.soilBoostApplied).toBe(true);
    expect(boosted.originalDepthUsd).toBe(50_000);
    expect(boosted.probe.depthUsd).toBeGreaterThan(50_000);
  });

  it("estimateSlippageBps gates raw impact", () => {
    const { rawSlippageBps, gatedSlippageBps } = estimateSlippageBps(
      3500,
      3510,
    );
    expect(rawSlippageBps).toBeGreaterThan(gatedSlippageBps);
  });
});

describe("verified-5tx SSOT fixture", () => {
  it("loads verified_5tx_results.json with five explorer-ready fills", () => {
    expect(verifiedResultsJson.fills).toHaveLength(5);
    expect(verifiedResultsJson.network).toBe("hyperliquid-testnet");
    expect(verifiedResultsJson.fills[0]!.explorerUrl).toContain(
      "app.hyperliquid-testnet.xyz/explorer/tx/",
    );
    expect(verifiedResultsJson.aggregate.sampleCount).toBe(5);
    expect(verifiedResultsJson.soilAudit?.ok).toBe(true);
  });
});

describe("runVerify5Tx dry-run", () => {
  beforeEach(() => {
    vi.setSystemTime(SAFE_TRADING_TIME);
  });

  it(
    "executes 5 dry-run orders offline without live HL RPC",
    async () => {
      const fetchFn = vi.fn(async () =>
        Response.json({
          coin: "ETH",
          levels: [
            [{ px: "3499", sz: "100" }],
            [{ px: "3501", sz: "100" }],
          ],
        }),
      );

      const report = await runVerify5Tx({
        live: false,
        fetchFn: fetchFn as typeof fetch,
      });

      expect(report.fills).toHaveLength(5);
      expect(report.dryRun).toBe(true);
      expect(report.fills[0]!.explorerUrl).toContain(
        "app.hyperliquid-testnet.xyz/explorer/tx/",
      );
      expect(report.aggregate.sampleCount).toBe(5);
      expect(report.soilAudit?.ok).toBe(true);
      expect(fetchFn).not.toHaveBeenCalled();
    },
    5_000,
  );

  it("generates unique dry-run hashes per fill and per execution", async () => {
    const reportA = await runVerify5Tx({ live: false });
    const reportB = await runVerify5Tx({ live: false });
    const hashesA = reportA.fills.map((fill) => fill.txHash);
    const hashesB = reportB.fills.map((fill) => fill.txHash);
    expect(new Set(hashesA).size).toBe(5);
    expect(new Set([...hashesA, ...hashesB]).size).toBe(10);
    for (const hash of hashesA) {
      expect(isValidFillTxHash(hash)).toBe(true);
    }
  });
});
