# BeDelta Living Water — ZeroDev Smart Routing 深度解析

> **Vitest SSOT:** Proposal Baseline: 175 test files | 773 PASS (Current Branch Live: 176 test files | 775 PASS Clean)

> **分支：** `v1.0_push_BDLW`  
> **Pillar：** Pillar 2 — Firewall (Compliance) · Institutional Ingress  
> **SSOT：** `ZERODEV_SMART_ROUTE_TARGETS` · `buildGmxSmartRoutePayloadBinding()` · `GatedExecutor.payloadHash()`  
> **Baseline：** Vitest smart-route / across-bridge / payload-binding 全綠 · `lostUsd ≡ 0` 審計通過

---

## 1. 執行摘要

BeDelta Living Water（BDLW）將 **ZeroDev Smart Routing Address** 作為機構級跨鏈入金的主路徑：Robinhood Chain（`46630` / `4663`）上的 **USDG** 透過 ZeroDev Kernel **ERC-4337 UserOp**，一鍵完成跨鏈 deposit/swap 並路由至 Arbitrum One 上的 **`GMX_V2_EXCHANGE_ROUTER_ARBITRUM`**，最終進入 **`GM_ETH_USDC`** GM 池——全程 **非託管**、**單向 escort**、**calldata 級別綁定**。

與 Stargate、Hop 等傳統流動性橋不同，Smart Routing 將「跨鏈 + 帳戶抽象 + 目標 DEX 路由」收斂為 **單一 UserOp 語意**，並透過既有 `RiskAttestation.payloadHash` 欄位（**零 EIP-712 struct 修改**）與 `GatedExecutor` 鏈上驗證對齊。

---

## 2. 深度對比：ZeroDev Smart Routing vs. 傳統橋（Stargate / Hop）

### 2.1 架構模型差異

```text
傳統橋（Stargate / Hop 類）
─────────────────────────────────────────────────────────────
用戶 EOA
  │ ① approve 源鏈 token
  │ ② 呼叫 Bridge Router（swap/lock）
  │ ③ 等待 relayer / 流動性池結算（分鐘～小時）
  │ ④ 目標鏈領取 wrapped / 原生 token
  │ ⑤ 再次 approve + swap（若需進 DEX）
  │ ⑥ 進入 GMX / 其他協議
  ⇒ 多筆交易 · 多個合約信任面 · 用戶需管理兩鏈 gas

ZeroDev Smart Routing（BDLW）
─────────────────────────────────────────────────────────────
機構用戶 Kernel Smart Account（Robinhood Chain）
  │ ① 單一 UserOp：跨鏈 deposit/swap + 路由意圖
  │ ② ZeroDev Paymaster 代付 gas（可選）
  │ ③ 資金進入 Kernel（Arbitrum）· 非 Citadel 託管
  │ ④ Edge Shield：checkSoilResistance() pre-broadcast
  │ ⑤ payloadHash 綁定 → GMX ExchangeRouter calldata
  ⇒ 一鍵語意 · AA 帳戶 SSOT · Edge 次毫秒風控前置
```

### 2.2 多維度對照表

| 維度 | Stargate / Hop（傳統流動性橋） | ZeroDev Smart Routing（BDLW） |
|------|-------------------------------|------------------------------|
| **帳戶模型** | EOA 為主；跨鏈後需新錢包或手動匯入 | **Kernel Smart Account** 跨鏈延續同一 `sender` 身分 |
| **交易筆數** | 通常 **3–6 筆**（approve + bridge + claim + swap…） | **1 筆 UserOp**（含跨鏈 deposit/swap 語意） |
| **流動性來源** | 橋接池 / LP 深度；滑點與池子枯竭風險 | ZeroDev 路由 + 目標鏈 **GMX ExchangeRouter** 執行面 |
| **Gas 體驗** | 用戶需持有源鏈 + 目標鏈原生 gas | **Paymaster 代付**（`zerodev-aa-userop.ts`）可降低 onboarding 摩擦 |
| **合規邊界** | 雙向路由常見；AML 反向路徑難封鎖 | BDLW **單向 escort**（RH → Arb only）· inbound 預設拒絕 |
| **風控插入點** | 橋後才進協議；pre-execution gate 難前置 | Edge **`checkSoilResistance()`** 在廣播前攔截（p50 ~106 µs） |
| **鏈上綁定** | 橋 receipt 與 DEX 訂單通常無密碼學關聯 | **`GatedExecutor.payloadHash()`** 將 attestation 與 calldata 一對一綁定 |
| **資本損失會計** | 橋故障常記為「pending loss」 | BDLW 強制 **`lostUsd ≡ 0`**；in-flight 僅標記 `IN_FLIGHT_BRIDGE_CAPITAL` |
| **機構敘事** | 「我們接了一個橋」 | 「非託管 AA 入口 + Citadel pre-execution gate + GMX builder 路由」 |

### 2.3 為何 BDLW 不將 Stargate/Hop 作為主路徑

1. **合規單向性：** Robinhood Chain 機構資金必須 **outbound-only**（`46630`/`4663` → `42161`）。通用橋的雙向流動性與 BDLW 的 AML inbound 封鎖語意衝突（`AML_INBOUND_TO_ROBINHOOD_BLOCKED`）。
2. **Pre-execution SSOT：** Pillar 3 Shield 必須在 **任何 L2 廣播之前** 決策。傳統橋將資金先釋放到 EOA，風控閘門被迫後置。
3. **Payload 完整性：** 傳統橋無法將「橋接 leg」與「GMX 訂單 calldata」綁入同一 `RiskAttestation`；BDLW 透過 `GatedExecutor.payloadHash` 消除 **attestation 重放 / 路由劫持** 攻擊面。
4. **用戶摩擦：** 機構 Treasury 不應管理多鏈 seed phrase、兩套 gas、bridge claim 時窗；Kernel AA + Smart Routing 將 onboarding 壓縮為 **單一智能帳戶介面**。

> **補充：** Across 仍作為 **Robinhood → Arbitrum 合規 escort 的決策層參考實作**（`robinhood-across-bridge.ts`），與 ZeroDev Smart Routing **互補**而非互斥——Across 驗證單向性與 in-flight 會計；ZeroDev 執行 1-click UserOp 產品體驗。

---

## 3. BDLW 如何利用 ZeroDev Smart Routing

### 3.1 路由 SSOT：`ZERODEV_SMART_ROUTE_TARGETS`

```typescript
// src/config/gmx-revenue.ts（摘要）
export const ZERODEV_SMART_ROUTE_TARGETS = {
  46630: {  // Robinhood Testnet
    sourceChainId: 46630,
    destChainId: 42161,
    ingressAsset: "USDG",
    gmPoolRouteKey: "GM_ETH_USDC",
    smartRoutingAddress: GMX_V2_EXCHANGE_ROUTER_ARBITRUM,
  },
  4663: { /* Robinhood Mainnet — 同構 */ },
};
```

| 欄位 | 語意 |
|------|------|
| `ingressAsset` | 源鏈入金資產（**USDG**） |
| `smartRoutingAddress` | Arbitrum 執行目標（**GMX v2 ExchangeRouter**） |
| `gmPoolRouteKey` | 預設 GM 池（**ETH/USDC**） |
| `destChainId` | 永遠為 **Arbitrum One (`42161`)** |

`resolveZeroDevSmartRouteTarget(chainId)` 在 `r-chain-yield-router.ts` 與 `gmx-smart-route-payload-binding.ts` 中被消費，確保 **決策層與 payload 編碼層使用同一 SSOT**。

### 3.2 一鍵跨鏈 Deposit/Swap → Kernel Smart Account

**端到端流程：**

```text
┌─────────────────────────────────────────────────────────────────┐
│ Phase A — 決策層（鏈下 · fail-closed）                            │
│ quoteRChainYieldToArbitrumGm()                                   │
│   ├─ assertUnidirectionalBridge()  → RH→Arb only                │
│   ├─ 規模閘門 RWA_YIELD_MIN/MAX_USD                              │
│   └─ resolveZeroDevSmartRouteTarget() → ExchangeRouter 地址     │
└────────────────────────────┬────────────────────────────────────┘
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│ Phase B — Shield（Edge · pre-broadcast）                         │
│ checkSoilResistance() — 深度 / 滑點 / cross-venue fuse            │
│ runSmartRouteDepositPreview() — SPA 預覽 soil → gate 相位         │
└────────────────────────────┬────────────────────────────────────┘
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│ Phase C — Payload 綁定（零 EIP-712 變更）                        │
│ buildGmxSmartRoutePayloadBinding()                               │
│   ├─ encodeGmxSmartRouteBindingData(sourceChain, route, market) │
│   └─ computeGatedExecutorPayloadHash() → RiskAttestation 欄位     │
└────────────────────────────┬────────────────────────────────────┘
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│ Phase D — 執行（ERC-4337）                                       │
│ ZeroDev Kernel UserOp → GMX ExchangeRouter                       │
│ GatedExecutor.execute() / tryExecute() 鏈上驗證 payloadHash      │
└─────────────────────────────────────────────────────────────────┘
```

**1-Click 語意的技術含義：**

| 傳統多步 | Smart Routing 單步 |
|----------|-------------------|
| 橋接 USDG 到 Arbitrum | UserOp `callData` 內含跨鏈路由意圖 |
| 在 Arbitrum 建立 / 連接錢包 | 資金進入 **既有 Kernel `sender`** |
| 手動 swap USDC → GM | 路由至 **`GM_ETH_USDC`** market token |
| 分開簽署 GMX 訂單 | `orderPayload` digest 嵌入 binding `data` |

用戶感知為 **一次確認**；鏈上仍為標準 ERC-4337 UserOp，可被 bundler、paymaster、Gate 審計。

### 3.3 Calldata Hash 綁定：`GatedExecutor.payloadHash()`（零 EIP-712 修改）

**設計問題：** 若 `RiskAttestation` 僅證明「允許某 subject 交易」，攻擊者可將 ALLOW 重定向至任意 `target` / `calldata`——attestation 仍驗證通過。

**BDLW 解法：** 將 **完整執行意圖** 哈希寫入 attestation 既有 `payloadHash` 欄位，**不修改** `SliverVineGate.sol` 的 `ATTESTATION_TYPEHASH` 或 struct layout。

**鏈上公式（`GatedExecutor.sol`）：**

```solidity
payloadHash(initiator, target, data, nonce) =
  keccak256(abi.encode(
    block.chainid,
    address(this),      // executor 綁定 — 防跨 executor 重放
    initiator,          // 防 front-run 他人 attestation
    target,
    keccak256(data),
    nonce
  ))
```

**鏈下鏡像（`computeGatedExecutorPayloadHash`）：**

```typescript
// src/sdk/gated-executor-payload.ts
keccak256(abi.encode(
  chainId, executor, initiator, target, keccak256(data), nonce
))
```

**Smart Route 專用 `data` 編碼（`encodeGmxSmartRouteBindingData`）：**

```text
abi.encode(
  sourceChainId,     // uint256 — Robinhood 46630/4663
  targetRoute,       // string  — "GM_ETH_USDC"
  marketToken,       // address — GMX GM market token
  orderDigest        // bytes32 — keccak256(JSON(orderPayload))
)
```

**關鍵性質：**

| 性質 | 說明 |
|------|------|
| **EIP-712 不變** | `RiskAttestation(bytes32 payloadHash, ...)` 欄位語意不變；僅 **填入值** 改為 GatedExecutor digest |
| **nonce 防重放** | 篡改 nonce → `payloadHash` 改變 → `PayloadMismatch` |
| **target 白名單** | `restrictTargets` + `allowedTarget[GMX_V2_EXCHANGE_ROUTER_ARBITRUM]` |
| **測試錨定** | `gmx-smart-route-payload-binding.test.ts` 驗證鏈下 ≡ 鏈上公式 |

```text
RiskAttestation.payloadHash  ←── 填入 ──  computeGatedExecutorPayloadHash(...)
        │                                      │
        └──────── GatedExecutor.execute() 驗證 ──┘
                    att.payloadHash == payloadHash(msg.sender, target, data, att.nonce)
```

### 3.4 消除 Onboarding 摩擦，同時維持 `lostUsd ≡ 0`

**摩擦消除機制：**

| 摩擦點 | Smart Routing 對策 |
|--------|-------------------|
| 多鏈 gas | ZeroDev Paymaster 代付（EntryPoint v0.7） |
| 新用戶錢包 | Kernel Smart Account — 機構 IT 可預配 session key |
| 跨鏈 + DEX 學習曲線 | 單一「Deposit to GM Yield」產品語意（`smart-route-deposit-flow.ts`） |
| 簽名疲勞 | 單一 UserOp 取代 3–6 筆 EOA 交易 |

**`lostUsd ≡ 0` 不變量（與 onboarding 並行，非妥協）：**

```text
資本狀態機（assertUnidirectionalBridge + evaluateAcrossBridgeTransfer）
─────────────────────────────────────────────────────────────────────
outboundOk  ⇔  robinhood(src) ∧ dest = 42161
inboundBlock ⇔  ¬robinhood(src) ∧ robinhood(dest)  → AML_INBOUND_TO_ROBINHOOD_BLOCKED

inFlightUsd  →  標記 IN_FLIGHT_BRIDGE_CAPITAL（在途，非損失）
settledUsd   →  結算後入帳
lostUsd      →  恆為 0（除非 BRIDGE_TIMEOUT_FAIL_CLOSED 觸發 fail-closed，仍不預記損失）
```

| 規則 | 實作錨點 |
|------|----------|
| **單向 escort** | `assertUnidirectionalBridge()` · `unidirectional-bridge.ts` |
| **in-flight 不記損** | `evaluateAcrossBridgeTransfer()` · `IN_FLIGHT_BRIDGE_CAPITAL` |
| **SDK 硬斷言** | `lostUsd !== 0` → throw `ROBINHOOD_AUDIT_INVARIANT:lostUsd` |
| **審計匯出** | `exportRobinhoodAuditSnapshot()` · `lostUsd: 0 as const` |
| **超時 fail-closed** | `BRIDGE_TIMEOUT_FAIL_CLOSED` — 拒絕繼續，不將 in-flight 轉為 booked loss |

**Smart Routing 與 `lostUsd ≡ 0` 的關係：**

Smart Routing 改善的是 **執行路徑與 UX**，不是會計規則。無論資金經 ZeroDev UserOp 還是傳統 Across leg 決策，BDLW 的資本標籤語意一致：

- 協議 **永不託管用戶本金**（non-custodial Kernel）
- 在途資金 **永不預記為損失**
- inbound 污染路徑 **預設熔斷**

這使機構合規官可在審計報告中聲明：**「我們接入了 1-click 跨鏈入金，但資本損失不變量未放寬。」**

---

## 4. 程式碼錨點地圖

| 職責 | 檔案 |
|------|------|
| Smart Route SSOT | [`src/config/gmx-revenue.ts`](../../src/config/gmx-revenue.ts) |
| Payload 綁定 | [`src/services/adapters/gmx-smart-route-payload-binding.ts`](../../src/services/adapters/gmx-smart-route-payload-binding.ts) |
| 鏈下 hash 鏡像 | [`src/sdk/gated-executor-payload.ts`](../../src/sdk/gated-executor-payload.ts) |
| 鏈上驗證 | [`SliverVineGate/src/GatedExecutor.sol`](../../SliverVineGate/src/GatedExecutor.sol) |
| R-Chain 決策層 | [`src/adapters/robinhood/r-chain-yield-router.ts`](../../src/adapters/robinhood/r-chain-yield-router.ts) |
| 單向橋 escort | [`src/sdk/unidirectional-bridge.ts`](../../src/sdk/unidirectional-bridge.ts) |
| SPA 預覽流程 | [`src/components/hud/smart-route-deposit-flow.ts`](../../src/components/hud/smart-route-deposit-flow.ts) |
| 測試 | [`tests/adapters/gmx-smart-route-payload-binding.test.ts`](../../tests/adapters/gmx-smart-route-payload-binding.test.ts) |

---

## 5. 驗證指令

```bash
# Smart Route payload ↔ GatedExecutor 公式對齊
pnpm exec vitest run tests/adapters/gmx-smart-route-payload-binding.test.ts

# SPA deposit → soil → payloadHash 預覽
pnpm exec vitest run tests/components/smart-route-deposit-flow.test.ts

# Robinhood 單向橋 + lostUsd ≡ 0
pnpm exec vitest run tests/adapters/robinhood-across-bridge.test.ts
pnpm exec vitest run tests/sdk/citadel-sdk-bridge-armor.test.ts

# GatedExecutor 鏈上單元測試
cd SliverVineGate && forge test --match-contract GatedExecutor
```

---

## 6. 設計鐵律（審計對照）

| 鐵律 | Smart Routing 如何遵守 |
|------|------------------------|
| Edge pre-broadcast SSOT | `checkSoilResistance()` 在 UserOp 廣播前執行 |
| EIP-712 struct 不變 | `payloadHash` 欄位重用 · 無 `ATTESTATION_TYPEHASH` 變更 |
| 非託管 | 資金在 Kernel Smart Account · Citadel 不持有私鑰 |
| 單向 AML | RH → Arb only · inbound 封鎖 |
| `lostUsd ≡ 0` | in-flight 標記 · SDK 硬斷言 · 審計 snapshot 型別鎖定 |
| Fail-closed | soil trip · bridge timeout · `PayloadMismatch` 均拒絕執行 |

---

## 7. 參考文件

- [`docs/architecture/TECHNICAL_SPECIFICATION.md`](../architecture/TECHNICAL_SPECIFICATION.md) §2.3 · §4.0 EIP-712
- [`docs/sdk/CITADEL_SDK_BLUEPRINT.md`](../sdk/CITADEL_SDK_BLUEPRINT.md) §1 Non-Custodial Escort
- [`docs/audit/ROBINHOOD_CHAIN_SAFETY_GATE_AUDIT.md`](../audit/ROBINHOOD_CHAIN_SAFETY_GATE_AUDIT.md) §2.4 `lostUsd ≡ 0`
- [`docs/internal/HOT_COLD_PATH_DECOUPLING.md`](./HOT_COLD_PATH_DECOUPLING.md) — Edge 熱路徑與 Smart Route fetch 路徑協作
