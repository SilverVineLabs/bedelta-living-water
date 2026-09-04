# SliverVine Protocol — 30 Persona 實戰評審模擬（Grok Extreme · 2026-09-03）

| 欄位 | 值 |
|------|-----|
| 分類 | 內部 OpSec · 禁止對外原文發布 |
| 協議 / 實體 | SliverVine Protocol / Citadel Shield · SilverVine Labs |
| 賽事 | Arbitrum Open House Singapore Online Buildathon |
| 分支 | `V1.0_b4_Buildaton_Submisson` |
| 主網 | [Tx `0x54c153e9…`](https://arbiscan.io/tx/0x54c153e9a41f704b5eb0ae554eac593d1110d62bd826ff094e72f2bd60c1b0c6) · Gate `0xb174118bC0B84e8D6D59EEF2339e29bF7FCf8BF1` · **42161** |
| 測試 SSOT | 180 files / 803 PASS |
| 面板 | 10 真實產業人格 + 20 多樣化評審（10 男 / 10 女） |
| **全團算術平均** | **8.14 / 10** |
| **主席加權敘事帶** | **8.2–8.3**（未進 9.0） |

> Bootstrap Ignition Keys（`0x1111…` / `0x2222…`）已在 SUBMISSION 脚注披露。本面板**接受「公開驗證、不暴露 HSM」的意圖**，但仍有人把 constructor 讀成「主網演示密鑰」——分數已內含此張力。

---

## 0. 評分前提（已核對）

**加分**
- Arbiscan One：Success · Contract Created · 0 ETH · 無 proxy
- Sepolia / One **同址**
- `withCitadelShield`（`src/sdk/decorator.ts`）一行包 `checkSoilResistance()`，Apache-2.0，已從 SDK barrel export
- Agent harness **uncapped** `latencyUs`
- Pendle 公開敘事鎖在 Safety Sentinel
- Halmos 失敗 JSON 已從公開敘事撤出

**殘餘 nit（會進個人評語）**
- `withCitadelShield` **零測試命中**
- README 7 個 badge 仍連 `bedelta-living-water`（HackQuest / Foundation 第一印象）
- 主網 receipt **只有 Gate**，無 PolicyGuard
- Dune 事件流仍以 **Sepolia** 為 live；One 是 SQL spec
- Decorator 不是 Virtuals/ElizaOS 官方 plugin 包

---

## 1. 三十人四維細表（0.0–10.0）

總分 = (SC + PMF + Inno + RPS) / 4

### A. 十位真實產業人格

| # | 評審 | SC | PMF | Inno | RPS | **總分** |
|---|------|----|-----|------|-----|----------|
| 1 | Steven Goldfeder / Offchain Labs | 8.65 | 7.35 | 8.25 | 8.35 | **8.15** |
| 2 | GMX Protocol Core Architect | 8.40 | 8.55 | 7.80 | 8.25 | **8.25** |
| 3 | Pendle Finance Core Engineer | 8.05 | 7.25 | 7.45 | 8.05 | **7.70** |
| 4 | Dune Analytics DevRel Lead | 8.10 | 7.55 | 7.30 | 8.25 | **7.80** |
| 5 | Virtuals / ElizaOS Core Contributor | 7.85 | 8.45 | 8.55 | 8.30 | **8.29** |
| 6 | Aave / Risk DAO Auditor | 7.85 | 7.45 | 7.55 | 8.45 | **7.83** |
| 7 | Flashbots / MEV Searcher Lead | 8.20 | 7.75 | 8.45 | 8.65 | **8.26** |
| 8 | Robinhood Crypto Institutional | 8.15 | 8.25 | 7.50 | 8.35 | **8.06** |
| 9 | Arbitrum Foundation Grant Lead | 8.70 | 7.90 | 8.00 | 8.50 | **8.28** |
| 10 | HackQuest Chief Auditor | 8.25 | 8.05 | 7.95 | 8.20 | **8.11** |
| | **產業 10 人平均** | **8.22** | **7.86** | **7.88** | **8.34** | **8.07** |

### B. 二十位多樣化評審（10 男 / 10 女）

| # | 評審 | 性別 | 角色 | SC | PMF | Inno | RPS | **總分** |
|---|------|------|------|----|-----|------|-----|----------|
| 11 | 林浩然 | 男 | SC / Solidity | 8.50 | 7.85 | 8.05 | 8.30 | **8.18** |
| 12 | 陳詩涵 | 女 | Stylus / EIP | 8.10 | 7.70 | 8.20 | 8.05 | **8.01** |
| 13 | 周安琪 | 女 | RH 機構合規 | 8.25 | 8.25 | 7.75 | 8.30 | **8.14** |
| 14 | Mark Holt | 男 | VC / 機構 | 8.20 | 8.10 | 7.70 | 8.15 | **8.04** |
| 15 | 黃志偉 | 男 | GMX 執行 | 8.45 | 8.50 | 7.95 | 8.25 | **8.29** |
| 16 | 吳佩珊 | 女 | Pendle 邊界 | 8.00 | 7.55 | 7.55 | 7.95 | **7.76** |
| 17 | 林恩慈 | 女 | Dune / 遙測 | 8.15 | 7.90 | 7.45 | 8.40 | **7.98** |
| 18 | 鄭子謙 | 男 | AI Quant / Wasm | 8.30 | 8.35 | 8.40 | 8.25 | **8.33** |
| 19 | David Chen | 男 | Crypto VC | 8.30 | 8.20 | 7.80 | 8.10 | **8.10** |
| 20 | 徐佳寧 | 女 | Product / UX | 8.20 | 8.30 | 7.90 | 8.10 | **8.13** |
| 21 | Alex Rivera | 男 | Formal / 不變量 | 8.55 | 7.50 | 7.75 | 8.20 | **8.00** |
| 22 | Sophia Zhang | 女 | Quant Risk | 8.25 | 8.00 | 8.00 | 8.30 | **8.14** |
| 23 | Marcus Vance | 男 | HFT MEV | 8.15 | 8.00 | 8.20 | 8.55 | **8.23** |
| 24 | Elena Rostova | 女 | 跨鏈結算 | 8.30 | 8.10 | 7.85 | 8.25 | **8.13** |
| 25 | Kenji Sato | 男 | 合規 | 8.25 | 7.90 | 7.55 | 8.15 | **7.96** |
| 26 | Chloe Dubois | 女 | DevRel / SDK | 8.00 | **8.60** | 8.15 | 7.85 | **8.15** |
| 27 | Brian O'Connor | 男 | Arb Grant Auditor | 8.75 | 7.95 | 7.95 | 8.45 | **8.28** |
| 28 | Tara Patel | 女 | Indexer | 8.20 | 8.00 | 7.40 | 8.45 | **8.01** |
| 29 | Viktor Krumm | 男 | HFT LP | 8.35 | 8.20 | 8.10 | 8.40 | **8.26** |
| 30 | Jessica Alba | 女 | HackQuest 主席 | 8.55 | 8.25 | 8.10 | 8.30 | **8.30** |
| | **多樣 20 人平均** | | | **8.28** | **8.06** | **7.91** | **8.24** | **8.12** |

### C. 全團匯總

| 組 | N | SC | PMF | Inno | RPS | 總分 |
|----|---|----|-----|------|-----|------|
| 產業 10 人 | 10 | 8.22 | 7.86 | 7.88 | 8.34 | **8.07** |
| 男（多樣化） | 10 | 8.38 | 8.06 | 7.95 | 8.28 | **8.17** |
| 女（多樣化） | 10 | 8.19 | 8.07 | 7.88 | 8.20 | **8.08** |
| **全團 30** | **30** | **8.26** | **7.99** | **7.90** | **8.27** | **8.14** |

產業組比內部 20 人模擬 **更嚴**（−0.05～0.12），主因：Pendle / Dune / Risk DAO / Goldfeder 對「邊界誠實」與「README 可點性」零容忍。

---

## 2. 十位真實人格：說服點 vs 殘餘 nit

### 1. Steven Goldfeder — Offchain Labs（Nitro/Stylus、厭 proxy、厭行銷）

- **說服：** 無 proxy、無 ETH custody、Gate 熱路徑刻意不在鏈上燒 gas；`SliverVineGate` 拆 Lib/Auth、單檔 <200 行——這是他在 X 上會轉的「lean execution」形狀。主網 create 成功、0 ETH。
- **Nit：** README 仍掛 **Stylus 5/5** badge，主網卻沒 Stylus 合約——他會回一句 *don't badge what you didn't ship*。`p50 ~106µs` 若口播成 Nitro 執行時間會被當場拆（那是 Edge Wasm，不是 L2 opcode）。Bootstrap keys 他能接受，前提是 Pitch **不得**說 production HSM 已上線。
- **分數驅動：** SC 高、PMF 低（他不在乎 agent 敘事）。

### 2. GMX Protocol Core Architect（滑點、+10bps、Oracle/L2 延遲）

- **說服：** `GMX_UI_FEE_BPS = 10` 進 unsigned payload；soil fuse 對 cross-venue / depth 有硬門檻；主網 Gate 讓 builder lane 不再是「Sepolia 講故事」。
- **Nit：** 沒有一筆 **真實 GMX v2 increase 經此 Gate 上 One**。10bps 是代碼常數，不是 dashboard 已accrue 的手續費。Oracle 延遲靠 sequencer/soft-confirm probe，不是 GMX DataStore 現場延遲 SLA。
- **分數驅動：** PMF 全場最高檔之一（8.55）。

### 3. Pendle Finance Core Engineer（厭 yield 宣稱、要邊界）

- **說服：** SUBMISSION 已寫 **Safety Sentinel**，不是 YT 競品；expiry <7d ∩ jitter >200bps fail-closed；Observatory Paradox（`close`/`reduce` −40）方向正確。
- **Nit：** Registry 只有 PT-eETH / PT-USDC 兩個地址級 SSOT；沒有 SY 拆分、沒有 live PT AMM 深度。任何 Pitch 把 Pendle 講成「我們也做 yield」會被他一票打回 6 分帶。
- **分數驅動：** **全場最低 7.70**——不是反對產品，是反對「掛名過深」。

### 4. Dune Analytics DevRel Lead（要可索引 log + 能跑的 SQL）

- **說服：** 有 `IntentAttested` / `RiskTripBlocked` ABI、Sepolia emitter、dashboard 連結與 Query 0–3 spec。
- **Nit：** **One 上的 Gate 剛 create，receipt 無業務事件。** Live 標籤若讓評審以為 Dune 已在 42161 解碼毒流，他會標 misleading。他要的是：Sepolia 截圖 + 「One SQL 已寫、事件待 ingest」兩行分開。
- **分數驅動：** Inno 7.30（遙測不是創新，是作業）。

### 5. Virtuals / ElizaOS Core Contributor（SDK DX、plugin、sub-ms）

- **說服：** `withCitadelShield` 真的是一行 wrap；harness 生命週期 JSON（EMITTED → SOIL → SEVERED/DISPATCH）對 agent 作者可讀；`--trip` fail-closed 符合「不要讓 LLM 把 UserOp 送進 bundler」。
- **Nit：** **不是** npm 上的 `@virtuals-protocol/*` / ElizaOS action plugin；`decorator.ts` **無測試**；`seedDemoProbes()` 仍是自演 agentId。他會說：*ship a plugin folder or a 15-line Eliza action, then talk DX.*
- **分數驅動：** Inno 8.55（本面板創新最高之一）。

### 6. Aave / Risk DAO Auditor（不變量、anti-reentrancy、多簽衛生）

- **說服：** `lostUsd ≡ 0` 是會計標籤不變量（在途不當損失）；Gate consume-once + replay revert 有 Foundry invariant；非託管。
- **Nit：** Constructor **threshold=1 + 0x1111/0x2222**——即使脚注寫 bootstrap，Risk DAO 文化是「主網 = 真鑰」。Guardian/admin 同一 EOA。PolicyGuard 未隨主網 Tx 部署。**沒有外部審計 PDF。**
- **分數驅動：** SC 壓到 7.85——主網有了，密鑰衛生沒過他的門檻。

### 7. Flashbots / MEV Searcher Lead（預廣播是否真能防 sandwich、有無 gas 洩漏）

- **說服：** 熔斷發生在 **簽名通道 / Edge**，trip 路徑 **不廣播、不付 Bundler gas**——這是對 searcher 最痛的點（沒有 bundle 可夾）。`--trip` 日誌 `0-Gas (no Bundler dispatch)` 對齊論證。
- **Nit：** 一旦 ALLOW 後 UserOp 仍進公共 mempool/bundler，**後段仍可被夾**；Citadel 防的是「不該發的單」，不是「該發的單的 execution MEV」。Node harness 延遲 ≠ 106µs，字幕必須寫 Edge 目標。沒有對抗 searcher 的 live 對打錄影。
- **分數驅動：** RPS 8.65（問題定義對準 MEV 時間軸）。

### 8. Robinhood Crypto Institutional（合規、非託管 EIP-712、AML 入口）

- **說服：** 單向 `46630/4663 → 42161`；inbound AML BLOCK；EIP-712 domain `SliverVineCitadel`；非託管 Gate。
- **Nit：** 機構不會用 0x1111 signer 過委員會。Across 是 reference escort，不是 RH 官方整合。KYC 不在協議內（正確，但 BD 材料不能暗示「已合規接入 Robinhood」）。
- **分數驅動：** PMF 8.25（合規故事完整，生產鑰不完整）。

### 9. Arbitrum Foundation Grant Lead（生態長期價值、README 透明、One 證明）

- **說服：** **這就是他們要的 One 證明。** Agent 安全是 2026 敘事；lean Gate 不與 Nitro 搶執行預算；測試密度高。
- **Nit：** README 徽章連到 **另一個 slug**；Stylus badge 易被讀成已上 Stylus。長期價值問句：CaaS 10bps 是 V2.0 路線圖，不要寫進「已收費」。
- **分數驅動：** SC 8.70（本面板合約最高檔）。

### 10. HackQuest Chief Auditor（可重現、零 404、零誤導）

- **說服：** `pnpm test -- --run` 路徑清楚；Arbiscan 可點；harness 兩條命令；Foundry 測試存在；「Reference Harness」用詞已收斂。
- **Nit：** **Badge → `bedelta-living-water` 與真實 remote `bedelta-citadel-core` 不一致** = 經典 404/錯庫。Decorator 無測試。Dune「Live」與 Sepolia-only 事件若在表單勾錯，直接算 misleading claim。
- **分數驅動：** 總分 8.11——技術過關，提交衛生扣在第一個像素。

---

## 3. 獎項勝率矩陣（條件概率）

假設有效提交 80–120；**雙片未交則用「現況」欄**。

| 獎項 | 現況（有主網+SDK，影片未滿） | 雙片達標 + Bootstrap 口播誠實 | 產業組否決風險 |
|------|------------------------------|--------------------------------|----------------|
| **Promising Track $15k** | **38%** | **44%** | 低；Virtuals 人格 + 賽道標籤對齊 |
| **GMX Builder Grant** | **36%** | **40%** | 中；缺 live GM fill |
| **Robinhood Reserved** | **27%** | **32%** | 中高；密鑰衛生 + 非官方 RH |
| **Overall 第一名 $40k** | **18%** | **24%** | 高；HackQuest 404 + Risk DAO 密鑰 + 無第三方審計 |
| Overall Top-3 | **46%** | **54%** | — |
| 至少一項 Sponsor | **66%** | **74%** | — |
| 零獎 | **9%** | **5%** | 主因仍是沒交片 / 徽章踩雷 |

相對內部 20 人卷宗（Overall #1 22%）：本 30 人面板 **下修 4pp**，因為真實人格更打「徽章、Dune 鏈別、yield 邊界、主網密鑰」。

**最可能結果：** Promising ± GMX，而非 $40k 獨走。

---

## 4. 影片三條 Master Recommendation

### ① Demo 0:00–0:20 — 一鏡「可點的鏈」

全螢幕 Arbiscan **One** Tx `0x54c153e9…` → Contract Created `0xb174118b…` → 切 Sepolia **同址**。字幕只寫：*ChainID 42161 · no proxy · 0 ETH*。  
**不要**在這 20 秒講 Stylus、不要講 world's first、不要講 $9.88M。

### ② Demo 0:20–0:50 — 一行 SDK + 一次 trip

編輯器打開 `src/sdk/decorator.ts`（22 行整檔入鏡）→ 終端：

```bash
pnpm tsx examples/agent-interceptor-demo.ts --trip
```

停在 `signingChannelOpen: false` 與 **未封頂** `latencyUs`。口播固定句：  
*「Harness 是 Node 量測；生產目標是 Edge Wasm p50 ~106µs。熔斷發生在廣播前，所以 searcher 拿不到這筆 gas。」*

### ③ Pitch 前 30 秒 + 密鑰一句（Goldfeder / Risk DAO / HackQuest 共用）

雨站 A/B/C 三卡收在 30 秒內。任一時刻出現主網 hash 時接一句、只講一次：  
*「Bootstrap ignition keys `0x1111`/`0x2222` 用於公開驗證，不暴露生產 HSM；Gate 的產品形狀是 consume-once，不是這組演示鑰。」*  
Monte Carlo 只上 **87.39%**。Pendle 只講 sentinel，不講 APY。

---

## 5. 主席裁決

30 人面板鎖定 **8.14 算術 / 8.2 競爭帶**。主網把你們送進 Overall 第一梯隊；**產業組把你們釘在「還沒是冠軍」**——不是因為缺功能，而是因為：

1. README slug / Stylus badge（HackQuest + Goldfeder）
2. 主網業務事件尚未被 Dune 索引（Dune DevRel）
3. 密鑰衛生 vs 脚注敘事（Risk DAO）
4. Decorator 無測試、非官方 plugin（Virtuals）

**不要再加協議。** 錄上述三鏡、修 badge 404、Pitch 講 Bootstrap 一次。這三件事的邊際分 > 任何新 adapter。

---

*Prepared by: Grok 30-Persona Extreme Panel · 2026-09-03 · `docs/internal/0903_Grok_EH_ZH.md`*
