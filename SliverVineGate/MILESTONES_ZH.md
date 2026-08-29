# SliverVine Citadel Gate — 雙層 Milestone 承諾表

> **文件用途**：呈交 Arbitrum Open House Buildathon 評審 / coach，以及 Arbitrum Foundation
> milestone-based grant 審核。
>
> **為何分兩層**：官方明文寫 "All prizes are subject to development-tied milestones"，而
> milestone grant（up to 30K USDC）是 "at the sole discretion of the Arbitrum Foundation"
> ([HackQuest 官方頁](https://www.hackquest.io/hackathons/Arbitrum-Open-House-Singapore-Online-Buildathon))。
> 換句講：**寫落去嘅每一項都會被當成承諾去驗收**。所以 Layer 1 只放我哋敢被 CLI 驗證嘅事，
> Layer 2 明文標註「不屬承諾範圍」，用嚟展示願景而唔會製造交付風險。

---

## 時間軸表述方式（重要）

官方目前**未公佈確切起訖日期**，只公佈「為期三星期」。因此本表一律用**相對週次**
（W-6 … W+3，W1 = Buildathon 正式開始首週）。一旦官方公佈日期，只需替換表頭，
承諾內容不需要改動。

**不要**在對外文件填上自己推算嘅日曆日期 — 一旦與官方公佈唔一致，會直接損害
「All claims verifiable」嘅品牌主張。

---

# Layer 1 — COMMITTED（承諾交付，接受驗收）

每一行都有一個**可由第三方獨立驗證嘅 artifact**。動詞一律用「will deliver」，
唔用「will explore / will research / aim to」。

| ID | 期間 | 承諾交付內容 | 驗收 artifact（第三方可獨立驗證） | 狀態 |
|---|---|---|---|---|
| **M0** | W-6 | Gate 合約規格凍結：EIP-712 型別、12 條 invariant（I1–I12）、authority model 定稿 | `SPEC.md` + `src/interfaces/ISliverVineGate.sol` 的 git commit hash | ✅ 已完成 |
| **M1** | W-5 | `SliverVineGate.sol` + `GatedExecutor.sol` 實作完成，Foundry 測試全綠 | `forge test` 60 passed / 0 failed；`forge coverage` ≥ 95% lines | ✅ 已完成（見下方實測數據） |
| **M2** | W-4 | Property + invariant 測試達 off-chain 引擎同級強度 | `FOUNDRY_PROFILE=deep forge test` — 5 properties × 65,535 runs 全綠；3 invariants × 16,384 calls 全綠 | ✅ 已完成 |
| **M3** | W-3 | 部署至 **Arbitrum Sepolia (421614)**，合約於 explorer 完成 source verification | 已驗證合約地址 + `DEPLOYMENTS.md` 記錄 `domainSeparator()` 回傳值 | ⬜ 待辦 |
| **M4** | W-2 | 部署至 **Robinhood Chain testnet (46630)**，透過 CREATE2 取得**與 Sepolia 相同地址** | 兩條鏈相同地址 + 一條 cast 指令示範同一組 signature 在另一鏈**被拒**（跨鏈重放不可能） | ⬜ 待辦 |
| **M5** | W-1 | Off-chain 風險引擎（v0.8 risk engine）簽發真實 attestation，端到端串通 | 兩條鏈各一筆 ALLOW tx hash + 一筆 DENY 的 `GateDenied` event tx hash | ⬜ 待辦 |
| **M6** | W1–W3 | 公開 hosted demo：輸入一筆 GMX v2 訂單 → 顯示 verdict → 一鍵上鏈 | 公開 URL + demo 影片 + demo 期間產生嘅 tx hash 清單 | ⬜ 待辦 |

## M1 / M2 實測數據（已驗證，非估算）

以下數字全部由本 repo 執行得出，任何人 clone 後可重跑：

| 指標 | 實測值 | 重現指令 |
|---|---|---|
| 單元 + fuzz + invariant 測試 | **60 passed / 0 failed** | `forge test` |
| Line coverage `SliverVineGate.sol` | **95.65%** (132/138) | `forge coverage` |
| Line coverage `GatedExecutor.sol` | **91.30%** (42/46) | `forge coverage` |
| 整體 line coverage | **95.51%** (255/267) | `forge coverage` |
| Property 測試強度 | **5 properties × 65,535 runs = 327,675 次執行，全綠** | `FOUNDRY_PROFILE=deep forge test --match-path test/SliverVineGate.fuzz.t.sol` |
| Invariant 測試強度 | **3 invariants × 256 runs × 64 depth = 16,384 calls，0 反例** | `forge test --match-path test/SliverVineGate.invariant.t.sol` |
| `verifyAndConsume` gas（2-of-3） | min 25,853 / median 28,055 / max 77,148 | `forge test --gas-report` |
| `GatedExecutor.execute` gas | min 35,023 / median 68,232 | `forge test --gas-report` |
| `SliverVineGate` deployment | 2,090,265 gas / 10,216 bytes runtime | `forge test --gas-report` |
| Toolchain | forge 1.7.1, solc 0.8.28, optimizer 20,000 runs | `forge --version` |

**外部依賴數：0。** ECDSA 為 inline 實作，無 OpenZeppelin。攻擊面等於此 repo 內嘅程式碼。

## M1 / M2 已證明嘅安全性質（逐條對應測試）

| Invariant | 內容 | 對應測試 |
|---|---|---|
| I1 | halted 狀態拒絕一切 | `test_I1_Halted_Denies` |
| I2 | 只有 `verdict == 1` 放行（0 / 2 / 255 全拒） | `test_I2_NonAllowVerdict_Denies` |
| I3 | 過期即拒（含 `expiresAt` 邊界） | `test_I3_Expired_Denies`, `test_I3_ExactExpiryStillValid` |
| I4 | TTL ≤ 30 秒（對齊 Oracle Lag Shield） | `test_I4_TtlTooLong_Denies`, `test_I4_TtlAtMaxAccepted` |
| I5 | 未來時間戳偏移 ≤ 2 秒 | `test_I5_FutureDated_Denies`, `test_I5_SkewAtBoundaryAccepted` |
| I6 | 一個 digest 只能用一次 | `test_I6_Replay_Denies`, `testFuzz_NeverConsumableTwice` |
| I7 | 法定人數 / 嚴格遞增排序 / 去重 / 反 malleability | `test_I7a`–`test_I7d`（6 個測試） |
| I8 | subject 綁定 caller | `test_I8_WrongSubject_Denies`, `testFuzz_OnlySubjectMayConsume` |
| I10 | `riskBps ≤ 10000` | `test_I10_RiskBpsOutOfRange_Denies` |
| I11 | `expiresAt > issuedAt` | `test_I11_ExpiryBeforeIssuance_Denies` |
| I12 | signature 數量 ≤ 16 | `test_I12_TooManySignatures_Denies` |
| — | 跨鏈重放不可能（chainId 在 EIP-712 domain 內） | `test_CrossChainReplay_Impossible` |
| — | EIP-712 digest 與獨立重算一致（防「自我一致但錯」） | `test_HashAttestation_MatchesIndependentEip712` |
| — | 每個欄位都真正被簽（防欄位漏簽） | `testFuzz_EveryFieldIsSigned` |
| — | payload 綁定：ALLOW 不可換 calldata | `test_Execute_RedirectedCalldata_Reverts` |
| — | 反 front-run：attestation 綁定 initiator | `test_Execute_DifferentInitiator_Reverts` |
| — | 重入被封鎖 | `test_Reentrancy_Blocked` |
| — | 拒絕事件可觀測（revert 唔會 emit，故設 `tryExecute`） | `test_TryExecute_DenyIsRecordedAndPerformsNoCall` |

### 特別註記：三個容易被忽略嘅設計決定

1. **重複簽章 bypass 變成「不可表達」**。經典 m-of-n 漏洞係同一把 key 簽 m 次。此處要求
   recover 出嘅地址**嚴格遞增**，所以重複簽名根本無法通過排序檢查，而唔係靠一個
   `seen[signer]` mapping 去補救。測試 `test_I7b_DuplicateSigner_Denies` 直接示範攻擊被拒。

2. **權限刻意不對稱**。halt 即時生效（guardian 或 admin 任一）；一切「放寬」動作全部
   timelock（unhalt 1 小時、signer 變更 24 小時），且 guardian 可取消。安全裝置嘅唯一
   正確偏誤方向係「容易關、難開」。

3. **`block.number` 在 Arbitrum 返回近似 L1 高度**，L2 高度要經 `ArbSys(0x64).arbBlockNumber()`。
   本合約所有時間判斷**只用 `block.timestamp`**，並已在 source 內註明原因。呢個係 Arbitrum
   專屬陷阱，寫落 code comment 對評審係加分項。

---

# Layer 2 — DIRECTIONAL（方向探索，**不屬承諾交付範圍**）

> **明文聲明**：以下項目**不構成 milestone 承諾**，不作為任何獎金或 grant 嘅驗收條件。
> 列出目的僅為說明技術方向，供 coach 討論。若時間不足，一項都不做，亦不影響 Layer 1 交付。

| 方向 | 內容 | 為何不放入承諾層 |
|---|---|---|
| D1 | **單一 Rust 風險數學核心**：同一份 Rust 程式碼編譯成 wasm（供 Cloudflare Worker）與 Stylus（供 Arbitrum），用同一組 65,535 fuzz corpus 驗證兩邊「逐 byte 決定性一致」 | **Stylus 是否在 Robinhood Chain 可用尚未確認**。另 Stylus WASM activation 在 testnet 固定收 14,000,000 gas（[Arbitrum gas metering 文件](https://docs.arbitrum.io/stylus/concepts/gas-metering)），需先實測。這是我最強嘅創新鉤子，但正因為不確定，所以核心合約用 Solidity。 |
| D2 | **ERC-4337 `AgentGatePolicy`**（Kernel v0.3.1 / EntryPoint v0.7）：令 gate 成為 AA 帳戶嘅 validation module | ERC-7562 storage rules 要求 validation 階段近乎 stateless（只能 inline ecrecover、signer 需為 immutable、replay 靠帳戶自身 nonce、不可讀外部 storage）。設計已完成，但要 bundler 環境實測才敢承諾。 |
| D3 | Arbitrum One mainnet 部署 | 主網部署需要獨立審計預算，不在三週內承諾。 |
| D4 | 更多 GMX v2 以外嘅整合目標 | 先證明一個場景，再談擴展。 |

---

# 需要向 coach 確認嘅四個問題

呢四題直接影響上表能否落實，建議第一次 coach session 就問：

1. **雙鏈部署如何對應 Robinhood Chain 保留席位？** 官方寫每個 track 三個獎項中至少一個保留給
   Robinhood Chain 項目。我哋同時部署 Robinhood Chain testnet (46630) 與 Arbitrum Sepolia
   (421614)，係否仍計入 Robinhood Chain 保留席？定係需要「只」部署 Robinhood Chain？
2. **一個項目可否同時被 Overall Prize 與 Promising Products Track 考慮？**
3. **Stylus 在 Robinhood Chain 是否已啟用？** 呢一題決定 D1 由「方向」升級為「承諾」嘅可能性。
4. **Buildathon 確切起訖日期？** 決定上表 W-6…W+3 對應嘅日曆日。

---

# 三項必須先修正嘅對外表述（風險控制）

呢三項唔關 code 事，但唔改會直接扣分：

1. **「contracts pre-delivered for chain 46630」必須立即處理。** 要麼提供可查嘅已部署地址，
   要麼改成「drafted, not yet deployed」。你嘅品牌主張係 "All claims verifiable via CLI" —
   一項無法驗證嘅聲明，足以令評審連帶懷疑你 630 個 PASS 嘅可信度。**呢個係全份文件裏
   風險最高嘅一項。**
2. **GMX grant 申請必須主動向 Arbitrum 披露。** 同時申請兩邊完全合規；隱瞞被發現則致命。
3. **Pillar 2 嘅 RWA / treasury yield routing 業務線建議剝離。** 涉及本金風險 + 香港證券及
   資產管理牌照風險，並且破壞「中立安全基建」定位。建議保留 Robinhood Chain 部署，
   移除資金路由，對外統一表述為：
   > **non-custodial: holds no user funds, routes no capital, takes no market position.**

---

# Repo 健康度：目前最明顯嘅弱點

`SliverVineLabs/bedelta-living-water` 目前**只有 1 個 commit**。對評審而言，1 commit 嘅
repo 無論內容幾好，都無法證明「持續開發」——而獎金正是綁定 development milestones。

**建議**：由今週開始，每週至少 3–5 個有意義嘅 commit（唔係 whitespace）。上表 M0–M6
每一項完成時獨立 commit，並在 commit message 引用 milestone ID（例如 `M2: deep fuzz 65535 runs green`）。
到 Buildathon 開始時，commit graph 本身就成為 milestone 執行力嘅證據。

---

*所有官方規則引用自 [HackQuest Arbitrum Open House Singapore Online Buildathon 官方頁面](https://www.hackquest.io/hackathons/Arbitrum-Open-House-Singapore-Online-Buildathon)。
Robinhood Chain 鏈參數引用自 [Robinhood Chain 連線文件](https://docs.robinhood.com/chain/connecting/)。
Stylus gas 計量引用自 [Arbitrum Stylus gas metering 文件](https://docs.arbitrum.io/stylus/concepts/gas-metering)。*
