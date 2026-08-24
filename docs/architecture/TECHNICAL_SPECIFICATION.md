# SliverVine Protocol — Santenmoku Engine: Technical Specification & Risk Topology

> **Baseline (locked):** Vitest `164 test files | 735 PASS (100% Clean)` · Security-tier `5/0/0 PASS` (`docs/audit/static-analysis-report.json`; Vitest, Forge, Slither, Aderyn, pnpm-audit) · Defense Matrix `17 Active | 2 Refactored | 1 Deprecated` · Wasm Core `<28kb` Cloudflare budget, `<60µs` execution.  
> Fast-tier scorecard (`docs/audit/security-scorecard.json`) is overwritten by the last `audit:*` run — do not mix tiers.  
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
    │    Scopes agent permissions & eliminates credential drift│
    └──────────────────────┬──────────────────────────────────┘
                           │
                           ▼
    ┌─────────────────────────────────────────────────────────┐
    │ 2. THE FIREWALL (Compliance) — Institutional Ingress &  │
    │    Cross-Chain AML Firewall (ingress sources optional)  │
    └──────────────────────┬──────────────────────────────────┘
                           │
                           ▼
    ┌─────────────────────────────────────────────────────────┐
    │ 3. THE SHIELD (CORE MOAT — PRIMARY TECH) — Sub-ms Wasm │
    │    checkSoilResistance() & Wasm engine at p50 ~106 μs   │
    └──────────────────────┬──────────────────────────────────┘
                           │
                           ▼
[ PRIMARY: Arbitrum One GMX v2 ETH/USDC GM + Hyperliquid 1× Short ]
```

| Pillar | Role | SSOT / Mechanism |
|--------|------|------------------|
| **Gatehouse (Auth)** | ZeroDev scoped session keys | Kernel v3 · `ORDER_EXECUTE` bounds · daily gas sponsorship limits · R06 / R07 |
| **Firewall (Compliance)** | **Institutional Ingress & Cross-Chain AML Firewall** | Optional permissioned ingress (Robinhood Chain `46630`/`4663` = supported example) → Arbitrum `42161` outbound-only; inbound AML blocked |
| **Shield (CORE MOAT)** | Sub-ms Wasm pre-execution armor — **primary technical moat** | `checkSoilResistance()` p50 ~106 μs · Wasm warm path &lt;60µs · R01 / R04 |

### 0.1 Bytecode Predicate Verification & ERC-7715 Compatibility

SilverVine does not interpret natural-language LLM prompts. The Shield enforces **Asymmetric Predicate Bytecode Hard Assertions** against ERC-4337 UserOp calldata inside the sub-ms Wasm core (p50 ~106 μs), with ZeroDev Kernel v3 as the modular session-key adapter evolving toward **ERC-7715 (Advanced Wallet Permissions)**.

| Invariant | Mechanism |
|-----------|-----------|
| **Receiver Invariant** | Decode GMX v2 parameters from UserOp bytecode; assert `sender ≡ receiver` before any L2 broadcast. |
| **Parameter Invariant** | Bound-check `acceptablePrice` (and related execution params) against oracle-lag sensors; fail-closed on drift. |
| **Unidirectional Outbound Escort** | When a permissioned ingress source is used (e.g. Robinhood Chain `46630`/`4663`), capital flow is outbound-only → Arbitrum `42161`; inbound AML contamination is blocked at the Firewall. |

### 0.2 v0.9 Delivered Scope vs V1.0 Roadmap

| Horizon | Status | Scope |
|---------|--------|-------|
| **v0.9 Delivered (100% Code & Tested)** | ✅ Live | Sub-ms Wasm Soil Engine · ZeroDev Kernel v3 Session Key Adapter · Restored Deadman Switch (`agent-citadel-guard`) · Unidirectional Robinhood AML Bridge Escort · GMX +5 bps UI Fee · **164 test files / 735 PASS (100% Clean)** |
| **v0.9 Active Target** | ✅ Live | Single blue-chip anchor: **GMX v2 ETH/USDC GM Pool** + Hyperliquid **1× short** hedge |
| **V1.0 Isomorphic Extension** | ⏳ Planned | **BTC/USDC GM Pool** — zero bytecode / Wasm changes; config-driven market address mapping |
| **V1.0 Roadmap (Planned Post-Grant)** | ⏳ Planned | On-chain ECDSA Signer Recovery Verification · Production Smart Contract Deployment for GM Vaults · Native **USDG Robinhood Chain Treasury routing** |

**Demo:** `pnpm demo:pipeline` / `pnpm demo:citadel` — 5-step grant E2E (Intent+Deadman → Robinhood escort → GMX underweight → HL Session hedge → R20 Panic Flash).

---

## 1. Core Product Identity

**Primary product (center of gravity):** **Delta-Neutral GM Yield Engine on Arbitrum One** — GMX v2 **ETH/USDC** GM pool + Hyperliquid **1× short hedge**, guarded by Pillar 3 sub-ms Wasm Shield (`checkSoilResistance()`).

| Component | Venue | Role |
|-----------|-------|------|
| **Yield base (PRIMARY)** | Arbitrum One · GMX v2 ETH/USDC GM | Underweight-side GM LP · builder `uiFeeReceiver` (+5 bps) · Citadel pre-execution gate |
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
        ↕  1× Δ-neutral hedge
Hyperliquid (1× Short Hedge)
        ↑  optional permissioned ingress (e.g. Robinhood Chain 46630 / 4663)
```

| Leg | Venue | Role |
|-----|-------|------|
| **Yield base (PRIMARY)** | Arbitrum One · GMX v2 GM | Underweight-side GM LP · builder `uiFeeReceiver` · Citadel pre-execution gate |
| **Hedge** | Hyperliquid | Session-key **1× short** Emergency Liquidity Sponge · nonce-healed signing |
| **Ingress (optional example)** | Robinhood Chain | Supported permissioned institutional ingress · outbound-only escort into Arbitrum |

**Control plane:** Cloudflare Edge Worker (`SystemState` SSOT) evaluates sequencer · oracle lag · soil · RPC radar before any unsigned GMX payload or HL hedge dispatch. Routing is unidirectional into `SystemState`; venue adapters never mutate peer books without a gate pass.

**Read API:** `GET /api/yield/triangle` — structural APY / depth / gate status across HL · GMX (Robinhood Chain ingress stub stacked via egress escort).

### 2.1 Segregated Tranches

Solidity vault surface splits capital into two non-fungible risk lanes:

| Tranche | Chain policy | Behavior |
|---------|--------------|----------|
| **Permissioned RWA Tranche** | Robinhood Chain **4663** inbound **BLOCKED** at protocol filter | Institutional / RWA-tagged deposits only · `RobinhoodSafetySwitch` blacklist + oracle flush · no permissionless public mint path from 4663 |
| **Permissionless DeFi Tranche** | Arbitrum One + HL | Open GM / hedge flow behind Citadel fail-closed gate · standard DeFi UX |

**Invariant:** RWA capital on the permissioned lane cannot be atomically reminted into the permissionless DeFi tranche without an explicit, audited bridge + compliance gate (Across + AA). Chain **4663 → Arbitrum** inbound is denied by default; Testnet **46630** remains the active integration sandbox.

**On-chain anchors:** `contracts/RobinhoodSafetySwitch.sol` · `contracts/SliverVineRiskOracle.sol`.

### 2.2 Asset Redemption & Clearing Boundaries

| Path | Boundary |
|------|----------|
| **Arbitrum One Off-ramp** | Native **ETH, BTC, and USDC** supported directly upon GMX v2 async unwind (3–5 min). |
| **USDG Clearing** | Native USDG treasury redemptions are restricted to Robinhood Chain (`46630`/`4663`) via the unidirectional bridge; Arbitrum USDC is converted on return to preserve compliance bounds. Inbound AML contamination (reverse path) is blocked. |

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

**Companion fuses:** Dynamic Max SL = `Balance × 1% + $100` · Sequencer 600s grace · Oracle lag fail-closed · Root slippage breaker (0.5%). · Deadman (50 bps) is an additional fail-closed fuse on the AA / SDK path.

### 3.2 Risk & Execution Matrix

#### § Poisson Jitter & Anti-MEV Adaptive TWAP

For **$1,000,000+** treasury routing into GMX v2 GM pools, the Shield schedules child clips via **Wasm-driven Poisson random intervals** uniformly bounded **18s–110s** across a **12–18 minute** parent window. Inter-arrival jitter drives autocorrelation toward **near zero**, keeping GMX local price impact **≤ 10 bps**; any residual depth breach still short-circuits via `checkSoilResistance()` (R01).

#### § Block 0 Sequencer Desync Defense

| Layer | Mechanism |
|-------|-----------|
| **Private path** | Bypass public mempools via **Private Relays / QUIC** — Edge never exposes intent on the open gossip surface during desync windows. |
| **Settlement timing moat** | Leverage GMX v2 **two-stage async settlement**: keepers execute create→settle asynchronously; **`cancelOrder` remains a single-stage atomic** counter to stale MEV intent if soil / sequencer / oracle sensors trip mid-window. |

#### § SGX PRM Key Caching

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
| **R11** | Dynamic Max SL (`Equity×1%+$100`) | Active | `effective-max-sl.ts` |
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
| **Active v0.9 Controls** | Single-order notional cap | **$5,000 USD** (`SESSION_KEY_NOTIONAL_CAP_USD`) | ✅ Live |
| **Active v0.9 Controls** | Protocol UI fee accrual | **+5 bps** `uiFeeReceiver` (`GMX_UI_FEE_BPS`) | ✅ Live |
| **Active v0.9 Controls** | Emergency margin buffer | **5%** (`DEFAULT_CROSS_MMR = 0.05`) | ✅ Live |
| **Active v0.9 Controls** | Circuit breakers | **R17** daily-loss severance · **R20** physical deadlock / flatten-fail | ✅ Live |
| **Vault Operational Spec (V1.0 Roadmap)** | Alpha Vault Cap | **$100,000** hard TVL ceiling | ⏳ Planned |
| **Vault Operational Spec (V1.0 Roadmap)** | Epoch batching | **4-hour** epoch windows for cross-venue execution | ⏳ Planned |
| **Vault Operational Spec (V1.0 Roadmap)** | Deposit cooldown | **24-hour** minimum hold to prevent flash arbitrage | ⏳ Planned |

---

## 4. Standard Compliance & ERC/EIP Wiki

Official infrastructure standards map — each row links a public ERC/EIP (or venue spec) to Citadel implementation anchors and verification.

| Standard | Role in Citadel | Implementation anchor | Verification |
|----------|-----------------|----------------------|--------------|
| **[OpenZeppelin Contracts v5](https://docs.openzeppelin.com/contracts/5.x/)** | On-chain gate access control & reentrancy guard (`Ownable`, `ReentrancyGuard`, EIP-712 digest semantics) | `SliverVineGate.sol` · `RobinhoodSafetySwitch.sol` · inline ECDSA aligned with OZ `ECDSA.tryRecover` | Foundry Gate **60 passed** · Forge property fuzz |
| **[EIP-712](https://eips.ethereum.org/EIPS/eip-712)** | Typed-data attestation · Session Key scopes · Gate digest binding | Domain `SliverVineCitadel` · `SliverVineGate.sol` · `src/sdk/constants.ts` · unlock-reauthorization | Forge I1–I12 · SDK citadel tests |
| **[ERC-4337](https://eips.ethereum.org/EIPS/eip-4337)** | Account Abstraction — scoped agent UserOps without hot-wallet custody | ZeroDev Kernel v3 · EntryPoint **v0.7** · `src/adapters/arbitrum/zerodev-aa/` | ZeroDev AA gate + aa-adapter tests |
| **[ERC-7579](https://eips.ethereum.org/EIPS/eip-7579)** | Modular smart-account modules — session-key permission scopes | ZeroDev Kernel v3 modular session keys · scoped `ORDER_EXECUTE` clip · daily gas sponsorship limits | Gatehouse (Pillar 1) · agent-intent SDK |
| **[EIP-1559](https://eips.ethereum.org/EIPS/eip-1559)** | Dynamic base-fee congestion sensing on Arbitrum One | Tri-Sensor **BaseFee Velocity** channel · `arbitrum-gas-guard.ts` | Gas-guard tests · Tri-Sensor Matrix |
| **ArbOS 61** | Arbitrum L2 execution / Stylus co-residence alignment | `RobinhoodSafetySwitch.sol` · Elara ingress design · Stylus WASM parity path | Robinhood safety contracts · audit notes |
| **Robinhood Chain Ingress** | Permissioned institutional egress · AML inbound isolation | Chains **46630** (testnet) / **4663** (mainnet filter) · Across bridge · `RobinhoodSafetySwitch.sol` | Robinhood Across bridge tests · audit snapshot |
| **WASM Core (`soil_core`)** | Sub-ms pre-execution soil fuse · Cloudflare Edge hot path | `pkg/soil_core.wasm` · `#![no_std]` Rust · budget **&lt;28 KiB** · warm exec **&lt;60 µs** | Wasm feasibility suite |

### 4.1 Compliance Posture

- **OpenZeppelin Contracts v5:** Gate contracts enforce fail-closed access control and reentrancy-safe execution patterns; `SliverVineGate` ECDSA verification intentionally matches OZ `ECDSA.tryRecover` (strict 65-byte, non-malleable `s`).
- **EIP-712:** All Gate attestations and SDK envelopes bind `chainId` + `verifyingContract` — cross-chain replay denied at `verifyAndConsume`.
- **ERC-4337 / ERC-7579:** UserOps pass Edge `verifyAgentIntent()` before bundler dispatch; session modules enforce clip + TTL caps.
- **EIP-1559:** Gas-yield ratio fuse blocks dispatch when L1 surcharge exceeds target yield band.
- **Robinhood Chain:** Outbound-only escort (`46630`/`4663` → `42161`); inbound AML blocked · `lostUsd ≡ 0`.
- **WASM:** Hot-path soil evaluation mirrors Edge `checkSoilResistance()` semantics for sub-ms fail-closed.
- **ERC-7715 Decoupling:** ZeroDev Kernel v3 is an ephemeral session-key adapter (Gatehouse). Permission surfaces target universal **ERC-7715 Advanced Wallet Permissions** so agentic finance remains multi-chain-neutral — adapter swap without Shield or Wasm rewrite.

### 4.2 ArbOS / Stylus Alignment

| Layer | Alignment |
|-------|-----------|
| **Stylus WASM core** | Risk filters and ingress predicates compile toward Arbitrum Stylus-native WASM for microsecond on-L2 evaluation (parity with Edge `checkSoilResistance` semantics) |
| **Elara protocol ingress** | Protocol-level ingress filtering drops non-compliant Robinhood Chain / blacklisted senders before GM payload construction — complements `RobinhoodSafetySwitch` |
| **ArbOS gas / base-fee sensor** | Tri-Sensor **BaseFee Velocity** channel remains the congestion throttle for dispatch SLO |

**Design rule:** Edge (Cloudflare) remains the pre-broadcast SSOT; Stylus/Elara are the on-chain reinforcement plane — never a weaker substitute for fail-closed Edge gates.

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
| **Builder UI Fee** | **+5 bps** `uiFeeReceiver` on every unsigned GMX v2 increase / decrease / deposit payload | ✅ Live |
| **Referral** | Optional `referralCode` (bytes32) on unsigned payloads | ✅ Live |

### 5.3 Performance Fee Tokenomics (V1.5 Roadmap)

| Item | Definition |
|------|------------|
| **Benchmark** | Aave v3 USDC (Arbitrum) base borrow/supply APY — same fallback used by Arbitrum yield ingress |
| **Performance Fee** | **10% of Excess Yield Above Aave Benchmark Rate** |
| **Excess Yield** | `max(0, Net Strategy APY − Aave Benchmark APY)` after friction buffer |
| **Status** | **V1.5 roadmap** — not accrued on current v0.9 builder UI-fee path (+5 bps `uiFeeReceiver`) |

B2B Option B (slippage-savings fee) remains a separate commercial SKU and is not the V1.5 vault performance fee above.

### 5.4 Public Audit Surface

`GET /api/grant-audit` — guard states, TVL, `provenanceVerified`, `sepoliaDualLegProof`. No signing material or proprietary encode paths.

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
