# Phase C — ZeroDev Smart Routing UI & Bundle Guard（Final Audit）

**日期：** 2026-08-25  
**分支：** `v1.0_push_BDLW`  
**範圍：** DApp UI stub · Worker bundle diet · 零 EIP-712 變更

---

## 變更摘要

### UI 整合（silvervine.xyz DApp · Tab 2）
- 新增 `ZeroDevSmartRouteDepositStub.tsx` — 1-click 跨鏈存款預覽 stub
- 新增 `smart-route-deposit-flow.ts` — Deposit → `checkSoilResistance()` → `payloadHash` Gate 模擬
- 掛載於 `ZeroDeltaVault`（Grant Audit Dashboard Tab 2）

### Bundle Guard
- 移除 `wrangler.toml` `nodejs_compat`（−9.1 KiB gzip）
- 拆分 `zerodev-aa-gateway-badge.ts` — Worker 不再拉入完整 `zerodev-aa-gate`（−0.45 KiB）
- `gmx-revenue.ts` 內聯 `GMX_REFERRAL_CODE_BYTES32`（移除 viem import）
- `measure-worker-bundle.ts` 新增 `limitKiB: 158.99` fail-closed 檢查

---

## 狀態流（Deposit → Soil → Gate）

```text
[1-Click Preview]
  → quoteRChainYieldToArbitrumGm()     // Robinhood 46630 USDG route
  → checkSoilResistance()            // off-chain fail-closed
  → buildGmxSmartRoutePayloadBinding() // GatedExecutor.payloadHash ONLY
  → [ ✓ GATE SIM ALLOW ] | [ ✗ FAIL-CLOSED ]
```

---

## Bundle 量測

```json
{
  "measuredAt": "2026-08-25T13:38:29.494Z",
  "gzipKiB": 158.84,
  "wranglerTotalGzipKiB": 158.84,
  "limitKiB": 158.99,
  "pass": true
}
```

| 階段 | gzip KiB | 備註 |
|------|----------|------|
| Phase C 前（含 nodejs_compat） | 168.39 | 超標 |
| 移除 nodejs_compat | 159.29 | 仍超 0.30 KiB |
| + gateway-badge 拆分 | **158.84** | ✅ PASS |

---

## 測試結果

### Vitest

```text
Test Files  167 passed (167)
     Tests  741 passed (741)
pnpm typecheck → 0 errors
```

新增測試：
```text
 ✓ tests/components/smart-route-deposit-flow.test.ts (2 tests)
 ✓ tests/components/smart-route-deposit-stub.test.ts (1 test)
```

### Foundry

```text
Ran 4 test suites: 60 tests passed, 0 failed (60 total)
```

---

## 修改檔案清單

| 檔案 | 動作 |
|------|------|
| `src/components/hud/v0/ZeroDevSmartRouteDepositStub.tsx` | **新增** |
| `src/components/hud/smart-route-deposit-flow.ts` | **新增** |
| `src/components/hud/v0/ZeroDeltaVault.tsx` | **修改** — 掛載 stub |
| `src/adapters/arbitrum/zerodev-aa/zerodev-aa-gateway-badge.ts` | **新增** — bundle diet |
| `src/routes/grant-audit-lib/grant-audit-zerodev-aa.ts` | **修改** — lean import |
| `src/routes/grant-audit-lib/grant-audit-swr-fallback.ts` | **修改** |
| `src/routes/grant-audit-lib/grant-audit.types.ts` | **修改** |
| `src/services/aa-adapter/risk-oracle-gate.ts` | **修改** |
| `src/config/gmx-revenue.ts` | **修改** — 內聯 referral bytes32 |
| `wrangler.toml` | **修改** — 移除 nodejs_compat |
| `scripts/measure-worker-bundle.ts` | **修改** — bundle guard |
| `tests/components/smart-route-deposit-*.test.ts` | **新增** |

**Phase C 程式碼增量：** ~165 行（< 200 行限制 ✅）

---

## 三階段總結（A/B/C）

| Phase | 交付 | 狀態 |
|-------|------|------|
| A | GMX registry + ZeroDev config SSOT | ✅ |
| B | payloadHash binding helper | ✅ |
| C | UI stub + bundle ≤ 158.99 KiB | ✅ |
