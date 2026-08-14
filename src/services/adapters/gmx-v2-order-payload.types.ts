import type { ArbitrumHedgeSide } from "./arbitrum-adapter";
import type { GmxV2OrderType } from "./gmx-v2-adapter.types";
import type { GmxV2PoolWeights } from "../yield/gmx-v2-price-impact";

export const GMX_ORDER_TYPE_INDEX: Record<GmxV2OrderType, number> = {
  MarketIncrease: 2,
  LimitIncrease: 3,
  MarketDecrease: 4,
  LimitDecrease: 5,
};

export interface GmxV2OrderFeeConfig {
  uiFeeReceiver?: string;
  referralCode?: string;
  executionFeeWei?: string;
}

export interface GmxV2BuildUnsignedOrderInput extends GmxV2OrderFeeConfig {
  side: ArbitrumHedgeSide;
  sizeUsd: number;
  reduceOnly?: boolean;
  maxSlippageBps?: number;
  clientOrderId?: string;
  marketToken: string;
  midPriceUsd: number;
  pool?: GmxV2PoolWeights;
  signedImpactBps?: number;
  orderType?: GmxV2OrderType;
  limitOrder?: boolean;
  minOutputAmount?: string;
  initialCollateralDeltaAmount?: string;
  callbackGasLimit?: string;
  receiver?: string;
  skipFailClosedGuards?: boolean;
}

export interface GmxV2BuildDepositPayloadInput extends GmxV2OrderFeeConfig {
  marketToken: string;
  sizeUsd: number;
  collateralToken?: string;
  receiver?: string;
}
