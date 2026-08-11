import { afterEach, describe, expect, it, vi } from "vitest";
import * as sessionExecutor from "../../src/adapters/hl/session-key-executor";
import {
  __resetHlAutoHedgeStatusForTests,
  computeAutoHedgeSizeUsd,
  runHlAutoHedgeForGmxGm,
} from "../../src/services/hl-auto-hedge";
import { __setGmxGmTelemetryCacheForTests, __resetGmxGmBalanceCacheForTests } from "../../src/services/yield/gmx-v2-gm-telemetry";
import { __setHlWalletTelemetryCacheForTests, __resetHlWalletTelemetryCacheForTests } from "../../src/services/hl-wallet-telemetry";
import { GMX_ETH_USD_MARKET_TOKEN } from "../../src/services/adapters/gmx-v2-gm-balance";
import { resolveHlTestnetDryRunPrivateKey } from "../../src/env/hl-testnet-key";

const WALLET_B = "0xc9BddABD80982d2201376195DD9B85fb7951546f";
const TEST_PK = resolveHlTestnetDryRunPrivateKey();

afterEach(() => {
  __resetHlAutoHedgeStatusForTests();
  __resetGmxGmBalanceCacheForTests();
  __resetHlWalletTelemetryCacheForTests();
  vi.restoreAllMocks();
});

describe("hl-auto-hedge", () => {
  it("computeAutoHedgeSizeUsd targets ~$190 ETH notional capped by HL margin", () => {
    expect(computeAutoHedgeSizeUsd(802.43, 199.8)).toBeCloseTo(189.81, 1);
  });

  it("runHlAutoHedgeForGmxGm executes session-key short in dry-run", async () => {
    __setGmxGmTelemetryCacheForTests({
      userAddress: WALLET_B,
      symbol: "ETH",
      marketToken: GMX_ETH_USD_MARKET_TOKEN,
      gmBalance: 489.716,
      gmLiquidityUsd: 802.43,
      dataStorePoolAmount: 1n,
      source: "datastore",
      fetchedAt: new Date().toISOString(),
    });
    __setHlWalletTelemetryCacheForTests(WALLET_B, {
      address: WALLET_B,
      spotUsdcUsd: 0,
      spotHypeQty: 0,
      spotHypeUsd: 0,
      perpsMarginUsd: 199.8,
      totalUsd: 199.8,
      fetchedAt: new Date().toISOString(),
    });
    vi.spyOn(sessionExecutor, "executeHlSessionKeyOrder").mockResolvedValue({
      ok: true,
      dryRun: true,
      filledUsd: 189.81,
      reduceOnly: false,
    });

    const result = await runHlAutoHedgeForGmxGm(
      {
        SRV_200_MAINNET_SESSION_PK: TEST_PK,
        SRV_200_MAINNET_USER_ADDRESS: WALLET_B,
        IS_MAINNET: "false",
      },
      { dryRun: true, force: true },
    );

    expect(result.ok).toBe(true);
    expect(result.dryRun).toBe(true);
    expect(result.sizeUsd).toBeCloseTo(189.81, 1);
    expect(result.symbol).toBe("ETH");
  });

  it("read-only when SRV_200_MAINNET_SESSION_PK empty", async () => {
    const result = await runHlAutoHedgeForGmxGm({
      SRV_200_MAINNET_SESSION_PK: "",
      SRV_200_MAINNET_USER_ADDRESS: WALLET_B,
    });
    expect(result.ok).toBe(false);
    expect(result.reason).toBe("SRV_200_SESSION_PK_EMPTY_READ_ONLY");
  });
});
