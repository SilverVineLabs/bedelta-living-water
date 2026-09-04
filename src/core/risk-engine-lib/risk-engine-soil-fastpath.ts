/**
 * Soil resistance fast-path — nominal gateway short-circuit.
 */

import {
  checkSoilResistance as checkSoilResistanceBase,
  MAX_SLIPPAGE,
  isTsunamiShieldWindow,
  type SoilResistanceInput,
} from "../risk";
import { resolveSoilMinDepthUsd, type SoilResistanceResult } from "../../services/risk-control";
import {
  evaluateSoilSlippagePacked,
  packSoilLane,
} from "../../services/risk-control-lib/soil-resistance-math";
import { isXyzOrHip3Key } from "../../services/exchanges/asset-classifier-lib/asset-classifier-keywords";
import { isArbitrumStatusSequencerHealthy } from "../../services/adapters/arbitrum-status-sentinel";
import { isRpcRadarSequencerHealthy } from "../../services/adapters/rpc-radar";
import { isSequencerSafe } from "../../services/risk/sequencer-guard";
import { isArbitrumGasGuardBlocked } from "../../services/risk/arbitrum-gas-guard";
import { isSoftConfirmationSafe } from "../../services/risk/soft-confirmation-guard";

const SOIL_RESISTANCE_CLEAR: SoilResistanceResult = {
  ok: true,
  tripped: false,
  crossVenueSlippage: 0,
  spotPerpSlippage: 0,
  reasons: [],
};

let fastPathSoilRef: SoilResistanceInput | null = null;
let fastPathSoilResult = false;

export function isGatewayNominalFastPath(soil: SoilResistanceInput): boolean {
  if (fastPathSoilRef === soil) return fastPathSoilResult;
  if (soil.crossSpread || soil.gmxPriceImpact || isXyzOrHip3Key(soil.symbol)) {
    fastPathSoilRef = soil;
    fastPathSoilResult = false;
    return false;
  }
  const fuse = soil.maxSlippage ?? MAX_SLIPPAGE;
  const minDepth = resolveSoilMinDepthUsd(soil);
  const lane = packSoilLane(
    soil.hlSpot,
    soil.hlPerp,
    soil.dydxPerp,
    soil.depthUsd ?? Number.NaN,
    fuse,
    minDepth,
  );
  const { tripFlags } = evaluateSoilSlippagePacked(lane);
  if (tripFlags !== 0) {
    fastPathSoilRef = soil;
    fastPathSoilResult = false;
    return false;
  }
  if (isTsunamiShieldWindow(soil.at)) {
    fastPathSoilRef = soil;
    fastPathSoilResult = false;
    return false;
  }
  const atMs = soil.at?.getTime();
  const ok =
    isSequencerSafe(atMs) &&
    isArbitrumStatusSequencerHealthy(atMs) &&
    isRpcRadarSequencerHealthy(atMs) &&
    !isArbitrumGasGuardBlocked() &&
    isSoftConfirmationSafe(atMs);
  fastPathSoilRef = soil;
  fastPathSoilResult = ok;
  return ok;
}

export function checkSoilResistance(input: SoilResistanceInput): SoilResistanceResult {
  return isGatewayNominalFastPath(input) ? SOIL_RESISTANCE_CLEAR : checkSoilResistanceBase(input);
}
