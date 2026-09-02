# SliverVine Citadel Protocol — Advanced HFT Architectural Innovations & Trade Secrets (3 Hidden Gems)

> **Classification:** Internal IP / patent diligence · expert Q&A reference  
> **Entity:** SilverVine Labs · **Protocol:** SliverVine · **Engine:** Santenmoku v0.8  
> **Public 10-dimension matrix:** [`TECHNICAL_SPECIFICATION.md` §6.7](../architecture/TECHNICAL_SPECIFICATION.md#67-architectural-benchmark-silvervine-high-performance-innovations-vs-legacy-web3-standards)  
> **Traditional Chinese SSOT (13 dimensions):** [`INTERNAL_13_DIMENSION_ARCHITECTURAL_BENCHMARK_ZH.md`](./INTERNAL_13_DIMENSION_ARCHITECTURAL_BENCHMARK_ZH.md)

This memorandum documents **three proprietary architectural innovations** that extend — rather than replace — conventional EIP/ERC standards. They are deliberately omitted from the public 10-dimension grant matrix to preserve competitive and IP posture while remaining fully code-verified in the repository.

---

## Executive Summary

| # | Hidden Gem | Standard Enhanced | Core Innovation | SSOT |
|---|------------|-------------------|-----------------|------|
| 1 | Asymmetric Risk Timelock Governance | EIP-712 Gate authority model | Tighten at **0 latency** · relax only after **1h–24h** timelock | `SliverVineGate.sol` |
| 2 | Stateless Dynamic Gas-Cap Pre-Screening | EIP-7562 AA validation rules | Edge **0-gas drop** before bundler dispatch | `zerodev-aa-static-breaker.ts` |
| 3 | Unidirectional Ingress Escort Paradigm | Token / vault bridge accounting | AML isolation + **`lostUsd ≡ 0`** invariant | `across-ingress-bridge.ts` |

---

## 1. Asymmetric Risk Timelock Governance (Enhancing EIP-712)

### Problem with Legacy Pattern

Standard EIP-712 gate or multisig designs typically apply **symmetric authority**: the same key that can `pause` can `unpause` with equal immediacy. A compromised admin or guardian key can therefore **loosen** risk parameters as fast as it can tighten them — the unsafe direction for institutional capital.

OpenZeppelin `Pausable` and Ownable pause patterns share this flaw: recovery paths are as fast as emergency stops.

### SliverVine Innovation

`SliverVineGate` embeds **asymmetric authority** directly into the EIP-712 attestation anchor:

| Action | Latency | Authority | Direction |
|--------|---------|-----------|-----------|
| `halt()` | **Immediate (0)** | Guardian or Admin | **Tighten** — all attestations denied |
| `scheduleUnhalt()` + `executeUnhalt()` | **≥ 1 hour** (`UNHALT_DELAY`) | Admin only | **Loosen** — timelocked |
| `proposeSignerChange()` + `executeSignerChange()` | **≥ 24 hours** (`SIGNER_TIMELOCK`) | Admin only | **Loosen** — signer set mutation |
| Cancel pending loosening | Immediate | Guardian or Admin | Veto in-flight relax proposals |

**Design contract (from source):**

> *"Asymmetric authority. Tightening (halt) is immediate. Loosening (unhalt, adding a signer, lowering the threshold) is timelocked. A stolen guardian key can only stop the system — which is the safe direction."*

### Why This Matters for HFT / AI Agents

- Hot-path reflex severance (`severCircuitBreakerPipeline`) operates at Edge speed; the on-chain gate provides a **settlement-plane kill switch** that cannot be silently reversed by an attacker within the same block.
- EIP-712 attestations remain valid for **≤ 30 s** (`MAX_TTL`); after `halt()`, every pre-outage attestation is already dead — recovery cannot be flooded with stale authorisations.
- Immutable gate (no proxy) removes upgrade-based loosening attacks entirely.

### Code Anchors

- `SliverVineGate/src/SliverVineGate.sol` — `halt()`, `scheduleUnhalt()`, `executeUnhalt()`, `proposeSignerChange()`
- `SliverVineGate/test/SliverVineGate.t.sol` — authority and timelock invariants
- Forge fuzz: **327,675** property executions (`FOUNDRY_PROFILE=deep`)

### Patent / Trade-Secret Framing

**Claim axis:** A method for asymmetric on-chain risk governance wherein risk-tightening operations execute with zero timelock while all risk-loosening operations require a mandatory delay window, applied to an EIP-712 consume-once attestation gate without proxy upgrade path.

---

## 2. Stateless Dynamic Gas-Cap Pre-Screening (Enhancing EIP-7562)

### Problem with Legacy Pattern

[EIP-7562](https://eips.ethereum.org/EIPS/eip-7562) defines opcode and storage-access rules for ERC-4337 **validation phase**. Violations surface only when the UserOp reaches the bundler — after network RTT, paymaster evaluation, and queue scheduling. Toxic or over-budget UserOps therefore consume **real infrastructure cost** before rejection.

Standard AA stacks often **blind-retry** on bundler failure, treating rejection as a transport error rather than a protocol fault.

### SliverVine Innovation

**Zero-Bundler-Rejection Invariant:** Citadel evaluates a **stateless static breaker matrix** on the Edge **before** paymaster sign and bundler dispatch:

```text
UserOp draft
    → evaluateStaticBreakerMatrix()
        ① checkSoilResistance()        — toxic market? → TRIP_SOIL_RESISTANCE
        ② evaluateSponsoredGasLimits() — per-Op + daily cap? → ZERODEV_GAS_LIMIT_EXCEEDED_TRIP
    → if tripped: throw RiskLimitExceeded (0-gas — never reaches bundler)
    → else: assertRiskOracleUserOpGateOnChain() → bundler dispatch
```

| Property | Value |
|----------|-------|
| Edge evaluation | **< 1 ms** (in-process) |
| Rejected UserOp gas cost | **0** (not submitted) |
| Soil + sponsorship | **Serial** — no "sponsored but should-be-blocked" path |
| EIP-7562 alignment | Validation-phase storage violations **pre-screened** via session-key whitelist + static breaker |

### Architectural Reason

Institutional AA on Arbitrum requires **predictable deliverability**: bundler rejection is classified as a **protocol fault**, not a retry signal. Moving EIP-7562 compliance **upstream** to the Citadel Edge eliminates wasted bundler RTT and protects paymaster sponsorship budgets during volatility spikes.

### Code Anchors

- `src/adapters/arbitrum/zerodev-aa/zerodev-aa-static-breaker.ts` — `evaluateStaticBreakerMatrix()`, `assertStaticBreakerMatrix()`
- `src/adapters/arbitrum/zerodev-aa/zerodev-aa-gas-ledger.ts` — `MAX_GAS_COST_PER_USEROP_USD`, daily ledger
- `src/adapters/arbitrum/zerodev-aa/zerodev-aa-send-userop.ts` — pre-dispatch gate chain
- `tests/services/aa-adapter/risk-oracle-gate.test.ts` — fail-closed oracle integration

### Patent / Trade-Secret Framing

**Claim axis:** A stateless pre-bundler screening method combining off-chain soil-resistance evaluation with dynamic per-UserOp and daily gas sponsorship caps, rejecting account-abstraction operations at zero gas cost prior to ERC-4337 bundler submission while maintaining EIP-7562 validation-phase compliance.

---

## 3. Unidirectional Ingress Escort Paradigm (Enhancing Token/Vault Standards)

### Problem with Legacy Pattern

Conventional cross-chain bridge accounting treats in-flight liquidity ambiguously:

- Pending bridge capital may be booked as **principal loss** (`lostUsd > 0`).
- Bidirectional routes enable **AML-sensitive inbound flows** back to permissioned chains.
- Vault risk engines reacting to false `lostUsd` readings can trigger **cascade liquidations** or erroneous margin calls.

Standard ERC-20 / vault share models do not define a **pending-capital recognition invariant** for institutional escort flows.

### SliverVine Innovation

**Pending-Capital Recognition Invariant:**

```text
During active bridge execution:
  capitalLabel = IN_FLIGHT_BRIDGE_CAPITAL
  lostUsd      ≡ 0   (strict — never prematurely written off)

On AML inbound attempt (non-Robinhood → Robinhood):
  direction    = blocked
  capitalLabel = AML_INBOUND_TO_ROBINHOOD_BLOCKED
  lostUsd      ≡ 0

On explicit timeout (BRIDGE_TIMEOUT_FAIL_CLOSED):
  lostUsd      ≡ 0   (fail-closed without false loss booking)
```

| Layer | Implementation |
|-------|----------------|
| Edge SSOT | `src/adapters/across-ingress-bridge.ts` — `evaluateAcrossBridgeTransfer()` |
| SDK | `src/sdk/unidirectional-bridge.ts` — `assertUnidirectionalBridge()` |
| On-chain | `contracts/IngressSafetySwitch.sol` — oracle flush + `institutionalBlacklist` |
| Tests | `tests/adapters/across-ingress-bridge.test.ts` — **5/5 PASS** |

**Reference route:** Robinhood Chain (`46630` / `4663`) → Arbitrum One (`42161`) — outbound-only; venue-agnostic adapter design.

### Architectural Reason

Institutional delta-neutral vaults escorting capital from permissioned ingress chains require:

1. **Unidirectional** capital routing (AML isolation).
2. **Zero false-loss booking** during bridge latency windows.
3. On-chain compliance filter (`IngressSafetySwitch`) that **reads** oracle flush state without independent pause admin — preventing fork bypass of compliance stack.

This paradigm prevents risk engines from misinterpreting in-flight liquidity as realized loss, avoiding **cascade liquidation** triggers in dual-venue (GMX + Hyperliquid) hedge stacks.

### Code Anchors

- `src/adapters/across-ingress-bridge.ts` — `IN_FLIGHT_BRIDGE_CAPITAL`, `AML_INBOUND_TO_ROBINHOOD_BLOCKED`
- `src/sdk/robinhood-audit-snapshot.ts` — `exportRobinhoodAuditSnapshot()` throws on `lostUsd ≠ 0`
- `contracts/IngressSafetySwitch.sol` — `isCompliant()`, `gateAddress()`
- `docs/grants/SUBMISSION.md` — Pillar 2 compliance ingress firewall

### Patent / Trade-Secret Framing

**Claim axis:** A unidirectional cross-chain capital escort method maintaining a strict accounting invariant wherein bridge in-flight capital is labelled separately and `lostUsd` remains identically zero until explicit settlement or fail-closed timeout, combined with AML-aware inbound route blocking for permissioned chain ingress.

---

## Cross-Reference: How Hidden Gems Compose the Public Stack

```text
                    ┌─────────────────────────────────────┐
 Hidden Gem 3        │  Unidirectional Escort (Pillar 2)  │
 (lostUsd ≡ 0)       │  across-ingress-bridge.ts           │
                    └──────────────┬──────────────────────┘
                                   ▼
 Public Dims 1–10   ┌─────────────────────────────────────┐
 (Interceptor Moat)  │  checkSoilResistance() · Wasm       │
                    │  agent-citadel-guard · session-gates │
                    └──────────────┬──────────────────────┘
                                   ▼
 Hidden Gem 2        ┌─────────────────────────────────────┐
 (0-gas AA pre-screen)│  evaluateStaticBreakerMatrix()      │
                    └──────────────┬──────────────────────┘
                                   ▼
 Hidden Gem 1        ┌─────────────────────────────────────┐
 (asymmetric timelock)│  SliverVineGate.halt() / timelocks  │
                    └─────────────────────────────────────┘
```

---

## Licensing & Distribution

| Artifact | License | External distribution |
|----------|---------|----------------------|
| Contracts (Gate, Oracle, Switch, Stylus) | BUSL-1.1 | Grant / audit only |
| `@slivervine/citadel-sdk` | Apache-2.0 | Public integration surface |
| This memorandum | Internal | **Do not publish** without legal review |

---

## Related Documents

| Document | Purpose |
|----------|---------|
| [`INTERNAL_13_DIMENSION_ARCHITECTURAL_BENCHMARK_ZH.md`](./INTERNAL_13_DIMENSION_ARCHITECTURAL_BENCHMARK_ZH.md) | Full 13-dimension Traditional Chinese SSOT |
| [`INTERNAL_13_DIMENSION_ARCHITECTURAL_BENCHMARK_ZH.md` §附錄](./INTERNAL_13_DIMENSION_ARCHITECTURAL_BENCHMARK_ZH.md#附錄silvervine-v08-內部已知物理邊界與-v10-主網修補-roadmap) | Known physics limitations & V1.0 remediation (Truth-Mode) |
| [`TECHNICAL_SPECIFICATION.md`](../architecture/TECHNICAL_SPECIFICATION.md) | Public R01–R20 specification |
| [`SUBMISSION.md`](../grants/SUBMISSION.md) | Arbitrum grant submission pack |
| [`CROSS_CHAIN_RISK_AND_EVOLUTION.md`](../architecture/CROSS_CHAIN_RISK_AND_EVOLUTION.md) | Cross-chain risk evolution roadmap |

---

*SilverVine Labs · Santenmoku Engine v0.8 · Advanced HFT Innovations Memorandum · Code-verified: Vitest Proposal Baseline: 175 test files | 773 PASS (Current Branch Live: 176 test files | 775 PASS Clean)*
