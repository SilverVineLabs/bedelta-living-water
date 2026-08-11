import type { ReactNode } from "react";
import type { Verified5TxResults } from "../../../data/verified-5tx";
import { Section3TelemetryConsole } from "./Section3TelemetryConsole";
import type { TerminalLogLine } from "./terminal-log";

export interface Section3TerminalConsoleProps {
  terminalLogs: readonly TerminalLogLine[];
  feedPaused: boolean;
  isRevoked?: boolean;
  ttlExpiryMs: number | null;
  onToggleFeed: () => void;
  inlineBanner?: string | null;
  inlineBannerTone?: "success" | "error" | "warning";
  batchResults?: Verified5TxResults;
  pulseHighlight?: boolean;
}

export function Section3TerminalConsole({
  terminalLogs,
  feedPaused,
  isRevoked = false,
  ttlExpiryMs,
  onToggleFeed,
  inlineBanner = null,
  inlineBannerTone = "success",
  batchResults,
  pulseHighlight = false,
}: Section3TerminalConsoleProps): ReactNode {
  return (
    <section
      id="section3-terminal"
      className={[
        "my-0 flex flex-col p-0",
        pulseHighlight ? "animate-[section3-shake_0.18s_ease-in-out_infinite]" : "",
      ].join(" ")}
      aria-label="Section 3: Live Risk Telemetry Terminal Console"
      data-shake-active={pulseHighlight ? "true" : "false"}
    >
      <style>{`
        @keyframes section3-shake {
          0%,
          100% {
            transform: translate3d(0, 0, 0);
          }
          20% {
            transform: translate3d(-2px, 1px, 0);
          }
          40% {
            transform: translate3d(2px, -1px, 0);
          }
          60% {
            transform: translate3d(-1px, -1px, 0);
          }
          80% {
            transform: translate3d(1px, 1px, 0);
          }
        }
      `}</style>
      <div
        className={[
          "p-0",
          pulseHighlight ? "ring-2 ring-emerald-500" : "",
        ].join(" ")}
        data-testid="section3-terminal-panel"
        data-pulse-active={pulseHighlight ? "true" : "false"}
      >
        <Section3TelemetryConsole
          logs={terminalLogs}
          feedPaused={feedPaused}
          isRevoked={isRevoked}
          ttlExpiryMs={ttlExpiryMs}
          onToggleFeed={onToggleFeed}
          inlineBanner={inlineBanner}
          inlineBannerTone={inlineBannerTone}
          batchResults={batchResults}
        />
      </div>
    </section>
  );
}
