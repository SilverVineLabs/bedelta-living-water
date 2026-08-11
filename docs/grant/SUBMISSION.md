# Grant Submission Pack — GMX v2 Arbitrum Citadel Gateway

**Entity:** SilverVine Labs · **Contact:** grants@silvervinelabs.com  
**Official Site:** [silvervinelabs.com](https://silvervinelabs.com) — Defense Matrix portal  
**Live DApp:** [bedeltawater.slivervine.xyz](https://bedeltawater.slivervine.xyz)  
**Live Verification:** `curl -s "https://bedeltawater.slivervine.xyz/api/grant-audit"`  
**Repo:** [SilverVineLabs/bedelta-living-water](https://github.com/SilverVineLabs/bedelta-living-water)

---

## Primary Venue — GMX v2 Arbitrum Citadel

SliverVine ships an **Off-Chain Zero-Trust Pre-Execution Safety Gateway** for GMX v2 GM pools on Arbitrum One. Hyperliquid Session Key hedging is the **Emergency Liquidity Sponge** fallback — not the primary execution battlefield.

| Layer | Module | Role |
|-------|--------|------|
| GMX Balancer Engine | `gmx-v2-balancer.ts` | Underweight-side qualification · `isGmxBalancerQualified` |
| GMX v2 Adapter | `gmx-v2-adapter.ts` | DataStore read-path · `uiFeeReceiver` / `referralCode` |
| Sequencer Guard | `sequencer-guard.ts` | Chainlink uptime · 600s grace · fail-closed |
| Oracle Lag Shield | `arbitrum-gas-guard.ts` | Canonical lag probe · <30s (30,000ms) FAIL-CLOSED deadlock |
| Cross-Venue Sponge | `cross-venue-fail-safe.ts` | HL hedge reroute when Citadel flags trip |

---

## Live Proof Telemetry

Source: `GET /api/grant-audit` · SWR-bound Grant Audit HUD.

| Metric | Value |
|--------|-------|
| GMX GM ETH/USD Pool TVL | ~$802.43 USDC (489.716 GM · `0xc9BddABD80982d2201376195DD9B85fb7951546f`) |
| HL Session Key Hedge Margin | ~$199.80 USDC |
| Combined Monitored Citadel TVL | ~$1,302.39 USDC |
| Zero-Δ Dynamic Shield · MDD Guard | **0.00% MDD** (90d window · ~$1.3k monitored Citadel TVL) |
| GMX Ecosystem Defenses | OI Imbalance Absorbed · Price Impact Rebate Optimizer (+0.02% Saved) · Canonical Oracle Lag Shield (<30s FAIL-CLOSED) · Zero-429 SWR Storage Guard |

---

## Grant Audit HUD — Section 2 Defense Matrix

| Badge | Surface | Behavior |
|-------|---------|----------|
| `[ 🛡️ GMX v2 DATASTORE CIRCUIT BREAKER: ARMED ]` | Section 2 | DataStore fail-closed gate |
| Zero-Δ Dynamic Shield | Citadel panel | Dual-leg net delta · 0.00% MDD (90d · ~$1.3k TVL) |
| Execution History | Logs panel | 5-TX Verified Testnet Suite + 1 Live Mainnet Order (OID: `513344575969`) |

---

## Verification (60s)

```bash
pnpm install
pnpm test    # 630 Vitest PASS (117 test files, 100% Clean)
npx tsc --noEmit
curl -s "https://bedeltawater.slivervine.xyz/api/grant-audit" | jq .arbitrumCitadel
```

**Regression bar:** **117 Test Files | 630 Vitest PASS (100% Clean)** · **`npx tsc --noEmit` CLEAN**

---

## Monetization & Milestones ($30k · $10k × 3)

| Stream | Mechanism |
|--------|-----------|
| UI Fee (+5 bps) | `uiFeeReceiver` on every unsigned GMX v2 payload |
| Underweight flow | Qualified rebalance volume attribution |
| Referral | Optional `referralCode` (bytes32) |

| Milestone | Scope | Status |
|-----------|-------|--------|
| **M1** — Mainnet Pre-Execution Gateway & Live Telemetry ($10k) | Off-chain Citadel Edge Gateway · Arbitrum One + Sepolia dual-leg provenance · Live HUD · machine-readable +5 bps `uiFeeReceiver` routing · `/api/grant-audit` certificate endpoint · **117 test files / 630 Vitest PASS** | **Complete & Live** |
| **M2** — Institutional Gateway & CCXT Adapter ($10k) | CCXT-compatible asynchronous order-key state machine · Docker Sidecar (`:8080`) execution daemon · multi-market rebalance router · automated on-chain `claimUiFees` integration | Planned |
| **M3** — B2B Scaling & Cross-Venue Compensation ($10k) | Single-writer high-frequency nonce queue · multi-tenant rate-limiting & mTLS · cross-venue automated liquidation compensation · institutional B2B SLA framework | Planned |

---

## Related Documents

| Document | Purpose |
|----------|---------|
| [GMX_BUILDERS_PITCH.md](./GMX_BUILDERS_PITCH.md) | GMX Builders Program pack |
| [ARBITRUM_ONE_PAGER.md](../ARBITRUM_ONE_PAGER.md) | Arbitrum DAO one-pager |
| [GRANT_PROPOSAL.md](./GRANT_PROPOSAL.md) | Full scope & roadmap |
| [ARCHITECTURE.md](../ARCHITECTURE.md) | Dual-engine topology |
