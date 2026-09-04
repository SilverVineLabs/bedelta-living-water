# Hot/Cold Path 解耦架構文件建立日誌

> **Vitest SSOT:** 173 test files | 765 PASS Clean

**日期：** 2026-08-26  
**分支：** `v1.0_push_BDLW`  
**角色：** Senior Infrastructure Architect  
**任務：** 1/3 — 建立內部架構文件

---

## 建立項目

| 檔案 | 動作 | 說明 |
|------|------|------|
| `docs/internal/HOT_COLD_PATH_DECOUPLING.md` | **新增** | Hot/Cold Path 解耦五大物理優勢 + Core Gate / Cron Hedge 協作 SSOT |
| `docs/logging/20260826_hot_cold_decoupling_doc.md` | **新增** | 本建立日誌 |

---

## 內容摘要

### 文件涵蓋範圍

1. **五大物理優勢（繁體中文）**
   - L1/L2 CPU Cache 駐留（91.2 KiB gzip measured hot path）
   - 零冷啟動延遲（< 1 ms 解析 · SLO 對齊）
   - Heap & Zero-GC 隔離（主 Worker STW 暫停自由）
   - 爆炸半徑隔離（Cron 故障不衝擊 106 µs 風險閘門）
   - 成本與擴展優化（bundle −44.7%、獨立部署、CI 閘門）

2. **雙 Worker 協作**
   - `src/worker-entry.ts` → `handleWorkerFetch` + `runScheduledJobs`
   - `src/worker-cron-entry.ts` → 動態 import `runScheduledGmxHedgeCron`
   - 共享 KV / Secrets 時間軸與 eventually consistent 模型
   - 部署指令（`wrangler deploy` × 2）

### 參照來源

- `docs/logging/20260825_worker_bundle_lean_surgery_report.md`
- `src/worker-entry.ts` · `src/worker-cron-entry.ts` · `src/worker-scheduled.ts`
- `wrangler.toml` · `wrangler.cron.toml`
- `docs/architecture/01_TECHNICAL_SPECIFICATION.md`

---

## 驗證

- [x] 分支確認：`v1.0_push_BDLW`
- [x] 語言：繁體中文
- [x] 目錄：`docs/internal/` 已建立
- [ ] 後續任務 2/3、3/3（待使用者指示）

---

## 備註

本文件為 **內部基礎設施 SSOT**，與 2026-08-25 Bundle Lean Surgery 互為補充：手術報告記錄「做了什麼」，本文件記錄「為何這樣做」及運維協作模型。
