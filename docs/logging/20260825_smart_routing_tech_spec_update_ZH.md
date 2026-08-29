# Smart Routing 技術規格更新日誌

**日期：** 2026-08-25  
**分支：** `v1.0_push_BDLW`  
**範圍：** `docs/architecture/TECHNICAL_SPECIFICATION.md`

---

## 變更摘要

將 ZeroDev Smart Routing Address 整合寫入 Pillar 2（Firewall）架構描述。

| 區段 | 更新 |
|------|------|
| **§0 管線圖** | Firewall 方塊新增 ZeroDev Smart Routing Address（1-Click Crosschain Deposit/Swap） |
| **§0 Pillar 表** | Firewall 列擴充 `ZERODEV_SMART_ROUTE_TARGETS` · `GatedExecutor.payloadHash()` 綁定 |
| **§2 三角迴路** | Ingress 列新增 Smart Routing Address 說明 |
| **§2.3（新，位於 §2.2 之後）** | ZeroDev Smart Routing 精簡規格 + `GatedExecutor.payloadHash()` calldata 綁定說明 |

## Payload Binding 澄清

- 綁定發生於 **`GatedExecutor.payloadHash(initiator, target, data, nonce)`** calldata 層
- Edge：`computeGatedExecutorPayloadHash()` · `buildGmxSmartRoutePayloadBinding()`
- 結果寫入既有 `RiskAttestation.payloadHash` 欄位
- **`SliverVineGate.sol` EIP-712 struct / `ATTESTATION_TYPEHASH` 未修改**

## 程式錨點

- `src/config/gmx-revenue.ts` — `GMX_V2_EXCHANGE_ROUTER_ARBITRUM`
- `src/services/adapters/gmx-smart-route-payload-binding.ts`
- `SliverVineGate/src/GatedExecutor.sol`

## 行數預算

- 修改 **85 insertions / 10 deletions**（< 100 行，符合任務限制）
