# BeDelta Living Water — 動態 Delta-Neutral Vault 三十條黃金不變量

> **分支：** `v1.0_push_BDLW`  
> **角色：** Lead Quant & Systems Risk Architect  
> **產品：** BDLW Dynamic Delta-Neutral Vault（GMX v2 GM + Hyperliquid 1× Short）  
> **Baseline：** p50 **~106 µs** Wasm Soil Engine · `lostUsd ≡ 0` · Vitest 773 PASS (Proposal Baseline) · Defense Matrix R01–R20  
> **關聯：** [`TECHNICAL_SPECIFICATION.md`](../architecture/TECHNICAL_SPECIFICATION.md) · [`HOT_COLD_PATH_DECOUPLING.md`](./HOT_COLD_PATH_DECOUPLING.md)

---

## 0. 執行摘要

本文件定義 BDLW 動態 Delta-Neutral Vault 在 **六個核心風險維度** 下的 **三十條黃金不變量（Golden Invariants, GI-01–GI-30）**。每條不變量均：

1. 可映射至程式碼 SSOT 或 R01–R20 防禦矩陣；
2. 在 pre-execution 階段 **fail-closed**（拒絕優於放行）；
3. 與 **106 µs Wasm Soil Engine**、**`lostUsd ≡ 0`**、**uiFeeReceiver (+5 bps ~ +10 bps)**、**ZeroDev Session Keys** 四項 BDLW 核心錨點對齊。

```text
┌─────────────────────────────────────────────────────────────────┐
│  GI-01–05   費用與利差覆蓋（Fee & Spread > Costs）               │
│  GI-06–10   盤口與滑點追蹤（Orderbook & Slippage）               │
│  GI-11–15   GMX v2 GM Pool 內部結構                             │
│  GI-16–20   微秒級預執行風控（Soil Engine · 106µs）              │
│  GI-21–25   密碼學與資產安全（Crypto · lostUsd ≡ 0）             │
│  GI-26–30   巨觀市場與多場執行（Macro · Multi-Venue）            │
└─────────────────────────────────────────────────────────────────┘
         ▲                              ▲
    ZeroDev Session Keys          Wasm pkg/soil_core.wasm
    ORDER_EXECUTE · R06/R07       checkSoilResistance() p50 ~106µs
```

| 符號 | 定義 |
|------|------|
| **GI-xx** | Golden Invariant 編號 |
| **Rxx** | Defense Matrix 對應條目 |
| **⊥** | Fail-closed 拒絕執行 |
| **Δ** | Delta-neutral（GM long exposure + HL 1× short） |

---

## 1. 費用與利差覆蓋條件（Fee & Spread Arbitrage > Costs）

> **量化原則：** 任何一筆 vault 流量在 **扣除全成本** 後，預期淨利差必須為正；否則 ⊥。

| ID | 不變量 | 形式化條件 | SSOT / 錨點 |
|----|--------|-----------|------------|
| **GI-01** | **Builder UI Fee 下限** | 每筆 GMX increase/decrease 必須綁定 `uiFeeReceiver` · **+5 bps**（`GMX_UI_FEE_BPS`） | `gmx-revenue.ts` · `GMX_UI_FEE_RECEIVER` |
| **GI-02** | **Skew Neutralizer 溢價帶** | Underweight-side 合格流量可捕獲 **+5 bps ~ +10 bps** 價格影響回扣；**不得**與 UI fee 或績效費混淆 | `gmx-v2-balancer` · TECH SPEC §3.1 |
| **GI-03** | **淨利差 > 全成本** | $\mathrm{NetSpread} = \mathrm{GMYield} + \mathrm{SkewRebate} + \mathrm{uiFee} + \mathrm{FundingCushion} - \mathrm{Gas} - \mathrm{BridgeFriction} - \mathrm{HLFundingCost} > 0$ | `multi-wallet-yield-router.ts` · grant-audit APY band |
| **GI-04** | **Gas-Yield 比率熔斷** | 當 ArbOS base-fee 加速度使單筆 gas 成本 > 目標 yield band → ⊥ 廣播 | `arbitrum-gas-guard.ts` · Tri-Sensor BaseFee Velocity |
| **GI-05** | **Paymaster 代付上限** | ZeroDev 單筆代付 ≤ **$0.50** · 24h 滾動 ≤ **$10**；超限 → `ZERODEV_GAS_LIMIT_EXCEEDED_TRIP` | `zerodev-aa-gas-ledger.ts` · §2.4.3 |

**BDLW 錨點：** Dynamic APY UI 區間（如 14.2% ~ 21.8%）為 **非保證估計**，必須滿足 GI-01–GI-03 方可進入 vault 路由決策層。

---

## 2. 盤口與滑點追蹤條件（Orderbook & Slippage Control）

> **量化原則：** 本地深度與跨場滑點必須在 fuse 內；超限觸發 soil trip 或 TWAP 切片，絕不市價掃單。

| ID | 不變量 | 形式化條件 | SSOT / 錨點 |
|----|--------|-----------|------------|
| **GI-06** | **根滑點熔斷** | $\mathrm{CrossVenueSlip} \leq \mathrm{MAX\_SLIPPAGE} = 0.5\%$；超限 → ⊥ | `soil-resistance-types.ts` · R01 |
| **GI-07** | **大單價格衝擊上限** | 機構單筆對 GM 本地深度的價格衝擊 **≤ 10 bps**；超限 → `checkSoilResistance()` trip | TECH SPEC §1.2 · R01 |
| **GI-08** | **HL L2 深度地板** | Hyperliquid L2 book 回應 **> 500 ms** 或深度不足 → fail-closed（R03） | `hl-l2-book-types.ts` · `evaluateHlOrderbookGapGuard()` |
| **GI-09** | **跨場淨滑點 TWAP** | 淨跨場滑點 **> 0.5%** → soil trip + **TWAPEngineV2** Poisson 切片（18s–110s · 12–18 min 父窗口） | `twap-engine-v2.ts` · §3.2 |
| **GI-10** | **PGATE 延遲熔斷** | 外部 RPC / venue RTT **> 200 ms**（`PGATE_MAX_LATENCY_MS`）→ ⊥ 簽章管線 | R04 · `rpc-whitelist.ts` |

**BDLW 錨點：** Soil Engine 在 **106 µs** 內評估 GI-06/GI-07；盤口追蹤與微秒風控分層——深度 probe 可 async，決策 fuse 不可延後。

---

## 3. GMX v2 GM Pool 內部結構條件（GMX Pool Mechanics）

> **量化原則：** 僅在 **減少 GM skew** 的 underweight 側路由；單一藍籌錨點（v0.9 ETH/USDC）降低 oracle 脫錨面。

| ID | 不變量 | 形式化條件 | SSOT / 錨點 |
|----|--------|-----------|------------|
| **GI-11** | **Underweight 資格** | `isGmxBalancerQualified` = true 僅當流量 **減少** GM pool 多空偏斜 | `gmx-v2-balancer.ts` |
| **GI-12** | **藍籌範圍鎖定（v0.9）** | 生產錨點 = **ETH/USDC GM**（`GM_ETH_USDC`）；BTC/USDC = V1.0 同構擴展 | `gmx-markets.ts` · TECH SPEC §1.1 |
| **GI-13** | **非同步結算窗口** | GMX keeper create→settle **3–5 min**；會計不得假設原子結算 | `GMX_REDEMPTION_WINDOW` · §5.1 |
| **GI-14** | **Receiver 不變量** | UserOp 解碼後 `sender ≡ receiver`；違反 → ⊥（ bytecode predicate） | TECH SPEC §0.1 · R01 |
| **GI-15** | **acceptablePrice 邊界** | 執行參數須 bound-check 對 oracle-lag 感測器；漂移 → ⊥ | `soil-resistance.ts` · oracle-lag fuse |

**BDLW 錨點：** ZeroDev Smart Routing 將 USDG 路由至 `GMX_V2_EXCHANGE_ROUTER_ARBITRUM` 時，GI-11–GI-15 須在 **pre-broadcast** 全部通過。

---

## 4. 微秒級預執行風控條件（Soil Engine Invariants）

> **量化原則：** **Pillar 3 Shield** 為技術護城河；任何 L2 廣播前必須通過 Wasm 土壤 fuse。

| ID | 不變量 | 形式化條件 | SSOT / 錨點 |
|----|--------|-----------|------------|
| **GI-16** | **106 µs 決策 SLO** | E2E Shield p50 **~106 µs**；SLO **< 1.0 ms** | `checkSoilResistance()` · resilience benchmark |
| **GI-17** | **Wasm 暖路徑預算** | `pkg/soil_core.wasm` warm exec **< 60 µs** · binary **< 28 KiB** | `soil_core.rs` · M4 · `soil-wasm.ts` |
| **GI-18** | **Dynamic Max SL** | $\mathrm{MaxSL} = \mathrm{Balance} \times 1\% + \$100$；**禁止**固定 $50 SL | `effective-max-sl.ts` · R11 · Wasm `soil_core_eval` |
| **GI-19** | **AllowedToSign 謂詞** | $\mathrm{AllowedToSign} = \mathrm{Injection} \land \mathrm{Digest} \land \mathrm{Soil} \land \mathrm{Session} \land \mathrm{Gas} \land \mathrm{Attestation} \land \mathrm{Armor} \land \mathrm{Wasm}$ | TECH SPEC §3.1 · `verifyAgentIntent()` |
| **GI-20** | **土壤熔斷傳播** | `soil.tripped` → 拒絕 ZeroDev Paymaster 代付 · 拒絕 HL session 簽章 · 拒絕 GMX payload 注入 | `zerodev-aa-static-breaker.ts` · `severSigningChannel()` |

**BDLW 錨點：** **106 µs Wasm Soil Engine** 是 GI-16–GI-20 的物理實現；Hot/Cold Path 解耦確保 cron 對沖 **不污染** 此 Isolate 的 heap/GC（見 `HOT_COLD_PATH_DECOUPLING.md`）。

---

## 5. 密碼學與資產安全條件（Cryptographic & Structural Safety）

> **量化原則：** 協議 **非託管**；資本損失在會計上 **恆為零** 直至明確超時 fail-closed。

| ID | 不變量 | 形式化條件 | SSOT / 錨點 |
|----|--------|-----------|------------|
| **GI-21** | **lostUsd ≡ 0** | $\mathrm{lostUsd} = 0$ 恆成立；in-flight 僅標記 `IN_FLIGHT_BRIDGE_CAPITAL` | `unidirectional-bridge.ts` · `robinhood-audit-snapshot.ts` |
| **GI-22** | **Payload 密碼學綁定** | `att.payloadHash == GatedExecutor.payloadHash(initiator, target, keccak256(data), nonce)` | `GatedExecutor.sol` · `gated-executor-payload.ts` |
| **GI-23** | **EIP-712 單次消耗** | `RiskAttestation` digest 於 `verifyAndConsume` **consume-once**；重放 ⊥ | `SliverVineGate.sol` · R14 |
| **GI-24** | **ZeroDev Session Key 範圍** | Session key 僅 `ORDER_EXECUTE` · 名目 ≤ **$5,000**（R06/R07）· TTL + 5-min re-auth（R14） | `hl-session/permissions.ts` · `zerodev-aa/` |
| **GI-25** | **物理死鎖安全（R20）** | Flatten 失敗 → `rootProtection()` · `R20_FLATTEN_FAILED` · 切斷 Hot Key 簽章管線 | `flatten-hardlock.ts` · `root-protection.ts` |

**BDLW 錨點：** **ZeroDev Session Keys** 提供 GI-24 的鏈上權限邊界；**lostUsd ≡ 0**（GI-21）是機構審計與 Robinhood 單向 escort 的 **硬性會計不變量**，UI 安全註腳與 SDK `assertUnidirectionalBridge()` 均強制此條。

---

## 6. 巨觀市場與策略維度條件（Macro & Multi-Venue Execution）

> **量化原則：** Δ-neutral 三角流動性環路；Arbitrum One 為 yield 重心；HL 為 Emergency Liquidity Sponge。

| ID | 不變量 | 形式化條件 | SSOT / 錨點 |
|----|--------|-----------|------------|
| **GI-26** | **Δ-neutral 對沖比** | GM long exposure 對沖以 HL **1× short**；漂移 > $10 → cron hedge 調整 | `scheduled-gmx-hedge` · Cold Path cron |
| **GI-27** | **單向合規 escort** | Robinhood `46630`/`4663` → Arbitrum `42161` only；inbound → `AML_INBOUND_TO_ROBINHOOD_BLOCKED` | `unidirectional-bridge.ts` · GI-21 |
| **GI-28** | **Funding 政權降槓桿** | 持續負 funding → Day 8/15/22 三階段 delever（R12） | `funding-regime-guard.ts` |
| **GI-29** | **日內損失斷路（R17）** | 日內 PnL 觸發 severance → 切斷新風險 · 僅允許 flatten | `circuit-breaker.ts` |
| **GI-30** | **黑天鵝速度熔斷（R13）** | 極端波動窗口 → `black-swan-guard-core` speed-halt · 全三角 ⊥ 新開倉 | R13 · Tri-Sensor Matrix |

**BDLW 錨點：** GI-26 的對沖 leg 由 **獨立 Cron Worker**（`worker-cron-entry.ts`）執行，確保 GI-16 的 **106 µs** 風控閘門不受 viem/HL 簽章堆疊影響。

---

## 7. 不變量交叉索引

### 7.1 GI → Defense Matrix (R01–R20)

| GI | R 映射 | GI | R 映射 |
|----|--------|----|--------|
| GI-06, GI-07, GI-16–GI-20 | R01 | GI-24 | R06, R07, R14 |
| GI-25 | R20 | GI-08 | R03 |
| GI-10 | R04 | GI-18 | R11 |
| GI-28 | R12 | GI-29 | R17 |
| GI-30 | R13 | GI-09 | R09 (Saga/TWAP) |

### 7.2 四項 BDLW 核心錨點覆蓋

| 錨點 | 覆蓋 GI |
|------|---------|
| **106 µs Wasm Soil Engine** | GI-16, GI-17, GI-19, GI-20 |
| **lostUsd ≡ 0** | GI-21, GI-27 |
| **uiFeeReceiver +5 bps ~ +10 bps** | GI-01, GI-02, GI-03 |
| **ZeroDev Session Keys** | GI-05, GI-19, GI-24 |

### 7.3 驗證指令

```bash
pnpm test                                          # 773 PASS (Proposal Baseline) · soil / bridge / aa gates
pnpm exec vitest run tests/defense-matrix.test.ts  # R11 Dynamic Max SL · R20
pnpm exec vitest run tests/adapters/robinhood-across-bridge.test.ts  # lostUsd ≡ 0
pnpm exec vitest run tests/services/wasm-feasibility-lib/soil-core-sim.test.ts  # <60µs · <28KiB
cd SliverVineGate && forge test --match-contract GatedExecutor  # GI-22 payload binding
```

---

## 8. 參考文件

| 文件 | 用途 |
|------|------|
| [`TECHNICAL_SPECIFICATION.md`](../architecture/TECHNICAL_SPECIFICATION.md) | R01–R20 · 正式風險方程式 |
| [`ZERODEV_SMART_ROUTING_DEEP_DIVE.md`](./ZERODEV_SMART_ROUTING_DEEP_DIVE.md) | Smart Routing · payloadHash |
| [`HOT_COLD_PATH_DECOUPLING.md`](./HOT_COLD_PATH_DECOUPLING.md) | 106 µs 隔離 · GI-20/GI-26 |
| [`WASM_STYLUS_DUAL_ENGINE_ROADMAP.md`](./WASM_STYLUS_DUAL_ENGINE_ROADMAP.md) | Soil Engine V1.0 擴展 |
| [`CITADEL_SDK_BLUEPRINT.md`](../sdk/CITADEL_SDK_BLUEPRINT.md) | SDK `assertUnidirectionalBridge()` |

---

*本文件為 BDLW Vault 量化風控 SSOT。任何違反 GI-xx 的執行路徑必須 fail-closed（⊥），不得以「事後對帳」替代 pre-execution 攔截。*
