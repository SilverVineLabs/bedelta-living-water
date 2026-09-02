# fix_500ms_sever_circuit_breaker

> **Vitest SSOT:** Proposal Baseline: 175 test files | 773 PASS (Current Branch Live: 176 test files | 775 PASS Clean)

## Summary of Changes
- Step-2 L2 probe 失敗（`probeOk: false` 或延遲 >500ms）時呼叫 `severCircuitBreakerPipeline("R20")`，強制 `signingChannelOpen: false`
- 新增 `l2-probe-circuit-breaker.ts` 與 `checkSoilResistanceWithL2ProbeGuard` 串接 soil 前置探測
- 新增 `tests/services/l2-probe-circuit-breaker.test.ts` 驗證 >500ms 與 fetch 失敗會物理切斷 Hot Key 簽名管線

## Test Results
- `pnpm exec vitest run tests/services/l2-probe-circuit-breaker.test.ts` — 2 PASS

## TS Typecheck
- `pnpm typecheck` — CLEAN

## Log Output Path
- `/docs/logging/20260816_fix_500ms_sever_circuit_breaker.md`
