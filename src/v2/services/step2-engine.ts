/**
 * Step 2 — Hyperliquid L1 Internal Factors & Weak Target Selection Engine.
 *
 * @see step2/scan.ts — runStep2Scan orchestrator
 * @see step2/scoring.ts — weakness score + debuff assignment
 * @see config/constants.ts — STEP2_* SSOT thresholds
 */

export {
  DEPTH_ASYMMETRY_HIGH,
  DEPTH_ASYMMETRY_LOW,
  FUNDING_ANOMALY_THRESHOLD,
  FUNDING_EXTREME_THRESHOLD,
  LIQUIDATION_MAGNET_PCT,
  MAX_TARGETS,
  MIN_DAY_VOLUME_USD,
  STEP2_HANDSHAKE_TTL_MS,
  TIER2_L2_TOP_N,
} from "../../config/constants";

export type { Tier1Candidate } from "./step2/types";
export {
  assignDebuffs,
  buildWeakTargetMetric,
  clampScore,
  computeBookDepthAsymmetryRatio,
  computeWeaknessScore,
  passesHighFundingAsymmetryFilter,
  passesTier1Filter,
  resolveTargetDirection,
} from "./step2/scoring";
export { defaultMockL2Books, defaultMockUniverse } from "./step2/mocks";
export { runStep2Scan } from "./step2/scan";
