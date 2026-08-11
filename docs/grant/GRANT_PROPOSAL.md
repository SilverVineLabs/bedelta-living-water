# Grant Proposal — GMX v2 Arbitrum Citadel Gateway (M1–M3)

**Entity:** SilverVine Labs · **Contact:** grants@silvervinelabs.com  
**Official Site:** [silvervinelabs.com](https://silvervinelabs.com) — Defense Matrix portal  
**Live DApp:** [bedeltawater.slivervine.xyz](https://bedeltawater.slivervine.xyz)  
**Regression bar:** **117 test files · 630 Vitest PASS** · **`tsc` CLEAN**

---

## 1. Executive Summary

Open-source **GMX v2 Pre-Execution Security Gateway** on Arbitrum One. Before any DataStore broadcast, Citadel evaluates sequencer health, oracle lag, soil resistance, and pool skew — routing qualified flow to GM underweight sides. Hyperliquid Session Key hedging is the **Emergency Liquidity Sponge**.

Live proof: **0.2223 ETH Short** (OID `513344575969`) · `GET /api/grant-audit`.

---

## 2. M1 — Mainnet Pre-Execution Gateway & Live Telemetry ($10k)

**Status: Complete & Live.**

| Deliverable | Module | Status |
|-------------|--------|--------|
| Off-chain Citadel Edge Gateway | `sequencer-guard.ts` · `arbitrum-gas-guard.ts` · soil envelope | **Live** |
| Arbitrum One + Sepolia dual-leg provenance | `grant-audit-provenance.ts` · `sepoliaDualLegProof` | **Live** |
| Live HUD + Grant Audit certificate | `bedeltawater.slivervine.xyz` · `GET /api/grant-audit` | **Live** |
| Machine-readable +5 bps `uiFeeReceiver` routing | `gmx-v2-order-payload.ts` · `gmxBuilderProof` JSON | **Live** |
| GMX Balancer / underweight router | `gmx-v2-balancer.ts` | **Live** |
| Regression bar | 117 test files · 630 Vitest PASS · `tsc` CLEAN | **Live** |

### M1 Done Criteria

- [x] Live `/api/grant-audit` with provenance-verified mainnet order + Sepolia dual-leg bundle
- [x] 117 / 117 test files PASS · 630 Vitest PASS
- [x] Fail-closed guards wired before any GMX payload broadcast path
- [x] HUD MDD label scoped (90d · ~$1.3k monitored TVL)

---

## 3. M2 — Institutional Gateway & CCXT Adapter ($10k)

| Deliverable | Status |
|-------------|--------|
| CCXT-compatible asynchronous order-key state machine | Planned |
| Docker Sidecar (`:8080`) execution daemon ([DOCKER_README.md](../../DOCKER_README.md)) | Planned |
| Multi-market rebalance router | Planned |
| Automated on-chain `claimUiFees` integration | Planned |

M2 sits **behind** the same Citadel fail-closed envelope — no guard bypass.

### M2 Done Criteria

- [ ] In-repo CCXT facade with `fetchTicker` · `createOrder` · `fetchPositions` parity tests green
- [ ] Sidecar intent gate + keeper saga handles partial-fill compensation without soil bypass
- [ ] 117+ test files PASS · zero TS errors · grant-audit JSON contract unchanged

### M2 NOT Done

- [ ] PyPI / npm package publish
- [ ] Custody or pooled user funds

---

## 4. M3 — B2B Scaling & Cross-Venue Compensation ($10k)

| Deliverable | Status |
|-------------|--------|
| Single-writer high-frequency nonce queue | Planned |
| Multi-tenant rate-limiting & mTLS | Planned |
| Cross-venue automated liquidation compensation | Planned |
| Institutional B2B SLA framework | Planned |

Reference vault / public SDK publish remains gated post-TVL per BUSL-1.1 schedule.

---

## 5. Verification

```bash
pnpm install
pnpm test    # 630 Vitest PASS (117 test files)
pnpm typecheck
curl -s "https://bedeltawater.slivervine.xyz/api/grant-audit" | jq .arbitrumCitadel
```

---

## Related Documents

| Document | Purpose |
|----------|---------|
| [ARCHITECTURE.md](./ARCHITECTURE.md) | KV isolation · test count history |
| [SUBMISSION.md](./SUBMISSION.md) | Submission pack |
| [../../SECURITY.md](../../SECURITY.md) | Security policy |
