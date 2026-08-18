# SliverVine Arbitrum Citadel — Technical One-Pager

**GMX v2 Pre-Execution Security Gateway & Underweight Router on Arbitrum One.**

| | |
|---|---|
| Entity | SilverVine Labs · `grants@silvervinelabs.com` |
| Official Site | [silvervinelabs.com](https://silvervinelabs.com) — Defense Matrix portal |
| Repo | [SilverVineLabs/bedelta-living-water](https://github.com/SilverVineLabs/bedelta-living-water) |
| Live DApp | [bedeltawater.slivervine.xyz](https://bedeltawater.slivervine.xyz) |
| Regression bar | 128 Test Files \| 677 Vitest PASS (100% Clean) · 60/60 Foundry Tests Passed \| 327,675 Fuzzing Executions · p50 ~106 μs (pure risk math mean: 0.0002 ms / 200 ns) · 158.99 KiB gzip · verifyAndConsume: 25,853 min / 28,043 median gas · `tsc --noEmit` clean |
| License | BUSL-1.1 → Apache-2.0 at M2 / $10M TVL or 24 months |

---

## What It Does

Before any GMX DataStore broadcast, the Citadel edge evaluates sequencer health, oracle lag, soil resistance, and pool skew — then routes qualified flow to GM pool **underweight sides**, reducing imbalance. Hyperliquid session-key hedging is the Emergency Liquidity Sponge fallback.

## Live Proof

- **1 live mainnet order:** 0.2223 ETH Short, OID `513344575969` (hyperliquid-mainnet) — machine-readable via `provenanceVerified` in `GET /api/grant-audit`.
- **5-TX verified testnet suite:** HL testnet fills bundled at `src/data/verified_5tx_results.json`.
- **Arbiscan Sepolia anchor:** dual-leg proof bundle (`sepoliaDualLegProof`); simulated legs explicitly marked `simulated: true`.

## Defense Posture

| Guard | Threshold |
|-------|-----------|
| Chainlink Sequencer Uptime | 600s grace · fail-closed |
| Canonical Oracle Lag | <30s (30,000ms) vs L2 block headers · fail-closed |
| Dynamic Max SL | `Balance × 1% + $100` |
| Daily Loss Breaker | 1.5% MDD · Root lockout |
| Decision SLO | 500ms · fail-closed · p50 ~106 μs (pure risk math mean: 0.0002 ms / 200 ns) |
| Cron Auto-Rebalancer | 5-min · $10 drift gate · circuit breaker |

## Why GMX Benefits

1. Sticky GM TVL — time-weighted retained positions.
2. Imbalance healing — underweight-side routing reduces pool skew.
3. Builder fee alignment — +5 bps `uiFeeReceiver` on every routed unsigned payload.
4. Audit transparency — provenance badges, open-source guard SSOT, redacted public API.

## Verify (60s)

```bash
pnpm install && pnpm test && npx tsc --noEmit
curl -s "https://bedeltawater.slivervine.xyz/api/grant-audit" | jq .provenanceVerified
```
