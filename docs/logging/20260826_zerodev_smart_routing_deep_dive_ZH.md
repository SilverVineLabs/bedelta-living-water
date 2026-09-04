# ZeroDev Smart Routing 深度解析文件建立日誌

> **Vitest SSOT:** 180 test files | 803 PASS Clean

**日期：** 2026-08-26  
**分支：** `v1.0_push_BDLW`  
**角色：** Lead Architect  
**任務：** 2/3 — 建立 ZeroDev Smart Routing 內部深度文件

---

## 建立項目

| 檔案 | 動作 | 說明 |
|------|------|------|
| `docs/internal/ZERODEV_SMART_ROUTING_DEEP_DIVE.md` | **新增** | Smart Routing vs 傳統橋深度對比 + SliverVine Protocol 整合架構（繁體中文） |
| `docs/logging/20260826_zerodev_smart_routing_deep_dive.md` | **新增** | 本建立日誌 |

---

## 內容摘要

### 文件涵蓋範圍

1. **深度對比** — ZeroDev Smart Routing vs Stargate/Hop（帳戶模型、交易筆數、合規、風控插入點、payload 綁定、`lostUsd` 會計）
2. **SliverVine Protocol 整合**
   - `ZERODEV_SMART_ROUTE_TARGETS` SSOT（USDG → GMX ExchangeRouter → GM_ETH_USDC）
   - 1-Click 跨鏈 deposit/swap → Kernel Smart Account 四階段流程
   - `buildGmxSmartRoutePayloadBinding()` + `computeGatedExecutorPayloadHash()` 零 EIP-712 修改綁定
   - `assertUnidirectionalBridge()` + `lostUsd ≡ 0` 與 onboarding 摩擦消除並行
3. **程式碼錨點地圖** · **驗證指令** · **設計鐵律審計對照**

### 參照來源

- `src/config/gmx-revenue.ts` · `gmx-smart-route-payload-binding.ts` · `gated-executor-payload.ts`
- `SliverVineGate/src/GatedExecutor.sol`
- `r-chain-yield-router.ts` · `unidirectional-bridge.ts` · `smart-route-deposit-flow.ts`
- `docs/architecture/01_TECHNICAL_SPECIFICATION.md` §2.3
- `tests/adapters/gmx-smart-route-payload-binding.test.ts`

---

## 驗證

- [x] 分支確認：`v1.0_push_BDLW`
- [x] 語言：繁體中文
- [x] EIP-712 struct 不變性已明確記載
- [x] `lostUsd ≡ 0` 不變量與 Smart Routing UX 分層說明
- [ ] 後續任務 3/3（待使用者指示）

---

## 備註

Across 橋在文件中定位為 **合規 escort 決策層參考**，與 ZeroDev Smart Routing **互補**；避免讀者誤以為 SliverVine Protocol 完全放棄 Across 語意。
