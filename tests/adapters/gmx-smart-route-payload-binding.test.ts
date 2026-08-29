import { describe, expect, it } from "vitest";
import { encodeAbiParameters, keccak256 } from "viem";
import { quoteRChainYieldToArbitrumGm } from "../../src/adapters/robinhood/r-chain-yield-router";
import { GMX_MARKET_REGISTRY } from "../../src/config/gmx-markets";
import {
  GMX_V2_EXCHANGE_ROUTER_ARBITRUM,
  resolveZeroDevSmartRouteTarget,
} from "../../src/config/gmx-revenue";
import { ARBITRUM_ONE_CHAIN_ID, ROBINHOOD_TESTNET_CHAIN_ID } from "../../src/sdk/constants";
import { computeGatedExecutorPayloadHash } from "../../src/sdk/gated-executor-payload";
import {
  buildGmxSmartRoutePayloadBinding,
  encodeGmxSmartRouteBindingData,
} from "../../src/services/adapters/gmx-smart-route-payload-binding";
import { buildGmxV2UnsignedOrderPayload } from "../../src/services/adapters/gmx-v2-order-payload";
import { useGmxOrderPayloadTestHooks } from "./gmx-v2-order-payload-lib/gmx-v2-order-payload-shared";

const WALLET = "0xcccccccccccccccccccccccccccccccccccccccc";
const EXECUTOR = "0x511E111111111111111111111111111111111111";
const INITIATOR = "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
const NOW = 1_700_000_000_000;

describe("gmx smart-route payload binding", () => {
  useGmxOrderPayloadTestHooks();

  const orderPayload = buildGmxV2UnsignedOrderPayload({
    side: "long",
    sizeUsd: 1_000,
    midPriceUsd: 3_200,
    marketToken: GMX_MARKET_REGISTRY["ETH/USDC"].marketToken,
    maxSlippageBps: 30,
  });

  it("quoteRChainYieldToArbitrumGm resolves targetRoute + smartRoutingAddress", () => {
    const q = quoteRChainYieldToArbitrumGm({
      assetKind: "idle",
      symbol: "USDG",
      amountUsd: 1_000,
      wallet: WALLET,
      sourceChainId: ROBINHOOD_TESTNET_CHAIN_ID,
      targetRoute: "GM_BTC_USDC",
      initiatedAtMs: NOW,
      settledAtMs: NOW + 500,
      nowMs: NOW + 1_000,
    });
    expect(q.ok).toBe(true);
    expect(q.targetRoute).toBe("GM_BTC_USDC");
    expect(q.smartRoutingAddress).toBe(GMX_V2_EXCHANGE_ROUTER_ARBITRUM);
    expect(q.destMarketToken).toBe(GMX_MARKET_REGISTRY["BTC/USDC"].marketToken);
  });

  it("buildGmxSmartRoutePayloadBinding matches GatedExecutor.payloadHash formula", () => {
    const binding = buildGmxSmartRoutePayloadBinding({
      sourceChainId: ROBINHOOD_TESTNET_CHAIN_ID,
      executor: EXECUTOR,
      initiator: INITIATOR,
      nonce: 7n,
      orderPayload,
      targetRoute: "GM_ETH_USDC",
    });
    const smart = resolveZeroDevSmartRouteTarget(ROBINHOOD_TESTNET_CHAIN_ID)!;
    const data = encodeGmxSmartRouteBindingData({
      sourceChainId: ROBINHOOD_TESTNET_CHAIN_ID,
      targetRoute: "GM_ETH_USDC",
      marketToken: GMX_MARKET_REGISTRY["ETH/USDC"].marketToken,
      orderPayload,
    });
    const manual = keccak256(
      encodeAbiParameters(
        [
          { type: "uint256" },
          { type: "address" },
          { type: "address" },
          { type: "address" },
          { type: "bytes32" },
          { type: "uint256" },
        ],
        [
          BigInt(smart.destChainId),
          EXECUTOR,
          INITIATOR,
          smart.smartRoutingAddress,
          keccak256(data),
          7n,
        ],
      ),
    );
    expect(binding.chainId).toBe(ARBITRUM_ONE_CHAIN_ID);
    expect(binding.data).toBe(data);
    expect(binding.payloadHash).toBe(manual);
    expect(binding.payloadHash).toBe(
      computeGatedExecutorPayloadHash({
        chainId: ARBITRUM_ONE_CHAIN_ID,
        executor: EXECUTOR,
        initiator: INITIATOR,
        target: GMX_V2_EXCHANGE_ROUTER_ARBITRUM,
        data,
        nonce: 7n,
      }),
    );
    expect(binding.payloadHash).toMatch(/^0x[a-f0-9]{64}$/);
  });

  it("payloadHash is stable and diverges on nonce tamper", () => {
    const base = buildGmxSmartRoutePayloadBinding({
      sourceChainId: ROBINHOOD_TESTNET_CHAIN_ID,
      executor: EXECUTOR,
      initiator: INITIATOR,
      nonce: 1n,
      orderPayload,
    });
    const replay = buildGmxSmartRoutePayloadBinding({
      sourceChainId: ROBINHOOD_TESTNET_CHAIN_ID,
      executor: EXECUTOR,
      initiator: INITIATOR,
      nonce: 1n,
      orderPayload,
    });
    const tampered = buildGmxSmartRoutePayloadBinding({
      sourceChainId: ROBINHOOD_TESTNET_CHAIN_ID,
      executor: EXECUTOR,
      initiator: INITIATOR,
      nonce: 2n,
      orderPayload,
    });
    expect(replay.payloadHash).toBe(base.payloadHash);
    expect(tampered.payloadHash).not.toBe(base.payloadHash);
  });
});
