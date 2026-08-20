/**
 * M4 Wasm feasibility — pure no-std soil core math (portable to Rust `#![no_std]`).
 * Mirrors `checkSoilResistance()` slippage / depth fuse without runtime deps.
 */

export const WASM_SOIL_MEMORY_BUDGET_BYTES = 28 * 1024;
export const WASM_SOIL_MAX_SLIPPAGE_BPS = 50;
export const WASM_SOIL_DEFAULT_SLIPPAGE_FUSE = 0.005;
export const WASM_SOIL_MIN_DEPTH_USD = 100_000;
export const WASM_SOIL_TESTNET_MIN_DEPTH_USD = 5_000;

/** `#[repr(C)]` layout — 8-byte aligned f64 fields (Rust/Wasm portable). */
export const WASM_SOIL_INPUT_BYTES = 64;
export const WASM_SOIL_OUTPUT_BYTES = 64;

export interface WasmSoilCoreInput {
  hlSpot: number;
  hlPerp: number;
  dydxPerp: number;
  depthUsd: number;
  orderSizeUsd: number;
  accountBalanceUsd: number;
  maxSlippage: number;
  minDepthUsd: number;
}

export interface WasmSoilCoreOutput {
  crossVenueSlippage: number;
  spotPerpSlippage: number;
  tripped: boolean;
  soilRiskUsd: number;
  cappedMaxSlUsd: number;
  tripFlags: number;
}

const TRIP_CROSS_VENUE = 1 << 0;
const TRIP_DEPTH = 1 << 1;
const TRIP_INSUFFICIENT = 1 << 2;

function align8(offset: number): number {
  return (offset + 7) & ~7;
}

export function wasmSoilInputByteOffset(field: keyof WasmSoilCoreInput): number {
  const order: (keyof WasmSoilCoreInput)[] = [
    "hlSpot",
    "hlPerp",
    "dydxPerp",
    "depthUsd",
    "orderSizeUsd",
    "accountBalanceUsd",
    "maxSlippage",
    "minDepthUsd",
  ];
  let offset = 0;
  for (const key of order) {
    if (key === field) return offset;
    offset = align8(offset + 8);
  }
  return offset;
}

export function encodeWasmSoilInput(input: WasmSoilCoreInput): ArrayBuffer {
  const buf = new ArrayBuffer(WASM_SOIL_INPUT_BYTES);
  const view = new DataView(buf);
  view.setFloat64(wasmSoilInputByteOffset("hlSpot"), input.hlSpot, true);
  view.setFloat64(wasmSoilInputByteOffset("hlPerp"), input.hlPerp, true);
  view.setFloat64(wasmSoilInputByteOffset("dydxPerp"), input.dydxPerp, true);
  view.setFloat64(wasmSoilInputByteOffset("depthUsd"), input.depthUsd, true);
  view.setFloat64(wasmSoilInputByteOffset("orderSizeUsd"), input.orderSizeUsd, true);
  view.setFloat64(wasmSoilInputByteOffset("accountBalanceUsd"), input.accountBalanceUsd, true);
  view.setFloat64(wasmSoilInputByteOffset("maxSlippage"), input.maxSlippage, true);
  view.setFloat64(wasmSoilInputByteOffset("minDepthUsd"), input.minDepthUsd, true);
  return buf;
}

export function decodeWasmSoilInput(buf: ArrayBuffer): WasmSoilCoreInput {
  const view = new DataView(buf);
  return {
    hlSpot: view.getFloat64(wasmSoilInputByteOffset("hlSpot"), true),
    hlPerp: view.getFloat64(wasmSoilInputByteOffset("hlPerp"), true),
    dydxPerp: view.getFloat64(wasmSoilInputByteOffset("dydxPerp"), true),
    depthUsd: view.getFloat64(wasmSoilInputByteOffset("depthUsd"), true),
    orderSizeUsd: view.getFloat64(wasmSoilInputByteOffset("orderSizeUsd"), true),
    accountBalanceUsd: view.getFloat64(wasmSoilInputByteOffset("accountBalanceUsd"), true),
    maxSlippage: view.getFloat64(wasmSoilInputByteOffset("maxSlippage"), true),
    minDepthUsd: view.getFloat64(wasmSoilInputByteOffset("minDepthUsd"), true),
  };
}

function computeCrossVenueSlippage(hlPerp: number, dydxPerp: number): number {
  return hlPerp > 0 && dydxPerp > 0 ? Math.abs(dydxPerp - hlPerp) / hlPerp : Number.POSITIVE_INFINITY;
}

function computeSpotPerpSlippage(hlSpot: number, hlPerp: number): number {
  return hlSpot > 0 ? Math.abs(hlPerp - hlSpot) / hlSpot : Number.POSITIVE_INFINITY;
}

function computeSoilRiskUsd(orderSizeUsd: number, slippageFuse: number): number {
  return Math.max(0, orderSizeUsd) * Math.max(0, slippageFuse);
}

function computeOrderAwareMaxSlUsd(
  accountBalanceUsd: number,
  orderSizeUsd: number,
  slippageFuse: number,
): number {
  const dynamicMax = Math.max(0, accountBalanceUsd) * 0.01 + 100;
  if (!(orderSizeUsd > 0)) return dynamicMax;
  return Math.min(dynamicMax, computeSoilRiskUsd(orderSizeUsd, slippageFuse));
}

/** Pure soil core — no I/O, no guards, Wasm/Rust portable. */
export function runWasmSoilCoreSim(input: WasmSoilCoreInput): WasmSoilCoreOutput {
  const crossVenueSlippage = computeCrossVenueSlippage(input.hlPerp, input.dydxPerp);
  const spotPerpSlippage = computeSpotPerpSlippage(input.hlSpot, input.hlPerp);
  let tripFlags = 0;

  if (!(input.hlPerp > 0) || !(input.dydxPerp > 0)) {
    tripFlags |= TRIP_INSUFFICIENT;
  }
  if (
    input.hlPerp > 0 &&
    input.dydxPerp > 0 &&
    crossVenueSlippage > input.maxSlippage
  ) {
    tripFlags |= TRIP_CROSS_VENUE;
  }
  if (input.depthUsd >= 0 && input.depthUsd < input.minDepthUsd) {
    tripFlags |= TRIP_DEPTH;
  }

  const slipForRisk =
    Number.isFinite(crossVenueSlippage) && crossVenueSlippage >= 0
      ? crossVenueSlippage
      : input.maxSlippage;
  const soilRiskUsd =
    input.orderSizeUsd > 0 ? computeSoilRiskUsd(input.orderSizeUsd, slipForRisk) : 0;
  const cappedMaxSlUsd =
    input.orderSizeUsd > 0 && input.accountBalanceUsd >= 0
      ? computeOrderAwareMaxSlUsd(
          input.accountBalanceUsd,
          input.orderSizeUsd,
          input.maxSlippage,
        )
      : 0;

  return {
    crossVenueSlippage: Number.isFinite(crossVenueSlippage) ? crossVenueSlippage : -1,
    spotPerpSlippage: Number.isFinite(spotPerpSlippage) ? spotPerpSlippage : -1,
    tripped: tripFlags !== 0,
    soilRiskUsd,
    cappedMaxSlUsd,
    tripFlags,
  };
}

export function runWasmSoilCoreSimFromBuffer(buf: ArrayBuffer): WasmSoilCoreOutput {
  return runWasmSoilCoreSim(decodeWasmSoilInput(buf));
}

/** Upper-bound Wasm linear memory for soil core state (input + output + scratch). */
export function estimateWasmSoilFootprintBytes(scratchSlots = 8): number {
  return WASM_SOIL_INPUT_BYTES + WASM_SOIL_OUTPUT_BYTES + scratchSlots * 8;
}
