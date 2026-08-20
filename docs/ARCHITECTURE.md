# SliverVine Protocol — Architecture (v0.8 Multi-Layer Risk Engine)

> **Risk engine:** v0.8 Multi-Layer Risk Engine (internal code name: **Santenmoku**) — Tri-Layer Quantitative Risk Architecture.  
> **Grant-specific SSOT** (KV isolation · MDD scope · test-count history): [`docs/ARCHITECTURE.md`](./ARCHITECTURE.md)  
> **Grant application SSOT directory:** [`docs/grant/`](./grant/)

**Entity:** SilverVine Labs · **Official Site:** [silvervinelabs.com](https://silvervinelabs.com)  
**Ecosystem DApp:** [slivervine.xyz](https://slivervine.xyz) · **Live HUD:** [bedeltawater.slivervine.xyz](https://bedeltawater.slivervine.xyz)

Dual-engine topology behind a single Cloudflare Edge Worker. SRP constraint: <200 LOC per file.

---

## 1. Topology

| Engine | Venue | Role |
|--------|-------|------|
| **Arbitrum Citadel** (primary) | GMX v2 GM pools, Arbitrum One | Pre-execution gate · underweight-side routing · `uiFeeReceiver` builder accrual |
| **Hyperliquid Native** (fallback) | HL L2 perps, session-key signing | Emergency Liquidity Sponge — cross-venue hedge when Citadel flags trip |

Routing policy: venue selected per risk flags; both paths sit behind the same fail-closed envelope.

## 2. Request / Cron Flow

1. **Ingress** — `src/index.ts` → `worker-routing.ts` / `worker-fetch.ts`; crons (`*/5 * * * *`) → `worker-scheduled.ts`.
2. **Pre-execution gate** — `sequencer-guard.ts` (Chainlink uptime, 600s grace) → `arbitrum-gas-guard.ts` (oracle lag <30s / 30,000ms vs L2 headers) → `checkSoilResistance()` (depth, cross-spread, slippage fuse).
3. **Routing** — `gmx-v2-balancer.ts` qualifies underweight side (`isGmxBalancerQualified`); qualified flow builds unsigned payloads via `gmx-v2-order-payload.ts` with `uiFeeReceiver` + `referralCode` injection.
4. **Hedge leg** — `hl-auto-hedge.ts` / `gmx-cross-wallet-hedge.ts` execute session-key orders; cron drift gate = $10 (`scheduled-gmx-hedge.ts`).
5. **State** — `SystemState` SSOT, unidirectional updates; 2PC intent ledger persisted to KV (`core/intent-persistence`).

## 3. Defense Matrix (20-Root)

| Layer | Module | Behavior |
|-------|--------|----------|
| Sequencer Guard | `services/risk/sequencer-guard.ts` | Fail-closed on sequencer downtime + grace |
| Oracle Lag Shield | `services/risk/arbitrum-gas-guard.ts` | Halts dispatch on canonical lag breach |
| RPC Whitelist | `services/defense/rpc-whitelist.ts` | All external RPC monitored, >500ms latency trips |
| Root Protection | `services/rootProtectionService.ts` | Fatal error / R17·R20 breach kills hot-key pipelines |
| Dynamic Max SL | `services/effective-max-sl.ts` | `Balance × 1% + $100` — deprecated $50 fixed SL forbidden |
| Escalation Ladder | `services/risk/escalation-ladder.ts` | Pre-emptive de-lever; RED → panic flash unwind |

## 4. Monetization

Every unsigned GMX v2 increase/decrease/deposit payload injects `uiFeeReceiver` (SliverVine Treasury via `GMX_UI_FEE_RECEIVER`) with +5 bps UI fee accrual — protocol-native, no custody.

## 5. Public Audit Surface

`GET /api/grant-audit` on [bedeltawater.slivervine.xyz](https://bedeltawater.slivervine.xyz) — aggregated guard states, TVL, `provenanceVerified` live-trade artifact, `sepoliaDualLegProof`. No signing material, calldata templates, or proprietary encode paths in JSON responses.

---

## Related Documents

| Document | Purpose |
|----------|---------|
| [**docs/grant/**](./grant/) | **Primary SSOT** — GMX Builders & Arbitrum DAO grant applications |
| [ARCHITECTURE.md](./ARCHITECTURE.md) | KV key-prefix isolation · MDD guard scope · regression bar history |
| [GRANT_PROPOSAL.md](./GRANT_PROPOSAL.md) | M1–M3 scope · done / NOT-done criteria |
| [../DOCKER_README.md](../DOCKER_README.md) | B2B sidecar install |
