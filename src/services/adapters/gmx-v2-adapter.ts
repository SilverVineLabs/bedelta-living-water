/**
 * GMX v2 Arbitrum adapter — IArbitrumDexAdapter (RPC fallback + stale degradation).
 */

import type {
  ArbitrumDexHealthResult,
  ArbitrumFundingBorrowInput,
  ArbitrumFundingBorrowRates,
  ArbitrumMarketDepthInput,
  ArbitrumMarketDepthSnapshot,
  ArbitrumUnsignedHedgeOrder,
  ArbitrumUnsignedHedgeOrderInput,
  IArbitrumDexAdapter,
} from "./arbitrum-adapter";
import {
  GMX_V2_ADAPTER_ID,
  type GmxV2AdapterOptions,
  type GmxV2ExtendedMarketInfo,
} from "./gmx-v2-adapter.types";
import { buildGmxV2UnsignedOrderPayload } from "./gmx-v2-order-payload";
import {
  fetchGmxLiveContext,
  resolveGmxMarket,
  spreadBpsFromLiquidity,
} from "./gmx-v2-adapter.utils";
import { fetchSplitBorrowRates, setGmxDataStoreStatusCache } from "./gmx-v2-datastore";
import { poolWeightsFromGmxMarket } from "../yield/gmx-v2-price-impact";

const DEFAULT_ORDER_TTL_MS = 120_000;

export class GmxV2ArbitrumAdapter implements IArbitrumDexAdapter {
  readonly venueId = GMX_V2_ADAPTER_ID;
  readonly displayName = "GMX v2 (Arbitrum)";

  constructor(private readonly opts: GmxV2AdapterOptions = {}) {}

  async getMarketDepth(input: ArbitrumMarketDepthInput): Promise<ArbitrumMarketDepthSnapshot> {
    const ctx = await fetchGmxLiveContext(this.opts);
    const resolved = resolveGmxMarket(ctx, input.symbol);
    const half = resolved.poolLiquidityUsd / 2;
    return {
      venue: this.venueId,
      symbol: resolved.symbol,
      market: input.market ?? "perp",
      bidDepthUsd: half,
      askDepthUsd: half,
      midPriceUsd: resolved.midPriceUsd,
      spreadBps: spreadBpsFromLiquidity(resolved.poolLiquidityUsd),
      gmPoolLiquidityUsd: resolved.poolLiquidityUsd,
      fetchedAt: resolved.staleTimestamp ?? new Date().toISOString(),
    };
  }

  async getFundingAndBorrowRates(
    input: ArbitrumFundingBorrowInput,
  ): Promise<ArbitrumFundingBorrowRates> {
    const ctx = await fetchGmxLiveContext(this.opts);
    const resolved = resolveGmxMarket(ctx, input.symbol);
    const side = input.side ?? "short";
    const info = resolved.info as GmxV2ExtendedMarketInfo;
    const split = await fetchSplitBorrowRates({
      market: {
        marketToken: info.marketToken ?? info.name ?? resolved.symbol,
        longToken: info.longToken ?? "0x2f2a2543B76A4166549F7aaB2e75Bef0aefC5B0f",
        shortToken: info.shortToken ?? "0xaf88d065e77c8cC2239327C5EDb3A432268e5831",
      },
      opts: this.opts,
      fallback: {
        borrowingRateLong: info.borrowingRateLong,
        borrowingRateShort: info.borrowingRateShort,
        fundingRateLong: info.fundingRateLong,
        fundingRateShort: info.fundingRateShort,
      },
    });
    const borrowRateHourly =
      side === "long" ? split.longBorrowRateHourly : split.shortBorrowRateHourly;
    const fetchedAt = resolved.staleTimestamp ?? new Date().toISOString();
    setGmxDataStoreStatusCache({
      symbol: resolved.symbol,
      marketToken: info.marketToken ?? info.name ?? resolved.symbol,
      longBorrowRateHourly: split.longBorrowRateHourly,
      shortBorrowRateHourly: split.shortBorrowRateHourly,
      fundingRateHourly: split.fundingRateHourly,
      source: split.source,
      fetchedAt,
    });
    return {
      venue: this.venueId,
      symbol: resolved.symbol,
      side,
      fundingRateHourly: split.fundingRateHourly,
      borrowRateHourly,
      longBorrowRateHourly: split.longBorrowRateHourly,
      shortBorrowRateHourly: split.shortBorrowRateHourly,
      netCarryHourly: split.fundingRateHourly - borrowRateHourly,
      fetchedAt,
    };
  }

  async buildUnsignedHedgeOrder(
    input: ArbitrumUnsignedHedgeOrderInput,
  ): Promise<ArbitrumUnsignedHedgeOrder> {
    const ctx = await fetchGmxLiveContext(this.opts);
    const resolved = resolveGmxMarket(ctx, input.symbol);
    const now = this.opts.now?.() ?? Date.now();
    const ttl = this.opts.orderTtlMs ?? DEFAULT_ORDER_TTL_MS;
    const pool = poolWeightsFromGmxMarket(resolved.info, resolved.midPriceUsd);
    const payload = buildGmxV2UnsignedOrderPayload(
      {
        side: input.side,
        sizeUsd: input.sizeUsd,
        reduceOnly: input.reduceOnly,
        maxSlippageBps: input.maxSlippageBps,
        clientOrderId: input.clientOrderId,
        marketToken: resolved.info.name ?? resolved.symbol,
        midPriceUsd: resolved.midPriceUsd,
        pool,
        uiFeeReceiver: input.uiFeeReceiver,
        referralCode: input.referralCode,
      },
      this.opts,
    );

    return {
      venue: this.venueId,
      symbol: resolved.symbol,
      side: input.side,
      sizeUsd: input.sizeUsd,
      estimatedNotionalUsd: input.sizeUsd,
      payload: payload as unknown as Record<string, unknown>,
      expiresAtMs: now + ttl,
    };
  }

  async checkHealth(): Promise<ArbitrumDexHealthResult> {
    const t0 = performance.now();
    try {
      const ctx = await fetchGmxLiveContext(this.opts);
      const hardFail = ctx.markets.length === 0 && !ctx.staleTimestamp;
      return {
        ok: !hardFail && !ctx.degraded,
        venue: this.venueId,
        latencyMs: performance.now() - t0,
        reasons: ctx.degradationReasons,
        staleTimestamp: ctx.staleTimestamp,
        degraded: ctx.degraded,
        rpcProvider: ctx.rpc.rpcProvider,
      };
    } catch (err) {
      return {
        ok: false,
        venue: this.venueId,
        latencyMs: performance.now() - t0,
        reasons: [err instanceof Error ? err.message : String(err)],
        staleTimestamp: new Date().toISOString(),
        degraded: true,
      };
    }
  }
}

export const gmxV2ArbitrumAdapter = new GmxV2ArbitrumAdapter();
