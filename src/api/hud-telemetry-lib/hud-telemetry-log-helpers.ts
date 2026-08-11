/**
 * HUD stream payload builders + circuit-breaker terminal log queue utilities.
 */

import {
  getBlackSwanDefenseHudLabel,
  isBlackSwanDefenseActive,
  readBlackSwanActiveTriggers,
} from "../../core/black-swan-guard";
import { isR20Locked, readActiveSystemState, type CoreSystemState } from "../../core/state";
import {
  auditThreeEyeAdapters,
  TELEMETRY_VENUES,
} from "../../services/hl-telemetry-probe";
import { fetchLiveL2Book } from "../../services/hyperliquid-adapter";
import {
  drainCircuitBreakerTerminalLogs,
  type CircuitBreakerTerminalEntry,
} from "../../services/rootProtectionService";
import type { TerminalLogLevel } from "../../components/hud/Section3/terminal-log";

export type { CircuitBreakerTerminalEntry };

/** Min interval between JSON payloads + SSE ping cadence (dev-safe). */
export const HUD_STREAM_DEBOUNCE_MS = 1_000;
export const HUD_STREAM_PING_MS = HUD_STREAM_DEBOUNCE_MS;

export const HUD_FALLBACK_LIVE_PAIRS = 162;

export type HudConnectivityMode =
  | "CONNECTED"
  | "CONNECTED_MOCK"
  | "STANDBY"
  | "DISCONNECTED";

export interface HudMarketPair {
  symbol: string;
  annualYieldPct: number;
}

export interface HudMarketProbe {
  selectToken: string;
  bestToken: string;
  topPairs: readonly HudMarketPair[];
  livePairsCount: number;
}

export const HUD_FALLBACK_MARKET_PROBE: HudMarketProbe = {
  selectToken: "ETH",
  bestToken: "ETH",
  livePairsCount: HUD_FALLBACK_LIVE_PAIRS,
  topPairs: [{ symbol: "ETH", annualYieldPct: 18.2 }],
};

export interface HudStreamPayload {
  success: true;
  timestamp: string;
  debounceMs: number;
  isStale: boolean;
  connectivityMode: HudConnectivityMode;
  marketProbe: HudMarketProbe;
  leftEyeDefense: {
    status: "PASS" | "STANDBY" | "LOCKED";
    dynamicMaxSlUsd: number;
    hardlock: boolean;
  };
  rightEyeProbe: {
    status: "ACTIVE" | "STANDBY" | "OFFLINE";
    santenmokuStatus: string;
    activeVenues: readonly string[];
  };
  crownTreasuryPnl: {
    accountBalanceUsd: number;
    estimatedPnlUsd: number;
    criIndex: number;
    hudState: string;
  };
  blackSwanDefense: {
    active: boolean;
    hudTag: string | null;
    triggers: readonly string[];
  };
  circuitBreakerTerminalLogs?: readonly CircuitBreakerTerminalEntry[];
}

export interface HudTerminalSeverLog {
  level: TerminalLogLevel;
  message: string;
}

/** Map circuit-breaker sever queue entries for Section 3 terminal merge. */
export function mapCircuitBreakerEntriesForTerminal(
  entries: readonly CircuitBreakerTerminalEntry[],
): readonly HudTerminalSeverLog[] {
  return entries.map((entry) => ({
    level: "EMERGENCY" as const,
    message: entry.message,
  }));
}

/** Attach drained circuit-breaker logs to a HUD stream payload. */
export function attachCircuitBreakerTerminalLogs(
  payload: Omit<HudStreamPayload, "circuitBreakerTerminalLogs">,
): HudStreamPayload {
  const circuitBreakerTerminalLogs = drainCircuitBreakerTerminalLogs();
  if (circuitBreakerTerminalLogs.length === 0) return payload;
  return { ...payload, circuitBreakerTerminalLogs };
}

function buildHudStreamFallbackPayload(now = Date.now()): HudStreamPayload {
  const state = readActiveSystemState();
  return {
    success: true,
    timestamp: new Date(now).toISOString(),
    debounceMs: HUD_STREAM_DEBOUNCE_MS,
    isStale: true,
    connectivityMode: "STANDBY",
    marketProbe: HUD_FALLBACK_MARKET_PROBE,
    leftEyeDefense: {
      status: "STANDBY",
      dynamicMaxSlUsd: state.dynamicMaxSL,
      hardlock: state.hardlock,
    },
    rightEyeProbe: {
      status: "STANDBY",
      santenmokuStatus: "THREE_EYES_DEGRADED",
      activeVenues: TELEMETRY_VENUES,
    },
    crownTreasuryPnl: {
      accountBalanceUsd: state.accountBalanceUsd,
      estimatedPnlUsd: state.accountBalanceUsd - 10_000,
      criIndex: state.currentCri,
      hudState: "IDLE",
    },
    blackSwanDefense: {
      active: isBlackSwanDefenseActive(),
      hudTag: getBlackSwanDefenseHudLabel(),
      triggers: readBlackSwanActiveTriggers(),
    },
  };
}

function isHudDryRunView(state: CoreSystemState): boolean {
  return (
    !state.signingChannelOpen ||
    state.isSandboxMode ||
    state.hardlock ||
    isR20Locked(state)
  );
}

function resolveConnectivityMode(
  state: CoreSystemState,
  dryRun: boolean,
  rightStatus: HudStreamPayload["rightEyeProbe"]["status"],
): HudConnectivityMode {
  if (dryRun) return "CONNECTED_MOCK";
  if (state.hardlock || isR20Locked(state)) return "DISCONNECTED";
  if (rightStatus === "STANDBY" || state.isStale) return "STANDBY";
  return "CONNECTED";
}

export function buildHudStreamPayload(now = Date.now()): HudStreamPayload {
  const state = readActiveSystemState();
  const threeEye = auditThreeEyeAdapters(state);
  const dryRun = isHudDryRunView(state);

  const leftStatus = dryRun
    ? "STANDBY"
    : state.hardlock
      ? "LOCKED"
      : state.isHedgeActive
        ? "PASS"
        : "STANDBY";

  const rightStatus = dryRun
    ? "STANDBY"
    : threeEye.santenmokuStatus === "THREE_EYES_ACTIVE"
      ? "ACTIVE"
      : threeEye.santenmokuStatus === "THREE_EYES_DEGRADED"
        ? "STANDBY"
        : "OFFLINE";

  const useFallbackMarket =
    dryRun || threeEye.activeVenues.length === 0 || rightStatus !== "ACTIVE";

  const estimatedPnlUsd = state.accountBalanceUsd - 10_000;
  const connectivityMode = resolveConnectivityMode(state, dryRun, rightStatus);

  const basePayload: Omit<HudStreamPayload, "circuitBreakerTerminalLogs"> = {
    success: true,
    timestamp: new Date(now).toISOString(),
    debounceMs: HUD_STREAM_DEBOUNCE_MS,
    isStale: dryRun ? false : state.isStale,
    connectivityMode,
    marketProbe: useFallbackMarket
      ? HUD_FALLBACK_MARKET_PROBE
      : {
          selectToken: HUD_FALLBACK_MARKET_PROBE.selectToken,
          bestToken: HUD_FALLBACK_MARKET_PROBE.bestToken,
          livePairsCount: HUD_FALLBACK_LIVE_PAIRS,
          topPairs: HUD_FALLBACK_MARKET_PROBE.topPairs,
        },
    leftEyeDefense: {
      status: leftStatus,
      dynamicMaxSlUsd: state.dynamicMaxSL,
      hardlock: dryRun ? false : state.hardlock,
    },
    rightEyeProbe: {
      status: rightStatus,
      santenmokuStatus: dryRun
        ? "THREE_EYES_STANDBY"
        : threeEye.santenmokuStatus,
      activeVenues: dryRun
        ? TELEMETRY_VENUES
        : threeEye.activeVenues.length > 0
          ? threeEye.activeVenues
          : TELEMETRY_VENUES,
    },
    crownTreasuryPnl: {
      accountBalanceUsd: state.accountBalanceUsd,
      estimatedPnlUsd,
      criIndex: state.currentCri,
      hudState: dryRun ? "IDLE" : state.hudState,
    },
    blackSwanDefense: {
      active: isBlackSwanDefenseActive(),
      hudTag: getBlackSwanDefenseHudLabel(),
      triggers: readBlackSwanActiveTriggers(),
    },
  };

  return attachCircuitBreakerTerminalLogs(basePayload);
}

/** Never throws — degraded payload on probe/build failure. */
export function buildHudStreamPayloadSafe(now = Date.now()): HudStreamPayload {
  try {
    return buildHudStreamPayload(now);
  } catch (err) {
    console.error("[hud-stream] payload build failed — serving fallback", err);
    return buildHudStreamFallbackPayload(now);
  }
}

/** Non-blocking L2 depth probe for HUD pollers — never throws. */
export async function probeHudBookDepthSafe(coin = "ETH"): Promise<void> {
  try {
    await fetchLiveL2Book(coin, { maxRetries: 0 });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.warn("[hud-stream] Fallback depth used:", message);
  }
}
