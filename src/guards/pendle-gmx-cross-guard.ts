export interface PTMarketState {
  expiry: number; // Unix timestamp in seconds
  impliedYield: number; // e.g. 0.05 (5%)
  historicalYield24h: number; // e.g. 0.052
  ptPriceInAsset: number; // PT price relative to underlying asset (e.g. 0.92)
  liquidityConstant: number; // AMM liquidity parameter k
  dynamicFeeRate: number; // e.g. 0.01 (1%)
}

export interface GMXPositionState {
  collateralAmount: number;
  collateralTokenPriceUsd: number;
  sizeNotionalUsd: number;
  intent: 'open' | 'increase' | 'close' | 'reduce';
}

export interface ShadowMarginResult {
  passed: boolean;
  effectiveScore: number; // 0 - 100
  shadowMarginUsd: number;
  dynamicLtv: number;
  action: 'PASS_GREENLIGHT' | 'FAIL_CLOSED_BLOCK' | 'EMERGENCY_DELEVERAGE_ALLOWED';
  reason?: string;
}

export function evaluatePendleGmxCrossGuard(
  ptMarket: PTMarketState,
  gmxPos: GMXPositionState,
  assetUsdPrice: number
): ShadowMarginResult {
  const nowSec = Math.floor(Date.now() / 1000);
  const T = Math.max(0, (ptMarket.expiry - nowSec) / (365.25 * 86400));
  const timeDecayFactor = Math.exp(-3 * T);

  const yieldJitter =
    Math.abs(ptMarket.historicalYield24h - ptMarket.impliedYield) /
    Math.max(0.0001, ptMarket.impliedYield);
  const yieldRisk = Math.min(1, yieldJitter / 0.02);

  const exitSizeNotional = 1_000_000;
  const simulatedSlippage =
    (exitSizeNotional * ptMarket.ptPriceInAsset) /
    Math.max(1, 2 * ptMarket.liquidityConstant);
  const exitNetPrice =
    ptMarket.ptPriceInAsset * (1 - ptMarket.dynamicFeeRate - simulatedSlippage);
  const discountedRedemption = 1.0 * Math.exp(-0.02 * T);
  const effectivePtValueInAsset = Math.max(exitNetPrice, discountedRedemption);

  const rawRiskScore = Math.round(
    (timeDecayFactor * 0.4 +
      yieldRisk * 0.3 +
      Math.min(1, simulatedSlippage / 0.05) * 0.3) *
      100
  );

  const isDeleveraging = gmxPos.intent === 'close' || gmxPos.intent === 'reduce';
  const effectiveScore = isDeleveraging
    ? Math.max(0, rawRiskScore - 40)
    : rawRiskScore;

  const shadowCollateralUsd =
    gmxPos.collateralAmount * effectivePtValueInAsset * assetUsdPrice;
  const maintenanceMarginRequiredUsd = gmxPos.sizeNotionalUsd * 0.05;
  const shadowMarginUsd = shadowCollateralUsd - maintenanceMarginRequiredUsd;
  const dynamicLtv =
    shadowCollateralUsd > 0 ? gmxPos.sizeNotionalUsd / shadowCollateralUsd : 999;

  if (isDeleveraging) {
    return {
      passed: true,
      effectiveScore,
      shadowMarginUsd,
      dynamicLtv,
      action: 'EMERGENCY_DELEVERAGE_ALLOWED',
      reason:
        'RISK_DECREASE_INTENT: De-leveraging greenlighted to protect position.',
    };
  }

  if (effectiveScore > 75 || shadowMarginUsd < 0) {
    return {
      passed: false,
      effectiveScore,
      shadowMarginUsd,
      dynamicLtv,
      action: 'FAIL_CLOSED_BLOCK',
      reason: `FAIL_CLOSED: Dynamic Fee / Slippage threatens GMX Margin Safety. Score=${effectiveScore}`,
    };
  }

  return {
    passed: true,
    effectiveScore,
    shadowMarginUsd,
    dynamicLtv,
    action: 'PASS_GREENLIGHT',
  };
}
