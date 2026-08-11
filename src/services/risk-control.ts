/**
 * SPDX-License-Identifier: BUSL-1.1
 * Copyright (c) 2026 SilverVine Labs. All Rights Reserved.
 */

/**
 * Risk-control module — soil resistance (slippage/depth) + root protection (dynamic Max SL).
 */

export {
  computeEffectiveMaxSlUsd,
  computeOrderAwareMaxSlUsd,
  computeSoilRiskUsd,
  DYNAMIC_MAX_SL_BASE_USD,
  DYNAMIC_MAX_SL_BALANCE_RATE,
} from "./effective-max-sl";

export { estimateEntryLossUsd } from "./risk-control-helpers";

export * from "./risk-control-lib/telemetry-symbols";
export * from "./risk-control-lib/time-gates";
export * from "./risk-control-lib/logging";
export * from "./risk-control-lib/soil-resistance";
export * from "./risk-control-lib/root-protection";
export * from "./risk-control-lib/funding-rate-history";
export * from "./risk-control-lib/funding-regime-guard";
export * from "./risk-control-lib/hl-orderbook-gap-guard";
export * from "./risk-control-lib/rwa-settlement-lock";
export * from "./risk-control-lib/soil-arb-probe-refresh";
