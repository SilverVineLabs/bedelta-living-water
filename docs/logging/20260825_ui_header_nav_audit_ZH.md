# UI Audit — `HeaderNav.tsx` (SliverVine Protocol v1.0)

> **Vitest SSOT:** Proposal Baseline: 175 test files | 773 PASS (Current Branch Live: 176 test files | 775 PASS Clean)

**Date:** 2026-08-25  
**Branch:** `v1.0_push_BDLW`  
**Component:** `src/components/HeaderNav.tsx`

## 摘要

新增 BeDeltaLivingWater DApp 頂部導覽列，採 GMX Citadel 深色 institutional / cyberpunk Tailwind 語彙，動態遙測經 `telemetry` props 注入，避免元件內硬編碼協定狀態、延遲與 bundle headroom。

## 結構

| 區塊 | 內容 |
|------|------|
| 左 | Logo `/brand/Logo_BeDeltaLivingWater.png`、標題、副標 |
| 中 | Live status badge（Protocol / Edge Latency / Worker Headroom） |
| 右 | SliverVine Citadel CaaS 標籤、ZeroDev Session Key 錢包按鈕 |

## Props 契約

- `telemetry`（必填）：`protocolState`、`edgeLatencyLabel`、`workerHeadroomLabel`
- 錢包：`walletConnected`、`walletLabel`、`isConnecting`、`onConnectWallet`、`onDisconnectWallet`
- 品牌靜態文案可覆寫：`title`、`subtitle`、`poweredByLabel`、`connectLabel`

## 範例掛載

```tsx
<HeaderNav
  telemetry={{
    protocolState: "🌊 LIVING WATER FLOWING",
    edgeLatencyLabel: "106µs (p50)",
    workerHeadroomLabel: "87.76 KiB",
  }}
  onConnectWallet={() => {/* ZeroDev session key flow */}}
/>
```

## 備註

- 行數 &lt; 180，純 React，無 Node 依賴。
- Logo 資產路徑為 public `/brand/`；部署前確認靜態檔已上架。
- 尚未掛載至 SPA root；待 SliverVine Citadel Shield 殼層整合時接入。
