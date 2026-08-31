# SliverVine Protocol — Santenmoku Engine: Technical Specification & Risk Topology

> **Locked Minimum Proposal Baseline:** Vitest **175 test files | 773 tests PASS (100% Clean · Exit Code 0)** · **Current Live Suite:** **175 test files | 773 tests PASS (100% Clean · Exit Code 0)** · Security-tier `5/0/0 PASS` · Defense Matrix `17 Active | 2 Refactored | 1 Deprecated` · Wasm Core `<28kb` Cloudflare budget, `<60µs` execution.
> **This file SSOT:** R01–R20 invariants · dual-engine topology · KV / MDD · settlement & fee bounds.
> **Docs index:** [`docs/README.md`](../README.md) · **Grants:** [`docs/grants/`](../grants/)

**Entity:** SilverVine Labs · **Protocol brand:** SliverVine
**Live proof:** `GET /api/grant-audit` · [bedeltawater.slivervine.xyz](https://bedeltawater.slivervine.xyz)

This document is **invariant-first** (Yellow Paper style): topology, thresholds, and fail-closed semantics. Monetization pitches live under `docs/grants/`.

---

## 0. Unified Institutional Pre-Execution Pipeline

Santenmoku is a **unified sub-millisecond pre-execution gateway**. **Center of gravity = Arbitrum One:** primary venue is GMX v2 ETH/USDC GM + Hyperliquid 1× short, with Pillar 3 Wasm Shield as the technical moat. Permissioned chains (e.g. Robinhood Chain) are **supported ingress examples**, not the product identity.

```text
[ Optional Permissioned Ingress (e.g. Robinhood Chain 46630 / 4663) ]
 │
 ▼
 ┌─────────────────────────────────────────────────────────┐
 │ 1. THE GATEHOUSE (Auth) — ZeroDev Kernel v3 Session Keys│
 │ Scopes agent permissions & eliminates credential drift│
 └──────────────────────┬──────────────────────────────────┘
 │
 ▼
 ┌─────────────────────────────────────────────────────────┐
 │ 2. PILLAR 2: COMPLIANCE INGRESS FIREWALL │
 │ Venue-agnostic unidirectional AML escort & accounting│
 │ Robinhood Chain = inaugural reference adapter │
 │ · ZeroDev Smart Routing Addr (1-Click Deposit/Swap) │
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

| Pillar | Role | SSOT / Mechanism |
|--------|------|------------------|
| **Gatehouse (Auth)** | ZeroDev scoped session keys | Kernel v3 · `ORDER_EXECUTE` bounds · daily gas sponsorship limits · R06 / R07 |
| **Pillar 2: Compliance Ingress Firewall** | **Venue-agnostic unidirectional AML firewall & escort accounting layer** — permissioned ingress sources escort outbound-only into Arbitrum; inbound AML blocked; honest `IN_FLIGHT_BRIDGE_CAPITAL` / Pending-Capital Recognition Invariant (`lostUsd ≡ 0`) labels. **Robinhood Chain (`46630`/`4663`) is the inaugural Code-Verified / Dry-Run Verified reference adapter**, not the product identity. Includes ZeroDev Smart Routing Address for 1-click USDG deposit/swap via `GMX_V2_EXCHANGE_ROUTER_ARBITRUM` (`ZERODEV_SMART_ROUTE_TARGETS`); calldata bound at `GatedExecutor.payloadHash()` | `src/adapters/across-ingress-bridge.ts` · `IngressSafetySwitch.sol` · `ZERODEV_SMART_ROUTE_TARGETS` |
| **Shield (CORE MOAT)** | Sub-ms Wasm pre-execution armor — **primary technical moat** | `checkSoilResistance()` p50 ~106 μs · Wasm warm path &lt;60µs · R01 / R04 |

> *While single components like `checkSoilResistance()` formulas are kept standard and open for seamless `@slivervine/citadel-sdk` adoption across Arbitrum, our core moat lies in the production integration complexity—stitching Rust `#![no_std]` Wasm, Edge Worker execution, and EIP-712 Gate into a sub-ms, fail-closed system.*

## ⚔️ Competitive Matrix — Pre-Execution vs. Post-Execution Risk

| Feature / Dimension | Legacy Providers (Gauntlet / Chaos Labs) | SliverVine Citadel Gate (Pillar 3) |
| :--- | :--- | :--- |
| **Execution Phase** | Post-execution dashboards & multi-day governance parameter updates | **Pre-execution inline interception** (Sub-ms BEFORE mempool broadcast) |
| **Latency / Hot-Path** | Minutes to Days (Off-chain simulations + DAO votes) | **p50 ~106 µs** (Rust `#![no_std]` Wasm engine on Edge) |
| **Protection Level** | Global protocol parameter tuning (LTV, Collateral factors) | **Granular tx-level & LP soil protection** (MEV, RPC jitter, Oracle lag) |
| **Deployment Model** | Advisory / SaaS Analytics | **Inline Edge Gate & Open-Source Wasm SDK** (`@slivervine/citadel-sdk`) |

### 0.1 Bytecode Predicate Verification (v0.9) & ERC-7715 (⏳ V1.0 Design Spec)

SilverVine does not interpret natural-language LLM prompts. The Shield enforces **Asymmetric Predicate Bytecode Hard Assertions** against ERC-4337 UserOp calldata inside the sub-ms Wasm core (p50 ~106 μs), with ZeroDev Kernel v3 as the **v0.9** modular session-key adapter.

> **ERC-7715 (Advanced Wallet Permissions):** ⏳ **Planned / V1.0 Design Spec** — evolution target for Gatehouse permission surfaces; **not shipped in v0.9**. Adapter swap path is documented for future ZeroDev / Offchain Labs integration without Shield or Wasm rewrite.

| Invariant | Mechanism | Status |
|-----------|-----------|--------|
| **Receiver Invariant** | Decode GMX v2 parameters from UserOp bytecode; assert `sender ≡ receiver` before any L2 broadcast. | ✅ v0.9 Code-Verified |
| **Parameter Invariant** | Bound-check `acceptablePrice` (and related execution params) against oracle-lag sensors; fail-closed on drift. | ✅ v0.9 Code-Verified |
| **Unidirectional Outbound Escort** | Pillar 2 enforces venue-agnostic outbound-only escort into Arbitrum `42161`; inbound AML contamination is blocked at the Compliance Ingress Firewall. Robinhood Chain (`46630`/`4663`) is the inaugural reference adapter. | ✅ v0.9 Code-Verified |

### 0.2 v0.9 Delivered Scope vs V1.0 Roadmap

| Horizon | Status | Scope |
|---------|--------|-------|
| **v0.9 Delivered (100% Code & Tested)** | ✅ Code-Verified (Sepolia & Dry-Run) | Sub-ms Wasm Soil Engine · ZeroDev Kernel v3 Session Key Adapter · Restored Deadman Switch (`agent-citadel-guard`) · Unidirectional Robinhood AML Bridge Escort · GMX **+10 bps** UI Fee · **175 test files | 773 tests PASS (100% Clean · Exit Code 0)** |
| **v0.9 Active Target** | ✅ Code-Verified (Sepolia & Dry-Run) | Single blue-chip anchor: **GMX v2 ETH/USDC GM Pool** + Hyperliquid **1× short** hedge · Mainnet deployment ties to **M6 Grant distribution** |
| **v0.9 Partial — HL Orderbook Gap Guard** | ✅ Code-Verified | `evaluateHlOrderbookGapGuard()` in [`hl-orderbook-gap-guard.ts`](../../src/services/risk-control-lib/hl-orderbook-gap-guard.ts) · wired via [`soil-resistance.ts`](../../src/services/risk-control-lib/soil-resistance.ts) — gap-window leverage scale-down + 2× depth floor |
| **V1.0 Isomorphic Extension** | ⏳ Planned | **BTC/USDC GM Pool** — zero bytecode / Wasm changes; config-driven market address mapping |
| **V1.0 Roadmap (Planned Post-Grant)** | ⏳ Planned | **Citadel-as-a-Service (CaaS)** — productize `@slivervine/citadel-sdk` as an open sub-ms risk layer for the Arbitrum ecosystem · **Hedge Leg Depth Guard (full product)** — extends v0.9 `evaluateHlOrderbookGapGuard()` into dedicated Hyperliquid L2 orderbook depth sensing prior to hedge execution (zero-market-impact 1× short even during flash-liquidity drawdowns) · On-chain ECDSA Signer Recovery Verification · Production Smart Contract Deployment for GM Vaults · Native **USDG Robinhood Chain Treasury routing** |

**Demo:** `pnpm run demo:e2e` — 5-step grant E2E (Intent+Deadman → Robinhood escort → GMX underweight → HL Session hedge → R20 Panic Flash).

---

## 1. Core Product Identity

**Primary product (center of gravity):** **Delta-Neutral GM Yield Engine on Arbitrum One** — GMX v2 **ETH/USDC** GM pool + Hyperliquid **1× short hedge**, guarded by Pillar 3 sub-ms Wasm Shield (`checkSoilResistance()`).

| Component | Venue | Role |
|-----------|-------|------|
| **Yield base (PRIMARY)** | Arbitrum One · GMX v2 ETH/USDC GM | Underweight-side GM LP · builder `uiFeeReceiver` (**+10 bps**) · Citadel pre-execution gate |
| **Hedge** | Hyperliquid | Session-key **1× short** Emergency Liquidity Sponge · nonce-healed signing |
| **Ingress (optional example)** | Robinhood Chain | Supported permissioned institutional ingress source — **not** the product identity |

**Robinhood Chain role:** Supported permissioned ingress example only — regulated treasuries may escort outbound (`46630`/`4663` → `42161`). Inbound AML is blocked by default. Product identity remains **Arbitrum One Delta Pool**.

### 1.1 Engineering Restraint (Blue-Chip Scope)

v0.9 is intentionally restricted to **ETH/USDC** so oracle reliability holds during Sequencer desync: one blue-chip pair removes multi-asset de-peg and FX-slippage surfaces while the Tri-Sensor Matrix (base-fee velocity, RPC jitter, phase-shift) remains authoritative.

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
| **Yield base (PRIMARY)** | Arbitrum One · GMX v2 GM | Underweight-side GM LP · builder `uiFeeReceiver` · Citadel pre-execution gate |
| **Hedge** | Hyperliquid | Session-key **1× short** Emergency Liquidity Sponge · nonce-healed signing |
| **Ingress (optional example)** | Robinhood Chain | Supported permissioned institutional ingress · outbound-only escort into Arbitrum · **ZeroDev Smart Routing Address** (USDG → GMX `ExchangeRouter`) |

**Control plane:** Cloudflare Edge Worker (`SystemState` SSOT) evaluates sequencer · oracle lag · soil · RPC radar before any unsigned GMX payload or HL hedge dispatch. Routing is unidirectional into `SystemState`; venue adapters never mutate peer books without a gate pass.

**Read API:** `GET /api/yield/triangle` — structural APY / depth / gate status across HL · GMX (Robinhood Chain ingress stub stacked via egress escort).

### 2.1 Segregated Tranches

Solidity vault surface splits capital into two non-fungible risk lanes:

| Tranche | Chain policy | Behavior |
|---------|--------------|----------|
| **Permissioned RWA Tranche** | Robinhood Chain **4663** inbound **BLOCKED** at Edge protocol filter | Institutional / RWA-tagged deposits only · **`src/adapters/across-ingress-bridge.ts`** AML inbound block · **`IngressSafetySwitch`** oracle flush + address blacklist · no permissionless public mint path from 4663 |
| **Permissionless DeFi Tranche** | Arbitrum One + HL | Open GM / hedge flow behind Citadel fail-closed gate · standard DeFi UX |

**Invariant:** RWA capital on the permissioned lane cannot be atomically reminted into the permissionless DeFi tranche without an explicit, audited bridge + compliance gate (Across + AA). Chain **4663 → Arbitrum** inbound is denied by default; Testnet **46630** remains the active integration sandbox.

**On-chain anchors:** [`contracts/IngressSafetySwitch.sol`](../../contracts/IngressSafetySwitch.sol) · [`contracts/SliverVineRiskOracle.sol`](../../contracts/SliverVineRiskOracle.sol).

**Arbitrum Sepolia (421614) — verified deployment addresses:**

| Contract | Role | Verified Address (Sepolia) |
|----------|------|----------------------------|
| **Deployer / Admin / Signer** | OpSec-isolated Forge broadcast signer · gate stack admin | `0xbd65d785Dac74EBa9efFdB357b2dC52fCC26EC7F` |
| `SliverVineGate` | Consume-once EIP-712 attestation anchor | `0xb174118bc0B84e8D6D59EEF2339e29bF7FCf8BF1` |
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

### 2.3 ZeroDev Smart Routing Address (Pillar 2 Surface — 1-Click Crosschain Deposit/Swap)

**Pillar 2 context:** This section documents one **production surface** of the Compliance Ingress Firewall — ZeroDev Kernel UserOp routing from permissioned ingress (Robinhood `46630`/`4663` **USDG** as inaugural reference adapter) to Arbitrum GMX execution. **`GMX_V2_EXCHANGE_ROUTER_ARBITRUM`** (`ZERODEV_SMART_ROUTE_TARGETS` · `gmx-revenue.ts`) → **`GM_ETH_USDC`** pool — single-click cross-chain deposit/swap, no hot-wallet custody.

**Payload binding (calldata-level, Gate struct unchanged):** `buildGmxSmartRoutePayloadBinding()` encodes smart-route calldata → `computeGatedExecutorPayloadHash()` mirrors on-chain `GatedExecutor.payloadHash(initiator, target, keccak256(data), nonce)`. The digest fills the existing `RiskAttestation.payloadHash` field — **`SliverVineGate.sol` `ATTESTATION_TYPEHASH` and struct layout are not modified**.

Anchors: [`gmx-smart-route-payload-binding.ts`](../../src/services/adapters/gmx-smart-route-payload-binding.ts) · [`gated-executor-payload.ts`](../../src/sdk/gated-executor-payload.ts) · [`r-chain-yield-router.ts`](../../src/adapters/robinhood/r-chain-yield-router.ts) · [`GatedExecutor.sol`](../../SliverVineGate/src/GatedExecutor.sol).

### 2.4 Pillar 1 — ZeroDev Account Abstraction (Deep Specification)

> **Status:** v0.9 production SSOT = **Kernel v3** (`ZERODEV_KERNEL_VERSION` v0.3.1 · EntryPoint v0.7); **Kernel v4** = V1.0 alignment path (Gatehouse adapter upgrade only — **no rewrite** of Shield / Wasm / EIP-712 Gate).

#### 2.4.1 Why ZeroDev Is the Foundation of BDLW's Non-Custodial 106 µs Execution Pipeline

BeDelta Living Water's product promise is **institutional pre-execution gate (p50 ~106 µs) + non-custodial capital flow**. Without a unified **smart-account execution plane**, the system would fall back to EOA multisig or hot-wallet custody — breaking `lostUsd ≡ 0` and compliance narrative.

ZeroDev provides three capabilities BDLW **cannot replicate in-house**:

| Capability | Without ZeroDev | With BDLW + ZeroDev integration |
|------------|-----------------|-------------------------------|
| **Scoped Session Keys** | Full private keys or manual multisig | Kernel modular `ORDER_EXECUTE` · R06/R07 notional cap · TTL auto-expiry |
| **Paymaster sponsorship** | Institutions must prefund multi-chain gas | `zerodev.sponsorUserOperation` · per-op ≤ $0.50 · daily $10 circuit breaker |
| **Bundler standard path** | Self-hosted relayer expands trust surface | EntryPoint v0.7 + **EIP-7562** compliant UserOp · fail-closed · no blind retry |

**Execution pipeline coupling (106 µs semantics):**

```text
UserOp draft → verifyAgentIntent() [Edge Shield · p50 ~106µs]
 → evaluateStaticBreakerMatrix() [soil + gas ledger]
 → Paymaster sign → Bundler → EntryPoint → Kernel validateUserOp
```

The Shield decides **before broadcast**; ZeroDev handles **non-custodial account delivery only**. Citadel never holds user keys or principal — capital remains in the **Kernel `sender` smart account** (R06–R07 · ERC-7579).

#### 2.4.2 Kernel v3 / v4 Session Keys (ERC-7579 Modular Permissions)

| Dimension | Kernel v3 (v0.9 delivered) | Kernel v4 (V1.0 alignment) |
|-----------|------------------------------|------------------------------|
| **Module standard** | ERC-7579 modular session keys | v4 unified permission surface · ZeroDev "One Stack" |
| **Permission scope** | `ORDER_EXECUTE` · whitelisted `callData` target/selector | Same R06 semantics · extended Smart Routing cross-chain session scope |
| **Notional cap** | `SESSION_KEY_NOTIONAL_CAP_USD` = **$5,000** (R07) | Config-driven · invariant formulas unchanged |
| **TTL / re-auth** | Session TTL + R14 EIP-712 5-min re-auth | v4 Authorize stage native alignment · adapter swap only |
| **Signature path** | Kernel `isValidSignature` → ERC-1271 `0x1626ba7e` | Dual plane: Kernel ERC-1271 ∥ Gate ECDSA m-of-n |
| **Code anchors** | `src/adapters/arbitrum/zerodev-aa/` · `hl-session/permissions.ts` | ⏳ V1.0 adapter swap · **Shield / Wasm zero rewrite** |

**Migration rule:** Kernel v3 → v4 replaces Gatehouse adapters only (`zerodev-aa-userop.ts` · `zerodev-aa-gate.ts`); `checkSoilResistance()`, `pkg/soil_core.wasm`, and `SliverVineGate.sol` **do not change** with Kernel major version.

#### 2.4.3 Paymaster Gas Sponsorship (Sponsorship & Circuit Breakers)

| Parameter | Value | SSOT |
|-----------|-------|------|
| Per-UserOp sponsorship cap | **$0.50 USD** | `MAX_GAS_COST_PER_USEROP_USD` |
| 24h rolling sponsorship budget | **$10 USD** | `DAILY_SPONSORSHIP_LIMIT_USD` |
| Trip code | `ZERODEV_GAS_LIMIT_EXCEEDED_TRIP` | `zerodev-aa-static-breaker.ts` |
| Paymaster middleware | `zerodev.sponsorUserOperation` | `zerodev-aa-userop.ts` |
| Persistence (optional) | KV `zerodev:aa:gas:ledger` · TTL 86,400s | `zerodev-aa-gas-ledger.ts` |

Sponsorship and soil fuse are **serially evaluated**: `evaluateStaticBreakerMatrix()` runs `checkSoilResistance()` first, then `evaluateSponsoredGasLimits()` — on soil trip, **both sponsorship and broadcast are denied**, preventing "paid but should-be-blocked" UserOps from reaching the bundler.

#### 2.4.4 EIP-7562 Zero-Bundler-Rejection Invariant

**Zero-Bundler-Rejection Invariant:** Citadel UserOps MUST NOT trigger EIP-7562 opcode/storage violations during the validation phase; bundler rejection is a **protocol fault**, not a retry signal.

| Rule | Enforcement |
|------|-------------|
| Validation-phase storage reads | Session-key modules restrict `callData` to whitelisted target/selector — no forbidden cross-contract reads |
| Edge pre-screen | Static breaker + `checkSoilResistance()` before `sendUserOperation()` |
| Fail-closed | Bundler unreachable · missing EP v0.7 · timeout → `BUNDLER_TIMEOUT_FAIL_CLOSED` (`ZERODEV_BUNDLER_FAIL_CLOSED_TIMEOUT_MS` = 3,000 ms) |
| Probe | `supportsEntryPoint07` · `zerodev-aa-bundler.ts` smoke probe |

This invariant ensures institutional UserOps are **predictably deliverable** on Arbitrum bundler infrastructure — not silently dropped for storage violations — consistent with the 106 µs Shield fail-closed philosophy.

#### 2.4.5 ZeroDev v4 "Seven Stages, One Stack" Alignment Roadmap

ZeroDev v4 converges the smart-wallet lifecycle into **seven stages, one stack**. BDLW aligns five **execution-critical stages** (Recover / Compose marked V1.0):

| Stage | ZeroDev v4 semantics | BDLW integration anchor | Status |
|-------|---------------------|-------------------------|--------|
| **① Sign in** | Identity · Kernel account resolution | ZeroDev login → `sender` Kernel address · no hot-wallet seed | ✅ v0.9 |
| **② Fund** | Cross-chain deposit · Smart Routing | `ZERODEV_SMART_ROUTE_TARGETS` · USDG → GMX ExchangeRouter (§2.3) | ✅ v0.9 |
| **③ Gas** | Paymaster sponsorship | `zerodev-aa-gas-ledger` · per-op / daily caps (§2.4.3) | ✅ v0.9 |
| **④ Authorize** | Session key scope | ERC-7579 `ORDER_EXECUTE` · R06/R07 · R14 re-auth | ✅ v0.9 (v4 adapter ⏳) |
| **⑤ Execute** | UserOp broadcast · on-chain execution | `verifyAgentIntent()` → Shield → Bundler → GMX/HL venue | ✅ v0.9 |
| **⑥ Recover** | Account recovery · social recovery | — | ⏳ V1.0 |
| **⑦ Compose** | Multi-step intent composition | 2PC intent ledger · `intent-ledger.ts` (partial coverage today) | ⏳ V1.0 |

```text
Sign in ──► Fund ──► Gas ──► Authorize ──► Execute
 │ │ │ │ │
 Kernel Smart Paymaster Session Shield 106µs
 Account Route Ledger Keys R06 + Venue
```

**One Stack semantics:** All five stages share one Kernel account, `sender` identity, and Citadel `AllowedToSign` predicate — institutions need not switch wallets between Robinhood Chain and Arbitrum One or repeat onboarding.

---

## 3. Cross-Venue Risk Engine & Defense Matrix (R01–R20)

### 3.1 Microsecond Moats

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

> **Not in v0.9 codebase.** Documented cold-path / hot-signing architecture for future hardened key isolation.

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

### 3.3 Defense Matrix (R01–R20) — Day-1 SSOT vs v0.9

**Status:** **17 Active | 2 Refactored | 1 Deprecated**

Core invariants: Edge / Session / Saga (`src/services/`, `src/core/`, `src/adapters/`).
L1 lock: `SliverVineGate.sol` consume-once attestation. SDK surface: [`../sdk/CITADEL_SDK_BLUEPRINT.md`](../sdk/CITADEL_SDK_BLUEPRINT.md).

| ID | Name | Status | Code SSOT |
|----|------|--------|-----------|
| **R01** | Soil Resistance | Active | `soil-resistance.ts` + Wasm `pkg/soil_core.wasm` |
| **R02** | VineWrap / rootProtection | Active | `root-protection.ts` |
| **R03** | L2 Book Fail-Closed (500ms) | Active | `hl-l2-book-types.ts` |
| **R04** | PGATE Latency (200ms) | Active | `PGATE_MAX_LATENCY_MS` |
| **R05** | SpoofBuster | Deprecated | Superseded by soil / depth gate |
| **R06** | Scoped Session Key `ORDER_EXECUTE` | Active | `hl-session/permissions.ts` |
| **R07** | Notional Cap $5,000 | Active | `SESSION_KEY_NOTIONAL_CAP_USD` |
| **R08** | Nonce Auto-Healing | Refactored | `nonce-auto-healing.ts` |
| **R09** | Two-Phase Saga | Active | `intent-ledger.ts` |
| **R10** | Auto-Compensating Flatten | Active | `flatten-hardlock.ts` |
| **R11** | Dynamic Account Risk Ceiling (V0.8 Baseline: Equity-Weighted SL; V1.0 Mainnet: Dynamic Adaptive Engine) | Active | `effective-max-sl.ts` |
| **R12** | Leverage Scaling 3x→1x→Halt | Active | `funding-regime-guard.ts` |
| **R13** | Black-Swan Speed-Halt | Active | `black-swan-guard-core.ts` |
| **R14** | EIP-712 Re-Auth (5-min) | Active | `unlock-reauthorization.ts` |
| **R15** | CCXT Fault Harness | Refactored | `safe-exchange-fetch.ts` · `chase-engine.ts` |
| **R16** | SHA-256 5-TX Anchor | Active | `verified-5tx-lib/` |
| **R17** | Daily Loss Severance | Active | `circuit-breaker.ts` |
| **R18** | KV Hardlock 24h | Active | `kv-lib/keys.ts` TTL 86_400s |
| **R19** | `SESSION_ENTROPY_SEED` | Active | `layout-metric-provider.ts` |
| **R20** | Physical Deadlock `R20_FLATTEN_FAILED` | Active | flatten-hardlock + sever |

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

### 3.5 Wasm Soil Core (M4)

- Artifact: `pkg/soil_core.wasm` (`#![no_std]`)
- Budget: **&lt;28kb** Cloudflare · hot-path exec **&lt;60µs**
- Wire: `src/sdk/soil-wasm.ts` (production); TS sim fallback for dev

### 3.6 Financial Risk Parameters & Epoch Operations

| Layer | Parameter | Value / Rule | Status |
|-------|-----------|--------------|--------|
| **Active v0.9 Controls** | Single-order notional cap | **$5,000 USD** (`SESSION_KEY_NOTIONAL_CAP_USD`) | ✅ Code-Verified |
| **Active v0.9 Controls** | Protocol UI fee accrual | **+10 bps** `uiFeeReceiver` (`GMX_UI_FEE_BPS`) + up to **25%** referral rebate | ✅ Code-Verified |
| **Active v0.9 Controls** | Emergency margin buffer | **5%** (`DEFAULT_CROSS_MMR = 0.05`) | ✅ Code-Verified |
| **Active v0.9 Controls** | Circuit breakers | **R17** daily-loss severance · **R20** physical deadlock / flatten-fail | ✅ Code-Verified |
| **Vault Operational Spec (V1.0 Roadmap)** | Alpha Vault Cap | **$100,000** hard TVL ceiling | ⏳ Planned |
| **Vault Operational Spec (V1.0 Roadmap)** | Epoch batching | **4-hour** epoch windows for cross-venue execution | ⏳ Planned |
| **Vault Operational Spec (V1.0 Roadmap)** | Deposit cooldown | **24-hour** minimum hold to prevent flash arbitrage | ⏳ Planned |

---

## 4. Standard Compliance & ERC/EIP Wiki

Official infrastructure standards map — each row links a public ERC/EIP (or venue spec) to Citadel implementation anchors and verification. Subsection **§4.0** is the formal wiki for AA, attestation, and asset-escrow standards.

| Standard | Role in Citadel | Implementation anchor | Verification |
|----------|-----------------|----------------------|--------------|
| **[ERC-4337](https://eips.ethereum.org/EIPS/eip-4337)** | Account Abstraction — scoped agent UserOps without hot-wallet custody | ZeroDev Kernel **v0.3.1** · EntryPoint **v0.7** · `src/adapters/arbitrum/zerodev-aa/` · `zerodev-aa-userop.ts` | ZeroDev AA gate · `eth_supportedEntryPoints` probe · aa-adapter tests |
| **[EIP-7562](https://eips.ethereum.org/EIPS/eip-7562)** | AA storage-access rules — **Zero-Bundler-Rejection Invariant** | Session-key `callData` whitelist · static breaker · `BUNDLER_TIMEOUT_FAIL_CLOSED` | Bundler smoke probe · `zerodev-aa-bundler.ts` |
| **[EIP-712](https://eips.ethereum.org/EIPS/eip-712)** | Typed structured data hashing · domain binding `SliverVineCitadel` | `SliverVineGate.sol` · `src/sdk/constants.ts` · `evaluateAttestation()` | Forge I1–I12 · SDK citadel tests |
| **[ERC-1271](https://eips.ethereum.org/EIPS/eip-1271)** | Contract signature validation for Kernel smart accounts | ZeroDev Kernel `isValidSignature` · Gate ECDSA m-of-n on `RiskAttestation` | Gate Forge suite · agent-intent SDK |
| **[ERC-20](https://eips.ethereum.org/EIPS/eip-20) / [ERC-777](https://eips.ethereum.org/EIPS/eip-777)** | Non-custodial asset transfer & in-flight escrow semantics | `GMX_USDC_ARBITRUM` · `src/adapters/across-ingress-bridge.ts` · `GatedExecutor` payload binding | Across bridge tests · GMX payload tests |
| **[OpenZeppelin Contracts v5](https://docs.openzeppelin.com/contracts/5.x/)** | On-chain gate access control & reentrancy guard | `SliverVineGate.sol` · OZ `ECDSA.tryRecover` alignment · `IngressSafetySwitch.sol` is a stateless compliance filter (no OZ import) | Foundry Gate **60 passed** · Forge property fuzz |
| **[ERC-7579](https://eips.ethereum.org/EIPS/eip-7579)** | Modular smart-account modules — session-key permission scopes | ZeroDev Kernel v3 modular session keys · scoped `ORDER_EXECUTE` clip · daily gas sponsorship limits | Gatehouse (Pillar 1) · agent-intent SDK |
| **[EIP-1559](https://eips.ethereum.org/EIPS/eip-1559)** | Dynamic base-fee congestion sensing on Arbitrum One | Tri-Sensor **BaseFee Velocity** channel · `arbitrum-gas-guard.ts` | Gas-guard tests · Tri-Sensor Matrix |
| **ArbOS 61** | Arbitrum L2 execution / Stylus co-residence alignment (⏳ V1.0 Design Spec) | `IngressSafetySwitch.sol` · Elara ingress design · Stylus WASM parity path | Robinhood safety contracts · audit notes |
| **Robinhood Chain Ingress** | Permissioned institutional egress · AML inbound isolation | Chains **46630** (testnet) / **4663** (mainnet filter) · Across bridge · `IngressSafetySwitch.sol` | Robinhood Across bridge tests · audit snapshot |
| **WASM Core (`soil_core`)** | Sub-ms pre-execution soil fuse · Cloudflare Edge hot path | `pkg/soil_core.wasm` · `#![no_std]` Rust · budget **&lt;28 KiB** · warm exec **&lt;60 µs** | Wasm feasibility suite |

### 4.0 ERC/EIP Standards Reference Wiki

#### ERC-4337 — Account Abstraction & UserOperation Structure

> **Deep specification:** §2.4 Pillar 1 — ZeroDev Account Abstraction (Kernel v3/v4 · Paymaster · EIP-7562 · v4 Seven Stages roadmap).

| Field | Citadel binding |
|-------|-----------------|
| **EntryPoint** | `entryPoint07Address` — SSOT `ZERODEV_ENTRY_POINT_ADDRESS` |
| **Kernel** | ZeroDev Kernel **v0.3.1** (`ZERODEV_KERNEL_VERSION`) — v4 adapter swap ⏳ V1.0（§2.4.2） |
| **UserOp draft** | `sender` · `nonce` · `callData` · optional `factory`/`factoryData` · gas limits · `paymaster`/`paymasterData` · `signature` |
| **Paymaster** | ZeroDev `zerodev.sponsorUserOperation` — per-op ≤ $0.50 · daily $10 · `zerodev-aa-gas-ledger.ts` |
| **Pre-broadcast gate** | `verifyAgentIntent()` — `AllowedToSign = Injection ∧ Digest ∧ Soil ∧ Session ∧ Gas ∧ Attestation ∧ Armor ∧ Wasm` |
| **106 µs coupling** | Shield (`checkSoilResistance`) runs **before** paymaster sign + bundler dispatch — ZeroDev delivers, Citadel decides |

UserOps are drafted locally, sponsored via ZeroDev paymaster middleware, and submitted only after Edge soil + static-breaker evaluation. Bundler RPC MUST advertise EntryPoint v0.7 (`supportsEntryPoint07`). ZeroDev is the **non-custodial execution substrate**; Citadel Edge is the **pre-broadcast decision SSOT** (§2.4.1).

#### EIP-7562 — Account Abstraction Storage Access Rules

**Zero-Bundler-Rejection Invariant:** Citadel UserOps MUST NOT violate EIP-7562 opcode/storage rules during the validation phase; bundler rejection is treated as a **protocol fault**, not a retry signal. See §2.4.4.

| Rule | Enforcement |
|------|-------------|
| Validation-phase storage reads | Session-key modules restrict `callData` to whitelisted targets/selectors — no forbidden cross-contract reads |
| Edge pre-screen | `evaluateStaticBreakerMatrix()` — soil first, then gas ledger, before `sendUserOperation()` |
| Fail-closed | Bundler unreachable, missing EP v0.7, or timeout → `BUNDLER_TIMEOUT_FAIL_CLOSED` (`ZERODEV_BUNDLER_FAIL_CLOSED_TIMEOUT_MS` = 3_000`) |
| Verification | `zerodev-aa-bundler.ts` · `supportsEntryPoint07` probe · aa-adapter Vitest suite |

#### EIP-712 — Typed Structured Data Hashing & Domain Binding

| Component | Value |
|-----------|-------|
| **Domain `name`** | `SliverVineCitadel` (`EIP712_DOMAIN_NAME`) |
| **Domain `version`** | `1` (`EIP712_DOMAIN_VERSION`) |
| **Domain `chainId`** | Live `block.chainid` — cached immutable in Gate constructor |
| **Domain `verifyingContract`** | `SliverVineGate` address (`SLIVERVINE_GATE_ADDRESS`) |
| **Primary type** | `RiskAttestation(bytes32 payloadHash, address subject, uint8 verdict, uint16 riskBps, uint64 issuedAt, uint64 expiresAt, uint256 nonce)` |
| **Digest** | `keccak256("\x19\x01" ‖ domainSeparator ‖ structHash)` — single-use via `consumed[digest]` at `verifyAndConsume` |

SDK envelopes mirror Gate domain binding: `evaluateAttestation()` rejects mismatched `verifyingContract` or `domainName`. Cross-chain replay is denied at L1 consumption.

#### ERC-1271 — Standard Signature Validation Method for Contracts

| Path | Mechanism |
|------|-----------|
| **Kernel (ERC-4337)** | ZeroDev Kernel validates session-key proofs via `isValidSignature(bytes32 hash, bytes signature)` — magic value `0x1626ba7e` |
| **Gate (L1 attestation)** | m-of-n ECDSA on `RiskAttestation` EIP-712 digest — OZ-aligned `ECDSA.tryRecover`, non-malleable `s` |
| **UserOp `signature`** | Module-bound session proof consumed by Kernel validation hook, not raw EOA sig |

Edge `verifyAgentIntent()` validates attestation envelope shape; on-chain ERC-1271 / ECDSA verification occurs at Kernel validateUserOp and Gate `verifyAndConsume` respectively.

#### ERC-20 / ERC-777 — Non-Custodial Asset Transfer Escrow Semantics

| Semantics | Rule |
|-----------|------|
| **Collateral SSOT** | USDC on Arbitrum (`GMX_USDC_ARBITRUM`) — GMX v2 increase/decrease payloads |
| **No indefinite custody** | Protocol never books user principal as protocol-owned; capital remains in user Kernel account or venue GM position |
| **In-flight bridge escrow** | Outbound Robinhood → Arbitrum Across legs labelled `IN_FLIGHT_BRIDGE_CAPITAL`; `lostUsd ≡ 0` until timeout (`BRIDGE_TIMEOUT_FAIL_CLOSED`) |
| **Venue settlement** | GMX async keeper window **3–5 min**; HL withdrawal **15 min** — inventory held in-flight, not escrowed by Gate |
| **ERC-777** | Not on Citadel hot path; ERC-20 `transfer`/`approve` invoked only via Kernel-scoped UserOp `callData` to whitelisted contracts |

`GatedExecutor.payloadHash()` binds UserOp `callData` to Gate `RiskAttestation.payloadHash` — asset movements without matching attestation revert on-chain.

### 4.1 Compliance Posture

- **ERC-4337:** UserOps pass Edge `verifyAgentIntent()` before bundler dispatch; EntryPoint v0.7 + Kernel v0.3.1 are canonical; gas ledger caps per-UserOp and daily sponsorship.
- **EIP-7562:** Zero-Bundler-Rejection Invariant — session modules + Edge pre-screen prevent validation-phase storage violations; bundler failure is fail-closed, not retried blindly.
- **EIP-712:** All Gate attestations and SDK envelopes bind `chainId` + `verifyingContract` + domain `SliverVineCitadel` — cross-chain replay denied at `verifyAndConsume`.
- **ERC-1271:** Kernel session-key signatures validated via standard magic value; Gate path uses ECDSA m-of-n — dual validation planes, neither bypasses the other.
- **ERC-20 / ERC-777:** Non-custodial escort — in-flight capital labelled, never booked as loss; ERC-777 hooks excluded from hot path.
- **OpenZeppelin Contracts v5:** Gate contracts enforce fail-closed access control and reentrancy-safe execution patterns; `SliverVineGate` ECDSA verification intentionally matches OZ `ECDSA.tryRecover` (strict 65-byte, non-malleable `s`).
- **ERC-4337 / ERC-7579:** Session modules enforce clip + TTL caps alongside UserOp structure constraints.
- **EIP-1559:** Gas-yield ratio fuse blocks dispatch when L1 surcharge exceeds target yield band.
- **Robinhood Chain:** Outbound-only escort (`46630`/`4663` → `42161`); inbound AML blocked · `lostUsd ≡ 0`.
- **WASM:** Hot-path soil evaluation mirrors Edge `checkSoilResistance()` semantics for sub-ms fail-closed.
- **ERC-7715 Decoupling:** ⏳ **Planned / V1.0 Design Spec** — ZeroDev Kernel v3 is the v0.9 ephemeral session-key adapter (Gatehouse). Universal **ERC-7715 Advanced Wallet Permissions** is the evolution target for adapter swap without Shield or Wasm rewrite.

### 4.2 ArbOS / Stylus Alignment — ✅ Code-Verified On-Chain Coprocessor

> **Edge (Cloudflare) remains the pre-broadcast SSOT.** The **`SliverVineSoilCoprocessor`** (`contracts/stylus-probe/src/lib.rs`) is an active **u128 fixed-point** soil math coprocessor compiled via **Stylus SDK 0.10.7** — on-chain reinforcement aligned with Edge `checkSoilResistance()` semantics. Elara protocol ingress remains ⏳ V1.0 Design Spec.

| Layer | Alignment | Status |
|-------|-----------|--------|
| **Stylus Soil Coprocessor** | **`SliverVineSoilCoprocessor`** — u128 fixed-point score · quadratic spread/slippage penalty · fail-closed `depth_usd ≥ 10_000` · `evaluate_soil_coprocessor(spread_bps, depth_usd, slippage_bps)` · parity with Edge soil fuse | ✅ **Code-Verified Coprocessor** (`contracts/stylus-probe/src/lib.rs` · Stylus SDK **0.10.7** · `cargo test` **5/5 PASS** · Wasm Sandbox Vitest Passed · on-chain Sepolia deploy **pending tooling lock**) |
| **Elara protocol ingress** | Protocol-level ingress filtering drops non-compliant Robinhood Chain / blacklisted senders before GM payload construction — complements `IngressSafetySwitch` | ⏳ V1.0 Design Spec |
| **ArbOS gas / base-fee sensor** | Tri-Sensor **BaseFee Velocity** channel remains the congestion throttle for dispatch SLO | ✅ v0.9 Code-Verified (`arbitrum-gas-guard.ts`) |

**Design rule:** Edge (Cloudflare) remains the pre-broadcast SSOT; Stylus coprocessor + Elara are the on-chain reinforcement plane — never a weaker substitute for fail-closed Edge gates.

### 4.3 Infrastructure RPC / WSS (Alchemy HA)

Multi-chain HTTPS/WSS placeholders live in `.env.example` — replace `YOUR_ALCHEMY_API_KEY` locally; never commit live keys.

| Venue | Chain ID | HTTPS (RPC) | WSS |
|-------|----------|-------------|-----|
| **Arbitrum One** (primary) | 42161 | `ARB_MAINNET_RPC_URL` | `ARBITRUM_WSS_URL` |
| **Arbitrum Sepolia** (sandbox) | 421614 | `ARB_SEPOLIA_RPC_URL` | `ARBITRUM_SEPOLIA_WSS_URL` |
| **Robinhood Testnet** | 46630 | `ROBINHOOD_TESTNET_RPC_URL` | `ROBINHOOD_TESTNET_WSS_URL` |
| **Robinhood Mainnet** | 4663 | `ROBINHOOD_MAINNET_RPC_URL` | `ROBINHOOD_MAINNET_WSS_URL` |
| **Hyperliquid** (venue-native + optional HA) | — | `HYPERLIQUID_*_RPC_URL` · SSOT `HL_INFO_URL` / `HL_EXCHANGE_URL` | `HYPERLIQUID_WSS_URL` |

---

## 5. Settlement Windows & Fee Tokenomics

### 5.1 Settlement Windows

| Window | Constant | Duration | Meaning |
|--------|----------|----------|---------|
| GMX GM redemption / settle | `GMX_REDEMPTION_WINDOW` | **3–5 minutes** | Keepers / oracle settle band for GM deposit·withdrawal completion on Arbitrum |
| HL withdrawal settle | `HL_WITHDRAWAL_SETTLEMENT_WINDOW` | **15 minutes** | L1 bridge / withdrawal finality budget before Citadel treats capital as free for re-route |

Gates must not assume instant atomicity across the triangle; inventory accounting holds legs in-flight until the respective window elapses or venue ack confirms.

### 5.2 Active Fee Path (v0.9)

| Item | Definition | Status |
|------|------------|--------|
| **Builder UI Fee** | **+10 bps** `uiFeeReceiver` on every unsigned GMX v2 increase / decrease / deposit payload (`GMX_UI_FEE_BPS`) | ✅ Code-Verified |
| **Referral Rebate** | Up to **25%** of GMX trading fees via registered `referralCode` (`GMX_REFERRAL_CODE_BYTES32`) | ✅ Code-Verified |

### 5.3 Performance Fee Tokenomics (V1.5 Roadmap)

| Item | Definition |
|------|------------|
| **Benchmark** | **Aave v3 USDC (Arbitrum) — APY Benchmark / Default Yield Source** (not a live execution adapter); same fallback used by Arbitrum yield ingress |
| **Performance Fee** | **10% of Excess Yield Above Aave Benchmark Rate** |
| **Excess Yield** | `max(0, Net Strategy APY − Aave Benchmark APY)` after friction buffer |
| **Status** | **V1.5 roadmap** — not accrued on current v0.9 builder UI-fee path (+10 bps `uiFeeReceiver` + 25% referral rebate) |

B2B Option B (slippage-savings fee) remains a separate commercial SKU and is not the V1.5 vault performance fee above.

### 5.4 Public Audit Surface

`GET /api/grant-audit` — guard states, TVL, `provenanceVerified`, `sepoliaDualLegProof`. No signing material or proprietary encode paths.

---

## 6. ERC-7579 Pre-Execution Hook Alignment — AI Agent Reflex Architecture

> **Design thesis:** ERC-7579 modular smart accounts provide **permission scope**; BDLW provides **reflex speed**. Together they form the pre-execution hook stack that AI agents and institutional vaults require to avoid MEV/LVR traps without surrendering custody.

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
│ BDLW Pre-Execution Reflex Hook (106µs Cerebellum) │
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

| Hook point | ERC-7579 module role | BDLW invariant |
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
| **Status** | ✅ v0.9 Code-Verified · p50 ~106 µs | ✅ **Code-Verified Coprocessor** · `cargo test` **5/5 PASS** · on-chain deploy **pending** |

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

| Consumer | Integration | Reflex hook |
|----------|-------------|-------------|
| **Third-party dApps** | `@slivervine/citadel-sdk` · `verifyAgentIntent()` | Apache-2.0 · sub-ms soil gate |
| **Institutional vaults** | ZeroDev Kernel + Citadel Worker BUSL payload path | ERC-7579 session + 106µs Shield |
| **Grant audit / Dune** | `GET /api/grant-audit` · [Dune dashboard](https://dune.com/silvervinelabs/silvervine-citadel-telemetry) · V2 Trino heartbeat + §SUBMISSION SQL spec | Pillar 2 ingress · Pillar 3 intercepts · 10 bps builder revenue |

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

**SilverVine solution:** `agent-citadel-guard` (`src/core/agent-citadel-guard.ts`) utilizes **deterministic HMAC-SHA256 Session Proofs** (&lt; **12 µs** execution budget) for M2M rejection, achieving **~200× latency reduction** while maintaining cryptographically verifiable non-repudiation on the Edge audit plane.

**Formal split:**

| Plane | Standard | SSOT module |
|-------|----------|-------------|
| **M2M Reflex (reject / deadman)** | Sub-ms M2M Rejection Standard — HMAC-SHA256 session proof | `evaluateAgentCitadelGuard()` · `guardAgentUserOp()` |
| **Human / On-chain settlement** | EIP-712 `SliverVineCitadel` v1 · m-of-n Gate attestation | `SliverVineGate.sol` · `evaluateAttestation()` (SDK) |

**G11 UI fingerprint:** Demo HUD badge `GateDomainFingerprintBadge` calls `verifyGateDomainSeparator()` (`src/services/gate-domain-fingerprint.ts`) to compare on-chain `domainSeparator()` against local EIP-712 recompute — detecting hijacked frontends that point at a forged Gate contract.

**License SSOT (G8):** First-party contracts (`SliverVineGate`, `GatedExecutor`, `SliverVineRiskOracle`, `IngressSafetySwitch`, Stylus coprocessor) = **BUSL-1.1** · `@slivervine/citadel-sdk` = **Apache-2.0**.

### 6.7 Architectural Benchmark: SilverVine High-Performance Innovations vs. Legacy Web3 Standards

> **Audit scope:** `src/` · `contracts/` · `SliverVineGate/` — proprietary designs that intentionally depart from conventional ERC/EIP patterns to achieve sub-millisecond HFT reflexes and AI-agent swarm protection.
> **SSOT modules:** `agent-citadel-guard.ts` · `session-key-gates.ts` · `src/services/root-protection-lib/circuit-breaker-sever.ts` · `soil_core.wasm` / `SliverVineSoilCoprocessor`.

| Dimension | Legacy Web3 Standard (ERC/EIP) | SilverVine Engineered Standard | Latency / Gas Improvement | Architectural Reason |
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

| Pillar | Legacy pattern avoided | SilverVine SSOT |
|--------|------------------------|-----------------|
| AI Security | EIP-712 on every reject | `src/core/agent-citadel-guard.ts` |
| Session Gate | ERC-4337 bundler as first gate | `src/services/session-key-adapter-lib/session-key-gates.ts` · `src/adapters/hl/auth/signing-gate.ts` |
| Circuit Breaker | On-chain `Pausable` | `src/services/root-protection-lib/circuit-breaker-sever.ts` · `src/services/risk-control-lib/root-protection.ts` |
| Compute Parity | EVM storage-heavy soil math | `pkg/soil_core.wasm` · `contracts/stylus-probe/src/lib.rs` · `src/services/risk-control-lib/soil-resistance.ts` |

---

## Related Documents

| Document | Purpose |
|----------|---------|
| [`docs/README.md`](../README.md) | Audience router |
| [`docs/grants/`](../grants/) | Public grant submissions (GMX · Arbitrum) |
| [`CITADEL_SDK_BLUEPRINT.md`](../sdk/CITADEL_SDK_BLUEPRINT.md) | Apache-2.0 SDK API |
| [`../audit/`](../audit/) | Principal audit · Robinhood Chain safety gate |
| [`../../docker/README.md`](../../docker/README.md) | Sidecar |
| [`../grants/arbitrum/ARBITRUM_ONE_PAGER.md`](../grants/arbitrum/ARBITRUM_ONE_PAGER.md) | Grant one-pager |
| `src/services/risk/liquidation-meter.ts` | `DEFAULT_CROSS_MMR = 0.05` |
| `src/services/session-key-adapter-lib/nonce-auto-healing.ts` | HL nonce auto-resync |
| `src/services/execution/twap-engine-v2.ts` | TWAP path planner |
