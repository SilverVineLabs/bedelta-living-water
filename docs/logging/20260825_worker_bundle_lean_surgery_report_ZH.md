# Worker Bundle Lean Surgery 報告

**日期：** 2026-08-25  
**分支：** `v1.0_push_BDLW`  
**角色：** Senior Performance & Systems Engineer

---

## 執行摘要

| 指標 | 優化前 | 優化後 | 目標 |
|------|--------|--------|------|
| **Gzip** | 158.84 KiB | **87.76 KiB** | ≤ 150.0 KiB |
| **Raw** | 702.26 KiB | 357.46 KiB | — |
| **Headroom** | 0.15 KiB | **62.24 KiB** | — |
| **Vitest** | 742 PASS | **742 PASS** | 742+ |
| **Foundry** | 60/60 | **60/60** | 60/60 |

**降幅：** −71.08 KiB gzip（−44.7%）  
**安全不變量：** `checkSoilResistance()` · EIP-712 · ZeroDev smart routing bindings 未修改邏輯

---

## 1. Bundle 依賴審計發現

| 問題 | 影響 |
|------|------|
| `services/hyperliquid-adapter.ts` 廢棄 barrel 被 soak/HUD 靜態引用 | 拉入完整 HL adapter + HyperliquidAdapter class |
| `cross-spread.ts` 頂層 `gmxV2ArbitrumAdapter` | grant-audit + soil 熱路徑綁定完整 GMX v2 adapter |
| `gmx-v2-datastore` barrel | `getGmxDataStoreStatusCache` 靜態拉入 `fetchSplitBorrowRates` + viem |
| `worker-scheduled` `import("./scheduled-gmx-hedge")` | esbuild 仍將 viem/HL 簽章堆疊打入主 bundle（~66 KiB gzip） |
| `hl-telemetry-probe` → `hyperliquid-adapter` barrel | HUD stream 路徑膨脹 |
| `stateManager` re-export `verifyAndReleaseHardlock` | 靜態拉入 viem `recoverTypedDataAddress` |

---

## 2. 手術變更清單

### 2.1 依賴圖瘦身（主 Worker 熱路徑）

| 模組 | 動作 |
|------|------|
| `src/utils/abi-keccak.ts` | 以 `@noble/hashes` 取代 viem `encodeAbiParameters`/`keccak256`（`gmx-v2-datastore-keys`） |
| `cross-spread-cache.ts` | 純數學 + cache；soil/grant-audit 不再靜態依賴 `gmx-v2-adapter` |
| `exchanges/hl-l2-book` | soak-telemetry · HUD 直連 L2 fetch（跳過 HL barrel） |
| `exchanges/hl-margin` | `hl-telemetry-probe` 直連 margin tier 評估 |
| `gmx-v2-gm-balance-cache.ts` | dual-wallet / balancer 僅讀 cache，不拉 RPC fetch |
| `hl-auto-hedge-status.ts` | telemetry 讀 status，不拉 `session-key-executor` |
| `unlock-reauthorization-kv.ts` | Worker boot 僅配置 KV，不拉 viem |
| `grant-audit-guard-read.ts` | citadel-metrics 讀 probe，不拉 GMX refresh |
| `worker-fetch.ts` | `severSigningChannel` 直連 `session-key-gates` |

### 2.2 Cron 隔離（最大單項收益）

| 檔案 | 用途 |
|------|------|
| `src/worker-cron-entry.ts` | GMX↔HL hedge cron（`runScheduledGmxHedgeCron`） |
| `wrangler.cron.toml` | 獨立 cron Worker 部署（`*/5 * * * *`） |
| `worker-scheduled.ts` | 移除 `scheduled-gmx-hedge` 動態 import |

> **部署注意：** 主 Worker（`wrangler.toml`）與 Cron Worker（`wrangler.cron.toml`）需分別 `wrangler deploy`。

### 2.3 量測閘門

`scripts/measure-worker-bundle.ts`：`BUNDLE_GZIP_LIMIT_KIB` **158.99 → 150.0**

---

## 3. 驗證結果

```bash
pnpm bundle:measure   # 87.76 KiB / 150.0 KiB PASS
pnpm test             # 168 files · 742 PASS
cd SliverVineGate && forge test  # 60/60 PASS
```

---

## 4. 未變更邏輯確認

| 不變量 | 狀態 |
|--------|------|
| `checkSoilResistance()` | ✅ soil-resistance 改 import `cross-spread-cache`，行為不變 |
| EIP-712 `unlock-reauthorization` | ✅ 延遲 `import("viem")` 於驗簽函式內 |
| ZeroDev smart routing `gmx-smart-route-payload-binding` | ✅ 未修改（SPA 路徑，非 Worker hot path） |
| `GatedExecutor.payloadHash()` | ✅ Forge 60/60 |

---

## 5. 後續建議

1. CI 新增 `wrangler deploy --dry-run -c wrangler.cron.toml` 量測 cron bundle（可選）
2. 生產環境部署 cron Worker 以恢復 `*/5` GMX↔HL hedge 自動化
3. 主 Worker headroom（62 KiB）可用於未來功能擴充
