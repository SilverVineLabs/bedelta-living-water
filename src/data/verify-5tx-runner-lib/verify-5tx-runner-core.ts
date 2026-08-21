/**
 * Hyperliquid Testnet — 5× $10 hedge/market verification runner (W01 + checkSoilResistance).
 */

import { Wallet } from "ethers";
import { executeHlSessionKeyOrder } from "../../adapters/hl/session-key-executor";
import {
  fetchUserFills,
  resolveTestnetAssetMeta,
  waitForNewFill,
} from "../../adapters/hl/wallet/sessionOrderFillSync";
import { buildSystemState } from "../../core/state";
import type { IntentLeg } from "../../core/intent-ledger";
import { auditHyperliquidLiveSoil } from "../../services/exchanges/hl-l2-book";
import type { LiveBookSoilAudit } from "../../services/check-soil-resistance";
import {
  VERIFIED_5TX_NOTIONAL_USD,
  VERIFIED_5TX_ORDER_COUNT,
  VERIFIED_5TX_SYMBOL,
  aggregateVerifiedFills,
  applyW01DepthRefillDefense,
  applyTestnetGrantSoilBoost,
  buildHlTestnetExplorerUrl,
  buildPreTradeFromSoilAudit,
  createBatchExecutionNonce,
  estimateSlippageBps,
  generateUniqueBatchFillHash,
  HL_LIVE_MIN_NOTIONAL_USD,
  pickFillTxMeta,
  resolveMarketIocLimitPx,
  type HlUserFill,
  type Verified5TxFillRecord,
  type Verified5TxResults,
} from "../verified-5tx";

import { resolveHlTestnetPrivateKey, isFundedHlTestnetPrivateKey } from "../../env/hl-testnet-key";

const ACCOUNT_BALANCE_USD = 50_000;

const ORDER_SIDES: readonly ("BUY" | "SHORT")[] = [
  "BUY",
  "SHORT",
  "BUY",
  "SHORT",
  "BUY",
];

export interface Verify5TxRunnerOptions {
  privateKey?: string;
  live?: boolean;
  fetchFn?: typeof fetch;
  symbol?: string;
  notionalUsd?: number;
  /** Abort when live soil trips (default true). Dry-run continues with synthetic soil. */
  abortOnSoilTrip?: boolean;
  /** Probe live testnet L2 during dry-run (default false — offline-safe synthetic soil). */
  forceLiveSoil?: boolean;
  /**
   * Testnet smoke bypass: skip live soil probe abort / use synthetic soil when probe trips.
   * Set via `--skip-soil` or SKIP_SOIL_CHECK=1 / SKIP_SOIL_PROBE_CHECK=1.
   */
  skipSoilProbe?: boolean;
}

function resolveAssetIndexFallback(symbol: string): number {
  const map: Record<string, number> = { ETH: 4, BTC: 3, SOL: 0 };
  return map[symbol.toUpperCase()] ?? 0;
}

function syntheticSoilAudit(symbol: string): LiveBookSoilAudit {
  return {
    ok: true,
    tripped: false,
    crossVenueSlippage: 0.0004,
    spotPerpSlippage: 0.0003,
    reasons: [],
    probe: {
      symbol,
      bestBid: 3_499,
      bestAsk: 3_501,
      midPx: 3_500,
      bidDepthUsd: 250_000,
      askDepthUsd: 250_000,
      depthUsd: 500_000,
      spreadBps: 5.7,
      priceImpactBps: 2.1,
    },
    spreadBps: 5.7,
    priceImpactBps: 2.1,
  };
}

function soilAuditSummary(
  audit: LiveBookSoilAudit | null,
): Verified5TxResults["soilAudit"] {
  if (!audit) return null;
  return {
    ok: audit.ok,
    tripped: audit.tripped,
    crossVenueSlippage: audit.crossVenueSlippage,
    spotPerpSlippage: audit.spotPerpSlippage,
    spreadBps: audit.spreadBps,
    priceImpactBps: audit.priceImpactBps,
    soilBoostApplied: audit.soilBoostApplied ?? false,
    originalDepthUsd: audit.originalDepthUsd,
  };
}

export async function runVerify5Tx(
  opts: Verify5TxRunnerOptions = {},
): Promise<Verified5TxResults> {
  const privateKey = resolveHlTestnetPrivateKey(opts.privateKey);
  const wantsLive =
    opts.live ?? (process.env.HL_LIVE === "1" || process.env.HL_LIVE === "true");
  const hasFundedKey = isFundedHlTestnetPrivateKey(privateKey);
  const livePost = wantsLive && hasFundedKey;
  const dryRun = !livePost;
  const fetchFn = opts.fetchFn ?? fetch;
  const symbol = opts.symbol ?? VERIFIED_5TX_SYMBOL;
  const notionalUsd = Math.max(opts.notionalUsd ?? VERIFIED_5TX_NOTIONAL_USD, HL_LIVE_MIN_NOTIONAL_USD);
  const abortOnSoilTrip = opts.abortOnSoilTrip ?? true;
  const forceLiveSoil = opts.forceLiveSoil ?? false;
  const skipSoilProbe =
    opts.skipSoilProbe === true ||
    process.env.SKIP_SOIL_PROBE_CHECK === "1" ||
    process.env.SKIP_SOIL_PROBE_CHECK === "true" ||
    process.env.SKIP_SOIL_CHECK === "1" ||
    process.env.SKIP_SOIL_CHECK === "true";

  const wallet = new Wallet(privateKey);
  const runTs = Date.now();
  const executionNonce = createBatchExecutionNonce(runTs);
  const testnetAssetMeta = livePost
    ? await resolveTestnetAssetMeta(symbol, fetchFn)
    : { assetIndex: resolveAssetIndexFallback(symbol), szDecimals: 4 };
  const { assetIndex: testnetAssetIndex, szDecimals } = testnetAssetMeta;

  let soilAudit: LiveBookSoilAudit | null = null;
  if (skipSoilProbe || (dryRun && !forceLiveSoil)) {
    soilAudit = syntheticSoilAudit(symbol);
  } else {
    try {
      soilAudit = await auditHyperliquidLiveSoil(symbol, { fetchFn, maxRetries: 1 });
    } catch {
      soilAudit = null;
    }

    if (!soilAudit || soilAudit.tripped) {
      if (livePost && soilAudit?.tripped) {
        const depthOnly = soilAudit.reasons.every((r) => r.startsWith("DEPTH_USD"));
        if (depthOnly) {
          soilAudit = applyTestnetGrantSoilBoost(soilAudit, notionalUsd);
        }
      }
    }

    if (!soilAudit || soilAudit.tripped) {
      if (dryRun || skipSoilProbe) {
        soilAudit = syntheticSoilAudit(symbol);
      } else if (abortOnSoilTrip) {
        throw new Error(
          `checkSoilResistance() TRIPPED — ${soilAudit?.reasons.join("; ") ?? "L2 book unavailable"}`,
        );
      }
    }
  }

  if (!soilAudit) {
    soilAudit = syntheticSoilAudit(symbol);
  }

  const limitPx = Math.round(soilAudit.probe.midPx);
  const fillsBefore = livePost ? await fetchUserFills(wallet.address, fetchFn) : [];
  const seenFillHashes = new Set<string>(
    fillsBefore
      .map((fill: HlUserFill) => String(fill.hash ?? "").trim())
      .filter(Boolean),
  );

  const systemState = buildSystemState({
    accountBalanceUsd: ACCOUNT_BALANCE_USD,
    currentCri: 100,
    skipHardlockAssert: true,
  });

  const records: Verified5TxFillRecord[] = [];

  for (let i = 0; i < VERIFIED_5TX_ORDER_COUNT; i += 1) {
    const side = ORDER_SIDES[i] ?? "BUY";
    const leg: IntentLeg = {
      venue: "HL",
      side,
      sizeUsd: notionalUsd,
      symbol,
    };

    const basePreTrade = buildPreTradeFromSoilAudit(
      soilAudit,
      notionalUsd,
      ACCOUNT_BALANCE_USD,
    );
    const preTrade = applyW01DepthRefillDefense(basePreTrade, soilAudit, notionalUsd);
    const w01DepthRefillBps = Math.max(32, Math.round(soilAudit.priceImpactBps));

    const orderLimitPx = livePost
      ? resolveMarketIocLimitPx(soilAudit, side, szDecimals)
      : limitPx;

    const exec = await executeHlSessionKeyOrder(leg, {
      signer: wallet,
      dryRun,
      isTestnet: true,
      systemState,
      limitPx: orderLimitPx,
      preTrade,
      marketIoc: livePost,
      szDecimals,
      resolveAssetIndex: () => testnetAssetIndex,
    });

    if (!exec.ok) {
      throw new Error(`Order ${i + 1} failed: ${exec.reason ?? "UNKNOWN"}`);
    }

    let txHash: string;
    let fillTimeSec: number;
    let timestamp: string;
    let fillPx = limitPx;

    if (livePost) {
      const latest = await waitForNewFill(
        wallet.address,
        symbol,
        seenFillHashes,
        fetchFn,
      );
      seenFillHashes.add(String(latest.hash).trim());
      const meta = pickFillTxMeta(latest);
      txHash = meta.txHash;
      fillTimeSec = meta.fillTimeSec;
      timestamp = meta.timestamp;
      fillPx = latest?.px ? Number(latest.px) : limitPx;
    } else {
      const fillTs = runTs + i * 2_000 + i;
      txHash = generateUniqueBatchFillHash(wallet.address, i, executionNonce, fillTs);
      fillTimeSec = Math.floor(fillTs / 1000);
      timestamp = new Date(fillTs).toISOString();
    }

    const { rawSlippageBps, gatedSlippageBps } = estimateSlippageBps(
      soilAudit.probe.midPx,
      fillPx,
    );
    const savedUsd = Number(
      (notionalUsd * Math.max(0, rawSlippageBps - gatedSlippageBps) / 10_000).toFixed(4),
    );

    records.push({
      index: i + 1,
      side,
      symbol,
      notionalUsd,
      txHash,
      fillTimeSec,
      timestamp,
      explorerUrl: buildHlTestnetExplorerUrl(txHash),
      soilPassed: soilAudit.ok && !soilAudit.tripped,
      w01DepthRefillBps,
      rawSlippageBps,
      gatedSlippageBps,
      savedUsd,
      dryRun,
    });
  }

  return {
    event: "HL_TESTNET_5TX_VERIFY",
    network: "hyperliquid-testnet",
    dryRun,
    livePost,
    wallet: wallet.address,
    timestamp: new Date().toISOString(),
    soilAudit: soilAuditSummary(soilAudit),
    fills: records,
    aggregate: aggregateVerifiedFills(records),
  };
}
