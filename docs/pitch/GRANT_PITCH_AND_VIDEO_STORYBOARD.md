# BDLW Grant Pitch & 35-Second Demo Video Storyboard

| Field | Value |
|-------|-------|
| **Document** | Grant Pitch & Video Storyboard |
| **Version** | **v1.0.0** |
| **Classification** | Grant / Institutional Pitch · Live Demo Script |
| **Branch baseline** | `v1.0_push_BDLW` |
| **Entity** | SilverVine Labs · BeΔ Living Water (BDLW) |
| **Baseline** | Vitest **175 test files \| 773 tests PASS (100% Clean · Exit Code 0)** on `pnpm test -- --run` · Wasm **p50 ~106 µs** · chaos **255/255** |
| **Live proof** | [bedeltawater.slivervine.xyz](https://bedeltawater.slivervine.xyz) · `GET /api/grant-audit` |
| **Related SSOT** | [`VERIFICATION_MATRIX.md`](../VERIFICATION_MATRIX.md) · [`TECHNICAL_SPECIFICATION.md`](../architecture/TECHNICAL_SPECIFICATION.md) · [`INSTITUTIONAL_DUE_DILIGENCE_MEMORANDUM.md`](../audit/INSTITUTIONAL_DUE_DILIGENCE_MEMORANDUM.md) |

> **Pitch posture:** BDLW is **institutional pre-execution infrastructure** — not a retail yield app. Every claim below maps to CLI-verifiable code anchors.

---

## 1. Executive Pitch Summary

**One sentence:** BeDelta Living Water (BDLW) is a **106 µs pre-execution Wasm-gated, 1-click delta-neutral Citadel** on Arbitrum One — combining ZeroDev Kernel v3 smart accounts, a venue-agnostic **Compliance Ingress Firewall**, and a Rust `#![no_std]` soil engine that **fail-closes before mempool broadcast**.

**Value proposition for Grant committees:**

| Dimension | BDLW delivers |
|-----------|---------------|
| **Speed** | `checkSoilResistance()` at **p50 ~106 µs** on Cloudflare Edge — inline, not post-hoc dashboards |
| **Safety** | **Fail-Closed** by construction: oracle lag, sequencer desync, soil depth breach → `signingChannelOpen: false` |
| **Onboarding** | **1-click** ZeroDev Smart Routing deposit (Pillar 2 surface) + Kernel v3 session keys — no hot-wallet custody |
| **Yield architecture** | Delta-neutral **GMX v2 GM + Hyperliquid 1× short** with **0.5% Hurdle Gate** (`FRICTION_BUFFER_APY`) — dynamic target band **8.2% ~ 11.8%** (non-guaranteed display) |
| **Honest accounting** | Bridge in-flight capital labeled **`IN_FLIGHT_BRIDGE_CAPITAL`** — **`lostUsd ≡ 0`** until settled |
| **Proof** | **773 tests PASS** Vitest · **255/255** chaos matrix · **4/4** ZeroDev gate · **5/5** bridge tests |

**Three Pillars (evaluator mental model):**

```text
Pillar 1 GATEHOUSE → ZeroDev Kernel v3 · 30s TTL session keys · $5k notional cap
Pillar 2 COMPLIANCE INGRESS → Venue-agnostic AML escort & accounting
 FIREWALL → Robinhood Chain = inaugural reference adapter
Pillar 3 SHIELD (CORE MOAT) → pkg/soil_core.wasm · checkSoilResistance() · R01–R20
```

**Center of gravity:** Arbitrum One GMX v2 + HL hedge. Permissioned ingress (Robinhood) is a **supported example**, not the product identity.

---

## 2. Three 4D / Multi-Dimensional Positioning Models

### Model 1 — Market Positioning Matrix (4D)

**Axes:** Speed · Fail-Closed Security · 1-Click Onboarding · Dynamic Yield Efficiency

```text
 HIGH Fail-Closed
 ▲
 │ ★ BDLW
 │ (106µs Wasm Gate)
 │
 LOW Speed ◄───────────────┼───────────────► HIGH Speed
 │
 Traditional Vaults │ Consumer AA Apps
 (DAO governance) │ (post-hoc policy)
 │
 ▼
 LOW Fail-Closed (Fail-Open window)
```

| Player archetype | Speed (decision latency) | Fail-Closed security | 1-click onboarding | Dynamic yield efficiency | BDLW gap |
|------------------|--------------------------|----------------------|--------------------|--------------------------|----------|
| **BDLW Citadel** | **p50 ~106 µs** pre-broadcast | **Inline severance** · chaos 255/255 | ZeroDev Kernel v3 + Smart Routing | Hurdle-gated rebalance · delta-neutral loop | — |
| Gauntlet / Chaos Labs | Minutes–days (governance) | Advisory parameter tuning | N/A (B2B analytics) | Protocol-level, not tx-level | No inline gate |
| Consumer AA wallets | Fast bundler dispatch | Post-broadcast simulation | **Strong** EIP-7702 UX | Not delta-neutral vault infra | Fail-open window |
| CeFi basket / structured products | Human ops hours | Manual risk committee | App UX, custodial | Opaque basket rebalancing | Custody + latency |
| Traditional on-chain vaults | Block-time + multisig | Timelock pause | Wallet connect only | Static strategy | No sub-ms soil fuse |

**BDLW quadrant claim:** Only stack that occupies **high speed + high fail-closed** while retaining **1-click AA onboarding** and **institutional yield mechanics**.

---

### Model 2 — Competitive Matrix (Risk Architecture)

| Architecture dimension | **BDLW Citadel** | Consumer AA apps | CeFi basket swaps | Traditional vaults |
|------------------------|------------------|------------------|-------------------|---------------------|
| **Risk gate placement** | **Pre-broadcast Edge SSOT** | Post-bundler / backend policy | Pre-trade desk approval | On-chain timelock / guardian |
| **Session key TTL** | **30s** (`WS_HEARTBEAT_INTERVAL_MS`) | Hours–days typical | N/A (custodial) | N/A or long-lived admin keys |
| **Notional severance** | **$5,000** cap (`SESSION_KEY_NOTIONAL_CAP_USD`) | Often uncapped | Desk limits (opaque) | Vault share limits |
| **Bridge / escort accounting** | **`IN_FLIGHT_BRIDGE_CAPITAL`** · timeout → `BRIDGE_TIMEOUT_FAIL_CLOSED` | Often shown as "available" | Off-chain ledger | N/A or wrapped tokens |
| **`lostUsd` invariant** | **≡ 0** (honest pending labels) | Not guaranteed | Opaque | Strategy-dependent |
| **AML isolation** | Pillar 2 **Compliance Ingress Firewall** — outbound-only escort; inbound blocked | Generic contract scopes | KYC at onboarding only | None on-chain |
| **Wasm soil fuse** | **`pkg/soil_core.wasm`** · `<28kb` budget | None | None | None |
| **ZeroDev integration** | Kernel v3 production · gate **before** paymaster sign | Kernel / 7702 UX-first | None | None |
| **Regression proof** | **773 tests PASS** · `zerodev-aa-gate` **4/4** · bridge **5/5** | Vendor QA snapshots | Audit letters | Partial |

---

### Model 3 — Real-World Problem / Solution Matrix

| Stress event | Fail-Open (Option A) | Human delay / stuck capital (Option B) | **BDLW Option C** |
|--------------|------------------------|----------------------------------------|-------------------|
| **3σ market shock** | UserOp broadcasts into thin book → slippage liquidation | Risk committee convenes → hours of naked delta | **`SYSTEM_FAIL_CLOSED_TRIP`** · soil depth fuse · no broadcast |
| **Oracle lag > 30s** | Stale price fills at wrong mark | Trading halted manually · ops backlog | **`ORACLE_LAG_DEADLOCK`** · `signingChannelOpen: false` |
| **Bridge latency / timeout** | In-flight funds counted as deployable NAV → naked GM open | Treasury stuck · manual reconciliation | **`IN_FLIGHT_BRIDGE_CAPITAL`** · **`BRIDGE_TIMEOUT_FAIL_CLOSED`** · **`lostUsd ≡ 0`** |
| **Liquidity drain (HL book gap)** | Hedge leg fills at adverse price | Manual hedge unwind · gap risk | Session scope + soil matrix · **`evaluateHlOrderbookGapGuard()`** partial (v0.9) |
| **Paymaster exhaustion** | Silent fallback to unguarded self-pay path | User blocked · poor UX | **`ZERODEV_DAILY_SPONSORSHIP_EXHAUSTED`** · fail-closed self-pay only after soil PASS |
| **Stolen session key** | Hours of delegated authority | Key revoke lag | **~30s blast radius** · **$5k notional cap** |

```text
 STORM EVENT
 │
 ┌─────────┼─────────┐
 ▼ ▼ ▼
 Option A Option B Option C (BDLW)
 Fail-Open Manual 106µs Wasm Gate
 LIQUIDATED STUCK SEVERED · lostUsd≡0
```

---

## 3. Complete Video Storyboard — "The Storm & The 3 Options"

**Format:** 35-second institutional demo · 1920×1080 · dark HUD ([bedeltawater.slivervine.xyz](https://bedeltawater.slivervine.xyz))
**Narration tone:** Calm, precise, no yield guarantees · emphasize **pre-execution severance**

### Production timeline overview

| Segment | Time | Scene | Emotional beat |
|---------|------|-------|----------------|
| **1** | 0:00–0:08 | Storm arrives | Tension · anomaly detected |
| **2** | 0:08–0:22 | Options A & B fail | Contrast · loss vs paralysis |
| **3** | 0:22–0:35 | Option C · BDLW gate | Resolution · fail-closed confidence |

---

### Scene 1 — Market Anomaly & Storm (0:00 – 0:08)

| Time | Visual | On-screen text / VO | Code anchor |
|------|--------|---------------------|-------------|
| **0:00–0:02** | Wide shot: Arbitrum GM pool chart · funding rate spike · red volatility banner | VO: *"When markets move faster than committees…"* | Live HUD · `GET /api/grant-audit` telemetry |
| **0:02–0:04** | Zoom: oracle timestamp stale · sequencer latency indicator amber | **`ORACLE_LAG_DEADLOCK`** badge pulses | `compliance-trip-alerts.ts` · `LivingWaterShieldCard.tsx` |
| **0:04–0:06** | Split overlay: GM depth thinning · HL spread widening | **`3σ STORM VARIANT`** · depth below `$100k` fuse | `checkSoilResistance()` · R01 depth matrix |
| **0:06–0:08** | Full-screen storm metaphor · HUD switches to **TRIP ARMED** state | VO: *"Three paths. Only one preserves honest accounting."* | `tests/risk-control/soil-circuit-breaker.test.ts` |

**B-roll CLI (post-production card, 2s):**

```bash
pnpm exec vitest run tests/risk-control/soil-circuit-breaker.test.ts
```

---

### Scene 2 — Option A vs Option B (0:08 – 0:22)

#### Option A — Fail-Open / Liquidated (0:08 – 0:14)

| Time | Visual | On-screen text / VO | Code contrast |
|------|--------|---------------------|---------------|
| **0:08–0:10** | Generic AA wallet · UserOp submitted · green "Success" toast | Label: **OPTION A — FAIL-OPEN** | Consumer AA: post-broadcast policy |
| **0:10–0:12** | Transaction confirms · GM fill at **>0.5% slippage** · PnL red | VO: *"Broadcast first. Ask questions later."* | No inline `soil_core.wasm` gate |
| **0:12–0:14** | Liquidation cascade animation · **`capitalLossUsd > 0`** counter | **`lostUsd ≠ 0`** · honest accounting violated | Anti-pattern vs BDLW chaos matrix |

#### Option B — Manual Delay / Stuck (0:14 – 0:22)

| Time | Visual | On-screen text / VO | Code contrast |
|------|--------|---------------------|---------------|
| **0:14–0:16** | CeFi desk · calendar invite · "Risk committee Thursday" | Label: **OPTION B — HUMAN DELAY** | Minutes–days governance latency |
| **0:16–0:18** | Bridge funds mid-flight · strategist wants to deploy · **BLOCKED** spinner | **`IN_FLIGHT`** shown as available (wrong) OR desk freeze (stuck) | Without `IN_FLIGHT_BRIDGE_CAPITAL` label |
| **0:18–0:20** | Delta exposure meter climbs · hedge leg unsettled | VO: *"Capital paralyzed—or exposed. Both are failure modes."* | Naked delta during ops lag |
| **0:20–0:22** | Split screen: A bleeding · B frozen | Text: **"Fail-Open vs Fail-Slow"** | — |

---

### Scene 3 — Option C · BDLW 106 µs Fail-Closed Gate (0:22 – 0:35)

| Time | Visual | On-screen text / VO | Code anchor |
|------|--------|---------------------|-------------|
| **0:22–0:24** | BDLW HUD · Three Pillars diagram highlights **Pillar 3 SHIELD** | Label: **OPTION C — BDLW CITADEL** | [`TECHNICAL_SPECIFICATION.md`](../architecture/TECHNICAL_SPECIFICATION.md) §0 |
| **0:24–0:26** | Micro-timer: **`106 µs`** · Wasm shield animation | VO: *"Pre-execution. Sub-millisecond. Fail-Closed."* | `pkg/soil_core.wasm` · `src/sdk/soil-wasm.ts` |
| **0:26–0:28** | UserOp draft hits gate · **`assertCitadelRiskGate`** · channel severed | **`signingChannelOpen: false`** · trip code flash | `src/adapters/arbitrum/zerodev-aa/zerodev-aa-gate.ts` |
| **0:28–0:30** | Pillar 2 overlay: bridge state **`IN_FLIGHT_BRIDGE_CAPITAL`** · no GM open | **`lostUsd ≡ 0`** green lock | `src/adapters/robinhood/robinhood-across-bridge.ts` |
| **0:30–0:32** | Pillar 1: session key **30s TTL** countdown · `$5k cap` badge | VO: *"Scoped keys. Honest labels. Zero naked broadcast."* | `session-key-gates.ts` · `nonce-auto-healing.ts` |
| **0:32–0:34** | Storm passes · HUD green **READY** · no loss counter | **`capitalLossUsd: 0`** · chaos 255/255 | `docs/audit/chaos-blackswan-metrics.json` |
| **0:34–0:35** | Logo · URL · QR to `/api/grant-audit` | **BeΔ Living Water · SilverVine Labs** | `pnpm test -- --run` · **773 tests PASS** |

**End card verification strip (on-screen, 0:34–0:35):**

```text
773 tests PASS · 255/255 chaos · 4/4 ZeroDev gate · 5/5 bridge · p50 106µs Wasm
```

---

### Video ↔ Codebase verification map

| Storyboard beat | Timestamp | Primary SSOT file | Vitest verifier |
|-----------------|-----------|-------------------|-----------------|
| Soil trip / storm severance | 0:06, 0:26 | `pkg/soil_core.wasm` · `src/services/risk-control-lib/soil-resistance.ts` | `tests/risk-control/soil-circuit-breaker.test.ts` |
| ZeroDev gate fail-closed | 0:26–0:28 | `src/adapters/arbitrum/zerodev-aa/zerodev-aa-gate.ts` | `tests/adapters/zerodev-aa-gate.test.ts` (**4/4**) |
| Bridge honest accounting | 0:28–0:30 | `src/adapters/robinhood/robinhood-across-bridge.ts` | `tests/adapters/robinhood-across-bridge.test.ts` (**5/5**) |
| UI trip banners | 0:02–0:04 | `src/components/compliance-trip-alerts.ts` | `tests/components/compliance-trip-alerts.test.ts` |
| Session TTL / cap | 0:30–0:32 | `src/services/session-key-adapter-lib/session-key-gates.ts` | `tests/services/session-key-gates.test.ts` |
| Chaos / zero loss | 0:32–0:34 | `docs/audit/chaos-blackswan-metrics.json` | `tests/scripts/chaos-blackswan-stress.test.ts` |
| Full regression | End card | — | `pnpm test -- --run` → **773 tests PASS** |

**Grant evaluator one-liner (post-video):**

```bash
pnpm test -- --run && pnpm exec vitest run tests/adapters/zerodev-aa-gate.test.ts tests/adapters/robinhood-across-bridge.test.ts
```

---

## 4. Verification & Regression

### Locked documentation baseline

| Metric | Doc lock | Live CLI (`pnpm test -- --run`) |
|--------|----------|----------------------------------|
| Vitest | **175 test files | 773 tests PASS (100% Clean · Exit Code 0)** | **175 test files | 773 tests PASS (100% Clean · Exit Code 0)** |
| ZeroDev gate | **4/4** | `tests/adapters/zerodev-aa-gate.test.ts` |
| Robinhood bridge | **5/5** | `tests/adapters/robinhood-across-bridge.test.ts` |
| Chaos matrix | **255/255 · capitalLossUsd: 0** | `docs/audit/chaos-blackswan-metrics.json` |
| Wasm shield | **p50 ~106 µs** · `<28kb` artifact budget | `tests/services/wasm-feasibility-lib/soil-core-sim.test.ts` |

> **Note for evaluators:** Documentation SSOT: **175 test files | 773 tests PASS (100% Clean · Exit Code 0)** — re-run `pnpm test -- --run` to confirm on your machine.

### Tier 0–5 entry point

Start at [`docs/VERIFICATION_MATRIX.md`](../VERIFICATION_MATRIX.md):

```bash
docker build -t slivervine-citadel . && docker run --rm slivervine-citadel # Tier 0
pnpm test -- --run # Tier 1
pnpm test:zerodev # Tier 4 — ZeroDev dry-run
curl -s "https://bedeltawater.slivervine.xyz/api/grant-audit" | jq .provenanceVerified
```

---

## Related Documents

| Document | Use |
|----------|-----|
| [`docs/README.md`](../README.md) | Grant reviewer navigation · Top 5 Core Docs |
| [`INSTITUTIONAL_DUE_DILIGENCE_MEMORANDUM.md`](../audit/INSTITUTIONAL_DUE_DILIGENCE_MEMORANDUM.md) | Allocator diligence · Risk & Disclaimer |
| [`ZERODEV_EIP7702_COMPARATIVE_ANALYSIS.md`](../audit/ZERODEV_EIP7702_COMPARATIVE_ANALYSIS.md) | Consumer AA vs BDLW substrate |
| [`CROSS_CHAIN_RISK_AND_EVOLUTION.md`](../architecture/CROSS_CHAIN_RISK_AND_EVOLUTION.md) | 60 invariants · Option C stress framing |

---

**Prepared by:** SilverVine Labs · Grant & Institutional Pitch
**Last updated:** 2026-08-27 · Branch: `v1.0_push_BDLW`
