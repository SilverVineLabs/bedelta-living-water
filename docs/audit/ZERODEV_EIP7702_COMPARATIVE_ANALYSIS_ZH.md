# ZeroDev EIP-7702 vs. BDLW 機構級預執行風控底層 — 對照分析

| 欄位 | 值 |
|------|-----|
| **文檔** | ZeroDev EIP-7702 對照分析 |
| **版本** | **v1.0.0** |
| **分類** | Grant / 機構 Allocator · AA 架構基準 |
| **分支基線** | `v1.0_push_BDLW` |
| **實體** | SilverVine Labs · BeΔ Living Water (BDLW) |
| **基線** | Vitest **168 檔 \| 742 PASS (100% Clean)** · Wasm **87.76 KiB gzip** · Shield **p50 ~106 µs** |
| **英文 SSOT** | [`ZERODEV_EIP7702_COMPARATIVE_ANALYSIS.md`](./ZERODEV_EIP7702_COMPARATIVE_ANALYSIS.md) |
| **關聯 SSOT** | [`INSTITUTIONAL_DUE_DILIGENCE_MEMORANDUM.md`](./INSTITUTIONAL_DUE_DILIGENCE_MEMORANDUM.md) · [`TECHNICAL_SPECIFICATION.md`](../architecture/TECHNICAL_SPECIFICATION.md) §2.4 |

> **範圍說明：** 本文對照 **面向消費者的 EIP-7702 AA 實作** 與 BDLW **機構級預執行風控底層**。屬架構盡職 artifact — 非法律或投資建議。

---

## 一、執行摘要

EIP-7702 與 ERC-7579 使 EOA 可委派至智能帳戶邏輯 — 解鎖 **一鍵意圖編排**、**Gas 代付** 與 **Session 權限範圍**。消費者 AA 堆疊優化 **轉化與留存**：長效 Session Key、寬泛合約 scope、事後政策檢查。

BeDelta Living Water (BDLW) 生產環境採 **ZeroDev Kernel v3**（**Kernel v4 + EIP-7702** 意圖編排器為 **⏳ V1.5 路線圖**），但 **不以 UX 取代風控治理**。無摩擦 onboarding 仍綁定 **三柱（Three Pillars）** 堆疊：

```text
Pillar 1 GATEHOUSE   → ZeroDev Kernel · 範圍 Session Keys · Paymaster 上限
Pillar 2 FIREWALL    → Robinhood 單向護航 · AML 入站阻擋 · payloadHash 綁定
Pillar 3 SHIELD      → checkSoilResistance() · pkg/soil_core.wasm · Fail-Closed 預廣播
```

**機構差異化：** 每筆 UserOp 必須通過 **p50 ~106 µs Wasm soil 熔斷**、**30 秒自毀 Session Key**、**誠實橋接會計（`lostUsd ≡ 0`）** — 才允許 GMX / Hyperliquid 廣播。

---

## 二、產業背景 — 消費者 EIP-7702 AA

| 消費者 AA 設計目標 | 典型實作 | 殘餘風險 |
|-------------------|---------|---------|
| **低註冊摩擦** | EIP-7702 委派 · 社交登入 · 首筆代付 | 用戶可能不理解委派權限範圍 |
| **持久 Session** | Session Key **數小時至數天** | 被盜 Session 爆炸半徑大 |
| **寬泛意圖 scope** | 通用 contract call 權限 | 難以排除提現 / approve 路徑 |
| **廣播後政策** | 後端模擬 · 限流 · 人工審核 | Bundler 與 venue 結算間 **Fail-Open** 窗口 |
| **橋接 UX 簡化** | 在途資金顯示為「可用」 | 未結算 escort 期間裸 Delta 風險 |

此模式適用 **零售轉化漏斗**，對機構 Delta-Neutral Vault（需 **預執行 severance** 與 **誠實在途資產標記**）**不足**。

---

## 三、對照矩陣 — 消費者 AA vs. BDLW Citadel

| 架構維度 | 消費者 EIP-7702 AA（業界基準） | BDLW 機構底層（程式驗證） |
|---------|------------------------------|-------------------------|
| **首要目標** | UX · onboarding · 交易量 | **Fail-Closed 風控** · 誠實會計 · 有界尾部損失 |
| **帳戶 runtime** | EIP-7702 委派 / ERC-4337 智能帳戶 | ZeroDev **Kernel v3**（✅ 生產）→ **Kernel v4 + EIP-7702**（⏳ 路線圖） |
| **Session TTL** | 數小時 / 數天 | **`WS_HEARTBEAT_INTERVAL_MS = 30_000`** · 過期 → `SESSION_KEY_HEARTBEAT_EXPIRED` |
| **執行 scope** | 寬泛合約互動 | **僅 `ORDER_EXECUTE`** — 零提現權（R06） |
| **名目上限** | 常無 cap 或錢包級 | **`SESSION_KEY_NOTIONAL_CAP_USD = $5,000`**（v0.9）· R07 物理 severance |
| **風控閘門位置** | 事後模擬 / 後端政策 | **廣播前 Edge SSOT** — `checkSoilResistance()` **p50 ~106 µs** |
| **閘門哲學** | 優先執行 + 監控 | **Fail-Closed** — `signingChannelOpen: false` |
| **Paymaster 耗盡** | 回退用戶自付（未護航路徑風險） | **`ZERODEV_DAILY_SPONSORSHIP_EXHAUSTED`** → soil 通過後 fail-closed 自付 |
| **意圖綁定** | 可選 calldata hash | **`payloadHash()`** → `SliverVineGate.sol` 單次消耗 |
| **橋接在途** | 常計為 live NAV | **`IN_FLIGHT_BRIDGE_CAPITAL`** · **`lostUsd ≡ 0`** · `SETTLED` 前禁止裸倉 |
| **緊急響應** | Admin pause · 多簽 | **自動化** R17 · R20 · `rootProtection()` |
| **回歸證明** | 廠商 QA / 審計快照 | **758 PASS** (172 檔 Live) · 鎖定基線 **742 PASS** · `zerodev-aa-gate` **4/4** · chaos **255/255** |

---

## 四、三大機構錨點深度解析

### 4.1 三十秒 TTL Session Keys（Gatehouse）

| 控制 | 值 / 行為 | SSOT |
|------|----------|------|
| **HL WS 心跳** | **30s** | `WS_HEARTBEAT_INTERVAL_MS` |
| **心跳過期** | `SESSION_KEY_HEARTBEAT_EXPIRED` · 通道鎖定 | `nonce-auto-healing.ts` |
| **2PC intent TTL** | **`DEFAULT_TTL_MS = 30_000`** | `intent-ledger/defaults.ts` |
| **Scope** | **`ORDER_EXECUTE` only** | `hl-session/permissions.ts` |
| **名目 fuse** | **$5,000** | `session-key-gates.ts` |

> **機構 rationale：** 被盜 Session 最多 **~30 秒**、**$5k 名目** 爆炸半徑 — 非數小時委派錢包。

### 4.2 106 µs Wasm Soil Gate（Shield）

| 指標 | 鎖定值 | SSOT |
|------|--------|------|
| **Shield p50** | **~106 µs** | `checkSoilResistance()` · `soil_core.wasm` |
| **Worker bundle** | **87.76 KiB gzip** | `pnpm bundle:measure` |
| **滑點 fuse** | **0.5%** | `MAX_SLIPPAGE` |
| **深度下限** | **$100,000** | soil matrix |

> **EIP-7702 路線圖對齊：** Kernel v4 增加 UX 表面 — **106 µs Shield 不移位**。Edge 仍為 SSOT。

### 4.3 誠實會計 — `lostUsd ≡ 0`

| `capitalLabel` | 可部署？ | `lostUsd` |
|----------------|---------|-----------|
| `IN_FLIGHT_BRIDGE_CAPITAL` | **否** | **0** |
| `BRIDGE_TIMEOUT_FAIL_CLOSED` | **否** | **0** |
| `SETTLED` / Arbitrum 原生 | 是 | **0** |

**測試錨點：** `across-ingress-bridge.test.ts` · **5/5 PASS**

---

## 五、執行管線對照

### 消費者 EIP-7702（典型）

```text
EOA → EIP-7702 delegate → UserOp → bundler → venue
                         ↑ 事後 / 軟性政策檢查
```

### BDLW 機構堆疊（V1.0）

```text
Kernel Smart Account → payloadHash 綁定 → checkSoilResistance() (106µs)
    ├─ TRIP  → signingChannelOpen: false
    └─ ALLOW → SliverVineGate → GMX / HL 廣播
```

---

## 六、驗證清單

| # | 宣稱 | 命令 | 預期 |
|---|------|------|------|
| 1 | 全量回歸 | `pnpm test -- --run` | **172 檔 \| 758 PASS** *(鎖定：168 \| 742)* |
| 2 | ZeroDev AA gate | `vitest run tests/adapters/zerodev-aa-gate.test.ts` | **4/4** |
| 3 | R07 $5k cap | `vitest run tests/services/session-key-gates.test.ts` | 超限 severance |
| 4 | 30s 心跳 | `vitest run tests/services/nonce-auto-healing.test.ts` | 過期鎖定 |
| 5 | 橋接會計 | `vitest run tests/adapters/across-ingress-bridge.test.ts` | **5/5** |

---

## 七、審計 / Allocator 答辯敘事

> 消費者 AA 優化 **「好點擊」**；BDLW 優化 **「廣播前數學安全」**。
>
> 我們採 ZeroDev Kernel 與 EIP-7702 意圖編排實現非託管 onboarding — 但每筆 UserOp 必過 **106 µs Wasm 熔斷**、**30 秒自毀 Session Key**、**誠實橋接標記（`lostUsd ≡ 0`）**。3σ 衝擊下 AA 管線 **Fail-Closed** — 而非開裸倉或將在途資金誤計為可部署 NAV。

---

## 關聯文檔

| 文檔 | 用途 |
|------|------|
| [`INSTITUTIONAL_DUE_DILIGENCE_MEMORANDUM.md`](./INSTITUTIONAL_DUE_DILIGENCE_MEMORANDUM.md) | 完整 DDIP · Risk & Disclaimer |
| [`TECHNICAL_SPECIFICATION.md`](../architecture/TECHNICAL_SPECIFICATION.md) §2.4 | ZeroDev · 106 µs 耦合 |
| [`../internal/ZERODEV_SMART_ROUTING_DEEP_DIVE_ZH.md`](../internal/ZERODEV_SMART_ROUTING_DEEP_DIVE_ZH.md) | Smart Routing 深度解析 |
| [`CROSS_CHAIN_RISK_AND_EVOLUTION.md`](../architecture/CROSS_CHAIN_RISK_AND_EVOLUTION.md) | 60 不變量 · 真實收益 |

---

**編制：** SilverVine Labs · 風控與合規文檔  
**最後更新：** 2026-08-27 · 分支：`v1.0_push_BDLW`
