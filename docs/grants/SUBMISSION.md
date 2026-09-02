# SUBMISSION.md: SliverVine Protocol (BeDelta Living Water v1.0 / BeΔ): Sub-ms 0-Gas Pre-Broadcast Safety Citadel & Risk Navigator for AI Agents on Arbitrum

| Field | Value |
|-------|-------|
| **Official Name** | SliverVine Protocol (BeDelta Living Water v1.0 / BeΔ) |
| **Category** | Promising Products Track — AI Agents & Financial Primitives |
| **Buildathon** | Arbitrum Open House Singapore Online Buildathon |
| **Live Gate (Sepolia)** | `0xb174118bc0B84e8D6D59EEF2339e29bF7FCf8BF1` |
| **Dune Telemetry** | [https://dune.com/silvervinelabs/silvervine-citadel-telemetry](https://dune.com/silvervinelabs/silvervine-citadel-telemetry) |

> **Core Pitch:** SliverVine Protocol (BeDelta Living Water v1.0 / BeΔ) is a Sub-ms 0-Gas Pre-Broadcast Safety Citadel & Risk Navigator for AI Agents on Arbitrum. It acts as the 0-Gas off-chain risk brain and on-chain execution gate for AI Agents trading across Pendle and GMX, stopping prompt injections and toxic liquidation cascades in 106µs to achieve true Delta-Neutral execution safety.

**Philosophy:** **BeDelta (BeΔ)** = Market Delta-Neutrality & Execution Safety · **SliverVine** = fragmented intent protection & steel trading execution.

**Entity:** SilverVine Labs · **Contact:** `grants@silvervinelabs.com`
**Official Site:** [silvervinelabs.com](https://silvervinelabs.com)
**Live:** [bedeltawater.slivervine.xyz](https://bedeltawater.slivervine.xyz) · `GET /api/grant-audit`
**Repo:** [SilverVineLabs/bedelta-living-water](https://github.com/SilverVineLabs/bedelta-living-water)

---

## Executive Summary & One-Page Strategic Memo

**Official pitch:** Sub-ms 0-Gas Pre-Broadcast Safety Citadel & Risk Navigator for AI Agents on Arbitrum — see metadata table above.

| Judge pointer | SSOT document |
|---------------|---------------|
| Three Pillars · R01–R20 | [Technical Specification §0–§3](../architecture/TECHNICAL_SPECIFICATION.md) |
| CLI Tier 0–5 verification | [Verification Matrix](../VERIFICATION_MATRIX.md) |
| Dune telemetry · SQL panels | [Dune Dashboard Specification](../telemetry/DUNE_DASHBOARD_SPECIFICATION.md) |
| Pendle × GMX cross-guard | [§ Core Risk Decision Matrix](#core-risk-decision-matrix-evaluatependlegmxcrossguard) · [`pendle-gmx-cross-guard.ts`](../../src/guards/pendle-gmx-cross-guard.ts) |
| ERC-8196 agent policy | [Technical Specification §0.1](../architecture/TECHNICAL_SPECIFICATION.md#01-bytecode-predicate-verification-v10--erc-7715--post-grant-design-spec) |
| Institutional DD / Basel mapping | [Due Diligence Memorandum](../audit/INSTITUTIONAL_DUE_DILIGENCE_MEMORANDUM.md) |

Built on the Santenmoku internal engine (p50 ~106µs), [`@slivervine/citadel-sdk`](../../src/sdk/README.md), and consume-once EIP-712 Gate attestation — SliverVine intercepts AI trade intents **before** mempool or bundler ingress. Deep narrative: [Problem / Solution](#the-problem) · [Sponsor Integration Matrix](#sponsor-integration-matrix).

### The Problem

AI Trading Agents combine dynamic yield tokens (e.g., Pendle PTs), high-leverage perpetuals (e.g., GMX), and cross-chain liquidity into automated strategies. However, existing risk controls are either reactive (on-chain liquidation after damage is done) or coarse "transaction blockers" that fail to distinguish between **risk-expanding** and **risk-reducing** actions. Blocking a de-leveraging transaction during volatility traps the AI agent in a high-risk position, accelerating forced liquidation (The Observatory Paradox).

### The Solution: Intent-Aware Risk Navigation

SliverVine shifts risk management from "naive blocking" to **Intent-Aware Navigation**:

1. **Observability**: Real-time monitoring of Pendle PT yield jitter/expiry dynamic fees, GMX maintenance margin buffers, and liquidity depth — [Pendle registry SSOT](../../src/adapters/pendle/pendle-pt-registry.ts) · [Technical Specification §1](../architecture/TECHNICAL_SPECIFICATION.md#1-core-product-identity).
2. **Intent Taxonomy**: Directional division separating `RISK_INCREASE` (`open`/`increase` → strict Fail-Closed evaluation) from `RISK_DECREASE` (`close`/`reduce` → greenlighted with safety routing) — [§ Core Risk Decision Matrix](#core-risk-decision-matrix-evaluatependlegmxcrossguard).
3. **Shadow Margin Engine**: Pre-execution PT exit proceeds vs GMX maintenance margin — [`pendle-gmx-cross-guard.ts`](../../src/guards/pendle-gmx-cross-guard.ts) · [Technical Specification §3.1](../architecture/TECHNICAL_SPECIFICATION.md#31-microsecond-moats).

### Legal & Regulatory Positioning

> **DISCLAIMER**: SliverVine Protocol provides software-based risk analytics, monitoring, policy enforcement, and execution-safety tooling only. It does NOT provide asset custody, underwriting, indemnity, reimbursement, profit guarantees, or any form of insurance-like coverage. All risk decisions are algorithmic and based on user-defined policy parameters and protocol-aware market signals. SLA commitments apply strictly to system availability, sub-millisecond latency, logging integrity, and observability uptime. Fees charged are software access, API, and computational SLA routing fees, creating no obligation to compensate financial losses.

---

## Architectural SSOT & Hardened Metrics

* **Test Suite**: **Proposal Baseline: 175 test files | 773 PASS (Current Branch Live: 176 test files | 775 PASS Clean)** — re-run `pnpm test -- --run` to confirm. Full matrix: [Verification Matrix](../VERIFICATION_MATRIX.md).
* **Formal Verification**: Halmos symbolic execution — [HalmosGateInvariant.t.sol](../../contracts/test/formal/HalmosGateInvariant.t.sol) · [Technical Specification §3](../architecture/TECHNICAL_SPECIFICATION.md#3-cross-venue-risk-engine--defense-matrix-r01r20).
* **Game-Theoretic Simulation**: 10,000 Monte Carlo runs · **87.39% toxic flow blocked** · $9.88M **nominal simulated** LP capital — [`game_theory_simulation_results.json`](../telemetry/game_theory_simulation_results.json) *(simulation only; not live savings)*.
* **Deployments**: Arbitrum Sepolia Gate `0xb174118bc0B84e8D6D59EEF2339e29bF7FCf8BF1` · Robinhood Chain `46630`/`4663` — [On-Chain Verification](#on-chain-verification--arbitrum-sepolia-421614).

### Core Risk Invariants (Judge Quick Reference)

$$
\Delta_{\text{net}} = \Delta_{\text{GMX\_GM}} + \Delta_{\text{HL\_Short}} \equiv 0
$$

$$
\text{lostUsd} \equiv 0 \quad \forall \, \text{InFlightBridgeCapital}
$$

$$
t_{\text{reflector\_p50}} \sim 106\,\mu\text{s} \ll t_{\text{mempool\_broadcast}}
$$

Full derivations: [Technical Specification §3.1](../architecture/TECHNICAL_SPECIFICATION.md#31-microsecond-moats) · [Cross-Chain Risk §2.1](../architecture/CROSS_CHAIN_RISK_AND_EVOLUTION.md#21-honest-bridge-accounting-in_flight_bridge_capital).

**Latency SSOT:** p50 ~106 µs Edge `checkSoilResistance()` · Wasm warm &lt;60 µs · M2M reflex `src/core/agent-citadel-guard.ts` &lt;12 µs. Full spec: [`TECHNICAL_SPECIFICATION.md`](../architecture/TECHNICAL_SPECIFICATION.md).

### Version Roadmap SSOT (V1.0 / V1.5 / V2.0)

| Horizon | Status | Scope |
|---------|--------|-------|
| **V1.0** | ✅ Code-Verified Live Baseline | Arbitrum One GMX v2 ETH/USDC GM + HL 1× short · Wasm `checkSoilResistance()` p50 ~106µs · ERC-8196 Draft policy pre-validation · EIP-712 consume-once Gate `0xb174118bc0B84e8D6D59EEF2339e29bF7FCf8BF1` · Dune + SHA-256 dual-source `GET /api/grant-audit` · **Proposal Baseline: 175 test files \| 773 PASS (Current Branch Live: 176 test files \| 775 PASS Clean)** |
| **V1.5** | ⏳ Roadmap Spec | ERC-8196 fleet enforcement for multi-agent swarms · EIP-7702 EOA → Agent Smart Account · Prompt Injection Defense Circuit (`severSigningChannel()` sub-100µs) |
| **V2.0** | ⏳ Design Spec | Institutional CaaS (`@slivervine/citadel-sdk`) for AI DEXs and Orbit L3s · **10 bps protocol authorization fee** on pre-execution risk checks |

Optional bridges (Robinhood / Across) are **Pillar 2 Reference Escort Adapters** — they do not define product identity. Aave/Morpho APY figures are **hurdle-rate probes only**, not a yield-stacking product track.

---

## Sponsor Integration Matrix

### 1. Arbitrum One / Sepolia (Core Base)

* **Integration**: Citadel Gate Verifier contract (`SliverVineGate.sol`) deployed and verified at `0xb174118bc0B84e8D6D59EEF2339e29bF7FCf8BF1`.
* **Mechanism**: Intercepts AI Trade Intents in sub-millisecond off-chain pipeline (`src/core/agent-citadel-guard.ts`), validating soil fuse + deadman switch before settlement-layer EIP-712 attestation (`SliverVineGate.sol`) (0-Gas Fail-Closed).
* **Agent policy alignment**: Aligned with the emerging **ERC-8196 AI Agent Wallet Policy Specification** (Draft co-authored by Virtuals Protocol). **Not a finalized standard.**

### 2. Robinhood Chain (Chain ID: 46630 / 4663) — Pillar 2 Reference Escort Adapter

* **Integration**: Pillar 2 Ingress Bridge Adapter (`src/adapters/across-ingress-bridge.ts`) & R20 Circuit Breaker Sever Pipeline (`src/services/root-protection-lib/circuit-breaker-sever.ts`).
* **Mechanism**: **Optional Pillar 2 Reference Escort Adapter** (not the protocol identity). Outbound `46630`/`4663` → `42161` only. When deadlock condition R20 is triggered, `severSigningChannel()` immediately severs hot-key signature pipelines, locking the engine into read-only observer mode. **Pending-Capital Recognition Invariant:** `lostUsd ≡ 0` on `IN_FLIGHT_BRIDGE_CAPITAL` until explicit timeout.

### 3. Pendle Finance

* **Integration**: [`pendle-pt-registry.ts`](../../src/adapters/pendle/pendle-pt-registry.ts) · `evaluatePendleGmxCrossGuardFromRegistry` · `evaluatePendlePtExpiryRiskFromRegistry`.
* **Arbitrum One PT Markets (Registry SSOT)**:
  * **PT-eETH:** `0x8B330d3A50a624f1fE1744d037048BdBc9664E5D`
  * **PT-USDC:** `0x156291C6e10E8a1B9f95475A9C0c5E3eCe1d1e44`
* **Mechanism**: Resolves real Pendle PT market parameters from registry, then monitors maturity boundaries (&lt;7 days) and yield jitter (&gt;200 bps). Integrates dynamic fee curve decay and Shadow Margin cross-guard with Observatory Paradox fix (`close`/`reduce` −40 score discount).

### 4. GMX

* **Integration**: `evaluatePendleGmxCrossGuard` (`src/guards/pendle-gmx-cross-guard.ts`) & GMX Order Payload Guard (`src/services/adapters/gmx-v2-order-payload-guards.ts`).
* **Mechanism**: Implements Shadow Margin accounting. Evaluates whether swapping out PT collateral under dynamic fees threatens GMX Maintenance Margin. Builder fee SSOT: **`GMX_UI_FEE_BPS` = 10** (`src/config/gmx-revenue.ts`); payload price-impact gate uses **`DEFAULT_GMX_PENALTY_BPS` = 50** (`src/services/yield/gmx-v2-price-impact.ts`).

### 5. Dune Analytics

* **Live Dashboard:** [https://dune.com/silvervinelabs/silvervine-citadel-telemetry](https://dune.com/silvervinelabs/silvervine-citadel-telemetry)
* **Live Telemetry Feed (Query 0):** `arbitrum.blocks` 12h window · Gate `0xb174118bc0B84e8D6D59EEF2339e29bF7FCf8BF1` · `RiskTripBlocked` / `IntentAttested` / heartbeat status — [`DUNE_DASHBOARD_SPECIFICATION.md`](../telemetry/DUNE_DASHBOARD_SPECIFICATION.md).
* **Telemetry Activity Chart (Query 0b):** 1h minute-bucket toxic-flow distribution (`BLOCKED` / `PASS` / `HEARTBEAT`) — same spec.
* **Integration**: [`DUNE_DASHBOARD_SPECIFICATION.md`](../telemetry/DUNE_DASHBOARD_SPECIFICATION.md) · Live `/api/grant-audit` `duneTelemetry` JSON.
* **On-chain ingest:** Dune engine actively ingests **decoded events** from Sepolia Gate `0xb174118bc0B84e8D6D59EEF2339e29bF7FCf8BF1` (`IntentAttested` · `RiskTripBlocked`).
* **Mechanism**: Production DuneSQL feed + chart (Queries 0–0b) plus reconciliation panels (Queries 1–3) — Toxic Flow Blocked · Observatory Paradox Bypasses · PT Expiry × GMX Margin Health — reconciled against `duneTelemetry.responseRef` sha256 provenance.

### Execution Speed & Protocol-Agnostic Resilience (HL Delta Pool)

Hyperliquid Session Key Adapter and TCA provenance (`src/data/verified-5tx-lib/verified-5tx-provenance.ts`) are framed as **cross-venue Δ-neutral execution speed proofs** — GMX v2 ETH/USDC GM + HL 1× short — complementing (not competing with) the Shield pre-execution narrative. SSOT: `src/adapters/hl/execution-wire.ts` · `src/adapters/hl/session-key-executor.ts`.

---

## Core Risk Decision Matrix (`evaluatePendleGmxCrossGuard`)

| Intent Direction (Code Mapping) | Trigger Condition | Reflector Action | Strategic Purpose |
| :--- | :--- | :--- | :--- |
| `close` / `reduce` (`RISK_DECREASE`) | Any Market State | `EMERGENCY_DELEVERAGE_ALLOWED` | **Fixes Observatory Paradox**: Applies -40 risk score discount; always greenlights risk reduction to prevent forced liquidation on GMX. |
| `open` / `increase` (`RISK_INCREASE`) | Raw Risk Score &gt; 75 OR Shadow Margin &lt; 0 | `FAIL_CLOSED_BLOCK` | **0-Gas Defense**: Blocks toxic/hallucinated leverage before mempool ingress. |
| `open` / `increase` (`RISK_INCREASE`) | Raw Risk Score ≤ 75 AND Shadow Margin ≥ 0 | `PASS_GREENLIGHT` | Eligible for downstream EIP-712 attestation pipeline (`SliverVineGate.sol`). |

**Demo tests:** [`tests/guards/pendle-gmx-cross-guard.test.ts`](../../tests/guards/pendle-gmx-cross-guard.test.ts) · [`tests/adapters/pendle-pt-expiry-guard.test.ts`](../../tests/adapters/pendle-pt-expiry-guard.test.ts).

---

## Three-Pillar Architecture (Submission SSOT)

| Pillar | Role | SSOT |
|--------|------|------|
| **Gatehouse (Auth)** | ZeroDev scoped session keys · Kernel v3 · R06 / R07 | `zerodev-aa-*` · Gate attestation |
| **Pillar 2: Compliance Ingress Firewall** | Venue-agnostic unidirectional AML escort · Robinhood (`46630`/`4663` → `42161`) as reference adapter | `src/adapters/across-ingress-bridge.ts` · `contracts/IngressSafetySwitch.sol` |
| **Shield (CORE MOAT)** | Sub-ms Wasm pre-execution armor · p50 ~106 μs · fail-closed before mempool | `checkSoilResistance()` · `soil_core.wasm` · Stylus `SliverVineSoilCoprocessor` |

### Competitive Positioning — Four-Dimensional ASCII Matrices (SliverVine Protocol)

**Entity:** SilverVine Labs · **Protocol:** SliverVine Protocol / SliverVine Citadel (BeΔ)  
**ERC-8196:** Emerging Draft — not finalized.

**Matrix 1 — Execution & Pre-Broadcast Severance Profile**

```text
┌───────────────────────────┬─────────────────────────────┬────────────────────────────┬────────────────────────────┐
│ Dimension                 │ SliverVine Citadel (BeΔ)   │ Legacy ERC-4337 / OZ       │ Gauntlet / Chaos Labs      │
├───────────────────────────┼─────────────────────────────┼────────────────────────────┼────────────────────────────┤
│ 1. Latency Profile        │ p50 ~106µs (Sub-ms Edge)   │ 50ms – 500ms+ (Bundler RTT)│ Hours to Days (Parameter) │
│ 2. Pre-Broadcast Severance│ YES (0-Gas Fail-Closed)     │ NO (Post-validation/mempool│ NO (Post-execution audit) │
│ 3. Gas Overhead           │ 0 Gas (Edge Rejection)      │ Wasted Bundler Gas         │ On-chain Governance Gas    │
│ 4. Invariant Enforcement  │ Δnet ≡ 0 & lostUsd ≡ 0      │ Basic Balance Checks       │ Dynamic Risk Parameters    │
└───────────────────────────┴─────────────────────────────┴────────────────────────────┴────────────────────────────┘
```

**Matrix 2 — AI Agent Wallet Policy & Execution Citadel**

```text
┌───────────────────────────┬─────────────────────────────┬────────────────────────────┬────────────────────────────┐
│ Dimension                 │ SliverVine Citadel (BeΔ)   │ Multisig / Timelock        │ Web2 LLM Guardrails        │
├───────────────────────────┼─────────────────────────────┼────────────────────────────┼────────────────────────────┤
│ 1. Policy Gate Layer      │ Sub-ms Cerebellum (ERC-8196)│ On-chain Voting / Delay    │ API Proxy (Centralized)    │
│ 2. Prompt Injection Guard │ R20 Physical Deadlock       │ Vulnerable to Signed Intent│ Bypassable via Jailbreak   │
│ 3. Key Pipe Severing      │ <1ms `severSigningChannel`  │ N/A (Requires On-chain Tx) │ N/A (No On-chain Hook)     │
│ 4. Standard Alignment     │ ERC-8196 Draft & EIP-7562   │ Standard ERC-20 / ERC-721  │ Proprietary REST APIs      │
└───────────────────────────┴─────────────────────────────┴────────────────────────────┴────────────────────────────┘
```

**Matrix 3 — Cross-Venue Liquidation & Ingress Escort Paradigm**

```text
┌───────────────────────────┬─────────────────────────────┬────────────────────────────┬────────────────────────────┐
│ Dimension                 │ SliverVine Citadel (BeΔ)   │ Native DEX Limit Orders    │ Raw Cross-Chain Bridges    │
├───────────────────────────┼─────────────────────────────┼────────────────────────────┼────────────────────────────┤
│ 1. Cross-Spread Sensing   │ Live GMX/HL Soil Resistance │ Static Slippage Tolerance  │ Blind Asset Relaying       │
│ 2. Liquidation Defense    │ -40 Haircut (Observatory)   │ Cascading Liquidation Risk │ No Execution Awareness     │
│ 3. Ingress Accounting     │ `lostUsd ≡ 0` Escort Label  │ Immediate Capital Loss     │ Phantom In-flight Balances│
│ 4. AML Shielding          │ Blocked Reverse Path (46630)│ Open Protocol Ingress      │ Unfiltered Contamination   │
└───────────────────────────┴─────────────────────────────┴────────────────────────────┴────────────────────────────┘
```

---

## Business Model & GTM Strategy

SliverVine rejects unrealistic B2B sales models (e.g. charging DAOs $8k/mo upfront) and adopts an **Infra-First, Multi-Tiered Monetization Engine**:

1. **Pay-per-Intent Micro-Attestation Fee (Primary Engine)**:
 * AI Agents and Vault Operators connect via SliverVine's Secure RPC Gateway (`@slivervine/citadel-sdk`).
 * Charged $0.01 – $0.05 per signed attestation, deducting micro-fees automatically without requiring credit card friction.
2. **Telemetry & Risk Data API (Data Engine)**:
 * Access to real-time Yield Convexity and Liquidity Void feeds via WebSocket/REST for hedge funds and quant vaults ($199–$1,999/month).
3. **Edge Execution Alliance (Partnership Model)**:
 * Acts as the **Sub-ms Intent Execution Edge** for macro risk engines (e.g., Chaos Labs, Gauntlet). Chaos Labs provides macro parameter tuning; SliverVine enforces microsecond off-chain intent protection.

**GMX builder lane (adjacent):** +10 bps `uiFeeReceiver` on unsigned GMX v2 payloads — see [`gmx/GMX_BUILDERS_PITCH.md`](./gmx/GMX_BUILDERS_PITCH.md).

---

## 🛣️ Post-Buildathon B2B Commercialization & PMF Roadmap (Post-9/14)

SliverVine Protocol enforces a strict two-stage strategy balancing Zero-Friction Hackathon Verification with Long-Term Commercial Sustainability:

- **Stage 1: Buildathon Verification Phase (Active Now — Pre-9/14)**
  - **100% Free Public Telemetry**: Open-access Dune Live Telemetry Dashboard ([https://dune.com/silvervinelabs/silvervine-citadel-telemetry](https://dune.com/silvervinelabs/silvervine-citadel-telemetry)) for zero-friction judge and developer auditing.
  - **Sepolia Safety Gate**: Full EIP-712 session key validation and 0-Gas Fail-Closed protection verified on Arbitrum Sepolia (`0xb174118bc0B84e8D6D59EEF2339e29bF7FCf8BF1`).

- **Stage 2: B2B Monetization & Risk API Launch (Post-9/14)**
  - **SliverVine Citadel Risk API & Bad Debt Calculator (powered by on-chain telemetry & Dune Analytics visualization)**: Monetize SliverVine's proprietary sub-ms risk calculation algorithms and shadow margin telemetry via a B2B API — **not** Dune platform data resale. [Dune](https://dune.com/silvervinelabs/silvervine-citadel-telemetry) remains the **free public visualization dashboard**; paid tiers ($199/mo Pro to $1,999/mo Enterprise) gate programmatic access to Citadel-computed liquidation risk, margin health, and bad-debt savings metrics for vault managers and AI Agent swarms (Wayfinder, Virtuals, M2M Treasury Funds).
  - **V2.0 CaaS rail (Design Spec):** `@slivervine/citadel-sdk` modular Wasm SDK + **10 bps protocol authorization fee** on pre-execution risk checks. v1.0 GMX **+10 bps `uiFeeReceiver`** remains the live builder lane (not the V2.0 CaaS fee).

---

## Post-Hackathon Expansion Roadmap

* **Phase 1: Milestone Dune & PoV (Day 7 – 30)**
 * Deploy live Dune Analytics dashboards and onboarding 3 design partners (AI Agent creators on Virtuals/ElizaOS and GMX Vault Managers) for $0-fee Proof-of-Value testing.
* **Phase 2: Milestone Prediction (Design Spec / Post-Hackathon Roadmap)**
 * Expand off-chain Event-Driven Risk Adapters (`polymarket-event-guard` spec) to protect AI trading agents in prediction markets (Polymarket / Azuro) during breaking news liquidity voids.
* **Phase 3: Milestone Citadel (Day 60 – 90)**
 * Institutional rollout of TEE-enclosed (SGX/Automata) Reflector nodes and Secure RPC Gateway across Arbitrum Orbit chains.

---

## Granular Milestone Matrix (Buildathon · Grant-Tied Distribution)

| ID | Unlock condition (objective) | Sponsor / track | Status |
|----|------------------------------|-----------------|--------|
| **M-Sepolia** | Sepolia Gate + RiskOracle + IngressSafetySwitch verified · `sepoliaDualLegProof` in `/api/grant-audit` | Arbitrum | ✅ Delivered |
| **M-CLI** | Vitest **Proposal Baseline: 175/773 PASS · Current Branch Live: 176/775 PASS Clean** | All | ✅ Delivered |
| **M-RH-Demo** | `46630`/`4663` → `42161` outbound escort OK · inbound AML blocked · `lostUsd ≡ 0` | Robinhood Chain | ✅ Code-verified · ⏳ video |
| **M-GMX-Fee** | Unsigned GMX v2 payload injects **10 bps** `uiFeeReceiver` | GMX | ✅ Injected · ⏳ `claimUiFees` |
| **M-Dune** | Publish Dune dashboard per [`DUNE_DASHBOARD_SPECIFICATION.md`](../telemetry/DUNE_DASHBOARD_SPECIFICATION.md) | Dune | ✅ [Live dashboard](https://dune.com/silvervinelabs/silvervine-citadel-telemetry) |
| **M6-Mainnet** | Arbitrum One limited-capital deployment · institutional AA on Kernel v3 | Arbitrum · Grant | ⏳ Post-grant |

---

## On-Chain Verification — Arbitrum Sepolia (421614)

| Contract | Role | Verified Address (Sepolia) | Source |
|----------|------|----------------------------|--------|
| **Deployer / Admin / Signer** | OpSec-isolated Forge broadcast signer | `0xbd65d785Dac74EBa9efFdB357b2dC52fCC26EC7F` | [`scripts/deploy-sepolia-gate.sol`](../../scripts/deploy-sepolia-gate.sol) |
| `SliverVineGate` | Consume-once EIP-712 attestation anchor | `0xb174118bc0B84e8D6D59EEF2339e29bF7FCf8BF1` | [`SliverVineGate/src/SliverVineGate.sol`](../../SliverVineGate/src/SliverVineGate.sol) |
| `SliverVineRiskOracle` | EIP-712 offline risk report · `STATUS_SHUTDOWN` flush | `0x3FFa2539f502682E8145e6Eb427ff78d258D53a4` | [`contracts/SliverVineRiskOracle.sol`](../../contracts/SliverVineRiskOracle.sol) |
| `IngressSafetySwitch` | Pillar 2 compliance filter | `0x3E4298e2b8d4e30396A54C1817Eb71c9272Ffb4B` | [`contracts/IngressSafetySwitch.sol`](../../contracts/IngressSafetySwitch.sol) |
| `SliverVineSoilCoprocessor` (Stylus) | On-chain HF math coprocessor | **Code-Verified** (Cargo 5/5 · Wasm Vitest passed) | [`contracts/stylus-probe/src/lib.rs`](../../contracts/stylus-probe/src/lib.rs) |

---

## Verification (60s)

```bash
pnpm install
pnpm test -- --run # Proposal Baseline: 175/773 PASS · Current Branch Live: 176/775 PASS Clean
pnpm run audit:security # 5/0/0 PASS
cd SliverVineGate && forge test --gas-report && cd ..
curl -s "https://bedeltawater.slivervine.xyz/api/grant-audit" | jq .sepoliaDualLegProof
```

**Grant E2E demo highlights** (`pnpm run demo:e2e` — GitHub `diff` syntax):

```diff
+ ── Step 1: Citadel Pre-Execution Check ──
+ Intent: allowedToSign=true · elapsed=106µs · Invariant: Δnet ≡ 0
+ ── Step 2: Robinhood Escort ──
+ Outbound: lostUsd=0 · RESULT: Escort PASS · lostUsd ≡ 0
- Inbound AML block: AML_INBOUND_TO_ROBINHOOD_BLOCKED
! GMX Payload: uiFeeReceiver (+10 bps) injected
- ALERT: SOIL_TRIPPED — toxic depth fuse
- [CRITICAL] PHYSICAL_DEADLOCK_TRIGGERED: EIP-712 Signature Pipe Severed
+ Flash unwind: PASS · RESULT: E2E OK (5/5)
```

**Regression bar:** Vitest **Proposal Baseline: 175 test files | 773 PASS (Current Branch Live: 176 test files | 775 PASS Clean)** · Forge 60/60 · Cargo Stylus 5/5 · Wasm &lt;28 KiB / &lt;60 µs.

---

## Related Documents

| Document | Purpose |
|----------|---------|
| [`../architecture/TECHNICAL_SPECIFICATION.md`](../architecture/TECHNICAL_SPECIFICATION.md) | R01–R20 Defense Matrix · latency benchmarks |
| [`../telemetry/DUNE_DASHBOARD_SPECIFICATION.md`](../telemetry/DUNE_DASHBOARD_SPECIFICATION.md) | Production DuneSQL feed + activity chart (Queries 0–0b) + 3 reconciliation panels · [live dashboard](https://dune.com/silvervinelabs/silvervine-citadel-telemetry) |
| [`arbitrum/ARBITRUM_ONE_PAGER.md`](./arbitrum/ARBITRUM_ONE_PAGER.md) | One-pager |
| [`arbitrum/GRANT_PROPOSAL.md`](./arbitrum/GRANT_PROPOSAL.md) | Scope & roadmap |
| [`gmx/GMX_BUILDERS_PITCH.md`](./gmx/GMX_BUILDERS_PITCH.md) | GMX builder economics |
| [`../pitch/GRANT_PITCH_AND_VIDEO_STORYBOARD.md`](../pitch/GRANT_PITCH_AND_VIDEO_STORYBOARD.md) | 180s demo storyboard |

---

## Appendix: Industry References & Real-World Threat Anchors

SliverVine Protocol (BeDelta Living Water v1.0 / BeΔ) is engineered directly in response to emerging Web3 AI Agent execution vulnerabilities, real-world exploit vectors, and market loss events:

- **1. MEV Bots & Thin-Liquidity Exploitation on Autonomous Agents**:
  - *Threat*: Autonomous AI Agents (e.g., ElizaOS, Virtuals swarm bots) executing trades on DEXs without real-time L2 orderbook depth sensing are routinely sandwiched by MEV bots or suffer 5%+ extreme slippage in thin liquidity pools.
  - *SliverVine Alignment*: Directly addressed by `checkSoilResistance()` depth & slippage sensing and `evaluateHlOrderbookGapGuard()`.

- **2. Prompt Injection Attacks Leading to Unauthorized Key Hijacking**:
  - *Threat*: Malicious prompts injected via Discord/Twitter trick the Agent's reasoning model (LLM) into generating unauthorized signatures or transferring vault assets to attacker addresses.
  - *SliverVine Alignment*: Prevented at the "Cerebellum" execution layer via R20 Physical Deadlock (`severSigningChannel()`) and EIP-712 Consume-Once Gate. Even if the LLM "Brain" is compromised, the pre-broadcast signature pipe is severed within 106µs.

- **3. Flash-Liquidity Crises & Cascading Liquidations in Derivatives Markets**:
  - *Threat*: Sudden liquidity drawdowns on GMX v2 and Hyperliquid trigger flash slippage, forcing unhedged AI agents into toxic liquidations.
  - *SliverVine Alignment*: Solved by our core invariant $\Delta_{\text{net}} \equiv 0$ and the Observatory Paradox (-40 score markdown) dynamic risk controller.

- **4. Verified Real-World Loss Case ($441k+ Bot Execution Error)**:
  - *Reference*: [PumpParade / Medium: AI Trading Bots Lost $441k in One Error](https://pumpparade.medium.com/ai-trading-bots-lost-441k-in-one-error-heres-what-actually-works-and-what-doesn-t-4f04f890c189)
  - *SliverVine Alignment*: Proves the urgent necessity for sub-ms pre-broadcast safety checking before orders hit the public mempool.

- **5. Industry Consensus on AI Antivirus Primitives**:
  - *Reference*: [CertiK: AI Skill Scanner & Antivirus Software for the AI Age](https://www.tradingview.com/news/chainwire:d064d7d1f094b:0-certik-launches-ai-skill-scanner-an-antivirus-software-for-the-ai-age/)
  - *SliverVine Alignment*: Validates the market demand for AI security, where SliverVine provides the execution-layer safety citadel.

- **6. Institutional Focus on AI Agent Vulnerabilities**:
  - *Reference*: [CryptoRank: AI Agents & Web3 Hacking Symposium](https://cryptorank.io/news/feed/fae5e-ai-agents-web3-hacking-wyoming-symposium)
  - *SliverVine Alignment*: Directly maps to institutional standards for agent wallet protection and pre-execution threat mitigation.

---

**SliverVine Protocol** — *The Risk Operating System for AI-Driven DeFi.*
