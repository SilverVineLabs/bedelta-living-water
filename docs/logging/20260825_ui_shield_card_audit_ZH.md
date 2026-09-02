# UI Audit — `LivingWaterShieldCard.tsx` (BDLW v1.0)

> **Vitest SSOT:** Proposal Baseline: 175 test files | 773 PASS (Current Branch Live: 176 test files | 775 PASS Clean)

**Date:** 2026-08-25  
**Branch:** `v1.0_push_BDLW`  
**Component:** `src/components/LivingWaterShieldCard.tsx`

## 摘要

新增 Pillar 3「Pre-Execution Living Water Shield」終端風格卡片。市場狀態、Edge Engine、Skew Premium 與即時 log 行皆經 props 注入，元件內不模擬 API 回應。

## 結構

| 區塊 | 內容 |
|------|------|
| Header | Card 1 標題（可覆寫 `cardTitle`） |
| Status | Market State（`clear` / `storm` 樣式分支）、Edge Engine、Skew Premium |
| Action | Autonomous Rebalance 主按鈕 + Session-Key 副文案 |
| Log | 黑底 monospace 捲動視窗，`logLines: string[]` |

## Props 契約

- `status`（必填）：`marketState`、`marketStateVariant`、`edgeEngineLabel`、`skewPremiumLabel`
- `logLines`（必填）：即時 log 字串陣列，由父層串流或輪詢填入
- `onExecuteRebalance`、`isExecuting`、`actionDisabled`：執行與互斥控制
- `storm` 變體時主按鈕自動 fail-closed（disabled）

## 範例掛載

```tsx
<LivingWaterShieldCard
  status={{
    marketState: "🌊 CLEAR (Optimal Delta Balance)",
    marketStateVariant: "clear",
    edgeEngineLabel: "87.76 KiB Wasm Hot-Path",
    skewPremiumLabel: "+5bps ~ +10bps uiFeeReceiver",
  }}
  logLines={[
    "[p50: 106µs] checkSoilResistance() -> ALLOW",
    "[edge] rootProtection() standby · hot-path armed",
  ]}
  onExecuteRebalance={() => {/* rebalance flow */}}
/>
```

## 備註

- 行數 &lt; 200，純 React；log 視窗新行自動捲底。
- 與 `HeaderNav` 共用 `gmx-citadel-theme` token。
- 尚未掛載至 BDLW SPA；待殼層與 `/api` 遙測接線。
