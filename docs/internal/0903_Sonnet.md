**確認發現（`README.md` 第 3–10 行）：** 儘管內部審計曾記錄「repo slug 已全庫修正」，**README 頂部 7 個 shields.io 徽章連結仍指向舊 slug `bedelta-living-water`**（`Vitest` / `Stylus Coprocessor` / `coverage` / `Chaos Matrix` / `Benchmark` / `TypeScript` 徽章），而真實 remote 是 `bedelta-citadel-core`。這代表評審點擊任何一個徽章連回 GitHub 時，**若舊 repo 不存在或非最新內容，會直接踩中「假 CI 徽章」印象**。這是本報告 Q3 會重點標記的即時風險，先於四個問題單獨列出。

---

# 衝擊 $40,000 Overall 冠軍：戰略審計報告

## Question 1 — 如何真正撬動 $40,000 Overall 冠軍？

### 1.1 「平均高分者（~7.7）」與「無爭議冠軍（9.0+）」的本質差異

7.7 分帶的提交有一個共同特徵：**每一項證據都是「可驗證但仍是原型」**。要跳到 9.0+，缺的不是更多文檔，而是把以下三類「軟證據」換成「硬證據」：

| 軸 | 7.7 帶現狀（軟證據） | 9.0+ 冠軍帶（硬證據） | 差距診斷 |
|---|---|---|---|
| **鏈上足跡** | Sepolia Gate `0xb174118bc0B84e8D6D59EEF2339e29bF7FCf8BF1`（testnet） | **Arbitrum One (`42161`) 上真實 Tx**，Arbiscan 可查 | 評審看 Sepolia 一律讀成「還沒敢上生產」 |
| **Agent 整合** | `examples/agent-interceptor-demo.ts`（本地模擬 harness，`seedDemoProbes()` 手動注入健康探針） | 同一 harness **接上真實的 Virtuals/ElizaOS SDK 或至少一個外部 agent 專案的 fork/PR** | 目前的 Q2 harness 本質是「我方自己扮演 Virtuals Agent」，沒有第三方簽字/引用 |
| **形式驗證** | `docs/audit/halmos.json` 實測 `exitcode: 1`，`test_results` 為空 | Halmos 跑通並輸出 `PASS` 的 lemma 清單 | 這是**目前唯一一個「文件宣稱有、但打開就穿」的項目**——冠軍級提交不會留下這種可一鍵證偽的破綻 |

**結論：** 「Killer Edge Feature」不是新功能，是把現有三個原型級證據**升級為生產級/第三方級證據**。這比寫新代碼的邊際 ROI 高一個量級，因為 7.2→7.8 的分數躍遷（見上一輪 Q2/Q1/Q3 增強審計）已經吃掉了「新增功能」的紅利；剩下的分數帶只能靠「把原型變真」拿。

### 1.2 Mainnet Ignition Tx 的邊際 ROI 評估

`scripts/deploy-mainnet-gate-ignition.ts` 目前是**預設 dry-run**（`armed = BROADCAST===1 && CONFIRM_MAINNET_IGNITION==="YES"`），且腳本內建了硬編碼的 Arbiscan Tx placeholder 字串 `"PASTE_AFTER_BROADCAST"`——這行代碼本身就證明**團隊自己都還沒做過**。

從三個維度評估是否為「Overall #1 的嚴格前提條件」：

1. **合約本身風險極低** — `SliverVineGate` 是 consume-once EIP-712 attestation，`SliverVineAgentPolicyGuard.sol`（`contracts/src/SliverVineAgentPolicyGuard.sol`）是 92 行、無 ETH custody、無 proxy 的純 view/one-way-breaker 合約（`isPolicyActive` 只能被 guardian 單向關閉，見 `terminatePolicy()`）。**部署風險 ≈ 一筆 ~0.01–0.03 ETH 的 gas 支出**，遠低於「不部署」帶來的敘事風險。
2. **是否嚴格前提** — 不是「數學上嚴格」，但是**博弈論上幾乎必要**：Overall 賽道通常吸引已經在做 mainnet 產品的團隊，評審面板（尤其 Solidity Auditor / Arbitrum Grant Auditor 角色）第一個動作就是打開 Arbiscan。如果找不到 `42161` 上的合約，Smart Contract Quality 這 25% 權重的上限會被主觀鎖在 8 分以下，無論代碼寫得多乾淨。
3. **邊際收益不對稱** — 部署成本（幾小時 + 幾美元 gas）遠低於「沒部署」造成的敘事扣分（M6 標記為 ⏳，直接被讀成「六個里程碑裡最重要的一個沒做完」）。

**判定：Mainnet 部署不是數學必要條件，但是實務上的贏率最大單一槓桿。** 現在腳本已經寫好、合約已經 92 行極簡且經 Foundry 5/5 測試，剩下只是「敢不敢按下 broadcast」的執行問題，不是技術問題。

### 1.3 真正稀缺的「Killer Edge」清單（按 ROI 排序）

1. **Halmos 真的跑通**——目前 `exitcode: 1` 是最容易被抓到的自證陷阱，修復成本最低（幾小時），暴露風險最高。
2. **Mainnet Tx + Arbiscan 連結貼進 SUBMISSION**——見上。
3. **至少一個外部 Agent 專案的真實引用**（哪怕只是一個 GitHub issue/PR 而非正式合作信）——把「design partner harness」從自證變他證。
4. **README 徽章 slug 修正**——見文首確認發現，這是零成本、零風險、必修的一致性缺口。
5. **一段真實錄製的 `--trip` 終端畫面**放進 Demo 片——目前只是腳本存在，尚未剪入影片證據鏈。

---

## Question 2 — 範圍邊界：不該做什麼（Anti-Dilution Gate）

### 2.1 Pendle SY/PT 是否要做更深整合？

**不要。** 現有 `evaluatePendleGmxCrossGuard`（`src/guards/pendle-gmx-cross-guard.ts`）與到期/波動守衛已經完整覆蓋了敘事需要的功能面：

- 到期 <7 天 **且** yield jitter >200bps → fail-closed
- Shadow Margin 交叉驗證（PT 退出金額 vs GMX 維持保證金）
- Observatory Paradox 修復（`close`/`reduce` 永遠 -40 分折讓，避免強制卡在高風險倉位）

這三條已經是評審能在 5 分鐘內消化的「風控邏輯閉環」。若加深 SY 拆分收益、多市場 AMM 曲線建模，會把 **Real Problem Solving** 的敘事從「AI Agent 預廣播死亡窗口」稀釋回「又一個 Pendle 收益優化器」——這正是團隊自己在 V0.9→V1.0 審計裡花大力氣切割掉的飽和象限。**PT 相關代碼目前的深度剛好卡在「證明理解該生態」與「變成該生態的競品」之間的甜蜜點，不要往後者移動。**

### 2.2 是否要加 RWA / Tokenized Real-World Asset 追熱點？

**強烈不要。** 理由分三層：

1. **身份衝突** — 官方身份句是「Sub-ms 0-Gas Pre-Broadcast Safety Citadel & Risk Navigator **for AI Agents**」。RWA 是資產類別敘事，AI Agent Citadel 是風控基礎設施敘事，兩者不在同一個產品軸上，硬湊會讓評審在 15 秒內判斷「這團隊在什麼都做」。
2. **監管暴露** — SUBMISSION.md 已有一段明確的法律免責聲明（不提供資產託管/承保/保險式承諾）。RWA 敘事天然會引出「合規/證券法」問題，這是團隊目前**主動迴避**的戰場（`rwa-settlement-lock.ts` 目前只用於鎖窗判斷，不是產品面功能）。
3. **時間視窗不足** — 距提交截止若剩不到兩週，任何新資產類別整合的邊際驗證成本（需要新的價格 oracle、新的清算模型）遠高於把現有三個原型證據做實的成本。

### 2.3 五條明確的「DO NOT DO」

1. **不要新增任何資產類別或協議整合**（RWA、新 DEX、新橋）——現有 GMX + Pendle + Robinhood + Dune 四個 Sponsor 適配器已經是「剛好覆蓋、不過度鋪陳」的邊界，新增只會拉低單位證據密度。
2. **不要在 Pitch 片喊「world's first」或任何無法證實的最高級用語**——這是 red-flag 磁鐵，內部審計（`0902_Opus.md`）已明確列為反建議，且比賽評審對誇大宣稱的容忍度極低。
3. **不要把蒙地卡羅 `$9.88M` 放在片頭大字**——即使標註 nominal simulated，視覺上仍會被誤讀為已實現 TVL；主 KPI 應該用 **87.39% 攔截率**這個比例數字，金額只放小字附註。
4. **不要為了衝分倉促上鏈未經審計的 Rust/Stylus 合約**——`Stylus Coprocessor` 徽章目前指向的是 probe 而非主網部署，若強行部署未經審計代碼到主網，下行風險（合約漏洞被抓到）遠大於徽章好看的上行收益。
5. **不要在提交材料裡混用三套自創評分體系（14 維 / 16 維 / 30 維）**——官方只用 4 條標準（Smart Contract Quality / PMF / Innovation / Real Problem Solving），任何自創維度表格只會讓評審多一層「這團隊在自我評分」的 meta-gaming 觀感，直接抵銷內容本身的可信度。

---

## Question 3 — 20 評審多角色模擬：四維度單一最大弱點

以官方四標準逐一拆解**單一最致命弱點**（非泛泛而談，每項附具體代碼/文件證據）：

### 3.1 Smart Contract Quality (25%)

**最大弱點：形式驗證聲稱與實際結果不一致。**

`docs/audit/halmos.json` 實測內容：
```json
{"exitcode": 1, "test_results": {"test/SliverVineGate.invariant.t.sol:SliverVineGateInvariantTest": []}}
```
`exitcode: 1` 加空的 `test_results`，代表 Halmos **執行失敗、沒有任何 lemma 被證明**。但 `contracts/test/formal/HalmosGateInvariant.t.sol` 裡明確寫了 `check_consume_sets_consumed_flag` 和 `check_replay_must_revert` 兩條 `check_*` 命名的符號執行斷言。**任何懂 Halmos 慣例的 Solidity Auditor 評審，只需要打開這一個 JSON 檔案，就能在 10 秒內抓到「聲稱有形式驗證、但沒跑通」的落差。** 這比缺少審計本身更傷——缺審計是誠實的短板，聲稱有審計但打不開是誠信問題。

**次要弱點：** 合約總數偏少（`SliverVineGate.sol` / `SliverVineGateLib.sol` / `SliverVineGateAuth.sol` / `SliverVineAgentPolicyGuard.sol` / `IngressSafetySwitch.sol` / `SliverVineRiskOracle.sol` 共 6 個核心 `.sol`），對佔 25% 權重的標準而言代表作偏薄，但這是刻意的「Lean On-Chain Gate by Design」架構選擇，只要敘事講清楚（風控邏輯本應留在 Edge，不該上鏈），影響可控。

### 3.2 Product-Market Fit (25%)

**最大弱點：Design Partner 證明仍是自證閉環。**

`examples/agent-interceptor-demo.ts` 的 `virtualsAgentExecutionHook()` 是團隊**自己寫的模擬 Agent draft**（`agentId: "virtuals-agent-0xbeef"`、`agentId: "rogue-eliza-0xdead"`），並沒有引用任何真實的 Virtuals Protocol SDK 或 ElizaOS plugin 介面。一個熟悉 AI Agent 生態的 VC 或 DevRel 評審會立刻識別出：**這是「命名像 Virtuals/ElizaOS」的內部測試，不是「與 Virtuals/ElizaOS 集成」**。SUBMISSION.md 用詞「Inaugural Agent Integration」與「Verified via `@slivervine/citadel-sdk`」在字面上暗示了比實際更強的合作關係，這是 PMF 維度最容易被拆穿的一句話。

### 3.3 Innovation and Creativity (25%)

**最大弱點：p50 ~106µs 的「創新性」缺乏與競品的直接延遲對比實測。**

技術核心（Rust `#![no_std]` Wasm + Cloudflare Edge 攔截）敘事完整,但 `examples/agent-interceptor-demo.ts` 裡實測跑出的 `checkSoilResistance()` 延遲（Node.js 環境下 `performance.now()` 量測，代碼裡甚至用 `Math.min(measuredUs, 105)` 手動封頂顯示值）**暴露了一個尷尬事實：Node.js 本地 harness 測到的真實延遲遠高於 106µs，團隊用封頂邏輯讓輸出好看**。一個 HFT/MEV 背景評審（Marcus Vance 型角色）打開代碼看到這行封頂邏輯，會直接質疑「p50 ~106µs 這個數字到底是 Wasm 熱路徑實測還是 marketing 數字」。**創新性論述需要與「展示用 harness 的量測誠信」保持一致，目前這行代碼是自打嘴巴的風險點。**

### 3.4 Real Problem Solving (25%)

**最大弱點：「AI Agent 預廣播死亡窗口」問題陳述缺少真實受害案例引用。**

整個 Problem/Solution 敘事（prompt injection、MEV 三明治、清算級毒流）是**邏輯推演**，SUBMISSION.md 沒有引用任何一個真實發生過的 AI Agent 被 sandwich/prompt injection 攻擊致損的鏈上案例（哪怕是別的協議上發生的、作為問題陳述的佐證）。相比之下，Real Problem Solving 維度的高分提交通常會引用「某月某日某協議因為 XX 攻擊損失 $XXX」作為問題真實性的外部證據。目前的論證鏈是「這個問題理論上會發生」而非「這個問題已經發生過、我們防住了同類攻擊」。

---

## Question 4 — 影片與提交戰術清單：前 15 秒必抓的三個節拍

### 4.1 120s Demo Video — 前 15 秒必須包含

1. **Live URL + 即時時間戳**（0:00–0:05）：打開 [bedeltawater.slivervine.xyz](https://bedeltawater.slivervine.xyz) 時,螢幕角落露出系統當前時間或終端 `date` 輸出，證明這不是預錄的 staging mock。
2. **Arbiscan Sepolia 合約頁直接比對地址**（0:05–0:12）：地址 `0xb174118bc0B84e8D6D59EEF2339e29bF7FCf8BF1` 从 HUD 复制、粘贴到 Arbiscan 搜尋框,讓評審親眼看到「複製-貼上-匹配」的動作,而非剪輯好的截圖。
3. **一次真實的 fail-closed 觸發**（0:12–0:20 起手勢即可預告，主體在後段）：即使完整攔截演示放在 20–50 秒,前 15 秒也要用文字卡預告「Live trip demo incoming」,建立懸念錨點,避免評審在前 15 秒因為「又是一個 HUD 截圖」而分心切走。

### 4.2 180s Pitch Video — 前 15 秒必須包含

1. **一句話身份句 + 視覺化死亡窗口**（0:00–0:08）：「AI Agents do not wait for committees. They arrive at the DEX station — and the rainstorm is already here」配合 3σ 紅色警示視覺,在 8 秒內完成「這是什麼、為什麼現在」的雙重定位。
2. **三個具體威脅標籤同時出現**（0:08–0:16）：**3σ crash**、**MEV sandwich**、**prompt injection** 三個標籤同框顯示,讓評審在瀏覽階段（很多評審會先快速拖動進度條）任意暫停都能抓到問題定義的完整性。
3. **Option A/B/C 對比卡在 15 秒內收尾**（收在 0:24–0:30 前）：Fail-Open（`lostUsd > 0`）vs Fail-Slow（治理延遲卡死）vs SliverVine Citadel（`lostUsd ≡ 0` + p50 ~106µs）三選項對比,在 30 秒內建立「我們是唯一正確答案」的心理錨定——這是 Storyboard 現有設計裡最強的部分，執行時務必守住這個節奏，不要被技術細節（Wasm 大小、EIP-712 domain）提前擠占前 15 秒的黃金時間。

### 4.3 提交前最後檢查（HackQuest 表單層面）

- 確認 README 徽章連結全部改回 `bedelta-citadel-core`（見文首確認發現）——這是評審點擊「查看代碼」時的**第一個像素級印象**，優先度高於任何影片剪輯細節。
- 確認 `halmos.json` 在錄影前重新跑通或至少在文件裡誠實標註「符號執行環境待補、lemma 定義已在 repo」，避免評審現場打開 JSON 檔案時當場破功。