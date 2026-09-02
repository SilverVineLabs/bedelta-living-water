# UI Audit — `SmartRoutingDepositCard.tsx` (BDLW v1.0)

> **Vitest SSOT:** Proposal Baseline: 175 test files | 773 PASS (Current Branch Live: 176 test files | 775 PASS Clean)

**Date:** 2026-08-25  
**Branch:** `v1.0_push_BDLW`  
**Component:** `src/components/SmartRoutingDepositCard.tsx`

## 摘要

新增 Pillar 2「ZeroDev Smart Routing Deposit」機構級存款 widget。送/收金額、代幣、鏈、Smart Route 地址與報價輸出皆經 props 控制；ZeroDev 流程透過 `onDeposit`、`onCopySmartRouteAddress` 等 callback 由父層接線。

## 結構

| 區塊 | 內容 |
|------|------|
| Header | Card 2 標題 |
| You Send | 金額輸入 + Token / Chain 選擇器 |
| Smart Route Address | 唯讀截斷地址 + Copy |
| You Receive | 報價輸出 + Token / Chain 選擇器 |
| Safety | payloadHash 安全標章 |
| Action | Deposit & Escort 主按鈕 |

## Props 契約

- 受控輸入：`sendAmount` + `onSendAmountChange`
- 路由地址：`smartRouteAddress`（完整地址；UI 自動截斷顯示）
- 報價輸出：`receiveAmount`、`receiveToken`、`receiveChain`（由父層 quote / `runSmartRouteDepositPreview` 填入）
- 選擇器：可選 `*Options` + `on*Change`；未提供時降級為唯讀 badge
- ZeroDev 流程：`onDeposit`、`onCopySmartRouteAddress`、`isDepositing`、`depositDisabled`

## 範例掛載

```tsx
const [sendAmount, setSendAmount] = useState("250.00");

<SmartRoutingDepositCard
  sendAmount={sendAmount}
  onSendAmountChange={setSendAmount}
  sendToken="USDC"
  sendTokenOptions={[{ value: "USDC", label: "USDC" }]}
  sendChain="Arbitrum One"
  sendChainOptions={[{ value: "arbitrum", label: "Arbitrum One" }]}
  smartRouteAddress="0xc92c00000000000000000000000000000000dc4a"
  receiveAmount="250.00"
  receiveToken="USDG"
  receiveTokenOptions={[
    { value: "USDG", label: "USDG" },
    { value: "GM_LP", label: "GM Pool LP" },
  ]}
  receiveChain="Robinhood Chain 46630"
  receiveChainOptions={[
    { value: "rh-46630", label: "Robinhood Chain 46630" },
    { value: "arbitrum", label: "Arbitrum" },
  ]}
  onDeposit={() => {/* ZeroDev smart route deposit */}}
/>
```

## 備註

- 行數 &lt; 190，純 React；複製使用 `navigator.clipboard`。
- 地址截斷復用 `formatConnectedWalletLabel`。
- 與 `smart-route-deposit-flow.ts` 可在父層組合，元件內不呼叫 API。
