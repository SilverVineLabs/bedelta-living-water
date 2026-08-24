# 🛡️ BeΔLivingWater SliverVine Protocol — GMX v2 / Arbitrum Citadel Pre-Execution Gateway

[![Vitest](https://img.shields.io/badge/Vitest-735%20PASS%20%28138%20files%29-brightgreen?logo=vitest)](https://github.com/SilverVineLabs/bedelta-living-water) [![risk-control.ts coverage](https://img.shields.io/badge/risk--control.ts-100%25%20coverage-success?logo=vitest)](https://github.com/SilverVineLabs/bedelta-living-water/blob/main/src/services/risk-control.ts) [![Chaos Matrix](https://img.shields.io/badge/Chaos%20Matrix-255%2F255%20Fail--Closed-blue?logo=github)](https://github.com/SilverVineLabs/bedelta-living-water) [![Property Fuzzing](https://img.shields.io/badge/Property%20Fuzzing-65%2C535%20Passed-brightgreen?logo=vitest)](https://github.com/SilverVineLabs/bedelta-living-water) [![Telemetry](https://img.shields.io/badge/Telemetry-%2Fapi%2Fgrant--audit-blueviolet)](https://bedeltawater.slivervine.xyz/api/grant-audit) [![TypeScript](https://img.shields.io/badge/TypeScript-0%20errors-blue?logo=typescript)](https://github.com/SilverVineLabs/bedelta-living-water) [![License](https://img.shields.io/badge/License-BSL%201.1-orange)](LICENSE)![Benchmark Latency](https://img.shields.io/badge/Benchmark-0.0002ms_(p50_106μs)-blueviolet?logo=speedtest)
![Foundry Citadel Gate](https://img.shields.io/badge/Foundry-Forge_Test_Passed-brightgreen?logo=solidity)


<p align="center"><img src="public/brand/Detox_Sanctuary_wm.webp" alt="SliverVine Citadel Gate - Detox Sanctuary" width="600" style="border-radius: 8px;"></p>

> **⚡ Sub-Millisecond Risk Decisions (p50 ~106 μs / mean 0.0002 ms) paired with < 1.0ms SLO End-to-End Session Key Verification.** > *Primary venue: **Arbitrum One** GMX v2 ETH/USDC GM Pool + Hyperliquid 1× Short Hedge — protected by Pillar 3 sub-ms Wasm Shield (`checkSoilResistance()`).*

**Protocol:** SliverVine · **Entity:** SilverVine Labs · **Contact:** `grants@silvervinelabs.com` · **B2B:** `hello@silvervinelabs.com`  
**Official Site:** [silvervinelabs.com](https://silvervinelabs.com) — Defense Matrix portal & landing page  
**Repo:** [SilverVineLabs/bedelta-living-water](https://github.com/SilverVineLabs/bedelta-living-water) · **Live DApp:** [bedeltawater.slivervine.xyz](https://bedeltawater.slivervine.xyz)  
**Package:** [`@slivervine/citadel-sdk`](./src/sdk/README.md) (**Apache-2.0** · EIP-712 domain `SliverVineCitadel`) · **Architect:** qum0x (20+ Year Enterprise Web & Systems Architect) — All claims verifiable via CLI (`pnpm test`) and live JSON telemetry (`/api/grant-audit`).

**Core Product (center of gravity):** **Delta-Neutral GM Yield Engine on Arbitrum One** — GMX v2 **ETH/USDC** GM pool + Hyperliquid **1× short hedge**, guarded by Pillar 3 sub-ms Wasm Shield before any broadcast.

**Primary Venue:** Arbitrum One (`42161`) · **Hedge Venue:** Hyperliquid · **Technical Moat:** Pillar 3 — Sub-ms Wasm Armor (`checkSoilResistance()`, p50 ~106 μs).

**Supported ingress example:** Robinhood Chain may act as a **permissioned institutional ingress source** (`46630`/`4663` → Arbitrum); it is **not** the product identity.

**Triangle Liquidity Loop:** `Arbitrum One (GMX GM Yield Base — PRIMARY)` ↔ `Hyperliquid (1× Short Hedge)` ← optional permissioned ingress (e.g. Robinhood Chain) — see [`docs/architecture/TECHNICAL_SPECIFICATION.md`](./docs/architecture/TECHNICAL_SPECIFICATION.md).

**Arbitrum Native Execution Premium:** Direct Arbitrum One LPs earn an estimated **+15 ~ 30 bps** vs bridged / multi-hop routes.

---

## 🎯 Core Scope & Value Proposition

| Horizon | Focus |
|---------|--------|
| **v0.9 Active Production** | **Arbitrum One** GMX v2 **ETH/USDC GM Pool** (primary) + Hyperliquid **1× short** — eliminates oracle de-peg / FX slippage on the core yield leg. |
| **Zero Protocol Lock-Up** | Zero-lockup liquidity via GMX v2’s **3–5 min async redemption**; optional ingress AML firewall (e.g. Robinhood **`4663` inbound block**). |
| **V1.0 Roadmap** | Isomorphic **BTC/USDC GM Pools** and optional **USDG Robinhood Chain Treasury routing** (config-driven; no Wasm rewrite). |

**Standards & Infrastructure:** Built on **[EIP-712](https://eips.ethereum.org/EIPS/eip-712)** attestation · **[ERC-4337](https://eips.ethereum.org/EIPS/eip-4337) / [ERC-7579](https://eips.ethereum.org/EIPS/eip-7579)** modular session keys (ZeroDev Kernel v3) · **[EIP-1559](https://eips.ethereum.org/EIPS/eip-1559)** base-fee sensing · **ArbOS 61** · Wasm soil core · optional permissioned ingress (e.g. Robinhood Chain) — full wiki: [`TECHNICAL_SPECIFICATION.md` § Standard Compliance](./docs/architecture/TECHNICAL_SPECIFICATION.md#-standard-compliance--erceip-wiki).

## 🔬 Santenmoku Engine — Battle-Tested Matrix

SliverVine Protocol is engineered under strict mathematical invariants and zero-trust pre-execution assertions.

### 1. On-Chain Enforcement Layer (Solidity v0.8.28)
* **Unit Tests**: 🟢 **60 Passed | 0 Failed**
* **Line Coverage**: 📊 **95.51% Overall** (`SliverVineGate.sol`: **95.65%**)
* **Property Fuzzing**: 🌀 **5 Properties × 65,535 Runs = 327,675 Executions** (All Green)
* **Invariant Testing**: ⛓️ **3 Invariants × 16,384 Depth = 49,152 Stateful Calls** (0 Counterexamples)
* **Gas Deadlock**: ⛽ `verifyAndConsume`: **25,853 min / 28,043 median gas**
* **Runtime Bytecode**: 📦 **8,716 Bytes (8.71 KiB)** — Zero External Dependencies (`Assembly-optimized`)

### 2. Off-Chain Pre-Execution Radar (TypeScript / V8 Runtime)
* **Vitest Suite**: 🧪 **138 Test Files | 735 Vitest PASS (100% Clean)**
* **v0.9 Regression Bar**: 🎯 **138 Test Files | 735 Vitest PASS (100% Clean)** (`pnpm test:grant-v09-sim` + full suite)
* **Chaos Matrix**: 🌪️ **255 Severe Failure Cases | 0 Crashes**
* **Edge Decision Latency**: ⏱️ **SLO < 1.0ms | p50 ~106 μs (0.106 ms) | Pure Math: 0.0002 ms (200 ns)**
* **Worker Bundle**: 📦 **162.49 KiB gzip** (Zero-Cold-Start Edge Deployment)

---

## 🗺️ Protocol Development Milestones (M0 – M6)

| Milestone | Status | Deliverables & Verification |
|-----------|--------|-----------------------------|
| **M0: Operational Foundation** | ✅ Delivered | WSL / PNPM Monorepo, Cloudflare Edge Worker pipeline, and CI/CD strict typecheck. |
| **M1: On-Chain Citadel Gate** | ✅ Delivered | `SliverVineGate.sol` core invariant locks, 327,675 Property Fuzzing, 25k gas bounds. |
| **M2: Pre-Execution Radar** | ✅ Delivered | `checkSoilResistance()` engine, 138 Test Files | 735 Vitest PASS (100% Clean), 162.49 KiB gzip bundle, sub-ms latency. |
| **M3: Dual-Chain & ZeroDev AA** | ✅ Dry-Run Harness Verified (Kernel v3 / EntryPoint v0.7) | ZeroDev Kernel v3 AA Adapter · optional Robinhood Chain (`46630`/`4663`) permissioned ingress escort into Arbitrum. |
| **M4: WASM Engine & IP Moat** | ✅ Delivered | Rust `#![no_std]` Wasm core (`pkg/soil_core.wasm`) — Cloudflare budget `<28kb`, hot-path exec `<60µs` — & `@slivervine/citadel-sdk` shipped. |
| **M5: TCA Data & Hyperliquid** | ✅ Delivered (evolving) | TCA / grant-audit surfaces & HL Testnet 5-trade provenance — **Live TCA Analytics HUD actively evolving**. |
| **M6: Institutional Grant Submission** | ⏳ Planned | Final Demo Video & GMX / Arbitrum grant application package. |

---

## 🛡️ Auditor — 30-Second CLI & API Verification

```bash
# 1. Full Vitest suite (735 PASS / 138 files)
pnpm test

# 2. 3-Tier Security Matrix (Fast / Security / Nightly)
pnpm run audit:fast       # fast tier → docs/audit/security-scorecard.json (tsc + security slice + Solhint + Gitleaks)
pnpm run audit:security   # security tier 5/0/0 → docs/audit/static-analysis-report.json (Vitest + Forge + Slither + Aderyn + pnpm-audit)
pnpm run audit:nightly    # Echidna Property Fuzz + Halmos Symbolic + Deep Fuzz

# 3. Contract unit tests, fuzzing, & gas benchmark
cd SliverVineGate && forge test --gas-report && cd ..

# 4. Run Off-chain Resilience & Latency Benchmark
npx tsx scripts/grant-advanced-resilience-benchmark.ts

# 5. HL Testnet 5-trade provenance (grant-audit /api/grant-audit payload)
pnpm exec vitest run tests/services/hl-5-trade-provenance.test.ts

# 6. Robinhood Chain (46630) → Arbitrum unidirectional Across bridge edge cases
pnpm exec vitest run tests/adapters/robinhood-across-bridge.test.ts
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
    │ Pillar 1: THE GATEHOUSE (Auth)                          │
    │ ZeroDev Modular Session Keys (Kernel v3)                │
    │ Scope agent permissions & prevent credential drift      │
    └──────────────────────┬──────────────────────────────────┘
                           │
                           ▼
    ┌─────────────────────────────────────────────────────────┐
    │ Pillar 2: THE FIREWALL (Compliance)                     │
    │ Institutional Ingress & Cross-Chain AML Firewall        │
    │ Outbound escort + inbound AML block (ingress sources)   │
    └──────────────────────┬──────────────────────────────────┘
                           │
                           ▼
    ┌─────────────────────────────────────────────────────────┐
    │ Pillar 3: THE SHIELD (CORE MOAT — PRIMARY TECH)        │
    │ Sub-ms Wasm Armor · checkSoilResistance()               │
    │ p50 ~106 μs · MEV / RPC jitter intercepted pre-broadcast│
    └──────────────────────┬──────────────────────────────────┘
                           │
                           ▼
[ PRIMARY: Arbitrum One GMX v2 ETH/USDC GM + Hyperliquid 1× Short ]
```

**[Pillar 1: The Gatehouse — Auth]** ZeroDev Modular Session Keys (Kernel v3) — scope agent permissions & prevent credential drift.

**[Pillar 2: The Firewall — Compliance] Institutional Ingress & Cross-Chain AML Firewall** — compliance state machine for permissioned ingress sources (Robinhood Chain is a **supported example**, not the product). Outbound escort into Arbitrum · inbound AML blocked. **Audit:** [`docs/audit/R_CHAIN_SAFETY_GATE_AUDIT.md`](./docs/audit/R_CHAIN_SAFETY_GATE_AUDIT.md).

**[Pillar 3: The Shield — CORE MOAT]** Sub-ms Wasm Armor — `checkSoilResistance()` at p50 ~106 μs intercepts MEV sandwiches & RPC jitter **before** Arbitrum / HL broadcast. This is the primary technical moat of the Arbitrum One Delta Pool.

**Architecture standards:** **EIP-712** Gate attestation · **ERC-4337/7579** ZeroDev Kernel v3 · **EIP-1559** ArbOS Tri-Sensor · **ArbOS 61** · optional Robinhood ingress · **Wasm** `soil_core` — see [§ Standard Compliance Wiki](./docs/architecture/TECHNICAL_SPECIFICATION.md#-standard-compliance--erceip-wiki).

---

## 📚 Documentation

| Document | Purpose |
|----------|---------|
| [docs/GRANT_PROPOSAL.md](./docs/GRANT_PROPOSAL.md) | Arbitrum / GMX v0.9 grant scope · Triangle Liquidity Loop |
| [docs/audit/Principal_Audit_Report.md](./docs/audit/Principal_Audit_Report.md) | **Principal Audit Report v1.0.0-rc1** — liability decoupling · survival matrix · Gate / tranches · benchmarks |
| [docs/audit/R_CHAIN_SAFETY_GATE_AUDIT.md](./docs/audit/R_CHAIN_SAFETY_GATE_AUDIT.md) | **Robinhood Chain Safety Gate Audit v1.0.0** — Pillar 2 Firewall · 46630/4663 unidirectional escort · AML inbound block · `RobinhoodSafetySwitch.sol` |
| [docs/architecture/TECHNICAL_SPECIFICATION.md](./docs/architecture/TECHNICAL_SPECIFICATION.md) | Triangle Liquidity Loop · Microsecond Moats · ERC/EIP Standards Wiki · tranche / fee / Elara SSOT |
| [docs/ARBITRUM_ONE_PAGER.md](./docs/ARBITRUM_ONE_PAGER.md) | Arbitrum Citadel technical one-pager |
| [docs/grants/arbitrum/ARBITRUM_ONE_PAGER.md](./docs/grants/arbitrum/ARBITRUM_ONE_PAGER.md) | Arbitrum grant one-pager (mirror) |
| [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md) | Dual-engine topology · SRP (<200 LOC per file) |
| [docs/README.md](./docs/README.md) | Docs index |

---

## 📜 License

**Protocol / Worker (repo root):** **BUSL-1.1** — Copyright (c) 2026 SilverVine Labs. Change Date `2028-08-21` → Apache-2.0 (also converts earlier at M2 / $10M TVL per program terms). See [LICENSE](./LICENSE).

**Developer integration harness:** [`@slivervine/citadel-sdk`](./src/sdk/) under `src/sdk/` is licensed **Apache-2.0** (Copyright (c) 2026 SilverVine Labs) for third-party integration. See [`src/sdk/LICENSE`](./src/sdk/LICENSE), [`src/sdk/README.md`](./src/sdk/README.md), and [`docs/sdk/CITADEL_SDK_BLUEPRINT.md`](./docs/sdk/CITADEL_SDK_BLUEPRINT.md). EIP-712 domain: `SliverVineCitadel`. Docs index: [`docs/README.md`](./docs/README.md).
