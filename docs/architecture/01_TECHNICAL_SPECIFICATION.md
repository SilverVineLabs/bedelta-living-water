# SliverVine Citadel Shield: Pre-Consensus Intent Firewall & Execution Safety Primitive for AI Agents on Arbitrum

> **Document:** Technical Specification & Risk Topology · **Internal engine codename:** Santenmoku · **Vitest SSOT:** **173 test files | 765 PASS Clean** · Security-tier `5/0/0 PASS` · Defense Matrix `17 Active | 2 Refactored | 1 Deprecated` · Wasm Core `<28kb` Cloudflare budget, `<60µs` execution.
> **This file SSOT:** R01–R20 invariants · dual-engine topology · KV / MDD · settlement & fee bounds.
> **Docs index:** [`docs/README.md`](../README.md) · **Risk framework:** [`03_RISK_MITIGATION_AND_DISCLAIMER_FRAMEWORK.md`](./03_RISK_MITIGATION_AND_DISCLAIMER_FRAMEWORK.md) · **Standards wiki:** [`02_STANDARD_COMPLIANCE_AND_EIP_WIKI.md`](./02_STANDARD_COMPLIANCE_AND_EIP_WIKI.md) · **Grants:** [`docs/grants/`](../grants/)

**Philosophy — BeΔ (BeDelta Living Water v1.0):** **Be** is inspired by Bruce Lee's *"Be Water, My Friend"* — fluid, adaptive intent routing and friction-free multi-chain execution. **Δ (Delta)** denotes **market delta-neutrality** and risk-neutral execution — neutralizing directional exposure. **SliverVine** = fragmented intent protection & steel trading execution · **SliverVine Citadel Shield** = the pre-consensus execution safety primitive.
**Entity:** SilverVine Labs · **Protocol brand:** SliverVine Citadel Shield
**Live proof:** `GET /api/grant-audit` · [bedeltawater.slivervine.xyz](https://bedeltawater.slivervine.xyz)
**Repo:** [SilverVineLabs/bedelta-living-water](https://github.com/SilverVineLabs/bedelta-living-water)

| Deployment | Chain ID | Gate / Tx |
|------------|----------|-----------|
| **Arbitrum One Mainnet Ignition** | `42161` | Gate `0xb174118bC0B84e8D6D59EEF2339e29bF7FCf8BF1` · [Ignition Tx `0x54c153…`](https://arbiscan.io/tx/0x54c153e9a41f704b5eb0ae554eac593d1110d62bd826ff094e72f2bd60c1b0c6) |
| **Arbitrum Sepolia (sandbox)** | `421614` | Gate `0xb174118bC0B84e8D6D59EEF2339e29bF7FCf8BF1` (CREATE2 same-address) |

> **Note:** Initial mainnet deployment utilizes Bootstrap Ignition Keys (`0x1111…`/`0x2222…`) for public verification without exposing production HSM keys. Key rotation to production multisig is executed via native governance functions.

This document is **invariant-first** (Yellow Paper style): topology, thresholds, and fail-closed semantics. Monetization pitches live under `docs/grants/`.

---

## 0. Unified Institutional Pre-Execution Pipeline

Santenmoku is a **unified sub-millisecond pre-execution gateway**. **Center of gravity = Arbitrum One:** primary venue is GMX v2 ETH/USDC GM + Hyperliquid 1× short, with Pillar 3 Wasm Shield as the technical moat. Permissioned chains (e.g. Robinhood Chain) are **supported ingress examples**, not the product identity.

```text
[ Optional Permissioned Ingress (e.g. Robinhood Chain 46630 / 4663) ]
 │
 ▼
 ┌─────────────────────────────────────────────────────────┐
 │ 1. THE GATEHOUSE (Auth) — Opt-In ZeroDev Kernel v3 AA │
 │ Scopes agent permissions & eliminates credential drift│
 └──────────────────────┬──────────────────────────────────┘
 │
 ▼
 ┌─────────────────────────────────────────────────────────┐
 │ 2. PILLAR 2: COMPLIANCE INGRESS FIREWALL │
 │ Venue-agnostic unidirectional AML escort & accounting│
 │ Robinhood Chain = inaugural reference adapter │
 │ · ZeroDev Smart Route Calldata Binding (Reference Harness — Demo Spec) │
 └──────────────────────┬──────────────────────────────────┘
 │
 ▼
 ┌─────────────────────────────────────────────────────────┐
 │ 3. THE SHIELD (CORE MOAT — PRIMARY TECH) — Sub-ms Wasm │
 │ checkSoilResistance() & Wasm engine at p50 ~106 μs │
 └──────────────────────┬──────────────────────────────────┘
 │
 ▼
[ PRIMARY: Arbitrum One GMX v2 ETH/USDC GM + Hyperliquid 1× Short ]
```

| Pillar | Role | SSOT / Mechanism | Dedicated specification |
|--------|------|------------------|-------------------------|
| **[Pillar 1: The Gatehouse (Auth)]** | **Opt-In** ZeroDev scoped session keys · EIP-712 intent scopes | Kernel v3 · `ORDER_EXECUTE` bounds · Paymaster ($0.50/op · $10/day) · R06 / R07 · `USE_ZERODEV_AA` default-off | [`PILLAR_1_GATEHOUSE_ZERODEV_AA_ANALYSIS.md`](../audit/PILLAR_1_GATEHOUSE_ZERODEV_AA_ANALYSIS.md) |
| **[Pillar 2: Compliance Ingress Firewall]** | Venue-agnostic unidirectional AML escort · honest `IN_FLIGHT_BRIDGE_CAPITAL` / `lostUsd ≡ 0` | `across-ingress-bridge.ts` · `IngressSafetySwitch.sol` · Robinhood / Across = **optional reference adapters** | [`PILLAR_2_COMPLIANCE_INGRESS_FIREWALL_AUDIT.md`](../audit/PILLAR_2_COMPLIANCE_INGRESS_FIREWALL_AUDIT.md) |
| **[Pillar 3: Shield (CORE MOAT)]** | Sub-ms Wasm pre-execution armor — **primary technical moat** | `checkSoilResistance()` p50 ~106 μs · Wasm warm &lt;60µs · R01–R20 | [`PILLAR_3_EDGE_SHIELD_WASM_CORESPEC.md`](../audit/PILLAR_3_EDGE_SHIELD_WASM_CORESPEC.md) |

> **Three Pillars routing:** Pillar 1 (Gatehouse) and Pillar 2 (optional ingress) are summarized inline below; **exhaustive audit-grade specifications** live in the dedicated Pillar 1–3 documents above. This file retains cross-pillar topology, settlement bounds, and integration anchors.

> *While single components like `checkSoilResistance()` formulas are kept standard and open for seamless `@slivervine/citadel-sdk` adoption across Arbitrum, our core moat lies in the production integration complexity—stitching Rust `#![no_std]` Wasm, Edge Worker execution, and EIP-712 Gate into a sub-ms, fail-closed system.*

## ⚔️ Competitive Matrix — Pre-Execution vs. Post-Execution Risk

| Feature / Dimension | Legacy Providers (Gauntlet / Chaos Labs) | SliverVine Citadel Gate (Pillar 3) |
| :--- | :--- | :--- |
| **Execution Phase** | Post-execution dashboards & multi-day governance parameter updates | **Pre-execution inline interception** (Sub-ms BEFORE mempool broadcast) |
| **Latency / Hot-Path** | Minutes to Days (Off-chain simulations + DAO votes) | **p50 ~106 µs** (Rust `#![no_std]` Wasm engine on Edge) |
| **Protection Level** | Global protocol parameter tuning (LTV, Collateral factors) | **Granular tx-level & LP soil protection** (MEV, RPC jitter, Oracle lag) |
| **Deployment Model** | Advisory / SaaS Analytics | **Inline Edge Gate & Open-Source Wasm SDK** (`@slivervine/citadel-sdk`) |

### 0.1 Bytecode Predicate Verification (v1.0) & ERC-7715 (⏳ Post-Grant Design Spec)

SliverVine does not interpret natural-language LLM prompts. The Shield enforces **Asymmetric Predicate Bytecode Hard Assertions** against ERC-4337 UserOp calldata inside the sub-ms Wasm core (p50 ~106 μs) — **powered 100% by `pkg/soil_core.wasm`**, independent of Account Abstraction. ZeroDev Kernel v3 is an **opt-in Pillar 1 delivery adapter** for scoped session keys when institutions enable AA (`USE_ZERODEV_AA`); it does **not** provide or power sub-ms latency.

> **[ERC-8196](https://eips.ethereum.org/EIPS/eip-8196) (AI Agent Wallet Policy):** Aligned with the emerging **[ERC-8196](https://eips.ethereum.org/EIPS/eip-8196) AI Agent Wallet Policy Specification** (Draft co-authored by Virtuals Protocol). **Not a finalized standard.**

> **ERC-7715 (Advanced Wallet Permissions):** ⏳ **Planned / Post-Grant Design Spec** — evolution target for Gatehouse permission surfaces; **not shipped in v1.0**. Adapter swap path is documented for future ZeroDev / Offchain Labs integration without Shield or Wasm rewrite.

| Invariant | Mechanism | Status |
|-----------|-----------|--------|
| **Receiver Invariant** | Decode GMX v2 parameters from UserOp bytecode; assert `sender ≡ receiver` before any L2 broadcast. | ✅ v1.0 Delivered (Sepolia verified) |
| **Parameter Invariant** | Bound-check `acceptablePrice` (and related execution params) against oracle-lag sensors; fail-closed on drift. | ✅ v1.0 Delivered (Sepolia verified) |
| **Unidirectional Outbound Escort** | Pillar 2 enforces venue-agnostic outbound-only escort into Arbitrum `42161`; inbound AML contamination is blocked at the Compliance Ingress Firewall. Robinhood Chain (`46630`/`4663`) is the inaugural reference adapter. | ✅ v1.0 Delivered (Sepolia verified) |

### 0.2 v1.0 Delivered Scope vs Post-Grant Roadmap

| Horizon | Status | Scope |
|---------|--------|-------|
| **v1.0 Delivered (Sepolia + Arbitrum One)** | ✅ Code-Verified Live | **SliverVine Citadel Shield** — Pre-Consensus Intent Firewall · GMX v2 ETH/USDC GM + HL 1× short · Wasm `checkSoilResistance()` p50 ~106µs · [ERC-8196](https://eips.ethereum.org/EIPS/eip-8196) Draft policy pre-validation · EIP-712 consume-once Gate `0xb174118bC0B84e8D6D59EEF2339e29bF7FCf8BF1` · **Arbitrum One Mainnet Ignition** [`0x54c153…`](https://arbiscan.io/tx/0x54c153e9a41f704b5eb0ae554eac593d1110d62bd826ff094e72f2bd60c1b0c6) · Dune + SHA-256 `GET /api/grant-audit` · **173 test files \| 765 PASS Clean** |
| **v1.0 Active Target** | ✅ Mainnet Ignition Delivered | Single blue-chip anchor: **GMX v2 ETH/USDC GM Pool** + Hyperliquid **1× short** hedge · Gate live on **42161** |
| **v1.0 Partial — HL Orderbook Gap Guard** | ✅ Code-Verified | `evaluateHlOrderbookGapGuard()` in [`hl-orderbook-gap-guard.ts`](../../src/services/risk-control-lib/hl-orderbook-gap-guard.ts) · wired via [`soil-resistance.ts`](../../src/services/risk-control-lib/soil-resistance.ts) — gap-window leverage scale-down + 2× depth floor |
| **V1.5 Roadmap Spec** | ⏳ Planned | **Sub-ms Agentic Security & Swarms** — [ERC-8196](https://eips.ethereum.org/EIPS/eip-8196) fleet enforcement · EIP-7702 EOA → Agent Smart Account · Prompt Injection Defense Circuit (`severSigningChannel()` sub-100µs) · BTC/USDC isomorphic GM (config-only) |
| **V2.0 Design Spec** | ⏳ Planned | **Institutional CaaS & Orbit Shield** — `@slivervine/citadel-sdk` for AI DEXs / Orbit L3s · **10 bps protocol authorization fee** on pre-execution risk checks · ZeroDev Stage ⑦ Intent Composition (2PC ledger) |

**ZeroDev AA v1.0 active scope (Opt-In Pillar 1):** Stage ① Sign-in · ③ Gas ($0.50/op · $10/day) · ④ Scoped Session Keys (ERC-7579) · ⑤ Execution — Sepolia dry-run verified (`pnpm test:zerodev`). Stage ② Smart Routing = **Reference Harness & Spec** (Vitest). Stages ⑥ Recover · ⑦ Compose = **⏳ Post-Grant Roadmap (V1.5 / V2.0)**. Pillar 3 Wasm Shield and Pillar 2 Arbitrum Native Ingress operate **100% independently** of ZeroDev.

**Demo:** `pnpm run demo:e2e` — 5-step grant E2E (Intent+Deadman → Robinhood escort → GMX underweight → HL Session hedge → R20 Panic Flash).

### 0.3 Agent Ecosystem Adapters (V1.5 Roadmap)

Reference adapters in [`examples/adapters/`](../../examples/adapters/) — evaluator-reproducible **modular integration specs**; not v1.0 production fee-capture paths or partnership attestations.

> *"These framework adapters provide modular integration specifications for pre-execution risk checks via `@slivervine/citadel-sdk` and REST APIs. In v1.0, active fee-capture and liquidity routing are strictly bound to Arbitrum One GMX v2 GM + HL delta-neutral execution; multi-platform agent fee routing is targeted for V2.0 CaaS monetization."*

| Framework | Status | Spec | Implementation | CLI |
|-----------|--------|------|----------------|-----|
| **ElizaOS** | ⏳ V1.5 Ecosystem Roadmap / Modular Integration Spec | TS-compliant `Plugin` / `Action` interface — `citadelShieldPlugin` + `citadelSoilGuardAction` wrapping `checkSoilResistance()` | [`elizaos-action-adapter.ts`](../../examples/adapters/elizaos-action-adapter.ts) | `pnpm tsx examples/adapters/elizaos-action-adapter.ts [--trip]` |
| **Virtuals GAME** | ⏳ V1.5 Ecosystem Roadmap / Modular Integration Spec | TS-compliant `FunctionDefinition` custom worker action — `citadelSoilGuardFunction` wrapping `withCitadelShield()` | [`virtuals-game-adapter.ts`](../../examples/adapters/virtuals-game-adapter.ts) | `pnpm tsx examples/adapters/virtuals-game-adapter.ts [--trip]` |
| **LangChain (TypeScript)** | Reference harness (evaluator demo) | `@langchain/core/tools` `DynamicTool`-compatible spec — `citadelSoilGuardTool` + JSON schema (no runtime dependency) | [`langchain-agent-adapter.ts`](../../examples/adapters/langchain-agent-adapter.ts) | `pnpm tsx examples/adapters/langchain-agent-adapter.ts [--trip]` |
| **LangChain (Python)** | Reference harness (evaluator demo) | `langchain_core.tools.BaseTool` — `SlivervinePreExecutionGuardTool` (`slivervine_pre_execution_guard`) via Citadel REST `POST /api/hedge/evaluate` | [`langchain-agent-adapter.py`](../../examples/adapters/langchain-agent-adapter.py) | `python examples/adapters/langchain-agent-adapter.py [--trip]` |
| **Wayfinder** | ⏳ V1.5 Ecosystem Roadmap / Modular Integration Spec | TS-compliant `@slivervine/citadel-sdk` decorator — `withCitadelShield()` / `verifyAgentIntent()` pre-broadcast hook | [`wayfinder-agent-adapter.ts`](../../examples/adapters/wayfinder-agent-adapter.ts) | `pnpm tsx examples/adapters/wayfinder-agent-adapter.ts [--trip]` |
| **CrewAI / AutoGen** | ⏳ V1.5 Ecosystem Roadmap / Modular Integration Spec | Python `BaseTool` / Citadel REST Client — `SlivervineCrewAIGuardTool` + AutoGen `citadel_soil_guard` bindings | [`crewai-autogen-adapter.py`](../../examples/adapters/crewai-autogen-adapter.py) | `python examples/adapters/crewai-autogen-adapter.py [--trip]` |

**PEV (Prevented Exploit Volume) — Dune Analytics Telemetry Metric:**

| Field | Definition |
|-------|------------|
| **Metric** | **PEV** — nominal USD volume of toxic intents blocked pre-broadcast (0-Gas fail-closed severance) |
| **Event sources** | `RiskTripBlocked` on-chain events · soil-trip `SOIL_RESISTANCE_TRIP` logs · `GET /api/grant-audit` `duneTelemetry` JSON |
| **Indexer SSOT** | [`DUNE_DASHBOARD_SPECIFICATION.md`](../telemetry/DUNE_DASHBOARD_SPECIFICATION.md) — Sepolia event streaming verified; production DuneSQL targets **ChainID `42161`** |

---

## 1. Core Product Identity

**SliverVine Citadel Shield (BeDelta Living Water v1.0 / BeΔ) is a Pre-Consensus Intent Firewall & Execution Safety Primitive for AI Agents on Arbitrum.**

**Primary execution envelope:** **Delta-Neutral GM** on Arbitrum One — GMX v2 **ETH/USDC** GM pool + Hyperliquid **1× short hedge**, guarded by Pillar 3 sub-ms Wasm Shield (`checkSoilResistance()`).

| Component | Venue | Role |
|-----------|-------|------|
| **Yield base (PRIMARY)** | Arbitrum One · GMX v2 ETH/USDC GM | Underweight-side GM LP · builder `uiFeeReceiver` (**+10 bps**) · Citadel pre-execution gate |
| **Hedge** | Hyperliquid | Session-key **1× short** Emergency Liquidity Sponge · nonce-healed signing |
| **Ingress (optional)** | Robinhood Chain | **Pillar 2 Reference Escort Adapter** — not product identity |

**Robinhood Chain role:** **Pillar 2 Reference Escort Adapter** only — regulated treasuries may escort outbound (`46630`/`4663` → `42161`). Inbound AML is blocked by default. Product identity remains **SliverVine Citadel on Arbitrum**. **Audit:** [`PILLAR_2_COMPLIANCE_INGRESS_FIREWALL_AUDIT.md`](../audit/PILLAR_2_COMPLIANCE_INGRESS_FIREWALL_AUDIT.md).

### 1.1 Engineering Restraint (Blue-Chip Scope)

v1.0 is intentionally restricted to **ETH/USDC** so oracle reliability holds during Sequencer desync: one blue-chip pair removes multi-asset de-peg and FX-slippage surfaces while the Tri-Sensor Matrix (base-fee velocity, RPC jitter, phase-shift) remains authoritative.

### 1.2 Large-Scale Capital Protection

`checkSoilResistance()` (p50 ~106 μs) short-circuits any broadcast when local GM market depth cannot absorb a large institutional order without severe price impact (**>10 bps**). Fail-closed before L2 submission — depth / cross-spread / slippage fuse (R01).

---

## 2. Triangle Liquidity Loop & Segregated Tranches

Closed-loop three-venue routing with **Arbitrum One as the primary yield base**. Hyperliquid provides the hedge leg; permissioned ingress (e.g. Robinhood Chain) is optional:

```text
Arbitrum One (GMX GM Yield Base — PRIMARY · ETH/USDC)
 ↕ 1× Δ-neutral hedge
Hyperliquid (1× Short Hedge)
 ↑ optional permissioned ingress (e.g. Robinhood Chain 46630 / 4663)
```

| Leg | Venue | Role |
|-----|-------|------|
| **Yield base (PRIMARY)** | Arbitrum One · GMX v2 GM | Underweight-side GM LP · builder `uiFeeReceiver` (**+10 bps**) · Citadel pre-execution gate |
| **Hedge** | Hyperliquid | Session-key **1× short** Emergency Liquidity Sponge · nonce-healed signing |
| **Ingress (optional example)** | Robinhood Chain | Supported permissioned institutional ingress · outbound-only escort into Arbitrum · **ZeroDev Smart Route Calldata Binding** (reference harness — USDG → GMX `ExchangeRouter`; production baseline = **Arbitrum One Native Ingress**) |

**Control plane:** Cloudflare Edge Worker (`SystemState` SSOT) evaluates sequencer · oracle lag · soil · RPC radar before any unsigned GMX payload or HL hedge dispatch. Routing is unidirectional into `SystemState`; venue adapters never mutate peer books without a gate pass.

**Read API:** `GET /api/yield/triangle` — structural APY / depth / gate status across HL · GMX (Robinhood Chain ingress stub stacked via egress escort).

### 2.1 Segregated Tranches

Solidity vault surface splits capital into two non-fungible risk lanes:

| Tranche | Chain policy | Behavior |
|---------|--------------|----------|
| **Permissioned RWA Tranche** | Robinhood Chain **4663** inbound **BLOCKED** at Edge protocol filter | Institutional / RWA-tagged deposits only · **`src/adapters/across-ingress-bridge.ts`** AML inbound block · **`IngressSafetySwitch`** oracle flush + address blacklist · no permissionless public mint path from 4663 |
| **Permissionless DeFi Tranche** | Arbitrum One + HL | Open GM / hedge flow behind Citadel fail-closed gate · standard DeFi UX |

**Invariant:** RWA capital on the permissioned lane cannot be atomically reminted into the permissionless DeFi tranche without an explicit, audited bridge + compliance gate (Across + AA). Chain **4663 → Arbitrum** inbound is denied by default; Testnet **46630** remains the active integration sandbox.

**On-chain anchors:** [`contracts/IngressSafetySwitch.sol`](../../contracts/IngressSafetySwitch.sol) · [`contracts/SliverVineRiskOracle.sol`](../../contracts/SliverVineRiskOracle.sol) · [`contracts/src/SliverVineAgentPolicyGuard.sol`](../../contracts/src/SliverVineAgentPolicyGuard.sol).

**Lean On-Chain Gate by Design:** Dual-contract settlement core is `SliverVineGate.sol` (consume-once attestation) + `SliverVineAgentPolicyGuard.sol` ([ERC-8196](https://eips.ethereum.org/EIPS/eip-8196) Emerging Draft policy validation). Both are **immutable, non-custodial, no proxy** so risk math remains on Edge (`checkSoilResistance()` **p50 ~106µs**) — on-chain is the fail-closed record, not the HFT hot path.

**Arbitrum One (42161) — Mainnet Ignition Gate:**

| Contract | Role | Verified Address (Arbitrum One) |
|----------|------|----------------------------------|
| `SliverVineGate` | Consume-once EIP-712 attestation anchor | `0xb174118bC0B84e8D6D59EEF2339e29bF7FCf8BF1` |
| **Mainnet Ignition Tx** | Forge broadcast · contract creation | [`0x54c153e9a41f704b5eb0ae554eac593d1110d62bd826ff094e72f2bd60c1b0c6`](https://arbiscan.io/tx/0x54c153e9a41f704b5eb0ae554eac593d1110d62bd826ff094e72f2bd60c1b0c6) |
| **Deploy script** | ChainID guard + optional smoke | [`DeployArbitrumOneGate.s.sol`](../../SliverVineGate/script/DeployArbitrumOneGate.s.sol) · [`deploy-mainnet-gate-ignition.ts`](../../scripts/deploy-mainnet-gate-ignition.ts) |

> **Bootstrap Keys:** Initial mainnet deploy uses Bootstrap Ignition Keys (`0x1111…`/`0x2222…`) for public verification; production multisig rotation via native governance.

**Arbitrum Sepolia (421614) — verified deployment addresses:**

| Contract | Role | Verified Address (Sepolia) |
|----------|------|----------------------------|
| **Deployer / Admin / Signer** | OpSec-isolated Forge broadcast signer · gate stack admin | `0xbd65d785Dac74EBa9efFdB357b2dC52fCC26EC7F` |
| `SliverVineGate` | Consume-once EIP-712 attestation anchor | `0xb174118bC0B84e8D6D59EEF2339e29bF7FCf8BF1` |
| `SliverVineAgentPolicyGuard` | [ERC-8196](https://eips.ethereum.org/EIPS/eip-8196) (Emerging Draft) agent-policy pre-screen · `SliverVineCitadel` domain · one-way `isPolicyActive` | **Code-Verified** (Foundry unit) · on-chain deploy pending |
| `SliverVineRiskOracle` | EIP-712 offline risk report · `STATUS_SHUTDOWN` flush | `0x3FFa2539f502682E8145e6Eb427ff78d258D53a4` |
| `IngressSafetySwitch` | Pillar 2 compliance filter (oracle flush + blacklist) | `0x3E4298e2b8d4e30396A54C1817Eb71c9272Ffb4B` |
| `SliverVineSoilCoprocessor` (Stylus) | On-chain HF soil math coprocessor | **Code-Verified** (Cargo **5/5**, Wasm Sandbox Vitest Passed, On-chain Deploy Pending Tooling Lock) |

#### 2.1.1 Explicit Scope Isolation for IngressSafetySwitch

> **Design remark (Phase A SSOT):** `IngressSafetySwitch` is a **Pillar 2 address-level compliance filter only**. It does **not** implement chainId routing, R17/R20 daily-loss cutoff, Hot Key severance, or `checkSoilResistance()`.

| Layer | Responsibility | Module |
|-------|----------------|--------|
| **Edge ingress adapter** | Chain ID unidirectional escort · `AML_INBOUND_TO_ROBINHOOD_BLOCKED` | `src/adapters/across-ingress-bridge.ts` (Robinhood = reference adapter) |
| **On-chain ingress switch** | Oracle flush + institutional blacklist per address | `IngressSafetySwitch.sol` |
| **Pre-execution shield** | Sub-ms soil fuse · R17/R20 · Hot Key / `rootProtection()` | Pillar 3 Edge · Wasm · **not** IngressSafetySwitch |

> Shutdown is triggered upstream by **`SliverVineRiskOracle.applySignedReport(STATUS_SHUTDOWN)`** (EIP-712 offline signer → `isSystemFlushed`). **`IngressSafetySwitch`** reads oracle state only — no independent `Ownable` / `Pausable` admin surface.

**Invariant:** Phase A rename (`RobinhoodSafetySwitch` → `IngressSafetySwitch`) is **nomenclature + SSOT realignment only** — zero predicate or storage-layout change. `SliverVineGate.sol` has **no** on-chain dependency on this contract.

### 2.2 Asset Redemption & Clearing Boundaries

| Path | Boundary |
|------|----------|
| **Arbitrum One Off-ramp** | Native **ETH, BTC, and USDC** supported directly upon GMX v2 async unwind (3–5 min). |
| **USDG Clearing** | Native USDG treasury redemptions are restricted to Robinhood Chain (`46630`/`4663`) via the unidirectional bridge; Arbitrum USDC is converted on return to preserve compliance bounds. Inbound AML contamination (reverse path) is blocked. |

### 2.3 ZeroDev Smart Route Calldata Binding (Pillar 2 Reference Harness — Demo Spec)

> **Status:** **Reference Harness & Spec** — Dry-run verified via Vitest (`tests/adapters/gmx-smart-route-payload-binding.test.ts`). This serves as an evaluator-reproducible reference adapter. Production execution baseline defaults to **Arbitrum One Native Ingress**.

**Pillar 2 context:** This section documents a **reference harness surface** of the Compliance Ingress Firewall — ZeroDev Kernel UserOp calldata binding from permissioned ingress (Robinhood `46630`/`4663` **USDG** as inaugural reference adapter) to Arbitrum GMX execution. **`GMX_V2_EXCHANGE_ROUTER_ARBITRUM`** (`ZERODEV_SMART_ROUTE_TARGETS` · `gmx-revenue.ts`) → **`GM_ETH_USDC`** pool — single-click cross-chain deposit/swap calldata spec, no hot-wallet custody.

**Payload binding (calldata-level, Gate struct unchanged):** `buildGmxSmartRoutePayloadBinding()` encodes smart-route calldata → `computeGatedExecutorPayloadHash()` mirrors on-chain `GatedExecutor.payloadHash(initiator, target, keccak256(data), nonce)`. The digest fills the existing `RiskAttestation.payloadHash` field — **`SliverVineGate.sol` `ATTESTATION_TYPEHASH` and struct layout are not modified**.

Anchors: [`gmx-smart-route-payload-binding.ts`](../../src/services/adapters/gmx-smart-route-payload-binding.ts) · [`gated-executor-payload.ts`](../../src/sdk/gated-executor-payload.ts) · [`r-chain-yield-router.ts`](../../src/adapters/robinhood/r-chain-yield-router.ts) · [`GatedExecutor.sol`](../../SliverVineGate/src/GatedExecutor.sol).

### 2.4 Pillar 1 — Opt-In ZeroDev Account Abstraction (Integration Summary)

> **Full Pillar 1 specification:** [`PILLAR_1_GATEHOUSE_ZERODEV_AA_ANALYSIS.md`](../audit/PILLAR_1_GATEHOUSE_ZERODEV_AA_ANALYSIS.md) — ZeroDev Kernel v3 session keys, EIP-7702 comparative analysis, `sessionOk` / `allowedToSign` dry-run scope (`pnpm run demo:e2e`), and `pnpm test:zerodev` harness. This section retains integration anchors only.

> **Status:** v1.0 production SSOT = **Kernel v3** (`ZERODEV_KERNEL_VERSION` v0.3.1 · EntryPoint v0.7); **Kernel v4** = post-grant V1.5 alignment path (Gatehouse adapter upgrade only — **no rewrite** of Shield / Wasm / EIP-712 Gate).

> **Boundary:** ZeroDev Kernel v3 is an **opt-in Pillar 1 AA layer** (`USE_ZERODEV_AA` default-off). ZeroDev infrastructure failure, bundler outage, or Paymaster exhaustion **never** impairs the **Edge Wasm Shield** (`checkSoilResistance()` · p50 ~106 µs) or **Arbitrum Native Ingress** — institutions fall back to EOA / native signing paths with identical pre-broadcast protection.

#### 2.4.1 Role of ZeroDev: Scoped Session Keys & Gas Sponsorship (Pillar 1 Opt-In AA Layer)

SliverVine Protocol separates **pre-broadcast risk enforcement** from **account delivery**. ZeroDev Kernel v3 is an **opt-in Pillar 1 layer** — institutions may enable scoped session keys and Paymaster gas sponsorship; the protocol does **not** require ZeroDev for core Citadel protection or bridge accounting.

| Layer | Role | SSOT | Dependency on ZeroDev |
|-------|------|------|------------------------|
| **Pre-Broadcast Risk Core (p50 ~106 µs)** | Sub-ms soil fuse · R01–R20 · fail-closed severance | `pkg/soil_core.wasm` · `checkSoilResistance()` on Cloudflare Edge | **None** — runs 100% independently of AA |
| **ZeroDev Kernel v3 (Pillar 1)** | Opt-in smart-account delivery plane · scoped **30s** session keys · Paymaster sponsorship | `src/adapters/arbitrum/zerodev-aa/` · `pnpm test:zerodev` | **Opt-in** — `USE_ZERODEV_AA` default-off |
| **Baseline ingress (no AA)** | Direct Arbitrum Native Ingress · Across bridge escort | `across-ingress-bridge.ts` · native GMX/HL adapters | **Independent** — `lostUsd ≡ 0` guaranteed by bridge state machine, not AA |

**Separation of powers:**

- **Pre-Broadcast Risk Core (p50 ~106 µs):** Powered 100% independently by SliverVine Edge Wasm (`pkg/soil_core.wasm`). Every intent — EOA, Kernel UserOp, or bridge escort — is evaluated by `checkSoilResistance()` **before** any broadcast path.
- **ZeroDev Kernel v3 (Pillar 1):** Serves as an **Opt-In Smart Account Delivery Plane** for scoped 30s session keys and Paymaster gas sponsorship. Citadel never holds user keys or principal — capital remains in the Kernel `sender` smart account when AA is enabled (R06–R07 · ERC-7579).
- **Baseline Fallback:** Direct **Arbitrum One Native Ingress** and **Across Bridge** adapters operate smoothly with or without ZeroDev enabled. The `lostUsd ≡ 0` invariant is guaranteed by the bridge state machine and escort accounting — **not** by Account Abstraction.

When ZeroDev **is** enabled, it provides three delivery-plane capabilities SliverVine does not replicate in-house:

| Capability | Without ZeroDev (baseline) | With Opt-In ZeroDev integration |
|------------|--------------------------|-----------------------------------|
| **Scoped Session Keys** | EOA or institutional multisig signing | Kernel modular `ORDER_EXECUTE` · R06/R07 notional cap · 30s TTL auto-expiry |
| **Paymaster sponsorship** | Institutions prefund Arbitrum gas | `zerodev.sponsorUserOperation` · per-op ≤ $0.50 · daily $10 circuit breaker |
| **Bundler standard path** | Direct `eth_sendRawTransaction` or venue-native signing | EntryPoint v0.7 + **EIP-7562** compliant UserOp · fail-closed · no blind retry |

**Execution pipeline (opt-in AA path only):**

```text
UserOp draft → verifyAgentIntent() [Edge Shield · p50 ~106µs · Wasm — independent of AA]
 → evaluateStaticBreakerMatrix() [soil + gas ledger]
 → Paymaster sign → Bundler → EntryPoint → Kernel validateUserOp
```

The Shield decides **before broadcast** on every path; ZeroDev handles **non-custodial account delivery only** when explicitly opted in. If ZeroDev is unavailable, institutions route through **Arbitrum Native Ingress** or **Across Bridge** escort — the Wasm Shield and `lostUsd ≡ 0` invariants remain fully operational.

#### 2.4.2 Kernel v3 / v4 Session Keys (ERC-7579 Modular Permissions)

> **Scope:** Kernel v3 session keys are the v1.0 delivered AA surface. Kernel v4 alignment is **post-grant (V1.5)** — adapter swap only; Shield / Wasm / Gate are unchanged.

| Dimension | Kernel v3 (v1.0 delivered) | Kernel v4 (V1.5 alignment) |
|-----------|------------------------------|------------------------------|
| **Module standard** | ERC-7579 modular session keys | v4 unified permission surface · ZeroDev "One Stack" |
| **Permission scope** | `ORDER_EXECUTE` · whitelisted `callData` target/selector | Same R06 semantics · extended Smart Routing cross-chain session scope |
| **Notional cap** | `SESSION_KEY_NOTIONAL_CAP_USD` = **$5,000** (R07) | Config-driven · invariant formulas unchanged |
| **TTL / re-auth** | Session TTL + R14 EIP-712 5-min re-auth | v4 Authorize stage native alignment · adapter swap only |
| **Signature path** | Kernel `isValidSignature` → ERC-1271 `0x1626ba7e` | Dual plane: Kernel ERC-1271 ∥ Gate ECDSA m-of-n |
| **Code anchors** | `src/adapters/arbitrum/zerodev-aa/` · `hl-session/permissions.ts` | ⏳ Post-Grant (V1.5) adapter swap · **Shield / Wasm zero rewrite** |

**Migration rule:** Kernel v3 → v4 replaces Gatehouse adapters only (`zerodev-aa-userop.ts` · `zerodev-aa-gate.ts`); `checkSoilResistance()`, `pkg/soil_core.wasm`, and `SliverVineGate.sol` **do not change** with Kernel major version.

#### 2.4.3 Paymaster Gas Sponsorship (Sponsorship & Circuit Breakers)

> **Scope:** Paymaster sponsorship is **opt-in** (Pillar 1). Daily cap exhaustion falls back to `sponsored: false` — UserOp drafting continues on self-funded gas; **Edge Wasm Shield and Arbitrum Native Ingress are unaffected**.

| Parameter | Value | SSOT |
|-----------|-------|------|
| Per-UserOp sponsorship cap | **$0.50 USD** | `MAX_GAS_COST_PER_USEROP_USD` |
| 24h rolling sponsorship budget | **$10 USD** | `DAILY_SPONSORSHIP_LIMIT_USD` |
| Trip code | `ZERODEV_GAS_LIMIT_EXCEEDED_TRIP` | `zerodev-aa-static-breaker.ts` |
| Paymaster middleware | `zerodev.sponsorUserOperation` | `zerodev-aa-userop.ts` |
| Persistence (optional) | KV `zerodev:aa:gas:ledger` · TTL 86,400s | `zerodev-aa-gas-ledger.ts` |

Sponsorship and soil fuse are **serially evaluated**: `evaluateStaticBreakerMatrix()` runs `checkSoilResistance()` first, then `evaluateSponsoredGasLimits()` — on soil trip, **both sponsorship and broadcast are denied**, preventing "paid but should-be-blocked" UserOps from reaching the bundler.

#### 2.4.4 EIP-7562 Zero-Bundler-Rejection Invariant

> **Scope:** Applies only when ZeroDev AA is **opted in**. Bundler timeout or rejection triggers fail-closed on the UserOp path — institutions may bypass AA entirely via Arbitrum Native Ingress without losing Shield protection.

**Zero-Bundler-Rejection Invariant:** Citadel UserOps MUST NOT trigger EIP-7562 opcode/storage violations during the validation phase; bundler rejection is a **protocol fault**, not a retry signal.

| Rule | Enforcement |
|------|-------------|
| Validation-phase storage reads | Session-key modules restrict `callData` to whitelisted target/selector — no forbidden cross-contract reads |
| Edge pre-screen | Static breaker + `checkSoilResistance()` before `sendUserOperation()` |
| Fail-closed | Bundler unreachable · missing EP v0.7 · timeout → `BUNDLER_TIMEOUT_FAIL_CLOSED` (`ZERODEV_BUNDLER_FAIL_CLOSED_TIMEOUT_MS` = 3,000 ms) |
| Probe | `supportsEntryPoint07` · `zerodev-aa-bundler.ts` smoke probe |

This invariant ensures institutional UserOps are **predictably deliverable** on Arbitrum bundler infrastructure — not silently dropped for storage violations — consistent with the 106 µs Shield fail-closed philosophy.

#### 2.4.5 ZeroDev v4 "Seven Stages, One Stack" Alignment Roadmap (Post-Grant Spec)

ZeroDev v4 converges the smart-wallet lifecycle into **seven stages, one stack**. SliverVine Protocol v1.0 delivers stages **①–⑤** (with ② as reference harness only); stages **⑥–⑦** are explicitly **post-grant roadmap** — not claimed as v1.0 scope.

| Stage | ZeroDev v4 semantics | SliverVine Citadel Shield integration anchor | Status |
|-------|---------------------|-------------------------|--------|
| **① Sign in** | Identity · Kernel account resolution | ZeroDev login → `sender` Kernel address · no hot-wallet seed | ✅ v1.0 Delivered (Sepolia verified) |
| **② Fund** | Cross-chain deposit · Smart Routing | `ZERODEV_SMART_ROUTE_TARGETS` · USDG → GMX ExchangeRouter (§2.3 reference harness) | 📋 Reference Harness (Vitest dry-run verified) |
| **③ Gas** | Paymaster sponsorship | `zerodev-aa-gas-ledger` · per-op / daily caps (§2.4.3) | ✅ v1.0 Delivered (Sepolia verified) |
| **④ Authorize** | Session key scope | ERC-7579 `ORDER_EXECUTE` · R06/R07 · R14 re-auth | ✅ v1.0 Delivered (Sepolia verified) |
| **⑤ Execute** | UserOp broadcast · on-chain execution | `verifyAgentIntent()` → Shield → Bundler → GMX/HL venue | ✅ v1.0 Delivered (Sepolia verified) |
| **⑥ Recover** | Account recovery · social recovery | — | ⏳ Post-Grant Roadmap (V1.5) — *Out of scope for v1.0 (handled by upstream Kernel/EOA owner)* |
| **⑦ Compose** | Multi-step intent composition | 2PC intent ledger · `intent-ledger.ts` (partial internal coverage) | ⏳ Post-Grant Roadmap (V2.0 CaaS) — *Off-chain 2PC intent ledger (partial internal coverage)* |

```text
Sign in ──► Fund ──► Gas ──► Authorize ──► Execute (v1.0 Core Active Scope)
 │          │        │          │              │
 Kernel   Smart    Paymaster  Session Keys   Shield 106µs
 Account  Route    Ledger     R06/R07        + Venue
 (Ref)    (Ref)                              dispatch
```

**v1.0 active scope:** Stages ①③④⑤ are Sepolia-verified AA delivery paths. Stage ② is a Vitest reference harness only. Stages ⑥⑦ are **not** v1.0 deliverables — recovery is upstream Kernel/EOA owner responsibility; multi-step Compose is a V2.0 CaaS roadmap item.

**One Stack semantics (post-grant alignment):** When Kernel v4 ships, stages ①–⑤ will share one Kernel account, `sender` identity, and Citadel `AllowedToSign` predicate — institutions need not switch wallets between permissioned ingress and Arbitrum One. **Shield / Wasm / Gate invariants are unchanged** across Kernel major versions.

### 2.5 Strategic Blue-Chip Ecosystem & Settlement Roadmap (V1.5 / V2.0)

> **Scope honesty:** v1.0 active execution and fee capture remain **GMX v2 ETH/USDC GM + Hyperliquid 1× short** on Arbitrum One (§2 triangle). The milestones below extend topology and settlement — modular integration specs and post-grant rollout targets, **not** v1.0 production fee paths.

| Partner / Venue | Strategic role | Citadel integration | Horizon | Status |
|-----------------|----------------|---------------------|---------|--------|
| **Pendle Finance** (Yield & Rate Hedging) | Strategic integration for AI agents in yield-tokenization and fixed-income markets — PT/YT safety sentinel (not a yield competitor) | `checkSoilResistance()` microsecond pre-execution firewall · `evaluatePendleGmxCrossGuard()` · `evaluatePendlePtExpiryRisk()` · [`pendle-gmx-cross-guard.ts`](../../src/guards/pendle-gmx-cross-guard.ts) · [`pendle-pt-registry.ts`](../../src/adapters/pendle/pendle-pt-registry.ts) | **V1.5** | ✅ Code-Verified guard (Vitest) · full agent routing ⏳ Post-Grant |
| **Camelot DEX & Stabilizer** (Native Liquidity & Zero-Slippage Settle) | Arbitrum-native liquidity (`GRAIL`) and zero-slippage stablecoin routing to optimize delta-neutral rebalance friction | Camelot API on RPC allowlist (`api.camelot.exchange`) · rebalance leg optimizer · `FRICTION_BUFFER_APY` absorption in [`rebalance-rules.ts`](../../src/services/yield/rebalance-rules.ts) | **V1.5** | ⏳ Roadmap Spec |
| **Variational** (Next-Gen Perps & Cross-Venue Alternative) | Future-proof integration for advanced decentralized perps and cross-chain margin routing — extensible complement/alternative to Hyperliquid hedge leg | `buildVariationalShortOrder()` · `evaluateVariationalOrderbookDepth()` PoC · same-chain Arbitrum hedge extension | **V2.0** | ⏳ PoC Spec ([`docs/logging/20260827_v1.5_aave_variational_adapter_poc_ZH.md`](../logging/20260827_v1.5_aave_variational_adapter_poc_ZH.md)) |

```text
v1.0 Active Triangle (42161)
  GMX v2 GM Yield ──1× Δ-neutral──► Hyperliquid Short
         │
         └──► V1.5+: Pendle PT/YT sentinel · Camelot/Stabilizer zero-slippage settle
         └──► V2.0: Variational native perp hedge (HL complement/alternative)
```

---

## 3. Cross-Venue Risk Engine & Defense Matrix (R01–R20)

> **Full Pillar 3 specification:** [`PILLAR_3_EDGE_SHIELD_WASM_CORESPEC.md`](../audit/PILLAR_3_EDGE_SHIELD_WASM_CORESPEC.md) — Wasm `soil_core.wasm` engine, `checkSoilResistance()` latency moats (p50 ~106 µs · warm &lt;60 µs), Tri-Sensor matrix, and complete R01–R20 defense matrix. Below is the integration summary retained in this topology document.

### 3.1 Microsecond Moats (Summary)

| Moat | Constant / Module | Spec |
|------|-------------------|------|
| **Emergency Margin Buffer** | `DEFAULT_CROSS_MMR = 0.05` (5% account equity reserve) | Blocks new risk when free margin buffer would fall below **5%** after intended notional (`src/services/risk/liquidation-meter.ts`) |
| **HL Nonce Auto-Resync** | `HL_NONCE_AUTO_RESYNC` · `session-key-adapter-lib/nonce-auto-healing` | Monotonic nonce heal on `Invalid nonce` WS · heartbeat revoke closes signing channel |
| **NTP Clock Drift Compensator** | `NTP_CLOCK_DRIFT_COMPENSATOR` | Rejects / skew-corrects venue timestamps with **&lt;200ms** drift vs Edge NTP; aligns with Pgate latency fuse (`PGATE_MAX_LATENCY_MS` = 200) |
| **Cross-Venue Net Slippage TWAP** | `CrossVenueNetSlippage` | When net cross-book slippage **&gt; 0.5%** (`MAX_SLIPPAGE = 0.005`), trips soil + schedules **TWAPEngineV2** path slicing instead of market sweep |
| **GMX Positive Skew Rebate** | `gmx-v2-balancer` / price-impact soil | Qualifies underweight-side flow · captures **positive skew / price-impact rebate** bps — never conflated with builder UI fee |

**Formal risk equations (SSOT):**

$$
\mathrm{BufferRatio} = \frac{\mathrm{Equity}}{\mathrm{Notional}} - \mathrm{MMR},\quad \mathrm{MMR}=0.05
$$

$$
\mathrm{MaxSL} = \mathrm{Balance} \times 0.01 + 100
$$

$$
\mathrm{AllowedToSign} = \mathrm{Injection} \land \mathrm{Digest} \land \mathrm{Soil} \land \mathrm{Session} \land \mathrm{Gas} \land \mathrm{Attestation} \land \mathrm{Armor} \land \mathrm{Wasm}
$$

**Companion fuses:** Dynamic Account Risk Ceiling (V0.8 Baseline: Equity-Weighted SL; V1.0 Mainnet: Dynamic Adaptive Engine) · Sequencer 600s grace · Oracle lag fail-closed · Root slippage breaker (0.5%). · Configurable Dynamic Slippage Deadman is an additional fail-closed fuse on the AA / SDK path.

### 3.2 Risk & Execution Matrix

#### § Poisson Jitter & Anti-MEV Adaptive TWAP

For **$1,000,000+** treasury routing into GMX v2 GM pools, the Shield schedules child clips via **Wasm-driven Poisson random intervals** uniformly bounded **18s–110s** across a **12–18 minute** parent window. Inter-arrival jitter drives autocorrelation toward **near zero**, keeping GMX local price impact **≤ 10 bps**; any residual depth breach still short-circuits via `checkSoilResistance()` (R01).

#### § Block 0 Sequencer Desync Defense

| Layer | Mechanism |
|-------|-----------|
| **Private path** | Bypass public mempools via **Private Relays / QUIC** — Edge never exposes intent on the open gossip surface during desync windows. |
| **Settlement timing moat** | Leverage GMX v2 **two-stage async settlement**: keepers execute create→settle asynchronously; **`cancelOrder` remains a single-stage atomic** counter to stale MEV intent if soil / sequencer / oracle sensors trip mid-window. |

#### § SGX PRM Key Caching — ⏳ Planned / V1.0 Design Spec

> **Not in v1.0 codebase.** Documented cold-path / hot-signing architecture for future hardened key isolation.

| Phase | Bound |
|-------|-------|
| **Epoch attestation bootstrap** | **24-hour** SGX / PRM attestation refresh — cold path only. |
| **Hot signing** | Sub-ms **in-memory Ephemeral Key** signing after bootstrap — **&lt;30µs** CPU PRM execution on the Shield hot wire (no per-tx remote attestation). |

#### § Step-down Auto-Deleveraging Rules

Python-verified **48-day runway** under sustained negative funding. Automated 3-phase unwind (R12 / escalation ladder family):

| Trigger | Action |
|---------|--------|
| **Day 8** | Delever **−20%** notional |
| **Day 15** | Delever **−50%** notional |
| **Day 22 (30% reserve)** | **100% Fail-Closed return** — flatten remaining exposure; R17 / R20 severance envelope if flatten stalls |

### 3.3 Defense Matrix (R01–R20) — Summary

**Status:** **17 Active | 2 Refactored | 1 Deprecated** · Full rule table: [`PILLAR_3_EDGE_SHIELD_WASM_CORESPEC.md`](../audit/PILLAR_3_EDGE_SHIELD_WASM_CORESPEC.md#defense-matrix-r01r20).

| Tier | Rules | Role |
|------|-------|------|
| **Pre-execution soil** | R01 · R03 · R04 · R05† | Wasm soil fuse · L2 stale book · Pgate latency |
| **Session / AA** | R06 · R07 · R08 · R14 | Scoped keys · notional cap · nonce heal · re-auth |
| **Saga / flatten** | R09 · R10 · R12 · R13 | 2PC ledger · auto-flatten · leverage scaling · black-swan halt |
| **Severance** | R17 · R20 · R02 | Daily loss cutoff · physical deadlock · `rootProtection()` |
| **Anchors / infra** | R11 · R15 · R16 · R18 · R19 | Dynamic SL · CCXT harness · 5-TX provenance · KV hardlock |

† R05 SpoofBuster — **Deprecated** (superseded by soil / depth gate).

**Supporting sensors:** Sequencer Guard · Arbitrum Gas / Oracle Lag · RPC Whitelist · Escalation Ladder.

### 3.4 Topology & Request Flow

| Engine | Venue | Role |
|--------|-------|------|
| **Arbitrum Citadel** (primary) | GMX v2 GM pools, Arbitrum One | Pre-execution gate · underweight-side routing |
| **Hyperliquid Native** (fallback) | HL L2 perps, session-key signing | Emergency Liquidity Sponge when Citadel flags trip |

Routing policy: venue selected per risk flags; both paths share the same fail-closed envelope. On-chain attestation consume-once: `SliverVineGate.sol` (`verifyAndConsume`).

1. **Ingress** — `worker-fetch.ts` / `worker-scheduled.ts`.
2. **Pre-execution** — sequencer → oracle-lag → `checkSoilResistance()` (depth, cross-spread, slippage fuse).
3. **Routing** — underweight GM qualification → unsigned payload with optional builder hooks.
4. **Hedge** — session-key HL leg when Citadel trips.
5. **State** — unidirectional `SystemState`; 2PC intent ledger → KV.

### 3.5 Wasm Soil Core (M4) — Summary

> **Full Wasm / latency specification:** [`PILLAR_3_EDGE_SHIELD_WASM_CORESPEC.md`](../audit/PILLAR_3_EDGE_SHIELD_WASM_CORESPEC.md#wasm-soil-core-engine-no_std).

> **Dual-Engine Soil Topology:** SliverVine Citadel Shield enforces dual-engine soil resistance: pure high-throughput TypeScript soil math on Cloudflare Worker hot paths, alongside native `pkg/soil_core.wasm` execution on `@slivervine/citadel-sdk` agent-intent paths. Both engines share identical p50 ~106µs fail-closed thresholds and defense bounds.

- Artifact: `pkg/soil_core.wasm` (`#![no_std]`)
- Budget: **&lt;28kb** Cloudflare · hot-path exec **&lt;60µs** · Shield p50 **~106µs**
- Wire: `src/sdk/soil-wasm.ts` (production); TS sim fallback for dev

### 3.6 Financial Risk Parameters & Epoch Operations

| Layer | Parameter | Value / Rule | Status |
|-------|-----------|--------------|--------|
| **Active v1.0 Controls** | Single-order notional cap | **$5,000 USD** (`SESSION_KEY_NOTIONAL_CAP_USD`) | ✅ Code-Verified |
| **Active v1.0 Controls** | Protocol UI fee accrual | **+10 bps** `uiFeeReceiver` (`GMX_UI_FEE_BPS`) + up to **25%** referral rebate | ✅ Code-Verified |
| **Active v1.0 Controls** | Emergency margin buffer | **5%** (`DEFAULT_CROSS_MMR = 0.05`) | ✅ Code-Verified |
| **Active v1.0 Controls** | Circuit breakers | **R17** daily-loss severance · **R20** physical deadlock / flatten-fail | ✅ Code-Verified |
| **Vault Operational Spec (V1.0 Roadmap)** | Alpha Vault Cap | **$100,000** hard TVL ceiling | ⏳ Planned |
| **Vault Operational Spec (V1.0 Roadmap)** | Epoch batching | **4-hour** epoch windows for cross-venue execution | ⏳ Planned |
| **Vault Operational Spec (V1.0 Roadmap)** | Deposit cooldown | **24-hour** minimum hold to prevent flash arbitrage | ⏳ Planned |

---

## 4. Standard Compliance & ERC/EIP Wiki

> **See the comprehensive [Standard Compliance & ERC/EIP Wiki](./02_STANDARD_COMPLIANCE_AND_EIP_WIKI.md) for full technical breakdowns, compliance postures, and verification anchors.**

Citadel binds **ERC-4337** · **EIP-7562** · **EIP-712** · **ERC-1271** · **ERC-20/777** · **OpenZeppelin v5** · **ERC-7579** · **EIP-7702** · **ERC-7715** · **ERC-8196** (Draft) · **EIP-1559** · **Arbitrum Stylus SDK** · **ArbOS / Stylus** · **Robinhood Chain Ingress** · **Wasm `soil_core`** — each mapped to implementation anchors and verification probes in the dedicated wiki ([summary table](./02_STANDARD_COMPLIANCE_AND_EIP_WIKI.md#standards-summary-table) · [compliance posture](./02_STANDARD_COMPLIANCE_AND_EIP_WIKI.md#compliance-posture) · [ArbOS/Stylus](./02_STANDARD_COMPLIANCE_AND_EIP_WIKI.md#arbos--stylus-alignment--code-verified-on-chain-coprocessor) · [RPC/WSS](./02_STANDARD_COMPLIANCE_AND_EIP_WIKI.md#infrastructure-rpc--wss-alchemy-ha)).

---

## 5. Settlement Windows & Fee Tokenomics

### 5.1 Settlement Windows

| Window | Constant | Duration | Meaning |
|--------|----------|----------|---------|
| GMX GM redemption / settle | `GMX_REDEMPTION_WINDOW` | **3–5 minutes** | Keepers / oracle settle band for GM deposit·withdrawal completion on Arbitrum |
| HL withdrawal settle | `HL_WITHDRAWAL_SETTLEMENT_WINDOW` | **15 minutes** | L1 bridge / withdrawal finality budget before Citadel treats capital as free for re-route |

Gates must not assume instant atomicity across the triangle; inventory accounting holds legs in-flight until the respective window elapses or venue ack confirms.

#### 5.1.1 Strategic Settlement Extensions (V1.5 / V2.0)

| Extension | Settlement role | Horizon | Status |
|-----------|-----------------|---------|--------|
| **Pendle Finance** | PT/YT exit proceeds vs GMX margin shadow accounting before rebalance dispatch — expiry blackhole / oracle decoupling guard | **V1.5** | ✅ Guard code-verified · settlement wire ⏳ |
| **Camelot DEX & Stabilizer** | Zero-slippage stablecoin routing and `GRAIL` liquidity depth for delta-neutral rebalance legs — reduces `FRICTION_BUFFER_APY` drag | **V1.5** | ⏳ Roadmap Spec |
| **Variational** | Same-chain perp hedge settlement window (alternative to HL 15 min withdrawal budget) — cross-venue margin routing | **V2.0** | ⏳ PoC Spec |

See [§2.5 Strategic Blue-Chip Ecosystem & Settlement Roadmap](#25-strategic-blue-chip-ecosystem--settlement-roadmap-v15--v20) for integration anchors.

### 5.2 Active Fee Path (v1.0)

| Item | Definition | Status |
|------|------------|--------|
| **Builder UI Fee** | **+10 bps** `uiFeeReceiver` on every unsigned GMX v2 increase / decrease / deposit payload (`GMX_UI_FEE_BPS`) | ✅ Code-Verified |
| **Referral Rebate** | Up to **25%** of GMX trading fees via registered `referralCode` (`GMX_REFERRAL_CODE_BYTES32`) | ✅ Code-Verified |

### 5.3 Dynamic Target Range (8.2% ~ 11.8%) — Mathematical APY Breakdown

Allocator-facing HUD band — **non-guaranteed**; derived from exogenous Delta-Neutral cash flows with **zero native token emissions**. Full narrative: [`03_RISK_MITIGATION_AND_DISCLAIMER_FRAMEWORK.md` §2.6.2](./03_RISK_MITIGATION_AND_DISCLAIMER_FRAMEWORK.md#262-dynamic-target-range-82--118--mathematical-cash-flow-breakdown).

| Yield Source Leg | Conservative Band (Lower 8.2%) | Bull/Volatile Band (Upper 11.8%) | Payer & Mechanism |
| :--- | :--- | :--- | :--- |
| **GMX v2 ETH/USDC GM Base** | **4.5%** | **6.5%** | GMX trader swap, borrow & closing fees |
| **Skew Rebate & Builder Fee** | **1.0%** (+10 bps UI fee included) | **1.8%** | Positive skew price-impact rebate + `uiFeeReceiver` (+10 bps · `GMX_UI_FEE_BPS`) |
| **Hyperliquid 1× Short Funding** | **3.2%** | **4.2%** | Counterparty long-side funding payment on HL orderbook |
| **Friction & Rebalance Costs** | **−0.5%** (`FRICTION_BUFFER_APY`) | **−0.7%** | Absorbed by Citadel Safety Buffer (basis & slippage) |
| **Net Strategy APY Range** | **8.2%** | **11.8%** | **Exogenous Delta-Neutral Cash Flow (Zero Token Emissions)** |

> **Evaluator defense narrative:** Unlike speculative emission vaults, SliverVine Citadel Shield's **8.2% ~ 11.8%** target range is mathematically grounded in real GMX trading fees, skew rebates, and Hyperliquid short funding rates, guarded by our **0.5% Hurdle Gate** (`FRICTION_BUFFER_APY = 0.005` in `rebalance-rules.ts`).

### 5.4 Hurdle-Rate Probe (Not Product Identity)

> Aave v3 USDC APY on Arbitrum is a **hurdle-rate probe** used when GMX markets wire is unavailable. *(Hurdle-rate probe only — not a yield-stacking product track)*. It does **not** redefine the AI Agent Citadel roadmap (V1.5 = agentic security / [ERC-8196](https://eips.ethereum.org/EIPS/eip-8196) swarms).

| Item | Definition |
|------|------------|
| **Benchmark** | **Aave v3 USDC (Arbitrum) — APY Benchmark** *(Hurdle-rate probe only — not a yield-stacking product track)*; not a live execution adapter |
| **Performance Fee** | **10% of Excess Yield Above Aave Benchmark Rate** *(Hurdle-rate probe only — not a yield-stacking product track)* |
| **Excess Yield** | `max(0, Net Strategy APY − Aave Benchmark APY)` after friction buffer |
| **Status** | **Optional accounting probe** — not accrued on current v1.0 builder UI-fee path (+10 bps `uiFeeReceiver` + 25% referral rebate); **not** the V1.5 Citadel swarm roadmap |

B2B Option B (slippage-savings fee) remains a separate commercial SKU and is not the optional hurdle-rate probe above. V2.0 CaaS monetization is the **10 bps protocol authorization fee** on pre-execution risk checks.

### 5.5 Public Audit Surface

`GET /api/grant-audit` — guard states, TVL, `provenanceVerified`, `sepoliaDualLegProof`. No signing material or proprietary encode paths.

---

## 6. ERC-7579 Pre-Execution Hook Alignment — AI Agent Reflex Architecture

> **Design thesis:** ERC-7579 modular smart accounts provide **permission scope**; SliverVine Protocol provides **reflex speed**. Together they form the pre-execution hook stack that AI agents and institutional vaults require to avoid MEV/LVR traps without surrendering custody.

### 6.1 Two-Plane Hook Stack

| Plane | Component | Latency | Function |
|-------|-----------|---------|----------|
| **① Validator (ERC-7579)** | ZeroDev Kernel v3 modular session module | **&lt;1 ms** | Scoped `ORDER_EXECUTE` · whitelisted target/selector · R06 notional cap · R07 daily clip · R14 re-auth |
| **② Reflex Hook (Wasm + Stylus)** | Edge `checkSoilResistance()` ∥ `SliverVineSoilCoprocessor` | **p50 ~106 µs** Edge · on-chain coprocessor reinforcement | Soil fuse · cross-spread · oracle-lag · depth fail-closed **before** UserOp reaches bundler |

```text
AI Agent Intent (seconds)
 │
 ▼
┌───────────────────────────────────────────────────────────┐
│ ERC-7579 Validator (ZeroDev Kernel v3) │
│ · Session key scope · clip · TTL · callData whitelist │
└─────────────────────────┬─────────────────────────────────┘
 │ UserOp draft passes structural auth
 ▼
┌───────────────────────────────────────────────────────────┐
│ SliverVine Citadel Shield Pre-Execution Reflex Hook (106µs Cerebellum) │
│ Edge: verifyAgentIntent() → evaluateSoilCore() │
│ → checkSoilResistance() [pkg/soil_core.wasm] │
│ On-chain: SliverVineSoilCoprocessor.evaluate_soil_…() │
│ [contracts/stylus-probe/src/lib.rs] │
└─────────────────────────┬─────────────────────────────────┘
 │ AllowedToSign = true
 ▼
 Paymaster → Bundler → EntryPoint → GMX / HL
```

### 6.2 ZeroDev Kernel v3 Validator Module (Pillar 1)

| Hook point | ERC-7579 module role | SliverVine Citadel Shield invariant |
|------------|---------------------|----------------|
| **`validateUserOp`** | Session module verifies scoped signature + callData shape | Whitelisted GMX ExchangeRouter · HL adapter selectors only |
| **`isValidSignature` (ERC-1271)** | Kernel returns `0x1626ba7e` on scoped intent digest | Dual plane: Kernel ERC-1271 ∥ Gate ECDSA m-of-n attestation |
| **Session TTL** | Module-enforced expiry | `DEFAULT_TTL_MS` · heartbeat · deadman switch (`agent-citadel-guard`) |
| **Notional cap (R07)** | `SESSION_KEY_NOTIONAL_CAP_USD` = **$5,000** | Physical severance on breach — no partial fill escape |

**Code anchors:** `src/adapters/arbitrum/zerodev-aa/` · `src/core/agent-citadel-guard.ts` · `src/sdk/agent-intent.ts` · §2.4.2 Kernel v3 / v4 Session Keys.

### 6.3 Stylus Wasm Soil Hook (Pillar 3 Reinforcement)

| Property | Edge Wasm (`pkg/soil_core.wasm`) | Stylus Coprocessor (`contracts/stylus-probe/src/lib.rs`) |
|----------|----------------------------------|----------------------------------------------------------|
| **Entry** | `evaluateSoilCore()` via `@slivervine/citadel-sdk` | `evaluate_soil_coprocessor(spread_bps, depth_usd, slippage_bps)` |
| **Math** | TS fallback + Wasm hot path | u128 fixed-point score · quadratic spread/slippage penalty |
| **Fail-closed** | `depthUsd < minDepthUsd` → trip | `depth_usd < 10_000` → `(false, u64::MAX)` |
| **Status** | ✅ v1.0 Delivered (Sepolia verified) · p50 ~106 µs | ✅ **Code-Verified Coprocessor** · `cargo test` **5/5 PASS** · on-chain deploy **pending** |

**Alignment rule:** Edge remains the **pre-broadcast SSOT** (fastest path). Stylus coprocessor provides **on-chain auditable parity** for grant diligence and future ERC-7579 executor-module co-location on ArbOS — never a weaker substitute for Edge fail-closed gates.

### 6.4 AllowedToSign Predicate (Reflex Contract)

Production decision formula shared by SDK, Worker, and grant-audit telemetry:

```text
allowedToSign =
 injectionOk ∧ digestOk ∧ soilOk ∧ sessionOk ∧ gasOk
 ∧ deadmanOk ∧ armorOk ∧ attOk ∧ wasmOk
```

| Gate | Module | ERC-7579 / Hook role |
|------|--------|---------------------|
| `sessionOk` | `session-key-gates.ts` | ERC-7579 module clip enforcement |
| `soilOk` | `checkSoilResistance()` · Wasm · Stylus | **Pre-execution reflex hook** |
| `attOk` | `SliverVineGate.sol` | Consume-once EIP-712 attestation |
| `deadmanOk` | `agent-citadel-guard.ts` | Cross-venue slippage severance |

### 6.5 AI Agent Integration Surface

> *"These framework adapters provide modular integration specifications for pre-execution risk checks via `@slivervine/citadel-sdk` and REST APIs. In v1.0, active fee-capture and liquidity routing are strictly bound to Arbitrum One GMX v2 GM + HL delta-neutral execution; multi-platform agent fee routing is targeted for V2.0 CaaS monetization."*

| Consumer | Integration | Reflex hook |
|----------|-------------|-------------|
| **Third-party dApps** | `@slivervine/citadel-sdk` · `verifyAgentIntent()` · `withCitadelShield` | Apache-2.0 · sub-ms soil gate |
| **ElizaOS** | ⏳ V1.5 Ecosystem Roadmap / Modular Integration Spec — [`elizaos-action-adapter.ts`](../../examples/adapters/elizaos-action-adapter.ts) · [§0.3](#03-agent-ecosystem-adapters-v15-roadmap) | `checkSoilResistance()` · `withCitadelShield()` |
| **Virtuals GAME** | ⏳ V1.5 Ecosystem Roadmap / Modular Integration Spec — [`virtuals-game-adapter.ts`](../../examples/adapters/virtuals-game-adapter.ts) · [§0.3](#03-agent-ecosystem-adapters-v15-roadmap) | `checkSoilResistance()` · `withCitadelShield()` |
| **LangChain** | Reference harness (evaluator demo) — [§0.3](#03-agent-ecosystem-adapters-v15-roadmap) · [`examples/adapters/`](../../examples/adapters/) | `checkSoilResistance()` · `withCitadelShield()` |
| **Wayfinder (Arbitrum-native)** | ⏳ V1.5 Ecosystem Roadmap / Modular Integration Spec — `@slivervine/citadel-sdk` · `withCitadelShield()` / `verifyAgentIntent()` · [`wayfinder-agent-adapter.ts`](../../examples/adapters/wayfinder-agent-adapter.ts) · [§0.3](#03-agent-ecosystem-adapters-v15-roadmap) | Sub-ms soil gate · ERC-7579 session clip |
| **CrewAI / AutoGen (enterprise)** | ⏳ V1.5 Ecosystem Roadmap / Modular Integration Spec — `SlivervineCrewAIGuardTool` · AutoGen `citadel_soil_guard` · [`crewai-autogen-adapter.py`](../../examples/adapters/crewai-autogen-adapter.py) · [§0.3](#03-agent-ecosystem-adapters-v15-roadmap) | `checkSoilResistance()` · Pillar 2 AML escort boundary |
| **Institutional vaults** | ZeroDev Kernel + Citadel Worker BUSL payload path | ERC-7579 session + 106µs Shield |
| **Grant audit / Dune / PEV** | `GET /api/grant-audit` · **PEV (Prevented Exploit Volume)** · [Dune dashboard](https://dune.com/silvervinelabs/silvervine-citadel-telemetry) · production DuneSQL feed + chart ([`DUNE_DASHBOARD_SPECIFICATION.md`](../telemetry/DUNE_DASHBOARD_SPECIFICATION.md)) | Pillar 2 ingress · Pillar 3 intercepts · 10 bps builder revenue |

**Migration safety:** Kernel v3 → v4 adapter swap (Gatehouse only) — **Shield, Wasm, Stylus coprocessor, and EIP-712 Gate require zero rewrite** (§2.4.2 migration rule).

### 6.6 Architectural Trade-off: Sub-Millisecond AI Agent Rejection Proof vs. EIP-712

> **Sub-ms M2M Rejection Standard** — machine-to-machine agent swarm paths use deterministic session proofs; EIP-712 ECDSA is reserved for human-initiated chain settlement.

| Dimension | EIP-712 ECDSA (Settlement Plane) | HMAC-SHA256 Session Proof (M2M Reflex Plane) |
|-----------|----------------------------------|-----------------------------------------------|
| **Latency budget** | **1.2 ms – 3.5 ms** per sign (secp256k1 + wallet IPC) | **&lt; 12 µs** (`agent-citadel-guard` Edge budget) |
| **Use case** | `SliverVineGate.verifyAndConsume()` · human wallet · on-chain attestation anchor | AI trading swarms · sub-ms reject proofs · Agent Memory audit trail |
| **Non-repudiation** | On-chain verifiable ECDSA · consume-once digest | Cryptographically verifiable session proof bound to Citadel session entropy |
| **DoS vector** | High-frequency agent reject storms stall on signing latency | **~200× latency reduction** vs ECDSA — swarm-safe fail-closed |

**Core thesis:** EIP-712 ECDSA signing introduces **1.2 ms – 3.5 ms** latency overhead, creating a **Denial-of-Service vector** for sub-millisecond AI trading swarms that must reject toxic intents faster than mempool races.

**SliverVine solution:** `agent-citadel-guard` (`src/core/agent-citadel-guard.ts`) utilizes **deterministic HMAC-SHA256 Session Proofs** (&lt; **12 µs** execution budget) for M2M rejection, achieving **~200× latency reduction** while maintaining cryptographically verifiable non-repudiation on the Edge audit plane.

**Formal split:**

| Plane | Standard | SSOT module |
|-------|----------|-------------|
| **M2M Reflex (reject / deadman)** | Sub-ms M2M Rejection Standard — HMAC-SHA256 session proof | `evaluateAgentCitadelGuard()` · `guardAgentUserOp()` |
| **Human / On-chain settlement** | EIP-712 `SliverVineCitadel` v1 · m-of-n Gate attestation | `SliverVineGate.sol` · `evaluateAttestation()` (SDK) |

**G11 UI fingerprint:** Demo HUD badge `GateDomainFingerprintBadge` calls `verifyGateDomainSeparator()` (`src/services/gate-domain-fingerprint.ts`) to compare on-chain `domainSeparator()` against local EIP-712 recompute — detecting hijacked frontends that point at a forged Gate contract.

**License SSOT (G8):** First-party contracts (`SliverVineGate`, `GatedExecutor`, `SliverVineAgentPolicyGuard`, `SliverVineRiskOracle`, `IngressSafetySwitch`, Stylus coprocessor) = **BUSL-1.1** · `@slivervine/citadel-sdk` = **Apache-2.0**.

### 6.7 Architectural Benchmark: SliverVine High-Performance Innovations vs. Legacy Web3 Standards

> **Audit scope:** `src/` · `contracts/` · `SliverVineGate/` — proprietary designs that intentionally depart from conventional ERC/EIP patterns to achieve sub-millisecond HFT reflexes and AI-agent swarm protection.
> **SSOT modules:** `agent-citadel-guard.ts` · `session-key-gates.ts` · `src/services/root-protection-lib/circuit-breaker-sever.ts` · `soil_core.wasm` / `SliverVineSoilCoprocessor`.

| Dimension | Legacy Web3 Standard (ERC/EIP) | SliverVine Engineered Standard | Latency / Gas Improvement | Architectural Reason |
|-----------|-------------------------------|--------------------------------|---------------------------|----------------------|
| **AI Agent Rejection Proof** | [EIP-712](https://eips.ethereum.org/EIPS/eip-712) typed-data ECDSA (secp256k1 + wallet IPC) | **Sub-ms M2M Rejection Standard** — `agent-citadel-guard` deterministic **HMAC-SHA256 Session Proof** (`evaluateAgentCitadelGuard()` · `guardAgentUserOp()`) | **~200×** — **&lt; 12 µs** vs **1.2 – 3.5 ms** (ECDSA) | High-frequency agent reject storms must not block on signing latency; EIP-712 reserved for human / on-chain settlement (`SliverVineGate.verifyAndConsume`) |
| **Session Authorization Gate** | [ERC-4337](https://eips.ethereum.org/EIPS/eip-4337) UserOp → Bundler → EntryPoint validation (network RTT + mempool queue) | **SystemState single-flight** — `assertSessionKeyExecutionGates()` · `assertSigningChannelOpen()` (`session-key-gates.ts` · `hl/auth/signing-gate.ts`) | **~10³–10⁴×** — in-process **&lt; 1 ms** vs **50 – 500 ms+** bundler round-trip | Structural session scope (R06/R07 clip) enforced **before** HL signature leaves Edge; bundler only delivers already-shielded intents |
| **Circuit Breaker / Kill Switch** | OpenZeppelin `Pausable` · on-chain `pause()` (≥ **1 block** · Arbitrum ~250 ms · mainnet ~12 s) | **Edge physical sever** — `severCircuitBreakerPipeline()` R17/R20 (`src/services/root-protection-lib/circuit-breaker-sever.ts`) · `severSigningChannel()` · EIP-712 pipe severed in-process | **~10⁵×** — **&lt; 1 ms** Edge sever vs **≥ 250 ms** on-chain pause | Toxic-fill window closes **before** mempool exposure; `SliverVineGate.halt()` is settlement-plane backup, not hot-path reflex |
| **Risk Oracle Flush** | `Ownable` / `Pausable` admin toggle (mutable · governance delay) | **Irreversible flush** — `SliverVineRiskOracle.applySignedReport(STATUS_SHUTDOWN)` → `isSystemFlushed = true` (one-way poison pill) | Same block on trigger; **zero** post-flush un-pause path | Compliance ingress (`IngressSafetySwitch`) fail-closed without independent admin surface |
| **Soil / Slippage Compute** | EVM Solidity storage reads + oracle `SLOAD` loops (gas-heavy · block-bound) | **Wasm hot path** `pkg/soil_core.wasm` (`#![no_std]`) + **Stylus coprocessor** `evaluate_soil_coprocessor()` (stateless u128 fixed-point) | **~10²×** latency — Edge **p50 ~106 µs** · Wasm warm **&lt; 60 µs** vs multi-ms EVM path; Stylus **stateless** (no storage reads) | Pre-broadcast math must run at HFT reflex speed; on-chain coprocessor = auditable parity, not hot-path substitute |
| **Gate Attestation Model** | Replayable signatures · mutable proxy upgrades | **Consume-once EIP-712** — `consumed[digest]` burned before external call (`SliverVineGate` · `GatedExecutor`) · immutable gate (no proxy) | `verifyAndConsume` **~25.8k – 28k gas** · attestation TTL **≤ 30 s** | One ALLOW cannot be redirected to arbitrary calldata; asymmetric authority (halt immediate · unhalt timelocked) |
| **AA Bundler Compliance** | Blind UserOp retry on bundler rejection | **[EIP-7562](https://eips.ethereum.org/EIPS/eip-7562) Zero-Bundler-Rejection Invariant** — `evaluateStaticBreakerMatrix()` pre-screen (`zerodev-aa-static-breaker.ts`) | Eliminates wasted bundler RTT on toxic UserOps | Soil trip **denies sponsorship + broadcast** serially — no "paid but should-be-blocked" UserOps |
| **RPC / Scraper Defense** | Public RPC endpoint lists · no decoy layer | **Honeypot trap hosts** — `evaluateRpcDefenseGate()` · **99% synthetic slippage** (`rpc-fetch-gate-eval.ts`) | Unauthenticated scrapers fail-closed at **&lt; 1 ms** (no real venue RTT) | Anti-copycat: forked frontends hitting trap hosts receive decoy telemetry, not production state |
| **Frontend Trust Anchor** | Client-trusted `verifyingContract` string | **G11 domain fingerprint** — `verifyGateDomainSeparator()` on-chain `domainSeparator()` vs local EIP-712 recompute | One RPC `eth_call` · HUD badge `GateDomainFingerprintBadge` | Detects hijacked frontends pointing at forged Gate contracts |
| **Pre-Execution vs Post-Execution** | Gauntlet / Chaos Labs parameter dashboards (minutes → days) | **Interceptor Moat** — `checkSoilResistance()` inline before broadcast | **p50 ~106 µs** vs minutes–days governance loop | MEV / LVR damage is prevented, not rebalanced after fill |

**Code anchors (audit trail):**

| Pillar | Legacy pattern avoided | SliverVine SSOT |
|--------|------------------------|-----------------|
| AI Security | EIP-712 on every reject | `src/core/agent-citadel-guard.ts` |
| Session Gate | ERC-4337 bundler as first gate | `src/services/session-key-adapter-lib/session-key-gates.ts` · `src/adapters/hl/auth/signing-gate.ts` |
| Circuit Breaker | On-chain `Pausable` | `src/services/root-protection-lib/circuit-breaker-sever.ts` · `src/services/risk-control-lib/root-protection.ts` |
| Compute Parity | EVM storage-heavy soil math | `pkg/soil_core.wasm` · `contracts/stylus-probe/src/lib.rs` · `src/services/risk-control-lib/soil-resistance.ts` |

### 6.8 Competitive Positioning — Four-Dimensional ASCII Matrices (SliverVine Protocol)

**Entity:** SilverVine Labs · **Protocol:** SliverVine Protocol / SliverVine Citadel (BeΔ)  
**[ERC-8196](https://eips.ethereum.org/EIPS/eip-8196):** Emerging Draft (Virtuals Protocol) — not a finalized standard.

Evaluator-facing comparison of SliverVine Protocol versus legacy execution, agent-wallet, and cross-venue stacks. Complements the §6.7 tabular benchmark.

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
│ 1. Policy Gate Layer      │ ERC-8196 (Emerging Draft Sub-ms Policy Gate)│ On-chain Voting / Delay    │ API Proxy (Centralized)    │
│ 2. Prompt Injection Guard │ R20 Physical Deadlock       │ Vulnerable to Signed Intent│ Bypassable via Jailbreak   │
│ 3. Key Pipe Severing      │ <1ms `severSigningChannel`  │ N/A (Requires On-chain Tx) │ N/A (No On-chain Hook)     │
│ 4. Standard Alignment     │ ERC-8196 (Emerging Draft Sub-ms Policy Gate) · EIP-7562 │ Standard ERC-20 / ERC-721  │ Proprietary REST APIs      │
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

### 6.9 Strategic Blue-Chip Ecosystem & Settlement Integrations (V1.5 / V2.0)

> **Commercial boundary:** v1.0 fee capture and liquidity routing are bound to **GMX v2 GM + HL delta-neutral** execution. Pendle, Camelot, Stabilizer, and Variational integrations extend the pre-execution firewall and settlement plane — see [§2.5](#25-strategic-blue-chip-ecosystem--settlement-roadmap-v15--v20) and [§5.1.1](#511-strategic-settlement-extensions-v15--v20).

| Venue | Integration surface | Reflex hook | Horizon |
|-------|-------------------|-------------|---------|
| **Pendle Finance** | Yield-tokenization / fixed-income agent markets · PT/YT registry + cross-guard | `checkSoilResistance()` · `evaluatePendleGmxCrossGuard()` · maturity &lt;7d + jitter &gt;200 bps fail-closed | **V1.5** |
| **Camelot DEX** | Arbitrum-native `GRAIL` liquidity depth for rebalance routing | Soil fuse on Camelot pool depth · RPC allowlist `api.camelot.exchange` | **V1.5** |
| **Stabilizer** | Zero-slippage stablecoin settle path for delta-neutral friction reduction | Pre-broadcast slippage fuse · rebalance leg binding to `FRICTION_BUFFER_APY` | **V1.5** |
| **Variational** | Next-gen decentralized perps · cross-venue margin routing (HL complement) | `checkSoilResistance()` on Variational orderbook depth · session-key clip (R06/R07) | **V2.0** |

---

## Related Documents

| Document | Purpose |
|----------|---------|
| [`docs/README.md`](../README.md) | Audience router |
| [`docs/ARB_Buildathon/SUBMISSION.md`](../ARB_Buildathon/SUBMISSION.md) | Buildathon submission SSOT |
| [SilverVineLabs/bedelta-living-water](https://github.com/SilverVineLabs/bedelta-living-water) | Public repository |
| [`docs/grants/`](../grants/) | Public grant submissions (GMX · Arbitrum) |
| [`02_STANDARD_COMPLIANCE_AND_EIP_WIKI.md`](./02_STANDARD_COMPLIANCE_AND_EIP_WIKI.md) | ERC/EIP standards wiki · compliance posture · ArbOS/Stylus · RPC/WSS |
| [`CITADEL_SDK_BLUEPRINT.md`](../sdk/CITADEL_SDK_BLUEPRINT.md) | Apache-2.0 SDK API |
| [`../audit/`](../audit/) | Principal audit · Robinhood Chain safety gate |
| [`../../docker/README.md`](../../docker/README.md) | Sidecar |
| [`../grants/arbitrum/ARBITRUM_ONE_PAGER.md`](../grants/arbitrum/ARBITRUM_ONE_PAGER.md) | Grant one-pager |
| `src/services/risk/liquidation-meter.ts` | `DEFAULT_CROSS_MMR = 0.05` |
| `src/services/session-key-adapter-lib/nonce-auto-healing.ts` | HL nonce auto-resync |
| `src/services/execution/twap-engine-v2.ts` | TWAP path planner |

---

## Appendix: Real-World Threat Model & Market Landscape

### Market Adoption Metrics (The Agentic Web Shift)

The Web3 attack surface is shifting from human UI phishing to **autonomous agent execution pipelines**. Industry telemetry indicates the agentic web is already material on-chain:

| Metric | Estimate | Source |
|--------|----------|--------|
| **AI agents deployed** | **17,000+** autonomous on-chain agents | [Dune — ERC-8004: Trustless Agent Activity](https://dune.com/dune/erc-8004-onchain-ai-agents) · [ERC-8004 (EIP)](https://eips.ethereum.org/EIPS/eip-8004) · [Dune AI Agents hub](https://dune.com/agents) |
| **Share of on-chain transactions** | **~19%** agent-attributed activity | [Dune AI Agents](https://dune.com/agents) · [ERC-8004 cross-chain registrations](https://dune.com/queries/6705945) · agent-attribution telemetry (industry estimate) |
| **Daily Active Wallets (DAW) touchpoints** | **~4.5M** wallets interacting with agent frameworks | [Dune AI Agents](https://dune.com/agents) · on-chain wallet–agent interaction dashboards (industry estimate) |

> **Telemetry note:** Figures are order-of-magnitude **industry estimates** for threat-modeling — not audited SliverVine protocol KPIs. Primary on-chain SSOT for agent identity and registration growth is [ERC-8004](https://eips.ethereum.org/EIPS/eip-8004) telemetry on [Dune](https://dune.com/dune/erc-8004-onchain-ai-agents). See also [CryptoRank Symposium — agent-security focus](https://cryptorank.io/news/feed/fae5e-ai-agents-web3-hacking-wyoming-symposium).

**Implication:** Security must evolve from post-hoc dashboards and mutable pause functions to **microsecond Pre-Broadcast Intent Firewalls** — severing toxic calldata **before** Sequencer queues, Bundler ingress, or MEV mempools. Citadel Shield targets this gap at **p50 ~106µs** Edge Wasm evaluation ([§3.5 Wasm Soil Core](#35-wasm-soil-core-m4)) — covering **88%** of the modeled on-chain risk surface per [Risk Framework §0.1](./03_RISK_MITIGATION_AND_DISCLAIMER_FRAMEWORK.md#01-what-slivervine-citadel-shield-does--and-does-not--guarantee); the residual **12%** systemic tail is disclosed with Fail-Closed posture.

### Real-World Case Studies (Why Citadel Shield is Essential)

| # | Case | Loss / Impact | Citadel Alignment | Source |
|---|------|---------------|-------------------|--------|
| **1** | **[Jaredfromsubway.eth $7.5M Exploit (MEV Honeypot Trap)](https://www.blockaid.io/blog/the-predator-becomes-the-prey-how-a-counter-mev-honeypot-drained-75m-from-jaredfromsubway)** | Automated signature logic exploited via malicious permission / honeypot traps | Validates **sub-ms Wasm pre-broadcast** `checkSoilResistance()` + honeypot RPC defense (`evaluateRpcDefenseGate()`) | [Blockaid incident analysis](https://www.blockaid.io/blog/the-predator-becomes-the-prey-how-a-counter-mev-honeypot-drained-75m-from-jaredfromsubway) · [Chainalysis](https://www.chainalysis.com/blog/sandwich-attack-jaredfromsubway-hack/) · [CertiK](https://www.certik.com/blog/jaredfromsubway-mev-bot-incident-analysis) · [The Defiant](https://thedefiant.io/news/hacks/jaredfromsubway-eth-mev-bot-drained-7-5-million-counter-mev-honeypot) |
| **2** | **[Virtuals Protocol / BasisOS ~$531k Unbound Agent Drain](https://finance.yahoo.com/news/ai-agent-virtuals-protocol-stole-114617216.html)** | Unbound agent execution exceeded safe notional envelopes | Validates **R06/R07** · **`SESSION_KEY_NOTIONAL_CAP_USD = $5,000`** ([§3.6](#36-financial-risk-parameters--epoch-operations)) | [KuCoin — Virtuals compensation disclosure](https://www.kucoin.com/news/flash/virtuals-protocol-to-cover-full-compensation-for-basis-security-incident) · [Yahoo Finance](https://finance.yahoo.com/news/ai-agent-virtuals-protocol-stole-114617216.html) |
| **3** | **[ElizaOS / ai16z Fraud & Governance Collapse](https://www.burwick.law/active-cases/ai16z-elizaos-token-lawsuit-doe-v-walters)** | SDNY class-action litigation — raw Node.js prompt wrappers lacked on-chain execution guarantees | Validates **bytecode predicate assertions** ([§0.1](#01-bytecode-predicate-verification-v10--erc-7715--post-grant-design-spec)) · EIP-712 Gate · **LLM back-off cooldown** | [Burwick Law — Doe v. Walters (SDNY)](https://www.burwick.law/active-cases/ai16z-elizaos-token-lawsuit-doe-v-walters) · [CoinDesk](https://www.coindesk.com/markets/2026/08/05/ai-agent-token-once-worth-usd2-4-billion-ends-with-founder-calling-it-dead) · [Decrypt](https://decrypt.co/374958/eliza-ai-token-dead-shuts-down-foundation-lawsuit) |

### Competitive Landscape Matrix

| Dimension | **SliverVine V1.0 (88% Baseline)** | **Wayfinder** | **Virtuals Protocol** | **ElizaOS Framework** | **ZeroDev / Biconomy (ERC-4337 AA)** |
|-----------|-----------------------------------|---------------|-------------------------|----------------------|--------------------------------------|
| **Pre-broadcast severance** | ✅ Sub-ms Wasm soil fuse · 0-Gas fail-closed | ⚠️ Intent routing; **no** sub-ms Wasm severance | ❌ Web2.5 layer; wallets without pre-execution bounds | ❌ No native pre-broadcast gates | ❌ Session keys; **no** AI-context fuse |
| **On-chain immutability** | ✅ 0-proxy Gate · `consumed[digest]` | Varies | Consumer UX focus | Open-source plugins | Strong AA infra |
| **AI behavioral safety** | ✅ 60s LLM cooldown · ±2–5 bps jitter | Limited | Limited | Prompt-only guardrails | N/A |
| **Session blast-radius** | ✅ $5k cap · scoped `ORDER_EXECUTE` | Varies | **Unbound drain risk** | Framework-dependent | ✅ ERC-4337 scopes |
| **Prompt injection immunity** | ✅ Bytecode predicates | Partial | Partial | **Vulnerable** at hook | **Vulnerable** to injected UserOps |

> See also [§0 Competitive Matrix — Pre-Execution vs. Post-Execution Risk](#️-competitive-matrix--pre-execution-vs-post-execution-risk) · [88% Defense Mesh](../ARB_Buildathon/SUBMISSION.md#88-defense-mesh--honest-12-post-grant-rd-blueprint) in [`SUBMISSION.md`](../ARB_Buildathon/SUBMISSION.md) · [Risk Spectrum §0.1](./03_RISK_MITIGATION_AND_DISCLAIMER_FRAMEWORK.md#01-what-slivervine-citadel-shield-does--and-does-not--guarantee) (formal **88% / 12%** + **80/20 Pareto** definition).

### Supplementary Industry References

- **MEV & thin-liquidity** — `checkSoilResistance()` · `evaluateHlOrderbookGapGuard()`
- **$441k+ bot execution error** — [PumpParade / Medium](https://pumpparade.medium.com/ai-trading-bots-lost-441k-in-one-error-heres-what-actually-works-and-what-doesn-t-4f04f890c189)
- **AI antivirus primitives** — [CertiK AI Skill Scanner](https://www.tradingview.com/news/chainwire:d064d7d1f094b:0-certik-launches-ai-skill-scanner-an-antivirus-software-for-the-ai-age/)
- **Institutional agent-security focus** — [CryptoRank Symposium](https://cryptorank.io/news/feed/fae5e-ai-agents-web3-hacking-wyoming-symposium)
