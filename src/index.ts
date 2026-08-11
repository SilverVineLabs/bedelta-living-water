import type { Env } from "./env";
import { handleWorkerFetch } from "./worker-fetch";
import { runScheduledJobs } from "./worker-scheduled";

export type { Env };
export {
  checkVineShield,
  checkFoolProofGuard,
  checkFoolProofOrder,
  assertVineShield,
  assertFoolProofGuard,
  runVineShieldSoilGate,
  checkSoilResistanceWithFoolProofGuard,
  checkSoilResistanceWithVine,
  vineWrapProtection,
} from "./services/index";
export type {
  VineShieldOrder,
  VineShieldResult,
  VineShieldProfile,
  VineShieldInput,
  FoolProofOrder,
  FoolProofResult,
  FoolProofProfile,
  FoolProofGuardInput,
} from "./services/index";
export {
  evaluateGlobalRiskPolicy,
} from "./core/risk-engine";
export type {
  GlobalRiskPolicyResult,
  FoolProofIntent,
  FundingRegimeIntent,
  RiskIntent,
  RiskVenue,
} from "./core/risk-engine";
export { simulateTransactionIntent } from "./services/sandbox";
export type { SandboxDiagnosticReport } from "./services/sandbox";
export {
  createCrossLegIntent,
  prepareIntent,
  commitIntent,
  abortIntent,
  getIntent,
} from "./core/intent-ledger";
export type {
  CrossLegIntent,
  IntentPhase,
  IntentLeg,
  FlattenAction,
} from "./core/intent-ledger";
export {
  auditThreeEyeAdapters,
  readCounterAttackTelemetryStatus,
  TELEMETRY_VENUES,
  fetchHyperliquidMaps,
  signAndExecuteOrder,
  assertSessionKeyExecutionGates,
  severSigningChannel,
  sendPanicAlert,
  sendPanicAlertReason,
  notifyFailClosedLock,
  vineMeshAutoRecovery,
  checkCircuitRecovery,
  recordSoilViolation,
} from "./services/index";
export type {
  CounterAttackStatus,
  PanicMetrics,
  VineMeshRecoveryResult,
  CircuitRecoveryResult,
  SessionKeyOrderPayload,
  SigningResult,
  SessionKeyEip712Stub,
  SignAndExecuteOptions,
} from "./services/index";

console.log("[bedelta-living-water] worker boot");

/**
 * BeΔ Living Water Workers entry — API routes + static SPA via ASSETS binding.
 */
export default {
  async fetch(
    request: Request,
    env: Env,
    ctx: ExecutionContext,
  ): Promise<Response> {
    return handleWorkerFetch(request, env, ctx);
  },

  async scheduled(
    controller: ScheduledController,
    env: Env,
    ctx: ExecutionContext,
  ): Promise<void> {
    console.log("[bedelta-living-water] cron fired", controller.cron);
    try {
      await runScheduledJobs(env, controller.cron);
    } catch (err) {
      console.error("[bedelta-living-water] scheduled cron failed", err);
    }
    void ctx;
  },
} satisfies ExportedHandler<Env>;
