/**
 * GMX v2 Arbitrum adapter — venue-specific types (GM Pools / markets/info).
 */

import type { GmxMarketInfo } from "../../adapters/gmx";
import type { ArbitrumDexFetchOptions } from "./arbitrum-adapter";

export const GMX_V2_ADAPTER_ID = "gmx-v2" as const;

export interface GmxV2AdapterOptions extends ArbitrumDexFetchOptions {
  marketsUrl?: string;
  rpcUrl?: string;
  dataStore?: string;
  /** Default order TTL for unsigned hedge payloads (ms). */
  orderTtlMs?: number;
  /** SliverVine Treasury — overrides `GMX_UI_FEE_RECEIVER` when set. */
  uiFeeReceiver?: string;
  /** GMX v2 referral code (bytes32 hex). */
  referralCode?: string;
  /** Override GMX keeper executionFee (wei string). */
  executionFeeWei?: string;
}

export interface GmxV2ResolvedMarket {
  info: GmxMarketInfo;
  symbol: string;
  poolLiquidityUsd: number;
  midPriceUsd: number;
  vaultMarketCount: number;
  staleTimestamp: string | null;
  degraded: boolean;
}

/** GMX v2 CreateOrderParams.orderType — canonical contract enum. */
export type GmxV2OrderType =
  | "MarketIncrease"
  | "MarketDecrease"
  | "LimitIncrease"
  | "LimitDecrease";

/** Unsigned GMX v2 increase/decrease order wire — aligned with CreateOrderParams. */
export interface GmxV2UnsignedOrderPayload {
  action: "increase" | "decrease";
  orderType: GmxV2OrderType;
  marketToken: string;
  collateralToken: string;
  isLong: boolean;
  sizeDeltaUsd: string;
  acceptablePrice: string;
  executionFee: string;
  minOutputAmount: string;
  initialCollateralDeltaAmount: string;
  callbackGasLimit: string;
  reduceOnly: boolean;
  clientOrderId?: string;
  slippageBps: number;
  uiFeeReceiver: string;
  referralCode: string;
}

export interface GmxV2MarketsInfoResponse {
  markets?: GmxV2ExtendedMarketInfo[];
}

export interface GmxV2ExtendedMarketInfo extends GmxMarketInfo {
  marketToken?: string;
  longToken?: string;
  shortToken?: string;
  borrowingRateLong?: string;
  borrowingRateShort?: string;
  fundingRateLong?: string;
  fundingRateShort?: string;
}
