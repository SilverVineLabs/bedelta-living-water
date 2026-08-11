import { useEffect, useRef, useState, type ReactNode } from "react";
import { DualColumnLogPanel } from "./DualColumnLogPanel";
import {
  extractFillIndex,
  resolveSoilPulseTargetId,
  splitTerminalLogsForDualConsole,
} from "./section3-log-split";
import { TelemetryLogStream } from "./TelemetryLogStream";
import type { TerminalLogLine } from "./terminal-log";

const SOIL_PULSE_MS = 1_000;
const RISK_CHECK_HEADER_TAG =
  "[ ⚡ SAGA EXECUTION ENGINE OVERHEAD: +0.02ms (NON-BLOCKING ASYNC PROBE) ]";
const RISK_CHECK_HEADER_TOOLTIP_COPY =
  "Pinned execution-column probe showing Saga Execution Engine async overhead for the fills-and-proofs stream. Non-blocking latency cost stays fixed at the top of the right column while execution logs continue below.";

export interface DualColumnTelemetryConsoleProps {
  logs: readonly TerminalLogLine[];
  feedPaused: boolean;
  inlineBanner?: string | null;
  inlineBannerTone?: "success" | "error" | "warning";
}

export function DualColumnTelemetryConsole({
  logs,
  feedPaused,
  inlineBanner = null,
  inlineBannerTone = "success",
}: DualColumnTelemetryConsoleProps): ReactNode {
  const { soilLogs, executionLogs } = splitTerminalLogsForDualConsole(logs);
  const [pulsingSoilLogId, setPulsingSoilLogId] = useState<string | null>(null);
  const prevFillCountRef = useRef(0);

  useEffect(() => {
    const fillLogs = executionLogs.filter((line) => /FILLED/i.test(line.message));
    if (fillLogs.length <= prevFillCountRef.current) return;
    const latestFill = fillLogs[fillLogs.length - 1];
    if (!latestFill) return;
    prevFillCountRef.current = fillLogs.length;
    const targetId = resolveSoilPulseTargetId(latestFill.message, soilLogs);
    if (!targetId) return;
    setPulsingSoilLogId(targetId);
    const timer = window.setTimeout(() => setPulsingSoilLogId(null), SOIL_PULSE_MS);
    return () => window.clearTimeout(timer);
  }, [executionLogs, soilLogs]);

  return (
    <div data-testid="dual-column-telemetry-console">
      {inlineBanner ? (
        <TelemetryLogStream
          logs={[]}
          inlineBanner={inlineBanner}
          inlineBannerTone={inlineBannerTone}
        />
      ) : null}
      <div className="flex flex-col gap-0 lg:flex-row">
        <DualColumnLogPanel
          title="LIVE SOIL RESISTANCE RADAR LOGS"
          logs={soilLogs}
          pulsingLogId={pulsingSoilLogId}
          streamLocked={feedPaused}
          testId="soil-resistance-log-panel"
        />
        <DualColumnLogPanel
          title="LIVE EXECUTION FILLS & PROOFS"
          logs={executionLogs}
          headerTag={RISK_CHECK_HEADER_TAG}
          headerTagTooltip={RISK_CHECK_HEADER_TOOLTIP_COPY}
          streamLocked={feedPaused}
          testId="execution-fill-log-panel"
        />
      </div>
    </div>
  );
}

export { extractFillIndex };
