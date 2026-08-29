# SliverVine Arbitrum Citadel — Technical One-Pager

**GMX v2 Pre-Execution Security Gateway & Underweight Router on Arbitrum One.**


|                |                                                                                                 |
| -------------- | ----------------------------------------------------------------------------------------------- |
| Entity         | SilverVine Labs · `grants@silvervinelabs.com`                                                   |
| Official Site  | [silvervinelabs.com](https://silvervinelabs.com) — Defense Matrix portal                        |
| Repo           | [SilverVineLabs/bedelta-living-water](https://github.com/SilverVineLabs/bedelta-living-water)   |
| Live DApp      | [bedeltawater.slivervine.xyz](https://bedeltawater.slivervine.xyz)                              |
| Regression bar | **173 test files | 761 PASS (100% Clean)** *(Locked Baseline: 168 \| 742)* · `tsc --noEmit` clean                             |
| License        | BUSL-1.1 → Apache-2.0 at M2 / $10M TVL or 24 months                                             |
| Spec SSOT      | `[docs/architecture/TECHNICAL_SPECIFICATION.md](../../architecture/TECHNICAL_SPECIFICATION.md)` |


---



## What It Does

Before any GMX DataStore broadcast, the Citadel edge evaluates sequencer health, oracle lag, soil resistance, and pool skew — then routes qualified flow to GM pool **underweight sides**, reducing imbalance. Hyperliquid session-key hedging is the Emergency Liquidity Sponge fallback.

**Triangle Liquidity Loop:** `Robinhood Chain (Permissioned Institutional Ingress)` ↔ `Arbitrum One (GMX GM Yield Base)` ↔ `Hyperliquid (1× Short Hedge)`.

**Arbitrum Native Execution Premium:** Direct Arbitrum One liquidity providers earn an estimated **+15 ~ 30 bps** execution premium vs bridged / multi-hop routes (Stylus-aligned ingress · lower cross-venue friction · underweight rebate capture).

## Robinhood Chain Status


| Network           | Chain ID  | Status                                                                       |
| ----------------- | --------- | ---------------------------------------------------------------------------- |
| Robinhood Testnet | **46630** | **ACTIVE / TESTED**                                                          |
| Robinhood Mainnet | **4663**  | **DEPLOYMENT READY** (permissioned RWA tranche · inbound blocked by default) |




## Live Proof

- **1 live mainnet order:** 0.2223 ETH Short, OID `513344575969` (hyperliquid-mainnet) — machine-readable via `provenanceVerified` in `GET /api/grant-audit`.
- **5-TX verified testnet suite:** HL testnet fills bundled at `src/data/verified_5tx_results.json`.
- **Arbiscan Sepolia anchor:** dual-leg proof bundle (`sepoliaDualLegProof`); simulated legs explicitly marked `simulated: true`.



## Defense Posture


| Guard                      | Threshold                                         |
| -------------------------- | ------------------------------------------------- |
| Chainlink Sequencer Uptime | 600s grace · fail-closed                          |
| Canonical Oracle Lag       | <30s (30,000ms) vs L2 block headers · fail-closed |
| Dynamic Max SL             | Dynamic Account Risk Ceiling (V0.8 Baseline: Equity-Weighted SL; V1.0 Mainnet: Dynamic Adaptive Engine) |
| CrossVenueNetSlippage      | >0.5% → soil trip + TWAP                          |
| NTP / Pgate latency        | <200ms drift / RTT fuse                           |
| Emergency Margin Buffer    | 5%                                                |
| Daily Loss Breaker         | 1.5% MDD · Root lockout                           |
| Decision SLO               | 500ms · fail-closed                               |
| Cron Auto-Rebalancer       | 5-min · $10 drift gate · circuit breaker          |




## Why GMX Benefits

1. Sticky GM TVL — time-weighted retained positions.
2. Imbalance healing — underweight-side routing reduces pool skew · positive skew rebate capture.
3. Builder fee alignment — +10 bps `uiFeeReceiver` + up to **25%** referral rebate on every routed unsigned payload.
4. Native LP premium — **+15 ~ 30 bps** for direct Arbitrum One providers.
5. Audit transparency — provenance badges, open-source guard SSOT, redacted public API.



## Verify (60s)

```bash
pnpm install && pnpm test && npx tsc --noEmit
curl -s "https://bedeltawater.slivervine.xyz/api/grant-audit" | jq .provenanceVerified
```

