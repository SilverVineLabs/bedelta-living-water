import type {
  HyperliquidMetaAndAssetCtxs,
} from "../../types/matrix";
import type {
  ExchangeAdapter,
  MarketDataSnapshot,
  OrderPayload,
  OrderPayloadInput,
  OrderSlippageInput,
  OrderSlippageResult,
} from "./exchange-adapter";
import { evaluateOrderSlippage } from "./exchange-adapter";
import { BROWSER_MIMIC_USER_AGENT } from "../defense/rpc-whitelist";
import {
  classifyExchangeFetchFailure,
  formatExchangeUnavailableWarning,
} from "./safe-exchange-fetch";
import {
  extractTradFiFromAllMids,
  mergeAllMidsMaps,
  type HyperliquidAllMids,
} from "./tradfi-allmids";
import { parseTradFiEnrichmentFromXyzMeta } from "./tradfi-enrichment";
import { postHlInfo } from "./hl-l2-book";
import { HL_EXCHANGE_URL } from "../../config/constants";
import type { HyperliquidParseBundle } from "./hl-types";
import { parseHyperliquidCryptoResponse } from "./hl-parse";

const UA_HEADERS = {
  "User-Agent": BROWSER_MIMIC_USER_AGENT,
  Accept: "application/json, text/plain, */*",
} as const;

function logHlExchangeWarning(message: string, debugSystemLogs: string[]): void {
  debugSystemLogs.push(message);
  console.warn(message);
}

function describeSettledFailure(result: PromiseSettledResult<Response>): string {
  if (result.status === "rejected") {
    return classifyExchangeFetchFailure(result.reason).label;
  }
  return String(result.value.status);
}

export class HyperliquidAdapter implements ExchangeAdapter {
  readonly id = "hyperliquid" as const;
  readonly displayName = "Hyperliquid";

  private lastBundle: HyperliquidParseBundle | null = null;

  getLastBundle(): HyperliquidParseBundle | null {
    return this.lastBundle;
  }

  async fetchMarketData(): Promise<MarketDataSnapshot> {
    const bundle = await this.fetchClassifiedBundle();
    return bundle.snapshot;
  }

  /** Fetch crypto + TradFi in parallel; TradFi never aborts crypto path. */
  async fetchClassifiedBundle(): Promise<HyperliquidParseBundle> {
    const debugSystemLogs: string[] = [];
    const previousBundle = this.lastBundle;
    let crypto: {
      snapshot: MarketDataSnapshot;
      cryptoMaps: import("./hl-types").HyperliquidMaps;
      dayVolumeUsd: Record<string, number>;
    } = {
      snapshot: {
        exchangeId: "hyperliquid",
        quotes: {},
        fetchedAt: new Date().toISOString(),
      },
      cryptoMaps: { hlSpot: {}, hlPerp: {}, hlFunding: {} },
      dayVolumeUsd: {},
    };
    let allMids: HyperliquidAllMids = {};

    const [metaResult, metaXyzResult, midsMainResult, midsXyzResult] =
      await Promise.allSettled([
      postHlInfo({ type: "metaAndAssetCtxs" }),
      postHlInfo({ type: "metaAndAssetCtxs", dex: "xyz" }),
      postHlInfo({ type: "allMids" }),
      postHlInfo({ type: "allMids", dex: "xyz" }),
    ]);

    try {
      if (metaResult.status === "fulfilled" && metaResult.value.ok) {
        const raw =
          (await metaResult.value.json()) as HyperliquidMetaAndAssetCtxs;
        crypto = parseHyperliquidCryptoResponse(raw, debugSystemLogs);
      } else {
        const reason = describeSettledFailure(metaResult);
        logHlExchangeWarning(
          formatExchangeUnavailableWarning("Hyperliquid", reason),
          debugSystemLogs,
        );
        logHlExchangeWarning(`[HL meta] FAILED: ${reason}`, debugSystemLogs);
      }
    } catch (err) {
      const reason = classifyExchangeFetchFailure(err).label;
      logHlExchangeWarning(
        formatExchangeUnavailableWarning("Hyperliquid", reason),
        debugSystemLogs,
      );
      const msg = `[HL meta] PARSE ERROR: ${reason}`;
      debugSystemLogs.push(msg);
      console.warn(msg);
    }

    let tradfiEnrichment: HyperliquidParseBundle["tradfiEnrichment"] = {
      commodities: {},
      stocks: {},
      indices: {},
      fx: {},
      preipo: {},
      kings: {},
    };

    try {
      if (metaXyzResult.status === "fulfilled" && metaXyzResult.value.ok) {
        const rawXyz =
          (await metaXyzResult.value.json()) as HyperliquidMetaAndAssetCtxs;
        tradfiEnrichment = parseTradFiEnrichmentFromXyzMeta(
          rawXyz,
          debugSystemLogs,
        );
      } else {
        const reason = describeSettledFailure(metaXyzResult);
        const msg = `[HL meta] xyz dex FAILED: ${reason}`;
        logHlExchangeWarning(msg, debugSystemLogs);
      }
    } catch (err) {
      const reason = classifyExchangeFetchFailure(err).label;
      const msg = `[HL meta] xyz dex PARSE ERROR: ${reason}`;
      debugSystemLogs.push(msg);
      console.warn(msg);
    }

    let mainMids: HyperliquidAllMids = {};
    let xyzMids: HyperliquidAllMids = {};

    try {
      if (midsMainResult.status === "fulfilled" && midsMainResult.value.ok) {
        mainMids = (await midsMainResult.value.json()) as HyperliquidAllMids;
      } else {
        const reason = describeSettledFailure(midsMainResult);
        const msg = `[allMids] main FAILED: ${reason}`;
        logHlExchangeWarning(msg, debugSystemLogs);
      }
    } catch (err) {
      const reason = classifyExchangeFetchFailure(err).label;
      const msg = `[allMids] main PARSE ERROR: ${reason}`;
      debugSystemLogs.push(msg);
      console.warn(msg);
    }

    try {
      if (midsXyzResult.status === "fulfilled" && midsXyzResult.value.ok) {
        xyzMids = (await midsXyzResult.value.json()) as HyperliquidAllMids;
      } else {
        const reason = describeSettledFailure(midsXyzResult);
        const msg = `[allMids] xyz dex FAILED: ${reason} — TradFi may be empty`;
        logHlExchangeWarning(msg, debugSystemLogs);
      }
    } catch (err) {
      const reason = classifyExchangeFetchFailure(err).label;
      const msg = `[allMids] xyz dex PARSE ERROR: ${reason}`;
      debugSystemLogs.push(msg);
      console.warn(msg);
    }

    allMids = mergeAllMidsMaps(mainMids, xyzMids);

    const tradFi = extractTradFiFromAllMids(allMids, debugSystemLogs);

    if (
      previousBundle &&
      Object.keys(crypto.cryptoMaps.hlPerp).length === 0 &&
      Object.keys(previousBundle.cryptoMaps.hlPerp).length > 0
    ) {
      logHlExchangeWarning(
        formatExchangeUnavailableWarning("Hyperliquid", "503/Timeout"),
        debugSystemLogs,
      );
      crypto = {
        snapshot: {
          ...previousBundle.snapshot,
          fetchedAt: new Date().toISOString(),
        },
        cryptoMaps: previousBundle.cryptoMaps,
        dayVolumeUsd: previousBundle.dayVolumeUsd,
      };
    }

    const bundle: HyperliquidParseBundle = {
      snapshot: crypto.snapshot,
      cryptoMaps: crypto.cryptoMaps,
      dayVolumeUsd: crypto.dayVolumeUsd,
      commodities: tradFi.commodities,
      stocks: tradFi.stocks,
      indices: tradFi.indices,
      fx: tradFi.fx,
      preipo: tradFi.preipo,
      tradfiEnrichment,
      debugSystemLogs,
    };

    this.lastBundle = bundle;
    return bundle;
  }

  calculateOrderSlippage(input: OrderSlippageInput): OrderSlippageResult {
    return evaluateOrderSlippage(input);
  }

  buildOrderPayload(input: OrderPayloadInput): OrderPayload {
    const isBuy = input.side === "buy";
    const size = input.sizeUsd;
    const price = input.limitPrice ?? 0;
    const symbol = input.symbol.toUpperCase();

    return {
      exchangeId: "hyperliquid",
      symbol,
      side: input.side,
      endpoint: HL_EXCHANGE_URL,
      method: "POST",
      headers: { "Content-Type": "application/json", ...UA_HEADERS },
      body: {
        type: "order",
        orders: [
          {
            a: symbol,
            b: isBuy,
            p: String(price),
            s: String(size),
            r: input.reduceOnly ?? false,
            t: { limit: { tif: "Ioc" } },
          },
        ],
      },
    };
  }
}

export const hyperliquidAdapter = new HyperliquidAdapter();
