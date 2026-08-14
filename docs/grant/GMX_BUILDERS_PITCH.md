# GMX Builders Program — Application Pack (Pipeline B)

**Project Name:** SliverVine Protocol — v0.8 Santenmoku Engine (Tri-Layer Quantitative Risk Architecture)  
**Entity:** SilverVine Labs · **Contact:** grants@silvervinelabs.com  
**Official Site:** [silvervinelabs.com](https://silvervinelabs.com) — Defense Matrix portal  
**Repository:** [SilverVineLabs/bedelta-living-water](https://github.com/SilverVineLabs/bedelta-living-water)  
**Ecosystem DApp:** [slivervine.xyz](https://slivervine.xyz)  
**Live HUD:** [bedeltawater.slivervine.xyz](https://bedeltawater.slivervine.xyz)  
**Grant Audit API:** `curl -s "https://bedeltawater.slivervine.xyz/api/grant-audit" | jq .arbitrumCitadel`

**GMX Builders Program channel:** [t.me/GMXPartners](https://t.me/GMXPartners)

---

## Executive Summary

SliverVine Protocol ships an open-source **GMX v2 Pre-Execution Security Gateway & Underweight Router** on Arbitrum One. Before any GMX DataStore broadcast, the Citadel edge evaluates sequencer health, oracle lag, soil resistance, and pool skew — then routes qualified flow to GM pool **underweight sides** that reduce imbalance.

HUD and API telemetry use **Provenance Verified** or **Estimated Yield** badges — never absolute performance guarantees. The BeΔ Zero-Delta Vault is a **Reference Deployment** illustrating **Target Delta Band** (Δ ≈ 0.00 band, not zero-drawdown promise).

---

## Public Technical Highlights

| Capability | Description | SSOT / Proof |
|------------|-------------|--------------|
| **5 bps `uiFeeReceiver` Builder Accrual** | Every unsigned GMX v2 increase/decrease/deposit payload injects configurable `uiFeeReceiver` — protocol-native builder fee path, not mislabeled protocol rebate | `gmx-v2-order-payload.ts` · `GmxBuilderProofPanel` |
| **Two-Tier RPC Radar** | Tier 1: multi-provider RPC/WS failover · Tier 2: `SEQUENCER_OUTAGE_CONFIRMED` when all heads stale >5s · trips `checkSoilResistance()` | `rpc-radar.ts` |
| **Arbiscan Sepolia On-Chain Proof** | Dual-leg Sepolia validation artifact · `sepoliaTxHash` + Arbiscan URL in `GET /api/grant-audit` · bundled Worker-safe JSON | `sepolia-dual-leg-proof.types.ts` |
| **Telemetry HUD** | Live Grant Audit dashboard · Citadel metrics JSON · sidecar health relay | [bedeltawater.slivervine.xyz](https://bedeltawater.slivervine.xyz) · `GET /api/grant-audit` |
| **Dynamic Slippage & Execution Conservation** | Pre-trade soil fuse · adaptive slippage envelopes · 500ms decision SLO · fail-closed when latency or depth trips | `checkSoilResistance()` · `arbitrum-gas-guard.ts` |

---

## Core Proposition

| Pillar | Description |
|--------|-------------|
| **Pre-Execution Security Gateway** | Off-chain gate blocks toxic flow before on-chain execution — sequencer, oracle lag, soil resistance, price-impact penalty probes. |
| **Underweight-side Liquidity Router** | `isGmxBalancerQualified` routes to the GM side that **reduces imbalance** — sticky TVL for GMX LPs. |
| **Dual-Engine Reference Vault** | GMX GM + Hyperliquid hedge stack under fail-closed guards — illustrative, not a retail yield product. |

---

## Dual-Engine Architecture (Public Summary)

SliverVine operates **Arbitrum Citadel** (primary GMX v2 path) and **Hyperliquid Native** (emergency hedge sponge) behind a single Edge Worker. Routing policy selects venue per risk flags — internal execution micro-optimizations are **not exposed** via public audit APIs.

**Primary path:** GMX v2 GM underweight rebalance + builder fee alignment.  
**Fallback path:** Cross-venue hedge reroute when Citadel flags trip (`cross-venue-fail-safe.ts`).  
**Public audit surface:** aggregated guard states, TVL, spread bps, balancer qualification — no signing material, calldata templates, or proprietary encode paths in JSON responses.

---

## B2B Circuit Breaker Stack

| Layer | Module | Behavior |
|-------|--------|----------|
| Chainlink Sequencer | `sequencer-guard.ts` | 600s grace · fail-closed |
| Statuspage Sentinel | `arbitrum-status-sentinel.ts` | `SEQUENCER_ANOMALY_DETECTED` |
| **Two-Tier RPC Radar** | `rpc-radar.ts` | Tier 1 failover · Tier 2 `SEQUENCER_OUTAGE_CONFIRMED` |
| Soil Resistance | `checkSoilResistance()` | Dynamic slippage · depth · cross-spread fuse |
| Escalation Ladder | `escalation-ladder.ts` | Pre-emptive de-lever · RED → `panic:flash` |

Badge: `[ ⚡ 500ms DECISION DEADLINE SLO : FAIL-CLOSED ARMED ]` · Dynamic Max SL = `Balance × 1% + $100`.

---

## Underweight Side-Routing & Price Impact

Router qualifies flow only when rebalance **reduces GM pool skew** and passes soil gates. **Estimated Yield** from price-impact subsidy geometry is surfaced as **Provenance Verified** (on-chain) or **Estimated Projection** (simulated) in the Grant Audit HUD — not a frictionless-execution claim.

---

## Monetization & Milestones ($30k · $10k × 3)

| Stream | Mechanism |
|--------|-----------|
| UI Fee (+5 bps) | `uiFeeReceiver` on unsigned payloads |
| Underweight flow | Qualified rebalance volume attribution |
| Referral | Optional `referralCode` (bytes32) |

**M1 (Mainnet Pre-Execution Gateway & Live Telemetry — $10k):** **Complete & Live.** Off-chain Citadel Edge Gateway, Arbitrum One + Sepolia dual-leg provenance, Live HUD, machine-readable +5 bps `uiFeeReceiver` routing, `/api/grant-audit` certificate endpoint, 686 Vitest tests pass clean (126 test files, grant-ui-ssot).

**M2 (Institutional Gateway & CCXT Adapter — $10k):** CCXT-compatible asynchronous order-key state machine, Docker Sidecar (`:8080`) execution daemon, multi-market rebalance router, automated on-chain `claimUiFees` integration.

**M3 (B2B Scaling & Cross-Venue Compensation — $10k):** Single-writer high-frequency nonce queue, multi-tenant rate-limiting & mTLS, cross-venue automated liquidation compensation, institutional B2B SLA framework.

---

## Live Proof & Verification

```bash
pnpm install && pnpm test && npx tsc --noEmit
curl -s "https://bedeltawater.slivervine.xyz/api/grant-audit" | jq .arbitrumCitadel.isGmxBalancerQualified
curl -s "https://bedeltawater.slivervine.xyz/api/grant-audit" | jq .sepoliaDualLegProof.arbiscanUrl
curl -s "https://bedeltawater.slivervine.xyz/api/telemetry/health" | jq .success
```

| Surface | URL |
|---------|-----|
| Grant Audit HUD | [bedeltawater.slivervine.xyz](https://bedeltawater.slivervine.xyz) |
| Citadel JSON | `GET /api/grant-audit` |
| Sidecar health | `GET /localhost:8787/health` (see DOCKER_README) |

**Regression bar:** 686 Vitest tests pass clean (126 test files, grant-ui-ssot) · production build clean.

---

## Why GMX Benefits

1. **Sticky GM TVL** — Time-weighted retained GM positions.  
2. **Imbalance healing** — Underweight-side routing reduces pool skew.  
3. **Builder fee alignment** — 5 bps `uiFeeReceiver` on routed volume.  
4. **Audit transparency** — Provenance badges · open-source guard SSOT · redacted public API (no internal encode secrets).

---

## Related Documents

| Document | Purpose |
|----------|---------|
| [SUBMISSION.md](./SUBMISSION.md) | Grant submission pack |
| [../ARCHITECTURE.md](../ARCHITECTURE.md) | Dual-engine topology |
| [DOCKER_README.md](../../DOCKER_README.md) | B2B sidecar install |
