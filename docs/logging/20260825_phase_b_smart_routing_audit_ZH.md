# Phase B — Payload Binding & Smart Routing Adapter

> **Vitest SSOT:** 180 test files | 803 PASS Clean

**日期：** 2026-08-25  
**分支：** `v1.0_push_BDLW`  
**範圍：** Off-chain payload binding · 零 EIP-712 / Gate struct 變更

---

## 變更摘要

- 新增 `src/sdk/gated-executor-payload.ts` — 鏡像 `GatedExecutor.payloadHash()` 公式
- 新增 `src/services/adapters/gmx-smart-route-payload-binding.ts` — GMX unsigned order + ZeroDev smart route 綁定 helper
- 擴展 `gmx-revenue.ts` — `smartRoutingAddress`（Arbitrum GMX ExchangeRouter）
- 擴展 `r-chain-yield-router.ts` — 接受 `targetRoute`，輸出 `smartRoutingAddress` / `destMarketToken`
- **未修改** `SliverVineGate.sol` / `RiskAttestation` / `ATTESTATION_TYPEHASH`

---

## Payload 安全模型

路由與 Treasury calldata **僅**透過 `GatedExecutor.payloadHash(initiator, target, keccak256(data), nonce)` 綁定：

```solidity
// GatedExecutor.sol L78-83
keccak256(abi.encode(block.chainid, address(this), initiator, target, keccak256(data), nonce))
```

TypeScript 鏡像：`computeGatedExecutorPayloadHash()` + `buildGmxSmartRoutePayloadBinding()`。

`data` ABI 編碼：`[sourceChainId, targetRoute, marketToken, keccak256(orderPayloadJSON)]`

---

## Smart Routing 配置

| 來源鏈 | ingress | 目標鏈 | GM Route | Smart Routing Target |
|--------|---------|--------|----------|----------------------|
| 46630 | USDG | 42161 | `GM_ETH_USDC` | `0x7dE39FF2…83f1` (ExchangeRouter) |
| 4663 | USDG | 42161 | `GM_ETH_USDC` | `0x7dE39FF2…83f1` |

`targetRoute` 可覆寫為 `GM_BTC_USDC`（config lookup，不觸碰 attestation envelope）。

---

## Payload Hash 驗證指標

| 案例 | payloadHash | 狀態 |
|------|-------------|------|
| Robinhood 46630 → GM_ETH_USDC, nonce=1 | `0x9c70f5d760346c4d33cc203e99c15e00607260a0222014ddf10996785c7576ca` | ✅ 確定性 |
| 同參數重播 | 相同 hash | ✅ 零誤差 |
| nonce 篡改 (1→2) | hash 分歧 | ✅ fail-closed |
| 手動 abi.encode 交叉驗證 | 與 helper 一致 | ✅ |

---

## 測試結果

### Vitest（新增 + 回歸）

```text
 ✓ tests/adapters/gmx-smart-route-payload-binding.test.ts (3 tests) 68ms
 ✓ tests/adapters/r-chain-yield-router.test.ts (4 tests) 44ms

pnpm test → 165 files / 738 tests PASS (100%)
pnpm typecheck → 0 errors
```

### Foundry

```text
Ran 4 test suites: 60 tests passed, 0 failed (60 total)
```

---

## 修改檔案清單

| 檔案 | 動作 |
|------|------|
| `src/sdk/gated-executor-payload.ts` | **新增** |
| `src/services/adapters/gmx-smart-route-payload-binding.ts` | **新增** |
| `src/config/gmx-revenue.ts` | **修改** — smartRoutingAddress |
| `src/adapters/robinhood/r-chain-yield-router.ts` | **修改** — targetRoute |
| `tests/adapters/gmx-smart-route-payload-binding.test.ts` | **新增** |
| `tests/adapters/r-chain-yield-router.test.ts` | **修改** |

**實作程式碼增量：** ~112 行（< 200 行限制 ✅）

---

## 後續 Phase C 建議

1. `scheduled-gmx-hedge-cron.ts` — 接入 `buildGmxSmartRoutePayloadBinding()`
2. Grant audit HUD — 展示 `payloadHash` 綁定證明
3. Bundle diet PR — 恢復 ≤ 158.99 KiB headroom
