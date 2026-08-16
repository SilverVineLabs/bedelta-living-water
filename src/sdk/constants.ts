/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2026 SilverVine Labs
 * @slivervine/citadel-sdk — brand & EIP-712 domain SSOT.
 */
export const EIP712_DOMAIN_NAME = "SliverVineCitadel" as const;
export const EIP712_DOMAIN_VERSION = "1" as const;

/** Canonical SliverVineGate verifyingContract (production domain anchor). */
export const SLIVERVINE_GATE_ADDRESS =
  "0x511E111111111111111111111111111111111111" as const;

export const ROBINHOOD_TESTNET_CHAIN_ID = 46630 as const;
export const ROBINHOOD_MAINNET_CHAIN_ID = 4663 as const;
export const ARBITRUM_ONE_CHAIN_ID = 42161 as const;

export type CitadelSdkPreset = "production" | "test";
