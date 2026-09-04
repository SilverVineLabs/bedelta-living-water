# Pillar 2: Compliance Ingress Firewall & Reference Adapter Audit (e.g., Robinhood Chain / Across)

| Field | Value |
|-------|-------|
| **Document** | Pillar 2: Compliance Ingress Firewall & Reference Adapter Audit |
| **Version** | **v1.0.0** |
| **Classification** | Public Grant / Institutional Diligence |
| **Entity** | SilverVine Labs |
| **Protocol** | SliverVine Protocol (BeDelta Living Water v1.0 / BeΔ) · Santenmoku internal engine |
| **Scope** | Pillar 2 Compliance Ingress Firewall · Robinhood Chain **46630** (testnet) · **4663** (mainnet) · Across reference escort · Arbitrum One **42161** |
| **Spec SSOT** | [`docs/architecture/01_TECHNICAL_SPECIFICATION.md`](../architecture/01_TECHNICAL_SPECIFICATION.md) |
| **Live Proof** | [`GET /api/grant-audit`](https://bedeltawater.slivervine.xyz/api/grant-audit) |

> **Product identity boundary:** Robinhood Chain and Across are **optional Pillar 2 Reference Ingress Adapters** demonstrating multi-chain compliance escort accounting — they are integration examples, **not** the core product identity of SliverVine Protocol. The protocol's center of gravity remains the **Pre-Consensus Intent Firewall & GMX/HL Execution Safety Primitive (Pillar 3 Shield)** — see [README § Three Pillars](../../README.md).

> **Authority statement:** This report verifies the Pillar 2 Compliance Ingress Firewall under the Citadel **Three Pillars Architecture**, using Robinhood Chain / Across as inaugural reference adapters. All quantitative claims are CLI-verifiable via `pnpm test` and targeted bridge tests.

---

## Audit Verdict

| Gate | Status |
|------|--------|
| **Vitest — Robinhood Across Bridge** | **5/5 PASS** |
| **Unidirectional Escort (46630/4663 → 42161)** | **ALLOWED** |
| **AML Inbound Block (42161 → 46630/4663)** | **BLOCKED** |
| **On-chain `IngressSafetySwitch.sol`** | **Invariants verified** |
| **Capital loss invariant** | **`lostUsd ≡ 0`** |

**Robinhood Chain status:** Testnet **46630** — **ACTIVE / TESTED** · Mainnet **4663** — **DEPLOYMENT READY** (inbound blocked at protocol filter).

---

## Three Pillars Architecture

```text
[ Institutional Treasury (Robinhood Chain 46630 / 4663) ]
 │
 ▼
 ┌─────────────────────────────────────────────────────────┐
 │ Pillar 1: THE GATEHOUSE (Auth) │
 │ ZeroDev Kernel v3 Session Keys & EIP-712 Scopes │
 └──────────────────────┬──────────────────────────────────┘
 │
 ▼
 ┌─────────────────────────────────────────────────────────┐
 │ Pillar 2: COMPLIANCE INGRESS FIREWALL (Reference Adapters — Robinhood / Across) │
 │ Unidirectional Escort · AML inbound isolation │
 │ IngressSafetySwitch.sol · lostUsd ≡ 0 │
 └──────────────────────┬──────────────────────────────────┘
 │
 ▼
 ┌─────────────────────────────────────────────────────────┐
 │ Pillar 3: THE SHIELD (Core Moat) │
 │ Sub-ms checkSoilResistance() & Wasm engine │
 └──────────────────────┬──────────────────────────────────┘
 │
 ▼
[ Safe Execution on Arbitrum One GMX v2 GM Pools ]
```

---

## Pillar 1: The Gatehouse (Auth)

**ZeroDev Kernel v3 Session Keys & EIP-712 Scopes**

| Control | Mechanism | Evidence |
|---------|-----------|----------|
| **Scoped session keys** | ZeroDev Kernel v3 AA adapter enforces `ORDER_EXECUTE` bounds and daily gas sponsorship limits | `src/adapters/zerodev/` · `docs/audit/zerodev-aa-metrics.json` |
| **EIP-712 domain binding** | Domain `SliverVineCitadel` · chainId-bound attestation surface | `@slivervine/citadel-sdk` · `SliverVineGate.sol` |
| **Credential drift elimination** | Session keys replace hot-wallet credential rotation for agent permissions | README § Unified Institutional Pre-Execution Pipeline |

**Gate posture:** No unsigned GMX payload or hedge dispatch proceeds without a valid scoped session key and gate pass.

---

## Pillar 2: Compliance Ingress Firewall (Reference Adapters — Robinhood Chain / Across)

### 2.1 Vitest Verification — 5/5 PASS

```bash
pnpm exec vitest run tests/adapters/across-ingress-bridge.test.ts
```

| # | Test Case | Result |
|---|-----------|--------|
| 1 | Unidirectional outbound **46630 → 42161** allowed | ✅ PASS |
| 2 | In-flight capital labeled `IN_FLIGHT_BRIDGE_CAPITAL`; `lostUsd ≡ 0` | ✅ PASS |
| 3 | Outbound settlement clears in-flight label → `SETTLED` | ✅ PASS |
| 4 | AML isolation: **42161 → 46630 / 4663** inbound blocked | ✅ PASS |
| 5 | Bridge timeout fail-closed; capital never marked as lost | ✅ PASS |

**Module:** `src/adapters/across-ingress-bridge.ts`
**Test file:** `tests/adapters/across-ingress-bridge.test.ts`

### 2.2 Unidirectional Escort Routing Matrix

| Direction | Chain IDs | Status | Reason Code |
|-----------|-----------|--------|-------------|
| Outbound (sandbox) | **46630 → 42161** | ✅ **ALLOWED** | — |
| Outbound (mainnet) | **4663 → 42161** | ✅ **ALLOWED** | — |
| Inbound AML block | **42161 → 46630** | 🚫 **BLOCKED** | `AML_INBOUND_TO_ROBINHOOD_BLOCKED` |
| Inbound AML block | **42161 → 4663** | 🚫 **BLOCKED** | `AML_INBOUND_TO_ROBINHOOD_BLOCKED` |
| `inboundToRobinhoodPermitted` | All paths | 🚫 **false** | Hard invariant |

**AML isolation rule:** Zero inbound capital flow permitted back to Robinhood Chain. External sources (e.g. Arbitrum One) targeting Robinhood Chain destinations are rejected at the adapter layer before bridge state machine entry.

**Sandbox vs mainnet:**

- **46630 (testnet):** Active integration sandbox — outbound escort to Arbitrum One operational.
- **4663 (mainnet):** Deployment-ready — outbound escort allowed; **inbound from 42161 blocked** at protocol filter (Permissioned RWA tranche policy per Tech Spec § Segregated Tranches).

### 2.3 On-Chain Invariants — `IngressSafetySwitch.sol`

**Contract:** [`contracts/IngressSafetySwitch.sol`](../../contracts/IngressSafetySwitch.sol)
**Oracle anchor:** [`contracts/SliverVineRiskOracle.sol`](../../contracts/SliverVineRiskOracle.sol)

| Invariant | Mechanism | On Violation |
|-----------|-----------|--------------|
| **Oracle system flush** | `riskOracle.isSystemFlushed()` | `isCompliant → false`; `gateAddress → revert("SLO_TIMEOUT")` |
| **STATUS_SHUTDOWN (3)** | `riskOracle.statusCode() == STATUS_SHUTDOWN()` | Same fail-closed path; `EmergencyJumped` + `ErrorTriggered` events |
| **Institutional blacklist** | `institutionalBlacklist[target]` | `gateAddress → revert("BLACKLISTED")`; `ERR_INVALID_SIGNER` event |
| **Zero-address guard** | Constructor `require(oracle_ != address(0))` + blacklist zero check | Deploy-time revert |
| **Compliant pass** | All checks pass | `StatusRefreshed(target, timestamp)` emitted |

**Architecture layering:**

| Layer | Scope | Role |
|-------|-------|------|
| **Edge Adapter** | Chain ID routing | Unidirectional escort + AML inbound block (4663/46630) |
| **On-chain Safety Switch** | Address-level gate | Oracle flush + institutional blacklist before Robinhood Chain interaction |

Complements Tech Spec § Segregated Tranches and § ArbOS Elara Alignment (protocol-level ingress filtering).

### 2.4 Capital Loss Invariant — `lostUsd ≡ 0`

The bridge state machine in `evaluateAcrossBridgeTransfer()` enforces:

| State | `inFlightUsd` | `settledUsd` | `lostUsd` |
|-------|---------------|--------------|-----------|
| In-flight | `amountUsd` | `0` | **`0`** |
| Settled | `0` | `amountUsd` | **`0`** |
| Timeout fail-closed | `0` | `0` | **`0`** |
| AML inbound blocked | `0` | `0` | **`0`** |

**Invariant:** Pending bridge liquidity is **never** booked as loss. Timeout paths fail-closed with label `BRIDGE_TIMEOUT_FAIL_CLOSED` without capital write-off.

---

## Pillar 3: The Shield (Core Moat)

**Sub-ms `checkSoilResistance()` & Wasm Engine**

| Moat | Spec | Evidence |
|------|------|----------|
| **Edge soil fuse** | Cross-venue slippage > 0.5% trips fail-closed; TWAP path slicing scheduled | `src/services/risk-control-lib/soil-resistance.ts` |
| **Decision latency** | SLO < 1.0ms · p50 ~106 μs · pure math 0.0002 ms | README § Santenmoku Engine |
| **Wasm hot path** | `#![no_std]` core · Cloudflare budget < 28kb · warm exec < 60μs | `pkg/soil_core.wasm` · M4 milestone |
| **Tri-Sensor Matrix** | BaseFee velocity · RPC jitter radar · phase-shift instability | README § Tri-Sensor Telemetry Matrix |

**Gate posture:** Pre-execution armor intercepts MEV sandwiches, lagging RPCs, and cross-venue phase desync **before** transaction broadcast on Arbitrum One GMX v2 GM pools.

---

## CLI Reproduction

```bash
# Full Vitest suite (173 test files | 765 PASS Clean)
pnpm test

# Targeted Robinhood Chain bridge gate
pnpm exec vitest run tests/adapters/across-ingress-bridge.test.ts

# On-chain contract tests (Foundry)
cd SliverVineGate && forge test && cd ..
```

---

## Related Artifacts

| Path | Role |
|------|------|
| [`docs/architecture/01_TECHNICAL_SPECIFICATION.md`](../architecture/01_TECHNICAL_SPECIFICATION.md) | Triangle Liquidity Loop · Segregated Tranches · Elara alignment |
| [`PILLAR_3_EDGE_SHIELD_WASM_CORESPEC.md`](./PILLAR_3_EDGE_SHIELD_WASM_CORESPEC.md) | Pillar 3 Wasm Shield · R01–R20 · Tri-Sensor |
| [`docs/audit/PRINCIPAL_AUDIT_REPORT.md`](./PRINCIPAL_AUDIT_REPORT.md) | Principal Audit v1.0.0-rc1 · survival matrix |
| [`src/adapters/across-ingress-bridge.ts`](../../src/adapters/across-ingress-bridge.ts) | Edge adapter — unidirectional routing + AML block |
| [`contracts/IngressSafetySwitch.sol`](../../contracts/IngressSafetySwitch.sol) | On-chain compliance filter |
| [`tests/adapters/across-ingress-bridge.test.ts`](../../tests/adapters/across-ingress-bridge.test.ts) | Vitest gate verification |

---

*SilverVine Labs · BUSL-1.1 · Pillar 2 Compliance Ingress Firewall Audit v1.0.0*
