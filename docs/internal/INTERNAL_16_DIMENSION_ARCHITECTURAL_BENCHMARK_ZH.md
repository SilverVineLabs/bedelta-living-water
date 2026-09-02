# SliverVine Protocol (BeDelta Living Water v1.0 / BeΔ) — 內部 16 維度 Web3/HFT 架構主基準（Master SSOT）

> **文件分類：** 內部 OpSec · 限 SilverVine Labs 工程 / 法務 / 專利審查  
> **實體：** SilverVine Labs · **協議品牌：** SliverVine · **引擎代號：** Santenmoku v0.8 · **產品版本：** BeΔ Living Water v1.0  
> **審計基線 Commit：** `e1e5355`+ · 分支 `v1.0_push_BDLW`  
> **前序文件：** [`INTERNAL_13_DIMENSION_ARCHITECTURAL_BENCHMARK_ZH.md`](./INTERNAL_13_DIMENSION_ARCHITECTURAL_BENCHMARK_ZH.md)（已由本文件取代）  
> **公開對照矩陣：** [`TECHNICAL_SPECIFICATION.md` §6.7](../architecture/TECHNICAL_SPECIFICATION.md#67-architectural-benchmark-silvervine-high-performance-innovations-vs-legacy-web3-standards)  
> **隱藏寶石詳述：** [`ADVANCED_HFT_PATENTS_AND_HIDDEN_GEMS.md`](./ADVANCED_HFT_PATENTS_AND_HIDDEN_GEMS.md)（Gem 11–13 英文專利備忘錄）  
> **Grok 20 評委機構審計：** [`GROK_20_JUDGE_AUDIT_REPORT_ZH.md`](./GROK_20_JUDGE_AUDIT_REPORT_ZH.md)（2026-09-02 · 7.65/10 · CONDITIONAL PASS）  
> **內部索引：** [`README.md`](./README.md)

---

## 執行摘要

本 Master SSOT 在 **2026-09-01 全庫程式碼審計**（`/src` · `/contracts` · `/SliverVineGate` · `/tests`）基礎上，將原 **13 維度**（10 公開 + 3 Hidden Gems）擴展為 **16 維度**，新增三項經程式碼錨定驗證的架構寶石：

| Gem | 維度 | 核心能力 |
|-----|------|----------|
| **Gem 14** | ERC-8196 亞毫秒 Policy 預驗證 | `verifyAgentIntent()` 複合布林閘 + Deadman「小腦」層 |
| **Gem 15** | SHA-256 雙源遙測對帳 | Dune `responseRef` ↔ 鏈上 `IntentAttested` action code |
| **Gem 16** | Observatory Paradox 動態抵押品 Haircut | PT 到期風險 −40 分 + GMX 5% Maintenance Shadow Margin |

**Vitest SSOT：** Proposal Baseline: **175 test files | 773 PASS** · Current Branch Live: **176 test files | 775 PASS Clean**

**核心命題：** LLM / AI Agent 是「大腦（秒級）」；Citadel 是「小腦（微秒級）」—— 在 MEV、LVR、跨場滑點造成不可逆損失 **之前** 完成 fail-closed 拒絕。

---

## 16 維度總覽矩陣

| # | 維度 | 傳統 Web3 標準 | SliverVine 工程標準 | 延遲 / Gas 優勢 |
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
| 11 | **[Gem]** 非對稱 Timelock | 對稱治理投票 | 收緊 0 延遲 / 放寬 1h–24h | 被盜 key 只能 halt |
| 12 | **[Gem]** 動態 Gas-Cap 預篩 | Validation 階段才拒絕 | Edge 0-Gas 丟棄 UserOp | 零 Bundler RTT 浪費 |
| 13 | **[Gem]** 單向護送 | 雙向 bridge 會計 | `lostUsd ≡ 0` 不變量 | 避免連鎖清算誤報 |
| 14 | **[Gem]** ERC-8196 Policy 預驗證 | NL prompt 事後審計 | 亞毫秒複合布林閘 + Prompt 拒絕 | <106µs · 0-Gas |
| 15 | **[Gem]** SHA-256 雙源遙測對帳 | 孤立 dashboard | `responseRef` ↔ `IntentAttested` | 鏈上/鏈下可審計 |
| 16 | **[Gem]** Observatory Paradox Haircut |  naive tx blocker | −40 分減倉綠燈 + Shadow Margin | 動態 GMX 保證金保護 |

---

## 程式碼錨點索引（全 16 維度）

| # | TypeScript SSOT | Solidity / 鏈上 | Vitest / Forge 測試 |
|---|-----------------|-----------------|---------------------|
| 1 | `src/core/agent-citadel-guard.ts` · `signAgentMemoryPayload()` L119+ | — | `tests/core/agent-citadel-guard.test.ts` |
| 2 | `src/services/session-key-adapter-lib/session-key-gates.ts` · `src/adapters/hl/auth/signing-gate.ts` | — | `tests/adapters/zerodev-aa-gate.test.ts` · `tests/services/fool-proof-guard.test.ts` |
| 3 | `src/services/root-protection-lib/circuit-breaker-sever.ts` · `root-protection.ts` | `SliverVineGate.sol` `halt()` L430+ | `tests/rootProtectionService.test.ts` · `tests/risk-control/soil-circuit-breaker.test.ts` |
| 4 | `src/services/aa-adapter/risk-oracle-gate.ts` | `contracts/SliverVineRiskOracle.sol` · `contracts/IngressSafetySwitch.sol` | `tests/services/aa-adapter/risk-oracle-gate.test.ts` |
| 5 | `src/services/risk-control-lib/soil-resistance.ts` · `pkg/soil_core.wasm` | `contracts/stylus-probe/src/lib.rs` | `tests/services/wasm-feasibility-simulation.test.ts` · `tests/risk-control/soil-coverage-edges.test.ts` |
| 6 | `src/sdk/attestation.ts` | `SliverVineGate/src/SliverVineGate.sol` · `GatedExecutor.sol` | `SliverVineGate/test/SliverVineGate.t.sol` · `SliverVineGate/test/SliverVineGate.fuzz.t.sol` |
| 7 | `src/adapters/arbitrum/zerodev-aa/zerodev-aa-static-breaker.ts` | — | `tests/adapters/zerodev-aa-dryrun-harness.test.ts` · `tests/adapters/zerodev-aa-gate.test.ts` |
| 8 | `src/services/defense/rpc-fetch-gate-eval.ts` | — | `tests/defense/rpc-whitelist.test.ts` |
| 9 | `src/services/gate-domain-fingerprint.ts` | `SliverVineGate.sol` `domainSeparator()` | `tests/services/gate-domain-fingerprint.test.ts` |
| 10 | `src/services/risk-control-lib/soil-resistance.ts` · `hl-orderbook-gap-guard.ts` | — | `tests/risk-control/soil-circuit-breaker.test.ts` · `tests/sequencer-guard.test.ts` |
| 11 | — | `SliverVineGate.sol` `UNHALT_DELAY` · `SIGNER_TIMELOCK` | `SliverVineGate/test/SliverVineGate.t.sol` `test_Authority_UnhaltRequiresTimelock` |
| 12 | `zerodev-aa-static-breaker.ts` · `zerodev-aa-gas-ledger.ts` | — | `tests/adapters/zerodev-aa-gate.test.ts`（`ZERODEV_GAS_LIMIT_EXCEEDED_TRIP`） |
| 13 | `src/adapters/across-ingress-bridge.ts` | `contracts/IngressSafetySwitch.sol` | `tests/adapters/across-ingress-bridge.test.ts` |
| 14 | `src/sdk/agent-intent.ts` · `agent-intent-injection.ts` · `agent-citadel-guard.ts` | Sepolia `SliverVineGate` `0xb174…` | `tests/sdk/citadel-sdk-intent.test.ts` · `tests/core/agent-citadel-guard.test.ts` |
| 15 | `src/routes/grant-audit-lib/grant-audit-dune-telemetry.ts` · `gate-telemetry-types.ts` | `SliverVineGate.sol` `IntentAttested` L176 · L293 | `tests/api/grant-audit-dune-telemetry.test.ts` |
| 16 | `src/guards/pendle-gmx-cross-guard.ts` · `pendle-pt-registry.ts` · `pendle-pt-expiry-guard.ts` | — | `tests/guards/pendle-gmx-cross-guard.test.ts` · `tests/adapters/pendle-pt-expiry-guard.test.ts` |

---

## 維度 1–10：公開防禦平面（摘要 + 錨點）

> 完整敘述見前序 [`INTERNAL_13_DIMENSION_ARCHITECTURAL_BENCHMARK_ZH.md`](./INTERNAL_13_DIMENSION_ARCHITECTURAL_BENCHMARK_ZH.md) §維度 1–10；以下僅列 **Master SSOT 程式碼錨點**。

### 維度 1：AI Agent 拒絕證明

- **TS：** `evaluateAgentCitadelGuard()` · `signAgentMemoryPayload()` — `src/core/agent-citadel-guard.ts`
- **測試：** `tests/core/agent-citadel-guard.test.ts` — M2M 拒絕 <12µs 預算

### 維度 2：Session Key 授權閘門

- **TS：** `auditSessionKeyConstraints()` — `src/services/risk/session-audit.ts`（$30 clip · 7 天 TTL）
- **TS：** `assertSigningChannelOpen()` — `src/adapters/hl/auth/signing-gate.ts`
- **測試：** `tests/adapters/zerodev-aa-gate.test.ts`

### 維度 3：物理死鎖斷路器

- **TS：** `severCircuitBreakerPipeline()` — `src/services/root-protection-lib/circuit-breaker-sever.ts` L1+
- **Solidity：** `SliverVineGate.halt()` — `SliverVineGate/src/SliverVineGate.sol`
- **測試：** `tests/risk-control/soil-circuit-breaker.test.ts` · `scripts/grant-e2e-citadel-demo.ts` Step 5

### 維度 4：不可逆風控毒丸

- **Solidity：** `SliverVineRiskOracle.applySignedReport()` — `contracts/SliverVineRiskOracle.sol`
- **Solidity：** `IngressSafetySwitch` — `contracts/IngressSafetySwitch.sol`
- **TS：** `evaluateRiskOracleUserOpGate()` — `src/services/aa-adapter/risk-oracle-gate.ts`
- **測試：** `tests/services/aa-adapter/risk-oracle-gate.test.ts`

### 維度 5：盤口算子（Soil Compute Parity）

- **TS：** `checkSoilResistance()` — `src/services/risk-control-lib/soil-resistance.ts` L1+
- **Wasm：** `pkg/soil_core.wasm`
- **Stylus：** `contracts/stylus-probe/src/lib.rs`
- **測試：** `tests/services/wasm-feasibility-simulation.test.ts`

### 維度 6：門神 Attestation（Consume-once）

- **Solidity：** `verifyAndConsume()` · `consumed[digest]` — `SliverVineGate/src/SliverVineGate.sol`
- **Solidity：** `GatedExecutor.payloadHash()` — `SliverVineGate/src/GatedExecutor.sol`
- **測試：** `SliverVineGate/test/SliverVineGate.t.sol` · `SliverVineGate/test/SliverVineGate.fuzz.t.sol`（327,675 deep fuzz）

### 維度 7：AA 預篩（EIP-7562 Static Breaker）

- **TS：** `evaluateStaticBreakerMatrix()` — `src/adapters/arbitrum/zerodev-aa/zerodev-aa-static-breaker.ts`
- **測試：** `tests/adapters/zerodev-aa-dryrun-harness.test.ts`

### 維度 8：反抄襲 Honeypot

- **TS：** `evaluateRpcDefenseGate()` — `src/services/defense/rpc-fetch-gate-eval.ts`
- **測試：** `tests/defense/rpc-whitelist.test.ts` — `HONEYPOT_ACTIVE` · 99% 合成 slippage

### 維度 9：前端信任鏈（G11 Domain Fingerprint）

- **TS：** `verifyGateDomainSeparator()` — `src/services/gate-domain-fingerprint.ts`
- **Solidity：** `domainSeparator()` — `SliverVineGate/src/SliverVineGate.sol`
- **測試：** `tests/services/gate-domain-fingerprint.test.ts`

### 維度 10：防禦姿勢（Interceptor Moat）

- **TS：** `checkSoilResistance()` — `src/services/risk-control-lib/soil-resistance.ts`
- **TS：** `evaluateHlOrderbookGapGuard()` — `src/services/risk-control-lib/hl-orderbook-gap-guard.ts`（L29+，由 soil-resistance L84 調用）
- **測試：** `tests/risk-control/soil-circuit-breaker.test.ts` · `tests/sequencer-guard.test.ts`

---

## 維度 11–13：Hidden Gems（Gem 1–3）

> 英文專利備忘錄：[`ADVANCED_HFT_PATENTS_AND_HIDDEN_GEMS.md`](./ADVANCED_HFT_PATENTS_AND_HIDDEN_GEMS.md)

### 維度 11：EIP-712 非對稱 Timelock 治理

| 錨點 | 路徑 |
|------|------|
| **Solidity** | `SliverVineGate.sol` — `halt()` 即時 · `scheduleUnhalt()` `UNHALT_DELAY` 1h · `proposeSignerChange()` `SIGNER_TIMELOCK` 24h |
| **Forge** | `SliverVineGate/test/SliverVineGate.t.sol` — `test_Authority_UnhaltRequiresTimelock` |

### 維度 12：EIP-7562 無狀態動態 Gas-Cap 預篩

| 錨點 | 路徑 |
|------|------|
| **TS** | `evaluateStaticBreakerMatrix()` · `evaluateSponsoredGasLimits()` — `zerodev-aa-static-breaker.ts` · `zerodev-aa-gas-ledger.ts` |
| **Vitest** | `tests/adapters/zerodev-aa-gate.test.ts` — `ZERODEV_GAS_LIMIT_EXCEEDED_TRIP` |

### 維度 13：Unidirectional Escort 單向護送

| 錨點 | 路徑 |
|------|------|
| **TS** | `across-ingress-bridge.ts` — `lostUsd ≡ 0` · `AML_INBOUND_TO_ROBINHOOD_BLOCKED` |
| **Solidity** | `contracts/IngressSafetySwitch.sol` |
| **Vitest** | `tests/adapters/across-ingress-bridge.test.ts`（5/5 PASS） |

---

## 維度 14：[Gem 4] ERC-8196 亞毫秒 Policy 預驗證

> **對齊聲明：** Aligned with emerging **ERC-8196 AI Agent Wallet Policy Specification** (Draft co-authored by Virtuals Protocol). **Not a finalized standard.** — 見 [`TECHNICAL_SPECIFICATION.md` §0.1](../architecture/TECHNICAL_SPECIFICATION.md#01-bytecode-predicate-verification-v10--erc-7715--post-grant-design-spec)

### 傳統標準

AI Agent 錢包依賴 LLM 自然語言推理 + 事後鏈上審計；Prompt Injection 可誘導未授權簽章，且無亞毫秒執行層 Policy 硬斷言。

### SliverVine 標準

**「大腦 / 小腦」分離架構** — Citadel 不解析 NL prompt，而是在廣播前以確定性 Policy 複合閘裁決：

```text
AllowedToSign = Injection ∧ Digest ∧ Soil ∧ Session ∧ Gas ∧ Attestation ∧ Armor ∧ Wasm
DeadmanOk     = evaluateAgentCitadelGuard()  (50 bps 預設 · 小腦反射層)
```

### 程式碼審計錨點（2026-09-01）

| 層級 | 檔案 · 符號 | 行為 |
|------|-------------|------|
| **SDK 主閘** | `src/sdk/agent-intent.ts` · `verifyAgentIntent()` L31–103 | 複合布林 `allowedToSign`；綁定 `SLIVERVINE_GATE_ADDRESS` · `EIP712_DOMAIN_NAME` |
| **Prompt 拒絕** | `src/sdk/agent-intent-lib/agent-intent-injection.ts` L6–20 | `PROMPT_INJECTION_REJECTED` — 正則攔截 `ignore previous instructions` 等注入模式 |
| **Session Policy** | `src/services/risk/session-audit.ts` · `auditSessionKeyConstraints()` L44+ | Clip ≤ `$30` · 7 天 auto-expire — 對應 Agent Wallet scope 約束 |
| **小腦 Deadman** | `src/core/agent-citadel-guard.ts` · `evaluateAgentCitadelGuard()` L130+ | 50 bps slippage/depth deadman；HMAC Session Proof 拒絕軌跡 |
| **守衛編排** | `src/sdk/agent-intent-lib/agent-intent-guards.ts` | `evaluateDeadmanGuard()` · `evaluateArmorGuard()` · `evaluateGasBurstGuard()` |
| **E2E 演示** | `scripts/grant-e2e-citadel-demo.ts` Step 1 | `verifyAgentIntent` + `allowedToSign=true` 終端輸出 |

### 測試錨點

| 測試檔 | 斷言 |
|--------|------|
| `tests/sdk/citadel-sdk-intent.test.ts` L20–30 | Prompt injection → `allowedToSign=false` · `PROMPT_INJECTION_REJECTED` |
| `tests/sdk/citadel-sdk-intent.test.ts` L33–43 | Session clip drift → `CLIP_BREACH` |
| `tests/core/agent-citadel-guard.test.ts` | Deadman slippage/depth trip · M2M reject payload |

### 架構理由

ERC-8196 Draft 要求 Agent Wallet **可審計 Policy 邊界**；SliverVine 以 **亞毫秒複合閘** 在 LLM 輸出 digest 層攔截注入，並以 **Deadman 小腦** 在簽名管道層 fail-closed——即使「大腦」被攻破，R20 sever 仍可在 106µs 內熔斷 EIP-712 管道。

---

## 維度 15：[Gem 5] SHA-256 雙源遙測對帳（Dune ↔ 鏈上 Gate）

### 傳統標準

鏈下 dashboard 與鏈上事件孤立存在；評審無法在單一 curl 中驗證「儀表板數字 = 鏈上事實」。

### SliverVine 標準

**Deterministic Dual-Source Reconciliation** — `grant-audit` API 產出 `duneTelemetry.responseRef`（SHA-256），其 `gateActionCode` 與 `SliverVineGate.IntentAttested` 的 `uint8 action` 語意對齊。

### 程式碼審計錨點（2026-09-01）

| 層級 | 檔案 · 符號 | 行為 |
|------|-------------|------|
| **SHA-256 摘要** | `src/routes/grant-audit-lib/grant-audit-dune-telemetry.ts` L35–37 · L145 | `sha256Ref(payload)` → `sha256:<hex64>` 綁定 telemetry core |
| **意圖雜湊** | 同上 L39–41 | `intentHash()` — PT expiry + impliedYield + intent 三元組摘要 |
| **Shadow Margin 探針** | 同上 L100–148 · `buildGrantAuditDuneTelemetry()` | 三場景 reference state → `evaluatePendleGmxCrossGuard()` action log |
| **Action Code 映射** | `src/core/gate-telemetry-types.ts` L3–20 | `0=PASS` · `1=FAIL_CLOSED` · `2=EMERGENCY_DELEVERAGE` |
| **鏈上事件** | `SliverVineGate/src/SliverVineGate.sol` L176 · L293 | `event IntentAttested(bytes32 intentHash, address agent, uint8 action, uint256 shadowMarginUsd)` |
| **API 聚合** | `src/routes/grant-audit.ts`（經 `handleGrantAuditRequest`） | `/api/grant-audit` → `duneTelemetry` JSON 區塊 |
| **Dune 公開面** | [silvervine-citadel-telemetry](https://dune.com/silvervinelabs/silvervine-citadel-telemetry) | V2 Trino Heartbeat + Gate `0xb174…` 事件 ingest |

### Action Code 對照表（SSOT）

| `gateActionCode` | Guard Action | 鏈上 `IntentAttested.action` | Dune 面板語意 |
|------------------|--------------|------------------------------|---------------|
| `0` | `PASS_GREENLIGHT` | `0` | 允許下游 attestation |
| `1` | `FAIL_CLOSED_BLOCK` | `1` | Toxic flow blocked |
| `2` | `EMERGENCY_DELEVERAGE_ALLOWED` | `2` | Observatory Paradox 減倉綠燈 |

### 測試錨點

| 測試檔 | 斷言 |
|--------|------|
| `tests/api/grant-audit-dune-telemetry.test.ts` L13–26 | `responseRef` 匹配 `/^sha256:[0-9a-f]{64}$/` · actionLog ≥3 條 |
| 同上 L28–53 | `GET /api/grant-audit` 附帶 `duneTelemetry` · `shadowMarginUsd` · `dynamicLtv` |

### 架構理由

Grant 評審可在 **60 秒內** 完成：`curl grant-audit | jq .duneTelemetry.responseRef` → 對照 Dune dashboard → Arbiscan `IntentAttested` 事件 — 三源 SHA-256 閉環，消除「假儀表板」質疑。

---

## 維度 16：[Gem 6] Observatory Paradox 動態抵押品 Haircut

### 傳統標準

Naive tx blocker 在高波動時 **同時阻擋減倉與加倉**，導致 AI Agent 被困高風險倉位（Observatory Paradox）→ 加速 GMX 強制清算。

### SliverVine 標準

**Intent-Aware Shadow Margin Engine** — 對 `close`/`reduce` 意圖施加 **−40 風險分 Haircut**，強制 `EMERGENCY_DELEVERAGE_ALLOWED`；對 `open`/`increase` 維持 `FAIL_CLOSED_BLOCK`（score > 75 或 shadowMargin < 0）。

### 程式碼審計錨點（2026-09-01）

| 層級 | 檔案 · 符號 | 行為 |
|------|-------------|------|
| **核心算子** | `src/guards/pendle-gmx-cross-guard.ts` L29–101 | `evaluatePendleGmxCrossGuard()` |
| **−40 Haircut** | 同上 L59–62 | `isDeleveraging` → `effectiveScore = max(0, rawRiskScore - 40)` |
| **GMX Maintenance** | 同上 L66–67 | `maintenanceMarginRequiredUsd = sizeNotionalUsd * 0.05`（5%） |
| **Shadow Margin** | 同上 L64–67 | `shadowMarginUsd = shadowCollateralUsd - maintenanceMarginRequiredUsd` |
| **PT 時間衰減** | 同上 L35–36 | `timeDecayFactor = exp(-3 * T)` — T = 距到期年化比例 |
| **Registry SSOT** | `src/adapters/pendle/pendle-pt-registry.ts` L32–59 | PT-eETH `0x8B330d…` · PT-USDC `0x156291…`（Arbitrum One `42161`） |
| **Registry 入口** | 同上 L74–80 · L104+ | `resolvePendlePtRegistryEntry()` · `evaluatePendleGmxCrossGuardFromRegistry()` |
| **到期守衛** | `src/adapters/pendle/pendle-pt-expiry-guard.ts` | PT 到期 <7 天 · yield jitter >200 bps 觸發條件 |
| **Dune 遙測聯動** | `grant-audit-dune-telemetry.ts` L107–114 | `guardActionToGateCode(result.action)` 寫入 actionLog |

### 決策矩陣（程式碼映射）

| Intent | 條件 | Action | 測試覆蓋 |
|--------|------|--------|----------|
| `close` / `reduce` | 任意市場狀態 | `EMERGENCY_DELEVERAGE_ALLOWED` | `pendle-gmx-cross-guard.test.ts` L77–101 |
| `open` / `increase` | score > 75 或 shadowMargin < 0 | `FAIL_CLOSED_BLOCK` | 同上 L59–75 |
| `open` / `increase` | score ≤ 75 且 shadowMargin ≥ 0 | `PASS_GREENLIGHT` | 同上 L45–57 |

### 測試錨點

| 測試檔 | 斷言 |
|--------|------|
| `tests/guards/pendle-gmx-cross-guard.test.ts` L77–101 | 高風險 `open` BLOCK · 同場景 `close` ALLOW · `effectiveScore` 降低 |
| `tests/guards/pendle-gmx-cross-guard.test.ts` L103+ | `reduce` intent 繞過 Observatory Paradox |
| `tests/adapters/pendle-pt-expiry-guard.test.ts` | PT 到期邊界 · registry 解析 |
| `tests/api/grant-audit-dune-telemetry.test.ts` | actionLog 含 `FAIL_CLOSED_BLOCK` + `EMERGENCY_DELEVERAGE_ALLOWED` |

### 架構理由

Pendle PT 動態費用曲線 + GMX Maintenance Margin 的交叉風險，需要 **意圖感知** 而非二元封鎖。−40 Haircut 是 SliverVine 對「Observatory Paradox」的數學化解 — 已在 `grant-audit` Dune 遙測與 Sepolia Gate `IntentAttested` 雙源可驗證。

---

## 授權與文件索引

| 層級 | 授權 | 範圍 |
|------|------|------|
| 合約 | **BUSL-1.1** | `SliverVineGate` · `GatedExecutor` · `SliverVineRiskOracle` · `IngressSafetySwitch` · Stylus |
| SDK | **Apache-2.0** | `@slivervine/citadel-sdk` |
| 本文件 | **內部限閱** | 不得對外散佈未脫敏版本 |

| 相關文件 | 用途 |
|----------|------|
| [`INTERNAL_13_DIMENSION_ARCHITECTURAL_BENCHMARK_ZH.md`](./INTERNAL_13_DIMENSION_ARCHITECTURAL_BENCHMARK_ZH.md) | 前序 13 維度（含物理邊界附錄 A–C） |
| [`ADVANCED_HFT_PATENTS_AND_HIDDEN_GEMS.md`](./ADVANCED_HFT_PATENTS_AND_HIDDEN_GEMS.md) | Gem 11–13 英文專利備忘錄 |
| [`TECHNICAL_SPECIFICATION.md`](../architecture/TECHNICAL_SPECIFICATION.md) | R01–R20 · 公開技術規格 · Industry Appendix |
| [`BLACK_HAT_MEV_ADVERSARY_ATTACK_AUDIT_ZH.md`](./BLACK_HAT_MEV_ADVERSARY_ATTACK_AUDIT_ZH.md) | 紅隊 9 向量 · 主網前必修清單 |

---

## 附錄：已知物理邊界（引用）

> v0.8 三項物理邊界（Attestation 30s TTL · Sever/Gate 15s 同步缺口 · Wasm/Stylus 1–2 wei 漂移）及 V1.0 修補 Roadmap 詳見前序文件 [`INTERNAL_13_DIMENSION_ARCHITECTURAL_BENCHMARK_ZH.md` §附錄](./INTERNAL_13_DIMENSION_ARCHITECTURAL_BENCHMARK_ZH.md#附錄silvervine-v08-內部已知物理邊界與-v10-主網修補-roadmap)。

---

*SilverVine Labs · BeΔ Living Water v1.0 · 內部 16 維度架構主基準 · Vitest SSOT: Proposal Baseline 175/773 · Current Branch Live 176/775 PASS Clean*
