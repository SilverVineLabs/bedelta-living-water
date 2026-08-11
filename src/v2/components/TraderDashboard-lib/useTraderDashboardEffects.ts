import { useEffect } from "react";
import { enterReadOnlyObserver } from "../../../adapters/hl/session-key-fallback";
import { mapCircuitBreakerEntriesForTerminal } from "../../../api/hud-telemetry-lib/hud-telemetry-log-helpers";
import type { HudStreamPayload } from "../../../api/hud-telemetry";
import {
  BASE_TERMINAL_LOG_TEMPLATES,
  createTerminalLog,
  type TerminalLogLine,
} from "../LiveRiskTelemetryConsole";
import {
  isReviewerDemoMode,
  MAX_TERMINAL_LOGS,
  REVIEW_BOOT_DELAY_MS,
  TERMINAL_ROTATE_MS,
} from "./trader-dashboard-log-utils";

export function useTraderDashboardEffects({
  circuitBreakerTripped,
  sessionKeyRevoked,
  hudStream,
  setTerminalLogs,
  setFeedPaused,
  feedPaused,
  rotateIndexRef,
  reviewBootRef,
  handleAutoDemo,
}: {
  circuitBreakerTripped: boolean;
  sessionKeyRevoked: boolean;
  hudStream: HudStreamPayload | null | undefined;
  setTerminalLogs: React.Dispatch<React.SetStateAction<TerminalLogLine[]>>;
  setFeedPaused: React.Dispatch<React.SetStateAction<boolean>>;
  feedPaused: boolean;
  rotateIndexRef: React.MutableRefObject<number>;
  reviewBootRef: React.MutableRefObject<boolean>;
  handleAutoDemo: () => void;
}): void {
  useEffect(() => {
    if (circuitBreakerTripped && !sessionKeyRevoked) {
      enterReadOnlyObserver("SESSION_KEY_INVALID");
    }
  }, [circuitBreakerTripped, sessionKeyRevoked]);

  useEffect(() => {
    const severLogs = hudStream?.circuitBreakerTerminalLogs;
    if (!severLogs?.length) return;
    const mapped = mapCircuitBreakerEntriesForTerminal(severLogs);
    setTerminalLogs((prev) => {
      const merged = [
        ...mapped.map((entry) => createTerminalLog(entry.level, entry.message)),
        ...prev,
      ];
      return merged.slice(-MAX_TERMINAL_LOGS);
    });
    setFeedPaused(true);
  }, [hudStream?.circuitBreakerTerminalLogs, setTerminalLogs, setFeedPaused]);

  useEffect(() => {
    if (feedPaused) return undefined;
    const timer = window.setInterval(() => {
      const template =
        BASE_TERMINAL_LOG_TEMPLATES[
          rotateIndexRef.current % BASE_TERMINAL_LOG_TEMPLATES.length
        ]!;
      rotateIndexRef.current += 1;
      setTerminalLogs((prev) =>
        [...prev, createTerminalLog(template.level, template.message)].slice(
          -MAX_TERMINAL_LOGS,
        ),
      );
    }, TERMINAL_ROTATE_MS);
    return () => window.clearInterval(timer);
  }, [feedPaused, rotateIndexRef, setTerminalLogs]);

  useEffect(() => {
    if (!isReviewerDemoMode() || reviewBootRef.current) return;
    reviewBootRef.current = true;
    const timer = window.setTimeout(handleAutoDemo, REVIEW_BOOT_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [handleAutoDemo, reviewBootRef]);
}
