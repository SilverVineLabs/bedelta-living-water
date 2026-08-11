# SliverVine Protocol — Grant Proposal & Strategic Roadmap

**Entity:** SilverVine Labs · **Contact:** grants@silvervinelabs.com  
**Official Site:** [silvervinelabs.com](https://silvervinelabs.com) — Defense Matrix portal  
**Repo:** [SilverVineLabs/bedelta-living-water](https://github.com/SilverVineLabs/bedelta-living-water)  
**Live DApp:** [bedeltawater.slivervine.xyz](https://bedeltawater.slivervine.xyz)  
**Regression bar:** **117 Test Files | 630 Vitest PASS** · **`npx tsc --noEmit` CLEAN**

---

## 1. Executive Summary

SliverVine Protocol ships an open-source **GMX v2 Pre-Execution Security Gateway** on Arbitrum One. Before any DataStore broadcast, the Citadel edge evaluates sequencer health, oracle lag, soil resistance, and pool skew — then routes qualified flow to GM **underweight sides**. Hyperliquid Session Key hedging is the **Emergency Liquidity Sponge** fallback.

Live proof: **0.2223 ETH Short** (OID `513344575969`) — cross-venue hedge vs GMX GM Pool · `GET /api/grant-audit`.

---

## 2. Monetization & Milestones ($30k · $10k × 3)

| Stream | Mechanism |
|--------|-----------|
| UI Fee (+5 bps) | `uiFeeReceiver` on every unsigned GMX v2 payload |
| Underweight flow | Qualified rebalance volume attribution |
| Referral | Optional `referralCode` (bytes32) |

**M1 (Mainnet Pre-Execution Gateway & Live Telemetry — $10k):** **Complete & Live.** Off-chain Citadel Edge Gateway, Arbitrum One + Sepolia dual-leg provenance, Live HUD, machine-readable +5 bps `uiFeeReceiver` routing, `/api/grant-audit` certificate endpoint, 117 test files / 630 Vitest PASS.

**M2 (Institutional Gateway & CCXT Adapter — $10k):** CCXT-compatible asynchronous order-key state machine, Docker Sidecar (`:8080`) execution daemon, multi-market rebalance router, automated on-chain `claimUiFees` integration.

**M3 (B2B Scaling & Cross-Venue Compensation — $10k):** Single-writer high-frequency nonce queue, multi-tenant rate-limiting & mTLS, cross-venue automated liquidation compensation, institutional B2B SLA framework.

---

## 3. Scope & Deliverables (M1 — Live)

| Deliverable | Module | Status |
|-------------|--------|--------|
| Pre-execution fail-closed gate | `sequencer-guard.ts` · `arbitrum-gas-guard.ts` | Live |
| GMX Balancer / underweight router | `gmx-v2-balancer.ts` | Live |
| Canonical unsigned payload builder | `gmx-v2-order-payload.ts` | Live |
| Builder monetization (`uiFeeReceiver`) | `GMX_UI_FEE_RECEIVER` · +5 bps | Live |
| Grant Audit Zero-Trust JSON | `grant-audit.ts` | Live |

---

## 3. Market Gap & Technical Differentiation

### Why existing DeFi SDKs fail CEX-quant workflows

| Gap | Legacy SDK / script posture | Quant desk requirement |
|-----|----------------------------|------------------------|
| Unified execution surface | Fragmented REST + custom ABI encoders per venue | Single `createOrder` / `fetchPositions` contract |
| Keeper two-phase state | Manual `executionFee`, callback gas, order-key tracking | Abstracted saga with compensation on partial fill |
| Cross-venue hedge | Separate HL + GMX integrations, no shared risk envelope | One pre-trade soil gate across GM + perp leg |
| Monetization | Off-chain fee invoicing or missing builder hooks | Native on-chain `uiFeeReceiver` on every routed payload |

GMX v2 Keeper flows are **two-phase**: unsigned payload → keeper execution → order-key settlement. Most open-source adapters expose raw `CreateOrderParams` but leave quant teams to own retry, lag shields, and hedge reconciliation — unsuitable for CEX-grade automation.

### SliverVine CEX-Standard Abstraction (Phase 1)

SliverVine normalizes GMX + HL behind a **CCXT-shaped Phase 1 API** (implemented in Citadel services, not a third-party fork):

| CCXT-equivalent | SliverVine Phase 1 | Underlying SSOT |
|-----------------|---------------------|-----------------|
| `fetchTicker` | `fetchGmxGmTelemetry` · HL mid cache | `gmx-v2-gm-telemetry.ts` · `hl-wallet-telemetry.ts` |
| `createOrder` | `buildGmxV2OrderPayload` + `runHlAutoHedgeForGmxGm` | `gmx-v2-order-payload.ts` · `hl-auto-hedge.ts` |
| `fetchPositions` | `getGmxGmBalanceCache` · HL clearinghouse margin | `gmx-v2-gm-balance.ts` · `hl-wallet-telemetry.ts` |

All paths pass **`checkSoilResistance()`** and Citadel guards before any broadcast — the abstraction layer is safety-first, not a thin REST wrapper.

### Native `uiFeeReceiver` monetization (+5 bps)

Every unsigned GMX v2 increase/decrease/deposit payload injects:

- **`uiFeeReceiver`** — resolved from `GMX_UI_FEE_RECEIVER` env (SliverVine Treasury)
- **+5 bps UI Fee** — protocol-native builder accrual on routed calldata, not off-chain billing
- **`referralCode`** — optional GMX referral alignment on the same payload

Quant teams keep their alpha; SliverVine captures builder revenue **without custody** via routed unsigned payloads.

### M2 — Institutional Gateway & CCXT Adapter ($10k)

CCXT-compatible asynchronous order-key state machine · Docker Sidecar (`:8080`) execution daemon · multi-market rebalance router · automated on-chain `claimUiFees` integration. In-repo facade only — sits behind Citadel fail-closed guards; no PyPI/npm publish pre-TVL gate.

### M3 — B2B Scaling & Cross-Venue Compensation ($10k)

Single-writer high-frequency nonce queue · multi-tenant rate-limiting & mTLS · cross-venue automated liquidation compensation · institutional B2B SLA framework.

---

## 4. Verification

```bash
pnpm install
pnpm test    # 630 Vitest PASS (117 test files, 100% Clean)
pnpm typecheck
curl -s "https://bedeltawater.slivervine.xyz/api/grant-audit" | jq .arbitrumCitadel
```

---

## Related Documents

| Document | Purpose |
|----------|---------|
| [grant/SUBMISSION.md](./grant/SUBMISSION.md) | Grant submission pack |
| [grant/GMX_BUILDERS_PITCH.md](./grant/GMX_BUILDERS_PITCH.md) | GMX Builders Program outreach |
| [../README.md](../README.md) | Repo entry · live telemetry table |
