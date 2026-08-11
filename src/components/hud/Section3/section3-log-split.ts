import type { TerminalLogLine } from "./terminal-log";

const SOIL_PATTERN = /SOIL_RESISTANCE/i;
const EXEC_PATTERN =
  /LIVE_5TX|BATCH_FILL|TCA-ANCHOR|TCA_ANCHOR|DEMO_FILL|FILLED|GRANT_PROOF|AUDIT_EXPORT/i;

export function isSoilResistanceLog(line: TerminalLogLine): boolean {
  return SOIL_PATTERN.test(line.message);
}

export function isExecutionFillLog(line: TerminalLogLine): boolean {
  return EXEC_PATTERN.test(line.message);
}

export function splitTerminalLogsForDualConsole(logs: readonly TerminalLogLine[]): {
  soilLogs: TerminalLogLine[];
  executionLogs: TerminalLogLine[];
} {
  const soilLogs: TerminalLogLine[] = [];
  const executionLogs: TerminalLogLine[] = [];
  for (const line of logs) {
    if (isSoilResistanceLog(line)) {
      soilLogs.push(line);
    } else if (isExecutionFillLog(line)) {
      executionLogs.push(line);
    } else {
      executionLogs.push(line);
    }
  }
  return { soilLogs, executionLogs };
}

/** Map fill index (1-5) to most recent matching soil probe log id for pulse sync. */
export function resolveSoilPulseTargetId(
  fillMessage: string,
  soilLogs: readonly TerminalLogLine[],
): string | null {
  const match = /LIVE_5TX\s+(\d)\/5/i.exec(fillMessage);
  if (!match) return null;
  const fillIndex = Number(match[1]);
  const probes = soilLogs.filter((l) => isSoilResistanceLog(l));
  if (probes.length === 0) return null;
  const target = probes[Math.min(fillIndex - 1, probes.length - 1)];
  return target?.id ?? null;
}

export function extractFillIndex(message: string): number | null {
  const match = /LIVE_5TX\s+(\d)\/5/i.exec(message);
  return match ? Number(match[1]) : null;
}
