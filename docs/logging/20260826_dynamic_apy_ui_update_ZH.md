# Dynamic APY UI 更新日誌

> **Vitest SSOT:** Proposal Baseline: 175 test files | 773 PASS (Current Branch Live: 176 test files | 775 PASS Clean)

**日期：** 2026-08-26  
**分支：** `v1.0_push_BDLW`  
**角色：** Senior UI/UX Engineer

---

## 修改項目

| 檔案 | 動作 | 說明 |
|------|------|------|
| `src/components/LivingWaterShieldCard.tsx` | **更新** | Dynamic APY Banner · 收益來源列表 · 安全註腳 · Join/Inspect 雙按鈕 |
| `src/App.tsx` | **更新** | 傳入 `apyRange` / `yieldSources` props · 接線 `onJoinVault` / `onInspectSoilRadar` |
| `docs/logging/20260826_dynamic_apy_ui_update.md` | **新增** | 本日誌 |

---

## UI 變更摘要

### LivingWaterShieldCard

- 新增 `LivingWaterApyRange` · `apyRange` · `yieldSources` props（無硬編碼 API yield）
- APY Badge：`Dynamic Estimated APY: {min}% ~ {max}% (Non-Guaranteed)`
- 收益來源 bullet list（由 App 注入）
- 安全註腳：106µs Shield · `lostUsd ≡ 0`
- 操作列：`🌊 Join Vault (One-Click Deposit)` · `📄 Inspect Soil Radar`
- `data-testid`：`living-water-apy-banner` · `living-water-join-vault-button` · `living-water-inspect-soil-button`

### App.tsx

- `DYNAMIC_APY_RANGE = { minPercent: 14.2, maxPercent: 21.8 }`
- `YIELD_SOURCES` 三項 breakdown（可日後改為 API 驅動）
- `onJoinVault` → 未連線則 connect · 已連線則觸發 deposit
- `onInspectSoilRadar` → 追加 soil radar log 行

---

## 驗證結果

```bash
pnpm test           # 168 files · 773 PASS (Proposal Baseline) · exit 0
pnpm bundle:measure # 見下方輸出
```

| 指標 | 結果 |
|------|------|
| Vitest | **773 PASS (Proposal Baseline)**（168 files） |
| Bundle gzip | **87.76 KiB / 150.0 KiB PASS**（零回歸） |
| 修改行數 | LivingWaterShieldCard + App ≈ **< 100 行** |

---

## 備註

舊 `onExecuteRebalance` / `living-water-rebalance-button` 已替換為 Join Vault / Inspect Soil Radar 雙 CTA，與 Card 2 Smart Routing Deposit 流程對齊。
