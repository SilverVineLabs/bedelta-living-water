# GMX Builders Program — Application Pack

**Official Name:** SliverVine Protocol (BeDelta Living Water v1.0 / BeΔ)
**Project:** SliverVine Protocol — Sub-ms 0-Gas Pre-Broadcast Safety Citadel & Risk Navigator for AI Agents on Arbitrum (GMX v2 GM Pool Gateway)
**Entity:** SilverVine Labs · **Contact:** `grants@silvervinelabs.com`
**Official Site:** [silvervinelabs.com](https://silvervinelabs.com)
**Repo:** [SilverVineLabs/bedelta-living-water](https://github.com/SilverVineLabs/bedelta-living-water)
**Live HUD:** [bedeltawater.slivervine.xyz](https://bedeltawater.slivervine.xyz)
**Grant Audit:** `curl -s "https://bedeltawater.slivervine.xyz/api/grant-audit" | jq .arbitrumCitadel`
**Channel:** [t.me/GMXPartners](https://t.me/GMXPartners)

> **Vitest SSOT:** **180 test files | 803 PASS Clean** · Security-tier `5/0/0 PASS` · Defense Matrix `17 Active | 2 Refactored | 1 Deprecated` · Wasm `<28kb` / `<60µs`.

**Audience:** GMX Builders only. Do not lead with ZeroDev / Robinhood / HL grant narratives.

---

## Executive Summary

SliverVine ships an open-source **GMX v2 Pre-Execution Security Gateway & Underweight Router** on Arbitrum One. Before any GMX DataStore broadcast, the Citadel edge evaluates soil resistance (slippage / depth / cross-spread), sequencer health, and pool skew — then routes qualified flow to GM pool **underweight sides** that reduce imbalance.

Every unsigned increase / decrease / deposit payload injects **+10 bps `uiFeeReceiver`** (SliverVine Treasury via `GMX_UI_FEE_RECEIVER`) + optional **25% referral rebate** — protocol-native builder accrual, no custody.

---

## GMX-Native Capabilities

| Capability | Description | SSOT |
|------------|-------------|------|
| **Soil / slippage protection** | `checkSoilResistance()` fuse on GM-bound flow — depth, cross-venue slip, GMX price-impact probe | `soil-resistance.ts` · `gmx-v2-price-impact.ts` |
| **Underweight-side router** | `isGmxBalancerQualified` — only routes when rebalance **reduces GM skew** | `gmx-v2-balancer.ts` |
| **+10 bps `uiFeeReceiver`** | Injected on every unsigned GMX v2 payload (+ optional `referralCode` · up to **25%** rebate) | `gmx-v2-order-payload.ts` |
| **DataStore-safe path** | Fail-closed before broadcast; public audit JSON redacts encode secrets | `GET /api/grant-audit` |
| **Sepolia dual-leg proof** | Arbiscan-anchored validation artifact for builder diligence | `sepoliaDualLegProof` |

---

## Why GMX Benefits

1. **Sticky GM TVL** — time-weighted retained GM positions.
2. **Imbalance healing** — underweight-side routing reduces pool skew.
3. **Builder fee alignment** — +10 bps `uiFeeReceiver` on routed volume.
4. **Audit transparency** — Provenance badges · open guard SSOT · redacted public API.

---

## Monetization & Milestones ($30k · $10k × 3)

| Stream | Mechanism |
|--------|-----------|
| UI Fee (+10 bps) | `uiFeeReceiver` on unsigned payloads · up to **25%** referral rebate |
| Underweight flow | Qualified rebalance volume attribution |
| Referral | Optional `referralCode` (bytes32) |

| Milestone | Scope | Status |
|-----------|-------|--------|
| **M1** | **v1.0 Delivered (Sepolia verified)** · pre-exec gateway · Live HUD · +10 bps routing · `/api/grant-audit` · **180 test files | 803 PASS Clean** | ✅ Delivered (Sepolia & dry-run; mainnet ties to M6) |
| **M2** | Institutional gateway · sidecar daemon · `claimUiFees` | ✅ Core Built (Sidecar Daemon Ready / Awaiting Treasury Claim Hook) |
| **M3** | Multi-tenant B2B · cross-venue compensation SLA | Roadmap (Multi-tenant B2B & Cross-venue SLA) |

---

## Verification (60s)

```bash
pnpm install && pnpm test && npx tsc --noEmit
pnpm run audit:security # 5/0/0 PASS target
curl -s "https://bedeltawater.slivervine.xyz/api/grant-audit" | jq .arbitrumCitadel.isGmxBalancerQualified
```

**Regression bar:** **180 test files | 803 PASS Clean** · Forge 60/60 · **327,675 Property Fuzz Executions** (`pnpm audit:nightly` / `FOUNDRY_PROFILE=deep`; standard `forge test` = 5,120) · Wasm `<28kb` / `<60µs`.

---

## Related Documents

| Document | Purpose |
|----------|---------|
| [`../README.md`](../README.md) | Grants index |
| [`../../architecture/01_TECHNICAL_SPECIFICATION.md`](../../architecture/01_TECHNICAL_SPECIFICATION.md) | R01–R20 invariants |
| [`../../ARB_Buildathon/SUBMISSION.md`](../../ARB_Buildathon/SUBMISSION.md) | Buildathon / Arbitrum submission pack (separate audience) |
