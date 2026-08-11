import {
  buildAutoDemoLogTemplates,
  buildMevAttackLogTemplates,
  createSimulatedDemoProofBatch,
  runMevSoilProbe,
} from "../../../../components/hud/Section1/section1-hud-engine-lib/section1-hud-engine-core";
import { SOIL_CHECK_DELAY_MS } from "../../../../components/hud/Section1/section1-hud-types";
import type { ScaleDownComboId } from "../../../../components/hud/scale-down-presets";
import {
  appendLogs,
  DEMO_PLAYBACK_MS,
  MEV_FEED_FREEZE_MS,
  MEV_TOAST_DURATION_MS,
  MEV_TOAST_MESSAGE,
  playbackLogs,
} from "../trader-dashboard-log-utils";
import type { TraderDashboardHandlerDeps } from "./handler-types";

export function createSimulationHandlers(deps: TraderDashboardHandlerDeps) {
  const handleAutoDemo = () => {
    if (deps.physicalDeadlock) return;
    deps.setDemoRunning(true);
    deps.setShieldDemoPulse(true);
    deps.setFeedPaused(true);
    playbackLogs(deps.setTerminalLogs, buildAutoDemoLogTemplates(), DEMO_PLAYBACK_MS, () => {
      const demoBatch = createSimulatedDemoProofBatch(deps.walletAddress ?? undefined);
      deps.setTxBatches((prev) => [
        demoBatch,
        ...prev.filter((batch) => batch.id !== demoBatch.id),
      ]);
      deps.setSelectedBatchId(demoBatch.id);
      appendLogs(deps.setTerminalLogs, [
        {
          level: "SYSTEM",
          message: "TCA_PROOF_JSON: Batch #Demo (Simulated Proof) generated and selected",
        },
      ]);
      deps.setDemoRunning(false);
      deps.setShieldDemoPulse(false);
      deps.setFeedPaused(false);
    });
  };

  const handleComboChange = (combo: ScaleDownComboId) => {
    deps.setScaleDownCombo(combo);
    if (deps.mevAttackPhase !== "idle") {
      deps.resetMevAttackState();
      appendLogs(deps.setTerminalLogs, [
        {
          level: "INFO",
          message: "MEV_ATTACK: reset to normal Green/Gold shield mode (preset change)",
        },
      ]);
    }
  };

  const handleInjectMev = () => {
    if (deps.physicalDeadlock) return;
    if (deps.mevAttackPhase !== "idle") {
      deps.resetMevAttackState();
      appendLogs(deps.setTerminalLogs, [
        {
          level: "INFO",
          message: "MEV_ATTACK: reset to normal Green/Gold shield mode",
        },
      ]);
      return;
    }
    deps.setMevAttackPhase("alarm");
    deps.setMevAttackToxicityBps(15);
    deps.setBaselineAlarmFlash(true);
    deps.setSection1ShakeActive(true);
    window.setTimeout(() => deps.setSection1ShakeActive(false), 1_500);
    deps.setForceUltraShield(false);
    deps.setFeedPaused(true);
    appendLogs(deps.setTerminalLogs, [
      {
        level: deps.protocolVersion === "v1.5" ? "SIMULATION" : "EMERGENCY",
        message:
          deps.protocolVersion === "v1.5"
            ? "[UM-03 INVERT] 15.0 bps Toxicity intercepted and converted to Dynamic Protocol Rebate (+15.0 bps)"
            : "[CRITICAL] MEV Sandwich Succeeded! Slippage Loss: -15.0 bps",
      },
    ]);
    window.setTimeout(() => {
      const soilLog = runMevSoilProbe();
      deps.setSoilResistanceLogs((prev) => [...prev, soilLog]);
      appendLogs(
        deps.setTerminalLogs,
        buildMevAttackLogTemplates(soilLog, deps.protocolVersion, deps.mevAttackToxicityBps),
      );
      if (deps.protocolVersion === "v1.5") {
        deps.setMevAttackPhase("recovered");
        deps.setForceUltraShield(true);
        deps.setMevToast(MEV_TOAST_MESSAGE);
      } else {
        deps.setMevAttackPhase("alarm");
        deps.setForceUltraShield(false);
      }
      deps.setBaselineAlarmFlash(false);
      window.setTimeout(() => deps.setMevToast(null), MEV_TOAST_DURATION_MS);
      window.setTimeout(() => deps.setFeedPaused(false), MEV_FEED_FREEZE_MS);
    }, SOIL_CHECK_DELAY_MS);
  };

  const handleInjectChaosRpcDelay = (payload: {
    soilLog: import("../../../../components/hud/Section1/section1-hud-types").SoilResistanceLogEntry;
    terminalLine: string;
  }) => {
    deps.setChaosSoilTripped(true);
    deps.setSoilResistanceLogs((prev) => [...prev, payload.soilLog]);
    appendLogs(deps.setTerminalLogs, [
      { level: "WARN", message: "CHAOS: Simulated 500ms RPC delay / MEV injected" },
      { level: "EMERGENCY", message: `${payload.terminalLine} | tradeAllowed: false` },
    ]);
  };

  const handleResetChaosRpcDelay = () => {
    deps.setChaosSoilTripped(false);
    appendLogs(deps.setTerminalLogs, [
      { level: "INFO", message: "CHAOS: SOIL_RESISTANCE_TRIP cleared — tradeAllowed restored" },
    ]);
  };

  return {
    handleAutoDemo,
    handleComboChange,
    handleInjectMev,
    handleInjectChaosRpcDelay,
    handleResetChaosRpcDelay,
  };
}
