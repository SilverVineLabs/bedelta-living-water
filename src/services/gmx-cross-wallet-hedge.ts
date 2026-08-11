/** GMX Wallet B ETH delta → Wallet A Hyperliquid ETH perp short (0-Δ cross-wallet). */
import { Wallet } from "ethers";
import { HL_EXCHANGE_URL, HL_INFO_URL } from "../config/constants";
import { executeHlSessionKeyOrder } from "../adapters/hl/session-key-executor";
import { formatHlPerpPrice } from "../adapters/hl/execution-wire";
import { sanitizeSessionKeyForMasterWalletTrading } from "../adapters/hl/execution-types";
import { buildClearinghouseStateRequest } from "../adapters/hl/wallet/marginChecker";
import { buildSystemState } from "../core/state";
import type { IntentLeg } from "../core/intent-ledger";
import {
  HL_ETH_PERP_ASSET_INDEX,
  HL_ETH_SZ_DECIMALS,
} from "./hl-auto-hedge";
import {
  fetchGmxEthDeltaForWallet,
  fetchHlEthMarkUsdStrict,
  GMX_WALLET_B_DEFAULT,
  type GmxEthDeltaSnapshot,
} from "./gmx-eth-delta";
import { refreshSoilArbitrumProbesWithFallback } from "./risk-control-lib/soil-arb-probe-refresh";

async function postHlInfo(
  body: Record<string, unknown>,
  fetchFn: typeof fetch = fetch,
): Promise<Response> {
  return fetchFn(HL_INFO_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(8_000),
  });
}

export const HL_WALLET_A_DEFAULT =
  "0xef0752df6387248B897F3A59A180af42D801960d" as const;

export interface GmxCrossWalletHedgeResult {
  ok: boolean;
  dryRun: boolean;
  ethDeltaSize: number;
  ethDeltaUsd: number;
  orderEthSize: number;
  orderUsd: number;
  exchangeOid?: number;
  reason?: string;
  delta: GmxEthDeltaSnapshot;
}

export async function fetchWalletAEthShortSize(
  userAddress: string,
  fetchFn: typeof fetch = fetch,
): Promise<number> {
  const res = await postHlInfo(buildClearinghouseStateRequest(userAddress), fetchFn);
  if (!res.ok) return 0;
  const ch = (await res.json()) as {
    assetPositions?: Array<{ position?: { coin?: string; szi?: string } }>;
  };
  for (const row of ch.assetPositions ?? []) {
    const coin = (row.position?.coin ?? "").toUpperCase();
    if (coin !== "ETH") continue;
    const szi = parseFloat(row.position?.szi ?? "0") || 0;
    return szi < 0 ? Math.abs(szi) : 0;
  }
  return 0;
}

export async function runGmxCrossWalletEthHedge(input: {
  sessionPk: string;
  walletA?: string;
  walletB?: string;
  dryRun?: boolean;
  fetchFn?: typeof fetch;
}): Promise<GmxCrossWalletHedgeResult> {
  const walletA = (input.walletA ?? HL_WALLET_A_DEFAULT).trim();
  const walletB = (input.walletB ?? GMX_WALLET_B_DEFAULT).trim();
  const delta = await fetchGmxEthDeltaForWallet(walletB, { fetchFn: input.fetchFn });
  const existingShort = await fetchWalletAEthShortSize(walletA, input.fetchFn);
  const orderEthSize = Math.max(0, delta.ethDeltaSize - existingShort);

  if (orderEthSize <= 0) {
    return {
      ok: false,
      dryRun: input.dryRun !== false,
      ethDeltaSize: delta.ethDeltaSize,
      ethDeltaUsd: delta.ethDeltaUsd,
      orderEthSize: 0,
      orderUsd: 0,
      reason: "ETH_HEDGE_ALREADY_COVERED",
      delta,
    };
  }

  await refreshSoilArbitrumProbesWithFallback();
  const live = input.dryRun !== true;
  const ethMarkUsd = await fetchHlEthMarkUsdStrict(input.fetchFn);
  const shortLimitPx = formatHlPerpPrice(ethMarkUsd * 0.99, HL_ETH_SZ_DECIMALS);
  const orderUsd = orderEthSize * shortLimitPx;
  if (!(orderUsd > 0)) {
    return {
      ok: false,
      dryRun: input.dryRun !== false,
      ethDeltaSize: delta.ethDeltaSize,
      ethDeltaUsd: delta.ethDeltaUsd,
      orderEthSize: 0,
      orderUsd: 0,
      reason: "ETH_HEDGE_ORDER_USD_ZERO",
      delta,
    };
  }
  const wallet = new Wallet(input.sessionPk);
  const leg: IntentLeg = { venue: "HL", side: "SHORT", sizeUsd: orderUsd, symbol: "ETH" };
  const riskBalanceUsd = Math.max(orderUsd / 0.01, delta.gmLiquidityUsd, 10_000);

  const result = await executeHlSessionKeyOrder(leg, {
    signer: wallet,
    dryRun: !live,
    isTestnet: false,
    exchangeUrl: HL_EXCHANGE_URL,
    marketIoc: true,
    limitPx: shortLimitPx,
    szDecimals: HL_ETH_SZ_DECIMALS,
    resolveAssetIndex: () => HL_ETH_PERP_ASSET_INDEX,
    fetchFn: input.fetchFn,
    sessionKey: sanitizeSessionKeyForMasterWalletTrading(
      {
        agentAddress: wallet.address,
        expiresAt: Date.now() + 7 * 24 * 3600 * 1000,
        masterWalletAddress: walletA,
      },
      walletA,
    ),
    systemState: buildSystemState({
      accountBalanceUsd: riskBalanceUsd,
      currentCri: 100,
      skipHardlockAssert: true,
    }),
    preTrade: {
      symbol: "ETH",
      hlSpot: ethMarkUsd,
      hlPerp: ethMarkUsd,
      dydxPerp: ethMarkUsd,
      depthUsd: 500_000,
      latencyMs: 50,
      expectedSlippage: 0.0005,
      accountBalanceUsd: riskBalanceUsd,
      isTestnet: false,
    },
  });

  return {
    ok: result.ok,
    dryRun: !live,
    ethDeltaSize: delta.ethDeltaSize,
    ethDeltaUsd: delta.ethDeltaUsd,
    orderEthSize,
    orderUsd,
    exchangeOid: result.exchangeOid,
    reason: result.reason,
    delta,
  };
}

/** Cron / worker alias — cross-wallet GMX→HL ETH hedge execution. */
export const executeGmxCrossWalletHedge = runGmxCrossWalletEthHedge;
