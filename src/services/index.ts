/**
 * SliverVine / BeΔ services barrel — venue adapters + Santenmoku Three-Eye audit.
 */

export {
  FOOL_PROOF_MAX_LEVERAGE,
  FOOL_PROOF_MAX_RETAIL_POSITION_RATIO,
  HL_SESSION_KEY_ALLOWED_CONTRACTS,
  FoolProofRejectedError,
  VineShieldRejectedError,
  assertVineShield,
  assertFoolProofGuard,
  checkVineShield,
  checkFoolProofGuard,
  checkFoolProofOrder,
  runVineShieldSoilGate,
  checkSoilResistanceWithFoolProofGuard,
  type VineShieldInput,
  type VineShieldOrder,
  type VineShieldProfile,
  type VineShieldResult,
  type FoolProofGuardInput,
  type FoolProofOrder,
  type FoolProofProfile,
  type FoolProofResult,
} from "./fool-proof-guard";

export {
  VINE_SOIL_MAX_SLIPPAGE,
  checkSoilResistanceWithVine,
  vineWrapProtection,
} from "./risk-control";

export {
  HyperliquidAdapter,
  hyperliquidAdapter,
  hyperliquidSnapshotToMaps,
  fetchHyperliquidMaps,
  parseHyperliquidResponse,
  calculateLiqDistance,
  evaluateSoilResistance,
  calculateNetDelta,
  type HyperliquidMaps,
  type HyperliquidParseBundle,
  type PositionStatus,
  type MarginHealthTier,
} from "./hyperliquid-adapter";

export {
  TELEMETRY_VENUES,
  DEFAULT_COUNTER_ATTACK_COIN,
  auditThreeEyeAdapters,
  auditGrantTelemetryAdapters,
  readCounterAttackTelemetryStatus,
  type TelemetryVenue,
  type SantenmokuThreeEyeStatus,
  type GatewayTelemetryStatus,
  type CounterAttackStatus,
  type VenueAdapterAudit,
  type GrantTelemetryAuditResult,
} from "./hl-telemetry-probe";

export {
  HL_L1_CHAIN_ID,
  HL_SESSION_KEY_AGENT_NAME,
  SESSION_KEY_NOTIONAL_CAP_USD,
  PHYSICALLY_SEVERED,
  DefenseMatrixError as SessionKeyDefenseMatrixError,
  resolveR20Locked,
  severSigningChannel,
  assertSessionKeyExecutionGates,
  buildSessionKeyEip712Stub,
  stubSignSessionKeyPayload,
  signAndExecuteOrder,
  type SessionKeyOrderTif,
  type SessionKeyOrderType,
  type SessionKeyOrderPayload,
  type SigningResult,
  type SessionKeyEip712Stub,
  type SignAndExecuteOptions,
} from "./session-key-adapter";

export {
  KV_KEYS,
  KV_TTL_SECONDS,
  saveSystemStateToKV,
  saveMatrixPayloadToKV,
  saveMarketSnapshotToKV,
  saveSoakTelemetryToKV,
  appendRiskLogToKV,
  readSystemStateFromKV,
  type KvWriteResult,
  type SystemStateKvRecord,
  type RiskLogEntry,
  type RiskLogRollingRecord,
  type SliverVineKv,
} from "./kv-store";

export {
  extractCriticalKvFlags,
  shouldPersistSystemStateToKv,
  shouldPersistMatrixPayloadToKv,
  type CriticalKvFlags,
} from "./stateManager";

export {
  sendPanicAlert,
  formatPanicAlertMessage,
  configureTelegramAlert,
  type PanicMetrics,
  type TelegramEnv,
  type SendPanicAlertResult,
} from "./telegram-notifier";

export {
  sendPanicAlert as sendPanicAlertReason,
  notifyFailClosedLock,
} from "./telemetry/telegram-alert";

export {
  RECOVERY_COOLDOWN_MS,
  NORMALIZED_SPREAD_MAX,
  recordSoilViolation,
  recordSpreadSample,
  isSoftR20Deadlock,
  vineMeshAutoRecovery,
  checkCircuitRecovery,
  getVineMeshRecoveryCount,
  type VineMeshRecoveryResult,
  type CircuitRecoveryResult,
} from "./circuit-breaker";

export {
  SOAK_TELEMETRY_KV_KEY,
  SOAK_ROLLING_MAX_TICKS,
  SOAK_TELEMETRY_COINS,
  runSoakTelemetryTick,
  evaluateSoakCoinTick,
  appendSoakTicks,
  readInMemorySoakLog,
  type SoakTelemetryTick,
  type SoakTelemetryRollingLog,
  type RunSoakTelemetryTickOptions,
} from "./soak-telemetry";

export {
  estimateAntiFragileFundingSubsidy,
  demoAntiFragileYieldSnapshot,
  AntiFragileYieldService,
  type AntiFragileYieldInput,
  type AntiFragileYieldResult,
  type AntiFragileRegime,
} from "./anti-fragile-yield";

export {
  CrossAssetRotationService,
  scoreFundingOpportunity,
  ROTATION_ASSETS,
  DEFAULT_ROTATION_SLIP_BPS,
  MAX_ROTATION_SLIP_BPS,
  MIN_HOLD_HOURS,
  type RotationAsset,
  type AssetFundingTick,
  type RotationDecision,
  type CrossAssetRotationHourResult,
  type CrossAssetRotationSummary,
} from "./cross-asset-rotation";

export {
  YIELD_POINTS_PRESETS,
  resolveYieldPointsWeights,
  resolveYieldPointsCadence,
  YieldToPointsConverter,
  type YieldPointsPresetId,
  type YieldPointsWeights,
  type YieldPointsCadence,
  type YieldPointsConverterInput,
} from "./yield-to-points-converter";

export {
  computeSlippageSaved,
  demoSlippageSavedTelemetry,
  type SlippageSavedSample,
  type SlippageSavedTelemetry,
} from "./slippage-saved-telemetry";

export {
  estimateSlippageSaved,
  type SlippageSavedEstimatorInput,
  type SlippageSavedEstimatorResult,
} from "./slippage-saved-estimator";

export {
  TWAP_PATH_SLOT_COUNT,
  TWAPEngineV2,
  TwapEngineV2Stub,
  TwapEngineV2Full30,
  type TwapPathRoute,
  type TwapPlanInput,
  type TwapSliceResult,
  type TwapPathVenue,
} from "./execution/twap-engine-v2";
