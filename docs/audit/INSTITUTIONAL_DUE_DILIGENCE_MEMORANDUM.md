# Institutional Due Diligence & Risk Compliance Memorandum (DDIP) — SliverVine Protocol (BeDelta Living Water v1.0 / BeΔ)

| Field | Value |
|-------|-------|
| **Document** | Institutional Due Diligence & Risk Compliance Memorandum (DDIP) |
| **Version** | **v1.0.0** |
| **Classification** | Public Grant / Institutional Allocator Diligence |
| **Entity** | SilverVine Labs |
| **Protocol** | SliverVine Protocol (BeDelta Living Water v1.0 / BeΔ) · Santenmoku internal engine |
| **Audience** | Arbitrum Foundation · ZeroDev Grant Committee · Institutional allocators · Fund-of-funds diligence |
| **Baseline** | **Vitest SSOT:** **Proposal Baseline: 175 test files | 773 PASS (Current Branch Live: 176 test files | 775 PASS Clean)** · Wasm hot-path **87.76 KiB gzip** · Shield **p50 ~106 µs** (TS Gateway) · Wasm warm **&lt;60 µs** |
| **Live Proof** | [`GET /api/grant-audit`](https://bedeltawater.slivervine.xyz/api/grant-audit) |
| **Spec SSOT** | [`../architecture/TECHNICAL_SPECIFICATION.md`](../architecture/TECHNICAL_SPECIFICATION.md) |
| **Risk Framework SSOT** | [`../architecture/CROSS_CHAIN_RISK_AND_EVOLUTION.md`](../architecture/CROSS_CHAIN_RISK_AND_EVOLUTION.md) |

---

## Core Objective

This memorandum provides a **transparent, code-verified audit trail** for the Arbitrum Foundation, ZeroDev, and institutional allocators evaluating BDLW Delta-Neutral vault infrastructure. Every quantitative claim maps to a **reproducible command, test file, or on-chain artifact** — not narrative assurance.

> **Read first:** Full **Risk & Disclaimer** disclosures — including non-custodial semantics, residual cross-chain/basis risks, and the limits of Fail-Closed protection — are in [**§ Risk & Disclaimer**](#risk--disclaimer) below. DDIP is an architectural diligence artifact; it does **not** constitute legal, investment, or tax advice, nor regulatory certification.

---

## Risk & Disclaimer

> **Effective scope:** This section applies to all readers — retail participants, institutional allocators, grant evaluators, and fund-of-funds diligence teams. By referencing DDIP, you acknowledge that BDLW is a **sophisticated smart-contract protocol**, not a bank deposit, money-market fund, or insured cash product.

### R.1 Protocol Classification — Sophisticated Smart-Contract Infrastructure

BeDelta Living Water (BDLW) is a **sophisticated, non-custodial DeFi execution protocol** operated by SilverVine Labs. It composes:

| Layer | Function | SSOT |
|-------|----------|------|
| **Pillar 3 — Pre-Execution Shield** | **Fail-Closed** Citadel gate **before** broadcast | `checkSoilResistance()` · `pkg/soil_core.wasm` |
| **Wasm Soil Engine** | **p50 ~106 µs** hot-path fuse on Edge | R01–R20 matrix · Vitest regression |
| **Pillar 1 — Gatehouse** | Scoped Session Keys · EIP-712 · ZeroDev Kernel v3 AA | `session-key-gates.ts` |
| **Pillar 2 — Compliance Ingress Firewall** | Venue-agnostic unidirectional AML escort & Pending-Capital Recognition Invariant (`IN_FLIGHT_BRIDGE_CAPITAL` · `lostUsd ≡ 0`); inbound AML blocked. **Robinhood Chain is the inaugural Code-Verified / Dry-Run Verified reference adapter** — not the product identity | `src/adapters/across-ingress-bridge.ts` · `IngressSafetySwitch.sol` |
| **Venue legs** | GMX v2 GM pools (Arbitrum One) + Hyperliquid 1× short hedge | Tech Spec §2 |

**Fail-Closed posture:** When soil, oracle, sequencer, bridge, or session sensors trip, BDLW **prefers no action over wrong action** — `signingChannelOpen: false`, UserOp rejected pre-bundler, bridge state `BRIDGE_TIMEOUT_FAIL_CLOSED`. This is a **pre-execution safety layer**, not a guarantee of profit, principal protection, or elimination of market risk.

```text
User intent → 106µs Wasm Soil Engine (Fail-Closed) → Gate attestation → Venue broadcast
 │
 └── trip → severance (no broadcast) — NOT "zero financial risk"
```

### R.2 Non-Custodial Execution Substrate

BDLW operates on a **non-custodial execution substrate**:

- User principal resides in **ZeroDev Kernel Smart Accounts** controlled by the user — not in a protocol treasury, omnibus wallet, or discretionary custodian account.
- SilverVine Labs does **not** take discretionary possession of user funds, does **not** rehypothecate labeled in-flight bridge capital, and does **not** represent itself as a licensed custodian, broker-dealer, or payment institution.
- Protocol yield accrual via GMX **`uiFeeReceiver` (+10 bps)** and **up to 25% GMX Referral Rebate** is **protocol revenue**, explicitly separated from user principal in accounting semantics (§6.3). The 10 bps builder fee is a native GMX v2 ExchangeRouter parameter — zero additional overhead on v1.0 execution safety.

**0-Proxy architecture** (§5.3) means BDLW provides **risk gates and routing logic** — not balance-sheet intermediation. Users and institutions retain **direct smart-contract exposure** to underlying venues (GMX, Hyperliquid, Across bridge, Robinhood Chain escort path).

### R.3 Residual Risks — Quantified, Isolated, and Buffered (Not Hidden)

BDLW **does not** market "zero risk," "guaranteed yield," or "capital-protected returns." Residual risks remain **fully disclosed, quantified where possible, isolated by state labels, and economically buffered** — rather than obscured behind marketing copy.

| Residual risk class | How BDLW treats it | What Fail-Closed does **not** remove |
|--------------------|--------------------|--------------------------------------|
| **Cross-chain / bridge** | `IN_FLIGHT_BRIDGE_CAPITAL` label · 1h timeout → `BRIDGE_TIMEOUT_FAIL_CLOSED` · **`lostUsd ≡ 0`** honest pending accounting | Bridge operator failure · settlement delay · smart-contract exploit on bridge |
| **Basis drift (GM vs HL)** | Dual-leg delta tracking · Citadel Safety Buffer · Survival Benchmark 3σ replay | Persistent funding/basis divergence · venue-specific insolvency |
| **Oracle staleness** | `ORACLE_LAG_DEADLOCK` (>30s) · fail-closed severance | Oracle manipulation · feed outage beyond modeled thresholds |
| **Sequencer / ArbOS desync** | 600s recovery grace · no naked opens during desync | Extended L2 outage · reordering/MEV beyond PGATE budget |
| **Smart-contract risk** | Immutable Wasm · L1 consume-once gate · 775 PASS (Current Branch Live) + chaos matrix | Unknown vulnerabilities · upgrade/key compromise · third-party venue bugs |
| **Market / liquidity** | `MIN_DEPTH_USD` · 0.5% slippage fuse · TWAP path slicing | Gap windows · depth evaporation · black-swan tail beyond stress replay |
| **Yield variability** | Dynamic Target Range **8.2% ~ 11.8%** (non-guaranteed HUD band) · **0.5% Hurdle Gate** | Negative funding · fee compression · emission-independent return shortfall |

**Isolation principle:** Cross-chain capital in transit is **labeled and non-deployable** until `SETTLED`. Basis and funding shocks are **buffered** by Citadel Safety Buffer and hurdle-gated redeployment (`FRICTION_BUFFER_APY = 0.005`). These controls **reduce preventable loss paths** — they do **not** convert DeFi into a risk-free product.

> **Anti-marketing pledge:** Any representation of BDLW as "risk-free," "guaranteed APY," or "principal protected" is **inconsistent with this memorandum** and with the protocol's honest-accounting invariants.

### R.4 What Fail-Closed Protection Means (and Does Not Mean)

| Statement | Accurate? |
|-----------|-----------|
| BDLW blocks toxic orders **before** GMX/HL broadcast when sensors trip | **Yes** — 255/255 chaos scenarios · `capitalLossUsd: 0` in adversarial matrix |
| BDLW eliminates smart-contract, market, bridge, or counterparty risk | **No** |
| BDLW guarantees the Dynamic Target Range 8.2–11.8% APY | **No** — display band only; see §5.6 |
| Pending bridge liquidity is booked as principal loss | **No** — `lostUsd ≡ 0` until explicit, bounded execution loss |
| Users require sophistication to evaluate residual risks | **Yes** |

Fail-Closed is **operational risk severance at the pre-execution boundary** — analogous to a circuit breaker, not an insurance policy.

### R.5 Legal, Regulatory & No-Advice Disclaimers

| Topic | Disclosure |
|-------|------------|
| **Legal advice** | DDIP is **not** legal advice. Engage qualified counsel for jurisdiction-specific analysis. |
| **Investment advice** | DDIP is **not** investment, financial, or tax advice. No recommendation to buy, sell, or hold any asset. |
| **Regulatory status** | BDLW does **not** claim banking license, MiCA CASP authorization, SEC/CFTC registration, or **SOC 2 Type II** attestation. Framework mappings in §5 are **architectural alignment narratives** only. |
| **Securities characterization** | SilverVine Labs makes **no** representation regarding whether any BDLW interaction constitutes a security in any jurisdiction. |
| **Forward-looking statements** | Roadmap items marked **⏳ Roadmap Spec** are design targets — not commitments of delivery or performance. |
| **Third-party venues** | GMX, Hyperliquid, ZeroDev, Across, Robinhood Chain, and Arbitrum are **independent third parties**. BDLW is not responsible for their uptime, governance, or solvency. |
| **Live audit endpoint** | `GET /api/grant-audit` reflects **operational telemetry under normal test criteria** — not a real-time guarantee for all future states. |

### R.6 Allocator & User Acknowledgment

Institutional allocators and sophisticated users interacting with BDLW should acknowledge that they:

1. **Understand smart-contract composability risk** across Arbitrum One, Hyperliquid, and optional Robinhood escort paths.
2. **Accept residual cross-chain and basis exposure** even when Fail-Closed gates are operational — including scenarios outside the 255-case chaos matrix and 30D Survival Benchmark replay.
3. **Do not rely on DDIP, HUD APY bands, or grant-audit telemetry** as substitutes for independent due diligence, legal review, and risk budgeting.
4. **Recognize that Fail-Closed severance may delay or prevent execution** — potentially missing intended market opportunities (opportunity cost is a real economic risk).

**Verification SSOT:** `pnpm test -- --run` · `GET /api/grant-audit` · [`CROSS_CHAIN_RISK_AND_EVOLUTION.md`](../architecture/CROSS_CHAIN_RISK_AND_EVOLUTION.md) §2.5–§2.6 (economic sustainability · real yield) · §4 (ingress timing) · §6 (Basel mapping).

---

## 1. Executive Summary

BeDelta Living Water (BDLW) is a **pre-execution Citadel risk layer** wrapping GMX v2 GM pools on Arbitrum One with a Hyperliquid 1× short hedge leg. Capital may ingress via **Arbitrum-native USDC** (instant path) or **Robinhood Chain USDG escort** (unidirectional Across bridge with honest in-flight accounting).

### 1.1 Diligence Verdict Matrix

| Pillar | Posture | Primary evidence |
|--------|---------|------------------|
| **Pre-execution shield** | Fail-closed before broadcast | `checkSoilResistance()` · `pkg/soil_core.wasm` · R01–R20 matrix |
| **Capital accounting** | `lostUsd ≡ 0` on pending bridge liquidity | `src/adapters/across-ingress-bridge.ts` · 5/5 Vitest |
| **Session / AA security** | Scoped keys · notional cap · gas ledger | ZeroDev AA gate · `session-key-gates.ts` |
| **Stress & simulation** | 30D Survival Benchmark + Proposal Baseline: 175 test files | 773 PASS (Current Branch Live: 176 test files | 775 PASS Clean) regression | `generate-survival-report.ts` · `pnpm test -- --run` |
| **Compliance isolation** | Pillar 2 Compliance Ingress Firewall — outbound-only escort · AML inbound block · Robinhood Chain as inaugural reference adapter | `IngressSafetySwitch.sol` · [`ROBINHOOD_CHAIN_SAFETY_GATE_AUDIT.md`](./ROBINHOOD_CHAIN_SAFETY_GATE_AUDIT.md) |

### 1.2 Locked SSOT Metrics (Evaluator Copy-Paste)

| Metric | Locked value | Verifier |
|--------|--------------|----------|
| **Vitest regression** | **Proposal Baseline: 175 test files | 773 PASS (Current Branch Live: 176 test files | 775 PASS Clean)** | `pnpm test -- --run` |
| **Bridge invariants** | **5/5 PASS** | `pnpm exec vitest run tests/adapters/across-ingress-bridge.test.ts` |
| **ZeroDev AA gate** | **4/4 PASS** | `pnpm exec vitest run tests/adapters/zerodev-aa-gate.test.ts` |
| **Chaos matrix** | **255/255 blocked · `capitalLossUsd: 0`** | [`chaos-blackswan-metrics.json`](./chaos-blackswan-metrics.json) |
| **Security matrix** | **3-Tier: 5/0/0 PASS** | `pnpm audit:security` → [`static-analysis-report.json`](./static-analysis-report.json) |
| **V1.0 capacity anchor** | **$100,000** Alpha Vault / design notional | `MIN_DEPTH_USD` · `ORDER_SIZE_MAX_USD` · Survival `NOTIONAL_USD` |

### 1.3 Document Map for Deep Diligence

| Topic | DDIP section | Extended SSOT |
|-------|-------------|---------------|
| **Risk & Disclaimer** | [§ Risk & Disclaimer](#risk--disclaimer) | This document · non-custodial · residual risk table |
| Simulation & chaos harness | §3 | This document · [`CROSS_CHAIN_RISK_AND_EVOLUTION.md`](../architecture/CROSS_CHAIN_RISK_AND_EVOLUTION.md) §4 |
| Arbitrum Native vs Robinhood escort | §4 | This document · [`CROSS_CHAIN_RISK_AND_EVOLUTION.md`](../architecture/CROSS_CHAIN_RISK_AND_EVOLUTION.md) §5 |
| Regulatory & institutional compliance | §5 | This document · [`CROSS_CHAIN_RISK_AND_EVOLUTION.md`](../architecture/CROSS_CHAIN_RISK_AND_EVOLUTION.md) §6 |
| ArbOS Elara · Dynamic Target Range | §5.6 | [`CROSS_CHAIN_RISK_AND_EVOLUTION.md`](../architecture/CROSS_CHAIN_RISK_AND_EVOLUTION.md) §6.5 · Tech Spec §4.2 |
| Real yield vs. toxic inflation | §2.6 (Risk Framework SSOT) | [`CROSS_CHAIN_RISK_AND_EVOLUTION.md`](../architecture/CROSS_CHAIN_RISK_AND_EVOLUTION.md) §2.6 |
| 60 architectural invariants | §5.1–§5.2 | [`CROSS_CHAIN_RISK_AND_EVOLUTION.md`](../architecture/CROSS_CHAIN_RISK_AND_EVOLUTION.md) §3 |
| Robinhood reference adapter audit | §2.3 | [`ROBINHOOD_CHAIN_SAFETY_GATE_AUDIT.md`](./ROBINHOOD_CHAIN_SAFETY_GATE_AUDIT.md) |
| Principal security interrogations | §2 | [`PRINCIPAL_AUDIT_REPORT.md`](./PRINCIPAL_AUDIT_REPORT.md) |
| ZeroDev EIP-7702 vs. institutional substrate | — | [`ZERODEV_EIP7702_COMPARATIVE_ANALYSIS.md`](./ZERODEV_EIP7702_COMPARATIVE_ANALYSIS.md) |
| Yellow Paper / R01–R20 | §2.2 | [`TECHNICAL_SPECIFICATION.md`](../architecture/TECHNICAL_SPECIFICATION.md) |

---

## 2. Infrastructure Security (SOC 2 Alignment & Immutability)

> **Terminology note:** References to "SOC 2 alignment" describe **control-objective mapping** to AICPA Trust Services Criteria (Security, Availability, Processing Integrity) — not an attestation report.

### 2.1 Trust Services Criteria Mapping

| TSC domain | BDLW control | Code / artifact anchor |
|------------|-------------|------------------------|
| **CC6 — Logical access** | Scoped Session Keys (`ORDER_EXECUTE` only) · **30s TTL Heartbeat / Intent Execution Window** (crypto session key lifetime bounded up to **24h / 7d**) · R07 $5k cap | `hl-session/permissions.ts` · `session-key-gates.ts` |
| **CC7 — System operations** | Sequencer guard (600s grace) · oracle lag fail-closed · PGATE 200ms latency fuse | `sequencer-guard.ts` · `PGATE_MAX_LATENCY_MS` |
| **CC8 — Change management** | Immutable Wasm artifact + pinned Worker bundle · BUSL-1.1 license gate | `pkg/soil_core.wasm` · `pnpm bundle:measure` |
| **CC9 — Risk mitigation** | R17 daily loss severance · R20 physical deadlock · rootProtection | `circuit-breaker.ts` · `flatten-hardlock.ts` |
| **A1 — Availability** | Arbitrum AA failover probe · RPC radar · soft-confirmation guard | `zerodev-aa-failover.ts` · `rpc-radar.ts` |
| **PI1 — Processing integrity** | EIP-712 domain binding · GMX payload hash · Gate consume-once | `SliverVineGate.sol` · `gated-executor-payload.ts` |

### 2.2 Immutability & Tamper Evidence

| Layer | Immutability property | Verification |
|-------|----------------------|--------------|
| **Wasm Soil Core** | `#![no_std]` Rust · `<28kb` budget · no runtime dependency injection on hot path | `pnpm build:wasm` · `tests/services/wasm-feasibility-lib/*` |
| **L1 attestation gate** | `SliverVineGate.sol` `verifyAndConsume()` — single-use digest | Forge suite · Slither / Aderyn in security matrix |
| **Negative proofs** | Property tests confirm soil trips on depth breach — cannot silently widen fuse | `pnpm verify:negative` |
| **5-TX anchor** | SHA-256 verified execution hashes on HL testnet | `pnpm verify:5tx` · `verified-5tx-lib/` |
| **Telemetry integrity** | 96h rolling daemon · grant-audit SWR fallback never surfaces fabricated loss | `pnpm telemetry:96h` · `GET /api/grant-audit` |

### 2.3 Three Pillars Architecture (Evaluator Mental Model)

**Pillar 2 — Compliance Ingress Firewall (with Robinhood Ingress as Reference Adapter):** A **venue-agnostic**, unidirectional AML firewall and escort accounting layer. Capital from permissioned ingress sources is escorted outbound-only into Arbitrum; inbound AML paths are fail-closed at the **Edge ingress adapter** (`src/adapters/across-ingress-bridge.ts`); in-flight bridge capital is honestly labeled via the **Pending-Capital Recognition Invariant** (`IN_FLIGHT_BRIDGE_CAPITAL`, `lostUsd ≡ 0`) until settled. **Robinhood Chain (`46630`/`4663`) is the inaugural Code-Verified / Dry-Run Verified reference adapter** — adapter SSOT is venue-agnostic (`src/adapters/across-ingress-bridge.ts`); Robinhood Chain remains the inaugural reference route; on-chain SSOT is **`IngressSafetySwitch.sol`** (Phase A rename); the architectural pillar is not Robinhood-bound.

```text
[ Allocator Capital ]
 │
 ▼
┌─────────────────────────────────────┐
│ Pillar 1: GATEHOUSE (Auth) │ ZeroDev Kernel v3 · EIP-712 · Session Keys
└──────────────────┬──────────────────┘
 ▼
┌─────────────────────────────────────┐
│ Pillar 2: COMPLIANCE INGRESS │ Venue-agnostic AML escort & accounting
│ FIREWALL │ Robinhood Chain = inaugural ref adapter
│ │ · outbound-only · AML inbound block
└──────────────────┬──────────────────┘
 ▼
┌─────────────────────────────────────┐
│ Pillar 3: SHIELD (Pre-Execution) │ checkSoilResistance() · Wasm · R01–R20
└─────────────────────────────────────┘
```

**Evaluator command pack:**

```bash
pnpm test -- --run # Proposal Baseline: 175 test files | 773 PASS (Current Branch Live: 176 test files | 775 PASS Clean)
pnpm audit:security # 3-Tier matrix
pnpm exec vitest run tests/adapters/across-ingress-bridge.test.ts
pnpm exec vitest run tests/adapters/zerodev-aa-gate.test.ts
```

---

## 3. Simulation, Stress Testing & Chaos Engineering Framework

BDLW maintains a **three-layer simulation stack** — institutional market replay (Survival Benchmark), AA/session dry-run gates (ZeroDev + HL), and adversarial chaos matrix — each producing CLI-verifiable artifacts with **`capitalLossUsd: 0`** as the pass criterion.

```text
Layer 1 — Survival Benchmark scripts/survival-benchmark/ (30D HL L2 + Dual-Radar replay)
Layer 2 — AA / Session Dry-Run tests/adapters/* (Pre-bundler fail-closed proofs)
Layer 3 — Chaos Engineering scripts/chaos-blackswan-stress.ts (255-scenario matrix)
```

> **Path note:** The Survival Benchmark engine lives under **`scripts/survival-benchmark/`** (invoked via `scripts/generate-survival-report.ts`). There is no `tests/survival-benchmark/` directory — regression coverage for chaos lives in `tests/scripts/chaos-blackswan-stress.test.ts`.

### 3.1 Survival Benchmark — 3σ Black-Swan & Liquidity Drain Simulation

The Survival Benchmark fuses **30-day Hyperliquid mainnet history** with live L2 orderbook walks to stress the Citadel envelope under funding shocks, basis blow-outs, and depth evaporation.

| Parameter | Locked value | SSOT |
|-----------|-------------|------|
| Canonical notional | **$100,000** | `NOTIONAL_USD` · `survival-benchmark.types.ts` |
| Stress notional | **$1,000,000** | `STRESS_NOTIONAL_USD` |
| Lookback | **30 days** | `LOOKBACK_MS` |
| Black-swan degrade threshold | Composite **< 30** | `DEGRADE_THRESHOLD` |
| Depth floor | **$100,000** | `MIN_DEPTH_USD` |
| Slippage fuse | **0.5%** | `MAX_SLIPPAGE` |

**Execution:**

```bash
pnpm tsx scripts/generate-survival-report.ts
# Output: docs/0801_BeDelta_Survival_Benchmark.md
```

#### 3.1.1 Dual-Radar 5-Sensor Matrix (Black-Swan Regime Detection)

`HLRadarEvaluator` (`scripts/survival-benchmark/hl-radar-evaluator.ts`) scores each hourly tick:

| Sensor | Function | Black-swan signal |
|--------|----------|-----------------|
| **S1–S3** | Funding · premium · composite funding stress | Negative funding persistence · rate anomalies |
| **S4 — Whale / liq wall** | `scoreS4WhaleLiq()` | Liquidation magnet proximity · leverage structural wall breach |
| **S5 — Basis Z-score** | `scoreS5BasisZ()` | **\|Z\| ≥ 3** → score collapses to ≤ 8 (3σ basis blow-out) |

When the weighted composite falls **below `DEGRADE_THRESHOLD` (30)**, the report enters **black-swan regime**: `SystemState` degrades, HUD locks, and Phase 3 `AntiFragileYieldService` activates hourly HL funding boost (default **1.5×** short-leg subsidy) — simulating storm yield capture without opening naked delta.

#### 3.1.2 Liquidity Drain & Depth Walk

| Module | File | What it simulates |
|--------|------|-------------------|
| **L2 book walk** | `book-simulation.ts` · `walkBook()` | Top-of-book consumption @ $100k / $1M notional |
| **Live metrics** | `computeLiveBookMetrics()` | Spread · min-side depth · price impact bps |
| **Soil audit** | `auditLiveBookSoilResistance()` | Fail-closed when `depthUsd < MIN_DEPTH_USD` or slippage > fuse |
| **Market vs SLI-TWAP** | `dualLegMarketSlip()` vs `simulateSliTwap()` | Liquidity drain cost — naked sweep vs path-sliced escort |
| **Phase isolations** | `phase-isolations.ts` | Single-variable weapon staging (Base 3-path → Full 30-path TWAP) |

Phase 5/6 (`phase-isolation-p5p6.ts`) further stress **cross-venue soil** with synthetic depth collapse (`depthUsd: MIN_DEPTH_USD × 0.2`) and dual-venue price divergence — proving soil trips before toxic GMX/HL broadcast.

#### 3.1.3 Survival Benchmark Verdict Fields (Evaluator Checklist)

| Field | Pass posture |
|-------|-------------|
| `soilAudit.tripped` @ $100k | **false** under normal live book |
| `saved100` (TWAP vs market) | Positive slippage savings vs naked sweep |
| `blackSwanHours` | Counted · anti-fragile engine engaged · no unhedged NAV |
| `mddAf` vs `mddBase` | Anti-fragile path MDD ≤ baseline under storm replay |

---

### 3.2 ZeroDev / Hyperliquid Dry-Run Harness

The AA/session dry-run stack proves **Gatehouse fail-closed behavior** before any UserOp or HL signature leaves the Citadel envelope. Primary regression file: **`tests/adapters/zerodev-aa-gate.test.ts`** (4/4 PASS).

```bash
pnpm exec vitest run tests/adapters/zerodev-aa-gate.test.ts
pnpm test:zerodev # Mock bundler + session constraint audit
pnpm exec vitest run tests/services/session-key-gates.test.ts # R07 $5K cap
pnpm exec vitest run tests/services/nonce-auto-healing.test.ts # 30s heartbeat expiry
```

#### 3.2.1 `zerodev-aa-gate.test.ts` — Citadel + Paymaster Fail-Closed

| Test | Assertion | Control |
|------|-----------|---------|
| Healthy soil pass | `assertCitadelRiskGate()` · `sequencerSafe: true` · chain `42161` | Baseline AA route after soil + sequencer + soft-confirmation probes |
| Soil trip | `RiskLimitExceeded` · `TRIP_SOIL_RESISTANCE` · event `SOIL_RESISTANCE_TRIP` | Cross-venue slip **> 0.5%** blocks UserOp pre-bundler |
| Per-UserOp gas cap | `ZERODEV_GAS_LIMIT_EXCEEDED_TRIP` when gas **> $0.50** | `MAX_GAS_COST_PER_USEROP_USD` · `ROOT_PROTECTION_TRIP` |
| Daily Paymaster exhaustion | `sponsored: false` · `ZERODEV_DAILY_SPONSORSHIP_EXHAUSTED` at **$10/day** | `DAILY_SPONSORSHIP_LIMIT_USD` — **fail-closed to self-pay**, not unguarded broadcast |

#### 3.2.2 R07 — $5,000 Session Key Notional Cap

R07 is enforced at the **HL session-key signing pipeline** (`session-key-gates.ts`), proven in companion tests:

```typescript
// tests/services/session-key-gates.test.ts
// limitPx=6000 × sz=1 → SESSION_CAP=6000.00>5000 → signing channel severed
```

| Constant | Value | SSOT |
|----------|-------|------|
| `SESSION_KEY_NOTIONAL_CAP_USD` | **$5,000** | `session-key-types.ts` |
| Violation behavior | `SESSION_KEY_HARDLOCK_INTERCEPTED` · `signingChannelOpen: false` | `assertSessionKeyExecutionGates()` |

Orders above **$5,000** notional trigger **physical severance** of the hot signing channel — no partial fill, no downgrade to unscoped signing.

#### 3.2.3 30s TTL Heartbeat / Intent Execution Window — Session Heartbeat & Intent Expiry

The **30s TTL Heartbeat / Intent Execution Window** spans WS heartbeat, intent ledger, and session revocation — **distinct from** the underlying cryptographic session key lifetime (bounded up to **24h / 7d** per module scope):

| Mechanism | Constant | SSOT | Test anchor |
|-----------|----------|------|-------------|
| **HL WS heartbeat interval** | `WS_HEARTBEAT_INTERVAL_MS = 30_000` — Intent Execution Window | `adapters/hl/websocket/types.ts` | `websocket-client-lifecycle.test.ts` |
| **Heartbeat expiry → lock** | `SESSION_KEY_HEARTBEAT_EXPIRED` | `nonce-auto-healing.ts` | `nonce-auto-healing.test.ts` |
| **2PC intent TTL** | `DEFAULT_TTL_MS = 30_000` | `intent-ledger/defaults.ts` | `intent-persistence.test.ts` |
| **Crypto session key lifetime** | Bounded up to **24h / 7d** (module-scoped) | `agent-intent.ts` · ZeroDev Kernel session modules | `session-key-gates.test.ts` |

When heartbeat expires, `auditSessionKeyHeartbeat()` sets `revocationLocked: true` — stale session keys cannot sign new HL orders. Cross-leg intents older than **30s** abort with `CRASH_RECOVERY_TTL_EXPIRED`, preventing orphan venue legs.

#### 3.2.4 Extended Dry-Run Matrix

| Harness | Command | Scope |
|---------|---------|-------|
| **ZeroDev AA Dry-Run** | `pnpm test:zerodev` | Kernel v3 EP 0.7 UserOp draft · `auditSessionKeyConstraints()` · Risk Oracle Gate |
| **HL panic sandbox** | `pnpm tsx scripts/dry-run-sandbox.ts` | In-memory HL testnet stress → EIP-712 pipeline · **no network** |
| **Grant E2E** | `pnpm demo:pipeline` (default dry-run) | Full Citadel pipeline · `--live` opt-in only |
| **5-TX anchor** | `pnpm verify:5tx` | HL testnet SHA-256 execution proof · $1K / $100K / $1M tiers |
| **Negative proofs** | `pnpm verify:negative` | Depth breach → soil trip confirmed |

> Production Edge SSOT remains **`checkSoilResistance()`** on the Worker hot path. `zerodev-aa-gate.ts` is opt-in CLI/SDK — dry-run harnesses prove adjacent gates without replacing Edge soil.

---

### 3.3 Chaos Engineering — 255-Scenario Black-Swan Matrix

`scripts/chaos-blackswan-stress.ts` executes a **255-case adversarial matrix** covering soil trips, oracle lag, sequencer desync, bridge timeout, session severance, and root-protection cascades.

| Metric | Locked value | Artifact |
|--------|-------------|----------|
| Total scenarios | **255** | [`chaos-blackswan-metrics.json`](./chaos-blackswan-metrics.json) |
| Blocked toxic attacks | **255/255** | Same |
| Fail-closed rate | **100.00%** | Same |
| Capital loss | **`$0`** | `capitalLossUsd: 0` |
| Regression | Vitest wrapper | `tests/scripts/chaos-blackswan-stress.test.ts` |

**Nightly property fuzz** (`pnpm audit:nightly` · 327,675 Forge executions) complements the discrete chaos matrix for L1 attestation (`SliverVineGate.sol`) replay safety.

### 3.4 Continuous Regression Bar

| Harness | Command | Expected |
|---------|---------|----------|
| **Full Vitest** | `pnpm test -- --run` | **Proposal Baseline: 175 test files | 773 PASS (Current Branch Live: 176 test files | 775 PASS Clean)** |
| **Grant risk sim (v1.0 suite)** | `pnpm test:grant-v09-sim` | AA / risk sim PASS |
| **Wasm feasibility** | `pnpm test:wasm-feasibility` | Soil Wasm sim PASS |
| **Security matrix** | `pnpm audit:security` | **3-Tier 5/0/0 PASS** |
| **Property fuzz (Forge)** | `pnpm audit:nightly` | Gate + attestation properties |

---

## 4. Capital Capacity & Execution Timing: Arbitrum Native vs. Pillar 2 Reference Escort Adapter

V1.0 exposes two **capital ingress modes** that converge on the same Citadel pre-execution envelope (`checkSoilResistance()` · R01–R20). Robinhood / Across is a **Pillar 2 Reference Escort Adapter** — not a yield-stacking product. Neither path raises the shared **$100,000 Alpha Vault TVL cap**.

### 4.1 Structured Comparison Table

| Dimension | **Arbitrum Native Vault** | **Pillar 2 Reference Escort Adapter (Robinhood)** |
|-----------|---------------------------|------------------------------|
| **Primary asset** | USDC on Arbitrum One (`42161`) | USDG on Robinhood Chain (`46630` / `4663`) |
| **V1.0 Alpha Vault TVL cap** | **$100,000** hard ceiling (roadmap spec) | **$100,000** — escort does not expand capacity |
| **Ingress latency** | **Instant** — capital already on `42161` | **Across-bridge dependent** — typically minutes to ≤ **1 hour** |
| **Time-to-soil-gate** | **p50 ~106 µs** Wasm fuse · sub-second intent-to-gate | Same after `SETTLED`; **zero** pre-settlement deploy |
| **Single-order cap (v1.0 live)** | `SESSION_KEY_NOTIONAL_CAP_USD` = **$5,000** | N/A until bridge settles |
| **Single-order cap (v1.0 design)** | `ORDER_SIZE_MAX_USD` = **$100,000** | Post-`SETTLED` only; in-flight excluded from NAV |
| **HL depth prerequisite** | `MIN_DEPTH_USD` = **$100,000** | Identical hedge-leg requirement after settlement |
| **Gap-window tightening** | HL gap guard: depth **2×** ($200k) · leverage **3× → 1×** | Bridge **fail-closed** — no naked GM/HL during in-flight |
| **Bridge timeout** | N/A | `DEFAULT_ACROSS_BRIDGE_TIMEOUT_MS` = **1 hour** → `BRIDGE_TIMEOUT_FAIL_CLOSED` |
| **Compliance firewall** | Standard DeFi + Citadel soil | **Unidirectional outbound-only** · `AML_INBOUND_TO_ROBINHOOD_BLOCKED` |
| **Accounting label (in transit)** | N/A | `IN_FLIGHT_BRIDGE_CAPITAL` · **`lostUsd ≡ 0`** |
| **GMX settlement window** | **3–5 min** async (both paths) | Same after deploy |
| **HL withdrawal window** | **~15 min** (both paths) | Same after hedge leg live |
| **Recommended use** | Existing Arb USDC / GM positions | Robinhood USDG earn + institutional compliance escort |

**Quant anchor:** **$100,000** is the code-verified convergence of `MIN_DEPTH_USD`, `ORDER_SIZE_MAX_USD`, Survival Benchmark `NOTIONAL_USD`, and `TECHNICAL_SPECIFICATION.md` §3.6 Alpha Vault Cap.

**Code SSOT:**

| Path | Module | Test |
|------|--------|------|
| Arbitrum native sizing | `trade-pipeline-order-sizing.ts` · `soil-resistance-types.ts` | `tests/risk-control/*` |
| Robinhood escort | `src/adapters/across-ingress-bridge.ts` | `tests/adapters/across-ingress-bridge.test.ts` (**5/5**) |
| On-chain AML firewall | `IngressSafetySwitch.sol` | [`ROBINHOOD_CHAIN_SAFETY_GATE_AUDIT.md`](./ROBINHOOD_CHAIN_SAFETY_GATE_AUDIT.md) |

### 4.2 Execution Timing — Instant vs. In-Flight State Machine

#### Arbitrum Native (Instant Path)

```text
USDC on 42161
 │
 ▼
checkSoilResistance() ← p50 ~106 µs · MAX_SLIPPAGE 0.5% · MIN_DEPTH $100k
 │
 ├─► GMX v2 GM deposit ← async settlement 3–5 min
 └─► HL 1× short (Session Key) ← EIP-712 · R07 $5k live cap
```

Capital is **deployable immediately** after soil pass. No bridge state machine; latency is dominated by GMX keeper settlement and HL signing pipeline — not cross-chain transfer.

#### Robinhood Escort (Deferred Path)

```text
USDG on 46630/4663
 │
 ▼
evaluateAcrossBridgeTransfer() ← validateAcrossBridgeDirection() — outbound-only
 │
 ├── AVAILABLE
 │ │
 │ └── initiate Across ──► IN_FLIGHT_BRIDGE_CAPITAL (lostUsd ≡ 0 · no naked delta)
 │ │
 │ ├── settle ──► SETTLED → full Citadel envelope
 │ │
 │ └── > 1h ──► BRIDGE_TIMEOUT_FAIL_CLOSED
 │
 └── 42161 → Robinhood inbound ──► AML_INBOUND_TO_ROBINHOOD_BLOCKED (fail-closed)
```

| `capitalLabel` | Deployable NAV? | Naked GM/HL allowed? | `lostUsd` |
|----------------|-----------------|----------------------|-----------|
| `AVAILABLE` | No | No | **0** |
| `IN_FLIGHT_BRIDGE_CAPITAL` | **No** | **No** | **0** |
| `SETTLED` | Yes | No — soil-gated | **0** |
| `BRIDGE_TIMEOUT_FAIL_CLOSED` | No | No | **0** |
| `AML_INBOUND_TO_ROBINHOOD_BLOCKED` | No | No | **0** |

> **Allocator invariant:** Bridge delay **cannot** open unhedged delta. In-flight capital is labeled, not deployed, until `SETTLED` — verified in Vitest 5/5.

### 4.3 Capacity Envelope Under Shared Defenses

Both paths share identical post-deploy constraints:

| Control | Value | Applies after |
|---------|-------|---------------|
| Alpha Vault TVL cap | **$100,000** | `SETTLED` / native Arb |
| Soil depth floor | **$100,000** (`MIN_DEPTH_USD`) | Every hedge clip |
| Cross-venue slippage fuse | **0.5%** (`MAX_SLIPPAGE`) | Every rebalance |
| Dynamic Max SL (R11) | Dynamic Account Risk Ceiling (V0.8 Baseline: Equity-Weighted SL; V1.0 Mainnet: Dynamic Adaptive Engine) | @ $100k equity → **$1,100** |
| Buffer target | **5–10%** pre-hedged | `buffer-engine.ts` |

During **HL orderbook gap windows** (HKT tsunami · UTC weekend), native path rebalance clips scale to **~$33,333** from a $100k base (leverage **3× → 1×**); escort path remains **fail-closed** on in-flight capital regardless of gap regime.

### 4.4 Path Selection Guide

| Scenario | Path | Rationale |
|----------|------|-----------|
| Treasury already on Arbitrum One | **Arbitrum Native** | Zero bridge latency · instant soil gate |
| Robinhood USDG institutional earn + compliance channel | **Robinhood Escort** | Outbound-only AML firewall · honest in-flight accounting |
| 3σ storm · sequencer grace · soil trip | **Neither** | `signingChannelOpen: false` on both paths |

```bash
# Verify bridge state machine + AML inbound block
pnpm exec vitest run tests/adapters/across-ingress-bridge.test.ts
```

---

## 5. Regulatory & Institutional Compliance Alignment

> **Disclaimer:** This section maps BDLW architectural controls to **widely referenced institutional frameworks** (Basel III operational risk · Expected Shortfall · SOC 2 TSC · MiCA operational-resilience principles) for allocator diligence. It is **not** a claim of banking license, MiCA CASP authorization, SOC 2 Type II attestation, or formal Pillar compliance.

### 5.1 Basel III Operational Risk → Fail-Closed Citadel Controls

Basel III operational-risk principles require identifiable controls, loss limits, and fail-safe severance when models breach tolerance. BDLW implements these as **code-enforced predicates** — not policy documents.

| Basel III / AMA pillar | BDLW Fail-Closed control | Code / test anchor |
|------------------------|-------------------------|-------------------|
| **Risk identification** | Pre-broadcast soil matrix — depth · cross-spread · slippage | R01 · `checkSoilResistance()` · `soil-resistance.ts` |
| **Risk assessment & measurement** | Dynamic Max SL · order-aware soil budget · daily loss cap | R11 · R17 · `effective-max-sl.ts` |
| **Control & mitigation** | Session scope · notional cap · Paymaster ledger · 2PC Saga | R06 · R07 · R09 · `session-key-gates.ts` |
| **Monitoring & reporting** | Grant audit API · 96h telemetry · HUD guard states | `GET /api/grant-audit` · `pnpm telemetry:96h` |
| **Fail-safe severance** | R20 physical deadlock · signing channel close · rootProtection | `flatten-hardlock.ts` · `circuit-breaker.ts` |
| **Scenario analysis** | 255-case chaos matrix · 30D Survival Benchmark | §3 · `chaos-blackswan-metrics.json` |

**Fail-Closed invariant (all paths):** When any sensor trips, the system prefers **no action over wrong action** — `signingChannelOpen: false`, UserOp rejected pre-bundler, bridge state `BRIDGE_TIMEOUT_FAIL_CLOSED`. Verified: **255/255** chaos scenarios blocked · **`capitalLossUsd: 0`**.

### 5.2 Expected Shortfall (ES) Alignment → Tail-Risk Budgeting

Expected Shortfall captures **average loss beyond a confidence threshold** — the tail beyond VaR. BDLW does not run a bank AMA model on-chain; instead, it enforces **hard tail-loss ceilings** that function as operational ES guards:

| ES concept | BDLW quantitative guard | @ $100k vault equity |
|------------|--------------------------|----------------------|
| **Tail loss per clip** | Order-aware Max SL = min(Dynamic Max SL, order × 0.5% fuse) | **$500** max soil loss @ $100k notional |
| **Dynamic Max SL (R11)** | Dynamic Account Risk Ceiling (V0.8 Baseline: Equity-Weighted SL; V1.0 Mainnet: Dynamic Adaptive Engine) | **$1,100** |
| **Daily ES envelope (R17)** | `Effective Max SL × 3` | **$3,300** daily severance budget |
| **Stress notional (Survival Benchmark)** | `STRESS_NOTIONAL_USD` = **$1,000,000** | 10× Alpha Cap tail replay |
| **Black-swan matrix** | 255 adversarial scenarios · 100% fail-closed | **`capitalLossUsd: 0`** |
| **3σ basis blow-out** | Dual-Radar S5 · composite < 30 → degrade + anti-fragile | §3.1 · `scoreS5BasisZ()` |

```text
Per-clip tail ≤ min($1,100, notional × 0.5%) ← R11 + soil fuse
Daily tail ≤ Effective Max SL × 3 ← R17 severance
Portfolio tail ≤ $100k Alpha Cap + stress replay ← §4 + Survival Benchmark
```

**Honest accounting (`lostUsd ≡ 0`):** Pending bridge liquidity is **never booked into the loss distribution** — eliminating phantom ES inflation from in-flight capital. Only explicit, soil-bounded execution losses can accrue; bridge timeout labels state without P&L recognition.

| Accounting state | Contributes to ES? | `lostUsd` |
|------------------|-------------------|-----------|
| `IN_FLIGHT_BRIDGE_CAPITAL` | **No** — settlement pending | **0** |
| `BRIDGE_TIMEOUT_FAIL_CLOSED` | **No** — process failure, not loss event | **0** |
| Soil-trip rejected order | **No** — fail-closed pre-execution | **0** |
| Bounded execution slippage | **Yes** — capped by order-aware Max SL | ≤ fuse budget |

**SSOT:** `evaluateAcrossBridgeTransfer()` · `computeOrderAwareMaxSlUsd()` · Vitest **Proposal Baseline: 175 test files | 773 PASS (Current Branch Live: 176 test files | 775 PASS Clean)**.

### 5.3 0-Proxy Immutable Infrastructure (SOC 2–Aligned)

**0-Proxy** denotes BDLW's **non-custodial, non-rehypothecation architecture**: user principal resides in ZeroDev Kernel Smart Accounts; the protocol never acts as a balance-sheet proxy, omnibus wallet, or discretionary signer. Immutable artifacts prevent post-deployment tampering of the pre-execution gate.

| SOC 2 TSC domain | 0-Proxy / Immutable control | Verification |
|------------------|----------------------------|--------------|
| **CC6 — Logical access** | Scoped Session Keys (`ORDER_EXECUTE` only) · **30s TTL Heartbeat / Intent Execution Window** (crypto key up to 24h/7d) · R07 $5k cap | `session-key-gates.ts` · `nonce-auto-healing.test.ts` |
| **CC7 — System operations** | Sequencer 600s grace · oracle >30s fail-closed · PGATE 200ms | `sequencer-guard.ts` · `PGATE_MAX_LATENCY_MS` |
| **CC8 — Change management** | Pinned `#![no_std]` Wasm · BUSL-1.1 · Worker bundle measurement | `pkg/soil_core.wasm` · `pnpm bundle:measure` |
| **CC9 — Risk mitigation** | L1 `verifyAndConsume()` single-use digest · no replay | `SliverVineGate.sol` · Forge 60+ PASS |
| **PI1 — Processing integrity** | EIP-712 domain binding · GMX `payloadHash()` calldata lock | `gated-executor-payload.ts` |
| **A1 — Availability** | Arbitrum AA failover · RPC radar · soft-confirmation guard | `zerodev-aa-failover.ts` |

**Immutability stack:**

```text
Layer 1 — Wasm Soil Core (#![no_std], <28kb) → hot-path fuse, no runtime injection
Layer 2 — SliverVineGate.sol (consume-once) → L1 attestation digest lock
Layer 3 — Negative proofs + Proposal Baseline: 175 test files | 773 PASS (Current Branch Live: 176 test files | 775 PASS Clean) regression → silent fuse widening impossible
```

> **SOC 2 note:** Controls are **mapped** to AICPA Trust Services Criteria for transparency — BDLW does **not** claim SOC 2 Type II certification. See also §2.1 for full TSC table.

### 5.4 Unidirectional AML Firewall (MiCA-Aligned)

MiCA (Markets in Crypto-Assets Regulation) emphasizes **operational resilience, segregation of client assets, and robust governance** for crypto-asset service providers. BDLW's Robinhood escort implements a **unidirectional AML compliance firewall** — architecturally aligned with MiCA segregation principles, **without claiming CASP authorization**.

| MiCA-aligned principle | BDLW implementation | SSOT |
|------------------------|---------------------|------|
| **Asset segregation** | User funds in Kernel Smart Accounts — not protocol treasury | ZeroDev Kernel v3 · non-custodial SSOT |
| **Operational resilience** | Fail-closed on bridge timeout · sequencer grace · soil trip | R01–R20 matrix |
| **Conflicts / contamination prevention** | **Outbound-only** escort · inbound reverse path blocked | `validateAcrossBridgeDirection()` |
| **AML inbound isolation** | `42161 → 46630/4663` → `AML_INBOUND_TO_ROBINHOOD_BLOCKED` | `src/adapters/across-ingress-bridge.ts` |
| **On-chain invariant enforcement** | **`IngressSafetySwitch.sol`** address-level oracle flush + blacklist · inbound AML at **`src/adapters/across-ingress-bridge.ts`** | [`ROBINHOOD_CHAIN_SAFETY_GATE_AUDIT.md`](./ROBINHOOD_CHAIN_SAFETY_GATE_AUDIT.md) |
| **Honest pending-asset labeling** | `IN_FLIGHT_BRIDGE_CAPITAL` · **`lostUsd ≡ 0`** | Vitest **5/5** |

```text
[ Robinhood USDG ] ──outbound-only──► [ Arbitrum Citadel Vault ]
 ▲ │
 │ │
 INBOUND BLOCKED ◄───────────────────────────┘
 AML_INBOUND_TO_ROBINHOOD_BLOCKED
```

**Evaluator verification:**

```bash
pnpm exec vitest run tests/adapters/across-ingress-bridge.test.ts # 5/5 — AML + in-flight
pnpm test -- --run # Proposal Baseline: 175 test files | 773 PASS (Current Branch Live: 176 test files | 775 PASS Clean)
```

### 5.6 ArbOS Elara Compliance Alignment & Dynamic Target Range

> **V1.0 Design Spec.** BDLW's **Pillar 2 Compliance Ingress Firewall** natively aligns with the **ArbOS Elara upgrade** — Arbitrum's protocol-level ingress filtering plane — documenting **transaction-ordering awareness** as a reinforcement layer alongside Edge fail-closed gates. See [`TECHNICAL_SPECIFICATION.md`](../architecture/TECHNICAL_SPECIFICATION.md) §4.2.

| Compliance plane | Function | UI / code anchor |
|------------------|----------|------------------|
| **Edge SSOT (pre-broadcast)** | Soil matrix · signing channel severance · UserOp gate | `checkSoilResistance()` · `zerodev-aa-gate.ts` |
| **Pillar 2 Compliance Ingress Firewall + ArbOS Elara** | Venue-agnostic outbound escort · inbound AML block · Robinhood Chain as inaugural reference adapter · Elara drops non-compliant / blacklisted senders before GM payload construction | Tech Spec §4.2 · `IngressSafetySwitch.sol` · `src/adapters/across-ingress-bridge.ts` |
| **Sequencer / ordering sensor** | ArbOS base-fee velocity · sequencer grace — no naked opens during desync | `arbitrum-gas-guard.ts` · `sequencer-guard.ts` |
| **Multi-tranche demo HUD** | Tranche A native vault vs Tranche B bridge state machine | `SmartRoutingDepositCard` · `deposit-tranche-config.ts` |
| **Reactive HUD alerts** | Institutional trip copy for allocators | `compliance-trip-alerts.ts` · `LivingWaterShieldCard` · `AMLShieldCard` |

**Fail-closed trip codes (UI SSOT):**

| Trip code | Card | Behavior |
|-----------|------|----------|
| `SYSTEM_FAIL_CLOSED_TRIP` | Living Water Shield | Storm variant · dispatch blocked · `aria-live="assertive"` banner |
| `ORACLE_LAG_DEADLOCK` | Living Water Shield | Oracle staleness >30s · dispatch blocked |
| `BRIDGE_TIMEOUT_FAIL_CLOSED` | AML Shield | Across >1h timeout · export blocked · in-flight capital labeled · `lostUsd ≡ 0` |

**Dynamic Target Range & Hurdle Gate (yield disclosure):**

| Parameter | Value | SSOT |
|-----------|-------|------|
| **Dynamic Target Range** | **8.2% ~ 11.8% APY** (non-guaranteed display band) | `App.tsx` · [`CROSS_CHAIN_RISK_AND_EVOLUTION.md`](../architecture/CROSS_CHAIN_RISK_AND_EVOLUTION.md) §6.5 |
| **Hurdle Gate friction buffer** | **+0.5%** (`FRICTION_BUFFER_APY = 0.005`) | `rebalance-rules.ts` |
| **Rebalance predicate** | Deploy only when excess yield exceeds friction buffer | `resolveCapitalAllocation()` · `passesDeltaNeutralHurdle()` |

> **Allocator note:** The 8.2–11.8% band is a **dynamic target range for HUD disclosure**, not a guaranteed return. Performance crystallization remains gated by the Hurdle Gate friction buffer and planned Aave + 1.5% performance hurdle (Invariant #24).

### 5.7 Three Lines of Defense & Allocator FAQ

| Line | Function | BDLW layer |
|------|----------|------------|
| **First** | Business operations | Yield hurdle · buffer engine (5–10%) · rebalance rules |
| **Second** | Risk & compliance | Fail-closed soil · PGATE · AML firewall · bridge accounting |
| **Third** | Independent assurance | Proposal Baseline: 175 test files | 773 PASS (Current Branch Live: 176 test files | 775 PASS Clean) · Survival Benchmark (§3) · chaos matrix · DDIP |

| Question | Answer | Verify |
|----------|--------|--------|
| Can bridge delay cause naked delta? | **No** — `IN_FLIGHT` capital cannot deploy | Bridge tests 5/5 |
| Can session keys withdraw user funds? | **No** — `ORDER_EXECUTE` scope only | `session-key-gates.ts` |
| Is SOC 2 / MiCA certified? | **Not claimed** — architectural alignment only | §5.3 · §5.4 |
| What is max vault size at launch? | **$100,000** V1.0 Alpha Cap | §4.1 · Tech Spec §3.6 |
| Where is live loss reported? | `GET /api/grant-audit` · `lostUsd: 0` under normal ops | Live endpoint |

---

## 6. Capital Accounting Invariants

BDLW enforces **honest accounting** as a hard invariant — pending liquidity is never mis-booked as principal loss.

### 6.1 Pending-Capital Recognition Invariant — `lostUsd ≡ 0`

| `capitalLabel` | Economic meaning | Deployable NAV | `lostUsd` |
|----------------|------------------|----------------|-----------|
| `AVAILABLE` | Pre-bridge Robinhood USDG | No | **0** |
| `IN_FLIGHT_BRIDGE_CAPITAL` | Across bridge in transit | **No — naked legs forbidden** | **0** |
| `SETTLED` | USDC available on Arbitrum One | Yes | **0** |
| `BRIDGE_TIMEOUT_FAIL_CLOSED` | >1h timeout — fail-closed severance | No | **0** |
| `AML_INBOUND_TO_ROBINHOOD_BLOCKED` | Reverse path blocked | No | **0** |

**SSOT:** `evaluateAcrossBridgeTransfer()` in [`src/adapters/across-ingress-bridge.ts`](../../src/adapters/across-ingress-bridge.ts)

```typescript
/** Always 0 — pending bridge liquidity is never booked as loss. */
lostUsd: number;
```

### 6.2 Dynamic Risk Budget (R11)

| Formula | Value @ $100k equity | SSOT |
|---------|---------------------|------|
| **Dynamic Max SL** | Dynamic Account Risk Ceiling (V0.8 Baseline: Equity-Weighted SL; V1.0 Mainnet: Dynamic Adaptive Engine) → **$1,100** | `effective-max-sl.ts` |
| **Daily loss cap (R17)** | Max SL × 3 → **$3,300** | `DAILY_LOSS_CAP_MULTIPLIER` |
| **Cross-venue slippage fuse** | **0.5%** (`MAX_SLIPPAGE`) | `soil-resistance-types.ts` |
| **Order-aware cap @ $100k notional** | min($1,100, $500) → **$500** soil budget | `computeOrderAwareMaxSlUsd()` |

Deprecated fixed **$50 SL** is **forbidden** by workspace protocol rules and enforced in R11 tests.

### 6.3 Non-Custodial Semantics

- User principal is held in **ZeroDev Kernel Smart Accounts** — not protocol treasury.
- GMX `uiFeeReceiver` (+10 bps native builder fee) and GMX referral rebate (up to **25%** of trading fees) accrue protocol yield — never conflated with user principal. Builder fee injection uses GMX v2 ExchangeRouter parameters only; no change to v1.0 pre-execution safety path.
- In-flight bridge capital is **labeled, not lent** — no rehypothecation claim in code paths.

### 6.4 Cross-Reference

Ingress capacity and execution timing are fully specified in **§4**. Basel / ES / MiCA mappings are in **§5**. Bridge accounting labels in §6.1 apply exclusively to the Robinhood escort path; Arbitrum-native capital never enters the `IN_FLIGHT_BRIDGE_CAPITAL` state machine.

---

## 7. Verification Checklist (Institutional Sign-Off)

| # | Check | Command / surface | Pass |
|---|-------|-------------------|------|
| 1 | Full regression | `pnpm test -- --run` | Proposal Baseline: 175 test files | 773 PASS (Current Branch Live: 176 test files | 775 PASS Clean) |
| 2 | Bridge accounting | `pnpm exec vitest run tests/adapters/across-ingress-bridge.test.ts` | 5/5 |
| 3 | ZeroDev gate | `pnpm exec vitest run tests/adapters/zerodev-aa-gate.test.ts` | 4/4 |
| 4 | Security matrix | `pnpm audit:security` | 5/0/0 |
| 5 | Live audit | `GET /api/grant-audit` | `lostUsd: 0` |
| 6 | Survival report | `pnpm tsx scripts/generate-survival-report.ts` | Artifact generated (§3.1) |
| 7 | Chaos matrix | `tests/scripts/chaos-blackswan-stress.test.ts` | 255/255 · `capitalLossUsd: 0` |
| 8 | Session R07 cap | `tests/services/session-key-gates.test.ts` | `SESSION_CAP>5000` severed |
| 9 | Negative proofs | `pnpm verify:negative` | Soil trips confirmed |
| 10 | Ingress path comparison | §4.1 table · `across-ingress-bridge.test.ts` | 5/5 · state machine verified |
| 11 | Regulatory mapping | §5.1–§5.4 · `pnpm test -- --run` | Basel/ES/MiCA tables · Proposal Baseline: 175 test files | 773 PASS (Current Branch Live: 176 test files | 775 PASS Clean) |

---

## Related Documents

| Document | Purpose |
|----------|---------|
| [`TECHNICAL_SPECIFICATION.md`](../architecture/TECHNICAL_SPECIFICATION.md) | Yellow Paper — R01–R20 · formal risk equations |
| [`CROSS_CHAIN_RISK_AND_EVOLUTION.md`](../architecture/CROSS_CHAIN_RISK_AND_EVOLUTION.md) | 60 invariants · stress harness · Basel mapping |
| [`PRINCIPAL_AUDIT_REPORT.md`](./PRINCIPAL_AUDIT_REPORT.md) | Four diagnostic interrogations |
| [`ROBINHOOD_CHAIN_SAFETY_GATE_AUDIT.md`](./ROBINHOOD_CHAIN_SAFETY_GATE_AUDIT.md) | Three Pillars · bridge gate |
| [`static-analysis-report.json`](./static-analysis-report.json) | 3-Tier security matrix artifact |
| [`chaos-blackswan-metrics.json`](./chaos-blackswan-metrics.json) | 255-scenario adversarial matrix |

---

**Prepared by:** SilverVine Labs Risk & Compliance Documentation
**Last updated:** 2026-08-27 · Branch baseline: `v1.0_push_BDLW` · **Risk & Disclaimer** section (Fail-Closed · non-custodial · residual risk disclosure)
