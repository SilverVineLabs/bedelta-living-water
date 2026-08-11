/** Automated HL Session Key short hedge — GMX GM 0-Δ lock via Wallet A margin. */
import { Wallet } from "ethers";
import { HL_EXCHANGE_URL } from "../config/constants";
import type { Env } from "../env";
import { executeHlSessionKeyOrder } from "../adapters/hl/session-key-executor";
import { sanitizeSessionKeyForMasterWalletTrading } from "../adapters/hl/execution-types";
import { buildSystemState } from "../core/state";
import type { IntentLeg } from "../core/intent-ledger";
import { getGmxGmBalanceCache } from "./adapters/gmx-v2-gm-balance";
import { getHlWalletTelemetryCache, type HlWalletTelemetrySnapshot } from "./hl-wallet-telemetry";

export const HL_AUTO_HEDGE_MIN_MARGIN_USD = 50;
export const HL_AUTO_HEDGE_COOLDOWN_MS = 3_600_000;
export const HL_AUTO_HEDGE_MASTER_WALLET_A =
  "0xef0752df6387248B897F3A59A180af42D801960d" as const;
export const HL_AUTO_HEDGE_ETH_MID_FALLBACK_USD = 3_500;
export const HL_AUTO_HEDGE_MIN_NOTIONAL_USD = 160;
export const HL_AUTO_HEDGE_MAX_NOTIONAL_USD = 190;
export const HL_ETH_PERP_ASSET_INDEX = 1;
export const HL_ETH_SZ_DECIMALS = 4;
/** @deprecated Legacy alias — ETH-only hedge path */
export const HL_AUTO_HEDGE_TARGET_HYPE_QTY = 0.05;
export const HL_AUTO_HEDGE_TARGET_HYPE_QTY_MIN = 0.04;
export const HL_AUTO_HEDGE_TARGET_HYPE_QTY_MAX = 0.06;
export const HL_AUTO_HEDGE_HYPE_MID_FALLBACK_USD = HL_AUTO_HEDGE_ETH_MID_FALLBACK_USD;
export const HL_HYPE_PERP_ASSET_INDEX = HL_ETH_PERP_ASSET_INDEX;
export const HL_HYPE_SZ_DECIMALS = HL_ETH_SZ_DECIMALS;

export type HlAutoHedgeEnv = Pick<
  Env,
  "SRV_200_MAINNET_SESSION_PK" | "SRV_200_MAINNET_USER_ADDRESS" | "ARB_MAINNET_USER_ADDRESS" | "IS_MAINNET"
>;

export interface HlAutoHedgeStatus {
  hedgeActive: boolean;
  lastSizeUsd: number | null;
  lastSymbol: string | null;
  lastRunAt: string | null;
  readOnlyMode: boolean;
  lastReason: string | null;
}

export interface HlAutoHedgeResult {
  ok: boolean;
  dryRun: boolean;
  sizeUsd: number;
  symbol: string;
  reason?: string;
}

let hedgeStatus: HlAutoHedgeStatus = {
  hedgeActive: false,
  lastSizeUsd: null,
  lastSymbol: null,
  lastRunAt: null,
  readOnlyMode: true,
  lastReason: null,
};

export function getHlAutoHedgeStatus(): HlAutoHedgeStatus {
  return hedgeStatus;
}

export function resolveSrv200UserAddress(env: HlAutoHedgeEnv): string | null {
  return (
    env.SRV_200_MAINNET_USER_ADDRESS?.trim() ||
    HL_AUTO_HEDGE_MASTER_WALLET_A ||
    env.ARB_MAINNET_USER_ADDRESS?.trim() ||
    null
  );
}

export function resolveHypeMidUsd(_hl: HlWalletTelemetrySnapshot | null): number {
  return HL_AUTO_HEDGE_ETH_MID_FALLBACK_USD;
}

export function computeAutoHedgeSizeUsd(
  gmLiquidityUsd: number,
  hlMarginUsd: number,
  _ethMidUsd = HL_AUTO_HEDGE_ETH_MID_FALLBACK_USD,
): number {
  if (gmLiquidityUsd <= 0 || hlMarginUsd < HL_AUTO_HEDGE_MIN_MARGIN_USD) return 0;
  const targetUsd = Math.min(gmLiquidityUsd * 0.25, HL_AUTO_HEDGE_MAX_NOTIONAL_USD);
  const riskCap = Math.min(gmLiquidityUsd * 0.95, hlMarginUsd * 0.95);
  const bounded = Math.min(
    Math.max(targetUsd, HL_AUTO_HEDGE_MIN_NOTIONAL_USD),
    HL_AUTO_HEDGE_MAX_NOTIONAL_USD,
  );
  return Math.min(bounded, riskCap);
}

function resolveHedgeRiskBalanceUsd(gmUsd: number, marginUsd: number, sizeUsd: number): number {
  const slFloor = (sizeUsd - 100) / 0.01;
  return Math.max(gmUsd + marginUsd, slFloor, sizeUsd);
}

function pickHedgeSymbol(): "ETH" {
  return "ETH";
}

export async function runHlAutoHedgeForGmxGm(
  env: HlAutoHedgeEnv,
  opts: { dryRun?: boolean; fetchFn?: typeof fetch; force?: boolean } = {},
): Promise<HlAutoHedgeResult> {
  const sessionPk = env.SRV_200_MAINNET_SESSION_PK?.trim() || "";
  const userAddress = resolveSrv200UserAddress(env);
  const readOnly = sessionPk.length === 0;
  const symbol = pickHedgeSymbol();
  hedgeStatus = { ...hedgeStatus, readOnlyMode: readOnly };

  if (!userAddress) {
    const reason = "SRV_200_USER_ADDRESS_MISSING";
    hedgeStatus = { ...hedgeStatus, lastReason: reason };
    return { ok: false, dryRun: true, sizeUsd: 0, symbol, reason };
  }
  if (readOnly) {
    const reason = "SRV_200_SESSION_PK_EMPTY_READ_ONLY";
    hedgeStatus = { ...hedgeStatus, lastReason: reason };
    return { ok: false, dryRun: true, sizeUsd: 0, symbol, reason };
  }

  const gm = getGmxGmBalanceCache();
  const hl = getHlWalletTelemetryCache(userAddress);
  const gmUsd = gm?.gmLiquidityUsd ?? 0;
  const marginUsd = hl?.perpsMarginUsd ?? 0;
  const ethMid = resolveHypeMidUsd(hl);
  const sizeUsd = computeAutoHedgeSizeUsd(gmUsd, marginUsd, ethMid);

  if (sizeUsd <= 0) {
    const reason = "HEDGE_SIZE_ZERO";
    hedgeStatus = { ...hedgeStatus, lastReason: reason };
    return { ok: false, dryRun: true, sizeUsd: 0, symbol, reason };
  }

  const lastRun = hedgeStatus.lastRunAt ? Date.parse(hedgeStatus.lastRunAt) : 0;
  if (!opts.force && lastRun > 0 && Date.now() - lastRun < HL_AUTO_HEDGE_COOLDOWN_MS) {
    return { ok: hedgeStatus.hedgeActive, dryRun: false, sizeUsd: hedgeStatus.lastSizeUsd ?? sizeUsd, symbol };
  }

  const live = env.IS_MAINNET === "true" && opts.dryRun !== true;
  const wallet = new Wallet(sessionPk);
  const leg: IntentLeg = { venue: "HL", side: "SHORT", sizeUsd, symbol };
  const riskBalanceUsd = resolveHedgeRiskBalanceUsd(gmUsd, marginUsd, sizeUsd);
  const result = await executeHlSessionKeyOrder(leg, {
    signer: wallet,
    dryRun: !live,
    isTestnet: false,
    exchangeUrl: HL_EXCHANGE_URL,
    marketIoc: true,
    limitPx: ethMid,
    szDecimals: HL_ETH_SZ_DECIMALS,
    resolveAssetIndex: () => HL_ETH_PERP_ASSET_INDEX,
    fetchFn: opts.fetchFn,
    sessionKey: sanitizeSessionKeyForMasterWalletTrading(
      {
        agentAddress: wallet.address,
        expiresAt: Date.now() + 7 * 24 * 3600 * 1000,
        masterWalletAddress: userAddress,
      },
      userAddress,
    ),
    systemState: buildSystemState({
      accountBalanceUsd: riskBalanceUsd,
      currentCri: 100,
      skipHardlockAssert: true,
    }),
  });

  const ok = result.ok;
  hedgeStatus = {
    hedgeActive: ok,
    lastSizeUsd: sizeUsd,
    lastSymbol: symbol,
    lastRunAt: new Date().toISOString(),
    readOnlyMode: false,
    lastReason: ok ? null : (result.reason ?? "HL_HEDGE_FAILED"),
  };
  return { ok, dryRun: !live, sizeUsd, symbol, reason: result.reason };
}

export function __setHlAutoHedgeStatusForTests(status: HlAutoHedgeStatus): void {
  hedgeStatus = status;
}

export function __resetHlAutoHedgeStatusForTests(): void {
  hedgeStatus = {
    hedgeActive: false,
    lastSizeUsd: null,
    lastSymbol: null,
    lastRunAt: null,
    readOnlyMode: true,
    lastReason: null,
  };
}
