# Pillar 1: The Gatehouse — Opt-In ZeroDev Kernel v3 AA Analysis (EIP-7702 Comparative)

| Field | Value |
|-------|-------|
| **Document** | Pillar 1: Gatehouse — ZeroDev Kernel v3 AA Analysis |
| **Version** | **v1.0.0** |
| **Classification** | Grant / Institutional Allocator · AA Architecture Benchmark |
| **Branch baseline** | `v1.0_push_BDLW` |
| **Entity** | SilverVine Labs · SliverVine Protocol (BeDelta Living Water v1.0 / BeΔ) |
| **Baseline** | **Vitest SSOT:** **173 test files | 765 PASS Clean** · Wasm **91.2 KiB gzip** · Shield **p50 ~106 µs** (TS Gateway path) · Wasm warm **&lt;60 µs** |
| **Related SSOT** | [`01_INSTITUTIONAL_DUE_DILIGENCE_MEMORANDUM.md`](./01_INSTITUTIONAL_DUE_DILIGENCE_MEMORANDUM.md) · [`01_TECHNICAL_SPECIFICATION.md`](../architecture/01_TECHNICAL_SPECIFICATION.md) §2.4 · [Risk Spectrum §0.1](../architecture/03_RISK_MITIGATION_AND_DISCLAIMER_FRAMEWORK.md#01-what-slivervine-citadel-shield-does--and-does-not--guarantee) |

> **Boundary:** ZeroDev Kernel v3 is an **Opt-In Pillar 1 Account Abstraction Layer** (`USE_ZERODEV_AA` default-off). **Pillar 3 Edge Wasm Shield** (`checkSoilResistance()` · p50 ~106 µs · `pkg/soil_core.wasm`) and **Pillar 2 Arbitrum Native Ingress** function **100% independently** — ZeroDev failure never impairs sub-ms pre-broadcast protection or bridge `lostUsd ≡ 0` accounting.

> **Scope note:** This document compares **consumer-focused EIP-7702 AA implementations** with SliverVine Protocol's **institutional-grade pre-execution risk substrate**. It is an architectural diligence artifact — not legal or investment advice.

---

## 1. Executive Summary

EIP-7702 and ERC-7579 enable EOAs to delegate execution to smart-account logic — unlocking **1-click intent composition**, **gas sponsorship**, and **session-scoped permissions**. Consumer AA stacks optimize for **conversion and retention**: long-lived session keys, broad contract scopes, and post-hoc policy checks.

SliverVine Protocol (BeDelta Living Water v1.0 / BeΔ) offers ZeroDev Kernel v3 as an **opt-in Pillar 1 Account Abstraction Layer** — **Code-Verified / Dry-Run Verified** (`pnpm test:zerodev`). Kernel v4 + EIP-7702 intent composer is **⏳ Post-Grant Roadmap (V1.5)**. ZeroDev **never substitutes** risk governance and **does not power** sub-ms latency (that is 100% `pkg/soil_core.wasm`). Frictionless onboarding rides on the same **Three Pillars** stack:

```text
[Pillar 1: Opt-In Gatehouse (AA)] ZeroDev Kernel v3 Session Keys & EIP-712 Scopes (optional)
[Pillar 2: Compliance Ingress Firewall] Arbitrum Native Ingress + optional reference adapters (Robinhood / Across)
 → outbound escort · AML inbound block · payloadHash binding · lostUsd ≡ 0
[Pillar 3: Shield] checkSoilResistance() · pkg/soil_core.wasm · Fail-Closed pre-broadcast (independent of AA)
```

> **Pillar 1 verification scope:** **[Pillar 1: The Gatehouse (Auth)]** authorization mechanics (`sessionOk`, `allowedToSign`) are evaluated via secure dry-run adapters in the E2E demo (`pnpm run demo:e2e`); comprehensive ZeroDev Kernel v3 integration coverage is verified under `pnpm test:zerodev`.

**Institutional differentiation:** Sub-ms pre-broadcast protection is **100% Wasm-powered** (`checkSoilResistance()` · p50 ~106 µs · `pkg/soil_core.wasm`) — **independent of ZeroDev**. When AA is opted in, every UserOp is additionally bound to **30s TTL Heartbeat / Intent Execution Window** and **Pending-Capital Recognition Invariant (`lostUsd ≡ 0`)** before any GMX or Hyperliquid broadcast.

---

## 2. Industry Context — Consumer EIP-7702 AA

| Consumer AA design goal | Typical implementation | Residual risk profile |
|-------------------------|------------------------|------------------------|
| **Low signup friction** | EIP-7702 delegation · social login · sponsored first tx | Users may not understand delegated authority scope |
| **Persistent sessions** | Session keys lasting **hours to days** | Stolen session material has extended blast radius |
| **Broad intent scope** | Generic contract call permissions | Withdrawal / approval paths harder to exclude |
| **Policy after broadcast** | Backend simulation · rate limits · manual review | **Fail-open** window between bundler and venue settlement |
| **Bridge UX simplification** | In-flight balance shown as "available" | Naked delta risk during unsettled escort |

These patterns are appropriate for **retail conversion funnels**. They are **insufficient** for institutional delta-neutral vault infrastructure where **pre-execution severance** and **honest pending-asset labeling** are hard invariants.

---

## 3. Comparative Matrix — Consumer AA vs. SliverVine Citadel Shield

| Architecture dimension | Consumer EIP-7702 AA (industry benchmark) | SliverVine Citadel Shield institutional substrate (code-verified) |
|------------------------|-------------------------------------------|---------------------------------------------|
| **Primary objective** | UX · onboarding · transaction volume | **Fail-Closed risk mitigation** · honest accounting · bounded tail loss |
| **Account runtime** | EIP-7702 delegation / ERC-4337 smart account | ZeroDev **Kernel v3** (✅ Code-Verified / Dry-Run Verified) → **Kernel v4 + EIP-7702** (⏳ roadmap) |
| **Session key TTL** | Hours / days (minimize re-auth) | **30s TTL Heartbeat / Intent Execution Window** (`WS_HEARTBEAT_INTERVAL_MS = 30_000` · `DEFAULT_TTL_MS = 30_000`); underlying cryptographic session key lifetime bounded up to **24h / 7d** · heartbeat expiry → `SESSION_KEY_HEARTBEAT_EXPIRED` |
| **Execution scope** | Broad contract interaction | **`ORDER_EXECUTE` only** — zero withdrawal authority (R06) |
| **Notional cap** | Often uncapped or wallet-level | **`SESSION_KEY_NOTIONAL_CAP_USD = $5,000`** (v1.0 live) · R07 physical severance |
| **Risk gate placement** | Post-simulation / backend policy (fail-open tendency) | **Pre-broadcast Edge SSOT** — `checkSoilResistance()` **p50 ~106 µs** Shield/TS Gateway · Wasm warm **&lt;60 µs** · `pkg/soil_core.wasm` |
| **Gate philosophy** | Prefer execution with monitoring | **Fail-Closed** — `signingChannelOpen: false` · UserOp rejected pre-bundler |
| **Paymaster exhaustion** | Fallback to user-paid gas (unguarded path risk) | **`ZERODEV_DAILY_SPONSORSHIP_EXHAUSTED`** → fail-closed to self-pay **after** soil gate — not unguarded broadcast |
| **Intent binding** | Optional calldata hashing | **`payloadHash()`** → `SliverVineGate.sol` consume-once attestation |
| **Bridge in-flight** | Often booked as live NAV | **`IN_FLIGHT_BRIDGE_CAPITAL`** · **Pending-Capital Recognition Invariant (`lostUsd ≡ 0`)** · no naked GM/HL until `SETTLED` |
| **Emergency response** | Admin pause · multisig | **Automated** R17 daily severance · R20 physical deadlock · `rootProtection()` |
| **Regression proof** | Vendor QA / audit snapshots | **173 test files | 765 PASS Clean** · `zerodev-aa-gate.test.ts` **4/4** · chaos matrix **255/255** |

> **Pillar 1 alignment note:** **[Pillar 1: The Gatehouse (Auth)] ZeroDev Kernel v3 Session Keys & EIP-712 Scopes** — `sessionOk` / `allowedToSign` gates are demonstrated in `pnpm run demo:e2e` (secure dry-run); full Kernel v3 harness regression is under `pnpm test:zerodev` (`tests/adapters/zerodev-aa-dryrun-harness.test.ts`).

---

## 4. Deep Dive — Three Institutional Anchors

### 4.1 [Pillar 1: The Gatehouse (Auth)] — 30s TTL Heartbeat / Intent Execution Window

Consumer AA extends session duration to reduce wallet prompts. SliverVine Protocol **minimizes signing-channel exposure** via a **30s TTL Heartbeat / Intent Execution Window** — distinct from the underlying cryptographic session key lifetime (bounded up to **24h / 7d** per module scope):

| Control | Value / behavior | SSOT |
|---------|------------------|------|
| **HL WS heartbeat** | **30s** interval — **Intent Execution Window** | `adapters/hl/websocket/types.ts` · `WS_HEARTBEAT_INTERVAL_MS` |
| **Heartbeat expiry** | `SESSION_KEY_HEARTBEAT_EXPIRED` · channel lock | `nonce-auto-healing.ts` |
| **2PC intent TTL** | **`DEFAULT_TTL_MS = 30_000`** | `intent-ledger/defaults.ts` |
| **Crypto session key lifetime** | Bounded up to **24h / 7d** (module-scoped) | `agent-intent.ts` · ZeroDev Kernel session modules |
| **Scope** | **`ORDER_EXECUTE`** only | `hl-session/permissions.ts` |
| **Notional fuse** | **$5,000** → `SESSION_KEY_HARDLOCK_INTERCEPTED` | `session-key-gates.ts` |

```text
Session key minted → 30s heartbeat / intent window (crypto key may live up to 24h/7d)
 ├─ valid heartbeat + soil PASS → ORDER_EXECUTE allowed
 └─ expiry / cap breach → signingChannelOpen: false (Fail-Closed)
```

> **Institutional rationale:** A stolen session key has **at most ~30 seconds** of active intent window and **$5k notional** blast radius — not an hours-long delegated wallet.

### 4.2 106 µs Shield/TS Gateway Soil Gate (Shield)

Consumer stacks often simulate transactions **after** UserOp construction. SliverVine Protocol evaluates soil **before** bundler dispatch:

| Metric | Locked value | SSOT |
|--------|-------------|------|
| **Shield latency (p50)** | **~106 µs** — Shield/TS Gateway path | Edge `checkSoilResistance()` · `pkg/soil_core.wasm` |
| **Wasm warm execution** | **&lt;60 µs** | `pkg/soil_core.wasm` hot path |
| **Worker bundle (measured)** | **91.2 KiB gzip** | `pnpm bundle:measure` |
| **Slippage fuse** | **0.5%** (`MAX_SLIPPAGE`) | `soil-resistance-types.ts` |
| **Depth floor** | **$100,000** (`MIN_DEPTH_USD`) | soil matrix |
| **Trip behavior** | `TRIP_SOIL_RESISTANCE` · no broadcast | `zerodev-aa-gate.test.ts` |

```text
UserOp draft
 │
 ▼
verifyAgentIntent() / checkSoilResistance() ← p50 ~106 µs Wasm (Fail-Closed)
 │
 ├─ ALLOW → payloadHash bind → Paymaster → bundler
 └─ TRIP → signingChannelOpen: false (never reaches mempool)
```

> **EIP-7702 roadmap alignment:** Kernel v4 intent composition adds **UX surface area** — the **106 µs Shield does not move**. Edge remains SSOT; ZeroDev delivers execution plumbing, Citadel decides.

### 4.3 Pending-Capital Recognition Invariant — `lostUsd ≡ 0` (Compliance Ingress Firewall + Bridge SSOT)

Consumer bridge UX often treats in-flight tokens as deployable balance. SliverVine Protocol **labels and isolates** via the **Pending-Capital Recognition Invariant** — the protocol never prematurely writes off in-flight bridge capital as a loss during active execution:

| `capitalLabel` | Deployable? | `lostUsd` |
|----------------|-------------|-----------|
| `IN_FLIGHT_BRIDGE_CAPITAL` | **No** — naked delta forbidden | **0** |
| `BRIDGE_TIMEOUT_FAIL_CLOSED` | **No** — fail-closed severance | **0** |
| `SETTLED` / Arbitrum-native | Yes — full soil envelope | **0** |

**Invariant:** Pending bridge liquidity is **never mis-booked as principal loss** — eliminating phantom NAV inflation during Robinhood escort. When AA is opted in, ZeroDev orchestrates the UserOp; SliverVine Protocol's **`evaluateAcrossBridgeTransfer()`** state machine governs deployability regardless of AA path.

**Test anchor:** `tests/adapters/across-ingress-bridge.test.ts` · **5/5 PASS**

---

## 5. Execution Pipeline — Consumer vs. SliverVine Protocol

### 5.1 Consumer EIP-7702 (Typical)

```text
EOA → EIP-7702 delegate → UserOp → bundler → venue
 ↑
 policy check (soft / post-hoc)
```

### 5.2 SliverVine Protocol Institutional Stack (V1.0)

```text
Kernel Smart Account (ZeroDev v3)
 │
 ▼
[Pillar 1: The Gatehouse (Auth)] ZeroDev Kernel v3 Session Keys & EIP-712 Scopes
 │ sessionOk · allowedToSign · Paymaster caps
 │
 ▼
Pillar 2 Compliance Ingress Firewall — payloadHash() bind · bridge direction validate
 │
 ▼
Pillar 3 — checkSoilResistance() · p50 ~106 µs · Fail-Closed
 │
 ├─ soil TRIP → sever signing channel
 │
 └─ soil ALLOW → SliverVineGate attestation → GMX / HL broadcast
```

---

## 6. How SliverVine Protocol Adopts ZeroDev EIP-7702 Without Architectural Overhaul

**v1.0 ZeroDev AA active scope:**

| Stage | Status | Notes |
|-------|--------|-------|
| **① Sign-in** | ✅ v1.0 Delivered (Sepolia verified) | Kernel account resolution |
| **② Fund (Smart Routing)** | 📋 Reference Harness & Spec (Vitest dry-run verified) | Not production ingress baseline |
| **③ Gas** | ✅ v1.0 Delivered (Sepolia verified) | $0.50/op · $10/day cap |
| **④ Authorize** | ✅ v1.0 Delivered (Sepolia verified) | ERC-7579 scoped session keys |
| **⑤ Execute** | ✅ v1.0 Delivered (Sepolia verified) | UserOp after Shield PASS |
| **⑥ Recover** | ⏳ Post-Grant Roadmap (V1.5 Spec) | Out of scope for v1.0 (upstream Kernel/EOA owner) |
| **⑦ Compose** | ⏳ Post-Grant Roadmap (V2.0 CaaS) | Off-chain 2PC intent ledger (partial internal coverage) |

| ZeroDev capability | SliverVine Citadel Shield usage | Risk control preserved |
|--------------------|-----------|------------------------|
| **Paymaster sponsorship** | Opt-in onboarding + agent gas | Daily cap **`DAILY_SPONSORSHIP_LIMIT_USD`** · exhaustion → self-pay fallback **after** soil gate |
| **Smart Routing deposit** | 📋 Reference Harness — Robinhood → Arbitrum GM calldata spec | `IN_FLIGHT_BRIDGE_CAPITAL` until settled · production baseline = Arbitrum Native Ingress |
| **Kernel v4 / EIP-7702 composer** | ⏳ Post-Grant Roadmap (V1.5) — EOA → Agent Smart Account | Same Wasm Shield · same 30s TTL · same `payloadHash()` |
| **Session modules (ERC-7579)** | `ORDER_EXECUTE` scoped keys | R06 · R07 · heartbeat auto-healing |

**Design rule (Tech Spec §2.4):** Adapter swap (v3 → v4) must **not** rewrite Shield or Wasm semantics. EIP-7702 is an **execution-plane upgrade**, not a relaxation of Fail-Closed gates.

---

## 7. Verification Checklist

| # | Claim | Command / artifact | Expected |
|---|-------|-------------------|----------|
| 1 | Full regression | `pnpm test -- --run` | **173 test files | 765 PASS Clean** |
| 2 | ZeroDev AA gate fail-closed | `pnpm exec vitest run tests/adapters/zerodev-aa-gate.test.ts` | **4/4 PASS** |
| 2b | Pillar 1 Gatehouse dry-run harness | `pnpm test:zerodev` | Kernel v3 session scopes · EIP-712 dry-run PASS |
| 3 | Session R07 $5k cap | `pnpm exec vitest run tests/services/session-key-gates.test.ts` | Severance on breach |
| 4 | 30s heartbeat expiry | `pnpm exec vitest run tests/services/nonce-auto-healing.test.ts` | Lock on expiry |
| 5 | Bridge honest accounting | `pnpm exec vitest run tests/adapters/across-ingress-bridge.test.ts` | **5/5 · lostUsd ≡ 0** |
| 6 | Wasm bundle budget | `pnpm bundle:measure` | **91.2 KiB gzip** |
| 7 | Live audit | `GET /api/grant-audit` | Guard states exposed |

---

## 8. Auditor & Allocator Defense Narrative

> Consumer AA protocols optimize for **making DeFi easy to click**. SliverVine Protocol optimizes for **making 1-click execution mathematically safe before broadcast**.
>
> Sub-ms protection is **100% Wasm-powered** (`soil_core.wasm` · p50 ~106 µs) — **not** provided by ZeroDev. When institutions **opt in** to ZeroDev Kernel v3, every UserOp additionally passes **30s TTL Heartbeat / Intent Execution Window** (crypto session keys bounded up to 24h/7d) and **Pending-Capital Recognition Invariant (`lostUsd ≡ 0`)**. Under a 3σ market shock, the AA pipeline **fails closed** — `signingChannelOpen: false` — rather than opening naked delta or mis-booking in-flight capital as deployable NAV. Institutions may bypass AA entirely via **Arbitrum Native Ingress** without losing Shield protection.

---

## Related Documents

| Document | Purpose |
|----------|---------|
| [`01_INSTITUTIONAL_DUE_DILIGENCE_MEMORANDUM.md`](./01_INSTITUTIONAL_DUE_DILIGENCE_MEMORANDUM.md) | Full DDIP · Risk & Disclaimer · Basel mapping |
| [`01_TECHNICAL_SPECIFICATION.md`](../architecture/01_TECHNICAL_SPECIFICATION.md) §2.4 | Opt-In ZeroDev Kernel v3/v4 · Wasm Shield decoupled (§2.4.1) |
| [`03_PILLAR_2_COMPLIANCE_INGRESS_FIREWALL_AUDIT.md`](./03_PILLAR_2_COMPLIANCE_INGRESS_FIREWALL_AUDIT.md) | Three Pillars · AML firewall |
| [`04_PILLAR_3_EDGE_SHIELD_WASM_CORESPEC.md`](./04_PILLAR_3_EDGE_SHIELD_WASM_CORESPEC.md) | Pillar 3 Wasm Shield · R01–R20 |
| [`03_RISK_MITIGATION_AND_DISCLAIMER_FRAMEWORK.md`](../architecture/03_RISK_MITIGATION_AND_DISCLAIMER_FRAMEWORK.md) | Risk mitigation · fail-closed boundaries · 60 invariants · real yield vs. toxic inflation |

---

**Prepared by:** SilverVine Labs · Risk & Compliance Documentation
**Last updated:** 2026-08-27 · Branch: `v1.0_push_BDLW`
