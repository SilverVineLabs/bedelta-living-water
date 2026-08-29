# Daily Compliance SDK Wrapper 更新日誌

**日期：** 2026-08-25  
**分支：** `v1.0_push_BDLW`  
**範圍：** `src/sdk/robinhood-audit-snapshot.ts` · `src/sdk/index.ts` · `tests/sdk/`

---

## 變更摘要

新增薄包裝 `exportDailyRobinhoodComplianceReport()`，以 UTC 日曆截止時間格式化後委派 `buildRobinhoodAuditSnapshot()`。既有 `buildRobinhoodAuditSnapshot()` / `exportRobinhoodAuditSnapshot()` 未修改行為。

| 匯出 | 用途 |
|------|------|
| `formatDailyUtcDate(nowMs)` | `YYYY-MM-DD` UTC 日標籤 |
| `formatDailyUtcCutoff(nowMs)` | `YYYY-MM-DDT00:00:00.000Z` UTC 午夜截止 |
| `exportDailyRobinhoodComplianceReport(input)` | 日報 `{ reportType, reportDateUtc, generatedAtUtc, snapshot }` |

## 測試

- `tests/sdk/daily-robinhood-compliance-report.test.ts` — 驗證日報 JSON 結構與 UTC cutoff 綁定

## 行數預算

- 程式變更 < 80 行（符合任務限制）
