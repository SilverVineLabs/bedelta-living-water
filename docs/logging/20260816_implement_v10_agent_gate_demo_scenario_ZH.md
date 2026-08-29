# Implement V1.0 Agent-Gate Fail-Closed Demo Scenario (08:00 Trip)

## Summary of Changes
- 新增 `src/services/telemetry-controller.ts`，定義 `SCENARIO_BUILDATHON_CRASH_HOUR_8` 預設；08:00 觸發 `checkSoilResistance()` → `statusCode: 3`、`severCircuitBreakerPipeline("R20")` 與 `ArmoredSignRejectedError` 阻擋簽章。
- `KernelSessionHUD` 頂部徽章於 trip 時切換為 `[ ⚡ CITADEL_GATE_TRIPPED (FAIL-CLOSED) ]`；`DemoControllerBar` 新增第 4 觸發器並串接 `Phase01Audit`。
- `TelemetryConsoleTerminal` 支援 ORACLE_LAG / OMEGA_SHAKE / R20_DEADLOCK / CITADEL_GATE 標籤高亮與 08:00 四行終端日誌串流。

## Test Results
- Vitest：`telemetry-controller.test.ts` 6/6 PASS；`v10-showcase-hud.test.ts` 17/17 PASS

## TS Typecheck
- `tsc --noEmit`：0 errors

## Log Output Path
- 已記錄至 `/docs/logging/20260816_implement_v10_agent_gate_demo_scenario.md`
