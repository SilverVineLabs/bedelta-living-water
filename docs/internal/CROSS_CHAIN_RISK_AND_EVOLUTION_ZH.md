# BDLW 跨鏈風險剖析與 60 重反思架構演進文檔 (中文 SSOT 備份)

> **文檔屬性**：內部量化風控與系統架構最高指引 (SSOT)  
> **版本**：V1.0 → V2.0 路線圖對齊  
> **基線**：Vitest **168 檔 | 742 PASS (100% Clean)** · Wasm 熱路徑 **87.76 KiB gzip** · Shield **p50 ~106 µs**  
> **第一性原理**：誠實會計、物理不變量 (`lostUsd ≡ 0`) 與跨場所微秒級預執行 Citadel 防護。  
> **英文 SSOT：** [`../architecture/CROSS_CHAIN_RISK_AND_EVOLUTION.md`](../architecture/CROSS_CHAIN_RISK_AND_EVOLUTION.md)

**實體：** SilverVine Labs · **協議：** SliverVine / BeΔ Living Water (BDLW)  
**即時驗證：** `GET /api/grant-audit` · [bedeltawater.slivervine.xyz](https://bedeltawater.slivervine.xyz)

---

## 一、核心風險哲學與三階段架構演進

我們坦誠承認：**跨鏈物理延遲與利差漂移（Basis Risk）無法被軟體憑空抹平，只能被精準量化、隔離與經濟緩衝。**

### 三階段演進路線圖

```text
┌─────────────────────────────────────────────────────────────────────────────────┐
│ 階段 A (現狀 V1.0 — 綠燈 742 PASS)                                              │
│ · 主戰場：Arbitrum One GMX v2 GM Pools + Hyperliquid 1× Short                   │
│ · 入口護航：Robinhood Chain 46630 (USDG) 經 Across Bridge (1 小時逾時熔斷)       │
│ · 風控：106µs Wasm Soil 引擎 + ZeroDev Kernel v3 帳戶抽象                        │
└────────────────────────────────────────┬────────────────────────────────────────┘
                                         │
                                         ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│ 階段 B (V1.5 — 階梯式流動性退守與全原生對沖 PoC)                                  │
│ · 無風險底座：暴風雨跳閘時資金自動退守至 Aave v3 / Morpho Blue (4%~5%)           │
│ · 原生對沖：Variational Perp DEX 作為 Arbitrum 同鏈對沖測試                      │
│ · 利差緩衝：超額收益沉澱入 Citadel Safety Buffer                                 │
│ · UX 升級：ZeroDev Kernel v4 EIP-7702 意圖編排器                                 │
└────────────────────────────────────────┬────────────────────────────────────────┘
                                         │
                                         ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│ 階段 C (V2.0 — 100% 全原生 Arbitrum 超級 Vault)                                  │
│ · 100% 資金與交易量留存在 Arbitrum One (GMX v2 + Variational)                   │
│ · 原子化意圖編排：一鍵「Aave 撤資 → GMX 入局 → Variational 1× Short」           │
│ · 跨鏈物理風險徹底消除，Robinhood 轉為純粹可選合規通道                           │
│ · CaaS 商業化：向 B2B 協議售賣 87.76 KiB Wasm 門神，收取 5bps 授權費             │
└─────────────────────────────────────────────────────────────────────────────────┘
```

| 階段 | 狀態 | 重心 |
|------|------|------|
| **A — V1.0** | ✅ 程式碼驗證 (168 檔 \| 742 PASS) | Arbitrum GMX v2 + HL 1× 對沖 · Robinhood 單向護航 |
| **B — V1.5** | ⏳ 路線圖 | Aave/Morpho 底座 + Variational 原生對沖 PoC |
| **C — V2.0** | ⏳ 設計規格 | 100% Arbitrum 原子意圖堆疊 · CaaS 商業化 |

### 1.1 三階段風險比較矩陣

| 風險維度 | 階段 A（V1.0 — ✅ 程式碼驗證） | 階段 B（V1.5 — ⏳ 路線圖） | 階段 C（V2.0 — ⏳ 設計規格） |
|---------|---------------------------|-------------------------|-------------------------|
| **Bridge 延遲** | N/A（Arbitrum 原生入金）或 Robinhood 護航 1h 逾時熔斷 | 中 — 橋費由利差緩衝吸收 | **消除** — Robinhood 僅可選合規通道 |
| **AML / 合規** | 標準 DeFi + Robinhood 單向出站護航 | 強 — RWA 分層隔離 | 標準 DeFi（Robinhood 可選） |
| **對沖簽名路徑** | HL L1 EIP-712 + 30s WS 心跳 | 中 — 生產仍用 HL；Variational 影子 PoC | **同鏈** UserOp（Variational） |
| **資金費率基差** | 中 — DEX GM vs CEX perp | 中 | 低 — DEX GM vs DEX perp |
| **預言機 / Sequencer** | Oracle >30s 熔斷 · Sequencer 600s 寬限 | 相同感測器 + 暴風雨退守（規劃中） | 同鏈 Oracle 對齊（較易） |
| **流動性深度** | HL 深度充足（生產） | HL + Variational PoC 深度待驗 | Variational 深度 — 需獨立 venue DD |
| **ZeroDev 複雜度** | Kernel v3 · Paymaster · Smart Routing | 雙棧 + Kernel v4 適配（規劃） | 單鏈 Intent Compose |
| **106 µs Shield** | ✅ 跨場所通用 · 已上線 | ✅ Wasm 零改寫 | ✅ Wasm 零改寫 |

---

## 二、關鍵架構不變量與金融物理

### 2.1 誠實橋接會計 (`IN_FLIGHT_BRIDGE_CAPITAL`)

跨鏈資金經 Across Bridge 時標記為 `IN_FLIGHT_BRIDGE_CAPITAL`。**`lostUsd ≡ 0`** 嚴格成立，因資金尚未暴露於市場 Delta。若橋接超過 `DEFAULT_ACROSS_BRIDGE_TIMEOUT_MS`（1 小時），系統觸發 `BRIDGE_TIMEOUT_FAIL_CLOSED`，拒絕開立裸倉。

**程式 SSOT：** `src/adapters/robinhood/robinhood-across-bridge.ts` · Vitest 5/5 PASS

### 2.2 階梯式流動性疊加 (Aave v3 / Morpho Blue 退守) — ⏳ 路線圖規格 (V1.5)

> **v1.0 現況：** Aave APY 僅作為 GMX markets wire 不可用時的 **門檻率探針** — 非自動資金搬移。

市場暴風雨（3σ 波動、預言機延遲 >30s、Sequencer 恢復寬限期）期間，**V1.5 目標**為資金退守至 Arbitrum One 上 Aave v3 / Morpho Blue（約 4%~5% 基準收益），Soil 條件正常化後再部署至 GMX v2 偏離利差再平衡。

**程式 SSOT（v1.0 探針）：** `src/adapters/arbitrum/arbitrum-yield-ingress.ts` · `src/services/yield/rebalance-rules.ts`（`FRICTION_BUFFER_APY`）

### 2.3 雙層收益與 Citadel 安全緩衝

> **V1.0 收益 SSOT：** Allocator 面向 HUD 錨定 **Dynamic Target Range 8.2% ~ 11.8% APY**（非保證），由 **Hurdle Gate** `FRICTION_BUFFER_APY = 0.005`（0.5% 摩擦緩衝）在 `rebalance-rules.ts` 中治理。下表描述組成機制 — 非保證總收益。

| 層級 | 機制 | 上限 / 規則 |
|------|------|-------------|
| **Robinhood 入口護航** | 基準 RWA Earn + 機構合規通道（Tranche B） | 組成增益上限 **+2.0%** · 匯入 Dynamic Target Range 區間 |
| **Citadel Safety Buffer** | GMX v2 偏離套利超額收益 (+5~10 bps `uiFeeReceiver`) | 吸收橋費、利差風險、MEV 滑點 |
| **Hurdle Gate** | 再平衡 / 績效費結晶化 | `FRICTION_BUFFER_APY = 0.005` — 僅在摩擦調整後超額之上部署 |

### 2.4 ZeroDev 演進：從跨鏈導流器到意圖編排器

即使在 100% 原生 Arbitrum 架構（階段 C），ZeroDev 仍是不可或缺引擎：

- **Gas 代付：** Paymaster 吸收 AI Agent 與散戶執行 Gas
- **範圍安全：** 30s TTL 自爆 Session Keys，僅限 `ORDER_EXECUTE`（零提現權限）
- **原子意圖編排：** EIP-7702 驅動 Aave、GMX、Variational 單交易執行

### 2.5 經濟永續性哲學：為何「低手續費、無深度」會摧毀收益

> **DeFi 經濟學第一性原理：** 標榜手續費率 ≠ 收益。**LP 淨回報 = 手續費收入 + 激勵 − 無常損失 − 跨場所滑點 − MEV 滲漏。** 當深度不足時，追逐 **0.01% 固定低費** 或 **不可持續的 emissions**，往往加速 **死亡螺旋** — 流量湧向最便宜報價，LP 吸收隱性滑點，TVL 撤離，深度進一步塌陷，標榜 APY 淪為敘事 fiction。

#### 2.5.1 永續 AMM 設計啟示（Equalizer / Curve 系譜）

成熟的 stableswap 與 ve(3,3) 類協議（如 **Curve**、**Equalizer** 及同類設計）收斂於同一洞察：

| 永續 DEX 模式 | 為何能存活 | 避免的失敗模式 |
|--------------|-----------|---------------|
| **手續費檔位匹配池深度與波動** | 高衝擊池收費足以補償 LP 的 LVR | 淺池上的固定微費 → LP 本金失血 |
| **Emissions 綁定真實手續費收入，非虛榮 TVL** | 獎勵跟隨可量化的協議收入 | 僱傭資本 farm-and-dump → 流動性懸崖 |
| **集中流動性 + 明確衝擊預算** | 滑點被定價，而非包裝成「免費收益」 | 毒性流量 + 隱性 IL → 靜默本金侵蝕 |
| **深度變化時可調整參數的治理** | 費率 / 排放旋鈕回應利用率 | 靜態 0.01% 行銷 → 波動尖峰時死亡螺旋 |

**死亡螺旋機制（通用）：**

```text
低標榜費率 / 高 emission APY
  → 毒性流量與套利從 LP 抽取價值
  → 實現滑點 + IL > 標榜收益
  → LP 退出 · 深度變薄
  → 每 $1 部署的執行品質惡化
  → emissions 補貼萎縮的簿本 → 螺旋直至 TVL 崩塌
```

BDLW **不**在虛榮費率最小化上競爭。我們在 **摩擦後誠實淨收益** 上競爭 — 由程式碼強制，非行銷文案。

#### 2.5.2 BDLW 對照：數學不變量優於費率話術

| 維度 | 不可持續的低費 / emission 模型 | BDLW V1.0 路徑 |
|------|-------------------------------|----------------|
| **收益治理** | 敘事 APY · 可變 emissions | **數學不變量** — soil 熔斷 · hurdle gate · 誠實橋接會計 |
| **協議收入捕獲** | 常缺失或藏於價差 | **GMX v2 `uiFeeReceiver` +5 bps**（每筆 unsigned payload · `GMX_UI_FEE_BPS`） |
| **摩擦 vs 淨增益** | LP 資本受損前被忽略 | **`FRICTION_BUFFER_APY = 0.005`（0.5%）Hurdle Gate** — 僅當 `targetNetApy > nativeEarnApy + buffer` 才開 DN |
| **滑點預算** | 由被動 LP 分攤 | **預執行 soil 熔斷** — 跨場所滑點 **> 0.5%** fail-closed · TWAP 路徑切片 |
| **Allocator 披露** | 固定「保證」APY | **Dynamic Target Range 8.2% ~ 11.8%**（非保證 HUD 區間） |

**Hurdle Gate SSOT（`rebalance-rules.ts`）：**

```typescript
export const FRICTION_BUFFER_APY = 0.005 as const; // 0.5% 摩擦緩衝
// resolveCapitalAllocation(): OPEN_DELTA_NEUTRAL 當且僅當 targetNetApy > hurdleRateApy + FRICTION_BUFFER_APY
```

**BDLW 強制的淨收益不等式：**

```text
GMX 偏離溢價 (+5~10 bps uiFeeReceiver) + funding cushion
  − 橋接 / 基差 / MEV 摩擦
  > Native Earn APY + FRICTION_BUFFER_APY (0.5%)
  ⇔ 允許資本部署（否則退守 Native Earn · fail-closed）
```

**設計規則：** Citadel Safety Buffer 與 builder UI fee 用於 **捕獲 GMX v2 偏離路由的真實經濟剩餘** — 而非用 emissions 掩蓋滑點。0.5% Hurdle Gate 確保 **淨增益始終跑贏摩擦**，才允許 Delta-Neutral 資本部署或再平衡。

**程式錨點：** `src/services/yield/rebalance-rules.ts` · `src/services/adapters/gmx-v2-order-payload.ts` · `src/services/risk-control-lib/soil-resistance.ts` · Vitest **742 PASS** 回歸。

### 2.6 真實收益 vs. 毒性通膨（Real Yield vs. Toxic Inflation）

> **代幣經濟學第一性原理：** 並非所有 APY 同等有效。**真實收益（Real Yield）** 來自外生現金流 — 交易手續費、資金費率、借貸利差、對手方支付的 skew rebate。**毒性通膨（Toxic Inflation）** 來自內生 token emissions — 新鑄治理代幣循環支撐標榜 APY，交易對側無結構性支付者。

BDLW **不**採空轉 emission 模型：無 native BDLW 獎勵代幣、無僱傭資本挖礦、無虛榮 TVL 補貼。收益錨定於 **結構性 Delta-Neutral 現金流**，獨立於 SilverVine 代幣發行。

| 現金流支柱 | 來源 | 支付者 | 階段 |
|-----------|------|--------|------|
| **無風險底座** | Aave v3 / Morpho Blue USDC | 借款人利差 | A（探針）· B（退守） |
| **GMX skew + builder fee** | 低權重側 GM LP · `uiFeeReceiver` **+5 bps** · skew rebate (+5~10 bps) | GMX v2 交易者 | A ✅ |
| **HL funding cushion** | Hyperliquid 1× 空頭 hourly funding | HL 對手方資金流 | A ✅ |

**設計規則：** 無 emission 作為收益來源 · Hurdle Gate（`resolveCapitalAllocation()`）· 暴風雨退守 Aave/Morpho（V1.5）· HUD **8.2% ~ 11.8%** 為目標區間（非保證）。詳見英文 SSOT §2.6。

**程式錨點：** `rebalance-rules.ts` · `arbitrum-yield-ingress.ts` · `gmx-v2-order-payload.ts` · `scripts/survival-benchmark/`

---

## 三、55+5 次反思精華矩陣（60 重黃金不變量）

> **防禦矩陣 R01–R20：** 17 Active · 2 Refactored · 1 Deprecated — 詳見 [`TECHNICAL_SPECIFICATION.md` §3.3](../architecture/TECHNICAL_SPECIFICATION.md)  
> **狀態圖例：** **✅ Code-Verified** = v1.0 基線已有程式/測試錨點 · **⏳ Roadmap Spec** = V1.5/V2.0 設計規格 — 不宣稱已交付

### I. 誠實會計與跨鏈物理 (1–10)

| # | 狀態 | 不變量 | 機制 |
|---|------|--------|------|
| 1 | ✅ | **誠實會計** | 跨鏈資金標記 `IN_FLIGHT_BRIDGE_CAPITAL`；零裸倉暴露 |
| 2 | ✅ | **零損失不變量** | `lostUsd ≡ 0` — 待結算橋接流動性永不記為本金損失 |
| 3 | ✅ | **橋接逾時熔斷** | `DEFAULT_ACROSS_BRIDGE_TIMEOUT_MS` = 1h → `BRIDGE_TIMEOUT_FAIL_CLOSED` |
| 4 | ✅ | **單向護航** | Robinhood `46630`/`4663` → Arbitrum `42161` 僅出站 |
| 5 | ✅ | **AML 入站隔離** | `42161 → 46630/4663` 入站阻擋 |
| 6 | ✅ | **結算窗口誠實** | GMX 3–5 分鐘 · HL 提現 15 分鐘 — 在途資金不誤記 |
| 7 | ✅ | **非託管託管語義** | 用戶本金永不記為協議自有 |
| 8 | ✅ | **利差風險量化** | 跨場所 Delta 追蹤；摩擦由 Safety Buffer 吸收 |
| 9 | ✅ | **Across Bridge SSOT** | `evaluateAcrossBridgeTransfer()` + `evaluateBridgeTimeout()` 純函數 |
| 10 | ✅ | **Robinhood 安全開關** | 鏈上 `RobinhoodSafetySwitch.sol` 入站不變量 |

### II. ZeroDev 與帳戶抽象 (11–20)

| # | 狀態 | 不變量 | 機制 |
|---|------|--------|------|
| 11 | ⏳ | **ZeroDev 進化** | Kernel v3 → v4 EIP-7702 意圖編排器 |
| 12 | ✅ | **EIP-7562 零拒收** | Validation Phase 無狀態 `ecrecover` |
| 13 | ✅ | **範圍 Session Keys** | 僅 `ORDER_EXECUTE` — 熱鑰零提現權限 |
| 14 | ✅ | **30s TTL 自爆** | 臨時 Session Key 自動撤銷；Nonce 自愈 |
| 15 | ✅ | **Paymaster 代付** | 每日代付上限；耗盡即熔斷 |
| 16 | ✅ | **EIP-712 域綁定** | `SliverVineCitadel` · chainId 防重放 |
| 17 | ✅ | **ERC-1271 雙重驗證** | Kernel + Gate m-of-n ECDSA |
| 18 | ⏳ | **EIP-7702 零摩擦入場** | EOA 不轉移資產即可變身 Smart Account |
| 19 | ✅ | **Gatehouse 抽象** | 升級時底層 Wasm 算子與合約零改寫 |
| 20 | ✅ | **ERC-4337 預篩** | Edge `verifyAgentIntent()` 先於 Bundler |

### III. 收益、流動性與費用 (21–30)

| # | 狀態 | 不變量 | 機制 |
|---|------|--------|------|
| 21 | ⏳ | **雙層收益** | Robinhood +2% Boost 上限；超額 → Safety Buffer |
| 22 | ⏳ | **階梯式流動性疊加** | Aave/Morpho 無風險底座 + GMX 偏離利差 |
| 23 | ⏳ | **Aave 頂格隔離** | Aave USDC 100% Cap → 自動降級 Morpho Blue |
| 24 | ⏳ | **動態門檻績效費** | 僅在收益超越 Aave 基準 + 1.5% 時收取 |
| 25 | ✅ | **Builder UI 費** | GMX v2 每筆 +5 bps `uiFeeReceiver` |
| 26 | ✅ | **偏離中性化溢價** | 正偏離 / 價格衝擊返利 — 不與 UI 費混淆 |
| 27 | ✅ | **Citadel 安全緩衝** | 超額 GMX 收益吸收橋費、利差、MEV |
| 28 | ⏳ | **暴風雨無風險退守** | 3σ / 預言機延遲 / Sequencer 寬限期 → 4%~5% 收益 |
| 29 | ⏳ | **績效費 (V1.5)** | Aave 基準以上超額收益的 10% |
| 30 | ⏳ | **CaaS 商業溢價** | B2B Wasm 防爆罩 · 5bps 授權費 |

### IV. Wasm 門神與預執行護城河 (31–40)

| # | 狀態 | 不變量 | 機制 |
|---|------|--------|------|
| 31 | ✅ | **跨場所通用防禦** | `checkSoilResistance()` 基於抽象 Soil 狀態 |
| 32 | ✅ | **p50 ~106 µs 熱路徑** | Rust `#![no_std]` Wasm on Edge |
| 33 | ✅ | **熱冷路徑物理解耦** | 87.76 KiB 熱路徑與 5 分鐘 Cron 解耦；0-GC |
| 34 | ✅ | **Wasm 預算** | `<28kb` 產物 · `<60µs` 暖啟動 |
| 35 | ✅ | **R01 Soil 阻力** | 深度 · 價差 · 滑點熔斷 — 廣播前 Fail-Closed |
| 36 | ✅ | **R04 PGATE 延遲** | 200ms 熔斷 |
| 37 | ✅ | **R03 L2 訂單簿熔斷** | 500ms HL 訂單簿過期 → 阻擋 |
| 38 | ✅ | **跨場所 TWAP** | 淨滑點 >0.5% → 路徑切片 |
| 39 | ✅ | **Poisson 抖動反 MEV** | $1M+ 大單：18s–110s 隨機間隔 |
| 40 | ✅ | **Block 0 Sequencer 防禦** | 私有中繼 + GMX `cancelOrder` 原子對沖 |

### V. 風控矩陣與熔斷斷簽 (41–53)

| # | 狀態 | 不變量 | 機制 |
|---|------|--------|------|
| 41 | ✅ | **黑天鵝避難所** | 暴風雨主動斷開簽名 (`signingChannelOpen: false`) |
| 42 | ✅ | **R02 rootProtection** | 致命錯誤 / R17/R20 → 終止熱鑰簽名管線 |
| 43 | ✅ | **R11 動態 Max SL** | `Balance × 1% + $100` — 禁止固定 $50 SL |
| 44 | ✅ | **R07 名義上限** | 每 Session $5,000 USD |
| 45 | ✅ | **R12 槓桿階梯** | 3× → 1× → 停機 |
| 46 | ✅ | **R13 黑天鵝速停** | 3σ 波動 → 立即凍結 |
| 47 | ✅ | **R17 日損斷簽** | 日損預算突破 → 熔斷 |
| 48 | ✅ | **R20 物理死鎖** | `R20_FLATTEN_FAILED` → 硬鎖 + 斷簽 |
| 49 | ✅ | **R09 兩階段 Saga** | Intent Ledger 2PC |
| 50 | ✅ | **R10 自動補償平倉** | 對沖卡死 → 自動 unwind |
| 51 | ✅ | **Sequencer 守衛** | 600s 恢復寬限期 |
| 52 | ✅ | **預言機延遲熔斷** | >30s Chainlink 過期 → Soil Trip |
| 53 | ✅ | **緊急保證金緩衝** | `DEFAULT_CROSS_MMR = 0.05` |

### VI. V1.5 / V2.0 演進與 B2B (54–60)

| # | 狀態 | 不變量 | 機制 |
|---|------|--------|------|
| 54 | ⏳ | **AI Agent 專屬 Citadel 盾牌** | 30s TTL 自爆 Session Keys 護航無人值守 Bot |
| 55 | ⏳ | **OI 內爆反向鎖死** | GMX OI 達 99% 上限時異構腿反向鎖死 PnL 與 Delta |
| 56 | ⏳ | **Aave 頂格隔離** | Aave USDC 100% Cap 時自動降級 Morpho Blue |
| 57 | ⏳ | **PoR 脫錨防禦** | Chainlink PoR 偵測 RWA 脫錨 >0.5% 即刻硬鎖 |
| 58 | ⏳ | **EIP-7702 零摩擦入場** | EOA 不轉移資產即可變身 Smart Account |
| 59 | ⏳ | **動態門檻績效費** | 僅在收益超越 Aave 基準 + 1.5% 時收取 |
| 60 | ⏳ | **不可變 B2B 授權** | 靜態 87.76 KiB Wasm 算子賦能 CaaS 生態訂閱 |

---

## 四、模擬與壓力測試框架 (Simulation & Stress Testing Harness)

BDLW 將**模擬視為一級風控產物**——非行銷附錄。以下框架均為離線或對 live 市場資料的唯讀探測；除非明確以 `--live` 啟動，否則不會改變生產簽名狀態。

### 4.1 Survival Benchmark（HL Mainnet L2 + 雙雷達）

**Survival Benchmark** 為 30 日回溯機構級壓力報告，融合 Hyperliquid 主網 L2 訂單簿 walk、Binance 基差、資金費率歷史與 Citadel Soil 審計。

| 參數 | 數值 | SSOT |
|------|------|------|
| 標準名義 | **$100,000**（`NOTIONAL_USD`） | `scripts/survival-benchmark/survival-benchmark.types.ts` |
| 壓力名義 | **$1,000,000**（`STRESS_NOTIONAL_USD`） | 同上 |
| 回溯窗口 | **30 天** | `LOOKBACK_MS` |
| 滑點熔斷 | **0.5%**（`MAX_SLIPPAGE`） | `soil-resistance-types.ts` |
| 深度地板 | **$100,000**（`MIN_DEPTH_USD`） | 同上 |
| 輸出產物 | `docs/0801_BeDelta_Survival_Benchmark.md` | `scripts/survival-benchmark/index.ts` |

**執行命令：**

```bash
pnpm tsx scripts/generate-survival-report.ts
```

**量測維度：**

1. **Live L2 訂單簿指標** — 價差、買賣深度、@$100k / @$1M 價格衝擊（`computeLiveBookMetrics()`）。
2. **Soil 阻力審計** — `auditLiveBookSoilResistance()` 對照 `MIN_DEPTH_USD` 與跨場所滑點 fuse。
3. **雙腿市價 vs SLI-TWAP** — `dualLegMarketSlip()` 對 `simulateSliTwap()`；報告 $100k / $1M 滑點節省。
4. **HL 雙雷達合成** — 5 感測器矩陣（資金費率、基差、深度、波動、HUD 狀態）× 30D 資金費率權益曲線。
5. **階段隔離** — Base → Full Spec 漸進武器 staging，單變量隔離。

> **Grant 評委提示：** Survival Benchmark 驗證 **$100k 為 v1.0 設計名義 envelope**——與 `ORDER_SIZE_MAX_USD`、`MIN_DEPTH_USD` 及 Alpha Vault Cap（§5.1）對齊。

### 4.2 ZeroDev AA 閘門回歸（`zerodev-aa-gate.test.ts`）

ZeroDev Citadel 風控閘門為 **opt-in CLI/SDK 廣播前 envelope**（未掛載 Worker 熱路徑）。Vitest 套件在 UserOp 抵達 Bundler 前證明 Fail-Closed 行為。

| 測試案例 | 斷言 | 風控含義 |
|---------|------|---------|
| 健康 Soil 通過 | `assertCitadelRiskGate()` 回傳 `sequencerSafe: true`、鏈 `42161` | AA 基線路由 |
| Soil 熔斷 | 拋出 `RiskLimitExceeded` + `TRIP_SOIL_RESISTANCE` | 跨場所滑點 > fuse |
| 單筆 Gas 上限 | Gas > **$0.50** 時拋出 `ZERODEV_GAS_LIMIT_EXCEEDED_TRIP` | `MAX_GAS_COST_PER_USEROP_USD` |
| 每日代付耗盡 | **$10/日** 上限時降級 `sponsored: false` | `DAILY_SPONSORSHIP_LIMIT_USD` |

```bash
pnpm exec vitest run tests/adapters/zerodev-aa-gate.test.ts
```

### 4.3 ZeroDev / HL Dry-Run 框架（無 Live 廣播）

| 框架 | 命令 / 測試 | 範圍 |
|------|------------|------|
| **ZeroDev AA Dry-Run** | `pnpm test:zerodev` → `tests/adapters/zerodev-aa-dryrun-harness.test.ts` | Kernel v3 EP 0.7 UserOp 草稿 · Session Key clip 審計 · Risk Oracle Gate 模擬 |
| **HL 恐慌沙盒** | `pnpm tsx scripts/dry-run-sandbox.ts` | 記憶體內 HL testnet 壓力 → 反擊 → EIP-712 Session Key 管線（熱路徑目標 < 5ms） |
| **Grant E2E Demo** | `pnpm demo:pipeline`（預設 **dry-run**） | 完整 Citadel 管線模擬；僅 `--live` 用於受控 mainnet ignition |
| **5-TX 驗證證明** | `pnpm verify:5tx` / `pnpm verify:grant` | HL testnet 5-TX 錨點 · 名義檔位 $1K / $100K / $1M |
| **負向證明** | `pnpm verify:negative` | 深度不足時 Soil 熔斷（`DEPTH_USD < MIN_DEPTH_USD`） |

> Edge 生產環境 Soil 熔斷 SSOT 仍為 **`checkSoilResistance()`**——Dry-Run 框架驗證鄰接路徑，不取代 Worker SSOT。

---

## 五、對比分析：Arbitrum 原生 vs Robinhood 入口護航

階段 A（V1.0）存在兩種** distinct 資金入口模式**。共用 Citadel 預執行 envelope，但在容量、時序與會計語義上截然不同。

### 5.1 容量上限對照

| 維度 | **Arbitrum 原生入金** | **Robinhood 入口護航** |
|------|---------------------|----------------------|
| **V1.0 Alpha Vault TVL 上限** | **$100,000** 硬頂（路線圖規格） | 相同 envelope——護航不提高 TVL 上限 |
| **單筆名義（v0.9 現網）** | `SESSION_KEY_NOTIONAL_CAP_USD` = **$5,000** | 橋接結算至 `42161` 前不適用 |
| **單筆名義（v1.0 設計）** | `ORDER_SIZE_MAX_USD` = **$100,000** | 僅結算後可部署；在途資金不計入可部署 NAV |
| **深度前提** | HL 訂單簿 `MIN_DEPTH_USD` = **$100,000** | 結算後對沖腿要求相同 |
| **Gap 窗口收緊** | HL Gap Guard：深度 **2×**（$200k）· 槓桿 **3× → 1×** | 橋接逾時 Fail-Closed——在途期間禁止裸 GM/HL 腿 |

**量化錨點：** **$100,000** 為 `MIN_DEPTH_USD`、`ORDER_SIZE_MAX_USD`、Survival Benchmark `NOTIONAL_USD` 與 `TECHNICAL_SPECIFICATION.md` §3.6 Alpha Vault Cap 的**交集收斂值**。

### 5.2 執行時序：即時 vs 在途橋接狀態機

```text
Arbitrum 原生（即時路徑）
────────────────────────
42161 USDC → checkSoilResistance() → GMX GM 入局 + HL 1× Short
             └─ p50 ~106 µs Wasm fuse · 意圖到閘門亞秒級

Robinhood 護航（延遲路徑）
──────────────────────────
46630 USDG → evaluateAcrossBridgeTransfer() 狀態機：

  AVAILABLE ──(發起)──► IN_FLIGHT_BRIDGE_CAPITAL ──(結算)──► SETTLED
                              │
                              └──(> 1h 逾時)──► BRIDGE_TIMEOUT_FAIL_CLOSED
                                                    lostUsd ≡ 0
```

| 狀態 | `capitalLabel` | 可部署？ | `lostUsd` |
|------|----------------|---------|-----------|
| 橋接前 | `AVAILABLE` | 否（尚未在 Arb） | **0** |
| 在途 | `IN_FLIGHT_BRIDGE_CAPITAL` | **否**——禁止裸倉 | **0** |
| 已結算 | `SETTLED` | 是——完整 Citadel envelope | **0** |
| 逾時 | `BRIDGE_TIMEOUT_FAIL_CLOSED` | **否**——Fail-Closed 斷簽 | **0** |

**程式 SSOT：** `evaluateAcrossBridgeTransfer()` · Vitest **5/5 PASS**。

**結算延遲誠實性（不變量 #6）：** GMX 異步結算 **3–5 分鐘** · HL 提現 **~15 分鐘** · Across 護航 **≤ 1 小時** 逾時熔斷。Arbitrum 原生入金完全繞過橋接延遲，但仍受 GMX/HL 結算窗口約束。

### 5.3 路徑選擇指引

| 場景 | 建議路徑 | 理由 |
|------|---------|------|
| 已有 Arb USDC / GM 倉位 | **Arbitrum 原生** | 零橋接延遲 · 即時 Soil 閘門 |
| Robinhood USDG 機構 Earn + 合規護航 | **Robinhood 護航** | 單向出站 AML 隔離 · 在途誠實會計 |
| 暴風雨 / Sequencer 寬限 / 3σ 熔斷 | **兩路徑均不開新風險** | `signingChannelOpen: false` · 雙路徑 Fail-Closed |

---

## 六、機構合規對齊（Basel 協定映射）

> **免責聲明：** 本節為 Grant 委員會與機構盡職調查的**架構對齊敘述**——非監管認證聲明。BDLW 實作的控制措施與 Basel III 營運風險及 ICAAP 壓力測試原則**結構呼應**。

### 6.1 Basel III 營運風險 → Citadel Fail-Closed 控制

| Basel III 概念 | BDLW 控制 | 程式 / 測試錨點 |
|---------------|----------|----------------|
| **內部控制環境** | 單向 `SystemState` · 無孤兒場所腿（R09 Saga） | `intent-ledger.ts` |
| **風險評估** | 預執行 `checkSoilResistance()` — 深度、價差、滑點 | `soil-resistance.ts` · `pkg/soil_core.wasm` |
| **控制活動** | Session Key 範圍（僅 `ORDER_EXECUTE`）· R07 名義上限 | `session-key-gates.ts` |
| **監控與報告** | `GET /api/grant-audit` · 96h 遙測 daemon | `pnpm telemetry:96h` |
| **故障安全斷簽** | R17 日損 · R20 物理死鎖 · 簽名通道關閉 | `circuit-breaker.ts` · `flatten-hardlock.ts` |

### 6.2 `lostUsd ≡ 0` → 誠實損失確認原則

Basel 營運風險框架要求**待結算/在途敞口不得誤記為已實現損失**。BDLW 將此作為**硬不變量**：

- `IN_FLIGHT_BRIDGE_CAPITAL` → 記帳損失 **$0**
- `BRIDGE_TIMEOUT_FAIL_CLOSED` → 記帳損失 **$0**（流程失敗觸發控制，非 P&L 確認）
- Soil 熔斷 / R17 斷簽 → 損失上限 `Balance × 1% + $100`（Dynamic Max SL）

### 6.3 壓力測試 → Survival Benchmark 與 Dry-Run 矩陣

| Basel ICAAP 要素 | BDLW 框架 | 頻率 |
|-----------------|----------|------|
| **歷史模擬** | Survival Benchmark 30D HL 資金費率 + L2 訂單簿 | 按需（`generate-survival-report.ts`） |
| **壓力情境** | $100k 標準 + **$1M** 壓力名義 | 同報告 |
| **反向壓力** | 負向證明——深度不足、Soil 熔斷、橋接逾時 | `pnpm verify:negative` |
| **模型驗證** | Vitest **742 PASS** 全量回歸 | CI / 發布前 |

### 6.4 三道防線映射

| 防線 | BDLW 層級 | 範例 |
|------|----------|------|
| **第一道 — 業務/營運** | 收益門檻 · 再平衡規則 · 緩衝引擎（5–10% 預對沖） | `rebalance-rules.ts` · `buffer-engine.ts` |
| **第二道 — 風控/合規** | Soil 阻力 · PGATE · Sequencer/Oracle 守衛 · 橋接 AML 隔離 | R01–R20 矩陣（§三） |
| **第三道 — 內部審計** | Grant 審計矩陣 · 負向證明 · Survival Benchmark 產物 | `pnpm audit:grant` · `docs/audit/*` |

---

## 七、驗證與關聯文檔

### 7.0 審計路徑 — 程式碼錨點（Grant 評委專用）

評委應將本文宣稱對照以下 SSOT 路徑逐條核實：

| 支柱 | 宣稱 | 程式 SSOT | 測試錨點 |
|------|------|----------|---------|
| **橋接會計** | `IN_FLIGHT_BRIDGE_CAPITAL` · `lostUsd ≡ 0` | [`src/adapters/robinhood/robinhood-across-bridge.ts`](../../src/adapters/robinhood/robinhood-across-bridge.ts) | [`tests/adapters/robinhood-across-bridge.test.ts`](../../tests/adapters/robinhood-across-bridge.test.ts)（5/5） |
| **ZeroDev AA 閘門** | UserOp 廣播前 Citadel 風控 · failover · gas ledger | [`src/adapters/arbitrum/zerodev-aa/zerodev-aa-gate.ts`](../../src/adapters/arbitrum/zerodev-aa/zerodev-aa-gate.ts)（`zerodev-aa/zerodev-aa-gate.ts`） | [`tests/adapters/zerodev-aa-gate.test.ts`](../../tests/adapters/zerodev-aa-gate.test.ts) |
| **Smart Routing 綁定** | USDG → GMX `ExchangeRouter` · `payloadHash()` 綁定 | [`src/services/adapters/gmx-smart-route-payload-binding.ts`](../../src/services/adapters/gmx-smart-route-payload-binding.ts) | [`tests/adapters/gmx-smart-route-payload-binding.test.ts`](../../tests/adapters/gmx-smart-route-payload-binding.test.ts) |
| **Wasm Soil 門神** | p50 ~106 µs 預執行熔斷 | [`src/services/risk-control-lib/soil-resistance.ts`](../../src/services/risk-control-lib/soil-resistance.ts) · [`pkg/soil_core.wasm`](../../pkg/soil_core.wasm) | `tests/risk-control/*` |

**ZeroDev AA 執行路徑（建議閱讀順序）：**

```text
zerodev-aa-gate.ts          → evaluateStaticBreakerMatrix() + Citadel 風控閘門
  ├─ zerodev-aa-failover.ts     → Arbitrum One 健康度 / AA 探測路由
  ├─ zerodev-aa-static-breaker.ts → soil + 代付額度熔斷
  └─ zerodev-aa-userop.ts       → Paymaster + Bundler 遞送（閘門 PASS 後）

gmx-smart-route-payload-binding.ts → buildGmxSmartRoutePayloadBinding()
  └─ gated-executor-payload.ts     → computeGatedExecutorPayloadHash() → SliverVineGate
```

> **備註：** `zerodev-aa-gate.ts` 為 opt-in CLI/SDK Citadel 風控閘門，**未掛載於 Worker 熱路徑**。生產環境 soil 熔斷仍以 Edge 上的 `checkSoilResistance()` 為 SSOT。

| 檢查項 | 命令 / 介面 | 預期 |
|--------|-------------|------|
| 全量回歸 | `pnpm test -- --run` | **168 檔 \| 742 PASS** |
| 橋接不變量 | `pnpm exec vitest run tests/adapters/robinhood-across-bridge.test.ts` | **5/5 PASS** |
| 即時審計 | `GET /api/grant-audit` | `lostUsd: 0` |

| 文檔 | 用途 |
|------|------|
| [`../architecture/CROSS_CHAIN_RISK_AND_EVOLUTION.md`](../architecture/CROSS_CHAIN_RISK_AND_EVOLUTION.md) | 英文官方 SSOT（Grant 委員會） |
| [`../architecture/TECHNICAL_SPECIFICATION.md`](../architecture/TECHNICAL_SPECIFICATION.md) | Yellow Paper — R01–R20 |
| [`../audit/ROBINHOOD_CHAIN_SAFETY_GATE_AUDIT.md`](../audit/ROBINHOOD_CHAIN_SAFETY_GATE_AUDIT.md) | Robinhood 三柱審計 |
