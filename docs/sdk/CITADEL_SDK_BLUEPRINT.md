# `@slivervine/citadel-sdk` — Integration Blueprint

**License:** Apache-2.0 · **Entity:** SilverVine Labs  
**Package:** `@slivervine/citadel-sdk` (monorepo: [`src/sdk/`](../../src/sdk/))  
**EIP-712 domain:** `SliverVineCitadel` · **Version:** `1`  
**Primary execution anchor:** **Arbitrum One (`42161`)** — GMX v2 native gateway + Gate domain SSOT  
**Gate verifyingContract:** `SLIVERVINE_GATE_ADDRESS` ([`src/sdk/constants.ts`](../../src/sdk/constants.ts))

> **Non-inflatable posture:** This SDK performs **stateless pre-execution validation** before UserOp / Session Key signing. Full cryptographic quorum and replay protection are enforced on-chain by `SliverVineGate.verifyAndConsume` — not claimed as complete off-chain ECDSA recovery in this package.

---

## Three Pillars — Multi-Venue Topology

| Pillar | Scope | SDK surface |
|--------|-------|-------------|
| **Pillar 1 — Gatehouse (Account Abstraction & Intent Gateway)** | **Arbitrum One (`42161`)** is the **primary execution anchor / center of gravity** — GMX v2 GM pools, EIP-712 Gate domain, Agent-Citadel-Guard chainId | `ARBITRUM_ONE_CHAIN_ID`, `SLIVERVINE_GATE_ADDRESS`, `verifyAgentIntent()` |
| **Pillar 2 — Compliance Ingress Firewall (Robinhood Ingress as Reference Adapter)** | Venue-agnostic route policy + capital escort · **`IN_FLIGHT_BRIDGE_CAPITAL`** · **Pending-Capital Recognition Invariant (`lostUsd ≡ 0`)**. **Robinhood Chain (`46630`/`4663` → `42161`) is the inaugural Code-Verified / Dry-Run Verified reference adapter** — not the core anchor. Also governs Arbitrum-native routes and Arb ↔ Hyperliquid hedge channels | `assertUnidirectionalBridge()`, `exportRobinhoodAuditSnapshot()`, `quoteRChainYieldToArbitrumGm()` |
| **Pillar 3 — The Shield** | Sub-ms `checkSoilResistance()` semantics (p50 ~106 μs; Wasm warm &lt;60 μs) protect **Arbitrum One (GMX v2) native execution**, **Arb ↔ Hyperliquid cross-venue routing**, and **Arbitrum Edge Worker AI Agents** | `verifyAgentIntent()`, `evaluateSoilCore()`, `guardAgentUserOp()`, legacy-risk re-exports |

```text
┌──────────────────────────────────────────────────────────────────────────┐
│  dApp / AI Agent / Institutional Router                                   │
└───────────────────────────────┬──────────────────────────────────────────┘
                                │
                                ▼
┌──────────────────────────────────────────────────────────────────────────┐
│  @slivervine/citadel-sdk (Apache-2.0) — PRIMARY ANCHOR: Arbitrum One      │
│  ├─ verifyAgentIntent()          — soil + session + deadman + armor       │
│  ├─ evaluateSoilCore()           — Wasm soil_core (p50 ~106μs / <60μs)   │
│  ├─ guardAgentUserOp()           — Agent-Citadel-Guard (chainId 42161)     │
│  ├─ assertUnidirectionalBridge() — Robinhood ingress EXAMPLE (→ 42161)     │
│  ├─ exportRobinhoodAuditSnapshot() — AML cut-off audit cert                │
│  └─ legacy-risk barrel           — HL Session Key gates (Worker re-export) │
└───────────────────────────────┬──────────────────────────────────────────┘
                                │ fail-closed deny
                                ▼
┌──────────────────────────────────────────────────────────────────────────┐
│  Cloudflare Edge Worker (BUSL-1.1)                                        │
│  checkSoilResistance() · buildGmxV2UnsignedOrderPayload() · sequencer-guard│
└───────────────────────────────┬──────────────────────────────────────────┘
                                │ unsigned payload / attestation
                                ▼
┌──────────────────────────────────────────────────────────────────────────┐
│  SliverVineGate.sol (on-chain, Arbitrum One)                              │
│  EIP-712 verifyAndConsume · TTL ≤30s · single-use digest                   │
└──────────────────────────────────────────────────────────────────────────┘
```

### Triangle Liquidity Loop

Closed-loop three-venue routing with **Arbitrum One as the primary yield base**. Hyperliquid provides the Δ-neutral hedge leg; Robinhood Chain is an **optional permissioned ingress** — never a secondary execution anchor.

```text
                    ┌─────────────────────────────────────┐
                    │  Robinhood Chain (Optional Ingress)  │
                    │  46630 testnet · 4663 mainnet filter │
                    │  outbound-only → 42161               │
                    └──────────────────┬──────────────────┘
                                       │ Across escort
                                       ▼
┌──────────────────────────────────────────────────────────────────────────┐
│  Arbitrum One (42161) — PRIMARY YIELD BASE                               │
│  GMX v2 ETH/USDC GM · EIP-712 Gate · uiFeeReceiver · Citadel pre-sign    │
└───────────────────────────────┬──────────────────────────────────────────┘
                                │  1× Δ-neutral hedge
                                ▼
┌──────────────────────────────────────────────────────────────────────────┐
│  Hyperliquid — 1× Short Emergency Liquidity Sponge                       │
│  Session-key signing · nonce-healed · soil + deadman cross-venue fuse    │
└──────────────────────────────────────────────────────────────────────────┘
```

| Leg | Venue | SDK / Worker anchor | Role |
|-----|-------|---------------------|------|
| **Yield base (PRIMARY)** | Arbitrum One · GMX v2 GM | `verifyAgentIntent()` · `ARBITRUM_ONE_CHAIN_ID` · Worker `gmx-v2-order-payload.ts` | Underweight-side GM LP · builder revenue · Gate attestation |
| **Hedge** | Hyperliquid | `verifyAgentIntent()` soil `{ hlSpot, hlPerp, dydxPerp }` · legacy-risk `signAndExecuteOrder` | 1× short Δ-neutral sponge · cross-venue slippage fuse |
| **Ingress (optional)** | Robinhood Chain `46630`/`4663` | `assertUnidirectionalBridge()` · `exportRobinhoodAuditSnapshot()` · `quoteRChainYieldToArbitrumGm()` | Permissioned institutional escort into Arbitrum only |

**Control plane:** Edge Worker (`SystemState` SSOT) evaluates sequencer · oracle lag · soil · RPC radar before any unsigned GMX payload or HL hedge dispatch. **Read API:** `GET /api/yield/triangle`.

---

## Core Architectural Invariants

These invariants are **non-negotiable** across SDK, Edge Worker, and on-chain Gate. Integrators must treat violations as hard failures — never as retryable soft errors.

### 1. Non-Custodial Unidirectional Escort — Pending-Capital Recognition Invariant (`lostUsd ≡ 0`)

| Property | Rule |
|----------|------|
| **Capital custody** | Protocol never books user principal as protocol-owned; capital remains in user Kernel account or venue GM / HL position |
| **Bridge direction** | Robinhood `46630`/`4663` → Arbitrum `42161` outbound only; reverse path ⇒ `AML_INBOUND_TO_ROBINHOOD_BLOCKED` |
| **In-flight accounting** | Pending bridge liquidity labelled `IN_FLIGHT_BRIDGE_CAPITAL`; **Pending-Capital Recognition Invariant:** **`lostUsd` is always `0`** — protocol never prematurely writes off in-flight bridge capital as loss during active execution (until explicit timeout `BRIDGE_TIMEOUT_FAIL_CLOSED`) |
| **SDK enforcement** | `assertUnidirectionalBridge()` · `exportRobinhoodAuditSnapshot()` · `buildRobinhoodAuditSnapshot()` throw on `lostUsd ≠ 0` |

Inbound reverse blocking is **hard-coded** — zero inbound capital to Robinhood is an invariant, not a runtime toggle.

### 2. 30s TTL Heartbeat / Intent Execution Window — Nonce-Healed Self-Exploding Session Keys

Ephemeral session keys are designed to **self-destruct** on TTL breach, heartbeat loss, or nonce desync — closing the signing channel rather than retrying with stale authority. The **30s TTL Heartbeat / Intent Execution Window** is distinct from the underlying cryptographic session key lifetime (bounded up to **24h / 7d** per module scope).

| Layer | Mechanism | Constant / module |
|-------|-----------|-------------------|
| **Gate attestation TTL** | EIP-712 `expiresAtMs` envelope bound ≤ **30s** — Intent Execution Window | `SliverVineGate.verifyAndConsume` · SDK `evaluateAttestation()` |
| **Intent ledger TTL** | Cross-leg 2PC intents expire at **30s** | `intent-ledger/defaults.ts` · `DEFAULT_TTL_MS = 30_000` |
| **HL session heartbeat** | WS heartbeat interval **30s**; expiry ⇒ revocation lock | `SESSION_KEY_HEARTBEAT_MS` · `nonce-auto-healing.ts` |
| **Crypto session key lifetime** | Bounded up to **24h / 7d** (module-scoped) | `agent-intent.ts` · ZeroDev Kernel session modules |
| **Nonce auto-heal** | `Invalid nonce` WS event ⇒ monotonic nonce reset + `signingChannelOpen: false` | `handleInvalidSessionKeyNonce()` · `auditSessionKeyNonceState()` |
| **Self-explode** | Heartbeat expiry or invalid nonce ⇒ `hardlock: true` · `hudState: BLOCKED` — channel closed, not silently retried | `applyRevocationLock()` |

Session keys are **scoped clips** — SDK default clip **≤ $30** (`agent-intent.ts`); protocol hard ceiling **R07 $5,000** (`SESSION_KEY_NOTIONAL_CAP_USD` in `session-key-gates.ts`) — they are not hot-wallet substitutes.

### 3. Zero-Bundler-Rejection Invariant (EIP-7562 Compliance)

Citadel UserOps **must not** trigger bundler rejection under [EIP-7562](https://eips.ethereum.org/EIPS/eip-7562) opcode/storage rules during the validation phase. Bundler failure is a **protocol fault**, not a blind-retry signal.

| Rule | Enforcement |
|------|-------------|
| Validation-phase storage reads | ZeroDev Kernel session modules restrict `callData` to whitelisted targets/selectors |
| Edge pre-screen | `verifyAgentIntent()` + static breaker matrix + `checkSoilResistance()` before `sendUserOperation()` |
| Bundler probe | `eth_supportedEntryPoints` must include EntryPoint **v0.7** (`supportsEntryPoint07`) |
| Fail-closed | Bundler unreachable / timeout ⇒ `BUNDLER_TIMEOUT_FAIL_CLOSED` (`ZERODEV_BUNDLER_FAIL_CLOSED_TIMEOUT_MS = 3_000`) |

See also: [`TECHNICAL_SPECIFICATION.md` §4.0](../architecture/TECHNICAL_SPECIFICATION.md) — EIP-7562 wiki entry.

### 4. CaaS Monetization — 10 bps GMX Native Builder Fee + Up to 25% GMX Referral Rebate

Citadel routes institutional flow to the **underweight side** of GMX GM pools, capturing builder revenue, GMX referral rebates, and positive skew rebates while maintaining Δ-neutral hedge on Hyperliquid.

> **Execution safety:** The **10 bps** builder fee is natively supported by GMX v2 **ExchangeRouter** `uiFeeReceiver` parameters (`GMX_UI_FEE_BPS`). It imposes **zero additional overhead** on the v0.9 sub-ms fail-closed execution path — SDK/Worker inject the fee field on unsigned payloads only; soil fuse, session gates, and Gate attestation are unchanged.

| Revenue channel | Rate | Module |
|-----------------|------|--------|
| **GMX Native Builder Fee** | **+10 bps** `uiFeeReceiver` on every unsigned GMX v2 increase / decrease / deposit | `GMX_UI_FEE_BPS` · `gmx-v2-order-payload.ts` (Worker BUSL) |
| **GMX Referral Rebate** | Up to **25%** of GMX trading fees via registered `referralCode` | `GMX_REFERRAL_CODE_BYTES32` · `gmx-revenue.ts` |
| **Positive skew rebate** | Up to **~5 bps** price-impact rebate on underweight-side flow (venue-native; separate from `uiFeeReceiver`) | `gmx-v2-balancer` · soil price-impact fuse |
| **Combined CaaS stack** | **10 bps builder + up to 25% referral + skew rebate** — never conflated with custody or performance fee | Grant audit · `GET /api/grant-audit` |

SDK gates signing **before** Worker injects `uiFeeReceiver`; skew routing decisions live in Edge soil + balancer — not in SDK exports.

---

## Dependency Audit — Code-Level (2026-08-24)

Audit scope: [`src/sdk/`](../../src/sdk/) · [`tests/sdk/`](../../tests/sdk/)

| Topology | Verified in SDK/tests | Boundary notes |
|----------|----------------------|----------------|
| **a) Arbitrum One Native Gateway** | ✅ `verifyAgentIntent()` + `evaluateSoilCore()` + `ARBITRUM_ONE_CHAIN_ID` | GMX v2 **unsigned order payload** + **10 bps `uiFeeReceiver`** live in Worker [`gmx-v2-order-payload.ts`](../../src/services/adapters/gmx-v2-order-payload.ts) (BUSL) — **not** exported from `src/sdk/index.ts`. SDK gates signing **before** Worker broadcast. |
| **b) Arbitrum ↔ Hyperliquid Delta Escort** | ✅ `verifyAgentIntent()` soil `{ hlSpot, hlPerp, dydxPerp }` + `armor.rpcLatencyMs` + deadman; legacy-risk exports `assertSessionKeyExecutionGates`, `signAndExecuteOrder` | 1× short hedge provenance enforced at Worker Session Key adapter + FoolProof/VineShield — SDK pre-sign cross-venue fuse. |
| **c) Robinhood → Arbitrum Ingress** | ✅ `assertUnidirectionalBridge()` · `exportRobinhoodAuditSnapshot()` · `tests/sdk/citadel-sdk-bridge-armor.test.ts` | Outbound `46630`/`4663` → `42161` only; inbound `42161` → Robinhood ⇒ `AML_INBOUND_TO_ROBINHOOD_BLOCKED`. |
| **Primary anchor = Arbitrum One** | ✅ `AGENT_GUARD_CHAIN_ID = ARBITRUM_ONE_CHAIN_ID` in [`agent-citadel-guard.ts`](../../src/core/agent-citadel-guard.ts); Gate EIP-712 domain SSOT `42161` | Robinhood is ingress escort only — never secondary execution anchor. |

**Public export SSOT** ([`src/sdk/index.ts`](../../src/sdk/index.ts)):

```ts
verifyAgentIntent(input: AgentIntentInput): AgentIntentVerdict
assertUnidirectionalBridge(input: UnidirectionalBridgeInput): BridgeEscortVerdict
exportRobinhoodAuditSnapshot(input: RobinhoodAuditSnapshotInput): Promise<RobinhoodAuditSnapshot>
evaluateSoilCore(input: WasmSoilCoreInput): { output; wasmUsed; elapsedUs }
guardAgentUserOp(input: AgentCitadelGuardInput): Promise<AgentCitadelGuardResult>
```

---

## Module Map

| Module | Path | Role |
|--------|------|------|
| Public entry | [`src/sdk/index.ts`](../../src/sdk/index.ts) | Re-exports SDK surface + legacy-risk barrel |
| Agent armor | [`src/sdk/agent-intent.ts`](../../src/sdk/agent-intent.ts) | `verifyAgentIntent()` — sub-ms gate formula |
| Wasm soil | [`src/sdk/soil-wasm.ts`](../../src/sdk/soil-wasm.ts) | `pkg/soil_core.wasm` loader · &lt;28 KiB budget |
| Bridge escort | [`src/sdk/unidirectional-bridge.ts`](../../src/sdk/unidirectional-bridge.ts) | Outbound-only Robinhood → Arbitrum |
| Robinhood audit | [`src/sdk/robinhood-audit-snapshot.ts`](../../src/sdk/robinhood-audit-snapshot.ts) | `exportRobinhoodAuditSnapshot()` cut-off cert |
| Agent guard | [`src/core/agent-citadel-guard.ts`](../../src/core/agent-citadel-guard.ts) | Deadman Switch · chainId **42161** |
| GMX payload (Worker) | [`src/services/adapters/gmx-v2-order-payload.ts`](../../src/services/adapters/gmx-v2-order-payload.ts) | Unsigned GMX v2 + `uiFeeReceiver` (BUSL — not SDK export) |
| Tests | [`tests/sdk/citadel-sdk-intent.test.ts`](../../tests/sdk/citadel-sdk-intent.test.ts) · [`tests/sdk/citadel-sdk-bridge-armor.test.ts`](../../tests/sdk/citadel-sdk-bridge-armor.test.ts) | Injection · attestation · bridge · armor |

---

## Pillar 2 — Compliance Ingress Firewall (with Robinhood Ingress as Reference Adapter)

Robinhood Chain is the **inaugural Code-Verified / Dry-Run Verified reference adapter** for Pillar 2 — venue-agnostic unidirectional AML escort and Pending-Capital Recognition Invariant (`IN_FLIGHT_BRIDGE_CAPITAL`, `lostUsd ≡ 0`). It is **not** the protocol anchor.

| Route | Policy | SDK call |
|-------|--------|----------|
| `46630` / `4663` → `42161` | Outbound escort OK · `lostUsd ≡ 0` | `assertUnidirectionalBridge()` |
| `42161` → `46630` / `4663` | **Blocked** (AML isolation) | `capitalLabel: AML_INBOUND_TO_ROBINHOOD_BLOCKED` |
| Arbitrum-native GMX / HL hedge | Session + soil gates before sign | `verifyAgentIntent()` |
| Yield quote (decision layer) | Size gates + bridge escort + GM destination | `quoteRChainYieldToArbitrumGm()` |

**Inbound reverse blocking is hard-coded** — zero inbound capital to Robinhood is an invariant, not a runtime toggle.

---

## Pillar 3 — The Shield (Multi-Venue AI Armor)

`checkSoilResistance()` (Edge Worker) and SDK `evaluateSoilCore()` / `verifyAgentIntent()` share the same soil fuse semantics:

| Protected surface | Mechanism | Latency SLO |
|-------------------|-----------|-------------|
| **Arbitrum One GMX v2 native execution** | Soil depth / slippage fuse before unsigned payload broadcast | p50 ~106 μs Shield/TS Gateway · Wasm warm &lt;60 μs |
| **Arb ↔ Hyperliquid cross-venue routing** | `hlSpot` / `hlPerp` / `dydxPerp` cross-spread + Configurable Dynamic Slippage Deadman | `armor.rpcLatencyMs` ≤ `PGATE_MAX_LATENCY_MS` (200 ms) |
| **Arbitrum Edge Worker AI Agents** | Prompt injection intercept · Session Key clip/TTL · Gate attestation envelope | Sub-ms Wasm path |

Production decision formula:

```text
allowedToSign = injectionOk ∧ digestOk ∧ soilOk ∧ sessionOk ∧ gasOk ∧ deadmanOk ∧ armorOk ∧ attOk ∧ wasmOk
```

| Gate | Limit | Module |
|------|-------|--------|
| Soil slippage | ≤ 0.5% (`MAX_SLIPPAGE`) | Wasm `soil_core` or TS fallback |
| SDK default session clip | ≤ **$30** default | `agent-intent.ts` — integrator-facing soft default |
| Protocol hard ceiling (R07) | ≤ **$5,000** notional | `SESSION_KEY_NOTIONAL_CAP_USD` · `session-key-gates.ts` — physical severance on breach |
| Session TTL (intent window) | ≤ **30s** heartbeat / intent | `DEFAULT_TTL_MS` · `WS_HEARTBEAT_INTERVAL_MS` |
| Crypto session key lifetime | ≤ **7d** (module-scoped) | `agent-intent.ts` |
| RPC / Pgate latency | ≤ **200 ms** | `PGATE_MAX_LATENCY_MS` in [`src/config/constants.ts`](../../src/config/constants.ts) |
| Sandwich risk | ≤ **25 bps** | `AGENT_ARMOR_SANDWICH_MAX_BPS` |
| Wasm warm path | **&lt; 60 μs** warm · p50 ~106 μs Shield/TS Gateway | [`pkg/soil_core.wasm`](../../pkg/soil_core.wasm) |

---

## Code Examples — `@slivervine/citadel-sdk`

### 1. Arbitrum One GMX v2 Soil-Protected Order Routing

SDK gates signing on **Arbitrum One (`42161`)**. GMX unsigned payload construction (incl. 10 bps `uiFeeReceiver`) is Worker-side:

```ts
import {
  verifyAgentIntent,
  evaluateSoilCore,
  ensureSoilWasm,
  ARBITRUM_ONE_CHAIN_ID,
  EIP712_DOMAIN_NAME,
  SLIVERVINE_GATE_ADDRESS,
} from "@slivervine/citadel-sdk";

// Worker (BUSL monorepo internal — not SDK export):
// import { buildGmxV2UnsignedOrderPayload } from "../services/adapters/gmx-v2-order-payload";
// const unsigned = buildGmxV2UnsignedOrderPayload({ ... });
// unsigned.addresses.uiFeeReceiver → GMX_UI_FEE_RECEIVER (10 bps treasury)

ensureSoilWasm();
const { hlSpot, hlPerp, dydxPerp, depthUsd } = await fetchGmSoilSnapshot();
const soil = evaluateSoilCore({
  hlSpot, hlPerp, dydxPerp, depthUsd,
  orderSizeUsd: 500, accountBalanceUsd: 10_000,
  maxSlippage: 0.005, minDepthUsd: 50_000,
});
if (soil.output.tripped) throw new Error("SOIL_TRIPPED");

const intentDigest = "0x…"; // keccak256(unsigned GMX v2 order bytes)
const verdict = verifyAgentIntent({
  intentDigest,
  sessionKey: { agentAddress: "0x…", maxOrderClipUsd: 30, expiresAtMs: Date.now() + 86_400_000 },
  soil: { symbol: "ETH-PERP", hlSpot, hlPerp, dydxPerp, depthUsd },
  gasBurst: { estimatedGasCostUsd: 0.12, sponsored: true, chainId: ARBITRUM_ONE_CHAIN_ID },
  attestation: {
    digest: intentDigest,
    expiresAtMs: Date.now() + 30_000,
    sig: "0x…",
    verifyingContract: SLIVERVINE_GATE_ADDRESS,
    domainName: EIP712_DOMAIN_NAME,
  },
  preset: "production",
});
if (!verdict.allowedToSign) throw new Error(verdict.reasons.join("|"));
// → proceed to GMX broadcast on Arbitrum One only after verdict.ok
```

### 2. Arbitrum ↔ Hyperliquid Delta Hedge Intent

Cross-venue soil + Session Key clip + RPC latency armor before HL short-leg signing:

```ts
import {
  verifyAgentIntent,
  guardAgentUserOp,
  AGENT_DEADMAN_SLIPPAGE_BPS,
  EIP712_DOMAIN_NAME,
  SLIVERVINE_GATE_ADDRESS,
} from "@slivervine/citadel-sdk";

const intentDigest = "0x…"; // HL Session Key order digest (1× short hedge leg)
const verdict = verifyAgentIntent({
  intentDigest,
  sessionKey: { agentAddress: "0x…", maxOrderClipUsd: 30, expiresAtMs: Date.now() + 7 * 86_400_000 },
  soil: {
    symbol: "ETH-PERP",
    hlSpot: 3500,
    hlPerp: 3501.2,   // cross-venue spread monitored
    dydxPerp: 3500.5,
    depthUsd: 500_000,
    isTestnet: false,
  },
  deadman: { maxSlippageBps: AGENT_DEADMAN_SLIPPAGE_BPS, soilResistanceThreshold: 50 },
  armor: { rpcLatencyMs: 85 }, // fail-closed if > PGATE_MAX_LATENCY_MS (200)
  attestation: {
    digest: intentDigest,
    expiresAtMs: Date.now() + 30_000,
    sig: "0x…",
    verifyingContract: SLIVERVINE_GATE_ADDRESS,
    domainName: EIP712_DOMAIN_NAME,
  },
  preset: "production",
});
if (!verdict.allowedToSign) throw new Error(verdict.reasons.join("|"));

// Optional: Agent-Citadel-Guard deadman reject envelope (chainId 42161)
const guard = await guardAgentUserOp({
  intent: { maxSlippageBps: 50, soilResistanceThreshold: 50, targetMarket: "ETH-PERP" },
  soil: { symbol: "ETH-PERP", hlSpot: 3500, hlPerp: 3501.2, dydxPerp: 3500.5, depthUsd: 500_000 },
});
if (!guard.allowed) throw new Error("DEADMAN_SWITCH_TRIPPED");
```

Legacy-risk barrel (same package) also exports `assertSessionKeyExecutionGates` and `signAndExecuteOrder` for Worker HL pipelines.

### 3. Robinhood Unidirectional Escort

```ts
import {
  assertUnidirectionalBridge,
  exportRobinhoodAuditSnapshot,
  quoteRChainYieldToArbitrumGm,
  AML_INBOUND_TO_ROBINHOOD_BLOCKED,
  ROBINHOOD_TESTNET_CHAIN_ID,
  ARBITRUM_ONE_CHAIN_ID,
} from "@slivervine/citadel-sdk";

// Outbound escort: Robinhood → Arbitrum One (primary anchor)
const escort = assertUnidirectionalBridge({
  sourceChainId: ROBINHOOD_TESTNET_CHAIN_ID, // or 4663 mainnet
  destChainId: ARBITRUM_ONE_CHAIN_ID,
  amountUsd: 2_500,
  wallet: "0x…",
  initiatedAtMs: Date.now(),
});
if (!escort.ok || escort.lostUsd !== 0) throw new Error(escort.reasons.join("|"));

// Inbound reverse path — always blocked
const inbound = assertUnidirectionalBridge({
  sourceChainId: ARBITRUM_ONE_CHAIN_ID,
  destChainId: ROBINHOOD_TESTNET_CHAIN_ID,
  amountUsd: 10,
  wallet: "0x…",
  initiatedAtMs: Date.now(),
});
// inbound.ok === false · inbound.capitalLabel === AML_INBOUND_TO_ROBINHOOD_BLOCKED

const quote = quoteRChainYieldToArbitrumGm({
  wallet: "0x…",
  symbol: "USDC",
  assetKind: "idle",
  amountUsd: 2_500,
  sourceChainId: ROBINHOOD_TESTNET_CHAIN_ID,
});
// quote.destChainId === 42161 · quote.bridgeEscortOk === true

const cert = await exportRobinhoodAuditSnapshot({
  robinhoodChainId: ROBINHOOD_TESTNET_CHAIN_ID,
  amountUsd: 2_500,
  wallet: "0x…",
  initiatedAtMs: Date.now(),
  cutoffTimestamp: new Date().toISOString(),
});
// cert.inboundBlocked === true · cert.lostUsd === 0
```

---

## EIP-712 Domain — `SliverVineCitadel`

| Field | Value |
|-------|-------|
| `name` | `SliverVineCitadel` |
| `version` | `1` |
| `chainId` | **42161** (Arbitrum One — primary anchor) |
| `verifyingContract` | `SLIVERVINE_GATE_ADDRESS` |

Attestation envelopes must bind: `digest` · `expiresAtMs` (≤ 30s) · `sig` · `verifyingContract` · `domainName`.

---

## Audit & Telemetry

### `exportRobinhoodAuditSnapshot()`

Immutable Robinhood Chain audit cut-off certificate — SHA-256 signed JSON for institutional diligence exports.

| Field | Meaning |
|-------|---------|
| `robinhoodChainId` | `46630` testnet · `4663` mainnet |
| `inboundBlocked` | AML isolation proof |
| `lostUsd` | Pending-Capital Recognition Invariant — strict zero (`0`) during active execution |
| `cutoffTimestamp` | Immutable snapshot boundary |

**HTTP mirror:** `GET /api/robinhood-audit-snapshot?chainId=46630&amountUsd=2500`

### 5% Emergency Margin Buffer (HL Cross-Margin)

Verified by [`tests/risk-control/margin-buffer.test.ts`](../../tests/risk-control/margin-buffer.test.ts) — `DEFAULT_CROSS_MMR = 0.05`.

---

## Growth Strategy & Agentic Framework Distribution Pipeline

| Channel | Target | SDK surface |
|---------|--------|-------------|
| **1. Agentic Framework Adapters** | Eliza (ai16z) · LangChain · AutoGPT | `guardAgentUserOp()` · `evaluateAgentCitadelGuard()` · `verifyAgentIntent()` — pre-bundler fail-closed hook |
| **2. B2B Trading Bot CaaS** | Telegram Trading Bots · Institutional Desks | Sub-ms `checkSoilResistance()` + Gate attestation as Security Citadel in front of bot signers · no custody |
| **3. Dev Incentive Flywheel** | SDK integrators | **50% revenue share** of GMX **10 bps** builder fee for verified integrator partner wallets |

**Pendle risk guard:** [`pendle-pt-expiry-guard.ts`](../../src/adapters/pendle/pendle-pt-expiry-guard.ts) · `evaluatePendlePtExpiryRisk()` — fail-closed when PT maturity **&lt; 7 days** AND yield jitter **&gt; 200 bps**.

**Dune telemetry:** [`DUNE_DASHBOARD_SPECIFICATION.md`](../telemetry/DUNE_DASHBOARD_SPECIFICATION.md).

---

## Verification

```bash
pnpm exec vitest run tests/sdk/citadel-sdk-intent.test.ts
pnpm exec vitest run tests/sdk/citadel-sdk-bridge-armor.test.ts
pnpm test -- --run                           # Current Branch Live Expected Output: 174 files | 768 PASS (Locked Minimum Proposal Baseline: 168 | 742)
pnpm audit:fast
pnpm build:wasm                              # rebuild pkg/soil_core.wasm
```

**Locked Minimum Proposal Baseline:** `168 files | 742 PASS (100% Clean)` · **Current Branch Live Expected Output:** `174 files | 768 PASS (100% Clean)`

---

## Related

- SDK README: [`src/sdk/README.md`](../../src/sdk/README.md)
- Technical Spec: [`docs/architecture/TECHNICAL_SPECIFICATION.md`](../architecture/TECHNICAL_SPECIFICATION.md)
- Wasm core: [`src/wasm/soil_core.rs`](../../src/wasm/soil_core.rs)
- On-chain Gate: [`SliverVineGate/`](../../SliverVineGate/)
- Robinhood audit: [`docs/audit/ROBINHOOD_CHAIN_SAFETY_GATE_AUDIT.md`](../audit/ROBINHOOD_CHAIN_SAFETY_GATE_AUDIT.md)
