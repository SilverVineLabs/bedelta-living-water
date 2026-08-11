/** Cron — GMX DataStore ETH delta vs HL ETH short hedge (fail-closed, $10 drift gate). */
import type { Env } from "./env";
import { checkSoilResistanceWithArbFallback } from "./services/risk-control-lib/soil-arb-probe-refresh";
import {
  fetchGmxEthDeltaForWallet,
  fetchHlEthMarkUsdStrict,
  GMX_WALLET_B_DEFAULT,
} from "./services/gmx-eth-delta";
import {
  executeGmxCrossWalletHedge,
  fetchWalletAEthShortSize,
  HL_WALLET_A_DEFAULT,
} from "./services/gmx-cross-wallet-hedge";

export const CRON_DRIFT_MIN_USD = 10 as const;
export const CRON_SKIP_CIRCUIT = "CRON_SKIP: CIRCUIT_TRIP" as const;
export const CRON_SKIP_BALANCED = "CRON_SKIP: DRIFT_BALANCED" as const;

export function computeCronDriftUsd(
  ethDeltaUsd: number,
  hlShortEth: number,
  ethMarkUsd: number,
): number {
  return Math.max(0, ethDeltaUsd - hlShortEth * ethMarkUsd);
}

function resolveCronWallets(env: Env): {
  sessionPk: string | null;
  walletA: string;
  walletB: string;
} {
  const sessionPk =
    env.HYPERLIQUID_MAINNET_SESSION_PK?.trim() ||
    env.SRV_200_MAINNET_SESSION_PK?.trim() ||
    null;
  const walletA =
    env.HYPERLIQUID_MAINNET_USER_ADDRESS?.trim() || HL_WALLET_A_DEFAULT;
  const walletB =
    env.SRV_200_MAINNET_USER_ADDRESS?.trim() || GMX_WALLET_B_DEFAULT;
  return { sessionPk, walletA, walletB };
}

/** Non-throwing cron tick — soil gate → drift probe → cross-wallet hedge. */
export async function runScheduledGmxHedgeCron(env: Env): Promise<void> {
  const { sessionPk, walletA, walletB } = resolveCronWallets(env);
  if (!sessionPk) {
    console.warn("[cron-gmx-hedge] skipped — session PK env binding missing");
    return;
  }

  const fetchFn = fetch;
  try {
    const ethMark = await fetchHlEthMarkUsdStrict(fetchFn);
    const soil = await checkSoilResistanceWithArbFallback({
      symbol: "ETH",
      hlSpot: ethMark,
      hlPerp: ethMark,
      dydxPerp: ethMark,
      depthUsd: 500_000,
    });
    if (soil.tripped) {
      console.warn(CRON_SKIP_CIRCUIT, soil.reasons.join("|"));
      return;
    }

    const delta = await fetchGmxEthDeltaForWallet(walletB, { fetchFn });
    const hlShortEth = await fetchWalletAEthShortSize(walletA, fetchFn);
    const driftUsd = computeCronDriftUsd(delta.ethDeltaUsd, hlShortEth, ethMark);

    if (driftUsd <= CRON_DRIFT_MIN_USD) {
      console.info(CRON_SKIP_BALANCED, {
        driftUsd,
        hedgedUsd: hlShortEth * ethMark,
        ethDeltaUsd: delta.ethDeltaUsd,
      });
      return;
    }

    const live = env.IS_MAINNET === "true";
    const result = await executeGmxCrossWalletHedge({
      sessionPk,
      walletA,
      walletB,
      dryRun: !live,
      fetchFn,
    });
    console.info("[cron-gmx-hedge] tick", JSON.stringify({
      ok: result.ok,
      dryRun: result.dryRun,
      driftUsd,
      orderUsd: result.orderUsd,
      reason: result.reason,
    }));
  } catch (err) {
    console.warn(
      CRON_SKIP_CIRCUIT,
      err instanceof Error ? err.message : String(err),
    );
  }
}
