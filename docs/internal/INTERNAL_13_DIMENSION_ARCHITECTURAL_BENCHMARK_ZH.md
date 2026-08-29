# SilverVine Protocol (v0.8 Santenmoku) — 內部 13 維度 Web3/HFT 架構對照與技術優勢白皮書

> **文件分類：** 內部 SSOT · 限 SilverVine Labs 工程 / 法務 / 專利審查  
> **實體：** SilverVine Labs · **協議品牌：** SliverVine · **引擎代號：** Santenmoku v0.8  
> **公開對照矩陣：** [`TECHNICAL_SPECIFICATION.md` §6.7](../architecture/TECHNICAL_SPECIFICATION.md#67-architectural-benchmark-silvervine-high-performance-innovations-vs-legacy-web3-standards)（10 維度）  
> **隱藏寶石詳述：** [`ADVANCED_HFT_PATENTS_AND_HIDDEN_GEMS.md`](./ADVANCED_HFT_PATENTS_AND_HIDDEN_GEMS.md)（英文專利備忘錄）

---

## 執行摘要

SilverVine Citadel 協議在 **Arbitrum One** 上刻意偏離傳統 ERC/EIP「鏈上治理 + 事後分析」範式，改以 **Edge 亞毫秒反射層（p50 ~106 µs）** 作為產品重心。本白皮書將 **10 項公開基準維度** 與 **3 項內部隱藏寶石（Hidden Gems）** 合併為 **13 維度** 完整對照，供內部決策、專利佈局與專家問答使用。

**核心命題：** LLM / AI Agent 是「大腦（秒級）」；Citadel 是「小腦（微秒級）」—— 在 MEV、LVR、跨場滑點造成不可逆損失 **之前** 完成 fail-closed 拒絕。

---

## 13 維度總覽矩陣

| # | 維度 | 傳統 Web3 標準 | SilverVine 工程標準 | 延遲 / Gas 優勢 |
|---|------|----------------|---------------------|-----------------|
| 1 | AI Agent 拒絕證明 | EIP-712 ECDSA | HMAC-SHA256 Session Proof | **~200×**（<12µs vs 1.2–3.5ms） |
| 2 | Session Key 授權閘門 | ERC-4337 Bundler | SystemState Single-flight | **<1ms** vs 50–500ms+ |
| 3 | 物理死鎖斷路器 | OpenZeppelin Pausable | Edge R17/R20 Severing | **<1ms** vs ≥12s（主網 1 block） |
| 4 | 不可逆風控毒丸 | Ownable pause | `STATUS_SHUTDOWN` Flush | 單向 · 無 unpause |
| 5 | 盤口算子 | EVM SLOAD 迴圈 | Wasm + Stylus Coprocessor | p50 ~106µs · Wasm <60µs |
| 6 | 門神 Attestation | 可重放簽章 | Consume-once EIP-712 | ~26k gas · TTL ≤30s |
| 7 | AA 預篩 | Bundler 盲目重試 | EIP-7562 Static Breaker | <1ms · 0-Gas fail-closed |
| 8 | 反抄襲 Honeypot | 公開 RPC 列表 | Trap Hosts 99% 合成 slippage | <1ms decoy |
| 9 | 前端信任鏈 | 客戶端信任地址 | G11 鏈上 domain 指紋 | 一次 eth_call |
| 10 | 防禦姿勢 | 事後分析（分鐘–天） | `checkSoilResistance()` 廣播前攔截 | p50 ~106µs |
| 11 | **[Hidden Gem]** 非對稱 Timelock | 對稱治理投票 | 收緊 0 延遲 / 放寬 1h–24h | 被盜 key 只能 halt |
| 12 | **[Hidden Gem]** 動態 Gas-Cap 預篩 | Validation 階段才拒絕 | Edge 0-Gas 丟棄 UserOp | 零 Bundler RTT 浪費 |
| 13 | **[Hidden Gem]** 單向護送 | 雙向 bridge 會計 | `lostUsd ≡ 0` 不變量 | 避免連鎖清算誤報 |

---

## 維度 1：AI Agent 拒絕證明（Sub-ms Rejection Proof）

### 傳統標準
[EIP-712](https://eips.ethereum.org/EIPS/eip-712) 結構化資料 + secp256k1 ECDSA。每筆拒絕需錢包 / HSM 簽章，典型延遲 **1.2 ms – 3.5 ms**（含 IPC、硬體錢包、瀏覽器擴充）。

### SilverVine 標準
**Sub-ms M2M Rejection Standard** — `agent-citadel-guard`（`src/core/agent-citadel-guard.ts`）以確定性 **HMAC-SHA256 Session Proof** 產生拒絕審計軌跡，Edge 預算 **< 12 µs**。

| 項目 | 說明 |
|------|------|
| **入口** | `evaluateAgentCitadelGuard()` · `guardAgentUserOp()` |
| **觸發** | 跨場滑點 / 深度 deadman（預設 50 bps） |
| **輸出** | `AgentMemoryRejectPayload` + session proof stub |
| **結算平面** | EIP-712 保留給 `SliverVineGate.verifyAndConsume()` 人類 / 鏈上結算 |

### 架構理由
高頻 AI Trading Swarm 在拒絕風暴時若以 EIP-712 簽每筆 reject，會形成 **DoS 向量**（簽章隊列阻塞）。分離 M2M 反射平面與結算平面，達 **~200×** 延遲縮減且保留可審計拒絕紀錄。

---

## 維度 2：Session Key 授權閘門

### 傳統標準
[ERC-4337](https://eips.ethereum.org/EIPS/eip-4337) UserOp → Bundler → EntryPoint `validateUserOp`。網路 RTT + mempool 佇列典型 **50 – 500 ms+**。

### SilverVine 標準
**SystemState Single-flight** — 在 HL / GMX 簽名離開 Edge **之前** 完成授權裁決。

| 模組 | 職責 |
|------|------|
| `session-key-gates.ts` | R06/R07 notional clip · R20 hardlock · `severSigningChannel()` |
| `hl/auth/signing-gate.ts` | `assertSigningChannelOpen()` · soil trip 403 |
| `fool-proof-guard.ts` | L0 Vine Shield — 零售 20% 倉位 / 5× 槓桿上限 |

### 架構理由
Bundler 負責 **投遞** 已通過 Shield 的 intent，而非作為第一道風控。結構性 session scope 在進程內 **< 1 ms** 完成，避免「結構合法但經濟有毒」的 UserOp 進入 AA 管線。

---

## 維度 3：物理死鎖斷路器（Circuit Breaker）

### 傳統標準
OpenZeppelin `Pausable` — `pause()` 需上鏈交易，主網 **≥ 1 block（~12 s）**，Arbitrum **~250 ms** 仍遠慢於 HFT 反射需求。

### SilverVine 標準
**Edge 物理 sever** — R17 日限額 / R20 CRI=0 觸發 `severCircuitBreakerPipeline()`（`circuit-breaker-sever.ts`）：

```text
R17/R20 trip → severSigningChannel() → enterReadOnlyObserver()
            → "[CRITICAL] PHYSICAL_DEADLOCK_TRIGGERED: EIP-712 Signature Pipe Severed"
```

| 項目 | 數值 |
|------|------|
| Edge sever 延遲 | **< 1 ms**（進程內） |
| 鏈上備援 | `SliverVineGate.halt()` — Guardian 即時 kill switch |
| 動態 Max SL | `Balance × 1% + $100`（`root-protection.ts`） |

### 架構理由
毒性成交視窗必須在 **mempool 曝光前** 關閉。鏈上 pause 是結算平面備援，非熱路徑反射。

---

## 維度 4：不可逆風控毒丸（Risk Oracle Flush）

### 傳統標準
`Ownable` / `Pausable` — 管理員可 `unpause()`，存在治理延遲與權限濫用面。

### SilverVine 標準
`SliverVineRiskOracle.applySignedReport(STATUS_SHUTDOWN)` → **`isSystemFlushed = true`（永久、不可逆）**。

| 元件 | 行為 |
|------|------|
| `SliverVineRiskOracle.sol` | EIP-712 `RiskReport` · offline signer · SLO 視窗 |
| `IngressSafetySwitch.sol` | 讀取 flush 狀態 · `gateAddress()` revert `SLO_TIMEOUT` |
| Edge 讀取 | `risk-oracle-gate.ts` — ZeroDev UserOp fail-closed |

### 架構理由
合規 ingress 需 **單向毒丸** 而非可逆開關。無獨立 admin surface 的 `IngressSafetySwitch` 僅反映 oracle 狀態，降低 fork 繞過面。

---

## 維度 5：盤口算子（Soil Compute Parity）

### 傳統標準
Solidity 內嵌 oracle `SLOAD`、storage 迴圈 — gas 密集、區塊綁定、不適合 HFT 熱路徑。

### SilverVine 標準
雙平面算子 parity：

| 平面 | 實作 | 延遲 / 特性 |
|------|------|-------------|
| **Edge Wasm** | `pkg/soil_core.wasm`（`#![no_std]`） | p50 **~106 µs** · warm **< 60 µs** · budget **< 28 KiB** |
| **鏈上 Stylus** | `SliverVineSoilCoprocessor` · u128 定點 | 無狀態 · `depth_usd < 10_000` fail-closed |
| **TS 編排** | `checkSoilResistance()` | Sequencer · RPC jitter · cross-spread · GMX impact |

### 架構理由
廣播前數學必須在 Edge 以 HFT 速度執行；Stylus 提供 grant / 審計用的鏈上可驗證 parity，**永不**作為更弱的熱路徑替代。

---

## 維度 6：門神 Attestation 證明

### 傳統標準
可重放簽章、可升級 Proxy — 一張 ALLOW 可被重定向至惡意 calldata。

### SilverVine 標準
**Consume-once EIP-712** — `SliverVineGate` + `GatedExecutor`：

| 不變量 | 實作 |
|--------|------|
| I6 Replay | `consumed[digest] = true` 於 external call **之前** |
| Payload 綁定 | `GatedExecutor.payloadHash(chainId, executor, initiator, target, data, nonce)` |
| Gas | `verifyAndConsume` **~25,853 – 28,043** median |
| TTL | **≤ 30 s**（`MAX_TTL`） |
| 不可升級 | 無 proxy · 新版本 = 新地址 |

### 架構理由
鏈上門神的唯一職責是讓「繞過 off-chain Citadel 引擎」在鏈上 **不可達**。

---

## 維度 7：AA 預篩（AA Bundler Pre-screen）

### 傳統標準
Bundler 拒絕後盲目重試 — 浪費 RTT、可能觸發 EIP-7562 storage 違規。

### SilverVine 標準
**EIP-7562 Zero-Bundler-Rejection Invariant** — `evaluateStaticBreakerMatrix()`（`zerodev-aa-static-breaker.ts`）：

```text
soil trip? → deny sponsorship + deny broadcast（序列評估）
gas cap exceeded? → ZERODEV_GAS_LIMIT_EXCEEDED_TRIP
```

| 項目 | 說明 |
|------|------|
| 延遲 | Edge **< 1 ms** |
| Gas | 拒絕的 UserOp **0-Gas**（未送達 Bundler） |
| SSOT | `zerodev-aa-send-userop.ts` · `zerodev-kernel-adapter.ts` |

### 架構理由
杜絕「已付 gas 但應被阻擋」的 UserOp 進入 Bundler 管線。

---

## 維度 8：反抄襲 Honeypot 誘捕

### 傳統標準
公開 RPC endpoint 列表 — fork 前端可直接複製端點取得真實狀態。

### SilverVine 標準
**RPC Trap Hosts** — `evaluateRpcDefenseGate()`（`rpc-fetch-gate-eval.ts`）：

| 項目 | 值 |
|------|-----|
| Trap 主機 | `*.silvervine-clone.trap` · `*.santenmoku-scraper.trap` 等 |
| 未認證請求 | `HONEYPOT_ACTIVE` · **99% 合成 slippage** · HTTP 500 |
| 解鎖 | Layout Metric operator unlock 剝離 trap hosts |

### 架構理由
Anti-copycat：未授權爬蟲取得 **假遙測** 而非生產狀態，提高 fork 維護成本。

---

## 維度 9：前端信任鏈（Frontend Trust）

### 傳統標準
前端硬編碼 `verifyingContract` — 劫持 UI 可指向偽造 Gate。

### SilverVine 標準
**G11 Domain Fingerprint** — `verifyGateDomainSeparator()`（`gate-domain-fingerprint.ts`）：

```text
on-chain domainSeparator()  ←compare→  本地 EIP-712 重算（SliverVineCitadel v1 + chainId + gateAddress）
```

| UI | `GateDomainFingerprintBadge` · `AuditTopBar` Demo HUD |
| Sepolia Gate | `0xb174118bC0B84e8D6D59EEF2339e29bF7FCf8BF1` |

### 架構理由
一次 `eth_call` 即可偵測前端是否指向正版 Gate 合約。

---

## 維度 10：防禦姿勢（Interceptor Moat）

### 傳統標準
Gauntlet / Chaos Labs — 事後參數調整（分鐘至數天）。

### SilverVine 標準
**`checkSoilResistance()`** 內聯於每條廣播路徑，**p50 ~106 µs**：

| 感測器 | 觸發 |
|--------|------|
| Sequencer guard | ArbOS 不安全 |
| RPC jitter radar | 相位不同步 |
| Cross-spread / GMX impact | 跨場滑點 |
| HL orderbook gap | 深度不足 |
| Tsunami shield | HKT 21–23 鎖定 |

### 架構理由
MEV / LVR 損害應 **預防**，而非成交後再平衡。

---

## 維度 11：[Hidden Gem 1] EIP-712 非對稱 Timelock 治理

> 詳見英文備忘錄：[`ADVANCED_HFT_PATENTS_AND_HIDDEN_GEMS.md` §1](./ADVANCED_HFT_PATENTS_AND_HIDDEN_GEMS.md#1-asymmetric-risk-timelock-governance-enhancing-eip-712)

### 傳統標準
對稱治理 — `pause` / `unpause` 同等權限、同等延遲；被盜 admin key 可立即放寬風控。

### SilverVine 標準
`SliverVineGate.sol` **非對稱權威模型**：

| 動作 | 延遲 | 角色 |
|------|------|------|
| `halt()` | **0**（即時） | Guardian / Admin |
| `scheduleUnhalt()` | **1 hour**（`UNHALT_DELAY`） | Admin only |
| `proposeSignerChange()` | **24 hours**（`SIGNER_TIMELOCK`） | Admin only |
| 收緊（halt） | 立即 | 被盜 key **只能停機** — 安全方向 |

### 架構理由
在 EIP-712 Gate 層嵌入 **不對稱安全學**：緊急收緊零延遲，任何放寬行為強制 timelock，符合 institutional OpSec 最佳實踐。

---

## 維度 12：[Hidden Gem 2] EIP-7562 無狀態動態 Gas-Cap 預篩

> 詳見：[`ADVANCED_HFT_PATENTS_AND_HIDDEN_GEMS.md` §2](./ADVANCED_HFT_PATENTS_AND_HIDDEN_GEMS.md#2-stateless-dynamic-gas-cap-pre-screening-enhancing-eip-7562)

### 傳統標準
EIP-7562 約束在 Bundler **Validation Phase** 才暴露違規 — 已消耗網路與排程成本。

### SilverVine 標準
Edge **無狀態** 預篩矩陣（`evaluateStaticBreakerMatrix` + `evaluateSponsoredGasLimits`）：

| 檢查 | 行為 |
|------|------|
| Soil fuse tripped | 拋出 `TRIP_SOIL_RESISTANCE` — **0-Gas** |
| `estimatedGasCostUsd > MAX_GAS_COST_PER_USEROP_USD` | `ZERODEV_GAS_LIMIT_EXCEEDED_TRIP` |
| Daily sponsorship exhausted | 拒絕代付 |

波動超標時於 Edge **直接丟棄** UserOp，不進入 Bundler mempool。

### 架構理由
將 EIP-7562 合規 **前移** 至 Citadel Edge，實現 institutional AA 管線的 **零 Bundler RTT 浪費**。

---

## 維度 13：[Hidden Gem 3] Unidirectional Escort 單向護送範式

> 詳見：[`ADVANCED_HFT_PATENTS_AND_HIDDEN_GEMS.md` §3](./ADVANCED_HFT_PATENTS_AND_HIDDEN_GEMS.md#3-unidirectional-ingress-escort-paradigm-enhancing-tokenvault-standards)

### 傳統標準
雙向 bridge 會計 — in-flight 資本常被誤記為 `lostUsd`，觸發連鎖清算或錯誤風控決策。

### SilverVine 標準
**Pending-Capital Recognition Invariant** — `across-ingress-bridge.ts` · SDK `assertUnidirectionalBridge()`：

| 不變量 | 定義 |
|--------|------|
| `lostUsd ≡ 0` | 飛行中資本 **永不** 記為本金損失 |
| `IN_FLIGHT_BRIDGE_CAPITAL` | 橋接進行中標籤 |
| `AML_INBOUND_TO_ROBINHOOD_BLOCKED` | 零 inbound 至 Robinhood Chain |
| `BRIDGE_TIMEOUT_FAIL_CLOSED` | 逾時 fail-closed，仍 `lostUsd = 0` |

鏈上：`IngressSafetySwitch` + `institutionalBlacklist` · oracle flush 聯動。

### 架構理由
機構級跨鏈 ingress 需 **單向護送 + AML 隔離**，避免會計誤報引發 **連鎖清算（cascade liquidation）**。

---

## 授權與文件索引

| 層級 | 授權 | 範圍 |
|------|------|------|
| 合約 | **BUSL-1.1** | `SliverVineGate` · `GatedExecutor` · `SliverVineRiskOracle` · `IngressSafetySwitch` · Stylus |
| SDK | **Apache-2.0** | `@slivervine/citadel-sdk` |
| 本文件 | **內部限閱** | 不得對外散佈未脫敏版本 |

| 相關文件 | 用途 |
|----------|------|
| [`TECHNICAL_SPECIFICATION.md`](../architecture/TECHNICAL_SPECIFICATION.md) | R01–R20 · 公開技術規格 |
| [`SUBMISSION.md`](../grants/SUBMISSION.md) | Arbitrum Grant 提交包 |
| [`ADVANCED_HFT_PATENTS_AND_HIDDEN_GEMS.md`](./ADVANCED_HFT_PATENTS_AND_HIDDEN_GEMS.md) | 3 Hidden Gems 英文專利備忘錄 |
| [`CROSS_CHAIN_RISK_AND_EVOLUTION.md`](../architecture/CROSS_CHAIN_RISK_AND_EVOLUTION.md) | 跨鏈風控演進 |

---

## 附錄：SilverVine v0.8 內部已知物理邊界與 V1.0 主網修補 Roadmap

> **Truth-Mode 聲明：** 本附錄僅供內部工程 / 法務 / Grant 盡職審查使用。下列三項為 v0.8 Santenmoku **已知情且已文件化** 的物理邊界，**不影響** Sepolia 乾跑與 768/768 Vitest 回歸通過，但必須在 **V1.0 主網（M6）** 前完成修補或接受 residual risk 簽核。

### 邊界總覽

| # | 邊界名稱 | 風險視窗 | v0.8 狀態 | V1.0 修補目標 |
|---|----------|----------|-----------|---------------|
| A | Attestation Mempool 搶跑 | **≤ 30 s TTL** | 已知 · 已緩解部分 | 鏈上 subject 綁定 + 縮短 TTL / 私有 mempool |
| B | Off-chain Sever ↔ On-chain Gate 同步缺口 | **~15 s** | 已知 · 已監控 | Oracle `STATUS_SHUTDOWN` 自動化 + Gate `halt()` 聯動 |
| C | JS Wasm ↔ Rust Stylus 浮點舍入漂移 | **1–2 wei** 邊界 | 已知 · 測試覆蓋 | 全路徑 u128 定點 · Stylus 部署為 SSOT |

---

### 邊界 A：Attestation Mempool Front-running 脆弱性（30s TTL 視窗）

#### 物理機制

`SliverVineGate.verifyAndConsume()` 在鏈上寫入 `consumed[digest] = true` **之前**，已簽署的 EIP-712 `RiskAttestation` 在密碼學層面仍為 **有效且未消耗**。`MAX_TTL = 30` 秒（`SliverVineGate.sol`）定義了這張「活體通行證」的最長壽命。

在 **Arbitrum One 單 Sequencer** 架構下，具備區塊提議能力的對手可在以下窗口操作：

```text
Citadel 簽發 ALLOW attestation（off-chain）
        │
        ▼  ← 搶跑視窗：attestation 有效但 consumed 尚未翻轉
Sequencer / Builder 重排交易順序
        │
        ▼
攻擊者以更高 priority fee 搶先呼叫 verifyAndConsume（綁定惡意 payload）
        │
        ▼
合法 subject 的後續 consume → Replayed() 拒絕
```

#### 現有緩解（v0.8）

| 緩解 | 實作 |
|------|------|
| Payload 綁定 | `GatedExecutor.payloadHash(chainId, executor, initiator, target, data, nonce)` — 搶跑者無法重定向 calldata |
| Subject 綁定 | `_validate()` I8：`caller == att.subject` — 僅指定地址可 consume |
| TTL 上限 | 30 s Oracle Lag Shield 對齊 · 過期 attestation 自動失效 |
| Edge 前置 Shield | `checkSoilResistance()` 在簽發 attestation **之前** 裁決 — 減少惡意 ALLOW 簽發機率 |

#### V1.0 主網修補 Roadmap

| 里程碑 | 行動項 | 負責模組 |
|--------|--------|----------|
| **V1.0-M1** | 將 `MAX_TTL` 評估縮短至 **10–15 s**（需與 Citadel 引擎簽發 SLO 對齊） | `SliverVineGate.sol` · `risk-engine-gateway.ts` |
| **V1.0-M2** | 機構級 **私有 Bundler / FCFS** 路徑 — attestation 不進入公開 mempool | ZeroDev AA adapter |
| **V1.0-M3** | `tryExecute` 遙測 + `deniedCount` 鏈上審計 — 搶跑嘗試可鏈上舉證 | `GatedExecutor.sol` · `grant-audit` |
| **V1.0-M4** | 可選 **Flashbots Protect / MEV-Share** 整合（Arbitrum 生態可用時） | Edge Worker |

---

### 邊界 B：Off-chain Sever vs. On-chain Gate 同步缺口（~15s 延遲視窗）

#### 物理機制

Edge 熱路徑熔斷（`severCircuitBreakerPipeline()` · R17/R20）在進程內 **< 1 ms** 切斷 EIP-712 簽名管道（`severSigningChannel()`）。然而，在 `SliverVineRiskOracle.applySignedReport(STATUS_SHUTDOWN)` 鏈上寫入完成 **之前**，可能存在以下同步缺口：

```text
T+0ms    Edge: severSigningChannel() — Hot Key 管道 severed
T+0~5s   網路中仍傳播「已簽發、未 consume」的有效 attestation
T+5~15s  Offline signer 簽署 STATUS_SHUTDOWN → Oracle flush 上鏈
T+15s+   isSystemFlushed=true → IngressSafetySwitch / UserOp gate fail-closed
```

在此 **~15 s 窗口** 內，持有 **舊版有效 attestation** 的對手仍可能嘗試鏈上 `verifyAndConsume()`（若尚未被搶跑消耗）。

#### 現有緩解（v0.8）

| 緩解 | 實作 |
|------|------|
| 物理 sever 日誌 | `PHYSICAL_DEADLOCK_SEVER_LOG` — Section 3 terminal 可審計 |
| Oracle fail-closed | `risk-oracle-gate.ts` — flush 後 ZeroDev UserOp 拒絕 |
| Gate halt 備援 | `SliverVineGate.halt()` — Guardian 即時鏈上 kill switch（手動） |
| Attestation TTL | 30 s 上限限制舊 attestation 壽命 |

#### V1.0 主網修補 Roadmap

| 里程碑 | 行動項 | 負責模組 |
|--------|--------|----------|
| **V1.0-M1** | R20 trip → **自動觸發** `STATUS_SHUTDOWN` Oracle 簽署（Citadel Worker cron） | `risk-oracle-gate.ts` · OpSec signer |
| **V1.0-M2** | Sever 事件 → **並行** `SliverVineGate.halt()` 鏈上交易（< 3 s target） | Deploy script · Guardian bot |
| **V1.0-M3** | `IngressSafetySwitch` 接入 TS 執行路徑（G2 閉環） | `across-ingress-bridge.ts` · deposit flow |
| **V1.0-M4** | 同步缺口遙測：`severAt` vs `oracleFlushAt` delta 寫入 `grant-audit` | `grant-audit-citadel-metrics.ts` |

---

### 邊界 C：JS Wasm vs. Rust Stylus IEEE-754 浮點舍入漂移（1–2 wei 邊界）

#### 物理機制

Citadel 存在 **雙平面算子**：

| 平面 | 數值表示 | 執行環境 |
|------|----------|----------|
| **Edge Wasm / TS** | IEEE-754 `f64` · JS `Number` | V8 / Cloudflare Workers |
| **Stylus Coprocessor** | u128 定點 · Wad/Ray 風格整數運算 | ArbOS Stylus VM |

在極端盤口參數（高 spread bps · 低 depth_usd · 邊界 slippage）下，兩平面對同一組輸入可能產生 **1–2 wei 級別** 的評分差異：

```text
evaluateSoilCore() [Wasm/TS f64]  → score = 9,999  → ok = true
evaluate_soil_coprocessor() [u128] → score = 10,001 → ok = false (fail-closed)
```

此漂移 **不影響** 常規機構訂單（深度 >> $10k · spread << 50 bps），但在 **fuzz 邊界** 與 **grant 審計 parity 測試** 中可觀測。

#### 現有緩解（v0.8）

| 緩解 | 實作 |
|------|------|
| Edge 為 SSOT | 廣播決策以 Edge `checkSoilResistance()` 為準 — Stylus 為審計 parity，非熱路徑 |
| Fail-closed 偏向 | 漂移方向通常為「鏈上更嚴」— 安全側 |
| 測試錨點 | `tests/wasm/stylus-soil-wasm.test.ts` · `cargo test` 5/5 |
| 閾值設計 | `SAFETY_THRESHOLD = 10_000` · `MIN_DEPTH_USD = 10_000` 留出整數餘量 |

#### V1.0 主網修補 Roadmap

| 里程碑 | 行動項 | 負責模組 |
|--------|--------|----------|
| **V1.0-M1** | Wasm 熱路徑遷移至 **純整數 bps 運算**（消除 f64 中間值） | `soil_core.wasm` · `soil-resistance-math.ts` |
| **V1.0-M2** | Stylus coprocessor **主網部署** — 鏈上成為 grant 審計 SSOT | `contracts/stylus-probe/` |
| **V1.0-M3** | 跨平面 parity CI：`f64_score ≡ u128_score` fuzz **65535** 邊界 | `fuzz-65535-stress.ts` |
| **V1.0-M4** | 公開文檔標註 residual drift band：**≤ 2 wei equivalent** 接受區間 | `TECHNICAL_SPECIFICATION.md` |

---

### V1.0 主網修補優先級（Executive Summary）

```text
P0（主網前必須）  邊界 B — Oracle 自動 flush + Gate halt 聯動
P1（主網前強烈建議）邊界 A — TTL 縮短 + 私有 bundler 路徑
P2（主網後 30 天）  邊界 C — 全路徑定點化 + Stylus 主網 SSOT
```

> **Grant 審查備註：** v0.8 Sepolia 部署已驗證核心 fail-closed 語意；上述邊界為 **主網規模化** 的已知 residual risk，已在內部 Truth-Mode 下透明披露，不構成對外隱瞞。

---

*SilverVine Labs · Santenmoku Engine v0.8 · 內部 13 維度架構白皮書 · Vitest SSOT: 174/174 files \| 768/768 PASS*
