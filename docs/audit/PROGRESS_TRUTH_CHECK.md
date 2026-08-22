# SliverVine Citadel — 進度真實性核對報告 (PROGRESS_TRUTH_CHECK)

| 欄位 | 值 |
|------|-----|
| **版本** | v1.0.0-truth-check |
| **日期** | 2026-08-22 |
| **原則** | Non-Inflatable SSOT — 僅陳述可 CLI / 程式 / 測試驗證之事實 |
| **實體** | SilverVine Labs |

---

## 一、驗證基線 (Verification Baseline)

| 項目 | 結果 | 重現指令 |
|------|------|----------|
| **Vitest** | **732 PASS / 137 test files** | `pnpm test` |
| **Typecheck** | **0 errors** | `pnpm typecheck` / `pnpm audit:fast` |
| **audit:fast** | **PASS 4/0/0** (tsc · vitest-security · solhint · gitleaks) | `pnpm audit:fast` |
| **risk-control.ts coverage** | **100%** (lines/branches/functions) | `pnpm test` coverage gate |
| **Foundry Gate** | **60 passed** | `cd SliverVineGate && forge test` |
| **Chaos Matrix** | **255/255 fail-closed** | `docs/audit/chaos-blackswan-metrics.json` |

> README 徽章基線 **725+ PASS**；目前 SSOT：**732 PASS (137 files)**（含 `margin-buffer` · `gmx-v2-order-payload-lib` 拆分 · Robinhood audit snapshot 匯出測試）。

---

## 二、已交付生產範圍 (v0.9 Delivered Scope)

### 2.1 核心閘道 (Edge Worker)

| 模組 | 路徑 | 狀態 |
|------|------|------|
| Soil 熔斷 | `src/services/risk-control-lib/soil-resistance.ts` | ✅ 已交付 |
| Sequencer Guard | `src/services/risk/sequencer-guard.ts` | ✅ 已交付 |
| Oracle Lag Shield | `src/services/risk/arbitrum-gas-guard.ts` | ✅ 已交付 |
| Grant Audit API | `src/routes/grant-audit.ts` | ✅ 已交付 |
| Dynamic Max SL | `src/services/effective-max-sl.ts` | ✅ 已交付 |
| Emergency Margin Buffer (5%) | `src/services/risk/liquidation-meter.ts` · `DEFAULT_CROSS_MMR=0.05` | ✅ 已交付 · **`tests/risk-control/margin-buffer.test.ts`**（5 tests） |

**5% Emergency Margin Buffer — 測試 SSOT（2026-08-22）：**

| 斷言 | 測試 |
|------|------|
| `DEFAULT_CROSS_MMR === 0.05` | `margin-buffer.test.ts` · SSOT 常數 |
| 預設 MMR 用於 `estimateCrossMarginShortLiqPx()` | 省略參數 ≡ 顯式 `0.05` |
| `equity/notional ≤ 5%` → `liqPx === mark` | fail-closed headroom 耗盡 |
| `needsSoilRebalance: true` | `measureLiquidationDistance` 觸發 rebalance |
| 健康路徑 distance ≈ 55% | buffer > 5% 時不觸發 rebalance |

### 2.2 GMX v2 / ETH GM

| 能力 | 路徑 | 狀態 |
|------|------|------|
| DataStore 讀路徑 | `src/services/adapters/gmx-v2-*` | ✅ 已交付 |
| Balancer / 價格衝擊 | `src/services/yield/gmx-v2-balancer.ts` | ✅ 已交付 |
| Unsigned payload | `src/services/adapters/gmx-v2-order-payload.ts` | ✅ 已交付 |
| Builder +5 bps | `GMX_UI_FEE_RECEIVER` | ✅ 已配置 |
| 主線池 | ETH GM（symbol: ETH） | ✅ v0.9 範圍內 |

### 2.3 Hyperliquid Session Key & 5TX Provenance

| 能力 | 路徑 | 狀態 |
|------|------|------|
| HL 適配器 | `src/adapters/hl/**` | ✅ 已交付 |
| Nonce 自癒 | `src/services/session-key-adapter-lib/nonce-auto-healing.ts` | ✅ 已交付 |
| 5TX Runner | `src/data/verify-5tx-runner-lib/` | ✅ 已交付 |
| 5TX Fixture | `src/data/verified_5tx_results.json` | ✅ dryRun fixture |
| Provenance 測試 | `tests/services/hl-5-trade-provenance.test.ts` | ✅ CI-safe（`HL_LIVE=0` 預設） |
| Mainnet 證明 | OID `513344575969` | ✅ `provenance_verified_trades.json` |

### 2.4 ZeroDev AA（Scaffold）

| 能力 | 路徑 | 狀態 |
|------|------|------|
| Kernel v3 適配器 | `src/adapters/arbitrum/zerodev-aa/**` | ✅ Scaffold 完整 |
| Risk Oracle Gate | `src/services/aa-adapter/risk-oracle-gate.ts` | ✅ 已交付 |
| 主網端到端 UserOp | — | ⚠️ **未證明**（`USE_ZERODEV_AA` 預設關閉） |

### 2.5 On-Chain Gate & SDK

| 能力 | 路徑 | 狀態 |
|------|------|------|
| SliverVineGate | `SliverVineGate/src/SliverVineGate.sol` | ✅ M1/M2 已密封 |
| Forge 測試 | 60 pass · 327k property fuzz | ✅ |
| Citadel SDK | `src/sdk/` (Apache-2.0) | ✅ 已交付 |
| Robinhood Audit Snapshot | `src/sdk/robinhood-audit-snapshot.ts` · `exportRobinhoodAuditSnapshot()` | ✅ 已交付 |
| Robinhood Audit API | `GET /api/robinhood-audit-snapshot` | ✅ 已交付 |
| Wasm 核心 | `pkg/soil_core.wasm` | ✅ 已提交 |

### 2.6 Robinhood Chain

| 網路 | Chain ID | 程式事實 |
|------|----------|----------|
| Testnet | **46630** | ✅ `r-chain-yield-stub.ts` — **ACTIVE / TESTED** |
| Mainnet | **4663** | ⚠️ **DEPLOYMENT READY** — stub only（`bridgeDeployed: false`） |
| Audit Snapshot Export | `exportRobinhoodAuditSnapshot()` | ✅ 46630/4663 · `inboundBlocked: true` · `lostUsd ≡ 0` · cut-off timestamp |

---

## 三、遞延 / V1.0 – V1.5 Roadmap

| 項目 | 分類 | 說明 |
|------|------|------|
| BTC/USDC GM 池 | V1.0 | README 明列；程式未硬編碼 |
| USDG Robinhood Chain Treasury | V1.0 | 配置驅動；未 live |
| Aave v3 即時鏈上 APY | V1.5 | 僅 `DEFAULT_AAVE_BASE_APY` 靜態 fallback |
| Compound 協議整合 | **未實作** | 無 lending pool 呼叫 |
| 10% Excess Yield Performance Fee | V1.5 | TECH_SPEC 已標 Roadmap |
| TWAPEngineV2 實際 slice | V1.5 stub | `executeSlice` → `STUB` |
| `HL_NONCE_AUTO_RESYNC` 等具名常數 | 文檔標籤 | 實作在 `nonce-auto-healing.ts`，無同名 export |
| `NTP_CLOCK_DRIFT_COMPENSATOR` | 文檔標籤 | 近似為 `PGATE_MAX_LATENCY_MS=200`（編譯期常數） |
| `GMX_REDEMPTION_WINDOW` / `HL_WITHDRAWAL_SETTLEMENT_WINDOW` | 文檔常數 | 程式中無具名 export |
| 5% Emergency Margin Buffer | ~~文檔宣稱~~ **✅ 已驗證** | `liquidation-meter.ts` · `tests/risk-control/margin-buffer.test.ts`（5/5 PASS） |
| ArbOS Elara ingress | 設計 | 無 Elara 程式碼 |
| Shadow-DEX ZK Proof | Roadmap | 無實作 |
| Sepolia Gate 部署 (M3) | Milestone 待辦 | `MILESTONES.md` 標 ⬜ |

---

## 四、文檔與環境 SSOT 修復 (P0)

| 項目 | 修復狀態 |
|------|----------|
| `docs/sdk/CITADEL_SDK_BLUEPRINT.md` | ✅ 已建立 |
| `docs/GRANT_PROPOSAL.md` | ✅ 已建立 |
| README `724` → `725 PASS (135 files)` | ✅ 已同步 |
| Vitest SSOT `732 PASS (137 files)` | ✅ 2026-08-22 同步 |
| `docs/sdk/CITADEL_SDK_BLUEPRINT.md` — Audit & Telemetry | ✅ `exportRobinhoodAuditSnapshot()` 已文件化 |
| `tests/risk-control/margin-buffer.test.ts` | ✅ 5% MMR 斷言已建立 |
| `.env.example` — `HL_LIVE=0` | ✅ 已加入 |
| `.env.example` — `ZERODEV_PROJECT_ID` | ✅ placeholder |
| `.env.example` — `PGATE_MAX_LATENCY_MS` | ✅ 註解（編譯期常數，非 env） |
| `ARBITRUM_WSS_URL` 等 WSS | ✅ 已存在 |

**PGATE 真實 SSOT：** `src/config/constants.ts` → `PGATE_MAX_LATENCY_MS = 200`（非環境變數）。

---

## 五、測試檔案優化建議 (Keep vs. Remove)

### 5.1 核心必備（保留）

- **Risk：** `defense-matrix.test.ts`, `risk-control/soil.test.ts`, `risk-control/margin-buffer.test.ts`, `sequencer-guard.test.ts`, `core/risk-engine.test.ts`
- **GMX：** `adapters/gmx-v2-order-payload-lib/*`, `services/gmx-v2-balancer.test.ts`
- **HL / 5TX：** `services/hl-5-trade-provenance.test.ts`, `verify-5tx.test.ts`, `adapters/hl/*`
- **AA / v09：** `v09/*.test.ts`, `services/aa-adapter/*`, `adapters/zerodev-aa-gate.test.ts`
- **Wasm / SDK：** `services/wasm-feasibility*.test.ts`, `sdk/citadel-sdk.test.ts`
- **Grant API：** `api/grant-audit-*.test.ts`, `worker-fetch.test.ts`
- **Robinhood Audit：** `components/phase01-audit-certificate-export.test.ts`, `sdk/citadel-sdk.test.ts`

### 5.2 可審視合併（非立即刪除）

| 檔案 | 原因 |
|------|------|
| `hyperliquidAdapter.test.ts` | Legacy 適配器；與 `hl/*` 重疊 |
| `components/grant-audit-*.test.ts` (10+) | UI snapshot 測試；可合併 mega-spec |
| `copilot-care-messages.test.ts` | 純文案；優先級低 |
| `topology-shield-hud.test.ts` | v2 HUD 展示層 |

---

## 六、超過 250 行檔案（SRP 違規掃描）

**2026-08-22 P1 拆分已完成：**

| 原檔案 | 拆分結果 |
|--------|----------|
| `tests/adapters/gmx-v2-order-payload.test.ts` (359) | → `gmx-v2-order-payload-lib/gmx-v2-order-fees.test.ts` · `gmx-v2-order-guards.test.ts` |
| `src/data/verify-5tx-runner-lib/verify-5tx-runner-core.ts` (343) | → `runner-fixture-loader.ts` · `runner-soil-bypass.ts`（core 217 LOC） |
| `src/services/telemetry/ws-heartbeat-core.ts` (300) | → `ws-heartbeat-ping.ts` · `ws-heartbeat-failover.ts`（core 123 LOC） |

以下 **21 檔**仍 >250 行（精確行數待下次掃描）：

| 行數 | 檔案 |
|------|------|
| 299 | `src/services/cross-asset-rotation-lib/cross-asset-rotation-core.ts` |
| 295 | `src/types/matrix-lib/matrix-core.ts` |
| 292 | `src/core/intent-persistence/intent-persistence-core.ts` |
| 290 | `src/core/risk-engine.ts` |
| 287 | `tests/adapters/hl/auth.test.ts` |
| 275 | `src/v2/services/client-runtime-lib/client-runtime-core.ts` |
| 275 | `tests/adapters/hl/execution-sign.test.ts` |
| 270 | `tests/backend-finalization.test.ts` |
| 270 | `src/services/exchanges/safe-exchange-fetch.ts` |
| 269 | `src/services/soak-telemetry-lib/soak-telemetry-core.ts` |
| 268 | `src/services/execution/chase-engine.ts` |
| 264 | `src/v2/services/step2/scoring.ts` |
| 264 | `src/services/hyperliquid/depth-probe.ts` |
| 261 | `src/adapters/arbitrum/zerodev-aa/zerodev-aa-gate.ts` |
| 257 | `tests/risk-control/soil.test.ts` |
| 257 | `tests/defense/layout-metric-provider.test.ts` |
| 257 | `src/core/black-swan-guard-lib/black-swan-guard-core.ts` |
| 257 | `src/adapters/hl/wallet/agentRegister.ts` |
| 255 | `src/sdk/agent-intent.ts` |
| 254 | `src/v2/services/demo-simulator-service-lib/demo-simulator-service-core.ts` |
| 254 | `src/api/hud-telemetry-lib/hud-telemetry-log-helpers.ts` |

**優先拆分：** `risk-engine.ts`、`cross-asset-rotation-core.ts`、`agent-intent.ts`。

---

## 七、Triangle Liquidity Loop（程式對照）

```
Robinhood Chain (46630 stub / 4663 blocked inbound)
        ↕  Across stub + AA scaffold
Arbitrum One (GMX GM · Citadel gate)
        ↕  1× HL short hedge
Hyperliquid (session-key)
```

**Read API：** `GET /api/yield/triangle` — `src/services/yield-router-lib/`

---

## 八、審計結論

1. **v0.9 核心已交付：** Edge fail-closed 閘道、GMX v2 適配器、HL session-key、Gate 合約、SDK、Wasm、**732 測試全綠（137 files）**。
2. **5% Emergency Margin Buffer 已驗證：** `DEFAULT_CROSS_MMR === 0.05` · `margin-buffer.test.ts` 5/5 PASS · fail-closed rebalance 觸發已斷言。
3. **Robinhood Audit Export 已接線：** `exportRobinhoodAuditSnapshot()` · `GET /api/robinhood-audit-snapshot` · `lostUsd ≡ 0` · 46630/4663 cut-off cert。
4. **文檔膨脹風險已緩解：** TECH_SPEC 中部分常數為設計標籤；V1.5 / Elara / ZK 明確歸類 Roadmap。
5. **P0 SSOT 已修復：** 死鏈 blueprint、GRANT_PROPOSAL、README 725+、`.env.example` 註解。
6. **下一步（非 P0）：** M3 Sepolia 部署與 Milestone 表對齊；legacy `hyperliquidAdapter` 退役；剩餘 >250 行模組拆分。

---

*— End of PROGRESS_TRUTH_CHECK v1.0.0-truth-check —*
