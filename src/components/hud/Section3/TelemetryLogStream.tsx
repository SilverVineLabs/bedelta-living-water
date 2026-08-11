import type { ReactNode } from "react";
import { TERMINAL_LEVEL_CLASS, type TerminalLogLine } from "./terminal-log";

export interface TelemetryLogStreamProps {
  logs: readonly TerminalLogLine[];
  inlineBanner?: string | null;
  inlineBannerTone?: "success" | "error" | "warning";
}

export function TelemetryLogStream({
  logs,
  inlineBanner = null,
  inlineBannerTone = "success",
}: TelemetryLogStreamProps): ReactNode {
  const reversedLogs = [...logs].reverse();

  return (
    <ul className="max-h-44 space-y-0 overflow-y-auto px-3 py-2" role="log">
      {inlineBanner ? (
        <li
          role="status"
          data-testid={
            inlineBannerTone === "error"
              ? "emergency-revoke-toast"
              : inlineBannerTone === "warning"
                ? "signature-cancelled-banner"
                : "mev-simulation-toast"
          }
          className={[
            "mb-2 rounded border px-3 py-2 text-center font-data text-[10px] font-semibold",
            inlineBannerTone === "error"
              ? "border-red-500/50 bg-red-950/80 text-red-300"
              : inlineBannerTone === "warning"
                ? "border-amber-500/50 bg-amber-950/80 text-amber-200"
                : "border-emerald-500/50 bg-emerald-950/80 text-emerald-300",
          ].join(" ")}
        >
          {inlineBanner}
        </li>
      ) : null}
      {reversedLogs.map((line) => (
        <li key={line.id} className="py-1 text-[10px] leading-relaxed tabular-nums">
          <span className="text-zinc-600">[{line.timestamp}]</span>{" "}
          <span className={TERMINAL_LEVEL_CLASS[line.level]}>[{line.level}]</span>{" "}
          <span className="text-zinc-300">{line.message}</span>
        </li>
      ))}
    </ul>
  );
}
