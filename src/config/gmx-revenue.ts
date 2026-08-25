/**
 * GMX v2 revenue SSOT — uiFeeReceiver treasury + registered referral code.
 */

import {
  type GmPoolRouteKey,
  resolveGmxMarketByRouteKey,
} from "./gmx-markets";

/** SliverVine Treasury — Wallet B uiFeeReceiver (5 bps UI fee accrual). */
export const GMX_UI_FEE_RECEIVER =
  "0xc9BddABD80982d2201376195DD9B85fb7951546f" as const;

export const GMX_UI_FEE_BPS = 5 as const;

/** Registered GMX Builders referral code label. */
export const GMX_REFERRAL_CODE_LABEL = "SILVERVINE" as const;

/** bytes32 referral code for GMX v2 CreateOrderParams.referralCode. */
export const GMX_REFERRAL_CODE_BYTES32 =
  "0x53494c56455256494e4500000000000000000000000000000000000000000000" as const;

const ARBITRUM_ONE = 42161 as const;
const ROBINHOOD_TESTNET = 46630 as const;
const ROBINHOOD_MAINNET = 4663 as const;

/** GMX v2 ExchangeRouter — Arbitrum One gated execution target (docs.gmx.io). */
export const GMX_V2_EXCHANGE_ROUTER_ARBITRUM =
  "0x7dE39FF2e232A2203196788d37e234cF8F1b83f1" as const;

/** ZeroDev smart-routing — Robinhood USDG ingress → Arbitrum GM pool. */
export interface ZeroDevSmartRouteTarget {
  sourceChainId: number;
  destChainId: typeof ARBITRUM_ONE;
  ingressAsset: "USDG";
  gmPoolRouteKey: GmPoolRouteKey;
  smartRoutingAddress: typeof GMX_V2_EXCHANGE_ROUTER_ARBITRUM;
}

export const ZERODEV_SMART_ROUTE_TARGETS: Readonly<Record<number, ZeroDevSmartRouteTarget>> = {
  [ROBINHOOD_TESTNET]: {
    sourceChainId: ROBINHOOD_TESTNET,
    destChainId: ARBITRUM_ONE,
    ingressAsset: "USDG",
    gmPoolRouteKey: "GM_ETH_USDC",
    smartRoutingAddress: GMX_V2_EXCHANGE_ROUTER_ARBITRUM,
  },
  [ROBINHOOD_MAINNET]: {
    sourceChainId: ROBINHOOD_MAINNET,
    destChainId: ARBITRUM_ONE,
    ingressAsset: "USDG",
    gmPoolRouteKey: "GM_ETH_USDC",
    smartRoutingAddress: GMX_V2_EXCHANGE_ROUTER_ARBITRUM,
  },
};

export function resolveZeroDevSmartRouteTarget(
  chainId: number,
): ZeroDevSmartRouteTarget | null {
  return ZERODEV_SMART_ROUTE_TARGETS[chainId] ?? null;
}

export function resolveZeroDevGmMarketToken(chainId: number): string | null {
  const route = resolveZeroDevSmartRouteTarget(chainId);
  return route ? resolveGmxMarketByRouteKey(route.gmPoolRouteKey).marketToken : null;
}
