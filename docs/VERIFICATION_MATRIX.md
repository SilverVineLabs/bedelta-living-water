# SliverVine Protocol (BeDelta Living Water v1.0 / BeΔ) — Verification Matrix (Buildathon / Grant Evaluators)

**Official Name:** SliverVine Protocol (BeDelta Living Water v1.0 / BeΔ)
> **Pitch SSOT:** SliverVine Protocol (BeDelta Living Water v1.0 / BeΔ) is a Sub-ms 0-Gas Pre-Broadcast Safety Citadel & Risk Navigator for AI Agents on Arbitrum.
**Entity:** SilverVine Labs · **Contact:** `grants@silvervinelabs.com`
**Live:** [bedeltawater.slivervine.xyz](https://bedeltawater.slivervine.xyz) · `GET /api/grant-audit`
**Repo:** [SilverVineLabs/bedelta-living-water](https://github.com/SilverVineLabs/bedelta-living-water)

> **Vitest SSOT:** **173 test files | 765 PASS Clean** on `pnpm test -- --run`. Forge **60/60** · Cargo Stylus **5/5** · Property Fuzz **327,675** (`pnpm audit:nightly` / `FOUNDRY_PROFILE=deep`; standard `forge test` = **5,120** = 5×1,024) · ZeroDev AA **Opt-In Pillar 1 · Dry-Run Harness Verified** (Kernel v3 / EntryPoint v0.7 · `USE_ZERODEV_AA` default-off).

**Layout:** **Express Entry → Three Pillars Inside (Core) → Three Pillars Outside (Extended)**. Open this document first — each zone is CLI-reproducible with **zero mainnet signing dependency** unless explicitly noted.

### Absolute SSOT Lock (Evaluator Copy-Paste)

| Field | Locked value | Verify |
|-------|--------------|--------|
| **Official H1** | SliverVine Protocol (BeDelta Living Water v1.0 / BeΔ): Sub-ms 0-Gas Pre-Broadcast Safety Citadel & Risk Navigator for AI Agents on Arbitrum | [`README.md`](../README.md) · [`SUBMISSION.md`](../grants/SUBMISSION.md) |
| **Vitest baseline** | **173 test files \| 765 PASS Clean** | `pnpm test -- --run` |
| **Sepolia Gate** | `0xb174118bC0B84e8D6D59EEF2339e29bF7FCf8BF1` | [Arbiscan Sepolia](https://sepolia.arbiscan.io/address/0xb174118bC0B84e8D6D59EEF2339e29bF7FCf8BF1) |
| **Arbitrum One Gate** | `0xb174118bC0B84e8D6D59EEF2339e29bF7FCf8BF1` | [Arbiscan One](https://arbiscan.io/address/0xb174118bC0B84e8D6D59EEF2339e29bF7FCf8BF1) |
| **Mainnet Ignition Tx** | `0x54c153e9a41f704b5eb0ae554eac593d1110d62bd826ff094e72f2bd60c1b0c6` | [Arbiscan Tx](https://arbiscan.io/tx/0x54c153e9a41f704b5eb0ae554eac593d1110d62bd826ff094e72f2bd60c1b0c6) |
| **Agent SDK decorator** | `withCitadelShield` — zero-touch pre-broadcast wrapper | [`src/sdk/decorator.ts`](../src/sdk/decorator.ts) · `pnpm demo:agent` |
| **Dune dashboard** | [https://dune.com/silvervinelabs/silvervine-citadel-telemetry](https://dune.com/silvervinelabs/silvervine-citadel-telemetry) | Public URL |
| **DuneSQL (Sepolia ingest)** | Event streaming verified on Sepolia Gate `0xb174118bC0B84e8D6D59EEF2339e29bF7FCf8BF1` (`IntentAttested` · `RiskTripBlocked`) · **PEV** `SUM(blocked_intent_notional_usd)` operational | [`DUNE_DASHBOARD_SPECIFICATION.md`](./telemetry/DUNE_DASHBOARD_SPECIFICATION.md) |
| **DuneSQL (Arbitrum One prod)** | Queries 0–0b feed + chart; Queries 1–3 reconciliation — production SQL targets **ChainID `42161`** | Same spec |
| **[ERC-8196](https://eips.ethereum.org/EIPS/eip-8196)** | Emerging Draft (Virtuals Protocol) — **not finalized** | [`SUBMISSION.md`](../grants/SUBMISSION.md) |

> **Note:** Initial mainnet deployment utilizes Bootstrap Ignition Keys (`0x1111…`/`0x2222…`) for public verification without exposing production HSM keys. Key rotation to production multisig is executed via native governance functions.

**Core invariants:** $\Delta_{\text{net}} = \Delta_{\text{GMX\_GM}} + \Delta_{\text{HL\_Short}} \equiv 0$ · $\text{lostUsd} \equiv 0$ · $t_{\text{reflector\_p50}} \sim 106\,\mu\text{s}$ — [Technical Specification §3.1](../architecture/01_TECHNICAL_SPECIFICATION.md#31-microsecond-moats).

> **OpSec:** Internal simulation reports live under `docs/internal/` only — not linked from public grant packs. No private keys in public docs.

---

## Zone A — 30-Second Express Verification (Fast Track)

### Path 1: Instant Monorepo (Recommended — ~3 Seconds)

```bash
pnpm install
pnpm run demo:e2e    # 5-Step ANSI HUD Demo
pnpm test -- --run   # 173 test files | 765 PASS Clean
```

| Command | Proves | Expected |
|---------|--------|----------|
| `pnpm run demo:e2e` | 5-step Citadel ANSI HUD dry-run | `RESULT: E2E OK (5/5)` |
| `pnpm test -- --run` | Full Vitest regression bar | **173 test files \| 765 PASS Clean** |

**`demo:e2e` expected terminal highlights** (GitHub `diff` syntax):

```diff
+  ┌─ SliverVine Citadel Shield ─────────────────────────────────────┐
+  │  Sepolia Gate · p50 ~106µs · Δnet ≡ 0 · lostUsd ≡ 0            │
+  └────────────────────────────────────────────────────────────────┘
+ Step 1: allowedToSign=true · elapsed=106µs · Δnet ≡ 0
+ Step 2: Escort PASS · lostUsd ≡ 0
- AML_INBOUND_TO_ROBINHOOD_BLOCKED (inbound 42161→46630)
! Step 3: uiFeeReceiver (+10 bps)
- Step 5: SOIL_TRIPPED · PHYSICAL_DEADLOCK_TRIGGERED
+ RESULT: E2E OK (5/5)
```

### Path 2: Isolated Docker (Zero Host Node/pnpm)

```bash
docker build -t slivervine-citadel . && docker run --rm slivervine-citadel
```

| Command | Proves | Expected |
|---------|--------|----------|
| Default `docker run` | 5-step Citadel **`demo:e2e`** inside container | `[tier0] demo:e2e PASS` |
| `docker run --rm slivervine-citadel pnpm test` | Full Vitest regression (host-free) | **173 test files \| 765 PASS Clean** |

**Why Docker Path:** Eliminates judge laptop Node version drift, pnpm store corruption, and missing WSL deps — same PASS bar, hermetic container.

---

## Zone B — Inside Three Pillars (Core Protocol Invariants)

### Pillar 1 — Gatehouse (Opt-In Account Abstraction & Scoped Auth)

**Command:** `pnpm test:zerodev`

**Definition:** `vitest run tests/adapters/zerodev-aa-dryrun-harness.test.ts`

| Assertion | Status |
|-----------|--------|
| Kernel v3 / EntryPoint **v0.7** UserOp **draft** path | ✅ Dry-run harness verified |
| Session scope + Risk Oracle Gate fail-closed | ✅ Offline / mock bundler |
| Mainnet UserOp broadcast | ⚠️ **Not claimed** (`USE_ZERODEV_AA` default-off) |

**Narrative:** ZeroDev Kernel v3 is an **Opt-In Pillar 1 Account Abstraction Layer** — scoped 30s session keys and Paymaster gas sponsorship ($0.50/op · $10/day). **Pillar 3 Wasm Soil Core** (`pkg/soil_core.wasm` · p50 ~106 µs) and **Pillar 2 Arbitrum Native Ingress** operate **100% independently** of ZeroDev. `zerodev-aa-gate.ts` provides pre-bundler UserOp validation when AA is enabled.

**v1.0 AA scope:** Stage ① Sign-in · ③ Gas · ④ Authorize · ⑤ Execute (Sepolia verified). Stage ② Smart Routing = Reference Harness. Stages ⑥⑦ = Post-Grant Roadmap.

**Read order:**

```text
zerodev-aa-gate.test.ts → assertCitadelRiskGate() + evaluateZeroDevGasGuards()
zerodev-aa-gate.ts → evaluateStaticBreakerMatrix() + Citadel risk gate
 ├─ zerodev-aa-failover.ts → Arbitrum One health / AA probe route
 ├─ zerodev-aa-static-breaker.ts → soil + gas sponsorship limits
 └─ zerodev-aa-userop.ts → Paymaster + bundler dispatch (after gate PASS)
```

---

### Pillar 2 — Compliance Ingress Firewall (Escort Accounting & AML)

**Command:**

```bash
pnpm exec vitest run tests/adapters/across-ingress-bridge.test.ts
```

| Metric | Expected |
|--------|----------|
| Test cases | **5/5 PASS** |
| Escort invariant | `lostUsd ≡ 0` |
| AML isolation | `AML_INBOUND_TO_ROBINHOOD_BLOCKED` — unidirectional 42161→46630 outbound only |

**Narrative:** Robinhood Chain (`46630`/`4663`) Across ingress is a **Pillar 2 Reference Escort Adapter** — not product identity. Inbound AML block enforces fail-closed unidirectional isolation before capital reaches Arbitrum deployable NAV.

Related: [`audit/PILLAR_2_COMPLIANCE_INGRESS_FIREWALL_AUDIT.md`](./audit/PILLAR_2_COMPLIANCE_INGRESS_FIREWALL_AUDIT.md)

---

### Pillar 3 — SliverVine Citadel Shield (Pre-Consensus Wasm Risk Engine)

| Command | Proves | Expected |
|---------|--------|----------|
| `cd SliverVineGate && forge test` | On-chain Gate · default property fuzz | **60/60 Passed** · **5,120 fuzz** (5×1,024) |
| `pnpm audit:nightly` | Deep fuzz gate (`FOUNDRY_PROFILE=deep`) | **327,675** executions |
| `pnpm audit:fast` / `pnpm audit:security` | TSC · Vitest security · Solhint · Gitleaks · Slither · Aderyn | Fast PASS · Security **5/0/0 PASS** |

**Default forge command:**

```bash
cd SliverVineGate && forge test --gas-report && cd ..
```

**Deep fuzz command:**

```bash
pnpm audit:nightly
# or: cd SliverVineGate && FOUNDRY_PROFILE=deep forge test --match-path 'test/*.fuzz.t.sol' && cd ..
```

| Metric | Default `forge test` | Deep profile (`FOUNDRY_PROFILE=deep` / `pnpm audit:nightly`) |
|--------|----------------------|----------------------------------------------------------------|
| Unit tests | **60 Passed · 0 Failed** | **60 Passed · 0 Failed** |
| Property fuzzing | **5 × 1,024 = 5,120** executions | **5 × 65,535 = 327,675** executions |
| Invariants | **3 × 16,384** stateful calls · 0 counterexamples | same |
| Core | `SliverVineGate.sol` consume-once attestation · gas-bounded `verifyAndConsume` | same |

**Formal Verification — Native Foundry Invariant Tests**

| Invariant | Test anchor | Verify |
|-----------|-------------|--------|
| Replay denial (I6) | `test_I6_Replay_Denies` | `cd SliverVineGate && forge test --match-test test_I6_Replay_Denies` |
| No double-spend | `invariant_NoDoubleSpend` | `cd SliverVineGate && forge test --match-path test/SliverVineGate.invariant.t.sol` |
| Full Gate suite | 60 unit + fuzz + invariant tests | `cd SliverVineGate && forge test` |

**R03 / R04 — RPC & Execution-Lag Telemetry (Provenance)**

| ID | Guard | Fail-closed budget | Code SSOT |
|----|-------|-------------------|-----------|
| **R04** | PGATE Latency / WS jitter | **200ms** | `PGATE_MAX_LATENCY_MS` · `src/adapters/hl/websocket/websocket-health.ts` |
| **R03** | HL L2 book stale / RPC probe | **500ms** | `HL_L2_STALE_THRESHOLD_MS` · `src/services/exchanges/hl-l2-book-lib/hl-l2-book-types.ts` |

Related: [`audit/PILLAR_3_EDGE_SHIELD_WASM_CORESPEC.md`](./audit/PILLAR_3_EDGE_SHIELD_WASM_CORESPEC.md) · [`audit/PRINCIPAL_AUDIT_REPORT.md`](./audit/PRINCIPAL_AUDIT_REPORT.md)

---

## Zone C — Outside Three Pillars (Ecosystem & Simulation Harnesses)

### 1. AI Agent Interceptor Harness (Virtuals Protocol / ElizaOS / LangChain)

**Command:**

```bash
pnpm demo:agent
# or: npx tsx examples/agent-interceptor-demo.ts
pnpm demo:agent --trip   # FAIL_CLOSED path
```

| Scope | Detail |
|-------|--------|
| Package | `@slivervine/citadel-sdk` (`withCitadelShield`) |
| Validates | Sub-ms Wasm soil pre-validation against rogue LLM intent generation, prompt injection, and unauthorized session calls |
| Adapters | [`examples/adapters/`](../../examples/adapters/) (TS + Python) · [`examples/agent-interceptor-demo.ts`](../../examples/agent-interceptor-demo.ts) |

---

### 2. Quantitative Stress Benchmark (Survival Benchmark)

**Command:**

```bash
pnpm tsx scripts/generate-survival-report.ts
```

| Parameter | Value |
|-----------|-------|
| Lookback | 30D HL L2 orderbook stress |
| Degrade events | 42 observed |
| Offline fallback | Resilient 503 / network abort → snapshot replay |
| Output | `docs/0801_BeDelta_Survival_Benchmark.md` |

---

### 3. Production Telemetry & Provenance (Optional / Network)

| Surface | Command | Expected |
|---------|---------|----------|
| Sidecar health | [`docker/README.md`](../docker/README.md) | `curl -sS http://localhost:8080/health \| jq .` |
| Live grant audit | Network required | `curl -s https://bedeltawater.slivervine.xyz/api/grant-audit \| jq .provenanceVerified` |
| 5-TX testnet proof | `pnpm verify:5tx` / `pnpm verify:grant` | Hyperliquid testnet anchor in `verified_5tx_results.json` |
| Demo pipeline | `pnpm run demo:e2e` | 5-step ANSI HUD |

**Sidecar build:**

```bash
docker build -t silvervine-sidecar -f docker/Dockerfile.sidecar .
```

---

## Appendix — Maintainer Scripts & Bundle Checks

| Script | Purpose | Expected |
|--------|---------|----------|
| `pnpm bundle:measure` | Worker hot-path size gate | **91.2 KiB gzip** / **369.69 KiB raw** · `limitKiB: 150` · `pass: true` |
| `pnpm verify:negative` | Negative soil-trip proofs | Depth breach fail-closed |
| `pnpm demo:agent` | AI agent interceptor harness | ALLOW / `--trip` FAIL_CLOSED |
| `pnpm test` | Full Vitest + coverage | **173 test files \| 765 PASS Clean** |
| `pnpm test:watch` | Interactive Vitest | — |
| `pnpm typecheck` | `tsc --noEmit` | — |
| `pnpm audit:fast` / `audit:security` / `audit:nightly` | 3-tier security matrix | **5/0/0 PASS** (security tier) |
| `pnpm build:wasm` | Rust `soil_core.wasm` | `pkg/soil_core.wasm` |
| `pnpm build` / `deploy` / `dev` | Worker / SPA toolchain | — |

**Removed from public script surface (OpSec):** live ignition / wallet sweep / spot sell / Sepolia UserOp one-offs — not required for Buildathon diligence.

---

## On-Chain Contract Topology (`contracts/` vs `SliverVineGate/`)

Automated dependency audit (2026-08-24): **no TS/JS runtime import** of `contracts/*.sol` paths; **no duplicate** Solidity definitions inside `SliverVineGate/`. Two distinct on-chain surfaces:

| Path | Contracts | Role | Forge / TS linkage |
|------|-----------|------|-------------------|
| **`SliverVineGate/`** | `SliverVineGate.sol` · `GatedExecutor.sol` | EIP-712 consume-once attestation gate (Pillar 3) | `cd SliverVineGate && forge test` · **60/60** · default fuzz **5,120** · deep **327,675** via `FOUNDRY_PROFILE=deep` |
| **`contracts/`** | `SliverVineRiskOracle.sol` · `IngressSafetySwitch.sol` | Venue-agnostic ingress compliance oracle + address-level safety switch | **Not** in Forge testbed · ABI mirrored in TS |

**TypeScript interface SSOT (Edge runtime):**

| Solidity source | TS ABI / adapter | Usage |
|-----------------|------------------|-------|
| `contracts/SliverVineRiskOracle.sol` | `src/services/aa-adapter/risk-oracle.ts` → `SLIVERVINE_RISK_ORACLE_ABI` | `risk-oracle-gate.ts` · viem `readContract` when `SLIVERVINE_RISK_ORACLE_ADDRESS` set |
| `contracts/IngressSafetySwitch.sol` | `risk-oracle.ts` → `INGRESS_SAFETY_SWITCH_ABI` | `risk-oracle-adapter.ts` · `evaluateComplianceAdapter()` (fail-closed logic) |

**Verdict:** `contracts/` is **not** a safe delete — it is the canonical Solidity spec for Robinhood ingress; TS adapters intentionally mirror ABIs (no Forge artifact import at Edge).

---

## Related Docs

| Document | Role |
|----------|------|
| [`README.md`](../README.md) | Repo entry · express verification summary |
| [`grants/SUBMISSION.md`](./grants/SUBMISSION.md) | Buildathon main submission |
| [`architecture/01_TECHNICAL_SPECIFICATION.md`](./architecture/01_TECHNICAL_SPECIFICATION.md) | Yellow Paper |
| [`architecture/03_RISK_MITIGATION_AND_DISCLAIMER_FRAMEWORK.md`](./architecture/03_RISK_MITIGATION_AND_DISCLAIMER_FRAMEWORK.md) | Risk spectrum · simulation harnesses |
| [`../docker/README.md`](../docker/README.md) | Sidecar testlist |
| [`../JUDGE_BRIEF.md`](../JUDGE_BRIEF.md) | 1-page judge entry |

---

*SilverVine Labs · BUSL-1.1 · Verification Matrix · 173 test files | 765 PASS Clean*
