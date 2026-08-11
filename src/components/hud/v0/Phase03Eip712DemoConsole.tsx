import { useMemo, type ReactNode } from "react";
import { isCitadelChaosHardLocked, useCitadelChaosStore } from "../citadel-chaos-store";
import { NonCustodialGuardBadge } from "../Section1/ActionBar/NonCustodialGuardBadge";
import { Section3TerminalConsole } from "../Section3/Section3TerminalConsole";
import {
  BASE_TERMINAL_LOG_TEMPLATES,
  SESSION_TTL_MS,
  createTerminalLog,
} from "../Section3/terminal-log";

export function Phase03Eip712DemoConsole(): ReactNode {
  const chaosMode = useCitadelChaosStore();
  const chaosHardLocked = isCitadelChaosHardLocked(chaosMode);
  const terminalLogs = useMemo(
    () =>
      BASE_TERMINAL_LOG_TEMPLATES.map((entry, index) =>
        createTerminalLog(entry.level, entry.message, `12:0${index}:00`),
      ),
    [],
  );

  return (
    <div className="flex flex-col gap-3" data-testid="phase03-eip712-demo-console">
      <NonCustodialGuardBadge chaosHardLocked={chaosHardLocked} />
      <Section3TerminalConsole
        terminalLogs={terminalLogs}
        feedPaused={false}
        ttlExpiryMs={Date.now() + SESSION_TTL_MS}
        onToggleFeed={() => undefined}
      />
    </div>
  );
}
