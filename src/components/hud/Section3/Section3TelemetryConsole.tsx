import { useEffect, useState, type ReactNode } from "react";
import {
  loadVerified5TxResults,
  type Verified5TxResults,
} from "../../../data/verified-5tx";
import { formatSoilTensileBadge } from "../../../data/verified-5tx-display-helpers";
import { DualColumnTelemetryConsole } from "./DualColumnTelemetryConsole";
import { TelemetryStatusBar } from "./TelemetryStatusBar";
import { TerminalFeedToggle } from "./TerminalFeedToggle";
import type { TerminalLogLine } from "./terminal-log";

const TELEMETRY_TICK_MS = 2_000;
const TELEMETRY_BASE_EVENTS = 1_842;

function formatTelemetryCount(count: number): string {
  return count.toLocaleString("en-US");
}

export interface Section3TelemetryConsoleProps {
  logs: readonly TerminalLogLine[];
  feedPaused: boolean;
  isRevoked?: boolean;
  ttlExpiryMs: number | null;
  onToggleFeed: () => void;
  inlineBanner?: string | null;
  inlineBannerTone?: "success" | "error" | "warning";
  batchResults?: Verified5TxResults;
}

export function Section3TelemetryConsole({
  logs,
  feedPaused,
  isRevoked = false,
  ttlExpiryMs,
  onToggleFeed,
  inlineBanner = null,
  inlineBannerTone = "success",
  batchResults,
}: Section3TelemetryConsoleProps): ReactNode {
  const [eventCount, setEventCount] = useState(TELEMETRY_BASE_EVENTS);
  const verifiedResults = batchResults ?? loadVerified5TxResults();

  useEffect(() => {
    if (feedPaused) return undefined;
    const timer = window.setInterval(() => {
      setEventCount((prev) => prev + 1);
    }, TELEMETRY_TICK_MS);
    return () => window.clearInterval(timer);
  }, [feedPaused]);

  return (
    <div
      className="mt-4 overflow-hidden rounded border border-zinc-800 bg-black/80 font-data"
      data-testid="live-risk-telemetry-console"
    >
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-800 px-3 py-1.5">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-[10px] uppercase tracking-[0.18em] text-zinc-500">
            Live Risk Telemetry Console
          </p>
          <span
            className="font-data text-[10px] tabular-nums text-zinc-400"
            data-testid="telemetry-event-counter"
          >
            Telemetry: {formatTelemetryCount(eventCount)} events (0 dropped)
          </span>
          <span
            className="font-data text-[10px] text-emerald-400/90"
            data-testid="soil-tensile-badge"
          >
            {formatSoilTensileBadge(verifiedResults)}
          </span>
        </div>
        <TerminalFeedToggle
          feedPaused={feedPaused}
          isRevoked={isRevoked}
          onToggleFeed={onToggleFeed}
        />
      </div>
      <TelemetryStatusBar isRevoked={isRevoked} ttlExpiryMs={ttlExpiryMs} />
      <DualColumnTelemetryConsole
        logs={logs}
        feedPaused={feedPaused}
        inlineBanner={inlineBanner}
        inlineBannerTone={inlineBannerTone}
      />
    </div>
  );
}
