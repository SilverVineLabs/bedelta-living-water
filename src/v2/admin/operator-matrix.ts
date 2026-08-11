/**
 * Admin HUD entry point for operator-matrix SSOT.
 * Canonical definitions live in src/data/operator-matrix.ts.
 */

export {
  buildProtocolVersionUnlocks,
  CATEGORY_PREFIX,
  formatOperatorPrefixLabel,
  isScaleDownOperator,
  OPERATOR_DISPLAY_CODE,
  OPERATOR_SAVED_BPS,
  OPERATOR_TARGET_VERSION,
  operatorsIntroducedAt,
  operatorsUnlockedAt,
  operatorDisplayCode,
  estimateMaxSavedBpsForVersion,
  estimateSavedBpsForVersion,
  VERIFIED_LIVE_SAVED_BPS_V08,
  SCALE_DOWN_OPERATOR_COUNT,
  SCALE_DOWN_OPERATOR_IDS,
  scaleDownOperatorsForCategory,
  STANDARD_OPERATOR_ROSTER,
} from "../../data/operator-matrix";

export type {
  ExtendedProtocolVersion,
  OperatorCategoryId,
  OperatorCategoryPrefix,
  OperatorUnlockVersion,
  StandardOperatorDef,
  VersionSavedBpsEstimate,
} from "../../data/operator-matrix";
