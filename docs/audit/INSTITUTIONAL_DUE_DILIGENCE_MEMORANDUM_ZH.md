# 機構盡職調查與風險合規備忘錄 (DDIP)

| 欄位 | 內容 |
|------|------|
| **文檔名稱** | Institutional Due Diligence & Risk Compliance Memorandum (DDIP) |
| **版本** | **v1.0.0** |
| **分類** | 公開 Grant / 機構配置者盡職調查 |
| **實體** | SilverVine Labs |
| **協議** | SliverVine / BeΔ Living Water (BDLW) · Santenmoku 風控引擎 |
| **受眾** | Arbitrum Foundation · ZeroDev Grant 委員會 · 機構配置者 · Fund-of-Funds 盡職 |
| **基線** | Vitest **168 檔 \| 742 PASS (100% Clean)** · Wasm 熱路徑 **87.76 KiB gzip** · Shield **p50 ~106 µs** |
| **即時驗證** | [`GET /api/grant-audit`](https://bedeltawater.slivervine.xyz/api/grant-audit) |
| **規格 SSOT** | [`../architecture/TECHNICAL_SPECIFICATION.md`](../architecture/TECHNICAL_SPECIFICATION.md) |
| **風控框架 SSOT** | [`../architecture/CROSS_CHAIN_RISK_AND_EVOLUTION.md`](../architecture/CROSS_CHAIN_RISK_AND_EVOLUTION.md) |
| **英文 SSOT** | [`INSTITUTIONAL_DUE_DILIGENCE_MEMORANDUM.md`](./INSTITUTIONAL_DUE_DILIGENCE_MEMORANDUM.md) |

---

## 核心目標 (Core Objective)

本備忘錄為 **Arbitrum Foundation、ZeroDev 及機構配置者** 評估 BDLW Delta-Neutral Vault 基礎設施時，提供**透明、程式碼可驗證的審計軌跡**。每一項量化宣稱均可對應至**可重現的命令、測試檔或鏈上產物**——而非敘述性保證。

> **免責聲明：** DDIP 為架構盡職調查產物，**不構成**法律意見、投資建議或監管認證聲明（含 SOC 2 Type II 鑑證）。

---

## 一、執行摘要 (Executive Summary)

BeΔ Living Water (BDLW) 為包裹 Arbitrum One 上 GMX v2 GM Pool 與 Hyperliquid 1× Short 對沖腿的**預執行 Citadel 風控層**。資金可經 **Arbitrum 原生 USDC**（即時路徑）或 **Robinhood Chain USDG 護航**（Across 單向橋接 + 誠實在途會計）入場。

### 1.1 盡職判定矩陣

| 支柱 | 姿態 | 主要證據 |
|------|------|---------|
| **預執行盾牌** | 廣播前 Fail-Closed | `checkSoilResistance()` · `pkg/soil_core.wasm` · R01–R20 矩陣 |
| **資金會計** | 待結算橋接流動性 `lostUsd ≡ 0` | `robinhood-across-bridge.ts` · Vitest 5/5 |
| **Session / AA 安全** | 範圍金鑰 · 名義上限 · Gas 帳本 | ZeroDev AA 閘門 · `session-key-gates.ts` |
| **壓力與模擬** | 30D Survival Benchmark + 742 測試回歸 | `generate-survival-report.ts` · `pnpm test -- --run` |
| **合規隔離** | Robinhood 單向出站 · AML 入站阻擋 | `RobinhoodSafetySwitch.sol` · 防火牆柱審計 |

### 1.2 鎖定 SSOT 指標（評委可直接複製）

| 指標 | 鎖定值 | 驗證方式 |
|------|--------|---------|
| **Vitest 回歸** | **168 檔 \| 742 PASS** | `pnpm test -- --run` |
| **橋接不變量** | **5/5 PASS** | `pnpm exec vitest run tests/adapters/robinhood-across-bridge.test.ts` |
| **ZeroDev AA 閘門** | **4/4 PASS** | `pnpm exec vitest run tests/adapters/zerodev-aa-gate.test.ts` |
| **混沌矩陣** | **255/255 阻擋 · `capitalLossUsd: 0`** | [`chaos-blackswan-metrics.json`](./chaos-blackswan-metrics.json) |
| **安全矩陣** | **三層級 5/0/0 PASS** | `pnpm audit:security` |
| **V1.0 容量錨點** | **$100,000** Alpha Vault / 設計名義 | `MIN_DEPTH_USD` · `ORDER_SIZE_MAX_USD` |

### 1.3 深度盡職文檔地圖

| 主題 | DDIP 章節 | 延伸 SSOT |
|------|----------|----------|
| 60 重架構不變量 | §五（監管對齊） | [`CROSS_CHAIN_RISK_AND_EVOLUTION.md`](../architecture/CROSS_CHAIN_RISK_AND_EVOLUTION.md) §三 |
| Robinhood 三柱架構 | §2.3 | [`ROBINHOOD_CHAIN_SAFETY_GATE_AUDIT.md`](./ROBINHOOD_CHAIN_SAFETY_GATE_AUDIT.md) |
| Principal 安全質詢 | §二 | [`PRINCIPAL_AUDIT_REPORT.md`](./PRINCIPAL_AUDIT_REPORT.md) |
| Yellow Paper / R01–R20 | §2.2 | [`TECHNICAL_SPECIFICATION.md`](../architecture/TECHNICAL_SPECIFICATION.md) |

---

## 二、基礎設施安全 (Infrastructure Security — SOC 2 對齊與不可變性)

> **術語說明：** 「SOC 2 對齊」指控制目標與 AICPA Trust Services Criteria（安全、可用性、處理完整性）的**映射**——**非** SOC 2 Type II 鑑證報告。

### 2.1 Trust Services Criteria 映射

| TSC 域 | BDLW 控制 | 程式 / 產物錨點 |
|--------|----------|----------------|
| **CC6 — 邏輯存取** | 範圍 Session Keys（僅 `ORDER_EXECUTE`）· 30s TTL · R07 $5k 上限 | `hl-session/permissions.ts` · `session-key-gates.ts` |
| **CC7 — 系統營運** | Sequencer 守衛（600s 寬限）· Oracle 延遲熔斷 · PGATE 200ms | `sequencer-guard.ts` · `PGATE_MAX_LATENCY_MS` |
| **CC8 — 變更管理** | 不可變 Wasm 產物 · 釘選 Worker bundle · BUSL-1.1 | `pkg/soil_core.wasm` · `pnpm bundle:measure` |
| **CC9 — 風險緩解** | R17 日損斷簽 · R20 物理死鎖 · rootProtection | `circuit-breaker.ts` · `flatten-hardlock.ts` |
| **A1 — 可用性** | Arbitrum AA failover · RPC radar · 軟確認守衛 | `zerodev-aa-failover.ts` · `rpc-radar.ts` |
| **PI1 — 處理完整性** | EIP-712 域綁定 · GMX payload hash · Gate 單次消耗 | `SliverVineGate.sol` · `gated-executor-payload.ts` |

### 2.2 不可變性與篡改證據

| 層級 | 不可變屬性 | 驗證 |
|------|-----------|------|
| **Wasm Soil Core** | `#![no_std]` Rust · `<28kb` 預算 · 熱路徑無執行期注入 | `pnpm build:wasm` |
| **L1 認證閘門** | `SliverVineGate.sol` `verifyAndConsume()` — 單次 digest | Forge · Slither / Aderyn |
| **負向證明** | 深度不足時 Soil 必熔斷 — 無法靜默放寬 fuse | `pnpm verify:negative` |
| **5-TX 錨點** | HL testnet SHA-256 驗證執行 hash | `pnpm verify:5tx` |
| **遙測完整性** | 96h 滾動 daemon · grant-audit 永不捏造 loss | `pnpm telemetry:96h` |

### 2.3 三柱架構（評委心智模型）

```text
[ 配置者資金 ]
       │
       ▼
┌─────────────────────────────────────┐
│ 柱一：GATEHOUSE（認證）              │  ZeroDev Kernel v3 · EIP-712 · Session Keys
└──────────────────┬──────────────────┘
                   ▼
┌─────────────────────────────────────┐
│ 柱二：FIREWALL（合規）                │  Robinhood 單向出站 · AML 入站阻擋
└──────────────────┬──────────────────┘
                   ▼
┌─────────────────────────────────────┐
│ 柱三：SHIELD（預執行）                │  checkSoilResistance() · Wasm · R01–R20
└─────────────────────────────────────┘
```

**評委命令包：**

```bash
pnpm test -- --run
pnpm audit:security
pnpm exec vitest run tests/adapters/robinhood-across-bridge.test.ts
pnpm exec vitest run tests/adapters/zerodev-aa-gate.test.ts
```

---

## 三、資金會計不變量 (Capital Accounting Invariants)

BDLW 將**誠實會計**作為硬不變量——在途流動性永不誤記為本金損失。

### 3.1 零損失橋接不變量 (`lostUsd ≡ 0`)

| `capitalLabel` | 經濟含義 | 可部署 NAV | `lostUsd` |
|----------------|---------|-----------|-----------|
| `AVAILABLE` | 橋接前 Robinhood USDG | 否 | **0** |
| `IN_FLIGHT_BRIDGE_CAPITAL` | Across 在途 | **否 — 禁止裸腿** | **0** |
| `SETTLED` | Arb One 可用 USDC | 是 | **0** |
| `BRIDGE_TIMEOUT_FAIL_CLOSED` | >1h 逾時 Fail-Closed | 否 | **0** |
| `AML_INBOUND_TO_ROBINHOOD_BLOCKED` | 反向路徑阻擋 | 否 | **0** |

**SSOT：** `evaluateAcrossBridgeTransfer()` · [`robinhood-across-bridge.ts`](../../src/adapters/robinhood/robinhood-across-bridge.ts)

### 3.2 動態風險預算 (R11)

| 公式 | @$100k 權益 | SSOT |
|------|------------|------|
| **Dynamic Max SL** | `Balance × 1% + $100` → **$1,100** | `effective-max-sl.ts` |
| **日損上限 (R17)** | Max SL × 3 → **$3,300** | `DAILY_LOSS_CAP_MULTIPLIER` |
| **跨場所滑點 fuse** | **0.5%** | `MAX_SLIPPAGE` |
| **Order-Aware @$100k 名義** | min($1,100, $500) → **$500** | `computeOrderAwareMaxSlUsd()` |

已廢止固定 **$50 SL** 於協議規則與 R11 測試中**嚴禁**。

### 3.3 非託管語義

- 用戶本金存放於 **ZeroDev Kernel Smart Account** — 非協議國庫。
- GMX `uiFeeReceiver`（+5 bps）為協議收益 — 不與用戶本金混淆。
- 在途橋接資金僅**標記、不借出** — 程式路徑無再質押宣稱。

### 3.4 容量與入場模式摘要

| 模式 | 時序 | V1.0 TVL 上限 | 單筆（v1.0 設計） |
|------|------|--------------|-----------------|
| **Arbitrum 原生** | 即時 Soil 閘門 | **$100,000** | **$100,000** |
| **Robinhood 護航** | ≤1h 橋接 + 結算窗口 | **$100,000** | 僅 `SETTLED` 後 |

詳見 [`CROSS_CHAIN_RISK_AND_EVOLUTION.md` §五](../architecture/CROSS_CHAIN_RISK_AND_EVOLUTION.md)。

---

## 四、壓力測試 (Stress Testing)

模擬產物為**一級盡職交付物** — 可離線重現或對唯讀 live 市場資料執行。

### 4.1 回歸基線（持續）

| 框架 | 命令 | 預期 |
|------|------|------|
| **全量 Vitest** | `pnpm test -- --run` | **168 檔 \| 742 PASS** |
| **Grant v0.9 切片** | `pnpm test:grant-v09-sim` | AA / 風控 sim PASS |
| **Wasm 可行性** | `pnpm test:wasm-feasibility` | Soil Wasm sim PASS |
| **ZeroDev dry-run** | `pnpm test:zerodev` | Mock Bundler PASS |

### 4.2 Survival Benchmark（機構 30D 報告）

| 參數 | 數值 |
|------|------|
| 標準名義 | **$100,000** |
| 壓力名義 | **$1,000,000** |
| 回溯 | **30 天** |
| 產物 | `docs/0801_BeDelta_Survival_Benchmark.md` |

```bash
pnpm tsx scripts/generate-survival-report.ts
```

### 4.3 對抗與負向證明

| 情境類別 | 框架 | 通過標準 |
|---------|------|---------|
| **深度不足** | `pnpm verify:negative` | Soil 熔斷 |
| **黑天鵝矩陣** | `chaos-blackswan-metrics.json` | 255/255 · `capitalLossUsd: 0` |
| **橋接逾時** | `robinhood-across-bridge.test.ts` | Fail-Closed · `lostUsd: 0` |
| **Soil 滑點** | `zerodev-aa-gate.test.ts` | UserOp 前 `TRIP_SOIL_RESISTANCE` |
| **HL 恐慌沙盒** | `dry-run-sandbox.ts` | 記憶體內 · 無 live 廣播 |

### 4.4 屬性 Fuzz 與靜態分析

| 層級 | 工具 | 產物 |
|------|------|------|
| **Forge property fuzz** | 327,675 次（nightly deep） | `SliverVineGate/` |
| **Slither / Aderyn** | Solidity 靜態分析 | `pnpm audit:slither` |
| **Gitleaks / Solhint** | 密鑰掃描 · Lint | `pnpm audit:fast` |

---

## 五、監管對齊 (Regulatory Alignment)

> **免責聲明：** 本節將 BDLW 控制映射至**機構對話常用框架** — **非**監管登記、銀行牌照或正式 Basel 支柱合規聲明。

### 5.1 Basel III 營運風險（架構呼應）

| Basel 概念 | BDLW 實作 | 證據 |
|-----------|----------|------|
| **內部控制環境** | 單向 `SystemState` · R09 兩階段 Saga | `intent-ledger.ts` |
| **風險識別與評估** | 預交易 Soil 矩陣 | R01 · `soil-resistance.ts` |
| **控制活動** | Session 範圍 · 名義上限 · Paymaster 帳本 | R06 · R07 |
| **監控與報告** | Grant audit API · 96h 遙測 | `/api/grant-audit` |
| **損失限額框架** | R17 日損 · Dynamic Max SL | `effective-max-sl.ts` |

### 5.2 AML / Travel Rule 鄰接控制（DeFi 語境）

| 控制 | 姿態 | SSOT |
|------|------|------|
| **單向護航** | Robinhood → Arbitrum（`46630`/`4663` → `42161`） | `validateAcrossBridgeDirection()` |
| **入站隔離** | `AML_INBOUND_TO_ROBINHOOD_BLOCKED` | 防火牆柱 |
| **鏈上安全開關** | `RobinhoodSafetySwitch.sol` | Robinhood 審計報告 |

### 5.3 三道防線

| 防線 | 職能 | BDLW 層級 |
|------|------|----------|
| **第一道** | 業務營運 | 收益門檻 · 緩衝引擎 · 再平衡規則 |
| **第二道** | 風控合規 | Soil · PGATE · Sequencer/Oracle · 橋接 AML |
| **第三道** | 獨立保證 | 742 PASS · Survival Benchmark · 安全矩陣 · DDIP |

### 5.4 配置者 FAQ（盡職熱點）

| 問題 | 答案 | 驗證 |
|------|------|------|
| 橋接延遲會否造成裸 Delta？ | **否** — 在途資金不可部署；逾時 Fail-Closed | 橋接測試 5/5 |
| Session Key 能否提現？ | **否** — 僅 `ORDER_EXECUTE` | `session-key-gates.ts` |
| 是否已 SOC 2 認證？ | **未宣稱** — 僅 TSC 映射 | §2.1 |
| 上線最大 Vault 規模？ | **$100,000** V1.0 Alpha Cap | Tech Spec §3.6 |
| Live loss 何處報告？ | `/api/grant-audit` · 正常運營 `lostUsd: 0` | Live 端點 |

---

## 六、驗證清單（機構簽核）

| # | 檢查項 | 命令 / 介面 | 通過標準 |
|---|--------|------------|---------|
| 1 | 全量回歸 | `pnpm test -- --run` | 168 \| 742 PASS |
| 2 | 橋接會計 | `robinhood-across-bridge.test.ts` | 5/5 |
| 3 | ZeroDev 閘門 | `zerodev-aa-gate.test.ts` | 4/4 |
| 4 | 安全矩陣 | `pnpm audit:security` | 5/0/0 |
| 5 | 即時審計 | `GET /api/grant-audit` | `lostUsd: 0` |
| 6 | Survival 報告 | `generate-survival-report.ts` | 產物生成 |
| 7 | 負向證明 | `pnpm verify:negative` | Soil 熔斷確認 |

---

## 關聯文檔

| 文檔 | 用途 |
|------|------|
| [`INSTITUTIONAL_DUE_DILIGENCE_MEMORANDUM.md`](./INSTITUTIONAL_DUE_DILIGENCE_MEMORANDUM.md) | 英文官方 SSOT |
| [`TECHNICAL_SPECIFICATION.md`](../architecture/TECHNICAL_SPECIFICATION.md) | Yellow Paper |
| [`CROSS_CHAIN_RISK_AND_EVOLUTION.md`](../architecture/CROSS_CHAIN_RISK_AND_EVOLUTION.md) | 60 不變量 · 壓力框架 |
| [`PRINCIPAL_AUDIT_REPORT.md`](./PRINCIPAL_AUDIT_REPORT.md) | 四項診斷質詢 |
| [`ROBINHOOD_CHAIN_SAFETY_GATE_AUDIT.md`](./ROBINHOOD_CHAIN_SAFETY_GATE_AUDIT.md) | 三柱 · 橋接閘門 |

---

**編製：** SilverVine Labs 風控與合規文檔組  
**最後更新：** 2026-08-26 · 分支基線：`v1.0_push_BDLW`
