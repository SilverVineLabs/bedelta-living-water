/**
 * Zero-key cross-chain dry-run sandbox — HL simulation.
 */

import {
  evaluateGlobalRiskPolicy,
  type RiskIntent,
  type RiskVenue,
} from "../../core/risk-engine";
import { R20_LOCKED, buildSystemState, type SystemState } from "../../core/state";
import {
  HardlockError,
  RiskLimitExceeded,
  checkSoilResistance,
  isR20Locked,
  vineWrapProtection,
} from "../../core/risk";
import { checkFoolProofGuard } from "../fool-proof-guard";

export type SandboxGate =
  | "R20_LOCK"
  | "ROOT_PROTECTION"
  | "FOOL_PROOF_GUARD"
  | "SOIL_RESISTANCE"
  | "HL_DRY_RUN";

export interface SandboxDiagnosticReport {
  isAllowed: boolean;
  venue: RiskVenue;
  zeroKeyDryRun: true;
  passedGates: SandboxGate[];
  failedGate?: SandboxGate;
  reason?: string;
  suggestedHttpCode?: number;
  simulatedExecutionTimeMs: number;
  executionPath: string[];
}

function resolveMockState(mockState?: Partial<SystemState>): SystemState {
  const base = buildSystemState({
    accountBalanceUsd: mockState?.accountBalanceUsd,
    currentCri: mockState?.currentCri,
    skipHardlockAssert: true,
  });
  const cri = mockState?.currentCri ?? base.currentCri;
  const hardlock = mockState?.hardlock ?? base.hardlock;

  return {
    ...base,
    ...mockState,
    dynamicMaxSL: mockState?.dynamicMaxSL ?? base.dynamicMaxSL,
    hudState: mockState?.hudState ?? base.hudState,
    signingChannelOpen:
      mockState?.signingChannelOpen ?? !(hardlock || cri <= 0),
  };
}

function buildReport(args: {
  intent: RiskIntent;
  passedGates: SandboxGate[];
  failedGate?: SandboxGate;
  reason?: string;
  suggestedHttpCode?: number;
  startedAt: number;
  executionPath: string[];
}): SandboxDiagnosticReport {
  const isAllowed = !args.failedGate;
  return {
    isAllowed,
    venue: args.intent.venue,
    zeroKeyDryRun: true,
    passedGates: args.passedGates,
    failedGate: args.failedGate,
    reason: args.reason,
    suggestedHttpCode: args.suggestedHttpCode,
    simulatedExecutionTimeMs: Math.max(0, Date.now() - args.startedAt),
    executionPath: args.executionPath,
  };
}

/** Zero-key dry-run simulation with gate-by-gate diagnostic path. */
export function simulateTransactionIntent(
  intent: RiskIntent,
  mockState?: Partial<SystemState>,
): SandboxDiagnosticReport {
  const startedAt = Date.now();
  const passedGates: SandboxGate[] = [];
  const executionPath: string[] = ["sandbox:start"];
  const state = resolveMockState(mockState);
  const enrichedIntent: RiskIntent = { ...intent, systemState: state };

  executionPath.push(`venue:${intent.venue}`);
  executionPath.push("mode:zero-key-dry-run");

  if (isR20Locked(state)) {
    executionPath.push("gate:R20_LOCK:fail");
    return buildReport({
      intent,
      passedGates,
      failedGate: "R20_LOCK",
      reason: `${R20_LOCKED} — signing channel severed`,
      suggestedHttpCode: 403,
      startedAt,
      executionPath,
    });
  }
  passedGates.push("R20_LOCK");
  executionPath.push("gate:R20_LOCK:pass");

  try {
    vineWrapProtection({
      symbol: intent.symbol ?? intent.venue,
      estimatedLossUsd: intent.amountUsd,
      accountBalanceUsd: state.accountBalanceUsd,
      criHardlock: state.hardlock,
    });
  } catch (err) {
    if (err instanceof HardlockError) {
      executionPath.push("gate:ROOT_PROTECTION:fail");
      return buildReport({
        intent,
        passedGates,
        failedGate: "ROOT_PROTECTION",
        reason: err.message,
        suggestedHttpCode: 403,
        startedAt,
        executionPath,
      });
    }
    if (err instanceof RiskLimitExceeded) {
      executionPath.push("gate:ROOT_PROTECTION:fail");
      return buildReport({
        intent,
        passedGates,
        failedGate: "ROOT_PROTECTION",
        reason: err.message,
        suggestedHttpCode: 422,
        startedAt,
        executionPath,
      });
    }
    throw err;
  }
  passedGates.push("ROOT_PROTECTION");
  executionPath.push("gate:ROOT_PROTECTION:pass");

  const foolProof = checkFoolProofGuard({
    order: {
      positionValueUsd: intent.amountUsd,
      leverage: intent.foolProof?.leverage,
      contractTarget: intent.foolProof?.contractTarget,
      profile: intent.foolProof?.profile,
      reduceOnly: intent.foolProof?.reduceOnly,
    },
    accountBalanceUsd: state.accountBalanceUsd,
  });
  if (foolProof.rejected) {
    executionPath.push("gate:FOOL_PROOF_GUARD:fail");
    return buildReport({
      intent,
      passedGates,
      failedGate: "FOOL_PROOF_GUARD",
      reason: `Fool-proof guard rejected — ${foolProof.reasons.join("|")}`,
      suggestedHttpCode: 422,
      startedAt,
      executionPath,
    });
  }
  passedGates.push("FOOL_PROOF_GUARD");
  executionPath.push("gate:FOOL_PROOF_GUARD:pass");

  if (intent.soil) {
    const soil = checkSoilResistance(intent.soil);
    if (soil.tripped) {
      executionPath.push("gate:SOIL_RESISTANCE:fail");
      return buildReport({
        intent,
        passedGates,
        failedGate: "SOIL_RESISTANCE",
        reason: `Soil resistance tripped — ${soil.reasons.join("|")}`,
        suggestedHttpCode: 422,
        startedAt,
        executionPath,
      });
    }
    passedGates.push("SOIL_RESISTANCE");
    executionPath.push("gate:SOIL_RESISTANCE:pass");
  }

  const dryRunGate: SandboxGate = "HL_DRY_RUN";
  passedGates.push(dryRunGate);
  executionPath.push(`gate:${dryRunGate}:pass`);
  executionPath.push("sandbox:complete");

  const policy = evaluateGlobalRiskPolicy(enrichedIntent);
  if (!policy.isAllowed) {
    return buildReport({
      intent,
      passedGates: passedGates.slice(0, -1),
      failedGate: dryRunGate,
      reason: policy.reason,
      suggestedHttpCode: policy.suggestedHttpCode,
      startedAt,
      executionPath: [...executionPath.slice(0, -1), `gate:${dryRunGate}:fail`],
    });
  }

  return buildReport({
    intent,
    passedGates,
    startedAt,
    executionPath,
  });
}
