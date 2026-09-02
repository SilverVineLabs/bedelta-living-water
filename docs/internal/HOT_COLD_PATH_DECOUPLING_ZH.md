# BeDelta Living Water — Hot/Cold Path 解耦架構

> **Vitest SSOT:** Proposal Baseline: 175 test files | 773 PASS (Current Branch Live: 176 test files | 775 PASS Clean)

> **分支：** `v1.0_push_BDLW`  
> **SSOT 入口：** `src/worker-entry.ts`（Core Gate）· `src/worker-cron-entry.ts`（Cron Hedge）  
> **部署：** `wrangler.toml` · `wrangler.cron.toml`  
> **Baseline：** Gzip **87.76 KiB** · p50 **~106 µs** `checkSoilResistance()` · Vitest 773 PASS (Proposal Baseline)

---

## 1. 架構總覽

BeDelta Living Water 在 Cloudflare Edge 上採用 **Hot/Cold Path 物理解耦**：將次毫秒級風險閘門（Hot Path）與重型簽章／對沖排程（Cold Path）拆成兩個獨立 Worker 執行體（V8 Isolate），透過共享 KV、Secrets 與 cron 觸發器協作，而非在同一 bundle 內混載。

```text
                    ┌─────────────────────────────────────────┐
  HTTP / WS         │  bedelta-living-water (Core Gate)       │
  ───────────────►  │  main: src/worker-entry.ts              │
                    │  wrangler.toml                          │
                    │                                         │
                    │  fetch  → handleWorkerFetch()           │
                    │         · API 路由 · Shield 熱路徑       │
                    │         · checkSoilResistance() ~106µs  │
                    │  scheduled → runScheduledJobs()         │
                    │         · soak telemetry · KV sync      │
                    │         · mainnet monitor · grant cache │
                    └──────────────────┬──────────────────────┘
                                       │  SLIVERVINE_KV · Secrets
                                       ▼
                    ┌─────────────────────────────────────────┐
  */5 cron          │  bedelta-living-water-cron (Cron Hedge) │
  ───────────────►  │  main: src/worker-cron-entry.ts         │
                    │  wrangler.cron.toml                     │
                    │                                         │
                    │  scheduled → runScheduledGmxHedgeCron() │
                    │         · viem EIP-712 · HL 簽章堆疊     │
                    │         · GMX↔HL ETH delta 對沖漂移閘門   │
                    └─────────────────────────────────────────┘
```

| 維度 | Core Gate（Hot） | Cron Hedge（Cold） |
|------|------------------|-------------------|
| **入口檔** | `src/worker-entry.ts` | `src/worker-cron-entry.ts` |
| **Wrangler** | `wrangler.toml` | `wrangler.cron.toml` |
| **Worker 名稱** | `bedelta-living-water` | `bedelta-living-water-cron` |
| **主要職責** | `fetch` 請求閘門 + 輕量 `scheduled` | GMX↔HL 對沖 cron（重型簽章） |
| **Cron 觸發** | `0 * * * *` · `*/5 * * * *`（輕量任務） | `*/5 * * * *`（對沖專用） |
| **Bundle 目標** | ≤ 150 KiB gzip（實測 **87.76 KiB**） | 獨立量測，不污染熱路徑 |

---

## 2. 五大物理優勢

### 2.1 L1/L2 CPU Cache 駐留（87.76 KiB Worker 常駐 Edge）

Cloudflare Workers 在 PoP 邊緣以 V8 Isolate 執行使用者程式碼。Isolate 的 **程式碼與熱資料結構** 愈小，愈容易在 CPU **L1/L2 Cache** 中保持駐留，減少指令與常數資料的 cache miss。

經 2026-08-25 Bundle Lean Surgery 後，Core Gate 從 **158.84 KiB** 降至 **87.76 KiB** gzip（headroom **62.24 KiB**）。將 viem、Hyperliquid 簽章堆疊（約 **~66 KiB gzip**）移出主 bundle 後，Shield 熱路徑（`checkSoilResistance()`、`soil_core.wasm`、路由分派）的 **工作集（working set）** 可穩定落在 Edge 處理器的快取層級內，避免與 Cold Path 的大型依賴爭奪同一 cache line。

**工程意義：** 熱路徑不是「理論上夠快」，而是 **物理上可預測地快**——程式碼體積直接決定 Edge PoP 上的 cache locality。

### 2.2 零冷啟動延遲（< 1 ms 解析時間）

Workers 冷啟動成本主要來自 **模組解析（parse）與初始化（init）**。當 Core Gate bundle 維持在 **87.76 KiB** 等級時：

- **模組圖深度淺**：`worker-entry.ts` 僅匯出 `fetch` + `scheduled`，熱路徑透過 `worker-fetch.ts` 直連 API 與 Shield，無重型 adapter barrel。
- **動態 import 隔離**：Cold Path 專用的 `scheduled-gmx-hedge` 不再出現在主 Worker 的依賴圖中（esbuild 靜態分析無法再將 viem/HL 拉入熱 bundle）。
- **SLO 對齊**：與技術規格中 **SLO < 1.0 ms** 決策延遲一致；p50 **~106 µs** 的 `checkSoilResistance()` 假設建立在 **暖機 Isolate + 小 bundle 快速 parse** 之上。

**工程意義：** 機構級 pre-execution gate 必須在 MEV / Sequencer 之前完成判斷；**< 1 ms 解析** 確保即使 PoP 輪換，熱路徑也不會因 bundle 膨脹而跌出次毫秒 SLO。

### 2.3 Heap 與 Zero-GC 隔離（主 Worker 維持 STW 暫停自由）

V8 中 **Stop-The-World（STW）GC** 會暫停整個 Isolate 的 JavaScript 執行。Hot Path 設計目標是 **零配置、低分配** 的 Shield 數學與 Wasm 路徑（`#![no_std]` `soil_core.wasm`，warm **< 60 µs**）。

若將 GMX↔HL 對沖 cron 與 viem 簽章堆疊留在同一 Isolate：

- 每 5 分鐘的 cron 會產生 **大量短期物件**（ABI 編碼、簽章 buffer、RPC 回應）。
- GC 壓力會波及同一 Isolate 內的 **fetch 熱路徑**，造成 p99 尾延遲尖峰。

解耦後：

- **Core Gate Isolate**：以 fetch 為主，heap 穩定，Shield 路徑接近 **Zero-GC** 語意。
- **Cron Hedge Isolate**：GC 壓力封閉在獨立 heap，**不會 STW 暫停** 風險閘門 Isolate。

**工程意義：** 微秒級風控與分鐘級對沖排程 **不應共享同一 V8 heap**——這是物理隔離，而非僅邏輯上的 `try/catch`。

### 2.4 爆炸半徑隔離（Cron 故障不衝擊 106 µs 風險閘門）

Cold Path 任務（`runScheduledGmxHedgeCron`）涉及：

- Hyperliquid Session Key 簽章
- GMX DataStore ETH delta 讀取
- $10 漂移閘門與 fail-closed 邏輯
- 外部 RPC 延遲與 `checkSoilResistance()` 無關的網路抖動

若對沖 cron 與 Core Gate 同 Worker：

| 故障模式 | 同 Worker 風險 | 解耦後 |
|----------|----------------|--------|
| viem 簽章 OOM / 未捕獲例外 | 可能拖垮整個 Worker，`fetch` 500 | Cron Isolate 失敗；Core Gate **106 µs 閘門持續服務** |
| HL RPC > 500 ms 土壤熔斷語意混淆 | 熱路徑與冷路徑共用 `console` / 警報通道 | 職責分離；Telegram 告警可區分來源 |
| Cron 部署回滾 | 連帶影響 SPA + API 閘門 | **獨立 `wrangler deploy -c wrangler.cron.toml`** |

`worker-scheduled.ts` 中已明確註記：GMX↔HL hedge cron **僅** 在 `worker-cron-entry.ts` 執行，主 Worker 的 `*/5` 觸發器保留給輕量任務（soak telemetry、KV ledger sync、mainnet monitor、grant-audit precache）。

**工程意義：** **Blast Radius = Isolate 邊界**。機構客戶的即時風控 SLA 不應綁定對沖排程的可用性。

### 2.5 成本與擴展優化

| 面向 | 效益 |
|------|------|
| **Bundle 計費** | Cloudflare Workers 按上傳體積與請求計費；主 Worker 瘦身 **−44.7% gzip** 降低邊緣分發與冷啟動成本 |
| **獨立擴展** | Cron Hedge 可調整 cron 頻率、secrets、甚至區域部署，**無需**重新發布 Core Gate |
| **CI 閘門** | `scripts/measure-worker-bundle.ts` 對 Core Gate 強制 **≤ 150 KiB**；Cron bundle 可另設上限 |
| **功能擴充 headroom** | 主 Worker 現有 **62.24 KiB** headroom，可在不觸碰 Cold Path 的前提下擴充 Shield / API |
| **運維並行** | 兩個 Worker 可 **藍綠部署**：先驗證 cron 對沖，再發布 API 閘門（或反之） |

**工程意義：** 解耦既是 **效能** 策略，也是 **FinOps + SRE** 策略——熱路徑與冷路徑的資源配額、部署節奏、告警閾值可分別優化。

---

## 3. Core Gate 與 Cron Hedge 協作機制

### 3.1 Core Gate — `src/worker-entry.ts`

```typescript
// 精簡入口：僅 fetch + scheduled，無 SDK re-export
export default {
  async fetch(request, env, ctx) {
    return handleWorkerFetch(request, env, ctx);
  },
  async scheduled(controller, env, ctx) {
    try {
      await runScheduledJobs(env, controller.cron);
    } catch (err) {
      console.error("[bedelta-living-water] scheduled cron failed", err);
    }
  },
};
```

**`fetch` 路徑（Hot Path）：**

1. `handleWorkerFetch()` 配置 Telegram 告警、非阻塞啟動 `ensureIntentPersistenceBoot()`（2PC ledger KV 恢復）。
2. Geo-compliance 熔斷 → API 路由分派 → `checkSoilResistance()` Shield 熱路徑。
3. 靜態資產由 `ASSETS` binding 提供 SPA。

**`scheduled` 路徑（輕量 Cold-on-Core）：**

`runScheduledJobs()` 依 `controller.cron` 執行：

| 任務 | 說明 |
|------|------|
| `ensureIntentPersistenceBoot` | KV 意圖持久化 boot + flatten hardlock |
| `runScheduledSoakTelemetry` | soak 遙測寫入 `SLIVERVINE_KV` |
| `syncLedgerToPersistence` | 2PC ledger → KV 同步 |
| `runMainnetMonitorTick` | 主網執行日誌監控 |
| `refreshGrantAuditPayloadCache` | Grant audit KV 預計算 |

> **注意：** 當 `SRV_200_MAINNET_SESSION_PK` 與 `SRV_200_MAINNET_USER_ADDRESS` 存在時，主 Worker **不再** 執行 GMX↔HL hedge——該職責已移交 Cron Hedge。

### 3.2 Cron Hedge — `src/worker-cron-entry.ts`

```typescript
// 獨立 cron Worker — 重型 HL 簽章堆疊
export default {
  async scheduled(_controller, env) {
    configureTelegramAlert({ ... });
    if (!env.SRV_200_MAINNET_SESSION_PK?.trim() || !env.SRV_200_MAINNET_USER_ADDRESS?.trim()) {
      return; // fail-silent：secrets 未配置則跳過
    }
    const { runScheduledGmxHedgeCron } = await import("./scheduled-gmx-hedge");
    await runScheduledGmxHedgeCron(env);
  },
};
```

**設計要點：**

- **動態 import**：`scheduled-gmx-hedge` 僅在 Cron Isolate 內載入，確保 esbuild 不將 viem/HL 打入 Core Gate。
- **Secrets 閘門**：缺少 SRV_200 session 憑證時 early return，避免無意義 RPC。
- **單一職責**：僅實作 `scheduled`，無 `fetch`——減少攻擊面與 bundle 複雜度。

### 3.3 無縫協作：共享狀態與時間軸

兩個 Worker **不直接 RPC 呼叫**，透過以下機制協作：

```text
時間軸 (每 5 分鐘)
─────────────────────────────────────────────────────────────
T+0s   Cron Hedge: runScheduledGmxHedgeCron()
       · 讀 GMX DataStore ETH exposure
       · 比對 HL short 部位 · $10 drift gate
       · 必要時 HL 簽章下單

T+0s   Core Gate scheduled (*/5): runScheduledJobs()
       · soak telemetry · KV ledger sync
       · mainnet monitor · grant-audit cache

持續    Core Gate fetch: 即時 API + Shield
       · p50 ~106 µs checkSoilResistance()
       · 與 cron 執行完全並行、不同 Isolate
─────────────────────────────────────────────────────────────
```

| 共享資源 | 用途 |
|----------|------|
| `SLIVERVINE_KV` / `SYSTEM_STATE_KV` | 意圖 ledger、soak 遙測、grant-audit 快取 |
| `EXECUTION_LOGS_KV` | 主網監控日誌（Core 寫入；Cron 對沖結果間接反映於鏈上） |
| `TELEGRAM_BOT_TOKEN` / `TELEGRAM_CHAT_ID` | 分 Worker 告警，來源標籤可區分 |
| `SRV_200_MAINNET_*` secrets | 僅 Cron Hedge 消費（對沖簽章） |
| `HYPERLIQUID_MAINNET_*` | Core 主網監控；Cron HL 下單 |

**一致性模型：** **Eventually consistent**。對沖 cron 調整 HL 部位後，下一次 Core Gate `fetch` 或 `mainnet monitor` tick 會透過 KV / 鏈上狀態收斂；Shield 熱路徑 **從不等待** cron 完成。

### 3.4 部署清單

```bash
# Core Gate（API + Shield + 輕量 scheduled）
wrangler deploy

# Cron Hedge（GMX↔HL 對沖，*/5）
wrangler deploy -c wrangler.cron.toml

# Bundle 驗證（Core Gate）
pnpm bundle:measure   # 目標 ≤ 150 KiB gzip；當前 87.76 KiB
```

生產環境 **兩者皆需部署** 方能恢復完整自動化：API 閘門與 5 分鐘對沖排程互為補充，而非替代。

---

## 4. 與 Santenmoku 不變量對齊

| 不變量 | Hot/Cold 解耦如何守護 |
|--------|----------------------|
| `checkSoilResistance()` p50 ~106 µs | Core Gate 小 bundle + 獨立 heap |
| Wasm `< 28 KiB` / warm `< 60 µs` | 熱路徑無 viem 污染 |
| `rpc-whitelist.ts` + > 500 ms 熔斷 | 僅 Shield 熱路徑強制；Cron RPC 隔離 |
| Dynamic Max SL = Balance × 1% + $100 | 風控邏輯在 Core；對沖在 Cron |
| `rootProtection()` 物理死鎖安全 | Core Gate fatal 不影響 Cron 降級對沖 |

---

## 5. 參考文件

- [`docs/logging/20260825_worker_bundle_lean_surgery_report.md`](../logging/20260825_worker_bundle_lean_surgery_report.md) — Bundle 瘦身與 cron 隔離手術記錄
- [`docs/architecture/TECHNICAL_SPECIFICATION.md`](../architecture/TECHNICAL_SPECIFICATION.md) — R01–R20 不變量與 Shield 拓撲
- [`src/worker-entry.ts`](../../src/worker-entry.ts) · [`src/worker-cron-entry.ts`](../../src/worker-cron-entry.ts)
- [`wrangler.toml`](../../wrangler.toml) · [`wrangler.cron.toml`](../../wrangler.cron.toml)
