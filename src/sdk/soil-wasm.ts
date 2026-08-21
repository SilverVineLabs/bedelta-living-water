/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2026 SilverVine Labs
 * M4 Wasm soil/session loader — production requires Wasm; dev falls back to TS sim.
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  encodeWasmSoilInput,
  runWasmSoilCoreSim,
  type WasmSoilCoreInput,
  type WasmSoilCoreOutput,
} from "../services/wasm-feasibility-lib/soil-core-sim";
import { SESSION_KEY_AUTO_EXPIRE_MS, SESSION_KEY_CLIP_USD } from "../services/risk/session-audit";

export const WASM_ABI_VERSION = 1 as const;
export const WASM_BUDGET_BYTES = 28 * 1024;
export const WASM_EXEC_BUDGET_US = 60;

type SoilExports = {
  memory: WebAssembly.Memory;
  soil_core_eval: (inPtr: number, outPtr: number) => number;
  session_core_ok: (
    clip: number, limit: number, exp: number, now: number, window: number,
  ) => number;
  soil_core_abi_version: () => number;
};

let exportsRef: SoilExports | null = null;

function resolveDefaultWasmPath(): string {
  const here = dirname(fileURLToPath(import.meta.url));
  return join(here, "../../pkg/soil_core.wasm");
}

function bindInstance(bytes: Uint8Array): boolean {
  const copy = new Uint8Array(bytes.byteLength);
  copy.set(bytes);
  const mod = new WebAssembly.Module(copy);
  const instance = new WebAssembly.Instance(mod, {});
  const ex = instance.exports as unknown as SoilExports;
  if (ex.soil_core_abi_version() !== WASM_ABI_VERSION) return false;
  exportsRef = ex;
  return true;
}

/** Load official `pkg/soil_core.wasm` (sync — Node / Vitest / Worker bootstrap). */
export function initSoilWasm(source?: ArrayBuffer | Uint8Array): boolean {
  try {
    const bytes = source
      ? source instanceof ArrayBuffer
        ? new Uint8Array(source)
        : new Uint8Array(source.buffer, source.byteOffset, source.byteLength)
      : new Uint8Array(readFileSync(resolveDefaultWasmPath()));
    return bindInstance(bytes);
  } catch {
    exportsRef = null;
    return false;
  }
}

export function isSoilWasmReady(): boolean {
  return exportsRef != null;
}

export function __resetSoilWasmForTests(): void {
  exportsRef = null;
}

/** Lazy-load default binary once. */
export function ensureSoilWasm(): boolean {
  if (exportsRef) return true;
  return initSoilWasm();
}

function runViaWasm(input: WasmSoilCoreInput): WasmSoilCoreOutput {
  const ex = exportsRef!;
  const view = new DataView(ex.memory.buffer);
  const encoded = new DataView(encodeWasmSoilInput(input));
  for (let i = 0; i < 64; i++) view.setUint8(i, encoded.getUint8(i));
  const flags = ex.soil_core_eval(0, 64);
  return {
    crossVenueSlippage: view.getFloat64(64, true),
    spotPerpSlippage: view.getFloat64(72, true),
    tripped: view.getFloat64(80, true) !== 0 || flags !== 0,
    soilRiskUsd: view.getFloat64(88, true),
    cappedMaxSlUsd: view.getFloat64(96, true),
    tripFlags: flags || Math.trunc(view.getFloat64(104, true)),
  };
}

/** Soil core: Wasm when ready, else pure TS sim. */
export function evaluateSoilCore(input: WasmSoilCoreInput): {
  output: WasmSoilCoreOutput;
  wasmUsed: boolean;
  elapsedUs: number;
} {
  const t0 = performance.now();
  const wasmUsed = exportsRef != null;
  const output = wasmUsed ? runViaWasm(input) : runWasmSoilCoreSim(input);
  return { output, wasmUsed, elapsedUs: (performance.now() - t0) * 1000 };
}

export function evaluateSessionCoreWasm(input: {
  maxOrderClipUsd: number;
  expiresAtMs: number;
  nowMs: number;
}): boolean | null {
  if (!exportsRef) return null;
  return (
    exportsRef.session_core_ok(
      input.maxOrderClipUsd,
      SESSION_KEY_CLIP_USD,
      input.expiresAtMs,
      input.nowMs,
      SESSION_KEY_AUTO_EXPIRE_MS,
    ) === 1
  );
}
