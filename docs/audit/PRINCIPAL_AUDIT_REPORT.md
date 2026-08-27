# Principal Audit Report — SliverVine Protocol (Santenmoku v0.9)

**Entity:** SilverVine Labs · **Protocol:** SliverVine  
**Audience:** Principal / security reviewers · GMX Builders · Arbitrum diligence  
**Live proof:** `GET /api/grant-audit` · [bedeltawater.slivervine.xyz](https://bedeltawater.slivervine.xyz)  
**Yellow Paper SSOT:** [`../architecture/TECHNICAL_SPECIFICATION.md`](../architecture/TECHNICAL_SPECIFICATION.md)

> **Narrative:** Behavioral pass does not imply Web3 security. This report locks **codebase SSOT metrics** only — no marketing inflation.

---

## 0. Exact Metric Lock (SSOT Baseline)

| Metric | Locked value | Artifact / verifier |
|--------|--------------|---------------------|
| **Vitest Baseline** | **168 files | 742 PASS (100% Clean)** | `pnpm test` · security-tier Vitest in [`static-analysis-report.json`](./static-analysis-report.json) |
| **Wasm Core Budget** | **`<28kb` Cloudflare budget, `<60µs` execution (`<150µs` P99 tail)** | [`pkg/soil_core.wasm`](../../pkg/soil_core.wasm) · [`soil_core.rs`](../../src/wasm/soil_core.rs) · `WASM_BUDGET_BYTES` in [`soil-wasm.ts`](../../src/sdk/soil-wasm.ts) |
| **Active Guards** | **`agent-citadel-guard` (50 bps Slippage Deadman)** + R01–R20 matrix **17 Active \| 2 Refactored \| 1 Deprecated** | `src/core/agent-citadel-guard.ts` (`AGENT_DEADMAN_SLIPPAGE_BPS = 50`) |
| **Revenue Integration** | GMX v2 **`uiFeeReceiver` (+5 bps protocol yield accrual)** | `GMX_UI_FEE_BPS` · `gmx-v2-order-payload.ts` |
| **Security Matrix** | **3-Tier Security Matrix: 5/0/0 PASS (Vitest, Forge, Slither, Aderyn, pnpm-audit)** | `pnpm run audit:security` → [`static-analysis-report.json`](./static-analysis-report.json) `summary.pass=5` |
| **Fuzzing Baseline** | **327,675 Property Fuzz Executions** (`pnpm audit:nightly` / `FOUNDRY_PROFILE=deep` · 5×65,535) · standard `forge test` = **5,120** (5×1,024) | Forge property suite · Gate unit **60 Passed** |
| **Decision latency** | p50 ~106 µs (`checkSoilResistance()` / Shield hot path) | Resilience / soil benchmark harness |
| **Chaos matrix** | **255 / 255** toxic scenarios blocked · `failClosedRate: 100.00%` · `capitalLossUsd: 0` | [`chaos-blackswan-metrics.json`](./chaos-blackswan-metrics.json) |

**Single regression phrase (all audit prose):**  
`168 files | 742 PASS (100% Clean)` · `3-Tier Security Matrix: 5/0/0 PASS (Vitest, Forge, Slither, Aderyn, pnpm-audit)` · Wasm `<28kb` / `<60µs` (`<150µs` P99 tail).

---

## 1. Scope Boundaries & Asset Finality

| Horizon | Status | Asset / clearing bound |
|---------|--------|------------------------|
| **v0.9 Production-Ready (Arbitrum Sepolia Testnet & Dry-Run Verified)** | ✅ Code-Verified | Strictly **ETH/USDC GM Pool** — eliminates oracle de-peg and FX slippage when escorting treasuries Robinhood Chain (`46630`) → Arbitrum One (`42161`) · Mainnet deployment ties to **M6 Grant distribution** |
| **V1.0 Isomorphic Extension** | ⏳ Planned | **BTC/USDC GM Pool** — config-driven market address mapping; **zero** bytecode / Wasm rewrite |
| **V1.0 Treasury Routing** | ⏳ Planned | Native **USDG Robinhood Chain Treasury routing** — USDG clearing remains on Robinhood Chain (`46630`) via unidirectional bridge |

**Off-ramp finality (v0.9 / unwind path):** Arbitrum One supports native **ETH, BTC, and USDC** upon GMX v2 async unwind. Native USDG redemption is **not** an Arbitrum off-ramp — convert from Arbitrum USDC on return to Robinhood Chain to preserve compliance bounds. Inbound AML contamination (reverse path / `4663` inbound block) is fail-closed at the Firewall.

---

## 2. Four Diagnostic Interrogations

### Interrogation I — Gatehouse (Auth): Can agent credentials drift past session bounds?

| Probe | Expected fail-closed posture | SSOT |
|-------|------------------------------|------|
| Unscoped `ORDER_EXECUTE` | Blocked — ZeroDev Kernel v3 session scopes + R06 | `hl-session/permissions.ts` · ZeroDev AA gate |
| Notional overrun | Blocked at **$5,000** single-order cap (R07) | `SESSION_KEY_NOTIONAL_CAP_USD` |
| Deadman bypass | Impossible — `guardAgentUserOp` → `evaluateAgentCitadelGuard` → soil; **50 bps** trip emits `CITADEL_SLIPPAGE_EXCEEDED` | `agent-citadel-guard.ts` |

**Verdict:** Auth surface is ephemeral-session + EIP-712 intent; no LLM prompt interpretation — predicate / intent hard assertions only.

### Interrogation II — Firewall (Compliance): Can inbound AML contaminate Arbitrum GM TVL?

| Probe | Expected fail-closed posture | SSOT |
|-------|------------------------------|------|
| Outbound Robinhood Chain → Arb | Allowed escort only: `46630` → `42161` | Unidirectional bridge escort |
| Inbound reverse path | **Blocked** (AML contamination short-circuit) | Firewall pillar · lostUsd ≡ 0 posture |
| USDG native redeem on Arb | **Out of bound** — USDG clearing restricted to Robinhood Chain | § Asset Redemption (Tech Spec §0.1) |

**Verdict:** Capital flow is unidirectional outbound escort; reverse AML scanning enforces inbound block.

### Interrogation III — Shield (CORE MOAT): Can toxic depth / lag / sandwich reach GMX broadcast?

| Probe | Expected fail-closed posture | SSOT |
|-------|------------------------------|------|
| Price impact **>10 bps** vs local depth | `checkSoilResistance()` short-circuits pre-broadcast (p50 ~106 µs) | R01 · soil + Wasm |
| Cross-venue slip **>50 bps** | Deadman trips (`AGENT_DEADMAN_SLIPPAGE_BPS`) | `agent-citadel-guard` |
| Sequencer / oracle lag | Sequencer grace + oracle-lag sensors fail-closed before payload | Supporting sensors · R03 / R04 family |
| Receiver / parameter tamper | Asymmetric predicate bytecode assertions on ERC-4337 UserOp (`sender ≡ receiver`, `acceptablePrice` bounds) | Tech Spec §0.4 |

**Verdict:** Shield is sub-ms Wasm + TS soil fuse; toxic vectors never leave Edge as unsigned GMX payload.

### Interrogation IV — Revenue & Attestation: Is builder yield and L1 lock non-custodial and replay-safe?

| Probe | Expected posture | SSOT |
|-------|------------------|------|
| `uiFeeReceiver` injection | Every unsigned increase / decrease / deposit carries **+5 bps** accrual | `GMX_UI_FEE_BPS` · `gmx-v2-order-payload.ts` |
| L1 consume-once | `SliverVineGate.sol` `verifyAndConsume` — replay-safe, gas-bounded | Forge 60/60 · Slither / Aderyn in 5/0/0 |
| Public JSON leakage | `/api/grant-audit` redacts signing material and proprietary encode paths | Grant-audit route surface |

**Verdict:** Yield is protocol-native GMX UI fee path (no custody); L1 attestation is consume-once.

---

## 3. Extreme Survival Matrix

| Harness | Result | Artifact |
|---------|--------|----------|
| Chaos Black-Swan | **255** scenarios · **255** blocked · **0** isolate crashes · **$0** capital loss | [`chaos-blackswan-metrics.json`](./chaos-blackswan-metrics.json) |
| Forge property fuzz | **327,675** (`pnpm audit:nightly` / `FOUNDRY_PROFILE=deep`) · standard `forge test` = **5,120** (5×1,024) | Gate suite |
| Forge unit | **60 Passed / 0 Failed** | `static-analysis-report.json` → forge |
| Advanced resilience | TOCTOU compensate · RPC failover · soil SLO harness `allPass: true` | [`grant-resilience-benchmark-metrics.json`](./grant-resilience-benchmark-metrics.json) |
| Security tier | **5/0/0 PASS** (Vitest, Forge, Slither, Aderyn, pnpm-audit) | [`static-analysis-report.json`](./static-analysis-report.json) |
| Defense Matrix | **17 Active \| 2 Refactored \| 1 Deprecated** (R05 SpoofBuster deprecated) | Tech Spec §3 |

**Survival claim (principal-grade):** Under the locked matrix, toxic / lag / TOCTOU / depth-starvation vectors are **fail-closed** before GMX DataStore broadcast; Emergency Liquidity Sponge (HL session path) shares the same envelope when Citadel flags trip.

---

## 4. WASM / Rust Core Config

| Item | Spec |
|------|------|
| Source | [`soil_core.rs`](../../src/wasm/soil_core.rs) (`#![no_std]`, Apache-2.0 SPDX) |
| Artifact | `pkg/soil_core.wasm` |
| Cloudflare budget | **`<28kb`** (`WASM_BUDGET_BYTES = 28 * 1024`) |
| Hot-path exec | **`<60µs`** warm; **`<150µs` P99 tail** |
| Entry | `soil_core_eval` — 8×f64 LE input → trip flags (cross-venue / depth / insufficient) + Dynamic Max SL (`account × 1% + $100`) |
| Session helper | `session_core_ok` — clip + TTL breach → 0 |
| TS wire | `src/sdk/soil-wasm.ts` (production); TS sim fallback for dev |
| Coupling | Called under Shield / `checkSoilResistance()`; Deadman (`agent-citadel-guard`) cannot bypass soil |

**Isomorphic note:** V1.0 BTC/USDC market mapping is **config-only** — no Wasm bytecode rewrite required for pool address expansion.

---

## Appendix A — Anti-Slippage & 0-Lockup (3–5 min Async Redemption)

| Control | Bound |
|---------|-------|
| Soil impact fuse | Short-circuit when local GM depth cannot absorb institutional size without **>10 bps** impact |
| Deadman | **`agent-citadel-guard` @ 50 bps** cross-venue / depth failure → signed reject payload |
| Protocol lock-up | **Zero protocol lock-up** — liquidity uses GMX v2 **3–5 minute async redemption** |
| Reverse AML | Inbound block on reverse escort path; outbound-only `46630` → `42161` |
| Blue-chip restraint | v0.9 **ETH/USDC only** — oracle reliability under Sequencer desync |

---

## Appendix B — ERC-7715 & Apache 2.0 Patent Retaliation

### B.1 ERC-7715 Decoupling — ⏳ Planned / V1.0 Design Spec

ZeroDev Kernel v3 is the **v0.9 ephemeral session-key adapter** (Gatehouse). **ERC-7715 (Advanced Wallet Permissions)** is a **V1.0 evolution target** — not shipped in v0.9. Bytecode predicate verification (Receiver / Parameter invariants on ERC-4337 UserOp) is **v0.9 live** inside the Wasm / soil core (Tech Spec §0.1).

### B.2 Apache-2.0 Patent Retaliation (SDK surface)

[`@slivervine/citadel-sdk`](../../src/sdk/) is licensed **Apache-2.0** (`src/sdk/LICENSE`). Per Apache License §3 (Grant of Patent License): patent licenses granted to a licensee **terminate as of the date** that licensee institutes patent litigation alleging that the Work or a Contribution constitutes patent infringement (including cross-claim or counterclaim). This is the standard Apache-2.0 **patent retaliation / termination** clause — retained verbatim for integrator diligence.

Root protocol / Worker remains **BUSL-1.1** (see repo `LICENSE`); SDK harness is the Apache-2.0 integration boundary.

---

## Appendix C — 3-Party CTO Integration Roadmap

SilverVine is the **infrastructure-layer armored pipeline**. Application-layer storefronts integrate as CTO / product surfaces without owning the pre-execution moat:

| Party | Layer | Integration posture |
|-------|-------|---------------------|
| **Carbon** (Perp) | App | Consumes Citadel unsigned / fail-closed envelopes; does not bypass soil or Deadman |
| **LayerV** (Vol) | App | Same Edge Shield; market selection remains SSOT-gated (v0.9 ETH/USDC) |
| **T3tris** (Vaults) | App | Vault UX / epoch ops (V1.0 roadmap caps) sit above unidirectional escort + GM unwind |

**Integration contract (CTO checklist):**

1. Wire through Gatehouse session scopes (ZeroDev Kernel v3 → ERC-7715 evolution).  
2. Never reverse the Firewall escort (no inbound AML path).  
3. Honor Shield short-circuit (`checkSoilResistance` + `agent-citadel-guard` 50 bps).  
4. Preserve `uiFeeReceiver` **+5 bps** on every GMX v2 unsigned payload.  
5. Expand markets only via V1.0 config maps (BTC/USDC · USDG Robinhood Chain) — no fork of Wasm soil core.

Cohort contrast matrix (infra vs app): see grant audit matrix generator narrative (`scripts/generate-grant-audit-matrix.ts` — Carbon / LayerV / T3tris / SilverVine).

---

## Verification (Principal — 60s)

```bash
pnpm install && pnpm test -- --run # 168 files | 742 PASS (100% Clean)
pnpm run audit:security            # 3-Tier Security Matrix: 5/0/0 PASS (Vitest, Forge, Slither, Aderyn, pnpm-audit)
pnpm run audit:fast                # fast tier scorecard → security-scorecard.json
cd SliverVineGate && forge test && cd ..
curl -s "https://bedeltawater.slivervine.xyz/api/grant-audit" | jq .
```

---

## Related Documents

| Document | Purpose |
|----------|---------|
| [`../architecture/TECHNICAL_SPECIFICATION.md`](../architecture/TECHNICAL_SPECIFICATION.md) | R01–R20 · §0.1 scope · §0.4 bytecode predicates |
| [`../README.md`](../README.md) | Audience router |
| [`static-analysis-report.json`](./static-analysis-report.json) | Security-tier 5/0/0 lock |
| [`security-scorecard.json`](./security-scorecard.json) | Last `audit:*` tier run (do not mix tiers) |
| [`chaos-blackswan-metrics.json`](./chaos-blackswan-metrics.json) | Extreme Survival Matrix artifact |
| [`../../src/sdk/README.md`](../../src/sdk/README.md) | Apache-2.0 SDK surface |
