# BeDelta Living Water — Wasm / Stylus 雙引擎重構路線圖

> **Vitest SSOT:** 180 test files | 803 PASS Clean

> **分支：** `v1.0_push_BDLW`  
> **狀態：** ⏳ V1.0 Design Spec（M6 敘事錨點）  
> **Baseline：** M4 已交付 `pkg/soil_core.wasm` · p50 **~106 µs** · Pure Math **200 ns** · `verifyAndConsume` **28,043 gas median**  
> **關聯文件：** [`TECHNICAL_SPECIFICATION.md`](../architecture/TECHNICAL_SPECIFICATION.md) §4.2 · [`HOT_COLD_PATH_DECOUPLING.md`](./HOT_COLD_PATH_DECOUPLING.md)

---

## 1. 戰術目標

將 **Pillar 3（The Shield）** 的核心算式與 **R01–R20 防禦矩陣（Defense Matrix）** 從「TypeScript 編排 + 單一 `#![no_std]` Wasm 核心」升級為 **Rust 算式化 SSOT + 雙目標編譯（Dual-Target Compilation）** 架構：

| 平面 | 執行環境 | 角色 |
|------|----------|------|
| **鏈下 Hot Path** | Cloudflare Edge · `pkg/soil_core.wasm` | Pre-broadcast SSOT · `checkSoilResistance()` · 次毫秒攔截 |
| **鏈上 Cold Reinforcement** | Arbitrum Stylus（Sepolia → One） | On-chain breaker · 與 Edge 語意對等 · Gas 優化驗證平面 |

**設計鐵律（不可妥協）：**

> Edge（Cloudflare）維持 **pre-broadcast SSOT**；Stylus / Elara 為 **on-chain reinforcement plane**——絕不作為較弱的 Edge 閘門替代品。

v0.9 已交付的 `soil_core.rs`（8×f64 輸入 · cross-venue / depth / Dynamic Max SL）是 M4 里程碑成果；本路線圖定義 **V1.0 雙引擎擴展**：將 GMX v2 Skew Moment、非對稱滑點多項式、Oracle Variance 張量納入同一 Rust crate，並以 `#[wasm_bindgen]` + Stylus SDK 雙路編譯。

---

## 2. 現況基線（M4 → M6 間隙）

```text
┌─────────────────────────────────────────────────────────────────┐
│  v0.9 已交付 (M4)                                                │
│  src/wasm/soil_core.rs  →  pkg/soil_core.wasm  (< 28 KiB)        │
│  src/sdk/soil-wasm.ts   →  Worker / Vitest 載入器                │
│  soil-resistance-math.ts → TS 純數學 fallback（開發 / 對照）     │
└───────────────────────────────┬─────────────────────────────────┘
                                │  V1.0 雙引擎重構
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│  citadel_soil_core/ (規劃)                                       │
│  ├─ targets/wasm32   → Cloudflare Worker Hot Path               │
│  └─ targets/stylus   → Arbitrum Sepolia Stylus Breaker Contract │
│  共用：65,535+ fuzz corpus · 逐 byte 決定性一致（D1 方向）       │
└─────────────────────────────────────────────────────────────────┘
```

| 指標 | 當前（M4） | V1.0 目標 |
|------|-----------|-----------|
| Pure Math Kernel | **200 ns**（TS sim / README badge） | **< 50 ns**（Rust SIMD / 多項式張量） |
| Edge Hot-Path p50 | **~106 µs** E2E Shield | **< 60 µs**（對齊 Wasm warm budget） |
| Wasm 執行體積 | **< 28 KiB** | **< 28 KiB**（維持 Cloudflare budget） |
| 鏈上驗證 Gas | **28,043 gas median**（`verifyAndConsume`） | **~12,000 gas**（Stylus 原生算式路徑） |
| 防禦矩陣覆蓋 | R01 soil + session clip 已 Wasm 化 | R01–R08 核心 fuse 算式化；其餘保持 TS 編排 |

---

## 3. 方向一：Rust / Wasm 多項式張力算式化（Polynomial Tension Vectorization）

### 3.1 問題陳述

現行 `checkSoilResistance()` 的 E2E p50 **~106 µs** 中，絕大部分延遲來自 **Worker 編排**（路由、KV probe、RPC whitelist、`checkSoilResistance` 外層防禦矩陣），而非核心土壤數學。Pure Math Kernel 已達 **200 ns**，但以下算式仍分散在 TypeScript：

| 算式域 | 現行錨點 | 未 Wasm 化原因 |
|--------|----------|----------------|
| **GMX v2 Skew Moment** | `gmx-v2-balancer` · underweight 資格判定 | 依賴 adapter 狀態與 GM pool 快照 |
| **非對稱滑點（Asymmetric Slippage）** | `soil-resistance-math.ts` · cross-venue / spot-perp | M4 僅覆蓋對稱 cross-venue fuse |
| **Oracle Variance** | Tri-Sensor · oracle-lag · NTP drift compensator | 時間序列與多源 oracle 聚合 |

V1.0 目標是將上述三者收斂為 **單一 Rust 多項式張量評估器**，透過 `#[wasm_bindgen]` 暴露給 Edge Worker，消除 TS ↔ Wasm 邊界上的序列化與分支預測損失。

### 3.2 技術做法

**Crate 結構（規劃）：**

```text
citadel_soil_core/
├── src/
│   ├── lib.rs              # 共用算式 SSOT
│   ├── polynomial.rs       # Skew Moment · 非對稱滑點多項式
│   ├── oracle_variance.rs  # Oracle lag / variance 張量
│   ├── soil_eval.rs        # 現行 soil_core_eval 升級
│   └── defense_matrix.rs   # R01–R08 fuse 位元遮罩
├── wasm/                   # wasm-bindgen 匯出層
│   └── bindings.rs
└── Cargo.toml              # feature flags: wasm | stylus
```

**輸入張量（規劃 ABI，8×f64 → 16×f64 擴展）：**

| 索引 | 欄位 | 語意 |
|------|------|------|
| 0–7 | 沿用 M4 | `hlSpot, hlPerp, dydxPerp, depthUsd, orderSizeUsd, accountBalanceUsd, maxSlippage, minDepthUsd` |
| 8 | `gm_skew_moment` | GMX GM pool 多空偏斜矩（underweight 側為負） |
| 9 | `asym_slip_coeff` | 非對稱滑點多項式係數（bid/ask 深度比） |
| 10 | `oracle_variance` | 多源 oracle 方差（bps²） |
| 11 | `oracle_lag_ms` | Oracle 更新延遲（對齊 `ORACLE_LAG_DEADLOCK_MS`） |
| 12–15 | 保留 | Defense Matrix 擴展位 · ABI v2 |

**核心算式（概念）：**

```text
Tension(poly) = α·SkewMoment² + β·AsymSlip(order, depth) + γ·OracleVar
Trip(flags)   = Tension > τ  ∨  cross_venue > max_slip  ∨  depth < min_depth
DynamicMaxSL  = account × 1% + $100   （絕對不變量）
```

`#[wasm_bindgen]` 模組對外暴露：

- `evaluate_polynomial_tension(inputs: &[f64]) -> TensionResult`
- `soil_core_eval_v2(...)` — 向後相容 M4 ABI
- `defense_matrix_fuse(flags: u32) -> u32` — R01–R08 位元遮罩

**編譯與整合：**

```bash
pnpm build:wasm          # 現行：src/wasm → pkg/soil_core.wasm
# V1.0 規劃：
cargo build --target wasm32-unknown-unknown --features wasm
# Worker 透過 src/sdk/soil-wasm.ts 載入 · ABI version gate（soil_core_abi_version）
```

### 3.3 預期效能

| 層級 | 當前 | 目標 | 量測方式 |
|------|------|------|----------|
| **Pure Math Kernel** | 200 ns | **< 50 ns** | `scripts/grant-advanced-resilience-benchmark.ts` · Vitest `soil-core-sim` |
| **Wasm warm exec** | < 60 µs | **< 40 µs** | `tests/services/wasm-feasibility-lib/soil-core-sim.test.ts` |
| **Edge E2E p50** | ~106 µs | **< 60 µs** | `grant-advanced-resilience-benchmark` · 96h telemetry HUD |
| **Binary budget** | < 28 KiB | **< 28 KiB** | `pnpm bundle:measure` + wasm size gate |

**物理機制：** 多項式張量在 Rust 內 **單次 SIMD 批次評估**，避免 TS 層多次函式呼叫與 `number` 装箱；配合 [Hot/Cold Path 解耦](./HOT_COLD_PATH_DECOUPLING.md) 的 91.2 KiB gzip lean bundle，確保 L1/L2 cache 駐留不被膨脹依賴破壞。

### 3.4 驗收標準

- [ ] `soil_core_eval_v2` 與 TS `computeSoilSlippageMetrics` **65,535 fuzz** 逐輸出一致
- [ ] Wasm ABI version 遞增至 `2`；舊 ABI v1 向後相容一個 release cycle
- [ ] Defense Matrix R01–R08 fuse 位元與 `defense-matrix.test.ts` 對齊
- [ ] Edge p50 benchmark **< 60 µs**（連續 10,000 次 warm path）

---

## 4. 方向二：Arbitrum Stylus（Rust）鏈上原生斷路器（On-Chain Stylus Breaker）

### 4.1 問題陳述

v0.9 鏈上閘門 `SliverVineGate.sol` 的 `verifyAndConsume` 以 **Solidity + ECDSA** 為主路徑：

| 指標 | 數值 | 來源 |
|------|------|------|
| `verifyAndConsume` median gas | **28,043 gas** | README · M1 gas report |
| `verifyAndConsume` min gas | **25,853 gas** | README |
| 風險算式執行 | **鏈下 Edge**（pre-broadcast） | 設計鐵律 |

V1.0 引入 **Stylus WASM Smart Contract** 作為 **on-chain reinforcement**：當 Edge attestation 已通過但鏈上仍需二次驗證土壤 fuse 時，Stylus 合約以 **原生 Rust 算式** 執行 `evaluate_polynomial_tension`，Gas 顯著低於等價 Solidity 迴圈實作。

> **注意：** Stylus WASM **activation** 在 testnet 有固定 **14,000,000 gas** 一次性成本（[Arbitrum Stylus gas metering](https://docs.arbitrum.io/stylus/concepts/gas-metering)）。本路線圖的 **~12,000 gas** 目標指 **warm 路徑單次 `evaluate` 呼叫**，不含 activation。

### 4.2 技術做法

**部署目標：** Arbitrum **Sepolia**（`421614`）→ 驗證後升級至 Arbitrum One（`42161`）。

```text
┌──────────────────┐     EIP-712          ┌──────────────────────┐
│  Edge Worker     │ ── RiskAttestation ─►│  SliverVineGate.sol   │
│  checkSoilRes()  │                      │  verifyAndConsume()   │
└────────┬─────────┘                      └──────────┬───────────┘
         │ 相同 Rust 算式 SSOT                           │ 可選二次驗證
         ▼                                             ▼
┌──────────────────┐                      ┌──────────────────────┐
│ pkg/soil_core    │                      │ StylusSoilBreaker    │
│ .wasm (Edge)     │                      │ (Arbitrum Sepolia)   │
└──────────────────┘                      └──────────────────────┘
```

**實作步驟：**

1. **共用 crate：** `citadel_soil_core` 以 `#[stylus::public]` 暴露 `evaluate_breaker(inputs: Vec<u8>) -> u32`。
2. **ABI 對齊：** Stylus 輸入為 16×f64 LE bytes，輸出 trip flags 與 Edge Wasm **位元一致**。
3. **Gate 整合：** `SliverVineGate.sol` 新增可選 `IStylusSoilBreaker` 介面；`verdict` 需通過 Stylus 二次 fuse 才 `consume`。
4. **Sepolia 部署：** `cargo stylus deploy --endpoint $ARB_SEPOLIA_RPC_URL`。
5. **Gas 基準：** `forge test --gas-report` + Stylus `cargo stylus replay` 對照 Solidity 等價實作。

**與 ArbOS 61 / Elara 對齊（TECH SPEC §4.2）：**

| 元件 | 角色 |
|------|------|
| **StylusSoilBreaker** | 鏈上微秒級土壤 fuse · parity with Edge |
| **Elara ingress** | Protocol-level 黑名單 · 互補 `RobinhoodSafetySwitch` |
| **Tri-Sensor BaseFee** | 維持 v0.9 `arbitrum-gas-guard.ts` · 不因 Stylus 改寫 |

### 4.3 預期效能

| 指標 | Solidity 基線 | Stylus 目標 | 節省 |
|------|--------------|-------------|------|
| 土壤 fuse 單次 eval | ~28,043 gas（含 attestation 路徑） | **~12,000 gas** | **> 50%** |
| 算式延遲（鏈上） | N/A（鏈下 Edge） | **< 1 ms** L2 執行 | 微秒級 Rust |
| 決定性 | ECDSA + storage | **與 Edge Wasm 逐 byte 一致** | D1 fuzz corpus |

**風險與緩解（來自 `SliverVineGate/MILESTONES.md` D1）：**

| 風險 | 緩解 |
|------|------|
| Stylus 在 Robinhood Chain 未啟用 | Sepolia / Arbitrum One 先行；RH Chain 為可選擴展 |
| Activation 14M gas 一次性成本 | 文檔明確區分 activation vs warm eval |
| Bundler / AA 互操作 | Stylus breaker 在 `verifyAndConsume` 之後，不影響 ERC-7562 validation phase |

### 4.4 驗收標準

- [ ] Sepolia 部署地址可公開驗證（`pnpm demo:e2e` 擴展）
- [ ] 65,535 fuzz：Edge Wasm 輸出 ≡ Stylus 合約輸出（逐 byte）
- [ ] Warm eval gas **≤ 12,000**（`forge test` + Stylus gas report）
- [ ] `verifyAndConsume` 整合測試綠燈（Forge I1–I12 不回歸）

---

## 5. 敘事策略：黑客松展示 × M6 里程碑

### 5.1 核心故事線

> **「同一套 Rust 代碼，鏈上 Stylus + 鏈下 Cloudflare Wasm 雙引擎。」**

這是 Arbitrum Open House / GMX Builders 申請的 **D1 創新鉤子**（`MILESTONES.md` Layer 2），在 M6 Institutional Grant Submission 中作為 **技術差異化主軸**：

```text
評審 30 秒理解路徑
────────────────────────────────────────────────────────
1. 問題：機構級 pre-execution gate 必須在 MEV 之前決策（p50 ~106 µs）
2. 解法：Rust 算式 SSOT → 雙目標編譯
   · 鏈下：Cloudflare Edge Wasm（< 28 KiB · < 60 µs）
   · 鏈上：Arbitrum Stylus Breaker（~12k gas · 決定性一致）
3. 證明：65,535 fuzz corpus · CLI 一鍵驗證
   pnpm test && pnpm build:wasm && forge test && cargo stylus test
────────────────────────────────────────────────────────
```

### 5.2 黑客松 Demo 腳本（建議）

| 步驟 | 動作 | 觀眾可見輸出 |
|------|------|-------------|
| 1 | `pnpm exec vitest run tests/services/wasm-feasibility-lib/soil-core-sim.test.ts` | Wasm < 28 KiB · warm < 60 µs PASS |
| 2 | `npx tsx scripts/grant-advanced-resilience-benchmark.ts` | p50 latency · Pure Math < 50 ns |
| 3 | `cd SliverVineGate && forge test --match-contract SliverVineGate -vv` | verifyAndConsume gas report |
| 4 | `cargo stylus test`（V1.0） | Sepolia breaker eval · ~12k gas |
| 5 | `pnpm run demo:e2e` | 5-step grant E2E · soil trip 可視化 |

### 5.3 M6 交付物對照

| M6 交付項 | 雙引擎路線圖貢獻 |
|-----------|------------------|
| Final Demo Video | 並排展示 Edge Wasm vs Stylus 相同輸入 → 相同 trip flags |
| GMX / Arbitrum grant package | 「Stylus-aligned ingress · lower cross-venue friction」敘事 |
| `GET /api/grant-audit` | 新增 `wasmAbiVersion` · `stylusBreakerAddress` 錨點 |
| Principal Audit Report | Wasm + Stylus 決定性 fuzz 章節 |

### 5.4 對外表述紀律

沿用 `MILESTONES.md` 風險控制：

1. **未部署 = 不聲稱已部署。** Sepolia 地址需 CLI 可查，否則標註「drafted, not yet deployed」。
2. **Edge 仍是 SSOT。** Stylus 是 reinforcement，不是「把風控移到鏈上就不用 Edge」。
3. **Activation gas 與 warm eval 分開報告。** 避免評審誤解 14M activation 為每次交易成本。

---

## 6. 實施時程（建議）

| 階段 | 週次 | 產出 | Milestone |
|------|------|------|-----------|
| **P0 — Crate 拆分** | W1 | `citadel_soil_core` monorepo · ABI v2 草案 | M4 延伸 |
| **P1 — 多項式張量** | W2 | `polynomial.rs` + wasm-bindgen · fuzz 對齊 TS | 方向一 |
| **P2 — Edge 整合** | W3 | `soil-wasm.ts` v2 loader · p50 < 60 µs benchmark | M2 升級 |
| **P3 — Stylus 合約** | W4 | Sepolia deploy · gas report ~12k | 方向二 |
| **P4 — Gate 整合** | W5 | `SliverVineGate` + `IStylusSoilBreaker` · Forge 全綠 | M1 延伸 |
| **P5 — M6 包裝** | W6 | Demo video · grant docs · audit 更新 | **M6** |

---

## 7. 參考錨點

| 資源 | 路徑 |
|------|------|
| M4 Wasm 核心 | [`src/wasm/soil_core.rs`](../../src/wasm/soil_core.rs) |
| Wasm 載入器 | [`src/sdk/soil-wasm.ts`](../../src/sdk/soil-wasm.ts) |
| TS 純數學對照 | [`src/services/risk-control-lib/soil-resistance-math.ts`](../../src/services/risk-control-lib/soil-resistance-math.ts) |
| 技術規格 §4.2 Stylus | [`docs/architecture/TECHNICAL_SPECIFICATION.md`](../architecture/TECHNICAL_SPECIFICATION.md) |
| D1 方向聲明 | [`SliverVineGate/MILESTONES.md`](../../SliverVineGate/MILESTONES.md) |
| Hot/Cold 解耦 | [`docs/internal/HOT_COLD_PATH_DECOUPLING.md`](./HOT_COLD_PATH_DECOUPLING.md) |
| Arbitrum Stylus Gas | [docs.arbitrum.io/stylus/concepts/gas-metering](https://docs.arbitrum.io/stylus/concepts/gas-metering) |
