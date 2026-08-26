# BDLW Architecture Evolution & Risk Mitigation Framework

> **Document Status:** Official SSOT for Arbitrum Foundation & ZeroDev Grant Committees  
> **Version:** v1.0 → v2.0 Roadmap Alignment  
> **Baseline:** Vitest **168 files | 742 PASS (100% Clean)** · Wasm hot-path **87.76 KiB gzip** · Shield **p50 ~106 µs**  
> **Core Principle:** Honest Accounting, Physical Invariants (`lostUsd ≡ 0`), and Venue-Agnostic Pre-Execution Citadel Protection.  
> **Spec SSOT:** [`TECHNICAL_SPECIFICATION.md`](./TECHNICAL_SPECIFICATION.md) · **中文備份:** [`../internal/CROSS_CHAIN_RISK_AND_EVOLUTION_ZH.md`](../internal/CROSS_CHAIN_RISK_AND_EVOLUTION_ZH.md)

**Entity:** SilverVine Labs · **Protocol:** SliverVine / BeΔ Living Water (BDLW)  
**Live proof:** `GET /api/grant-audit` · [bedeltawater.slivervine.xyz](https://bedeltawater.slivervine.xyz)

---

## Executive Summary

BeDeltaLivingWater (BDLW) acknowledges a fundamental law of distributed systems: **Cross-chain risk, bridge latency, and basis drift cannot be magically erased by software; they must be quantified, isolated, and economically absorbed.**

This document outlines BDLW's 3-Stage Evolutionary Roadmap, its Tiered Liquidity Stacking mechanism (Aave v3 / Morpho Blue), and **60 Reflective Architectural Invariants** — each status-badged as **✅ Code-Verified** (v1.0 baseline) or **⏳ Roadmap Spec** (V1.5/V2.0).

---

## 1. The 3-Stage Evolutionary Architecture

```text
┌─────────────────────────────────────────────────────────────────────────────────┐
│ Stage A (Current V1.0): Arbitrum Primary + Hyperliquid 1× Short                  │
│ · Primary Vault: Arbitrum One GMX v2 GM Pools (ETH/USDC, BTC/USDC)              │
│ · Hedge Leg: Hyperliquid 1× Short (EIP-712 Session Key, 30s TTL)                │
│ · Ingress Escort: Robinhood Chain 46630 (USDG) via Across Bridge (1h timeout)   │
│ · Protection: p50 106µs Wasm Soil Engine + ZeroDev Kernel v3 AA                 │
└────────────────────────────────────────┬────────────────────────────────────────┘
                                         │
                                         ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│ Stage B (V1.5): Tiered Liquidity Stacking (Aave v3 / Morpho Blue + Variational) │
│ · Risk-Free Base: Automatic fallback to Aave v3 / Morpho Blue (4%~5% Base Yield)│
│ · Native Arbitrum Hedge: Shadow trading on Variational Perp DEX                 │
│ · Citadel Yield Buffer: Excess yield above Aave benchmark absorbs bridge costs  │
│ · UX Infrastructure: ZeroDev Kernel v4 EIP-7702 Intent Composer                 │
└────────────────────────────────────────┬────────────────────────────────────────┘
                                         │
                                         ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│ Stage C (V2.0): 100% Native Arbitrum Ultra-Vault (Zero Cross-Chain Friction)    │
│ · 100% Volume & TVL Retention on Arbitrum One (GMX v2 + Variational)           │
│ · Atomic Intent Composition: Single-click Aave withdraw → GMX deposit → Short   │
│ · Bridge Latency: Completely eliminated; Robinhood retained as opt-in escort    │
│ · Citadel CaaS: Monetized B2B Wasm Firewall for external protocols              │
└─────────────────────────────────────────────────────────────────────────────────┘
```

| Stage | Status | Center of Gravity |
|-------|--------|-------------------|
| **A — V1.0** | ✅ Code-Verified (168 files \| 742 PASS) | Arbitrum GMX v2 + HL 1× short · Robinhood outbound escort |
| **B — V1.5** | ⏳ Roadmap | Aave/Morpho base + Variational native hedge PoC |
| **C — V2.0** | ⏳ Design Spec | 100% Arbitrum atomic intent stack · CaaS monetization |

### 1.1 Three-Stage Risk Comparison Matrix

| Risk Dimension | Stage A (V1.0 — ✅ Code-Verified) | Stage B (V1.5 — ⏳ Roadmap) | Stage C (V2.0 — ⏳ Design Spec) |
|----------------|-----------------------------------|-----------------------------|--------------------------------|
| **Bridge Latency** | N/A (Arbitrum-native ingress) or 1h timeout escort (Robinhood) | Medium — bridge friction absorbed by yield buffer | **Eliminated** — optional Robinhood escort only |
| **AML / Compliance** | Standard DeFi + outbound-only Robinhood escort | Strong — segregated RWA tranche | Standard DeFi (Robinhood opt-in) |
| **Hedge Signing Path** | HL L1 EIP-712 + 30s WS heartbeat | Medium — HL retained; Variational shadow PoC | **Same-chain** UserOp (Variational) |
| **Funding Basis Risk** | Medium — DEX GM vs CEX perp | Medium | Lower — DEX GM vs DEX perp |
| **Oracle / Sequencer** | <30s oracle lag fail-closed · 600s sequencer grace | Same sensors + storm fallback (planned) | Same-chain oracle alignment (easier) |
| **Liquidity Depth** | HL deep book (production) | HL + Variational PoC depth TBD | Variational depth — venue DD required |
| **ZeroDev Complexity** | Kernel v3 · Paymaster · Smart Routing | Dual-stack + Kernel v4 adapter (planned) | Single-chain Intent Compose |
| **106 µs Shield** | ✅ Venue-agnostic · production | ✅ No Wasm rewrite | ✅ No Wasm rewrite |

---

## 2. Key Architecture Invariants & Financial Physics

### 2.1 Honest Bridge Accounting (`IN_FLIGHT_BRIDGE_CAPITAL`)

When funds cross via Across Bridge, BDLW labels capital as `IN_FLIGHT_BRIDGE_CAPITAL`. **`lostUsd ≡ 0`** holds strictly because capital is not yet exposed to market delta. If bridge execution exceeds `DEFAULT_ACROSS_BRIDGE_TIMEOUT_MS` (1 hour), the system triggers `BRIDGE_TIMEOUT_FAIL_CLOSED`, refusing to open naked positions.

**Code SSOT:** `src/adapters/robinhood/robinhood-across-bridge.ts` · Vitest 5/5 PASS (`tests/adapters/robinhood-across-bridge.test.ts`)

### 2.2 Tiered Liquidity Stacking (Aave v3 / Morpho Blue Fallback) — ⏳ Roadmap Spec (V1.5)

> **v1.0 today:** Aave APY is used as a **hurdle-rate probe** when GMX markets wire is unavailable — not automatic capital redeployment.

During market storms (3σ volatility spikes, oracle lag >30s, or Sequencer recovery grace periods), the **V1.5 target** is capital fallback to Aave v3 / Morpho Blue on Arbitrum One (~4%~5% base yield), then redeployment into Delta-Neutral GMX v2 skew rebalancing when Soil normalizes.

**Code SSOT (v1.0 probe only):** `src/adapters/arbitrum/arbitrum-yield-ingress.ts` · `src/services/yield/rebalance-rules.ts` (`FRICTION_BUFFER_APY`)

### 2.3 Two-Tiered Yield System & Citadel Safety Buffer

| Tier | Mechanism | Cap / Rule |
|------|-----------|------------|
| **Robinhood Ingress Escort** | Base RWA Earn + institutional compliance channel | Capped at **+2.0% Boost** (5.5%~6.5% total APY) |
| **Citadel Safety Buffer** | GMX v2 Skew Arbitrage excess (+5~10 bps `uiFeeReceiver`) | Absorbs bridge fees, basis risk, and MEV slippage |

### 2.4 Evolution of ZeroDev: From Bridge Router to Intent Composer

Even in a 100% Native Arbitrum setup (Stage C), ZeroDev remains the indispensable engine:

| Capability | Stage A (v3) | Stage C (v4 + EIP-7702) |
|------------|--------------|-------------------------|
| **Gas-Free Sponsorship** | Paymaster + daily caps | Same, extended to AI agent fleets |
| **Scoped Security** | 30s TTL Session Keys · `ORDER_EXECUTE` only | Zero withdrawal scope preserved |
| **Atomic Composition** | 1-click crosschain deposit/swap | Aave → GMX → Variational in one UserOp |

**Spec SSOT:** [`TECHNICAL_SPECIFICATION.md` §2.4](./TECHNICAL_SPECIFICATION.md)

---

## 3. The 60 Reflective Architectural Invariants (Summary Matrix)

> **Defense Matrix (R01–R20):** 17 Active · 2 Refactored · 1 Deprecated — see [`TECHNICAL_SPECIFICATION.md` §3.3](./TECHNICAL_SPECIFICATION.md)  
> **Status legend:** **✅ Code-Verified** = v1.0 baseline with code/test anchor · **⏳ Roadmap Spec** = V1.5/V2.0 design — not claimed as shipped

### I. Honest Accounting & Cross-Chain Physics (1–10)

| # | Status | Invariant | Mechanism |
|---|--------|-----------|-----------|
| 1 | ✅ | **Honest Accounting** | In-flight bridge funds labelled `IN_FLIGHT_BRIDGE_CAPITAL`; zero naked exposure |
| 2 | ✅ | **Zero Loss Invariant** | `lostUsd ≡ 0` — pending bridge liquidity is never booked as principal loss |
| 3 | ✅ | **Bridge Timeout Fail-Closed** | `DEFAULT_ACROSS_BRIDGE_TIMEOUT_MS` = 1h → `BRIDGE_TIMEOUT_FAIL_CLOSED` |
| 4 | ✅ | **Unidirectional Escort** | Robinhood `46630`/`4663` → Arbitrum `42161` outbound-only |
| 5 | ✅ | **AML Inbound Isolation** | `42161 → 46630/4663` inbound blocked · `AML_INBOUND_TO_ROBINHOOD_BLOCKED` |
| 6 | ✅ | **Settlement Window Honesty** | GMX 3–5 min · HL withdrawal 15 min — capital held in-flight, not mis-booked |
| 7 | ✅ | **Non-Custodial Escrow** | User principal never booked as protocol-owned; Kernel account SSOT |
| 8 | ✅ | **Basis Risk Quantification** | Cross-venue delta tracked; friction absorbed by Citadel Safety Buffer |
| 9 | ✅ | **Across Bridge SSOT** | `evaluateAcrossBridgeTransfer()` + `evaluateBridgeTimeout()` pure functions |
| 10 | ✅ | **Robinhood Safety Switch** | On-chain `RobinhoodSafetySwitch.sol` inbound invariant enforcement |

### II. ZeroDev & Account Abstraction (11–20)

| # | Status | Invariant | Mechanism |
|---|--------|-----------|-----------|
| 11 | ⏳ | **ZeroDev Evolution** | Kernel v3 → v4 EIP-7702 Intent Composer for native multi-venue routing |
| 12 | ✅ | **EIP-7562 Zero Bundler Rejection** | Stateless `ecrecover` in Validation Phase; bundler rejection rate → 0 |
| 13 | ✅ | **Scoped Session Keys** | `ORDER_EXECUTE` bounds only — zero withdrawal scope on hot keys |
| 14 | ✅ | **30s TTL Self-Destruct** | Ephemeral session keys auto-revoke; nonce-healed on `Invalid nonce` |
| 15 | ✅ | **Paymaster Gas Sponsorship** | Daily sponsorship caps; fail-closed when ledger exhausted |
| 16 | ✅ | **EIP-712 Domain Binding** | `SliverVineCitadel` · chainId + `verifyingContract` anti-replay |
| 17 | ✅ | **ERC-1271 Dual Validation** | Kernel magic value `0x1626ba7e` + Gate m-of-n ECDSA — neither bypasses the other |
| 18 | ⏳ | **EIP-7702 Zero-Friction Onboarding** | EOA instant Smart Account transformation without asset transfer |
| 19 | ✅ | **Gatehouse Abstraction** | Zero-contract-rewrite venue upgrades via adapter swap |
| 20 | ✅ | **ERC-4337 UserOp Pre-Screen** | Edge `verifyAgentIntent()` before bundler dispatch |

### III. Yield, Liquidity & Fee Tokenomics (21–30)

| # | Status | Invariant | Mechanism |
|---|--------|-----------|-----------|
| 21 | ⏳ | **Two-Tiered Yield** | Robinhood capped at +2% boost; excess yield → Safety Buffer |
| 22 | ⏳ | **Tiered Liquidity Stacking** | Aave/Morpho risk-free base + dynamic GMX skew arbitrage |
| 23 | ⏳ | **Aave Cap Isolation** | Aave USDC 100% supply cap → automatic Morpho Blue fallback |
| 24 | ⏳ | **Dynamic Hurdle Rate** | Performance fee only on yield exceeding Aave base + 1.5% |
| 25 | ✅ | **Builder UI Fee** | +5 bps `uiFeeReceiver` on every GMX v2 payload (v1.0 active) |
| 26 | ✅ | **Skew Neutralizer Premium** | Positive skew / price-impact rebate — never conflated with UI fee |
| 27 | ✅ | **Citadel Safety Buffer** | Excess GMX yield absorbs bridge fees, basis drift, MEV slippage |
| 28 | ⏳ | **Risk-Free Storm Fallback** | 4%~5% Aave/Morpho yield during 3σ / oracle-lag / sequencer grace |
| 29 | ⏳ | **Performance Fee (V1.5)** | 10% of excess yield above Aave benchmark — not on v1.0 UI fee path |
| 30 | ⏳ | **CaaS Monetization** | B2B Wasm Firewall license · 5 bps protocol authorization fee |

### IV. Wasm Shield & Pre-Execution Moat (31–40)

| # | Status | Invariant | Mechanism |
|---|--------|-----------|-----------|
| 31 | ✅ | **Venue-Agnostic Shield** | `checkSoilResistance()` on abstract Soil state — independent of venue |
| 32 | ✅ | **p50 ~106 µs Hot Path** | Rust `#![no_std]` Wasm on Cloudflare Edge |
| 33 | ✅ | **Hot/Cold Decoupling** | 87.76 KiB hot path isolated from 5-min Cron Workers; zero GC pauses |
| 34 | ✅ | **Wasm Budget** | `<28kb` artifact · `<60µs` warm execution (`pkg/soil_core.wasm`) |
| 35 | ✅ | **R01 Soil Resistance** | Depth · cross-spread · slippage fuse — fail-closed pre-broadcast |
| 36 | ✅ | **R04 PGATE Latency** | `PGATE_MAX_LATENCY_MS` = 200 — rejects stale venue timestamps |
| 37 | ✅ | **R03 L2 Book Fail-Closed** | 500ms HL orderbook staleness → dispatch blocked |
| 38 | ✅ | **Cross-Venue TWAP** | Net slippage >0.5% → `TWAPEngineV2` path slicing, not market sweep |
| 39 | ✅ | **Poisson Jitter Anti-MEV** | $1M+ clips: 18s–110s random intervals over 12–18 min parent window |
| 40 | ✅ | **Block 0 Sequencer Defense** | Private relay / QUIC + GMX `cancelOrder` atomic counter |

### V. Risk Matrix & Fail-Closed Severance (41–53)

| # | Status | Invariant | Mechanism |
|---|--------|-----------|-----------|
| 41 | ✅ | **Fail-Closed Haven** | `signingChannelOpen: false` during 3σ storms — no action > wrong action |
| 42 | ✅ | **R02 rootProtection** | Fatal errors / R17/R20 breach → kill Hot Key signature pipelines |
| 43 | ✅ | **R11 Dynamic Max SL** | `Balance × 1% + $100` — deprecated fixed $50 SL forbidden |
| 44 | ✅ | **R07 Notional Cap** | `SESSION_KEY_NOTIONAL_CAP_USD` = $5,000 per scoped session |
| 45 | ✅ | **R12 Leverage Scaling** | 3× → 1× → Halt escalation under funding regime stress |
| 46 | ✅ | **R13 Black-Swan Speed-Halt** | 3σ volatility spike → immediate dispatch freeze |
| 47 | ✅ | **R17 Daily Loss Severance** | Daily loss budget breach → circuit breaker + channel sever |
| 48 | ✅ | **R20 Physical Deadlock** | `R20_FLATTEN_FAILED` → hardlock + signing channel close |
| 49 | ✅ | **R09 Two-Phase Saga** | Intent ledger 2PC — no orphan venue legs |
| 50 | ✅ | **R10 Auto-Compensating Flatten** | Stalled hedge → automated unwind attempt before hardlock |
| 51 | ✅ | **Sequencer Guard** | 600s recovery grace — no naked opens during ArbOS desync |
| 52 | ✅ | **Oracle Lag Fail-Closed** | >30s Chainlink staleness → soil trip + signing sever |
| 53 | ✅ | **Emergency Margin Buffer** | `DEFAULT_CROSS_MMR = 0.05` — 5% equity reserve before new risk |

### VI. V1.5 / V2.0 Evolution & B2B (54–60)

| # | Status | Invariant | Mechanism |
|---|--------|-----------|-----------|
| 54 | ⏳ | **AI Agent Shield** | 30s TTL Session Keys protecting unattended bots from MEV & sequencer halts |
| 55 | ⏳ | **OI Inversion Lock** | GMX Open Interest 99% cap → opposite-leg lock; PnL & delta frozen |
| 56 | ⏳ | **Aave Cap Isolation** | Aave USDC supply cap 100% → automatic Morpho Blue degradation |
| 57 | ⏳ | **PoR De-peg Defense** | Chainlink Proof-of-Reserve >0.5% RWA de-peg → execution hard-lock |
| 58 | ⏳ | **EIP-7702 Zero-Friction Onboarding** | EOA wallet → Smart Account without asset migration |
| 59 | ⏳ | **Dynamic Hurdle Rate** | Performance fee charged only above Aave benchmark + 1.5% |
| 60 | ⏳ | **Immutable B2B License** | Static 87.76 KiB Wasm core powering CaaS ecosystem subscriptions |

---

## 4. Verification & Related Documents

### 4.0 Audit Walkthrough — Code Anchors (Grant Evaluators)

Evaluators should trace claims in this document to the following SSOT paths:

| Pillar | Claim | Code SSOT | Test Anchor |
|--------|-------|-----------|-------------|
| **Bridge accounting** | `IN_FLIGHT_BRIDGE_CAPITAL` · `lostUsd ≡ 0` | [`src/adapters/robinhood/robinhood-across-bridge.ts`](../../src/adapters/robinhood/robinhood-across-bridge.ts) | [`tests/adapters/robinhood-across-bridge.test.ts`](../../tests/adapters/robinhood-across-bridge.test.ts) (5/5) |
| **ZeroDev AA gate** | Citadel risk gate before UserOp · failover · gas ledger | [`src/adapters/arbitrum/zerodev-aa/zerodev-aa-gate.ts`](../../src/adapters/arbitrum/zerodev-aa/zerodev-aa-gate.ts) (`zerodev-aa/zerodev-aa-gate.ts`) | [`tests/adapters/zerodev-aa-gate.test.ts`](../../tests/adapters/zerodev-aa-gate.test.ts) |
| **Smart Routing calldata** | USDG → GMX `ExchangeRouter` · `payloadHash()` binding | [`src/services/adapters/gmx-smart-route-payload-binding.ts`](../../src/services/adapters/gmx-smart-route-payload-binding.ts) | [`tests/adapters/gmx-smart-route-payload-binding.test.ts`](../../tests/adapters/gmx-smart-route-payload-binding.test.ts) |
| **Wasm Soil Shield** | p50 ~106 µs pre-execution fuse | [`src/services/risk-control-lib/soil-resistance.ts`](../../src/services/risk-control-lib/soil-resistance.ts) · [`pkg/soil_core.wasm`](../../pkg/soil_core.wasm) | `tests/risk-control/*` |

**ZeroDev AA execution path (read order):**

```text
zerodev-aa-gate.ts          → evaluateStaticBreakerMatrix() + Citadel risk gate
  ├─ zerodev-aa-failover.ts     → Arbitrum One health / AA probe route
  ├─ zerodev-aa-static-breaker.ts → soil + gas sponsorship limits
  └─ zerodev-aa-userop.ts       → Paymaster + bundler dispatch (after gate PASS)

gmx-smart-route-payload-binding.ts → buildGmxSmartRoutePayloadBinding()
  └─ gated-executor-payload.ts     → computeGatedExecutorPayloadHash() → SliverVineGate
```

> **Note:** `zerodev-aa-gate.ts` is an opt-in CLI/SDK Citadel risk gate — not mounted on the Worker hot path. Production soil fuse remains `checkSoilResistance()` on Edge.

| Check | Command / Surface | Expected |
|-------|-------------------|----------|
| Full regression | `pnpm test -- --run` | **168 files \| 742 PASS** |
| Bridge invariants | `pnpm exec vitest run tests/adapters/robinhood-across-bridge.test.ts` | **5/5 PASS** |
| Live audit | `GET /api/grant-audit` | `lostUsd: 0` · guard states exposed |

| Document | Purpose |
|----------|---------|
| [`TECHNICAL_SPECIFICATION.md`](./TECHNICAL_SPECIFICATION.md) | Yellow Paper — R01–R20 · Triangle Liquidity Loop |
| [`../audit/ROBINHOOD_CHAIN_SAFETY_GATE_AUDIT.md`](../audit/ROBINHOOD_CHAIN_SAFETY_GATE_AUDIT.md) | Robinhood Three Pillars audit |
| [`../sdk/CITADEL_SDK_BLUEPRINT.md`](../sdk/CITADEL_SDK_BLUEPRINT.md) | `@slivervine/citadel-sdk` integration |
| [`../internal/CROSS_CHAIN_RISK_AND_EVOLUTION_ZH.md`](../internal/CROSS_CHAIN_RISK_AND_EVOLUTION_ZH.md) | 中文官方 SSOT 備份 |
