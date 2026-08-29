# SilverVine Citadel Protocol — 黑帽極限攻擊與 MEV 清算套利對抗審計報告

> **分類：** 內部 Red-Team / OpSec · 禁止直接公開  
> **協議：** SilverVine Citadel v0.8 Santenmoku  
> **審計範圍：** `src/` · `contracts/` · `SliverVineGate/` · `docs/`  
> **安全基線：** Vitest **174 files | 768 PASS (100% Clean · Exit Code 0)**；本輪依指示未重跑測試  
> **方法：** 攻擊路徑靜態追蹤、信任邊界反演、TOCTOU 分析、會計狀態機與鏈上執行語意交叉驗證

---

## 執行摘要

本輪共識別 **9 條攻擊向量**：

| ID | 攻擊面 | 嚴重度 | 可造成任意資金竊取？ | 主網前狀態 |
|----|--------|--------|--------------------|------------|
| A1-1 | 30 秒 TTL 排序審查 / 到期 griefing | Medium | 否 | 應硬化 |
| A1-2 | Edge sever 後舊 ALLOW 仍可執行 | Medium | 僅既簽 payload | **必修** |
| A1-3 | 繞過 `GatedExecutor` 的 Gate-only 誤整合 | Low / High（誤整合） | 條件式 | **必修整合規範** |
| A2-1 | GMX↔HL 生產路徑使用同價 + 固定 $500k 假深度 | **High** | 可造成有毒成交，不是簽章竊取 | **必修** |
| A2-2 | Soil 檢查到簽名間 TOCTOU + W01 深度膨脹 | Medium | 條件式有毒成交 | **必修** |
| A2-3 | `reduceOnly` / `skipPreTrade` 全面略過 soil / tsunami | Medium | 無法增倉，但可高滑點錯誤平倉 | 應硬化 |
| A3-1 | `IN_FLIGHT` 被當作 `ok: true` / 可部署 | **High** | 可形成裸 GM/HL 腿 | **必修** |
| A3-2 | 呼叫方偽造 `settledAtMs` / `nowMs` | **Critical（若連到實盤）** | 可偽造已結算並解鎖執行 | **阻擋主網** |
| A3-3 | Chain ID、token、IngressSafetySwitch 與鏈上狀態脫鉤 | **High** | 間接；可偽造合規與資金狀態 | **必修** |

### 最重要的誠實結論

1. **未發現 canonical `GatedExecutor` 路徑可被第三方觀察者改寫 calldata、竊取 attestation 或跨鏈 replay 的 Critical 漏洞。** `initiator + target + keccak256(data) + nonce + chainId + executor` 綁定有效。
2. 30 秒 mempool 視窗的主要風險是 **審查、延遲、重複送單 gas griefing，以及 sever 後舊 ALLOW 的政策失效視窗**，不是任意 payload 搶跑。
3. 真正危險面位於鏈下執行與跨鏈狀態：
   - 生產 GMX↔HL hedge 使用 **相同價格與固定 $500k 深度**，使 Soil 對真實跨場崩塌失明。
   - Ingress 把 **IN_FLIGHT 視為 escort OK**，且 `settledAtMs` 可由呼叫方提供；這會把「`lostUsd ≡ 0` 會計標籤」誤當作「資金已安全到帳」。
4. **174/768 PASS 不等於上述路徑安全。** 至少一項測試目前把 IN_FLIGHT `bridgeEscortOk === true` 當作正確結果，屬「測試固化錯誤語意」。

---

## 第一部分：攻擊者 1（MEV 搜尋者）— Mempool 搶跑與 Attestation 夾心攻擊

### 威脅模型

攻擊者可監看公開 RPC / bundler queue、提高 priority fee、重送 victim calldata，或具備 sequencer 排序 / 審查能力；但不持有 quorum signer 私鑰，也不能偽造 ECDSA。

### A1-1：30 秒 TTL 排序審查與 digest race

**類型：** Liveness griefing；非任意資金竊取  
**嚴重度：** Medium

#### 精確攻擊步驟

1. Citadel 簽發：
   - `issuedAt = t0`
   - `expiresAt ≤ t0 + 30`
   - `payloadHash = H(chainId, executor, initiator, target, keccak256(data), nonce)`
2. `(att, signatures, target, data)` 出現在公開 mempool 或 bundler queue。
3. 搜尋者複製 victim transaction、提高 tip，或 sequencer 直接延後 victim。
4. 若攻擊者不是原 initiator：
   - `GatedExecutor._assertBinding()` 以 `msg.sender` 重算 payload hash。
   - 攻擊者地址不同，交易因 `PayloadMismatch()` 失敗。
5. 若 sequencer 把 victim 延遲至 `block.timestamp > expiresAt`：
   - Gate 回傳 / revert `Expired`。
   - victim 必須重新取得 attestation，錯過交易窗口。
6. 若 victim bundler 重複送同一交易：
   - 第一筆成功並寫入 `consumed[digest] = true`。
   - 第二筆因 `Replayed()` revert，造成 gas 與 UX 損失。

#### 現有防禦

- `GatedExecutor.payloadHash()` 綁定：
  - `block.chainid`
  - `address(this)`
  - `initiator`
  - `target`
  - `keccak256(data)`
  - `nonce`
- `SliverVineGate` 檢查 `msg.sender == att.subject`，外部 EOA 無法直接搶先 consume executor 專用 attestation。
- `consumed[digest]` 防止成功後 replay。
- `MAX_TTL = 30` 限制存活時間。
- `restrictTargets` 可阻擋非 allowlist target。

#### 殘留判定

第三方搜尋者無法把合法 attestation 改成惡意 calldata，也無法以自己地址重播 victim payload。可行的是：

- 審查至過期；
- 製造重複送單；
- 使使用者錯失對沖窗口；
- 若攻擊者控制 initiator / bundler，先執行原本已授權的同一 payload。

#### 修補方案

```solidity
// 方向：部署新 Gate 版本時將 TTL 降至 10–15 秒。
uint64 public constant MAX_TTL = 15;
```

- 使用私有 bundler / FCFS relay，完整 `(att, sigs)` 不進公開 gossip。
- client 遇 `Expired` / `Replayed` 自動旋轉 nonce 並重新 attestation。
- 對重複 digest 在 bundler 層做 single-flight 去重。
- 不建議改用 `block.number` 取代 timestamp；Arbitrum `block.number` 語意有 L1 高度陷阱。

---

### A1-2：Edge sever 後舊 ALLOW 的 15–30 秒殘留執行窗

**類型：** Incident-window policy bypass  
**嚴重度：** Medium；主網前必修

#### 精確攻擊步驟

```text
T+0ms      Soil/R17/R20 觸發，Edge 執行 severSigningChannel()
T+0~5s     已簽發但未 consume 的 ALLOW 仍在網路傳播
T+5~15s    RiskOracle STATUS_SHUTDOWN 尚未完成上鏈
T+<30s     attestation 尚未過期，且 SliverVineGate.halted == false
```

攻擊者必須是合法 initiator，或已控制 initiator / AA session key。其提交的是 **Citadel 在事故前已簽的原 payload**。Gate 不讀 Edge sever 狀態，也不依賴 `IngressSafetySwitch`，因此仍可成功：

1. `_validate()` 通過 quorum、TTL、subject 與 replay。
2. `consumed[digest] = true`。
3. `GatedExecutor` 呼叫原 target。

#### 現有防禦

- 舊 payload 最長 30 秒自然過期。
- guardian 可立即 `halt()`。
- Edge sever 阻止新簽章。
- payload 無法被改寫。

#### 殘留判定

這不是 calldata theft，但在黑天鵝期間可執行「一秒前安全、現在已不安全」的交易。對高槓桿對沖而言，政策失效本身足以造成損失。

#### 修補方案

**P0 架構：**

```typescript
await Promise.allSettled([
  severSigningChannel(reason),
  submitGateHaltTransaction(reason),
  submitRiskOracleShutdown(reason),
]);
```

- R17/R20 / fatal soil trip 必須平行觸發 Gate `halt()` 與 RiskOracle flush。
- elevated-risk 模式動態把 attestation TTL 降至 10 秒。
- 引擎維護 `riskEpoch`；每次 sever 增加 epoch，新 attestation 綁 epoch。鏈上 Gate / Executor 比對當前 epoch，批次廢止所有舊 ALLOW。

**Solidity 方向：**

```solidity
interface IRiskEpoch {
    function epoch() external view returns (uint64);
    function isSystemFlushed() external view returns (bool);
}

modifier riskPlaneLive(uint64 attestedEpoch) {
    if (riskEpoch.isSystemFlushed()) revert SystemFlushed();
    if (attestedEpoch != riskEpoch.epoch()) revert StaleRiskEpoch();
    _;
}
```

此修改需新 attestation typehash / 新 Gate 版本，不應直接破壞既有 EIP-712 域。

---

### A1-3：Gate-only `verifyAndConsume()` 的誤整合語意

**類型：** Integration footgun  
**嚴重度：** canonical 路徑 Low；第三方誤整合 High

#### 精確攻擊步驟

`SliverVineGate` 只驗證被簽署的 `payloadHash` 值，**不理解該 hash 應對應哪段 calldata**。語意綁定發生在 `GatedExecutor._assertBinding()`。

若第三方 integrator：

1. 直接以自己的 contract 作 `att.subject`；
2. 呼叫 `verifyAndConsume(att, signatures)`；
3. 不重算 `payloadHash`；
4. 在另一段程式或另一筆 tx 執行 H′；
5. 只以 `AttestationConsumed` event 當授權證明；

則可出現「consume H、執行 H′」的語意脫鉤。這需要錯誤整合或 subject 合約本身惡意，不是 canonical executor 漏洞。

#### 現有防禦

- canonical `GatedExecutor.execute()` 原子化：
  1. binding；
  2. consume；
  3. external call。
- target revert 會整筆回滾，`consumed` 不會永久卡死。
- SDK 有對應 payload hash helper。

#### 修補方案

- 部署層只允許核准 executor 作 `subject`。
- SDK 文件明文禁止把 `AttestationConsumed` 單獨當成 execution proof。
- 監控應採 `GatedExecuted` event，而非只採 Gate consume event。
- 可選新 Gate 版本加入 `allowedExecutor[subject]`：

```solidity
if (!allowedExecutor[att.subject]) revert UnapprovedExecutor();
```

---

## 第二部分：攻擊者 2（跨場套利者）— 高頻 Jitter 穿透與有毒流套利

### 威脅模型

攻擊者不需破解 HMAC / EIP-712；只需在 GMX 與 Hyperliquid 間製造短暫 mark divergence、撤掉 top-of-book 深度、操控 allowlisted RPC 回應時間，或等待 HKT 21–23 流動性脆弱窗口。

### A2-1：生產 hedge 的 synthetic soil — 同價與固定 $500k 深度

**類型：** False-positive ALLOW / toxic execution  
**嚴重度：** High；主網阻擋項

#### 精確攻擊步驟

1. 攻擊者在 HL 撤除 top-of-book 深度，或把 HL perp mark 推離 GMX pool mid。
2. scheduled cron / cross-wallet hedge 啟動。
3. soil input 並非真實跨場：

```typescript
{
  hlSpot: ethMark,
  hlPerp: ethMark,
  dydxPerp: ethMark,
  depthUsd: 500_000,
}
```

4. `crossVenueSlippage = abs(dydxPerp - hlPerp) / hlPerp = 0`。
5. 固定 `depthUsd = 500_000` 通過 min-depth。
6. Arbitrum sequencer / gas probe 即使健康，HL 真實簿深已崩。
7. executor 發出 IOC short / unwind；1% limit buffer 仍可能在薄簿成交於極差價格，或反覆失敗造成裸 GM delta。

#### 現有防禦

- Arbitrum sequencer、soft-confirm、gas guard。
- session notional caps / Dynamic Max SL。
- IOC limit price。
- `auditHyperliquidLiveSoil()` 具 500ms stale fail-closed，但 **未接入此生產 hedge 路徑**。
- HKT tsunami window 可阻擋一般 opening，但不能補足全天真實深度。

#### 修補方案

**P0：禁止生產程式自行填固定深度或鏡像價格。**

```typescript
interface LiveHedgeSoilTicket {
  hlBid: number;
  hlAsk: number;
  hlDepthUsd: number;
  gmxMidUsd: number;
  probedAtMs: number;
  bookHash: string;
}

export async function buildLiveHedgeSoilInput(
  symbol: string,
  orderUsd: number,
): Promise<SoilResistanceInput> {
  const [hl, gmx] = await Promise.all([
    auditHyperliquidLiveSoil(symbol, { probeUsd: orderUsd }),
    fetchGmxPoolMidUsd(symbol),
  ]);
  if (!hl || hl.tripped) throw new Error("HEDGE_SOIL_L2_TRIP");
  return {
    symbol,
    hlSpot: (hl.probe.bestBid + hl.probe.bestAsk) / 2,
    hlPerp: hl.probe.bestAsk,
    dydxPerp: gmx.midUsd,
    depthUsd: hl.probe.depthUsd,
    orderSizeUsd: orderUsd,
    at: new Date(),
  };
}
```

- 將錯名 `dydxPerp` 重構為 `referenceVenuePrice`，避免 GMX/HL 路徑用錯語意。
- live ticket 必須附 `probedAtMs` 與 top-3 `bookHash`。
- 禁止 caller-supplied `depthUsd` 進入 production executor。
- 若 GMX mid 或 HL L2 任一來源失敗，直接 fail-closed，不回退固定值。

---

### A2-2：Soil 通過到 EIP-712 / HL 簽名間 TOCTOU

**類型：** Snapshot bait-and-pull  
**嚴重度：** Medium

#### 精確攻擊步驟

1. 攻擊者短暫掛入大量 HL 深度，使 T0 snapshot 通過。
2. `auditHyperliquidLiveSoil()` 產生 pass。
3. W01 在部分 grant/testnet 路徑把深度改成：
   - `max(preTrade.depthUsd, baseDepth + depthBoost)`
4. 攻擊者撤單，T1 真實簿深崩塌。
5. `executeSignedAction()` 再跑一次 soil，但使用 **同一個已變異 `preTrade` 物件**，不是新 RPC / WS snapshot。
6. 通過後立即簽名與 POST。

#### 現有防禦

- 同步執行 `assertPreTradeValidation` 與 soil 二次計算。
- live L2 snapshot 超過 500ms 可 fail-closed。
- 50ms lead depth probe helper 已存在，但未在所有簽名路徑強制呼叫。

#### 修補方案

```typescript
const SIGN_SOIL_MAX_AGE_MS = 200;

async function assertFreshSoilAtSign(ticket: SoilTicket): Promise<void> {
  if (Date.now() - ticket.probedAtMs > SIGN_SOIL_MAX_AGE_MS) {
    throw new Error("SOIL_TICKET_STALE");
  }
  const fresh = await fetchLiveTop3Book(ticket.symbol);
  if (fresh.bookHash !== ticket.bookHash) {
    const verdict = checkSoilResistance(buildInput(fresh));
    if (verdict.tripped) throw new Error("RESIGN_SOIL_TRIP");
  }
}
```

- 在 `signHyperliquidAction()` **前一行**重探；不要只在 service 上游探。
- production 模式禁止 `applyW01DepthRefillDefense()` 增加觀測深度。
- W01 應改為「要求補深後重新觀測」，而不是在本地把 depth 數值加大。
- ticket 由內部 probe service HMAC 簽署；executor 驗 MAC 與 TTL。

---

### A2-3：`reduceOnly` / `skipPreTrade` 略過所有 soil 與 HKT tsunami

**類型：** Emergency-exit safety bypass  
**嚴重度：** Medium

#### 精確攻擊步驟

1. allowlisted RPC 回傳 stale GMX delta，系統誤判 over-hedged。
2. cron 選擇 unwind，產生 `reduceOnly: true`。
3. `executeHlSessionKeyOrder()` 設定：

```typescript
skipPreTrade: reduceOnly || opts.skipPreTrade === true
```

4. transport 將 `soilTripped = false`，略過：
   - depth；
   - cross-venue slippage；
   - HKT 21–23 tsunami；
   - Agent deadman。
5. 攻擊者在 HL 薄簿時承接 buy-to-cover；系統以高滑點平空，留下 GM long 裸曝險。

#### 現有防禦

- reduce-only 無法增加 HL short。
- IOC limit 約束最差成交價。
- session caps。
- 但以上不保證 GM/HL 合成部位不被拆腿。

#### 修補方案

- reduce-only 不應完全 bypass，只能使用「緊急 soil floor」：

```typescript
if (reduceOnly) {
  const fresh = await fetchLiveTop3Book(symbol);
  if (fresh.depthUsd < emergencyMinDepthUsd) throw new Error("EXIT_DEPTH_TRIP");
  if (fresh.estimatedSlippageBps > 100) throw new Error("EXIT_SLIPPAGE_TRIP");
}
```

- GMX delta snapshot 增加 `fetchedAt` 強制上限（建議 2 秒）。
- HKT tsunami 下：
  - 非緊急 unwind 禁止；
  - 緊急 unwind 降低 clip size、分批 IOC；
  - 每批重新取簿。
- `skipPreTrade` 僅允許 root-protection flatten，且必須生成獨立 audit reason。

---

## 第三部分：攻擊者 3（閃電貸清算者）— 跨鏈 Ingress 假注入與會計破壞

### 威脅模型

攻擊者可控制 SDK / API request 欄位、偽造時間戳與 chain ID，或使用閃電貸製造短暫 balance / amount 表象；不必真正完成 Across destination settlement。

### A3-1：`IN_FLIGHT_BRIDGE_CAPITAL` 被當成 escort OK

**類型：** State-machine authorization bug  
**嚴重度：** High

#### 精確攻擊步驟

1. 提交 Robinhood → Arbitrum request：
   - `sourceChainId = 46630`
   - `destChainId = 42161`
   - `initiatedAtMs = now`
   - 無 settlement proof。
2. `evaluateAcrossBridgeTransfer()` 回傳：
   - `capitalLabel = IN_FLIGHT_BRIDGE_CAPITAL`
   - `inFlightUsd = amountUsd`
   - `settledUsd = 0`
   - `lostUsd = 0`
   - **`ok = true`**
3. `quoteRChainYieldToArbitrumGm()` 以 `bridge.ok` 設 `bridgeEscortOk = true`。
4. smart-route preview 只檢查 `quote.ok`，建立 READY / ALLOW payload。
5. 下游若連上真實 broadcast，可能在橋資金尚未到達時用其他 Arbitrum 資金開 GM / HL 腿，形成裸曝險。

#### 現有防禦

- Soil 仍可能拒絕市場風險。
- 現有 yield quote 標示 `contractDeployed: false`。
- Gate 仍需 attestation。
- 但以上沒有檢查 `capitalLabel === SETTLED`。
- 現有測試期待 in-flight `bridgeEscortOk === true`，代表 bug 已被測試固化。

#### 修補方案

拆分三個概念，禁止共用 `ok`：

```typescript
interface BridgeEscortVerdict {
  routeAllowed: boolean; // AML / direction
  settlementVerified: boolean;
  deployable: boolean;  // only SETTLED
  capitalLabel: BridgeCapitalLabel;
  lostUsd: 0;
}

const deployable =
  routeAllowed &&
  settlementVerified &&
  capitalLabel === "SETTLED";
```

- `runSmartRouteDepositPreview()` 未 `deployable` 必須回 DENY / PENDING。
- 更新測試：IN_FLIGHT 應為 `routeAllowed: true`、`deployable: false`。
- Gate payload 應綁 `settlementRelayId` 或 destination fill hash。

---

### A3-2：呼叫方偽造 settlement / timeout

**類型：** Trust-boundary violation  
**嚴重度：** Critical（若連到真實資金執行）

#### 精確攻擊步驟

1. 真實 bridge 已超過一小時、未 settlement。
2. 攻擊 request 填：
   - `settledAtMs = initiatedAtMs`
   - 或把 `initiatedAtMs` 推向未來；
   - 或把 `nowMs` 回滾。
3. 現有 timeout 僅在 `settledAtMs == null` 時 fail-closed。
4. `settledAtMs >= initiatedAtMs` 即回傳 `SETTLED`，不需要：
   - tx hash；
   - Across relay ID；
   - destination event；
   - token balance。
5. 下游看到 `settledUsd = amountUsd`、`lostUsd = 0`，解鎖 GM / HL。

#### 額外會計破壞

timeout 且無 `settledAtMs` 時，現況可能同時把：

- `inFlightUsd = 0`
- `settledUsd = 0`
- `lostUsd = 0`

實際卡在 bridge 的資產從報表消失。這不是「零損失」，而是 **未決曝險未列帳**。

#### 修補方案

**P0：移除 public input 的 `settledAtMs` 與 `nowMs`。**

```typescript
interface VerifiedBridgeSettlement {
  relayId: Hex;
  destinationTxHash: Hex;
  sourceChainId: 46630 | 4663;
  destinationChainId: 42161;
  token: Address;
  amount: bigint;
  recipient: Address;
  filledAtMs: number;
}
```

- 只由 indexer / destination RPC 解析 Across `FilledRelay` 類事件。
- 驗證 tx receipt、chain ID、event address、recipient、token、amount 與 confirmations。
- timeout 狀態新增：

```typescript
unresolvedBridgeUsd: number; // 非 realized loss，但仍在 NAV exposure
```

- 判定順序：
  1. verified settlement → SETTLED；
  2. 未 settlement 且 timeout → STUCK / FAIL_CLOSED；
  3. 其餘 → IN_FLIGHT。
- `lostUsd ≡ 0` 僅表示「不提前認列 realized loss」，不能省略 unresolved exposure。

---

### A3-3：Chain ID / token / IngressSafetySwitch 與鏈上執行脫鉤

**類型：** Compliance spoofing + indirect execution risk  
**嚴重度：** High

#### 精確攻擊步驟

**Chain spoof：**

1. 攻擊者實際連到 chain X。
2. SDK request 自報 `sourceChainId = 46630`、`destChainId = 42161`。
3. pure function 只比較數字，不讀 wallet `eth_chainId`。
4. route 被標為 Robinhood outbound。

**Token spoof / flash-loan：**

1. `amountUsd` 只是 number，缺 token address、decimals、balance、transfer semantics。
2. 攻擊者以閃電貸在 snapshot 時製造 balance，或只直接自報大額 `amountUsd`。
3. 產生大額 ingress / settled audit artifact。
4. 同 tx / 同 block 償還貸款，實際無長期可部署本金。

**Compliance-plane decoupling：**

1. `IngressSafetySwitch.isCompliant()` 僅檢查 RiskOracle flush / SHUTDOWN 與 blacklist。
2. TypeScript execution path未強制 RPC 呼叫 `gateAddress(wallet)`。
3. Gate 本身也不依賴 IngressSafetySwitch。
4. blacklist 或 WARNING / stale oracle 狀態未必會阻擋 UserOp。

#### 現有防禦

- pure route 對 `42161 → 46630/4663` 反向可正確 block。
- RiskOracle irreversible flush / SHUTDOWN 可使 on-chain switch fail-closed。
- Edge Soil 為獨立第二道。
- 但 TypeScript 的合規 ALLOW 並未被鏈上事實約束。

#### 修補方案

**Solidity：**

```solidity
function isCompliant(address target) external view returns (bool) {
    if (riskOracle.isSystemFlushed()) return false;
    if (riskOracle.statusCode() != riskOracle.STATUS_NORMAL()) return false;
    if (block.timestamp > riskOracle.lastTimestamp() + riskOracle.sloWindowSec()) return false;
    return !institutionalBlacklist[target];
}
```

**TypeScript：**

- `sourceChainId` 從 signer/provider `eth_chainId` 取得，不接受 request body 覆寫。
- 每筆 Robinhood ingress UserOp：
  1. 讀 `IngressSafetySwitch.isCompliant(wallet)`；
  2. `eth_call gateAddress(wallet)` simulation；
  3. 任一 RPC failure 即 fail-closed。
- token allowlist：address、decimals、fee-on-transfer / rebase policy。
- 以 destination event amount 為 SSOT，不使用 caller float `amountUsd`。
- 不再把 4663 重寫成 46630；audit 保留實際來源鏈。
- blacklist 需可治理更新，但「解除 blacklist」應 timelock，「新增 blacklist」可即時。

---

## 第四部分：防禦死角總結與 V1.0 主網硬化修補方案 (Hardening Roadmap)

### 4.1 根因圖

```text
鏈上 Gate：payload / subject / replay 綁定良好
                │
                ├── 死角 1：Edge sever 無法原子撤銷既簽 ALLOW
                │
                ├── 死角 2：跨場 soil 使用合成輸入 / stale snapshot
                │
                └── 死角 3：Bridge 狀態由 caller 時間戳推導
                              │
                              └── lostUsd=0 被誤當「資金安全」
```

### 4.2 主網阻擋清單（P0）

| 優先 | 修補 | 驗收條件 |
|------|------|----------|
| P0-1 | 移除 caller `settledAtMs` / `nowMs`；SETTLED 只認 destination event | 偽造 timestamp 測試 100% DENY |
| P0-2 | IN_FLIGHT 必須 `deployable=false` | 無 settlement proof 不得產生 READY / ALLOW payload |
| P0-3 | GMX↔HL 使用真實 HL top-3 depth + GMX mid | production code 無固定 `$500_000` depth / mirrored marks |
| P0-4 | 簽名前 ≤200ms 重探 soil | 撤單於 T0/T1 間必須阻擋 |
| P0-5 | fatal sever 平行觸發 Gate halt / RiskOracle flush | chaos 測試量測 halt confirmation SLO |
| P0-6 | Robinhood UserOp 強制 IngressSafetySwitch preflight | stale/WARNING/blacklist/RPC failure 全 DENY |

### 4.3 P1 硬化

- `MAX_TTL` 評估降至 10–15 秒。
- 引入鏈上 `riskEpoch` 批次撤銷未 consume attestation。
- private bundler / FCFS relay。
- reduce-only 改採 emergency soil floor，禁止無條件 `skipPreTrade`。
- HMAC SoilTicket 綁：
  - `bookHash`
  - `probedAtMs`
  - `symbol`
  - `orderUsd`
  - `chainId`
  - `sessionId`
- timeout 新增 `unresolvedBridgeUsd`，不得讓資產從 NAV 報表消失。
- third-party SDK integration lint：禁止直接使用 `verifyAndConsume` 作為 execution authorization。

### 4.4 建議新增測試

| 測試檔 | 必測情境 |
|--------|----------|
| `tests/adapters/across-ingress-settlement-proof.test.ts` | forged `settledAtMs`、錯 chain、錯 recipient、錯 token、reorg receipt |
| `tests/components/smart-route-inflight-deny.test.ts` | IN_FLIGHT 不得 READY / ALLOW |
| `tests/services/gmx-hl-live-soil-ticket.test.ts` | mirrored marks / fixed depth 被拒 |
| `tests/adapters/hl/soil-to-sign-toctou.test.ts` | T0 掛單、T1 撤單、簽名前阻擋 |
| `tests/adapters/hl/reduce-only-soil-floor.test.ts` | HKT tsunami / 低深度 emergency exit 分批 |
| `SliverVineGate/test/RiskEpoch.t.sol` | epoch rotation 廢止舊 ALLOW |
| `SliverVineGate/test/MempoolGrief.t.sol` | 不同 initiator 複製 calldata 無法 consume |
| `tests/services/ingress-safety-switch-preflight.test.ts` | stale/WARNING/SHUTDOWN/blacklist/RPC timeout |

### 4.5 文檔必須修正的安全措辭

1. `lostUsd ≡ 0` 應改為：
   - 「pending bridge capital 不提前認列 realized loss」；
   - **不代表資金已到帳、無經濟損失或可部署**。
2. 30 秒 attestation 風險應描述為：
   - third-party calldata redirect 被 initiator/payload binding 阻擋；
   - 殘留是 censorship / expiry / stale-ALLOW incident window。
3. 「live soil」只能用於真正接入 HL L2 + GMX mid 的路徑；固定 $500k 深度不得稱 live。
4. `IngressSafetySwitch` 未接入執行前，不得聲稱所有 Robinhood UserOp 都經鏈上 blacklist / oracle gate。

### 4.6 最終風險判定

| 子系統 | 現況 | Mainnet Go/No-Go |
|--------|------|------------------|
| SliverVineGate + canonical GatedExecutor | 無 Critical theft；Medium liveness / incident gap | **Conditional Go**（private relay + auto-halt） |
| GMX↔HL production hedge | synthetic soil 可 false ALLOW | **No-Go** |
| Across ingress state machine | caller 可偽造 settlement；IN_FLIGHT 可被視為 OK | **No-Go** |
| IngressSafetySwitch | Solidity 本體簡潔；未完整接入 TS 執行 | **No-Go for institutional ingress** |
| `lostUsd ≡ 0` accounting | 可防 phantom realized loss；不能證明資產安全 | **需重新定義並加 unresolved bucket** |

**主網結論：** Gate 本體不是最脆弱環節。主網前應優先修正 **settlement truth、deployability 與 live cross-venue sensing**。若不修，攻擊者不必破解任何簽章；只需讓系統相信錯誤的市場或橋接狀態，即可誘導合法簽章執行有毒交易。

---

## 審計限制

- 本輪依指示未執行測試、fuzz、fork、mempool simulation 或鏈上 RPC 驗證。
- 嚴重度以「目前程式若直接連到主網資金」評估；部分 HUD / preview / dry-run 路徑尚未 broadcast，因此實際現況影響較低。
- 報告提供防禦性修補方向，未在本任務中修改生產程式。

---

*SilverVine Labs · Internal Red-Team · Security Baseline: 174 files | 768 PASS · 2026-08-30*
