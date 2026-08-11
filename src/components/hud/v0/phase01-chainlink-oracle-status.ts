const CHAINLINK_STREAMING_THRESHOLD_MS = 10_000;

export function resolveChainlinkOracleStatus(
  lagMs: number,
  chaosLag: boolean,
): { label: string; className: string; testId: string; tooltip?: string } {
  if (chaosLag) {
    return {
      label: "[ 🔴 HARD DEADLOCK TRIGGERED (Fail-Closed Armed) ]",
      className: "font-mono text-[10px] font-semibold text-red-400 animate-pulse",
      testId: "grant-audit-oracle-deadlock-status",
    };
  }
  if (lagMs < CHAINLINK_STREAMING_THRESHOLD_MS) {
    return {
      label: "[ ⚡ Active Streaming ]",
      className: "font-mono text-[10px] font-semibold text-emerald-400",
      testId: "grant-audit-oracle-streaming-status",
    };
  }
  return {
    label: "[ 💚 Heartbeat Idle (Normal - Chainlink Low-Latency) ]",
    className: "font-mono text-[10px] font-medium text-green-400/80",
    testId: "grant-audit-oracle-heartbeat-status",
    tooltip:
      "Chainlink Data Streams push on heartbeat cadence; idle gaps below fail-closed threshold are expected low-latency behavior.",
  };
}
