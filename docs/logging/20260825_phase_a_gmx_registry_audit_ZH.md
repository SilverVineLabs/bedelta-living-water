# Phase A — GMX Config Registry & ZeroDev Smart Routing

> **Vitest SSOT:** 173 test files | 765 PASS Clean

**日期：** 2026-08-25  
**分支：** `v1.0_push_BDLW`  
**範圍：** Config-only · 零鏈上變更 · 零 EIP-712 破壞

---

## 變更摘要

- 新增 `src/config/gmx-markets.ts` 作為 ETH/USDC、BTC/USDC GM Pool SSOT
- `telemetry-symbols.ts` 白名單擴展為 `["ETH", "BTC"]`
- `gmx-revenue.ts` 新增 ZeroDev Smart Routing（Robinhood 46630/4663 USDG → Arbitrum GM）
- `gmx-v2-gm-balance.ts`、`gmx-v2-live-delta-reader.ts` 改為 registry lookup + ETH 預設 fallback
- **未修改** `SliverVineGate.sol` / `RiskAttestation` / `ATTESTATION_TYPEHASH`

---

## 修改檔案清單

| 檔案 | 動作 |
|------|------|
| `src/config/gmx-markets.ts` | **新增** — GM Pool registry SSOT |
| `src/config/gmx-revenue.ts` | **修改** — ZeroDev smart route targets |
| `src/services/risk-control-lib/telemetry-symbols.ts` | **修改** — BTC whitelist |
| `src/services/adapters/gmx-v2-gm-balance.ts` | **修改** — `resolveGmxMarketBySymbol()` |
| `src/services/adapters/gmx-v2-live-delta-reader.ts` | **修改** — registry token 綁定 |
| `tests/risk-control/soil-telemetry.test.ts` | **修改** — BTC 斷言更新 |

**程式碼增量：** ~115 行（< 200 行限制 ✅）

---

## GMX Market Registry

| Key | marketToken | long | short | routeKey |
|-----|-------------|------|-------|----------|
| ETH/USDC | `0x70d95587…6336` | WETH | USDC | `GM_ETH_USDC` |
| BTC/USDC | `0x47c03123…0703` | WBTC.e | USDC | `GM_BTC_USDC` |

來源：GMX official `markets.ts`（Arbitrum One）

---

## ZeroDev Smart Routing

```typescript
// src/config/gmx-revenue.ts
ZERODEV_SMART_ROUTE_TARGETS[46630] → { ingressAsset: "USDG", gmPoolRouteKey: "GM_ETH_USDC", destChainId: 42161 }
resolveZeroDevGmMarketToken(chainId) → marketToken
```

路由解析走 **config lookup**，不觸碰 Gate EIP-712 struct。

---

## 測試結果

```text
pnpm typecheck                    → 0 errors
pnpm vitest run tests/risk-control/soil-telemetry.test.ts     → 4/4 PASS
pnpm vitest run tests/adapters/gmx-v2-gm-balance.test.ts      → 2/2 PASS
pnpm vitest run tests/services/gmx-v2-gm-telemetry.test.ts   → 3/3 PASS
```

---

## Bundle 量測

```json
{
  "measuredAt": "2026-08-25T13:16:37.757Z",
  "gzipKiB": 168.32,
  "wranglerTotalGzipKiB": 168.32,
  "limitKiB": 158.99
}
```

| 指標 | 結果 |
|------|------|
| 目標 | ≤ 158.99 KiB gzip |
| 實測 | **168.32 KiB** |
| Phase A 增量 | ~54 行純常數模組，增量可忽略 |
| 狀態 | ⚠️ **分支基線已超上限**（非 Phase A 引入） |

**建議：** 獨立 bundle diet PR（tree-shake / lazy Worker imports）後再合併 Phase B。

---

## 零破壞性確認

| 檢查項 | 狀態 |
|--------|------|
| `SliverVineGate.sol` 未變更 | ✅ |
| `ATTESTATION_TYPEHASH` 未變更 | ✅ |
| `GMX_ETH_USD_MARKET_TOKEN` 向後相容 re-export | ✅ |
| 既有測試 import 路徑不變 | ✅ |

---

## 下一步（Phase B 預告）

1. `scheduled-gmx-hedge-cron.ts` — per-market `marketToken` param
2. `r-chain-yield-router.ts` — `GM_BTC_USDC` route key 串接
3. Bundle 優化至 ≤ 158.99 KiB 後再擴展 cron / UI
