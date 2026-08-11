import type { ReactNode } from "react";
import type { Verified5TxResults } from "../../../data/verified-5tx";
import { Section3TerminalConsole } from "../../../components/hud/Section3/Section3TerminalConsole";
import type { TerminalLogLine } from "../LiveRiskTelemetryConsole";

export interface TraderDashboardConsoleProps {
  terminalLogs: readonly TerminalLogLine[];
  feedPaused: boolean;
  sessionKeyRevoked: boolean;
  ttlExpiryMs: number | null;
  onToggleFeed: () => void;
  inlineBanner: string | null;
  inlineBannerTone: "success" | "error" | "warning";
  batchResults?: Verified5TxResults;
  pulseHighlight?: boolean;
  className?: string;
}

export function TraderDashboardConsole({
  terminalLogs,
  feedPaused,
  sessionKeyRevoked,
  ttlExpiryMs,
  onToggleFeed,
  inlineBanner,
  inlineBannerTone,
  batchResults,
  pulseHighlight = false,
  className,
}: TraderDashboardConsoleProps): ReactNode {
  return (
    <div className={className}>
      <Section3TerminalConsole
      terminalLogs={terminalLogs}
      feedPaused={feedPaused}
      isRevoked={sessionKeyRevoked}
      ttlExpiryMs={ttlExpiryMs}
      onToggleFeed={onToggleFeed}
      inlineBanner={inlineBanner}
      inlineBannerTone={inlineBannerTone}
      batchResults={batchResults}
      pulseHighlight={pulseHighlight}
    />
    </div>
  );
}
