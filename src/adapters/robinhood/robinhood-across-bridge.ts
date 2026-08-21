/**
 * Pillar 2 — Robinhood Chain (46630) → Arbitrum One unidirectional Across bridge pipeline.
 * Outbound-only capital routing with AML inbound isolation + in-flight / timeout fail-closed.
 */

import { ARBITRUM_ONE_CHAIN_ID, ROBINHOOD_MAINNET_CHAIN_ID } from "../../sdk/constants";
import { ROBINHOOD_TESTNET_CHAIN_ID } from "./r-chain-yield-stub";

export { ARBITRUM_ONE_CHAIN_ID, ROBINHOOD_TESTNET_CHAIN_ID, ROBINHOOD_MAINNET_CHAIN_ID };
export const IN_FLIGHT_BRIDGE_CAPITAL = "IN_FLIGHT_BRIDGE_CAPITAL" as const;
export const BRIDGE_TIMEOUT_FAIL_CLOSED = "BRIDGE_TIMEOUT_FAIL_CLOSED" as const;
export const AML_INBOUND_TO_ROBINHOOD_BLOCKED = "AML_INBOUND_TO_ROBINHOOD_BLOCKED" as const;
export const DEFAULT_ACROSS_BRIDGE_TIMEOUT_MS = 3_600_000;

export type BridgeCapitalLabel =
  | "AVAILABLE"
  | typeof IN_FLIGHT_BRIDGE_CAPITAL
  | "SETTLED"
  | typeof BRIDGE_TIMEOUT_FAIL_CLOSED
  | typeof AML_INBOUND_TO_ROBINHOOD_BLOCKED;

export interface AcrossBridgeDirectionInput {
  sourceChainId: number;
  destChainId: number;
}

export interface AcrossBridgeOutboundInput {
  amountUsd: number;
  wallet: string;
  initiatedAtMs: number;
  sourceChainId?: number;
  destChainId?: number;
}

export interface AcrossBridgeEvaluation {
  ok: boolean;
  direction: "outbound-only" | "blocked";
  capitalLabel: BridgeCapitalLabel;
  inFlightUsd: number;
  settledUsd: number;
  /** Always 0 — pending bridge liquidity is never booked as loss. */
  lostUsd: number;
  inboundToRobinhoodPermitted: false;
  reasons: string[];
}

export function isRobinhoodToArbitrumRoute(
  sourceChainId: number,
  destChainId: number,
): boolean {
  const sourceRobinhood =
    sourceChainId === ROBINHOOD_TESTNET_CHAIN_ID ||
    sourceChainId === ROBINHOOD_MAINNET_CHAIN_ID;
  return sourceRobinhood && destChainId === ARBITRUM_ONE_CHAIN_ID;
}

export function isInboundToRobinhoodRoute(
  sourceChainId: number,
  destChainId: number,
): boolean {
  const destRobinhood =
    destChainId === ROBINHOOD_TESTNET_CHAIN_ID ||
    destChainId === ROBINHOOD_MAINNET_CHAIN_ID;
  const sourceRobinhood =
    sourceChainId === ROBINHOOD_TESTNET_CHAIN_ID ||
    sourceChainId === ROBINHOOD_MAINNET_CHAIN_ID;
  return !sourceRobinhood && destRobinhood;
}

/** AML isolation — zero inbound capital flow permitted back to Robinhood Chain. */
export function validateAcrossBridgeDirection(
  input: AcrossBridgeDirectionInput,
): { ok: boolean; inboundBlocked: boolean; reasons: string[] } {
  const reasons: string[] = [];
  if (isInboundToRobinhoodRoute(input.sourceChainId, input.destChainId)) {
    reasons.push(AML_INBOUND_TO_ROBINHOOD_BLOCKED);
    return { ok: false, inboundBlocked: true, reasons };
  }
  if (!isRobinhoodToArbitrumRoute(input.sourceChainId, input.destChainId)) {
    reasons.push("BRIDGE_ROUTE_UNSUPPORTED");
    return { ok: false, inboundBlocked: false, reasons };
  }
  return { ok: true, inboundBlocked: false, reasons };
}

export function evaluateBridgeTimeout(
  initiatedAtMs: number,
  nowMs: number,
  timeoutMs = DEFAULT_ACROSS_BRIDGE_TIMEOUT_MS,
): { timedOut: boolean; failClosed: boolean; elapsedMs: number } {
  const elapsedMs = Math.max(0, nowMs - initiatedAtMs);
  const timedOut = elapsedMs > timeoutMs;
  return { timedOut, failClosed: timedOut, elapsedMs };
}

/** Unidirectional outbound bridge state machine — in-flight capital never counted as loss. */
export function evaluateAcrossBridgeTransfer(
  input: AcrossBridgeOutboundInput,
  options: {
    nowMs?: number;
    settledAtMs?: number | null;
    timeoutMs?: number;
  } = {},
): AcrossBridgeEvaluation {
  const nowMs = options.nowMs ?? Date.now();
  const sourceChainId = input.sourceChainId ?? ROBINHOOD_TESTNET_CHAIN_ID;
  const destChainId = input.destChainId ?? ARBITRUM_ONE_CHAIN_ID;
  const amountUsd = Math.max(0, input.amountUsd);
  const direction = validateAcrossBridgeDirection({ sourceChainId, destChainId });

  if (!direction.ok) {
    return {
      ok: false,
      direction: "blocked",
      capitalLabel: direction.inboundBlocked
        ? AML_INBOUND_TO_ROBINHOOD_BLOCKED
        : BRIDGE_TIMEOUT_FAIL_CLOSED,
      inFlightUsd: 0,
      settledUsd: 0,
      lostUsd: 0,
      inboundToRobinhoodPermitted: false,
      reasons: direction.reasons,
    };
  }

  if (!(amountUsd > 0)) {
    return {
      ok: false,
      direction: "outbound-only",
      capitalLabel: "AVAILABLE",
      inFlightUsd: 0,
      settledUsd: 0,
      lostUsd: 0,
      inboundToRobinhoodPermitted: false,
      reasons: ["BRIDGE_AMOUNT_ZERO"],
    };
  }

  const timeout = evaluateBridgeTimeout(
    input.initiatedAtMs,
    nowMs,
    options.timeoutMs,
  );
  if (timeout.failClosed && options.settledAtMs == null) {
    return {
      ok: false,
      direction: "outbound-only",
      capitalLabel: BRIDGE_TIMEOUT_FAIL_CLOSED,
      inFlightUsd: 0,
      settledUsd: 0,
      lostUsd: 0,
      inboundToRobinhoodPermitted: false,
      reasons: [
        `${BRIDGE_TIMEOUT_FAIL_CLOSED}:${timeout.elapsedMs}ms>${options.timeoutMs ?? DEFAULT_ACROSS_BRIDGE_TIMEOUT_MS}ms`,
      ],
    };
  }

  if (options.settledAtMs != null && options.settledAtMs >= input.initiatedAtMs) {
    return {
      ok: true,
      direction: "outbound-only",
      capitalLabel: "SETTLED",
      inFlightUsd: 0,
      settledUsd: amountUsd,
      lostUsd: 0,
      inboundToRobinhoodPermitted: false,
      reasons: ["BRIDGE_SETTLED"],
    };
  }

  return {
    ok: true,
    direction: "outbound-only",
    capitalLabel: IN_FLIGHT_BRIDGE_CAPITAL,
    inFlightUsd: amountUsd,
    settledUsd: 0,
    lostUsd: 0,
    inboundToRobinhoodPermitted: false,
    reasons: ["BRIDGE_IN_FLIGHT"],
  };
}
