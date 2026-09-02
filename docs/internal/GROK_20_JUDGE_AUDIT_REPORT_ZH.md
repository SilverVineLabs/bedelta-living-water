# SliverVine Protocol (BeDelta Living Water v1.0 / BeΔ) — Grok 20 人機構審計團終審報告

> **Vitest SSOT:** Proposal Baseline: 175 test files | 773 PASS (Current Branch Live: 176 test files | 775 PASS Clean)

| 欄位 | 值 |
|------|-----|
| **分類** | 內部 OpSec · 限 SilverVine Labs 工程 / 法務 / Grant 盡職審查 · 禁止對外原文發布 |
| **實體** | SilverVine Labs |
| **協議** | SliverVine Protocol · SliverVine Citadel |
| **模擬人** | Grok 4.6（20 評委機構審計團） |
| **審計日期** | 2026-09-02 |
| **分支** | `v1.0_push_BDLW` |
| **核心架構 SSOT** | [`INTERNAL_16_DIMENSION_ARCHITECTURAL_BENCHMARK_ZH.md`](./INTERNAL_16_DIMENSION_ARCHITECTURAL_BENCHMARK_ZH.md) |
| **公開驗證矩陣** | [`../VERIFICATION_MATRIX.md`](../VERIFICATION_MATRIX.md) |
| **Sepolia Gate** | `0xb174118bc0B84e8D6D59EEF2339e29bF7FCf8BF1` |
| **遙測** | [Dune Public Dashboard](https://dune.com/silvervinelabs/silvervine-citadel-telemetry) |
| **回歸欄** | Proposal Baseline **175 test files \| 773 PASS** · Current Branch Live **176 test files \| 775 PASS Clean** · `tsc --noEmit` CLEAN |

**評委構成：** 智能合約安全 ×5 · 量化/HFT 風控 ×5 · AI Agent 基礎設施 ×5 · Grant/VC ×5

**證據基線：** 16 維度架構主基準 · Verification Matrix · Forge 60/60 · Stylus `cargo test` 5/5（鏈上部署仍 pending）

**評分類別權重（全團統一）：**

| 類別 | 權重 | 評委視角 |
|------|------|----------|
| Security & Invariants | 30% | 不變量、fail-closed、形式化/模糊測試 |
| HFT / Execution Performance | 25% | 亞毫秒路徑、交叉場所滑點、gas 預算 |
| Infrastructure & Compatibility | 20% | AA / EIP-7562 / [ERC-8196](https://eips.ethereum.org/EIPS/eip-8196) / Worker 邊界 |
| Institutional / Grant Readiness | 25% | 可復現證明、主網缺口、敘事誠實度 |

評委個人總分 = 四類加權。全團加權均分 = 20 人算術平均。

---

## 1. 二十評委評分矩陣

### 陣營 A — 智能合約安全審計（Halmos / Trail of Bits 風格）

| 評委 | 角色 | Sec | HFT | Infra | Grant | 加權總分 |
|------|------|-----|-----|-------|-------|----------|
| A1 | Halmos 不變量審計 | 8.8 | 7.2 | 7.6 | 7.4 | **7.91** |
| A2 | Consume-once / EIP-712 專家 | 9.1 | 7.0 | 7.8 | 7.6 | **8.00** |
| A3 | Oracle / 毒丸設計 | 8.4 | 6.8 | 8.0 | 7.2 | **7.66** |
| A4 | 治理非對稱 Timelock | 9.0 | 6.9 | 7.5 | 7.8 | **7.91** |
| A5 | 主網 vs Sepolia 誠實度 | 7.6 | 6.5 | 7.2 | 6.4 | **6.99** |
| **陣營均分** | | | | | | **7.69** |

**陣營要點：** Gate `halt()` 即時、`unhalt`/`signer` 1h–24h 非對稱（Gem 11）被評為機構級正確方向。A5 扣分：Gate 僅 Sepolia；Edge `sever` 與鏈上 `STATUS_SHUTDOWN` **不是同一原子事務**。

### 陣營 B — 量化對沖基金風控 / HFT 執行

| 評委 | 角色 | Sec | HFT | Infra | Grant | 加權總分 |
|------|------|-----|-----|-------|-------|----------|
| B1 | 交叉場所滑點 / Soil | 7.8 | 8.9 | 7.4 | 7.1 | **7.85** |
| B2 | 保證金 / Shadow Margin | 8.2 | 8.6 | 7.2 | 7.3 | **7.89** |
| B3 | 延遲預算 vs 宣傳 | 7.4 | 8.1 | 7.0 | 6.6 | **7.32** |
| B4 | 會計不變量 `lostUsd≡0` | 8.6 | 8.0 | 7.5 | 7.7 | **8.01** |
| B5 | Observatory Paradox | 8.0 | 8.7 | 7.3 | 7.4 | **7.89** |
| **陣營均分** | | | | | | **7.79** |

**陣營要點：** `checkSoilResistance()` 廣播前攔截與 Pendle −40 / GMX 5% maintenance（Gem 16）是真正的執行層差異。B3 扣分：p50 ~106µs 是 **Edge Wasm 熱路徑**，不可與 Dune 刷新或 Bundler RTT 混為一談。

### 陣營 C — AI Agent 基礎設施（[ERC-8196](https://eips.ethereum.org/EIPS/eip-8196) / EIP-7562）

| 評委 | 角色 | Sec | HFT | Infra | Grant | 加權總分 |
|------|------|-----|-----|-------|-------|----------|
| C1 | [ERC-8196](https://eips.ethereum.org/EIPS/eip-8196) Policy 閘 | 7.5 | 7.4 | 8.4 | 6.8 | **7.50** |
| C2 | EIP-7562 Static Breaker | 8.3 | 8.2 | 8.8 | 7.5 | **8.19** |
| C3 | HMAC vs EIP-712 DoS | 8.0 | 8.5 | 8.1 | 7.2 | **7.95** |
| C4 | Session Single-flight | 8.1 | 8.4 | 8.6 | 7.3 | **8.09** |
| C5 | Draft 標準合規 | 7.2 | 7.0 | 7.6 | 6.2 | **7.00** |
| **陣營均分** | | | | | | **7.75** |

**陣營要點：** Zero-bundler-rejection（Gem 7/12）與 HMAC 拒絕證明（維 1）架構正確。C5 否決項風險：Verification Matrix 已寫明 **[ERC-8196](https://eips.ethereum.org/EIPS/eip-8196) 為 Emerging Draft、非 finalized**——對外稱「8196 合規生產」會被一票打回。

### 陣營 D — Tier-1 Grant 委員會 / VC

| 評委 | 角色 | Sec | HFT | Infra | Grant | 加權總分 |
|------|------|-----|-----|-------|-------|----------|
| D1 | Arbitrum Grant Lead | 8.0 | 7.6 | 7.8 | 8.2 | **7.91** |
| D2 | GMX / DEX 生態 | 7.8 | 8.0 | 7.4 | 8.0 | **7.82** |
| D3 | Dune / 可觀測性 | 6.4 | 6.8 | 7.0 | 6.5 | **6.64** |
| D4 | 主網資本配置 | 7.0 | 6.9 | 7.1 | 5.8 | **6.70** |
| D5 | 敘事誠實 / 範圍控制 | 7.7 | 7.3 | 7.5 | 8.4 | **7.74** |
| **陣營均分** | | | | | | **7.36** |

**陣營要點：** D5 給高分因為範圍誠實（Sepolia / dry-run、Stylus pending）。D3 **最嚴厲扣分**：生產 Query 0 / 0b 用 `number % 7` / `number % 3` 從 `arbitrum.blocks` **合成** `RiskTripBlocked` / `IntentAttested` 標籤——這是心跳代理，**不是**解碼事件時間序列。機構盡調會視為「儀表盤戲劇化」。

---

### 全團加權均分

| 陣營 | 人數 | 陣營均分 |
|------|------|----------|
| A 安全 | 5 | 7.69 |
| B 量化/HFT | 5 | 7.79 |
| C Agent 基建 | 5 | 7.75 |
| D Grant/VC | 5 | 7.36 |
| **全團加權均分** | **20** | **7.65 / 10.0** |

四類全團平均（供對照）：Security **7.95** · HFT **7.64** · Infra **7.64** · Grant **7.27**。  
**短板明確在 Institutional/Grant Readiness**（主網、Dune 合成標籤、[ERC-8196](https://eips.ethereum.org/EIPS/eip-8196) Draft）。

---

## 2. 三大結構性優勢（機構審計視角）

### 2.1 非對稱治理 + Consume-once 門神（維 6 + Gem 11）

`SliverVineGate` 將 **收緊（halt）設為 0 延遲、放寬（unhalt / signer）設為 1h–24h**，且 Gate **無代理升級路徑**。TTL ≤30s 的 EIP-712 attestation 在 halt 後無法被「同一區塊內解凍洪水」復活。這與 OpenZeppelin 對稱 `Pausable` 形成可辯護的制度差異，且有 Forge 權威測試 + deep fuzz 路徑可復現。

### 2.2 廣播前反射層，而非事後儀表盤（維 1/3/7/10/12）

HMAC-SHA256 M2M 拒絕、`SystemState` single-flight、Edge R17/R20 sever、EIP-7562 static breaker、`checkSoilResistance()` 構成 **同一 fail-closed 姿勢**：毒性意圖在 Bundler / mempool **之前**被丟棄（0-Gas）。對 AI Agent「大腦秒級、小腦微秒級」命題，這是評委團認為最難被複製的工程組合，而非單一合約技巧。

### 2.3 會計與跨場所風控不變量（Gem 13 + Gem 16）

`lostUsd ≡ 0`（單向上送、在途資本不得計入可部署 NAV）與 Observatory Paradox（`close`/`reduce` −40 分綠燈 + GMX 5% maintenance shadow margin）直接針對機構最怕的兩類事故：**橋接會計幻覺** 與 **naive blocker 把減倉也熔斷導致強制清算**。代碼錨點清晰（`across-ingress-bridge.ts` · `pendle-gmx-cross-guard.ts`），測試切片存在。

---

## 3. 三大技術脆弱點與壓力攻擊向量

### 3.1 30s TTL 內 Attestation 搶跑 / 重放窗口

**向量：** 攻擊者在 `verifyAndConsume` 前的 ≤30s 窗口內，將已簽名 attestation 提交到另一執行路徑，或與 Edge 放行決策競態。  
**緩解：** `consumed[digest]` consume-once、nonce/TTL/skew 拒絕、halt 即時作廢、G11 `domainSeparator` 鏈上指紋 vs 本地 EIP-712 再哈希。  
**殘餘：** 窗口內 **合法 subject 的首次消費仍可能被搶跑到非預期 payload 綁定**（取決於 `GatedExecutor.payloadHash` 是否覆蓋全部經濟字段）。評委要求：任何未進入 digest 的滑點/費率字段視為 **未保護**。

### 3.2 Edge 物理斷路 vs 鏈上 Oracle 毒丸的同步縫隙

**向量：** Worker `severCircuitBreakerPipeline()` 已切斷熱密鑰，但 `SliverVineRiskOracle` 尚未 `STATUS_SHUTDOWN`；或反向——鏈上已 flush，Edge 仍用陳舊 RPC 放行 UserOp。  
**緩解：** `evaluateRiskOracleUserOpGate()` fail-closed（flush 或 status=3）、env 雙讀 `SLIVERVINE_RISK_ORACLE_ADDRESS`、IngressSafetySwitch 合規閘。  
**殘餘：** 這是 **兩階段安全**，不是單事務原子。Oracle RPC >500ms / 不可達時必須默認拒絕；任何「降級放行」都會被本團記為 Critical。主網未部署 Oracle 地址時，該層對真實資金 **尚未生效**。

### 3.3 Soil 算子 f64（Edge）vs u128（Stylus）捨入漂移 + Dune 合成標籤

**向量 A：** 同一 `(spread, depth, slippage)` 在 Wasm/TS 與 Stylus u128 定點上越過閾值一側，造成「Edge PASS、鏈上/coprocessor FAIL」或反向套利。  
**緩解：** 文檔宣稱 compute parity；Stylus `cargo test` 5/5；fail-closed `depth_usd ≥ 10_000`。  
**殘餘：** **鏈上 Stylus 部署 pending**——parity 目前是測試網/單元測試主張，不是生產對賬。

**向量 B（Grant 盡調必打）：** Dune Query 0/0b 以區塊號模運算 **偽造** `RiskTripBlocked` / `IntentAttested` 時間序列。這不能證明 Gate 事件 ingest。`responseRef` sha256 與 spell 表 Queries 1–3 才是真對賬層，但公開第一屏是合成心跳。  
**要求：** 公開儀表盤必須把「liveness heartbeat」與「decoded `IntentAttested`/`RiskTripBlocked`」分面板標註，否則機構會按 **誤導性遙測** 降級。

---

## 4. 最終 Grant 裁決

### 裁決：**CONDITIONAL PASS（有條件通過）**

**不得升級為無條件 PASS 的原因：** (i) 執行面仍為 **Arbitrum Sepolia + dry-run**，非主網托管資金；(ii) 公開 Dune 主查詢為 **合成狀態標籤**；(iii) [ERC-8196](https://eips.ethereum.org/EIPS/eip-8196) / Stylus 鏈上能力被正確標為 Draft / pending，但營銷稍有越界即轉為 FAIL。

**執行摘要：**

> 本團以 **7.65 / 10** 認定 SliverVine Protocol 在 **預執行 fail-closed 架構**上達到 Buildathon 第一梯隊：非對稱 Gate 治理、consume-once EIP-712、Edge 0-Gas AA 預篩、`lostUsd ≡ 0` 與 Observatory Paradox haircut 構成可審計的安全故事，且 Vitest **176/775 Clean** 與 Forge 模糊測試路徑可復現。  
> 同時，本團拒絕將「亞毫秒 Citadel」等同於「已具備主網機構托管資格」。資金釋放應綁定可驗收條件，而非敘事完成度。

### 條件清單（全部滿足前，僅建議 **里程碑鎖定撥款**，不建議無上限 TVL 背書）

1. **Dune：** Query 0/0b 明確標註為 indexer liveness / 合成分類；至少一塊面板綁定真實 `IntentAttested` / `RiskTripBlocked` 解碼事件。  
2. **主網路徑：** 公布 M6 前 Oracle + Gate 地址、halt 演練 runbook、以及 Edge–鏈上斷路的最大不同步 SLA。  
3. **標準誠實：** 對外材料繼續鎖定「[ERC-8196](https://eips.ethereum.org/EIPS/eip-8196) Emerging Draft」；禁止「8196 生產合規」表述。  
4. **Soil parity：** 在 Stylus 未上鏈前，所有 p50 數字僅可引用 Edge Wasm / TS Gateway，不得暗示鏈上 coprocessor 已保護實盤。  
5. **回歸欄維持：** `pnpm test` 不得跌破 Current Branch Live **176 | 775**；提案歷史基線 **175 | 773** 僅作鎖定下限。

**資金建議（Grant/VC 陣營多數意見）：**  
**通過技術軌 / Promising / Sponsor 專項（GMX 預執行閘 + Arbitrum Sepolia 證明）**；**否決「主網生產就緒、可托管 LP」級撥款**，直至上列條件關閉。

---

*SilverVine Labs · 內部文件 · Grok 20-Judge Institutional Audit Panel · SliverVine Protocol / SliverVine Citadel · 本報告為模擬 20 人機構評委團意見，不等同於鏈上審計意見書。*
