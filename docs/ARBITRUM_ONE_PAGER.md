# SliverVine Arbitrum Citadel — Technical One-Pager

**GMX v2 Pre-Execution Security Gateway & Underweight Router on Arbitrum One.**

| | |
|---|---|
| Entity | SilverVine Labs · `grants@silvervinelabs.com` |
| Official Site | [silvervinelabs.com](https://silvervinelabs.com) — Defense Matrix portal |
| Repo | [SilverVineLabs/bedelta-living-water](https://github.com/SilverVineLabs/bedelta-living-water) |
| Live DApp | [bedeltawater.slivervine.xyz](https://bedeltawater.slivervine.xyz) |
| Regression bar | 117 test files · 630 Vitest PASS · `tsc --noEmit` clean |
| License | BUSL-1.1 → Apache-2.0 at M2 / $10M TVL or 24 months |

---

## What It Does

Before any GMX DataStore broadcast, the Citadel edge evaluates sequencer health, oracle lag, soil resistance, and pool skew — then routes qualified flow to GM pool **underweight sides**, reducing imbalance. Hyperliquid session-key hedging is the Emergency Liquidity Sponge fallback.

## Live Proof

- **1 live mainnet order:** 0.2223 ETH Short, OID `513344575969` (hyperliquid-mainnet) — machine-readable via `provenanceVerified` in `GET /api/grant-audit`.
- **5-TX verified testnet suite:** HL testnet fills bundled at `src/data/verified_5tx_results.json`.
- **Arbiscan Sepolia anchor:** dual-leg proof bundle (`sepoliaDualLegProof`); simulated legs explicitly marked `simulated: true`.
- **MDD guard:** 0.00% MDD (Santenmoku Verified Window · Machine-Readable Telemetry · ~$1.3k Monitored Citadel TVL).

## Defense Posture

| Guard | Threshold |
|-------|-----------|
| Chainlink Sequencer Uptime | 600s grace · fail-closed |
| Canonical Oracle Lag | <30s (30,000ms) vs L2 block headers · fail-closed |
| Dynamic Max SL | `Balance × 1% + $100` |
| Daily Loss Breaker | 1.5% MDD · Root lockout |
| Decision SLO | 500ms sidecar RTT · gateway eval <1.0ms (verified ~0.22ms) |
| Cron Auto-Rebalancer | 5-min · $10 drift gate · circuit breaker |

## Adversarial Hardening (Verified)

| Gate | Result |
|------|--------|
| Chaos Matrix (Groups A–K) | 262 cases · 0 crashes · fail-closed verified |
| Property Fuzzing | 65,535 iterations · 100% toxic intercept · 0 crashes |
| Tier-1 Resilience Benchmark | Decision SLO <1.0ms (verified ~0.22ms) · RPC failover <50ms (verified ~40.5ms) · TOCTOU fail-closed |
| Oracle / impact hardening | 100% fail-closed on zero/invalid oracle timestamps and NaN price impact |

## Why GMX Benefits

1. Sticky GM TVL — time-weighted retained positions.
2. Imbalance healing — underweight-side routing reduces pool skew.
3. Builder fee alignment — +5 bps `uiFeeReceiver` on every routed unsigned payload.
4. Audit transparency — provenance badges, open-source guard SSOT, redacted public API.

## Verify (60s)

```bash
pnpm install && pnpm test && npx tsc --noEmit
npx tsx scripts/chaos-blackswan-stress.ts
npx tsx scripts/fuzz-65535-stress.ts
npx tsx scripts/grant-advanced-resilience-benchmark.ts
curl -s "https://bedeltawater.slivervine.xyz/api/grant-audit" | jq .provenanceVerified
```
