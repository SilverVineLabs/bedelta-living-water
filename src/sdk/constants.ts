/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2026 SilverVine Labs
 * @slivervine/citadel-sdk — brand & EIP-712 domain SSOT.
 */
import { GMX_UI_FEE_BPS } from "../config/gmx-revenue";
import { SESSION_KEY_NOTIONAL_CAP_USD } from "../services/session-key-adapter-lib/session-key-types";

export const EIP712_DOMAIN_NAME = "SliverVineCitadel" as const;
export const EIP712_DOMAIN_VERSION = "1" as const;

/** Local / unit-test mock Gate verifyingContract (not deployed). */
export const LOCAL_MOCK_GATE_ADDRESS =
  "0x511E111111111111111111111111111111111111" as const;

/** Arbitrum Sepolia (421614) — verified SliverVineGate (SSOT: docs/grants/SUBMISSION.md). */
export const SLIVERVINE_GATE_SEPOLIA_ADDRESS =
  "0xb174118bC0B84e8D6D59EEF2339e29bF7FCf8BF1" as const;

/** Canonical SliverVineGate verifyingContract (Sepolia live anchor). */
export const SLIVERVINE_GATE_ADDRESS = SLIVERVINE_GATE_SEPOLIA_ADDRESS;

export const ARBITRUM_SEPOLIA_CHAIN_ID = 421614 as const;
export const ROBINHOOD_TESTNET_CHAIN_ID = 46630 as const;
export const ROBINHOOD_MAINNET_CHAIN_ID = 4663 as const;
export const ARBITRUM_ONE_CHAIN_ID = 42161 as const;

/** Hard USD notional cap for session-key authorization (R07). SSOT: `session-key-types.ts`. */
export { SESSION_KEY_NOTIONAL_CAP_USD };

/** GMX v2 ExchangeRouter native builder fee — SSOT: +10 bps (`gmx-revenue.ts`). */
export { GMX_UI_FEE_BPS };

export function resolveSliverVineGateAddress(chainId?: number): string {
  if (chainId === ARBITRUM_SEPOLIA_CHAIN_ID) return SLIVERVINE_GATE_SEPOLIA_ADDRESS;
  return SLIVERVINE_GATE_ADDRESS;
}

export type CitadelSdkPreset = "production" | "test";
