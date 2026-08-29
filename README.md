# 🛡️ BeΔLivingWater SliverVine Protocol — GMX v2 / Arbitrum Citadel Pre-Execution Gateway

[![Vitest](https://img.shields.io/badge/Vitest-768%20PASS%20%28174%20files%29-brightgreen?logo=vitest)](https://github.com/SilverVineLabs/bedelta-living-water)
[![Stylus Coprocessor](https://img.shields.io/badge/Stylus-5%2F5%20PASS-blue?logo=rust)](./contracts/stylus-probe/)
[![risk-control.ts coverage](https://img.shields.io/badge/risk--control.ts-100%25%20coverage-success?logo=vitest)](https://github.com/SilverVineLabs/bedelta-living-water/blob/main/src/services/risk-control.ts)
[![Chaos Matrix](https://img.shields.io/badge/Chaos%20Matrix-255%2F255%20Fail--Closed-blue?logo=github)](https://github.com/SilverVineLabs/bedelta-living-water)
[![Benchmark Latency](https://img.shields.io/badge/Benchmark-p50_106%CE%BCs_E2E_Shield_(Kernel_200ns)-blueviolet?logo=speedtest)](https://github.com/SilverVineLabs/bedelta-living-water)
[![TypeScript](https://img.shields.io/badge/TypeScript-0%20errors-blue?logo=typescript)](https://github.com/SilverVineLabs/bedelta-living-water)
[![License](https://img.shields.io/badge/License-BUSL--1.1-orange)](./LICENSE)
[![Foundry Citadel Gate](https://img.shields.io/badge/Foundry-Forge_Test_Passed-brightgreen?logo=solidity)](./SliverVineGate)


<p align="center"><img src="public/brand/Detox_Sanctuary_wm.webp" alt="SliverVine Citadel Gate - Detox Sanctuary" width="600" style="border-radius: 8px;"></p>

> **⚡ Interceptor Moat:** Deciding transaction execution safety at **p50 ~106 μs** BEFORE MEV bots or Sequencer mempools ever see it.
>
> *Sub-ms End-to-End Shield Path (Pure-Math Kernel: 200 ns / 0.0002 ms) · < 1.0ms SLO Session Key verification · Primary venue: **Arbitrum One** GMX v2 ETH/USDC GM + Hyperliquid 1× short (`checkSoilResistance()`).*

**Protocol:** SliverVine · **Entity:** SilverVine Labs · **Contact:** `grants@silvervinelabs.com` · **B2B:** `hello@silvervinelabs.com`  
**Official Site:** [silvervinelabs.com](https://silvervinelabs.com) — Defense Matrix portal & landing page  
**Repo:** [SilverVineLabs/bedelta-living-water](https://github.com/SilverVineLabs/bedelta-living-water) · **Live DApp:** [bedeltawater.slivervine.xyz](https://bedeltawater.slivervine.xyz)  
**Package:** [`@slivervine/citadel-sdk`](./src/sdk/README.md) (**Apache-2.0** · EIP-712 domain `SliverVineCitadel`) · **Architect:** qum0x (20+ Year Enterprise Web & Systems Architect) — All claims verifiable via CLI (`pnpm test`) and live JSON telemetry (`/api/grant-audit`).

**Core Product (center of gravity):** **Sub-ms Pre-Execution Risk Gateway** protecting a **Delta-Neutral GM Yield Engine on Arbitrum One** — GMX v2 **ETH/USDC** GM pool + Hyperliquid **1× short hedge**. **CaaS monetization:** **10 bps GMX Builder Fee** + **25% GMX Referral Rebate** — venue-native ExchangeRouter parameters; zero additional overhead on v0.9 execution safety. **Architecture:** **106µs Physical Cerebellum** for **ERC-7579 AI Agents** — Wasm/Stylus pre-execution hook before LLM-planned orders reach mempool.

**Primary Venue:** Arbitrum One (`42161`) · **Hedge Venue:** Hyperliquid · **Technical Moat:** Interceptor Moat — Pillar 3 Sub-ms Wasm Armor (`checkSoilResistance()`, p50 ~106 μs) before any broadcast.

> *While single components like `checkSoilResistance()` formulas are kept standard and open for seamless `@slivervine/citadel-sdk` adoption across Arbitrum, our core moat lies in the production integration complexity—stitching Rust `#![no_std]` Wasm, Edge Worker execution, and EIP-712 Gate into a sub-ms, fail-closed system.*

**Supported ingress example:** Robinhood Chain may act as a **permissioned institutional ingress source** (`46630`/`4663` → Arbitrum); it is **not** the product identity.

**Triangle Liquidity Loop:** `Arbitrum One (GMX GM Yield Base — PRIMARY)` ↔ `Hyperliquid (1× Short Hedge)` ← optional permissioned ingress (e.g. Robinhood Chain) — see [`docs/architecture/TECHNICAL_SPECIFICATION.md`](./docs/architecture/TECHNICAL_SPECIFICATION.md).

**Arbitrum Native Execution Premium:** Direct Arbitrum One LPs earn an estimated **+15 ~ 30 bps** vs bridged / multi-hop routes *(design estimate — not a locked test assertion)*.

> **SSOT Realignment (2026-08-25):** v0.9 = Sepolia + dry-run verified · mainnet → M6 · deep fuzz 327,675 requires `audit:nightly` / `FOUNDRY_PROFILE=deep` · **Tier-0 Docker** = root [`Dockerfile`](./Dockerfile) · see [`docs/README.md`](./docs/README.md).  
> **Locked Minimum Proposal Baseline:** **168 files | 742 PASS (100% Clean)** — official Grant proposal bar. **Current Branch Live Expected Output:** **174 files | 768 PASS (100% Clean · Exit Code 0)** on `pnpm test -- --run`.

---

## ⚡ 30-Second Quick Verification

**Tier 0 — Docker (zero host Node/pnpm dependencies):**

```bash
docker build -t slivervine-citadel . && docker run --rm slivervine-citadel
```

Isolated container execution of 5-step `demo:e2e` dry-run; full regression **174 files | 768 PASS (100% Clean · Exit Code 0)** → `docker run --rm slivervine-citadel pnpm test`. Sidecar → [`docker/README.md`](./docker/README.md).

**Tier 1+ — Monorepo CLI:**

```bash
pnpm install
pnpm run demo:e2e
pnpm test
npx tsx scripts/grant-advanced-resilience-benchmark.ts
```

Canonical interactive demo command for judges:

1. **Tier 0:** `docker build -t slivervine-citadel . && docker run --rm slivervine-citadel` — isolated E2E, no host toolchain drift.
2. Run `pnpm run demo:e2e` as the single interactive Citadel demo entry point.
3. `pnpm test -- --run` verifies **Current Branch Live Expected Output:** **174 files | 768 PASS (100% Clean · Exit Code 0)** *(Locked Minimum Proposal Baseline: 168 files | 742 PASS)*.
4. `grant-advanced-resilience-benchmark.ts` shows the sub-ms Wasm Shield latency path.

For the deeper CLI / API audit matrix, see the `Auditor — 30-Second CLI & API Verification` section below.

---

## 🎯 Core Scope & Value Proposition

| Horizon | Focus |
|---------|--------|
| **v0.9 Production-Ready (Arbitrum Sepolia Testnet & Dry-Run Verified)** | **Arbitrum One** GMX v2 **ETH/USDC GM Pool** (primary) + Hyperliquid **1× short** — eliminates oracle de-peg / FX slippage on the core yield leg. Mainnet deployment ties to **M6 Grant distribution**. |
| **Zero Protocol-Level Lock-Up** | Zero protocol-level lock-up (100% non-custodial); redemption speed is subject only to GMX v2's native 3–5 min async Keeper settlement. Optional ingress AML firewall (e.g. Robinhood **`4663` inbound block**). |
| **V1.0 Roadmap** | **Citadel-as-a-Service (CaaS)** — productize [`@slivervine/citadel-sdk`](./src/sdk/README.md) into an open sub-ms pre-execution risk layer for all Arbitrum dApps & AI Agent frameworks · **Hedge Leg Depth Guard** — dedicated Hyperliquid L2 orderbook depth sensing prior to hedge execution (zero-market-impact 1× short even during flash-liquidity drawdowns) · **✅ Config-Driven GM Markets (ETH/USDC primary · BTC/USDC active registry)** · optional **USDG Robinhood Chain Treasury routing** (config-driven; no Wasm rewrite). |

**Standards & Infrastructure:** Built on **[EIP-712](https://eips.ethereum.org/EIPS/eip-712)** attestation · **[ERC-4337](https://eips.ethereum.org/EIPS/eip-4337) / [ERC-7579](https://eips.ethereum.org/EIPS/eip-7579)** modular session keys (ZeroDev Kernel v3) · **[EIP-1559](https://eips.ethereum.org/EIPS/eip-1559)** base-fee sensing · **ArbOS 61** · Wasm soil core · optional permissioned ingress (e.g. Robinhood Chain) — full wiki: [`TECHNICAL_SPECIFICATION.md` §4 Standard Compliance](./docs/architecture/TECHNICAL_SPECIFICATION.md#4-standard-compliance--erceip-wiki).

## ⚔️ Competitive Matrix — Pre-Execution vs. Post-Execution Risk

| Feature / Dimension | Legacy Providers (Gauntlet / Chaos Labs) | SliverVine Citadel Gate (Pillar 3) |
| :--- | :--- | :--- |
| **Execution Phase** | Post-execution dashboards & multi-day governance parameter updates | **Pre-execution inline interception** (Sub-ms BEFORE mempool broadcast) |
| **Latency / Hot-Path** | Minutes to Days (Off-chain simulations + DAO votes) | **p50 ~106 µs** Shield/TS Gateway path · Wasm warm **&lt;60 µs** (Rust `#![no_std]` on Edge) |
| **Protection Level** | Global protocol parameter tuning (LTV, Collateral factors) | **Granular tx-level & LP soil protection** (MEV, RPC jitter, Oracle lag) |
| **Deployment Model** | Advisory / SaaS Analytics | **Inline Edge Gate & Open-Source Wasm SDK** (`@slivervine/citadel-sdk`) |

## 🔬 Santenmoku Engine — Battle-Tested Matrix

SliverVine Protocol is engineered under strict mathematical invariants and zero-trust pre-execution assertions.

### 1. On-Chain Enforcement Layer (Solidity v0.8.28)
* **Unit Tests**: 🟢 **60 Passed | 0 Failed**
* **Line Coverage**: 📊 **95.51% Overall** (`SliverVineGate.sol`: **95.65%**)
* **Property Fuzzing**: 🌀 **327,675 Property Fuzz Executions** (`pnpm audit:nightly` / `FOUNDRY_PROFILE=deep`; standard `forge test` = **5,120** = 5×1,024) (All Green)
* **Invariant Testing**: ⛓️ **3 Invariants × 16,384 Depth = 49,152 Stateful Calls** (0 Counterexamples)
* **Gas Deadlock**: ⛽ `verifyAndConsume`: **25,853 min / 28,043 median gas**
* **Runtime Bytecode**: 📦 **8,716 Bytes (8.71 KiB)** — Zero External Dependencies (`Assembly-optimized`)

### 2. Off-Chain Pre-Execution Radar (TypeScript / V8 Runtime)
* **Locked Minimum Proposal Baseline**: 🧪 **168 files | 742 PASS (100% Clean)**
* **Current Branch Live Expected Output**: 🎯 **174 files | 768 PASS (100% Clean · Exit Code 0)** on `pnpm test -- --run`
* **Chaos Matrix**: 🌪️ **255 Severe Failure Cases | 0 Crashes**
* **Edge Decision Latency**: ⏱️ **SLO &lt; 1.0ms | p50 ~106 μs Shield/TS Gateway | Wasm warm &lt;60 μs | Pure Math: 0.0002 ms (200 ns)**
* **Worker Bundle**: 📦 **87.76 KiB gzip** measured hot path (`pnpm bundle:measure`) · **162.49 KiB gzip** full Edge deployment artifact

---

## 🗺️ Protocol Development Milestones (M0 – M6)

| Milestone | Status | Deliverables & Verification |
|-----------|--------|-----------------------------|
| **M0: Operational Foundation** | ✅ Delivered | WSL / PNPM Monorepo, Cloudflare Edge Worker pipeline, and CI/CD strict typecheck. |
| **M1: On-Chain Citadel Gate** | ✅ Delivered | `SliverVineGate.sol` core invariant locks · **327,675 deep fuzz** (`FOUNDRY_PROFILE=deep`) · 25k gas bounds. |
| **M2: Pre-Execution Radar** | ✅ Delivered | `checkSoilResistance()` engine, **168 files | 742 PASS (100% Clean)**, 162.49 KiB gzip bundle, sub-ms latency. |
| **M3: Dual-Chain & ZeroDev AA** | ✅ Dry-Run Harness Verified (Kernel v3 / EntryPoint v0.7) | ZeroDev Kernel v3 AA Adapter · optional Robinhood Chain (`46630`/`4663`) permissioned ingress escort into Arbitrum. |
| **M4: WASM Engine & IP Moat** | ✅ Delivered | Rust `#![no_std]` Wasm core (`pkg/soil_core.wasm`) — Cloudflare budget `<28kb`, hot-path exec `<60µs` — & `@slivervine/citadel-sdk` shipped. |
| **M5: TCA Data & Hyperliquid** | ✅ Delivered (evolving) | TCA / grant-audit surfaces & HL Testnet 5-trade provenance — **Live TCA Analytics HUD actively evolving**. |
| **M6: Institutional Grant Submission** | ⏳ Planned | Final Demo Video & GMX / Arbitrum grant application package. |

---

## 🛡️ Auditor — 30-Second CLI & API Verification

```bash
# 1. Full Vitest suite (168 files | 742 PASS — live: 174 / 768)
pnpm test -- --run

# 2. 3-Tier Security Matrix (Fast / Security / Nightly)
pnpm run audit:fast       # fast tier → docs/audit/security-scorecard.json (tsc + security slice + Solhint + Gitleaks)
pnpm run audit:security   # security tier 5/0/0 → docs/audit/static-analysis-report.json (Vitest + Forge + Slither + Aderyn + pnpm-audit)
pnpm run audit:nightly    # Echidna Property Fuzz + Halmos Symbolic + Deep Fuzz

# 3. Contract unit tests, fuzzing, & gas benchmark
cd SliverVineGate && forge test --gas-report && cd ..   # default fuzz: 5,120 (5×1,024)
pnpm audit:nightly                                     # deep fuzz: 327,675 (5×65,535)

# 4. Run Off-chain Resilience & Latency Benchmark
npx tsx scripts/grant-advanced-resilience-benchmark.ts

# 5. HL Testnet 5-trade provenance (grant-audit /api/grant-audit payload)
pnpm exec vitest run tests/services/hl-5-trade-provenance.test.ts

# 6. Robinhood Chain (46630) → Arbitrum unidirectional Across bridge edge cases
pnpm exec vitest run tests/adapters/across-ingress-bridge.test.ts
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

**Center of gravity = Arbitrum One.** The Delta-Neutral GM Yield Engine is a unified sub-ms pre-execution gateway whose **primary venue** is Arbitrum One GMX v2 **ETH/USDC** GM + Hyperliquid **1× short**, with Pillar 3 Wasm Shield as the technical moat. Permissioned chains (e.g. Robinhood) are optional ingress examples only.

```text
[ Optional Permissioned Ingress (e.g. Robinhood Chain 46630 / 4663) ]
                           │
                           ▼
    ┌─────────────────────────────────────────────────────────┐
    │ Pillar 1: GATEHOUSE (Account Abstraction)               │
    │ ZeroDev Kernel v3 · 30s TTL Heartbeat / Intent Window   │
    │ Paymaster gas-free onboarding (conditional sponsorship) │
    └──────────────────────┬──────────────────────────────────┘
                           │
                           ▼
    ┌─────────────────────────────────────────────────────────┐
    │ Pillar 2: COMPLIANCE INGRESS FIREWALL (Escort Acct.)  │
    │ Unidirectional AML firewall · IN_FLIGHT_BRIDGE_CAPITAL  │
    │ Pending-Capital Recognition (lostUsd ≡ 0) · ref adapter  │
    └──────────────────────┬──────────────────────────────────┘
                           │
                           ▼
    ┌─────────────────────────────────────────────────────────┐
    │ Pillar 3: SHIELD (Pre-Execution Risk Engine)            │
    │ p50 ~106 µs Shield/TS Gateway · Wasm warm &lt;60 µs       │
    │ R01–R20 Defense Matrix (17|2|1) · signingChannelOpen: false │
    └──────────────────────┬──────────────────────────────────┘
                           │
                           ▼
[ PRIMARY: Arbitrum One GMX v2 ETH/USDC GM + Hyperliquid 1× Short ]
```

**[Pillar 1: Gatehouse — Account Abstraction]** ZeroDev Kernel v3 scoped session keys · **30s TTL Heartbeat / Intent Execution Window** (`WS_HEARTBEAT_INTERVAL_MS` · `DEFAULT_TTL_MS`) — distinct from underlying cryptographic session key lifetime (bounded up to **24h / 7d** per module scope) · **Paymaster gas-free onboarding** (daily sponsorship caps; fail-closed fallback when exhausted).

**[Pillar 2: Compliance Ingress Firewall — Escort Accounting]** Venue-agnostic unidirectional AML firewall · honest **`IN_FLIGHT_BRIDGE_CAPITAL`** labels · **Pending-Capital Recognition Invariant (`lostUsd ≡ 0`)** — protocol never prematurely writes off in-flight bridge capital as loss during active execution · **Robinhood Chain (`46630`/`4663`) is the inaugural Code-Verified / Dry-Run Verified reference adapter** — not the product identity. **Audit:** [`docs/audit/ROBINHOOD_CHAIN_SAFETY_GATE_AUDIT.md`](./docs/audit/ROBINHOOD_CHAIN_SAFETY_GATE_AUDIT.md).

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
| 4 | [`docs/audit/ZERODEV_EIP7702_COMPARATIVE_ANALYSIS.md`](./docs/audit/ZERODEV_EIP7702_COMPARATIVE_ANALYSIS.md) | ZeroDev AA vs. pre-execution Wasm substrate |
| 5 | [`docs/sdk/CITADEL_SDK_BLUEPRINT.md`](./docs/sdk/CITADEL_SDK_BLUEPRINT.md) | B2B CaaS integration blueprint · 10 bps builder + referral rebate model |

### Supporting

| Document | Purpose |
|----------|---------|
| [`docs/pitch/GRANT_PITCH_AND_VIDEO_STORYBOARD.md`](./docs/pitch/GRANT_PITCH_AND_VIDEO_STORYBOARD.md) | Grant pitch · 35s demo video storyboard |
| [`docs/architecture/CROSS_CHAIN_RISK_AND_EVOLUTION.md`](./docs/architecture/CROSS_CHAIN_RISK_AND_EVOLUTION.md) | 60 invariants · V1.0 vs V1.5/V2.0 roadmap |
| [`docs/audit/ROBINHOOD_CHAIN_SAFETY_GATE_AUDIT.md`](./docs/audit/ROBINHOOD_CHAIN_SAFETY_GATE_AUDIT.md) | Pillar 2 reference adapter audit · 5/5 bridge tests |
| [`docs/grants/SUBMISSION.md`](./docs/grants/SUBMISSION.md) | Buildathon main submission pack |
| [`docs/README.md`](./docs/README.md) | Full docs index · language policy |

---

## 📜 License

**Protocol / Worker (repo root):** **BUSL-1.1** — Copyright (c) 2026 SilverVine Labs. Change Date `2028-08-21` → Apache-2.0 (also converts earlier at M2 / $10M TVL per program terms). See [LICENSE](./LICENSE).

**Developer integration harness:** [`@slivervine/citadel-sdk`](./src/sdk/) under `src/sdk/` is licensed **Apache-2.0** (Copyright (c) 2026 SilverVine Labs) for third-party integration. See [`src/sdk/LICENSE`](./src/sdk/LICENSE), [`src/sdk/README.md`](./src/sdk/README.md), and [`docs/sdk/CITADEL_SDK_BLUEPRINT.md`](./docs/sdk/CITADEL_SDK_BLUEPRINT.md). EIP-712 domain: `SliverVineCitadel`. Docs index: [`docs/README.md`](./docs/README.md).
