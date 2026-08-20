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
| Sequencer Guard | `sequencer-guard.ts` | Chainlink uptime · dynamic grace window · fail-closed |
| Oracle Lag Shield | `arbitrum-gas-guard.ts` | Canonical lag probe · dynamic runtime threshold · FAIL-CLOSED deadlock (machine-readable via `/api/grant-audit`) |
| Cross-Venue Sponge | `cross-venue-fail-safe.ts` | HL hedge reroute when Citadel flags trip |

---

## Live Proof Telemetry

Source: `GET /api/grant-audit` · SWR-bound Grant Audit HUD.

| Metric | Value |
|--------|-------|
| GMX GM ETH/USD Pool TVL | ~$802.43 USDC (489.716 GM · `0xc9BddABD80982d2201376195DD9B85fb7951546f`) |
| HL Session Key Hedge Margin | ~$199.80 USDC |
| Combined Monitored Citadel TVL | ~$1,302.39 USDC |
| Zero-Δ Dynamic Shield · MDD Guard | **0.00% MDD** Dual-leg net delta · (Live Pilot · ~$1.3k TVL) |
| GMX Ecosystem Defenses | OI Imbalance Absorbed · Price Impact Rebate Optimizer (+0.02% Saved) · Canonical Oracle Lag Shield (dynamic runtime threshold · machine-readable via `/api/grant-audit`) · Zero-429 SWR Storage Guard |

---

## Grant Audit HUD — Section 2 Defense Matrix

| Badge | Surface | Behavior |
|-------|---------|----------|
| `[ 🛡️ GMX v2 DATASTORE CIRCUIT BREAKER: ARMED ]` | Section 2 | DataStore fail-closed gate |
| Zero-Δ Dynamic Shield | Citadel panel | Dual-leg net delta · **0.00% MDD** (Live Pilot · ~$1.3k TVL)|
| Execution History | Logs panel | 5-TX Verified Testnet Suite + 1 Live Mainnet Order (OID: `513344575969`) |

---

## Tri-Sensor Telemetry Matrix (Control Loop Architecture)

Citadel's pre-execution gateway implements a closed-loop **Tri-Sensor Telemetry Matrix**. Three orthogonal observability channels fuse into a single fail-closed decision — **no static weight constants** ($w_1$, $w_2$, $\lambda$) appear in public grant materials.

| Sensor Channel | Observability Domain | Control Action |
|----------------|---------------------|----------------|
| **BaseFee Velocity Sensor** | ArbOS EIP-1559 base-fee acceleration / deceleration | Throttle dispatch on congestion stress exceeding dynamic tolerance band |
| **RPC Jitter Radar** | Multi-provider RTT dispersion and head-staleness | Fail-closed on endpoint phase desync |
| **Phase-Shift Instability Detector** | Cross-venue oracle / book phase alignment | Instant circuit breaker on cross-sensor anomaly |

Live threshold envelopes and guard states: `GET /api/grant-audit`.

> **The engine dynamically derives the Blindspot Risk Index (BRI) from ArbOS BaseFee velocity and RPC jitter. Upon exceeding dynamic runtime thresholds, a signed fail-closed signal is emitted.**

---

## Verification (60s)

```bash
pnpm install
pnpm test    # 128 Test Files | 677 Vitest PASS (100% Clean)
npx tsc --noEmit
curl -s "https://bedeltawater.slivervine.xyz/api/grant-audit" | jq .arbitrumCitadel
```

**Regression bar:** **128 Test Files | 677 Vitest PASS (100% Clean)** · **60/60 Foundry Tests Passed | 327,675 Fuzzing Executions** · **p50 ~106 μs (pure risk math mean: 0.0002 ms / 200 ns)** · **158.99 KiB gzip** · **verifyAndConsume: 25,853 min / 28,043 median gas** · **`npx tsc --noEmit` CLEAN**

---

## Monetization & Milestones ($30k · $10k × 3)

| Stream | Mechanism |
|--------|-----------|
| UI Fee (+5 bps) | `uiFeeReceiver` on every unsigned GMX v2 payload |
| Underweight flow | Qualified rebalance volume attribution |
| Referral | Optional `referralCode` (bytes32) |

| Milestone | Scope | Status |
|-----------|-------|--------|
| **M1** — Mainnet Pre-Execution Gateway & Live Telemetry ($10k) | Off-chain Citadel Edge Gateway · Arbitrum One + Sepolia dual-leg provenance · Live HUD · machine-readable +5 bps `uiFeeReceiver` routing · `/api/grant-audit` certificate endpoint · **128 Test Files | 677 Vitest PASS (100% Clean)** | **Complete & Live** |
| **M2** — Institutional Gateway & CCXT Adapter ($10k) | CCXT-compatible asynchronous order-key state machine · Docker Sidecar (`:8080`) execution daemon · multi-market rebalance router · automated on-chain `claimUiFees` integration | Planned |
| **M3** — B2B Scaling & Cross-Venue Compensation ($10k) | Single-writer high-frequency nonce queue · multi-tenant rate-limiting & mTLS · cross-venue automated liquidation compensation · institutional B2B SLA framework | Planned |

---

## Related Documents

| Document | Purpose |
|----------|---------|
| [GMX_BUILDERS_PITCH.md](./GMX_BUILDERS_PITCH.md) | GMX Builders Program pack |
| [ARBITRUM_ONE_PAGER.md](../ARBITRUM_ONE_PAGER.md) | Arbitrum DAO one-pager |
| [GRANT_PROPOSAL.md](../GRANT_PROPOSAL.md) | Full scope & roadmap |
| [ARCHITECTURE.md](../ARCHITECTURE.md) | Dual-engine topology |
