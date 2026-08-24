export type ArbitrumStableSymbol = "USDC" | "USDT";

export const ARBITRUM_STABLE_ADDRESSES: Record<ArbitrumStableSymbol, string> = {
  USDC: "0xaf88d065e77c8cC2239327C5EDb3A432268e5831",
  USDT: "0xFd086bC7CD5C481DCC9CE3f219033bB859fA8Cb",
};

export const DEFAULT_AAVE_BASE_APY: Record<ArbitrumStableSymbol, number> = {
  USDC: 0.038,
  USDT: 0.035,
};

export type ArbitrumYieldSource = "gmx" | "aave" | "default";

export interface ArbitrumStableYieldSnapshot {
  symbol: ArbitrumStableSymbol;
  address: string;
  baseApy: number;
  depthUsd: number;
  source: ArbitrumYieldSource;
  fetchedAt: string;
}

export interface ArbitrumYieldIngressOptions {
  fetchFn?: typeof fetch;
  marketsUrl?: string;
  minDepthUsd?: number;
}

export interface ArbitrumYieldIngressValidation {
  allowed: boolean;
  readyFor2Pc: boolean;
  reasons: string[];
  snapshot: ArbitrumStableYieldSnapshot;
  proposedLeg: import("../../../core/intent-ledger").IntentLeg | null;
}
