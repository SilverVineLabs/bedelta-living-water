import verifiedResultsJson from "../../data/verified_5tx_results.json";
import {
  Section3TelemetryConsole as LiveRiskTelemetryConsole,
  type Section3TelemetryConsoleProps as LiveRiskTelemetryConsoleProps,
} from "../../components/hud/Section3/Section3TelemetryConsole";

export {
  BASE_TERMINAL_LOG_TEMPLATES,
  createTerminalLog,
  EMERGENCY_REVOKE_LOGS,
  MEV_SIMULATION_LOGS,
  SESSION_KEY_REAUTH_LOG,
  SESSION_TTL_MS,
  SESSION_TTL_REAUTH_MS,
  unwrapErrorDetail,
  type TerminalLogLevel,
  type TerminalLogLine,
} from "../../components/hud/Section3/terminal-log";

export { LiveRiskTelemetryConsole, type LiveRiskTelemetryConsoleProps };

export function downloadTcaPackage(): void {
  const blob = new Blob([JSON.stringify(verifiedResultsJson, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "verified_5tx_testnet_tca.json";
  anchor.click();
  URL.revokeObjectURL(url);
}

export default LiveRiskTelemetryConsole;
