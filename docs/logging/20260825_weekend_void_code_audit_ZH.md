# Weekend Void & Daily UTC Closure — 程式碼審計報告

**日期：** 2026-08-25  
**分支：** `v1.0_push_BDLW`  
**審計範圍：** `src/services/risk-control-lib/` · `src/adapters/`（唯讀）  
**審計員：** Senior Systems Auditor

---

## 執行摘要

| 檢查項 | 結果 | 說明 |
|--------|------|------|
| `00:00 UTC` 每日收盤閘門 | ⚠️ **部分** | 無獨立「日結 closure」；僅 HL funding settlement ±5min（HIP-3） |
| Weekend Void（週五 EST 收盤 → 週日晚） | ❌ **未實作** | 無此命名/語意；僅 UTC 六日全天 coarse weekend |
| `checkSoilResistance()` 時間窗整合 | ✅ **部分** | Tsunami HKT 21–23 硬 trip；HIP-3 gap 動態縮放 |
| AI Agent 清算防護（動態縮放） | ⚠️ **有限** | 僅 HIP-3/xyz 符號；ETH/BTC 主路徑週末無 gap guard |

**總評：** 存在時間閘門基礎設施，但與「Weekend Void + 00:00 UTC Daily Closure」產品規格**不完全對齊**。

---

## 1. 時間閘門 SSOT（`risk-control-lib`）

### 1.1 `time-gates.ts`

| 函式 | 視窗 | 行為 |
|------|------|------|
| `isTsunamiShieldWindow()` | HKT **21:00–22:59** | US open 波動屏蔽 |
| `isHlOrderbookGapWindow()` | HKT tsunami **或** UTC `day === 0 \|\| 6` | 週六+週日全天（UTC） |

```26:31:src/services/risk-control-lib/time-gates.ts
/** Hyperliquid orderbook gap / market-close windows — HKT tsunami + UTC weekend. */
export function isHlOrderbookGapWindow(now: Date = new Date()): boolean {
  if (isTsunamiShieldWindow(now)) return true;
  const day = now.getUTCDay();
  return day === 0 || day === 6;
}
```

**缺口：**
- 無「週五 US EST 收盤（≈16:00 ET）至週日晚」連續流動性沙漠窗
- 週五收盤後至週六 00:00 UTC 之間**未覆蓋**
- 無 `Weekend Void` / `LIQUIDITY_DESERT` 常數或 reason code

### 1.2 `checkSoilResistance()` 整合路徑

```54:94:src/services/risk-control-lib/soil-resistance.ts
function collectExternalSoilReasons(input: SoilResistanceInput): string[] {
  // ...
  if (isTsunamiShieldWindow(input.at)) {
    reasons.push("TSUNAMI_SHIELD_LOCKED_HKT_21_23");
  }
  // ...
  const hlOrderbookGap = evaluateHlOrderbookGapGuard({ ... });
  if (hlOrderbookGap.triggered) reasons.push(...hlOrderbookGap.reasons);
  const rwaSettlement = evaluateRwaSettlementLock({ symbol, at: input.at });
  if (rwaSettlement.locked) reasons.push(...rwaSettlement.reasons);
}
```

| 守衛 | 符號範圍 | 週末/日結行為 |
|------|----------|---------------|
| Tsunami Shield | **全部** | 硬 trip（`tripped=true`） |
| HL Orderbook Gap | **僅 HIP-3/xyz** | 槓桿 3x→1x + 深度門檻 ×2 |
| RWA Settlement Lock | **僅 HIP-3/xyz** | UTC 0/8/16 ±5min 硬 lock |

---

## 2. 00:00 UTC Daily Closure 驗證

### 2.1 實際存在：`rwa-settlement-lock.ts`

```10:11:src/services/risk-control-lib/rwa-settlement-lock.ts
/** Hyperliquid funding settlement hours (UTC). */
export const HL_FUNDING_SETTLEMENT_HOURS_UTC = [0, 8, 16] as const;
```

- UTC **00:00** 為三個 HL funding settlement 時點之一
- 僅在 **±5 分鐘**內、且符號為 HIP-3/xyz 時觸發 `RWA_SETTLEMENT_LOCK`
- **非**全域每日收盤；ETH/BTC 不受影響

### 2.2 不存在

- 無 `DAILY_UTC_CLOSURE` / `00:00_UTC_LOCK` reason code
- 無專用 scheduler/cron 在 UTC 午夜重置或封鎖 soil 路徑
- `Root17DailyState`（`v2/services/root17-daily.ts`）以 UTC 日界線追蹤每日 SL 次數/虧損，屬 **circuit-breaker 層**，非 `checkSoilResistance()` 流動性沙漠邏輯

### 2.3 測試覆蓋

- `tests/services/rwa-settlement-lock.test.ts` — UTC 08:03 HIP-3 lock ✅
- 無 00:00 UTC 專項測試；無 weekend gap 專項測試

---

## 3. Weekend Void 驗證

### 3.1 規格 vs 實作對照

| 規格描述 | 程式碼實作 | 對齊 |
|----------|------------|------|
| 週五 US EST 收盤起算 | 無 EST 週五收盤邏輯於 `risk-control-lib` | ❌ |
| 持續至週日晚 | UTC Sat+Sun 全天（`getUTCDay()===0\|6`） | ⚠️ 粗粒度 |
| Liquidity desert 門檻 | `HL_ORDERBOOK_GAP_DEPTH_MULTIPLIER = 2` | ⚠️ 僅 HIP-3 |
| 防止 AI agent 清算 | 槓桿縮放 + 深度加倍；非全域 trip | ⚠️ 有限 |

### 3.2 `hl-orderbook-gap-guard.ts` 動態縮放

```54:77:src/services/risk-control-lib/hl-orderbook-gap-guard.ts
  const targetLeverage = FUNDING_LEVERAGE_MILD_FLOOR;  // 1.0x
  const requiredMinDepthUsd = Math.round(
    baseMinDepth * HL_ORDERBOOK_GAP_DEPTH_MULTIPLIER,  // ×2
  );
  reasons.push(HL_ORDERBOOK_GAP_GUARD);
  reasons.push(`HL_ORDERBOOK_LEVERAGE_SCALE=${FUNDING_LEVERAGE_NORMAL}x->${targetLeverage}x`);
```

- **縮放策略：** 降槓桿 + 提高深度門檻（非 slippage fuse 動態調整）
- **觸發條件：** `isXyzOrHip3Key(symbol)` — ETH/BTC/標準 perp **跳過**
- **測試：** 無 `evaluateHlOrderbookGapGuard` 專項測試檔

### 3.3 相關但範圍外（`v2/step1-time-windows.ts`）

- US 開盤/收盤 spike 窗（EST 09:15–09:45、15:45–16:15）存在於 **v2 Step1 引擎**
- **未**接入 `risk-control-lib/checkSoilResistance()` 或 `src/adapters/`
- 不計入本次審計 PASS

---

## 4. `src/adapters/` 掃描結果

| 區域 | 時間窗邏輯 | 備註 |
|------|------------|------|
| `adapters/hl/execution-wire.ts` | 委派 `checkSoilResistanceWithVine()` | 無獨立週末邏輯 |
| `adapters/hl/execution-transport/execute.ts` | soil trip → signing gate | 被動繼承 |
| `adapters/hl/websocket/websocket-health.ts` | WS 斷線 → soilTripped | 非日曆窗 |
| `adapters/arbitrum/zerodev-aa/*` | 無週末/日結窗 | — |
| `adapters/robinhood/*` | 單向橋 AML；無時間窗 | — |

**結論：** adapters 層不實作 Weekend Void / Daily Closure；完全依賴上游 `checkSoilResistance()` 聚合。

---

## 5. Fast-Path 繞行風險（`core/risk-engine-soil-fastpath.ts`）

Gateway nominal fast-path 對 tsunami 窗**顯式禁用**（`isTsunamiShieldWindow` → `false`），但 **不檢查** `isHlOrderbookGapWindow` 或 RWA settlement。HIP-3 符號在 fast-path 已被排除（`isXyzOrHip3Key` → 走完整 soil）。

---

## 6. 審計結論與建議

### PASS（已實作）

1. HKT Tsunami Shield（21–23）於 `checkSoilResistance()` 硬 trip — 有測試
2. UTC 週末 coarse window（Sat/Sun）+ HIP-3 槓桿/深度動態縮放
3. HL funding settlement ±5min lock（UTC 0/8/16）for HIP-3

### FAIL / GAP（規格未覆蓋）

1. **無 `Weekend Void` 命名或 Friday EST close → Sunday night 精確窗**
2. **無 00:00 UTC 全域 daily closure** — 僅 funding settlement 子集
3. **ETH/BTC 主交易路徑週末無 gap guard** — 清算防護不適用核心 GM/HL 對沖腿
4. **無 `evaluateHlOrderbookGapGuard` 單元測試**
5. **adapters 無時間窗 scheduler** — 無 cron 驅動的日結/週末報告

### 建議後續（未實作）

1. 新增 `isWeekendVoidWindow()` — America/New_York 週五 ≥16:15 ET 至週日 23:59 ET
2. 將 gap guard 擴展至 `ETH`/`BTC` 或透過 `minDepthUsd` 動態倍率
3. 補 `tests/risk-control/hl-orderbook-gap-guard.test.ts`
4. 文件對齊：Blueprint 補充「Weekend Void = UTC coarse weekend, not EST Friday close」

---

## 附錄：關鍵檔案索引

| 檔案 | 角色 |
|------|------|
| `src/services/risk-control-lib/time-gates.ts` | 時間窗 SSOT |
| `src/services/risk-control-lib/soil-resistance.ts` | `checkSoilResistance()` 聚合 |
| `src/services/risk-control-lib/hl-orderbook-gap-guard.ts` | 週末/tusnami gap 動態縮放 |
| `src/services/risk-control-lib/rwa-settlement-lock.ts` | UTC 0/8/16 funding lock |
| `src/services/risk-control-lib/funding-regime-guard.ts` | Funding 負利率槓桿縮放（非日曆窗） |
| `tests/risk-control/soil-coverage-edges.test.ts` | Tsunami 測試 |
| `tests/services/rwa-settlement-lock.test.ts` | Settlement lock 測試 |
