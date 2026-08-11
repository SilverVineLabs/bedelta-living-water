/**
 * Browser-safe Hyperliquid Testnet 5-TX runner — delegates to wallet micro-modules.
 */

import type { Eip712Signer } from "../../adapters/hl/eip712-signer";
import {
  createBrowserEip712Signer,
  fetchWalletChainIdHex,
  orchestrateBrowserLive5Tx,
  prepareWalletForHlSigning,
  type BrowserLive5TxLogEntry,
  type BrowserLive5TxProgress,
  type EthereumProvider,
} from "../../adapters/hl/wallet";
import {
  VERIFIED_5TX_NOTIONAL_USD,
  type Verified5TxResults,
} from "../../data/verified-5tx";
import { readWindowProperty } from "../lib/client-runtime";

export { createBrowserEip712Signer, fetchWalletChainIdHex, prepareWalletForHlSigning };
export type { EthereumProvider, BrowserLive5TxLogEntry, BrowserLive5TxProgress };

export interface BrowserLive5TxOptions {
  walletAddress: string;
  signer?: Eip712Signer;
  fetchFn?: typeof fetch;
  symbol?: string;
  notionalUsd?: number;
}

export function resolveBrowserEthereumProvider(): EthereumProvider | null {
  const eth = readWindowProperty("ethereum") as EthereumProvider | undefined;
  return eth?.request ? eth : null;
}

export function isBrowserWalletConnected(): boolean {
  return resolveBrowserEthereumProvider() !== null;
}

/** Execute 5 sequential HL testnet market orders via browser wallet EIP-712 signer. */
export async function runBrowserLive5Tx(
  opts: BrowserLive5TxOptions,
  progress: BrowserLive5TxProgress,
): Promise<Verified5TxResults> {
  const provider = resolveBrowserEthereumProvider();
  if (!provider) {
    throw new Error("No browser wallet provider — connect MetaMask/Rabby first");
  }
  return orchestrateBrowserLive5Tx(
    {
      walletAddress: opts.walletAddress,
      provider,
      signer: opts.signer,
      fetchFn: opts.fetchFn,
      symbol: opts.symbol,
      notionalUsd: opts.notionalUsd ?? VERIFIED_5TX_NOTIONAL_USD,
    },
    progress,
  );
}
