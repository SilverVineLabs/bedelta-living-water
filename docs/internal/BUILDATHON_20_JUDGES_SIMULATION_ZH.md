# SilverVine Protocol — 賽制全域對齊審計與 20 位評審員終極模擬評估報告

| 欄位 | 值 |
|------|-----|
| **分類** | 內部 OpSec · Buildathon 盡職審查 · 禁止對外原文發布 |
| **模擬人** | Grok 4.6（20 評審員 · 10 男 10 女 · 14 維矩陣） |
| **賽事** | Arbitrum Open House Singapore Online Buildathon（70k USDC Overall · 15k Promising Track · 30k Grants） |
| **賽制硬約束** | 必須部署於 Arbitrum 鏈（Sepolia / One / Robinhood Chain）· 至少 1 獎保留 Robinhood Chain、1 獎保留 Arbitrum · 獎金綁里程碑發放 |
| **贊助商** | Robinhood Chain · Dune · GMX · Pendle |
| **審計日期** | 2026-08-30 |
| **前序文件** | [`BUILDATHON_10_JUDGES_SIMULATION_AND_CODE_AUDIT_ZH.md`](./BUILDATHON_10_JUDGES_SIMULATION_AND_CODE_AUDIT_ZH.md) · [`BUILDATHON_10_JUDGES_SIMULATION_KIMI_AUDIT_ZH.md`](./BUILDATHON_10_JUDGES_SIMULATION_KIMI_AUDIT_ZH.md) · [`BLACK_HAT_MEV_ADVERSARY_ATTACK_AUDIT_ZH.md`](./BLACK_HAT_MEV_ADVERSARY_ATTACK_AUDIT_ZH.md) |
| **本輪測試** | **未重跑** `pnpm test`（依任務禁令）。SSOT 採倉庫已鎖定之 **174 files \| 768 PASS (100% Clean · Exit Code 0)** |

---

## 執行摘要（評審主席視角）

SilverVine / BeΔ Living Water 在本輪（相對 Kimi 10 評審複核）補齊了 **形式驗證契約、博弈蒙地卡羅、Pendle PT 到期 guard + 1,000 次 fuzz、跨鏈 `deployable` 不變量、生產 hedge 活 L2 fail-closed**。這把「工程誠實度」從「文檔超前代碼」拉到「安全敘事可被紅隊追蹤」。

**雙保留獎資格：成立。** Sepolia 三件套已部署；Robinhood `46630`/`4663` → `42161` 單向護航 + inbound AML 封鎖在測試與適配層可驗證。Hyperliquid 是對沖場，**不得被口播成 Arbitrum 部署**。

| 路徑 | 機率判斷（20 評審加權） | 關鍵條件 |
|------|-------------------------|----------|
| **Robinhood 保留獎** | **高** | 180s 必須展示 inbound BLOCK + `lostUsd ≡ 0` + `deployable === false`（IN_FLIGHT） |
| **GMX Sponsor / 相關 Grants** | **高** | 10 bps `uiFeeReceiver` 注入畫面 + balancer；勿把 25% referral 當鏈上不變量 |
| **Arbitrum 保留獎 / Overall 70k** | **中高** | Halmos + Gate 已驗證地址 + fail-closed 紅燈；補 180s 分鏡與 Dune 落地時間表 |
| **Pendle Sponsor 獎** | **中低** | 現有為 **到期/jitter fail-closed guard**，非 PT/YT 市場適配或 SY 包裝 |
| **Dune Sponsor 獎** | **中** | 三條 Production SQL 規格齊全；**儀表板尚未發布** |
| **Promising Track 15k** | **中高** | 創新敘事強（106µs + consume-once + 博弈防護）；主網 TVL=0 是扣分項而非失格 |

**20 評審 × 14 維等權總評：7.7 / 10**（Kimi 修復後 7.4 → 本輪因 A3-1/A2-1、Halmos、Pendle fuzz、蒙地卡羅上修 **+0.3**）。

**仍禁止對外誇大：** Stylus coprocessor 鏈上 pending；Dune 未上線；蒙地卡羅 `$9.88M` 為 10,000 次**模擬名義保護**，非實盤 TVL；Halmos 檔案為可執行 Foundry `check_*` 契約，**本輪未跑 Halmos CLI**；A3-2（偽造 `settledAtMs`）若接實盤仍為 **Critical 阻擋主網**。

---

## 第一部分：當前工程與安全 SSOT (174 Files | 768 PASS + 形式驗證 + 蒙地卡羅)

### 1.1 鎖定度量

| 項目 | SSOT |
|------|------|
| **Live 回歸** | **174 files \| 768 PASS (100% Clean · Exit Code 0)** |
| **Grant 歷史鎖定基線** | **168 files \| 742 PASS**（提案歷史，不得改寫） |
| **`risk-control.ts` 覆蓋率** | 100%（前序 session 報告） |
| **Chaos** | 255/255 fail-closed（`chaos-blackswan-metrics.json`） |
| **Sepolia Gate** | `0xb174118bc0B84e8D6D59EEF2339e29bF7FCf8BF1` |
| **RiskOracle** | `0x3FFa2539f502682E8145e6Eb427ff78d258D53a4` |
| **IngressSafetySwitch** | `0x3E4298e2b8d4e30396A54C1817Eb71c9272Ffb4B` |

### 1.2 本輪相對 10 評審版的增量（代碼可指）

| ID | 增量 | 錨點 | 評審意義 |
|----|------|------|----------|
| **Halmos I6** | `consumed[digest]=true` ∧ 重放必 `Replayed()` | `contracts/test/formal/HalmosGateInvariant.t.sol` | 形式化 consume-once，非僅 fuzz 敘事 |
| **蒙地卡羅** | 10,000 次深度 −80%/1s + 三明治流 | `scripts/simulations/soil_game_theory_sim.py` → `docs/telemetry/game_theory_simulation_results.json` | `toxicFlowBlockedPercent: 87.39%` · `lpCapitalSavedUsd: 9,888,170.89` |
| **Pendle fuzz** | 1,000 次 maturity × jitter · 零 NaN · 7d/200bps 邊界 | `pendle-pt-expiry-guard.ts` + test | Sponsor 6 從「缺失」升為「guard 存在」 |
| **A3-1** | `deployable = routeAllowed && capitalLabel === 'SETTLED'` | `across-ingress-bridge.ts` · yield router · smart-route preview | IN_FLIGHT 不得 READY/ALLOW |
| **A2-1** | 活 L2 失敗 → `HEDGE_SOIL_L2_TRIP` | `build-hedge-soil-input.ts` · hedge/cron | 廢除生產路徑合成 $500k 深度 |
| **Dune 規格** | 三條 Production SQL | `DUNE_DASHBOARD_SPECIFICATION.md` | 儀表板仍 pending 發布 |

### 1.3 蒙地卡羅誠實解讀（給量化評審）

模擬對齊 `MIN_DEPTH_USD = 100_000`、`MAX_SLIPPAGE = 0.005`、深度崩塌因子 `0.20`、三明治價差上限 `85 bps`、種子 `42`。

- **87.39%** = 10,000 次中 8,739 次 post-shock soil **trip**（Citadel 擋下有毒腿）。
- **$9.88M** = 全迭代 **累計** LP 有毒滑點 + IL 差額（有 guard vs 無 guard），**不是** 單一池 TVL 或已實現 PnL。
- 模型為 stdlib 簡化 IL / impact，**不能**對外說成 cadCAD 校準或主網回測。
- 評審若要求「99.82%」：倉庫產物是 **87.39%**；誇大會被量化評審當場證偽。

### 1.4 紅隊殘留（不得假裝已關閉）

| ID | 狀態 | 主網含義 |
|----|------|----------|
| **A3-1 / A2-1** | ✅ 已修 | 本輪加分 |
| **A1-1** 30s TTL 審查 griefing | 未關閉 | Medium · 非任意竊取 |
| **A1-2** sever 後舊 ALLOW | 未關閉 | Medium · 政策失效窗 |
| **A3-2** 呼叫方偽造 `settledAtMs` | **仍 Critical（接實盤）** | 結算必須鏈上/跨鏈證明，禁止呼叫方時鐘 |
| **Stylus 上鏈** | Pending tooling | 不得口播已部署 |

---

## 第二部分：4 大 Sponsor (Robinhood/Dune/GMX/Pendle) 滿分切合度

| Sponsor | 切合度 | 已交付（可 CLI / 規格驗證） | 缺口 | 180s 必講 |
|---------|--------|------------------------------|------|-----------|
| **Robinhood Chain** | **9.0 / 10** | 單向 `46630`/`4663`→`42161` · inbound AML · `lostUsd ≡ 0` · **`deployable` 僅 SETTLED** · `IngressSafetySwitch` Sepolia | 非 Robinhood 原生 L2 應用；護航參考適配器 | 反向路徑紅燈 + IN_FLIGHT 不可部署 |
| **GMX** | **8.6 / 10** | 10 bps UI fee 注入 · ETH/USDC 主市場 · balancer · 未簽名 payload | `claimUiFees` 待主網；referral 25% 非代碼不變量 | payload 欄位特寫，勿保證 APY |
| **Dune** | **6.8 / 10** | 三面板 SQL + grant-audit 對帳欄位 | **無已發布 dashboard / spell** | 「規格就緒 · M-Dune 解鎖」 |
| **Pendle** | **6.4 / 10** | PT 到期 &lt;7d **且** jitter &gt;200bps fail-closed · 1,000 fuzz | 無 SY/PT/YT 路由、無市場地址、無包裝 GM→PT | 「拒絕把未結算 GM 包進 PT」 |

**賽制合規（維度 11）：** Arbitrum 部署條件滿足（Sepolia）；Robinhood 獎項適配滿足（代碼 + 測試）。**兩個保留獎可同時競標**，前提是 pitch 把產品重心放在 **Arbitrum One GMX Citadel**，Robinhood 為 **合規入口**，而非產品身份。

---

## 第三部分：20 位評審員（10男10女）詳細反饋、打分與 14 維度綜合得分矩陣

### 3.1 評分標尺

| 分 | 含義 |
|----|------|
| 9–10 | 可當場 CLI 證偽且通過；可當該 Sponsor 獎主敘事 |
| 7–8 | 工程真實，敘事需加範圍限定（Sepolia / spec / sim） |
| 5–6 | 方向對，交付物不完整或易被誇大反噬 |
| ≤4 | 失格風險或與賽制/Sponsor 錯位 |

14 維度編號：**(1)** 痛點 **(2)** 變現 **(3)** 獲客 **(4)** Sponsor 協同 **(5)** 安全/合約 **(6)** 架構 **(7)** 創新 **(8)** HFT/擴展 **(9)** DEX 生態 **(10)** Demo/Pitch **(11)** 雙鏈獎規則 **(12)** M1–M6 真實性 **(13)** Dune **(14)** AI Agent fail-closed / 博弈 LP 保護。

---

### 原班 1–10（新基線複評）

#### Judge 1 — 林浩然（男）· Arbitrum Core / Solidity

**焦點：** Gate consume-once、immutable、Halmos。

**反饋：** `SliverVineGate` 無 proxy、無 ETH 託管、`consumed` 先寫後事件，與 I6 單次使用一致。`HalmosGateInvariant.t.sol` 以 `check_*` / `property_*` 編碼「成功 consume ⇒ `consumed[d]=true` ∧ 二次呼叫 `Replayed`」。加分：Foundry 回歸 `test_regression_replay_invariant_concrete`。扣分：本輪**未執行 Halmos 符號執行器**；ECDSA 內聯正確但評審會問「為何不用 OZ」。

| 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | **均** |
|---|---|---|---|---|---|---|---|---|----|----|----|----|----|------|
| 8.5 | 7.5 | 6.5 | 7.5 | **9.2** | **9.0** | 8.0 | 7.5 | 7.5 | 7.0 | 8.5 | 8.0 | 6.0 | 8.0 | **7.9** |

#### Judge 2 — 陳詩涵（女）· Stylus & EIP Lead

**焦點：** Wasm/Stylus 對等、EIP-712、ERC-7579。

**反饋：** Edge Wasm + `checkSoilResistance` 熱路徑敘事完整；Stylus coprocessor **代碼 5/5、上鏈 pending** 必須字幕標明。EIP-712 域名 `SliverVineCitadel` / Gate 地址 SSOT 已修。Kernel v3 / 7579 為適配層 dry-run，非自研模組。

| 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | **均** |
|---|---|---|---|---|---|---|---|---|----|----|----|----|----|------|
| 8.0 | 7.0 | 6.5 | 7.0 | 8.0 | **8.5** | **8.5** | **8.8** | 7.0 | 7.0 | 8.5 | 7.5 | 6.0 | 8.0 | **7.6** |

#### Judge 3 — 周安琪（女）· Robinhood Chain Institutional

**焦點：** Ingress escort、AML、`lostUsd ≡ 0`。

**反饋：** 本輪 **A3-1 是 Robinhood 評審最大加分**。IN_FLIGHT 可 `ok: true`（路由合法）但 **`deployable: false`**，smart-route READY/ALLOW 綁 `deployable`。`lostUsd ≡ 0` 會計與「可部署」分離，避免把在途資金當 GM 腿。殘留 **A3-2**：結算時間戳仍可由呼叫方餵入。

| 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | **均** |
|---|---|---|---|---|---|---|---|---|----|----|----|----|----|------|
| **9.0** | 7.0 | 7.0 | **9.2** | 8.5 | 8.5 | 7.5 | 7.0 | 7.0 | 7.5 | **9.5** | 8.0 | 6.5 | 8.0 | **8.2** |

#### Judge 4 — Mark Holt（男）· 機構資金 / Robinhood 生態

**焦點：** 非託管 halt、guardian 權限。

**反饋：** Guardian 可立即 halt、unhalt/加簽名人 timelock，方向正確（收緊即時、放鬆延遲）。非託管：Gate 不持倉。機構問題：主網 TVL=0、session stub key 須生產注入。halt 後既簽 ALLOW 視窗（A1-2）需口頭承認。

| 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | **均** |
|---|---|---|---|---|---|---|---|---|----|----|----|----|----|------|
| 8.0 | **8.0** | 6.5 | 8.5 | **8.8** | 8.0 | 7.0 | 7.0 | 7.0 | 7.0 | 9.0 | 8.0 | 6.0 | 7.5 | **7.9** |

#### Judge 5 — 黃志偉（男）· GMX Protocol Architect

**焦點：** 10 bps UI fee、skew balancer、IOC。

**反饋：** 未簽名 GMX v2 payload 注入 `uiFeeReceiver` + 10 bps 是 **可截圖的 Sponsor 證據**。Balancer 資格路由存在。IOC/limit 在 HL hedge 路徑。扣：主網 `claimUiFees` 未跑；合成深度已從生產 hedge 移除（A2-1），對 GMX LP 敘事加分。

| 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | **均** |
|---|---|---|---|---|---|---|---|---|----|----|----|----|----|------|
| 8.5 | **8.8** | 7.0 | **9.0** | 8.0 | 8.0 | 7.5 | 8.0 | **9.0** | 7.5 | 8.0 | 8.0 | 7.0 | 8.0 | **8.2** |

#### Judge 6 — 吳佩珊（女）· Pendle Yield Architect

**焦點：** PT/YT 到期、maturity × yield jitter fail-closed。

**反饋：** `evaluatePendlePtExpiryRisk` + 1,000 fuzz + 7d/200bps 邊界測試 **證明團隊懂 PT 末日風險**。但這不是 Pendle 集成：無 Market、無 SY、無 YT 對沖、無到期結算流。Sponsor 獎需誠實定位為 **「拒絕把未結算 GMX 異步 GM 包進 PT」的防護閘**。

| 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | **均** |
|---|---|---|---|---|---|---|---|---|----|----|----|----|----|------|
| 7.0 | 6.0 | 5.5 | **6.8** | 7.5 | 7.0 | 7.0 | 6.5 | **6.5** | 6.5 | 7.0 | 7.0 | 6.0 | 7.5 | **6.7** |

#### Judge 7 — 林恩慈（女）· Dune Analytics Data Lead

**焦點：** Telemetry API、三查詢 dashboard。

**反饋：** `GET /api/grant-audit` 是即時證明面；規格內三 SQL（護航量、soil trip、10 bps 應計）結構正確且綁 SSOT 模組。**沒有 Dune 公開連結 = 不能拿 Dune 獎當已交付。** M-Dune 列為獨立解鎖正確。

| 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | **均** |
|---|---|---|---|---|---|---|---|---|----|----|----|----|----|------|
| 7.0 | 7.0 | 6.5 | 7.0 | 7.0 | 7.0 | 6.5 | 7.0 | 6.5 | 7.0 | 7.5 | 8.0 | **6.5** | 7.0 | **7.0** |

#### Judge 8 — 鄭子謙（男）· AI Quant & WASM

**焦點：** 10k 蒙地卡羅、sub-ms Edge。

**反饋：** p50 ~106µs + Wasm 熱路徑是差異化。10k 模擬與 soil 閾值對齊，**87.39% 比虛構 99.82% 更可信**。扣：IL 公式簡化；非 cadCAD；Edge 延遲需現場 `grant-advanced-resilience-benchmark` 才算「看到」。

| 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | **均** |
|---|---|---|---|---|---|---|---|---|----|----|----|----|----|------|
| 8.0 | 7.0 | 6.5 | 7.0 | 8.0 | **8.5** | **8.5** | **9.0** | 7.0 | 7.0 | 8.0 | 7.5 | 6.5 | **9.0** | **7.8** |

#### Judge 9 — David Chen（男）· Crypto VC

**焦點：** PMF、三通道分發、50% builder fee 分成。

**反饋：** 痛點（預執行攔截）對機構/Agent 真實。變現錨在 GMX 10 bps，非另收費。三通道（Eliza/LangChain/AutoGPT hook、機器人 CaaS、50% 分成）**寫在藍圖，缺現成 adapter 包**。主網零成交是 VC 最大折扣。

| 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | **均** |
|---|---|---|---|---|---|---|---|---|----|----|----|----|----|------|
| 8.0 | **8.2** | **6.8** | 7.5 | 7.5 | 7.5 | 8.0 | 7.5 | 7.5 | 7.0 | 8.0 | 7.5 | 6.5 | 7.5 | **7.5** |

#### Judge 10 — 徐佳寧（女）· Product & Buildathon 體驗

**焦點：** 180 秒影片對齊。

**反饋：** 現有 storyboard 標題為 **35 秒**，Buildathon 常見 **180 秒**。HUD/1-click 路徑存在，但評審要「拒絕一筆、放行一筆、Arbiscan、反向橋紅燈」。產品完成度高於 pitch 完成度。

| 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | **均** |
|---|---|---|---|---|---|---|---|---|----|----|----|----|----|------|
| 8.0 | 7.5 | **7.5** | 7.5 | 7.0 | 7.5 | 7.5 | 7.0 | 7.5 | **6.4** | 8.0 | 7.5 | 6.5 | 7.5 | **7.4** |

---

### 特種作戰班 11–20

#### Judge 11 — Alex Rivera（男）· Formal Verification & Cryptography

**焦點：** Halmos 符號執行數學證明。

**反饋：** 引理寫清：∀ 符號 `payloadHash, nonce, riskBps`（接受域內）consume 一次 ⇒ flag；二次 ⇒ `Replayed.selector`。這是 **可編譯的證明意圖**，不是白皮書口號。嚴格 Halmos 評審會要求 `halmos --function check_replay_must_revert` 產物。ECDSA 內聯 + EIP-712 域分離合格。Agent Guard 零地址域須主動解釋。

| 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | **均** |
|---|---|---|---|---|---|---|---|---|----|----|----|----|----|------|
| 7.5 | 6.5 | 6.0 | 7.0 | **9.0** | **9.0** | 8.0 | 7.5 | 6.5 | 6.5 | 8.0 | 7.5 | 6.0 | 8.0 | **7.5** |

#### Judge 12 — Sophia Zhang（女）· 量化風險 & 博弈論

**焦點：** `$9.88M` LP 保護真實性。

**反饋：** **加分：** 未宣稱 99.82%；種子固定可複現；對齊真實 fuse。**扣分：** `$9.88M` 是 10k 次訂單名義的累計差額，易被誤讀成「已為 LP 省下近千萬」；IL 係數啟發式；無對手方最優反應（搜尋者可改 tip 而非只衝擊深度）。建議 pitch 改口：**「在本模型下，崩盤+三明治情境 Citadel 攔截 87.39% 有毒腿，累計模擬保護約 $9.88M 名義。」**

| 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | **均** |
|---|---|---|---|---|---|---|---|---|----|----|----|----|----|------|
| 8.0 | 7.0 | 6.0 | 7.0 | 8.0 | 8.0 | 7.5 | 8.0 | 7.0 | 6.5 | 7.5 | 7.5 | 6.5 | **8.2** | **7.4** |

#### Judge 13 — Marcus Vance（男）· HFT MEV Searcher / Red Team

**焦點：** A3-1/A2-1 修補、30s TTL mempool 競速。

**反饋：** A3-1/A2-1 修補命中紅隊最高優先。MEV 無法用他人 attestation 改寫 `GatedExecutor` 綁定（initiator+data+nonce+chainId）。**30s TTL 仍是審查/延遲 griefing，不是偷錢。** A3-2 時鐘偽造、A1-2 舊 ALLOW 仍是他會在 Q&A 追問的洞。W01 深度膨脹（A2-2）未在本輪關閉。

| 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | **均** |
|---|---|---|---|---|---|---|---|---|----|----|----|----|----|------|
| 8.5 | 7.0 | 6.0 | 7.5 | **8.3** | 8.0 | 7.5 | **8.5** | 7.5 | 6.5 | 8.0 | 7.5 | 6.0 | **8.5** | **7.6** |

#### Judge 14 — Elena Rostova（女）· 跨鏈橋 & 結算架構

**焦點：** Across Ingress `deployable` 僅 SETTLED。

**反饋：** 狀態機標籤（AVAILABLE / IN_FLIGHT / SETTLED / TIMEOUT / AML）清晰。`deployable` 謂詞正確。預覽預設 settled 時間窗（避免「預覽永遠 DENY」）需在 demo 展示 **顯式 `settledAtMs: null` 的 DENY**。跨鏈真實填充證明仍缺（Across 事件未綁 `settledAtMs`）。

| 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | **均** |
|---|---|---|---|---|---|---|---|---|----|----|----|----|----|------|
| **8.8** | 7.0 | 6.5 | **8.8** | 8.5 | **8.8** | 7.5 | 7.0 | 7.0 | 7.5 | **9.2** | 8.0 | 6.5 | 8.0 | **8.1** |

#### Judge 15 — Kenji Sato（男）· 法幣/加密合規顧問

**焦點：** AML inbound、無幽靈虧損會計。

**反饋：** Inbound Robinhood 封鎖 + `lostUsd ≡ 0` 符合「在途≠損失」。非託管、無協議層鎖倉敘事與機構合規對齊。**不是持牌 AML 程式**：無 KYC、無 Travel Rule、無制裁名單鏈上強制（黑名單在 IngressSafetySwitch，需證明運營流程）。MiCA/travel 映射仍是備忘錄層。

| 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | **均** |
|---|---|---|---|---|---|---|---|---|----|----|----|----|----|------|
| 8.5 | 7.5 | 6.5 | 8.5 | 8.0 | 8.0 | 7.0 | 6.5 | 7.0 | 7.0 | **9.0** | 8.0 | 6.5 | 7.5 | **7.8** |

#### Judge 16 — Chloe Dubois（女）· DevRel & SDK Growth

**焦點：** Eliza / LangChain / AutoGPT 管道。

**反饋：** `@slivervine/citadel-sdk` 表面（`guardAgentUserOp` / `verifyAgentIntent`）適合掛 pre-bundler。**沒有** `packages/eliza-plugin` 或 LangChain tool 示例倉庫。50% builder fee 分成是商務條款，需積分錢包白名單設計。DevRel 分數被「文件管道 vs 可 npm 安裝適配器」拉開。

| 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | **均** |
|---|---|---|---|---|---|---|---|---|----|----|----|----|----|------|
| 7.0 | 7.5 | **6.2** | 7.0 | 7.0 | 7.5 | 7.5 | 7.0 | 7.5 | 7.0 | 7.5 | 7.0 | 6.5 | **7.8** | **7.1** |

#### Judge 17 — Brian O'Connor（男）· Arbitrum Foundation Grant Auditor

**焦點：** M1–M6 里程碑真實性。

**反饋：** 拆成 M-Sepolia / M-CLI / M-RH-Demo / M-GMX-Fee / M-Dune / M6-Mainnet **符合綁里程碑發放**。M-CLI 768 PASS、M-Sepolia 三地址可驗。M6 主網未假裝完成。風險：影片與 Dune 仍標 ⏳，勿在申請表勾「已交付」。

| 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | **均** |
|---|---|---|---|---|---|---|---|---|----|----|----|----|----|------|
| 8.0 | 8.0 | 7.0 | 8.0 | 8.0 | 8.0 | 7.5 | 7.5 | 8.0 | 7.0 | **8.8** | **8.8** | 7.0 | 8.0 | **7.9** |

#### Judge 18 — Tara Patel（女）· On-Chain Telemetry & Indexer

**焦點：** Dune schema、telemetry API 性能。

**反饋：** grant-audit KV 對帳設計正確（off-chain soil trip 需 spell 攝取）。SQL 引用 `dune.silvervinelabs.*` 表 **尚未存在於 Dune**。Edge 延遲與索引器延遲是兩條曲線，勿把 106µs 說成 Dune 刷新。

| 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | **均** |
|---|---|---|---|---|---|---|---|---|----|----|----|----|----|------|
| 7.0 | 6.5 | 6.5 | 7.0 | 7.0 | 7.0 | 6.5 | 7.5 | 6.5 | 6.5 | 7.5 | 8.0 | **6.4** | 7.0 | **6.9** |

#### Judge 19 — Viktor Krumm（男）· HFT Citadel 執行 & LP

**焦點：** 活 L2 探針 vs 合成深度。

**反饋：** `buildLiveHedgeSoilInput` + `HEDGE_SOIL_L2_TRIP` 是 **執行台會真正在意的修補**。合成 $500k 會讓 soil 在真實簿崩潰時放行有毒對沖。殘留：probe 失敗即整 tick skip（cron catch）——正確 fail-closed，但需監控告警否則「看起來沒對沖」。HL 與 GMX 仍跨場，延遲≠106µs 熱路徑。

| 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | **均** |
|---|---|---|---|---|---|---|---|---|----|----|----|----|----|------|
| 8.5 | 7.5 | 6.0 | 8.0 | 8.5 | 8.0 | 7.5 | **9.0** | **8.5** | 6.5 | 8.0 | 8.0 | 6.0 | **9.0** | **7.9** |

#### Judge 20 — Jessica Alba（女）· HackQuest 主席評審

**焦點：** Overall 70k 與 Promising Track 勝率。

**反饋：** 工程密度高於多數線上黑客松項目；賽制雙鏈資格清楚。Overall 70k 競爭的是 **完整敘事 + 現場 demo + Sponsor 四腿**。Pendle/Dune 未落地、主網零 TVL、35s vs 180s 分鏡，會把 Overall 從「前排」打到「強勁決賽圈」。**Promising Track 更匹配**（創新 + 未完全商業化）。建議：Overall 衝 GMX+Robinhood+Arbitrum 三角，Pendle 用 15 秒誠實段止損。

| 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | **均** |
|---|---|---|---|---|---|---|---|---|----|----|----|----|----|------|
| 8.5 | 8.0 | 7.0 | **7.8** | 8.5 | 8.0 | **8.5** | 8.0 | 7.5 | **6.8** | **9.0** | 8.0 | 6.5 | 8.0 | **7.9** |

---

### 3.2 20×14 綜合矩陣（均分一覽）

| # | 評審 | 性別 | 角色 | 14 維均分 |
|---|------|------|------|-----------|
| 1 | 林浩然 | 男 | Solidity / Gate | 7.9 |
| 2 | 陳詩涵 | 女 | Stylus / EIP | 7.6 |
| 3 | 周安琪 | 女 | Robinhood 機構 | 8.2 |
| 4 | Mark Holt | 男 | 機構資金 | 7.9 |
| 5 | 黃志偉 | 男 | GMX | 8.2 |
| 6 | 吳佩珊 | 女 | Pendle | 6.7 |
| 7 | 林恩慈 | 女 | Dune | 7.0 |
| 8 | 鄭子謙 | 男 | Quant / WASM | 7.8 |
| 9 | David Chen | 男 | VC | 7.5 |
| 10 | 徐佳寧 | 女 | 產品 / 影片 | 7.4 |
| 11 | Alex Rivera | 男 | 形式驗證 | 7.5 |
| 12 | Sophia Zhang | 女 | 博弈量化 | 7.4 |
| 13 | Marcus Vance | 男 | MEV 紅隊 | 7.6 |
| 14 | Elena Rostova | 女 | 跨鏈結算 | 8.1 |
| 15 | Kenji Sato | 男 | 合規 | 7.8 |
| 16 | Chloe Dubois | 女 | DevRel / SDK | 7.1 |
| 17 | Brian O'Connor | 男 | Grant 審計 | 7.9 |
| 18 | Tara Patel | 女 | 索引 / Dune | 6.9 |
| 19 | Viktor Krumm | 男 | HFT / LP | 7.9 |
| 20 | Jessica Alba | 女 | 主席評審 | 7.9 |

**20 人算術平均：7.67 ≈ 7.7 / 10**  
**男女分組：** 男 10 人均 **7.80** · 女 10 人均 **7.53**（落差主要來自 Pendle/Dune/DevRel/影片評審更嚴）

**維度弱項（全場）：** (13) Dune 落地 · (10) 180s 影片 · (3) 獲客實證 · Pendle 深度。  
**維度強項：** (11) 雙獎規則 · (5) 合約/Halmos · (1) 痛點 · (14) fail-closed（修補後）· GMX/Robinhood 協同。

---

## 第四部分：20 位評審員對 180 秒 Demo 影片的必看亮點清單

現有 [`GRANT_PITCH_AND_VIDEO_STORYBOARD.md`](../pitch/GRANT_PITCH_AND_VIDEO_STORYBOARD.md) 為 **35 秒**。下列為 **180 秒** 必拍清單（打勾 = 對應評審不會在 Q&A 用「沒看到」否決）。

### 4.1 禁止鏡頭 / 禁止台詞（全場）

- 禁止把 **$9.88M** 說成「已為真實 LP 節省」；必須加「10,000 次模擬名義」。
- 禁止說 **99.82%**；產物是 **87.39%**。
- 禁止「Halmos 已跑完全部符號空間」；可說「已提交 `check_*` 不變量契約」。
- 禁止 Stylus「已主網部署」；禁止 SDK 佔位 `0x511E…`。
- 禁止 APY 保證、禁止 25% rebate 當協議不變量。
- 禁止把 Hyperliquid 說成滿足「部署在 Arbitrum」的唯一證據。
- 禁止把 IN_FLIGHT 說成「可以進 GM」。

### 4.2 180 秒分鏡（對應評審）

| 秒 | 畫面 | 點名評審 |
|----|------|----------|
| 0–8 | 標題：Arbitrum Sepolia + Robinhood 46630 + GMX · 小字 Pendle **guard** / Dune **spec** | 11, 20 |
| 8–22 | 痛點：有毒流 / 橋接誤記虧損 vs `lostUsd ≡ 0` | 3, 15 |
| 22–42 | **Fail-closed：** 拉滑點或斷 L2 → 無廣播 · 可疊 `HEDGE_SOIL_L2_TRIP` 日誌 | 8, 13, 19 |
| 42–62 | Arbiscan：Gate `0xb174…` · 口播 consume-once + Halmos 引理一句 | 1, 11 |
| 62–82 | GMX payload：`uiFeeReceiver` **10 bps** · balancer qualified | 5, 9 |
| 82–108 | Robinhood：outbound OK · inbound BLOCK · **IN_FLIGHT `deployable: false`** | 3, 4, 14 |
| 108–125 | `curl /api/grant-audit` · Dune 三面板為 **M-Dune** | 7, 18 |
| 125–140 | Pendle **15 秒誠實：** &lt;7d 且 jitter&gt;200bps fail-closed · 不包裝未結算 GM | 6 |
| 140–158 | 蒙地卡羅 JSON：`87.39%` · `$9.88M 模擬名義` · 種子 42 | 8, 12 |
| 158–172 | 里程碑：M-Sepolia/M-CLI 已交 · M6 主網綁 Grant · 10 bps CaaS | 9, 17, 20 |
| 172–180 | CLI 字幕 **174 files \| 768 PASS** · QR 到 live HUD | 10, 全場 |

### 4.3 評審「具體要看到」的核對表

| 評審 | 必看 3 秒證據 |
|------|----------------|
| 1 / 11 | 已驗證 Gate 地址 + `Replayed` / consumed 口播 |
| 2 | Wasm 或 Stylus **代碼**畫面，字幕 Pending on-chain |
| 3 / 14 / 15 | inbound revert + `deployable: false` JSON |
| 4 | halt 權限不對稱一句（guardian vs timelock） |
| 5 / 19 | 10 bps 欄位 + 「活 L2、無 $500k 假深度」 |
| 6 | PT guard 測試或 UI 拒絕近到期 |
| 7 / 18 | grant-audit JSON，**不要**假 Dune 連結 |
| 8 / 12 | `game_theory_simulation_results.json` 特寫 |
| 9 / 16 | SDK import 一行 + 50% 分成是 **夥伴條款** |
| 10 / 20 | 紅燈拒絕 + 綠燈允許對照；片長真的 180s |
| 13 | 30s TTL = griefing 非偷錢，一句就夠 |
| 17 | 里程碑表：已勾 vs ⏳ 分開 |

---

## 第五部分：終極勝選路徑與 Grant 解鎖戰略結論

### 5.1 資金路徑優先序（20 評審共識）

1. **Robinhood 保留獎** — 最高確定性。演示 A3-1。  
2. **GMX 相關 Grants / Sponsor** — 10 bps 可證偽。  
3. **Arbitrum 保留獎** — Sepolia 三件套 + 768 PASS + Halmos 契約。  
4. **Promising Track 15k** — 主席評審路徑；強調創新與誠實缺口。  
5. **Overall 70k** — 需 180s 影片達標 + 至少 Dune 草稿公開或明確 14 天發布 SLA。  
6. **Pendle / Dune 獎** — 當「下一里程碑」而非本週已贏。

### 5.2 里程碑綁定發放（對齊賽制，避免 M6 一口吃）

| ID | 解鎖條件 | 狀態 | 建議綁定獎金比例（內部） |
|----|----------|------|--------------------------|
| **M-Sepolia** | 三合約 Arbiscan | ✅ | 15% |
| **M-CLI** | 174/768 PASS | ✅ | 10% |
| **M-RH-Demo** | 180s 含 inbound + deployable | ⏳ 影片 | 20%（Robinhood 軌） |
| **M-GMX-Fee** | 10 bps 注入 · 主網 claim 另列 | ✅ 注入 / ⏳ claim | 20%（GMX 軌） |
| **M-Dune** | 三面板公開 dashboard | ⏳ 規格 | 15%（Dune 軌） |
| **M-Pendle-Guard** | 現有 fuzz；市場適配另開 V1 | ✅ guard | 5%（誠實小額） |
| **M6-Mainnet** | 限額主網 + 活 uiFee | ⏳ | 15% + 主網風險保留 |

### 5.3 主網前必須關閉（否則機構/紅隊評審一票否決實盤）

1. **A3-2：** `settledAtMs` 必須來自橋填充證明，禁止呼叫方時鐘。  
2. 生產 `CITADEL_SESSION_KEY` / HMAC 非 stub。  
3. Dune 至少發布 **一個** 公開 query（可先用 Sepolia 稀疏數據）。  
4. 180s 影片按第四部分拍攝；storyboard 文件標題與賽制對齊。

### 5.4 一句對外 SSOT（評審可複誦）

> SilverVine 是部署在 **Arbitrum** 的 **預執行 Citadel**：Sepolia Gate **consume-once**（Halmos 不變量契約）、Robinhood **單向 AML 護航且僅 SETTLED 可部署**、GMX **10 bps** 未簽名注入、生產對沖 **活 L2 fail-closed**。回歸 **174 files \| 768 PASS**。Pendle 是 **到期防護閘**，Dune 是 **三查詢規格**。蒙地卡羅：**87.39%** 有毒腿攔截、**$9.88M 模擬名義** LP 保護（非實盤 TVL）。

### 5.5 最終裁決

| 命題 | 裁決 |
|------|------|
| 是否符合「必須部署 Arbitrum 鏈」 | **是**（Sepolia 已驗證） |
| 是否同時具備 Robinhood 與 Arbitrum 保留獎資格 | **是** |
| 工程是否配得上 Overall 決賽圈 | **是**（7.7/10） |
| 是否已「贏下」Pendle/Dune 獎 | **否**（guard/spec ≠ 生態集成/公開儀表板） |
| 本輪相對 10 評審的淨變化 | **安全敘事可防守**；影片與 Dune 仍是 Overall 瓶頸 |

---

*SilverVine Labs · 內部文件 · Buildathon 20 評審終極模擬（Grok 4.6）· Vitest SSOT: 174 files \| 768 PASS (100% Clean · Exit Code 0) · 本輪未重跑測試 · 2026-08-30*
