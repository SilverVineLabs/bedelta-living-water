# SliverVine Protocol (BeDelta Living Water v1.0 / BeΔ) — HackQuest Dual-Video Storyboard

| Field | Value |
|-------|-------|
| **Document** | Grant Pitch & Dual-Video Storyboard (HackQuest / Arbitrum Open House Singapore) |
| **Version** | **v1.1.0** |
| **Classification** | Public Grant Pitch · Submission-form video scripts |
| **Branch baseline** | `V1.0_b4_Buildaton_Submisson` |
| **Entity** | SilverVine Labs |
| **Protocol** | SliverVine Protocol / SliverVine Citadel |
| **Identity** | SliverVine Protocol (BeDelta Living Water v1.0 / BeΔ) is a Sub-ms 0-Gas Pre-Broadcast Safety Citadel & Risk Navigator for AI Agents on Arbitrum. |
| **Baseline** | Vitest **173 test files | 765 PASS Clean** · Wasm **p50 ~106 µs** · chaos **255/255** |
| **Live proof** | [bedeltawater.slivervine.xyz](https://bedeltawater.slivervine.xyz) · `GET /api/grant-audit` · [Dune telemetry](https://dune.com/silvervinelabs/silvervine-citadel-telemetry) |
| **[ERC-8196](https://eips.ethereum.org/EIPS/eip-8196)** | [ERC-8196](https://eips.ethereum.org/EIPS/eip-8196) (Emerging Draft Sub-ms Policy Gate) — **not a finalized standard** |
| **Related SSOT** | [`VERIFICATION_MATRIX.md`](../VERIFICATION_MATRIX.md) · [`01_TECHNICAL_SPECIFICATION.md`](../architecture/01_TECHNICAL_SPECIFICATION.md) · [`01_INSTITUTIONAL_DUE_DILIGENCE_MEMORANDUM.md`](../audit/01_INSTITUTIONAL_DUE_DILIGENCE_MEMORANDUM.md) |

> **HackQuest form mapping:** **SECTION A** = Pitch Video (180s). **SECTION B** = Demo Video (120s). Do not merge the two files. Do not guarantee APY. Do not claim Stylus is mainnet-deployed. Monte Carlo `$9.88M` is **10,000-run nominal simulated LP protection**, not live TVL.

---

## Core Narrative — The Rainstorm at the DEX Transport Station

AI Agents arrive at an Arbitrum DEX **transport station** (GMX v2 GM + session-key hedge). A **rainstorm** hits: 3σ crash, MEV sandwich, or prompt-injection that tries to force a signed UserOp into the mempool.

| Option | Metaphor | Outcome | Accounting |
|--------|----------|---------|------------|
| **A — Fail-Open** | Run into the storm with **no umbrella** | Soaked and sick — liquidation, sandwich fill | `lostUsd > 0` · `capitalLossUsd > 0` |
| **B — Fail-Slow** | Hide under a **static shelter** (timelock / committee) | Misses every transport; capital stuck in the rain | Governance delay · paralyzed NAV |
| **C — SliverVine Citadel Shield** | **Sub-ms automated shield** + pre-broadcast severance | Stays **100% dry** at the station | **`lostUsd ≡ 0`** · soil fuse **p50 ~106µs** `checkSoilResistance()` |

**VO lock (metaphor honesty):** "`lostUsd ≡ 0`" is the **in-flight / honest-label invariant** (pending capital is never written off as loss and never treated as deployable). It is **not** a promise of zero market PnL.

```text
 RAINSTORM (3σ / MEV / prompt injection)
 │
 ┌─────────┼─────────┐
 ▼         ▼         ▼
 Option A  Option B  Option C — SliverVine Citadel
 Fail-Open Fail-Slow 0-Gas pre-broadcast shield
 SOAKED    STUCK     DRY · lostUsd≡0 · 106µs Wasm
```

---

## SECTION A — Pitch Video Script (180s / 3-Min Business & Architecture)

**File for form field:** Pitch Video · 1920×1080 · HUD + architecture cards · calm institutional VO.

### A.1 `0s–30s` — Rainstorm Metaphor & AI Agent Pre-Broadcast Death Window

| Time | Visual | VO / on-screen | Anchor |
|------|--------|----------------|--------|
| **0:00–0:08** | Wide: DEX transport station · Agent icons queued · sky goes 3σ red | *"AI Agents do not wait for committees. They arrive at the DEX station — and the rainstorm is already here."* | HUD volatility banner |
| **0:08–0:16** | Storm labels: **3σ crash** · **MEV sandwich** · **prompt injection** | *"The death window is **pre-broadcast**. Once the UserOp hits the mempool, the Agent is already soaked."* | `checkSoilResistance()` · R01–R20 |
| **0:16–0:24** | Split: A sprints unsheltered · B sits under a locked shelter | **OPTION A FAIL-OPEN** `lostUsd > 0` · **OPTION B FAIL-SLOW** stuck capital | Contrast card |
| **0:24–0:30** | Option C umbrella deploys as a **Wasm hex shield** before the train doors | *"Option C: SliverVine Citadel — sub-ms shield, then the train. Never the other way around."* | Identity sentence on-screen |

### A.2 `30s–75s` — Option C Technical Core

| Time | Visual | VO / on-screen | Anchor |
|------|--------|----------------|--------|
| **0:30–0:40** | Three Pillars schematic | *"0-Gas Citadel: soil trips **before** Bundler gas. No broadcast, no fee, no sandwich surface."* | Pillar 3 Shield |
| **0:40–0:52** | Rust `#![no_std]` · `pkg/soil_core.wasm` size badge | *"Rust `#![no_std]` Wasm on Cloudflare Edge. `checkSoilResistance()` — p50 ~106 microseconds."* | `<28kb` · warm `&lt;60µs` |
| **0:52–1:04** | Arbiscan Sepolia · Gate address | *"EIP-712 consume-once Gate `0xb174118bc0B84e8D6D59EEF2339e29bF7FCf8BF1`. Replay is `Replayed()`."* | `SliverVineGate.sol` |
| **1:04–1:15** | Halmos `check_*` file · [ERC-8196](https://eips.ethereum.org/EIPS/eip-8196) badge | *"Formal consume-once lemmas in-repo. Policy alignment: [ERC-8196](https://eips.ethereum.org/EIPS/eip-8196) (Emerging Draft Sub-ms Policy Gate) — not a finalized standard."* | `HalmosGateInvariant.t.sol` |

### A.3 `75s–120s` — 14-Dimension Score Boost & Sponsor Synergies

| Time | Visual | VO / on-screen | Anchor |
|------|--------|----------------|--------|
| **1:15–1:30** | Score strip: V0.9 **5.2** → V1.0 **7.7** (internal 20-judge panel) | *"Same 14 audit dimensions. Leaving the yield-vault rain for an Agent Citadel is the score jump — not a louder APY."* | Internal 14-dim comparison (do not flash OpSec filenames) |
| **1:30–1:45** | GMX payload JSON · `uiFeeReceiver` · **+10 bps** | *"GMX v2 builder lane: `uiFeeReceiver` plus ten basis points on every qualified GM payload."* | `gmx-v2-order-payload.ts` · `GMX_UI_FEE_BPS` |
| **1:45–2:00** | Robinhood `46630`/`4663` → `42161` · inbound red stamp | *"Robinhood Chain is a **Pillar 2 Reference Escort Adapter**. Outbound escort only. Inbound AML **BLOCK**."* | `across-ingress-bridge.ts` · `IngressSafetySwitch.sol` |

### A.4 `120s–150s` — Quant Monte Carlo + Pendle PT Expiry Guard

| Time | Visual | VO / on-screen | Anchor |
|------|--------|----------------|--------|
| **2:00–2:16** | 10,000-run histogram · **87.39%** trip rate | *"Monte Carlo: 10,000 shock-plus-sandwich runs. Citadel intercepts **87.39%** of toxic legs. **$9.88 million is nominal simulated LP protection** — not live TVL."* | `docs/telemetry/game_theory_simulation_results.json` |
| **2:16–2:30** | Pendle clock · 7d / 200 bps | *"Pendle PT expiry guard: maturity under seven days **and** yield jitter over 200 bps → fail-closed. A refusal gate — not a PT market."* | `pendle-pt-expiry-guard.ts` |

### A.5 `150s–180s` — Milestone Roadmap & Proof Bar

| Time | Visual | VO / on-screen | Anchor |
|------|--------|----------------|--------|
| **2:30–2:45** | M1–M6 checklist: Sepolia ✅ · CLI ✅ · RH demo ✅ · GMX fee ✅ · Dune spec ✅ · Mainnet ⏳ | *"Milestones are CLI-verifiable. Mainnet is M6 — we do not pretend it is done."* | [`SUBMISSION.md`](../ARB_Buildathon/SUBMISSION.md) |
| **2:45–2:55** | Dune 3-query spec card · `GET /api/grant-audit` | *"Dune: three-query production spec plus grant-audit KV reconciliation."* | [`DUNE_DASHBOARD_SPECIFICATION.md`](../telemetry/DUNE_DASHBOARD_SPECIFICATION.md) |
| **2:55–3:00** | End card · URL · SSOT string | **173 test files \| 765 PASS Clean** | `pnpm test -- --run` |

**SECTION A forbidden lines:** APY guarantee · 99.82% · “already saved LPs $9.88M” · Stylus mainnet · Hyperliquid as the Arbitrum deployment proof · inbound Robinhood as a product.

---

## SECTION B — Demo Video Script (120s / 2-Min Live On-Chain & Technical Verification)

**File for form field:** Demo Video · **live screen + terminal only** · no metaphor VO except one-line titles. Cursor/mouse visible.

### B.1 `0s–20s` — Live HUD & Arbiscan Gate

| Time | Action (operator) | On-screen proof |
|------|-------------------|-----------------|
| **0:00–0:10** | Open [bedeltawater.slivervine.xyz](https://bedeltawater.slivervine.xyz). Scroll Shield + routing cards. | Live HUD title · no staging mock |
| **0:10–0:20** | New tab: Arbiscan Sepolia contract `0xb174118bc0B84e8D6D59EEF2339e29bF7FCf8BF1`. | Address match · consume-once bytecode page |

### B.2 `20s–50s` — Live Soil Trip (green → red fail-closed)

| Time | Action | On-screen proof |
|------|--------|-----------------|
| **0:20–0:32** | HUD / CLI: show soil **PASS** (green) on a dry fixture. | `checkSoilResistance()` allow path |
| **0:32–0:50** | Trigger trip (depth / slippage fuse / circuit-breaker test or HUD trip banner). Channel severs. | Green → red · `signingChannelOpen: false` · terminal snippet from `pnpm exec vitest run tests/risk-control/soil-circuit-breaker.test.ts` |

### B.3 `50s–80s` — Robinhood inbound AML BLOCK + IN_FLIGHT

| Time | Action | On-screen proof |
|------|--------|-----------------|
| **0:50–0:65** | Run / show bridge test or adapter snapshot: inbound `4663` / reverse path. | **AML inbound BLOCK** |
| **0:65–0:80** | Highlight `capitalLabel: IN_FLIGHT_BRIDGE_CAPITAL` · `deployable: false` · `lostUsd === 0`. | Pillar 2 Reference Escort Adapter — not product identity |

```bash
pnpm exec vitest run tests/adapters/across-ingress-bridge.test.ts
```

### B.4 `80s–108s` — GMX `uiFeeReceiver` + grant-audit JSON

| Time | Action | On-screen proof |
|------|--------|-----------------|
| **1:20–1:34** | Open GMX v2 payload fixture / HUD debug: `uiFeeReceiver` · **+10 bps**. | Field-level verification |
| **1:34–1:48** | Browser: `https://bedeltawater.slivervine.xyz/api/grant-audit` · expand JSON. | `provenanceVerified` · SHA-256 · duneTelemetry keys |

```bash
curl -s "https://bedeltawater.slivervine.xyz/api/grant-audit" | jq .provenanceVerified
```

### B.5 `108s–120s` — Vitest SSOT bar

| Time | Action | On-screen proof |
|------|--------|-----------------|
| **1:48–2:00** | Terminal: `pnpm test -- --run` (pre-recorded full run acceptable if timestamped; freeze on summary). | Exact string: **173 test files \| 765 PASS Clean** superimposed if the CLI summary is `Test Files 173 passed` / `Tests 765 passed` |

**SECTION B forbidden cuts:** stock APY charts, unrun Halmos CLI claiming “proved,” synthetic Dune Query 0 labels presented as decoded Gate events without caption.

---

## Verification & Regression (evaluator copy-paste)

| Metric | Lock |
|--------|------|
| Vitest | **173 test files \| 765 PASS Clean** |
| ZeroDev gate | **4/4** · `tests/adapters/zerodev-aa-gate.test.ts` |
| Across / Robinhood escort | **5/5** · `tests/adapters/across-ingress-bridge.test.ts` |
| Chaos | **255/255** · `capitalLossUsd: 0` |
| Wasm | p50 ~106 µs · `<28kb` budget |
| Gate | Sepolia `0xb174118bc0B84e8D6D59EEF2339e29bF7FCf8BF1` |

```bash
pnpm test -- --run
pnpm exec vitest run tests/risk-control/soil-circuit-breaker.test.ts tests/adapters/across-ingress-bridge.test.ts
curl -s "https://bedeltawater.slivervine.xyz/api/grant-audit" | jq .provenanceVerified
```

Start CLI map: [`docs/VERIFICATION_MATRIX.md`](../VERIFICATION_MATRIX.md).

---

## Related Documents

| Document | Use |
|----------|-----|
| [`docs/README.md`](../README.md) | Grant reviewer navigation |
| [`SUBMISSION.md`](../ARB_Buildathon/SUBMISSION.md) | Buildathon pack |
| [`01_INSTITUTIONAL_DUE_DILIGENCE_MEMORANDUM.md`](../audit/01_INSTITUTIONAL_DUE_DILIGENCE_MEMORANDUM.md) | Allocator diligence |
| [`03_RISK_MITIGATION_AND_DISCLAIMER_FRAMEWORK.md`](../architecture/03_RISK_MITIGATION_AND_DISCLAIMER_FRAMEWORK.md) | Option C stress + 60 invariants |

**Prepared by:** SilverVine Labs · HackQuest dual-video SSOT  
**Last updated:** 2026-09-02 · Branch: `V1.0_b4_Buildaton_Submisson`
