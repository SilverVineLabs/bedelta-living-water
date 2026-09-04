# SliverVine Citadel Shield: Pre-Consensus Intent Firewall & Execution Safety Primitive for AI Agents on Arbitrum

**SliverVine Protocol (BeDelta Living Water v1.0 / BeΔ)** · SilverVine Labs

[![Vitest](https://img.shields.io/badge/Vitest-775%2B%20PASS%20%28177%20files%29-brightgreen?logo=vitest)](./docs/VERIFICATION_MATRIX.md)
[![V2.0 Stylus Probe](https://img.shields.io/badge/V2.0_Stylus_Probe-5%2F5_PASS_(Roadmap)-blue?logo=rust)](./contracts/stylus-probe/)
[![risk-control.ts coverage](https://img.shields.io/badge/risk--control.ts-100%25%20coverage-success?logo=vitest)](./src/services/risk-control.ts)
[![Chaos Matrix](https://img.shields.io/badge/Chaos%20Matrix-255%2F255%20Fail--Closed-blue?logo=github)](./docs/VERIFICATION_MATRIX.md)
[![Benchmark Latency](https://img.shields.io/badge/Benchmark-p50_106%CE%BCs_E2E_Shield_(Kernel_200ns)-blueviolet?logo=speedtest)](./docs/architecture/TECHNICAL_SPECIFICATION.md#31-microsecond-moats)
[![TypeScript](https://img.shields.io/badge/TypeScript-0%20errors-blue?logo=typescript)](./tsconfig.json)
[![License](https://img.shields.io/badge/License-BUSL--1.1-orange)](./LICENSE)
[![Foundry Citadel Gate](https://img.shields.io/badge/Foundry-Forge_Test_Passed-brightgreen?logo=solidity)](./SliverVineGate)
[![Arbitrum One Gate](https://img.shields.io/badge/Arbitrum_One_Gate-Live_42161-28A0F0?logo=arbitrum)](https://arbiscan.io/address/0xb174118bc0b84e8d6d59eef2339e29bf7fcf8bf1)


<p align="center"><img src="public/brand/Detox_Sanctuary_wm.webp" alt="SliverVine Citadel Gate - Detox Sanctuary" width="600" style="border-radius: 8px;"></p>

> **⚡ Pre-Consensus Intent Firewall:** Sub-ms intent clearing at **p50 ~106 μs** — toxic payloads are severed **before** Arbitrum Sequencer queues, Bundler ingress, or MEV mempools (0-Gas fail-closed).
>
> *Sub-ms End-to-End Shield Path (Pure-Math Kernel: 200 ns / 0.0002 ms) · < 1.0ms SLO Session Key verification · Primary venue: **Arbitrum One** GMX v2 ETH/USDC GM + Hyperliquid 1× short (`checkSoilResistance()`).*

**Philosophy:** **BeDelta (BeΔ)** = Market Delta-Neutrality & Execution Safety · **SliverVine** = fragmented intent protection & steel trading execution.

**Protocol:** SliverVine · **Entity:** SilverVine Labs · **Contact:** `grants@silvervinelabs.com` · **B2B:** `hello@silvervinelabs.com`  
**Repo:** [SilverVineLabs/bedelta-living-water](https://github.com/SilverVineLabs/bedelta-living-water)  

> **On-chain vs off-chain SSOT:** The **live Arbitrum One gateway** (`0xb174118bC0B84e8D6D59EEF2339e29bF7FCf8BF1`, chainId **42161**) is the immutable **Solidity EIP-712 `SliverVineGate`** — [Mainnet Ignition Tx](https://arbiscan.io/tx/0x54c153e9a41f704b5eb0ae554eac593d1110d62bd826ff094e72f2bd60c1b0c6). **Arbitrum Stylus** ([`contracts/stylus-probe/`](./contracts/stylus-probe/)) is part of the **V2.0 Rust/Wasm off-chain Edge roadmap** (local probe only; **not** deployed on mainnet). Production hot-path soil fuse runs on Cloudflare Edge via `pkg/soil_core.wasm` (`checkSoilResistance()` p50 ~106µs).
**Live Dune Telemetry Portal:** [`https://bedeltawater.slivervine.xyz`](https://bedeltawater.slivervine.xyz) (Redirects to official Dune Dashboard) · **Headless Audit Endpoint:** [`https://bedeltawater.slivervine.xyz/api/grant-audit`](https://bedeltawater.slivervine.xyz/api/grant-audit) · **Arbitrum One Gate** `0xb174118bC0B84e8D6D59EEF2339e29bF7FCf8BF1` · Mainnet Ignition Tx [`0x54c153e9a41f704b5eb0ae554eac593d1110d62bd826ff094e72f2bd60c1b0c6`](https://arbiscan.io/tx/0x54c153e9a41f704b5eb0ae554eac593d1110d62bd826ff094e72f2bd60c1b0c6) · Sepolia Gate `0xb174118bC0B84e8D6D59EEF2339e29bF7FCf8BF1`  

> **Headless Infrastructure Protocol:** Core interaction is API/SDK Native (`@slivervine/citadel-sdk`) & CLI HUD.  
**Package:** [`@slivervine/citadel-sdk`](./src/sdk/README.md) (Apache-2.0) · **Judge entry:** [`JUDGE_BRIEF.md`](./JUDGE_BRIEF.md) · [Verification Matrix](./docs/VERIFICATION_MATRIX.md) · [Technical Specification](./docs/architecture/TECHNICAL_SPECIFICATION.md)

**Core product:** **SliverVine Citadel Shield** is a **Pre-Consensus Intent Firewall & Execution Safety Primitive** for AI Agents on Arbitrum — not a standalone Wasm risk check. Off-chain Edge reflex (`checkSoilResistance()`) + on-chain **EIP-712 consume-once `SliverVineGate`** form a protocol-grade execution safety layer — [§1 Product Identity](./docs/architecture/TECHNICAL_SPECIFICATION.md#1-core-product-identity) · [Three Pillars pipeline](./docs/architecture/TECHNICAL_SPECIFICATION.md#0-unified-institutional-pre-execution-pipeline).

**Primary venue:** Arbitrum One (`42161`) · Gate `0xb174118bC0B84e8D6D59EEF2339e29bF7FCf8BF1` · Mainnet Ignition Tx [`0x54c153e9a41f704b5eb0ae554eac593d1110d62bd826ff094e72f2bd60c1b0c6`](https://arbiscan.io/tx/0x54c153e9a41f704b5eb0ae554eac593d1110d62bd826ff094e72f2bd60c1b0c6) · **Hedge:** Hyperliquid · **Moat:** Pillar 3 Wasm Shield `checkSoilResistance()` p50 ~106 μs — [§3 Defense Matrix](./docs/architecture/TECHNICAL_SPECIFICATION.md#3-cross-venue-risk-engine--defense-matrix-r01r20).

> **Note:** Initial mainnet deployment utilizes Bootstrap Ignition Keys (`0x1111…`/`0x2222…`) for public verification without exposing production HSM keys. Key rotation to production multisig is executed via native governance functions.

**Ingress (optional):** Robinhood Chain `46630`/`4663` → Arbitrum — **Pillar 2 Reference Escort Adapter** only; [Pillar 2 audit](./docs/audit/PILLAR_2_COMPLIANCE_INGRESS_FIREWALL_AUDIT.md).

**Triangle loop:** [Technical Specification §2](./docs/architecture/TECHNICAL_SPECIFICATION.md#2-triangle-liquidity-loop--segregated-tranches) · **Arbitrum execution premium:** +15–30 bps vs bridged routes *(design estimate)*.

> **SSOT lock (Buildathon):** v1.0 Delivered (Sepolia + Arbitrum One verified) · Vitest **Proposal Baseline: 175 test files | 773 PASS (Current Branch Live: 178 test files | 782 PASS Clean)** · deep fuzz **327,675** via `pnpm audit:nightly` · Tier-0 Docker [`Dockerfile`](./Dockerfile) · docs hub [`docs/README.md`](./docs/README.md) · **Judge quick brief:** [`JUDGE_BRIEF.md`](./JUDGE_BRIEF.md)

---

## ⚡ 30-Second Express Audit (Fastest Judge Verification)

### Path 1: Instant Monorepo Verification (Recommended — 3 Seconds)

```bash
pnpm install
pnpm run demo:e2e    # 5-Step E2E Cyberpunk ANSI HUD Demo
pnpm test            # 173 test files | 765 PASS Clean
```

Optional benchmark: `npx tsx scripts/grant-advanced-resilience-benchmark.ts`

### Path 2: Isolated Docker Verification

```bash
docker build -t slivervine-citadel . && docker run --rm slivervine-citadel
```

Zero-dependency container execution — no host Node/pnpm install. Runs the isolated 5-step `demo:e2e` dry-run and Tier-1 ANSI HUD demo. Full regression: `docker run --rm slivervine-citadel pnpm test` (**173 test files | 765 PASS Clean**). Sidecar express audit → [`docker/README.md`](./docker/README.md).

**Representative `demo:e2e` terminal highlights** (GitHub `diff` syntax — green `+` PASS, red `-` alerts, yellow `!` fee injection):

```diff
+  ┌─ SliverVine Citadel Shield ─────────────────────────────────────┐
+  │  BeΔ Living Water v1.0 · 5-Step Grant E2E Demo                  │
+  │  Sepolia Gate · p50 ~106µs · Δnet ≡ 0 · lostUsd ≡ 0            │
+  └────────────────────────────────────────────────────────────────┘
+ ── Step 1: Citadel Pre-Execution Check ──
+ Intent: allowedToSign=true soilOk=true · elapsed=106µs
+ Invariant: Δnet ≡ 0 (GMX_GM + HL_Short delta-neutral envelope)
+ ── Step 2: Robinhood Chain Escort ──
+ Outbound 46630→42161: ok=true lostUsd=0
+ RESULT: Escort PASS — lostUsd ≡ 0
- Inbound AML block: label=AML_INBOUND_TO_ROBINHOOD_BLOCKED
! Payload: uiFeeReceiver (+10 bps) injected
- ALERT: SOIL_TRIPPED — CROSS_VENUE_SLIPPAGE · DEPTH fuse
- [CRITICAL] PHYSICAL_DEADLOCK_TRIGGERED: EIP-712 Signature Pipe Severed
+ Flash unwind: PASS · RESULT: E2E OK (5/5)
```

Canonical interactive demo commands for judges:

1. **Path 1 (recommended):** `pnpm install && pnpm run demo:e2e` — fastest 5-step Citadel ANSI HUD demo.
2. `pnpm test -- --run` verifies **173 test files | 765 PASS Clean**.
3. **Path 2:** `docker build -t slivervine-citadel . && docker run --rm slivervine-citadel` — isolated E2E, no host toolchain drift.
4. `grant-advanced-resilience-benchmark.ts` shows the sub-ms Wasm Shield latency path.

For the deeper CLI / API audit matrix, see the `Auditor — 30-Second CLI & API Verification` section below.

---

## 🎯 Core Scope & Value Proposition

| Horizon | Focus |
|---------|--------|
| **v1.0 Delivered (Sepolia verified)** | **Arbitrum One** GMX v2 **ETH/USDC GM Pool** (primary) + Hyperliquid **1× short** — eliminates oracle de-peg / FX slippage on the core yield leg. Mainnet deployment ties to **M6 Grant distribution**. |
| **Zero Protocol-Level Lock-Up** | Zero protocol-level lock-up (100% non-custodial); redemption speed is subject only to GMX v2's native 3–5 min async Keeper settlement. Optional ingress AML firewall (e.g. Robinhood **`4663` inbound block**). |
| **V1.5 Roadmap Spec** | ⏳ Planned | **Sub-ms Agentic Security & Swarms** — [ERC-8196](https://eips.ethereum.org/EIPS/eip-8196) fleet enforcement · EIP-7702 EOA → Agent Smart Account · Prompt Injection Defense Circuit (`severSigningChannel()` sub-100µs) · BTC/USDC isomorphic GM (config-only) |
| **V2.0 Design Spec** | ⏳ Planned | **Institutional CaaS & Orbit Shield** — productize `@slivervine/citadel-sdk` for AI DEXs / Orbit L3s · **10 bps protocol authorization fee** on pre-execution risk checks |

**Standards & Infrastructure:** [EIP-712](https://eips.ethereum.org/EIPS/eip-712) · [ERC-4337](https://eips.ethereum.org/EIPS/eip-4337) / [ERC-7579](https://eips.ethereum.org/EIPS/eip-7579) · [ERC-8196](https://eips.ethereum.org/EIPS/eip-8196) Draft (Virtuals Protocol) · [§4 ERC/EIP Wiki](./docs/architecture/TECHNICAL_SPECIFICATION.md#4-standard-compliance--erceip-wiki).

### 📐 Core Risk Invariants (Judge Quick Reference)

$$
\Delta_{\text{net}} = \Delta_{\text{GMX\_GM}} + \Delta_{\text{HL\_Short}} \equiv 0
$$

$$
\text{lostUsd} \equiv 0 \quad \forall \, \text{InFlightBridgeCapital}
$$

$$
t_{\text{reflector\_p50}} \sim 106\,\mu\text{s} \ll t_{\text{mempool\_broadcast}}
$$

Derivations & R01–R20 bounds: [Technical Specification §3.1](./docs/architecture/TECHNICAL_SPECIFICATION.md#31-microsecond-moats) · [Verification Matrix](./docs/VERIFICATION_MATRIX.md) · [`JUDGE_BRIEF.md`](./JUDGE_BRIEF.md).

## 🛣️ Post-Buildathon B2B Commercialization & PMF Roadmap (Post-9/14)

SliverVine Protocol enforces a strict two-stage strategy balancing Zero-Friction Hackathon Verification with Long-Term Commercial Sustainability:

- **Stage 1: Buildathon Verification Phase (Active Now — Pre-9/14)**
  - **100% Free Public Telemetry**: Open-access Dune Live Telemetry Dashboard ([https://dune.com/silvervinelabs/silvervine-citadel-telemetry](https://dune.com/silvervinelabs/silvervine-citadel-telemetry)) for zero-friction judge and developer auditing.
  - **Arbitrum One Mainnet Ignition Gate**: Non-custodial `SliverVineGate` on ChainID `42161` at `0xb174118bC0B84e8D6D59EEF2339e29bF7FCf8BF1` — Mainnet Ignition Tx [`0x54c153e9a41f704b5eb0ae554eac593d1110d62bd826ff094e72f2bd60c1b0c6`](https://arbiscan.io/tx/0x54c153e9a41f704b5eb0ae554eac593d1110d62bd826ff094e72f2bd60c1b0c6) *(Bootstrap Ignition Keys `0x1111…`/`0x2222…`; production multisig rotation via native governance)*.
  - **Sepolia Safety Gate**: Full EIP-712 session key validation and 0-Gas Fail-Closed protection verified on Arbitrum Sepolia (`0xb174118bC0B84e8D6D59EEF2339e29bF7FCf8BF1`).
  - **Reference Interceptor Harness**: [`examples/agent-interceptor-demo.ts`](./examples/agent-interceptor-demo.ts) — Reference Interceptor Harness & Adapter for Virtuals Protocol and ElizaOS agent swarms (evaluator-reproducible; not a production partnership attestation).
  - **Zero-Touch SDK**: [`withCitadelShield`](./src/sdk/decorator.ts) — one-line decorator wrapping agent execution hooks with inline `checkSoilResistance()` pre-broadcast severance (`import { withCitadelShield } from '@slivervine/citadel-sdk'`).

- **Stage 2: B2B Monetization & Risk API Launch (Post-9/14)**
  - **SliverVine Citadel Risk API & Bad Debt Calculator (powered by on-chain telemetry & Dune Analytics visualization)**: Monetize SliverVine's proprietary sub-ms risk calculation algorithms and shadow margin telemetry via a B2B API — **not** Dune platform data resale. [Dune](https://dune.com/silvervinelabs/silvervine-citadel-telemetry) remains the **free public visualization dashboard**; paid tiers ($199/mo Pro to $1,999/mo Enterprise) gate programmatic access to Citadel-computed liquidation risk, margin health, and bad-debt savings metrics for vault managers and AI Agent swarms (Wayfinder, Virtuals, M2M Treasury Funds).
  - **V2.0 CaaS rail (Design Spec):** `@slivervine/citadel-sdk` + **10 bps protocol authorization fee** on pre-execution risk checks. Live v1.0 builder lane remains GMX **+10 bps `uiFeeReceiver`**.

---

## ⚔️ Competitive Matrix — Pre-Execution vs. Post-Execution Risk

| Feature / Dimension | Legacy Providers (Gauntlet / Chaos Labs) | SliverVine Citadel Gate (Pillar 3) |
| :--- | :--- | :--- |
| **Execution Phase** | Post-execution dashboards & multi-day governance parameter updates | **Pre-execution inline interception** (Sub-ms BEFORE mempool broadcast) |
| **Latency / Hot-Path** | Minutes to Days (Off-chain simulations + DAO votes) | **p50 ~106 µs** Shield/TS Gateway path · Wasm warm **&lt;60 µs** (Rust `#![no_std]` on Edge) |
| **Protection Level** | Global protocol parameter tuning (LTV, Collateral factors) | **Granular tx-level & LP soil protection** (MEV, RPC jitter, Oracle lag) |
| **Deployment Model** | Advisory / SaaS Analytics | **Inline Edge Gate & Open-Source Wasm SDK** (`@slivervine/citadel-sdk`) |

## 🔬 Santenmoku Engine (Internal Codename) — BeDelta v1.0 Battle-Tested Matrix

SliverVine Protocol is engineered under strict mathematical invariants and zero-trust pre-execution assertions.

### 1. On-Chain Enforcement Layer (Solidity v0.8.28)
* **Unit Tests**: 🟢 **60 Passed | 0 Failed**
* **Line Coverage**: 📊 **95.51% Overall** (`SliverVineGate.sol`: **95.65%**)
* **Property Fuzzing**: 🌀 **327,675 Property Fuzz Executions** (`pnpm audit:nightly` / `FOUNDRY_PROFILE=deep`; standard `forge test` = **5,120** = 5×1,024) (All Green)
* **Invariant Testing**: ⛓️ **3 Invariants × 16,384 Depth = 49,152 Stateful Calls** (0 Counterexamples)
* **Gas Deadlock**: ⛽ `verifyAndConsume`: **25,853 min / 28,043 median gas**
* **Runtime Bytecode**: 📦 **8,716 Bytes (8.71 KiB)** — Zero External Dependencies (`Assembly-optimized`)

### 2. Off-Chain Pre-Execution Radar (TypeScript / V8 Runtime)
* **Vitest SSOT**: 🧪 **Proposal Baseline: 175 test files | 773 PASS (Current Branch Live: 178 test files | 782 PASS Clean)** on `pnpm test -- --run`
* **Chaos Matrix**: 🌪️ **255 Severe Failure Cases | 0 Crashes**
* **Edge Decision Latency**: ⏱️ **SLO &lt; 1.0ms | p50 ~106 μs Shield/TS Gateway | Wasm warm &lt;60 μs | Pure Math: 0.0002 ms (200 ns)**
* **Worker Bundle**: 📦 **87.76 KiB gzip** measured hot path (`pnpm bundle:measure`) · **162.49 KiB gzip** full Edge deployment artifact

---

## 🗺️ Protocol Development Milestones (M0 – M6)

| Milestone | Status | Deliverables & Verification |
|-----------|--------|-----------------------------|
| **M0: Operational Foundation** | ✅ Delivered | WSL / PNPM Monorepo, Cloudflare Edge Worker pipeline, and CI/CD strict typecheck. |
| **M1: On-Chain Citadel Gate** | ✅ Delivered | `SliverVineGate.sol` core invariant locks · **327,675 deep fuzz** (`FOUNDRY_PROFILE=deep`) · 25k gas bounds. |
| **M2: Pre-Execution Radar** | ✅ Delivered | `checkSoilResistance()` engine, **Proposal Baseline: 175 test files | 773 PASS (Current Branch Live: 178 test files | 782 PASS Clean)**, 162.49 KiB gzip bundle, sub-ms latency. |
| **M3: Dual-Chain & ZeroDev AA** | ✅ Dry-Run Harness Verified (Kernel v3 / EntryPoint v0.7) | ZeroDev Kernel v3 AA Adapter · optional Robinhood Chain / Across (`46630`/`4663`) **Pillar 2 Reference Escort Adapters** into Arbitrum. |
| **M4: WASM Engine & IP Moat** | ✅ Delivered | Rust `#![no_std]` Wasm core (`pkg/soil_core.wasm`) — Cloudflare budget `<28kb`, hot-path exec `<60µs` — & `@slivervine/citadel-sdk` shipped. |
| **M5: TCA Data & Hyperliquid** | ✅ Delivered (evolving) | TCA / grant-audit surfaces & HL Testnet 5-trade provenance — **Live TCA Analytics HUD actively evolving**. |
| **M6: Institutional Grant Submission** | ✅ Mainnet Ignition Delivered · ⏳ Final Demo Video | Arbitrum One Gate `0xb174118b…` · [Ignition Tx `0x54c153…`](https://arbiscan.io/tx/0x54c153e9a41f704b5eb0ae554eac593d1110d62bd826ff094e72f2bd60c1b0c6) · GMX / Arbitrum grant application package. |

---

## 🛡️ Auditor — 30-Second CLI & API Verification

```bash
# 1. Full Vitest suite (Proposal Baseline: 175 test files | 773 PASS (Current Branch Live: 178 test files | 782 PASS Clean))
pnpm test -- --run

# 2. 3-Tier Security Matrix (Fast / Security / Nightly)
pnpm run audit:fast # fast tier → docs/audit/security-scorecard.json (tsc + security slice + Solhint + Gitleaks)
pnpm run audit:security # security tier 5/0/0 → docs/audit/static-analysis-report.json (Vitest + Forge + Slither + Aderyn + pnpm-audit)
pnpm audit:nightly # Echidna Property Fuzz + Deep Fuzz (exploratory)

# Formal verification — native Foundry invariant tests (SliverVineGate.t.sol & SliverVineGate.invariant.t.sol)
cd SliverVineGate && forge test && cd ..

# 3. Contract unit tests, fuzzing, & gas benchmark
cd SliverVineGate && forge test --gas-report && cd .. # default fuzz: 5,120 (5×1,024)
pnpm audit:nightly # deep fuzz: 327,675 (5×65,535)

# 4. Run Off-chain Resilience & Latency Benchmark
npx tsx scripts/grant-advanced-resilience-benchmark.ts

# 5. HL Testnet 5-trade provenance (grant-audit /api/grant-audit payload)
pnpm exec vitest run tests/services/hl-5-trade-provenance.test.ts

# 6. Robinhood Chain (46630) → Arbitrum unidirectional Across bridge edge cases
pnpm exec vitest run tests/adapters/across-ingress-bridge.test.ts

# 7. Dune Telemetry (Sepolia Live Verification & Production SQL Spec)
# npx tsx scripts/emit-sepolia-telemetry-events.ts
# https://dune.com/silvervinelabs/silvervine-citadel-telemetry
```

---

## 🏛️ Tri-Sensor Telemetry Matrix

The Citadel pre-execution gateway runs a closed-loop **Tri-Sensor Telemetry Matrix** before any GMX broadcast:

| Sensor Channel | Observability Domain | Control Action |
|----------------|---------------------|----------------|
| **BaseFee Velocity Sensor** | ArbOS EIP-1559 base-fee acceleration proxy | Throttle dispatch when fee velocity exceeds dynamic tolerance band |
| **RPC Jitter Radar** | Multi-provider RTT dispersion & head-staleness | Fail-closed when jitter radar flags endpoint phase desync |
| **Phase-Shift Instability Detector** | Cross-venue oracle / book phase alignment | Invoke instant circuit breaker on cross-sensor phase-shift anomaly |

---

## 🚀 Unified Institutional Pre-Execution Pipeline

**Center of gravity = Arbitrum One.** SliverVine Protocol is a Sub-ms 0-Gas Pre-Broadcast Safety Citadel & Risk Navigator for AI Agents on Arbitrum. Primary venue: Arbitrum One GMX v2 **ETH/USDC** GM + Hyperliquid **1× short**, with Pillar 3 Wasm Shield as the technical moat. Robinhood / Across are **Pillar 2 Reference Escort Adapters** only.

```text
[ Optional Permissioned Ingress (e.g. Robinhood Chain 46630 / 4663) ]
 │
 ▼
 ┌─────────────────────────────────────────────────────────┐
 │ Pillar 1: GATEHOUSE (Account Abstraction) │
 │ ZeroDev Kernel v3 · 30s TTL Heartbeat / Intent Window │
 │ Paymaster gas-free onboarding (conditional sponsorship) │
 └──────────────────────┬──────────────────────────────────┘
 │
 ▼
 ┌─────────────────────────────────────────────────────────┐
 │ Pillar 2: COMPLIANCE INGRESS FIREWALL (Escort Acct.) │
 │ Unidirectional AML firewall · IN_FLIGHT_BRIDGE_CAPITAL │
 │ Pending-Capital Recognition (lostUsd ≡ 0) · ref adapter │
 └──────────────────────┬──────────────────────────────────┘
 │
 ▼
 ┌─────────────────────────────────────────────────────────┐
 │ Pillar 3: SHIELD (Pre-Execution Risk Engine) │
 │ p50 ~106 µs Shield/TS Gateway · Wasm warm &lt;60 µs │
 │ R01–R20 Defense Matrix (17|2|1) · signingChannelOpen: false │
 └──────────────────────┬──────────────────────────────────┘
 │
 ▼
[ PRIMARY: Arbitrum One GMX v2 ETH/USDC GM + Hyperliquid 1× Short ]
```

**[Pillar 1: Gatehouse — Account Abstraction]** ZeroDev Kernel v3 scoped session keys · **30s TTL Heartbeat / Intent Execution Window** (`WS_HEARTBEAT_INTERVAL_MS` · `DEFAULT_TTL_MS`) — distinct from underlying cryptographic session key lifetime (bounded up to **24h / 7d** per module scope) · **Paymaster gas-free onboarding** (daily sponsorship caps; fail-closed fallback when exhausted). *Evaluated in E2E Demo via secure dry-run session scopes (`sessionOk`, `allowedToSign`); full ZeroDev Kernel v3 test coverage is verified via `pnpm test:zerodev`.*

**[Pillar 2: Compliance Ingress Firewall — Escort Accounting]** Venue-agnostic unidirectional AML firewall · honest **`IN_FLIGHT_BRIDGE_CAPITAL`** labels · **Pending-Capital Recognition Invariant (`lostUsd ≡ 0`)** — protocol never prematurely writes off in-flight bridge capital as loss during active execution · *(Robinhood Chain / Across are **Pillar 2 Reference Escort Adapters** — they serve as integration examples and are not the core product identity of SliverVine Protocol.)* **Audit:** [`docs/audit/PILLAR_2_COMPLIANCE_INGRESS_FIREWALL_AUDIT.md`](./docs/audit/PILLAR_2_COMPLIANCE_INGRESS_FIREWALL_AUDIT.md).

**[Pillar 3: Shield — Pre-Execution Risk Engine]** **`pkg/soil_core.wasm`** · `checkSoilResistance()` at **p50 ~106 µs** (Shield/TS Gateway path) · Wasm warm **&lt;60 µs** · **R01–R20 Defense Matrix (17 Active | 2 Refactored | 1 Deprecated)** · **`signingChannelOpen: false`** on any soil / oracle / sequencer trip — primary technical moat before Arbitrum / HL broadcast.

**Architecture standards:** **EIP-712** Gate attestation · **ERC-4337/7579** ZeroDev Kernel v3 · **EIP-1559** ArbOS Tri-Sensor · **ArbOS 61** · optional Robinhood ingress · **Wasm** `soil_core` — see [§4 Standard Compliance Wiki](./docs/architecture/TECHNICAL_SPECIFICATION.md#4-standard-compliance--erceip-wiki).

---

## 📚 Documentation

**Grant reviewers & institutional auditors:** start at [`docs/README.md`](./docs/README.md) → [`docs/VERIFICATION_MATRIX.md`](./docs/VERIFICATION_MATRIX.md).

### Top 5 Core Grant Documents

| # | Document | Role |
|---|----------|------|
| 1 | [`docs/VERIFICATION_MATRIX.md`](./docs/VERIFICATION_MATRIX.md) | CLI Tier 0–5 verification entry |
| 2 | [`docs/architecture/TECHNICAL_SPECIFICATION.md`](./docs/architecture/TECHNICAL_SPECIFICATION.md) | Yellow Paper · R01–R20 risk matrix |
| 3 | [`docs/audit/INSTITUTIONAL_DUE_DILIGENCE_MEMORANDUM.md`](./docs/audit/INSTITUTIONAL_DUE_DILIGENCE_MEMORANDUM.md) | Institutional DDIP · Basel III alignment |
| 4 | [`docs/audit/PILLAR_1_GATEHOUSE_ZERODEV_AA_ANALYSIS.md`](./docs/audit/PILLAR_1_GATEHOUSE_ZERODEV_AA_ANALYSIS.md) | ZeroDev AA vs. pre-execution Wasm substrate |
| 5 | [`docs/sdk/CITADEL_SDK_BLUEPRINT.md`](./docs/sdk/CITADEL_SDK_BLUEPRINT.md) | B2B CaaS integration blueprint · 10 bps builder + referral rebate model |

### Supporting

| Document | Purpose |
|----------|---------|
| [`docs/pitch/GRANT_PITCH_AND_VIDEO_STORYBOARD.md`](./docs/pitch/GRANT_PITCH_AND_VIDEO_STORYBOARD.md) | Grant pitch · 35s demo video storyboard |
| [`docs/VERIFICATION_MATRIX.md`](./docs/VERIFICATION_MATRIX.md) | 178 test files · 782 PASS · regression bar SSOT |
| [`docs/audit/PILLAR_2_COMPLIANCE_INGRESS_FIREWALL_AUDIT.md`](./docs/audit/PILLAR_2_COMPLIANCE_INGRESS_FIREWALL_AUDIT.md) | Pillar 2 reference adapter audit · 5/5 bridge tests |
| [`docs/grants/SUBMISSION.md`](./docs/grants/SUBMISSION.md) | Buildathon main submission pack |
| [`docs/README.md`](./docs/README.md) | Full docs index · language policy |

---

## 📜 License

**Protocol / Worker (repo root):** **BUSL-1.1** — Copyright (c) 2026 SilverVine Labs. Change Date `2028-08-21` → Apache-2.0 (also converts earlier at M2 / $10M TVL per program terms). See [LICENSE](./LICENSE).

**Developer integration harness:** [`@slivervine/citadel-sdk`](./src/sdk/) under `src/sdk/` is licensed **Apache-2.0** (Copyright (c) 2026 SilverVine Labs) for third-party integration. See [`src/sdk/LICENSE`](./src/sdk/LICENSE), [`src/sdk/README.md`](./src/sdk/README.md), and [`docs/sdk/CITADEL_SDK_BLUEPRINT.md`](./docs/sdk/CITADEL_SDK_BLUEPRINT.md). EIP-712 domain: `SliverVineCitadel`. Docs index: [`docs/README.md`](./docs/README.md).
