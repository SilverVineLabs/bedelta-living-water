# BeΔLivingWater SliverVine Protocol — GMX v2 / Arbitrum Citadel Pre-Execution Gateway

[![Vitest](https://img.shields.io/badge/Vitest-630%20PASS%20%28117%20files%29-brightgreen?logo=vitest)](https://github.com/SilverVineLabs/bedelta-living-water) [![risk-control.ts coverage](https://img.shields.io/badge/risk--control.ts-100%25%20coverage-success?logo=vitest)](https://github.com/SilverVineLabs/bedelta-living-water/blob/main/src/services/risk-control.ts) [![Chaos Matrix](https://img.shields.io/badge/Chaos%20Matrix-255%2F255%20Fail--Closed-blue?logo=github)](https://github.com/SilverVineLabs/bedelta-living-water) [![Telemetry](https://img.shields.io/badge/Telemetry-%2Fapi%2Fgrant--audit-blueviolet)](https://bedeltawater.slivervine.xyz/api/grant-audit) [![TypeScript](https://img.shields.io/badge/TypeScript-0%20errors-blue?logo=typescript)](https://github.com/SilverVineLabs/bedelta-living-water) [![License](https://img.shields.io/badge/License-BSL%201.1-orange)](LICENSE)

<p align="center"><img src="public/brand/Detox_Sanctuary_wm.webp" alt="SliverVine Citadel Gate - Detox Sanctuary" width="600" style="border-radius: 8px;"></p>

> **Off-Chain Zero-Trust Pre-Execution Safety Gateway & Dynamic Rebalancer for GMX v2 GM Pools on Arbitrum One.**  
> **Risk engine:** v0.8 Multi-Layer Risk Engine (internal code name: Santenmoku)

**Entity:** SilverVine Labs · **Contact:** `grants@silvervinelabs.com` · **B2B:** `hello@silvervinelabs.com`  
**Official Site:** [silvervinelabs.com](https://silvervinelabs.com) — Defense Matrix portal & landing page  
**Repo:** [SilverVineLabs/bedelta-living-water](https://github.com/SilverVineLabs/bedelta-living-water) · **Live DApp:** [bedeltawater.slivervine.xyz](https://bedeltawater.slivervine.xyz)  
**Architect:** qum0x (20+ Year Enterprise Web & Systems Architect) — All claims verifiable via CLI (`pnpm test`) and live JSON telemetry (`/api/grant-audit`).

**Regression bar:** **117 Test Files | 630 Vitest PASS (100% Clean)** · `npx tsc --noEmit` **CLEAN**

**Primary venue:** GMX v2 Arbitrum Citadel Gateway · Live Proof via `[/api/grant-audit](https://bedeltawater.slivervine.xyz/api/grant-audit)`


| Live Proof Telemetry                         | Value                                                                                                                                                                                                              |
| -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Live Execution Proof                         | **0.2223 ETH Short** (OID: `513344575969`) — Hyperliquid cross-venue hedge vs GMX GM Pool · machine-readable via `provenanceVerified` in `[/api/grant-audit](https://bedeltawater.slivervine.xyz/api/grant-audit)` |
| GMX GM ETH/USD Pool TVL                      | ~$802.43 USDC (489.716 GM · `0xc9Bd...546f`)                                                                                                                                                                       |
| HL Session Key Hedge Margin                  | ~$199.80 USDC                                                                                                                                                                                                      |
| Combined Monitored Citadel TVL               | ~$1,302.39 USDC                                                                                                                                                                                                    |
| Zero-Δ Dynamic Shield · MDD Guard            | **0.00% MDD** (90d window · ~$1.3k monitored Citadel TVL)                                                                                                                                                          |
| GMX Ecosystem Defenses                       | OI Imbalance Absorbed · Price Impact Rebate Optimizer (+0.02% Saved) · Canonical Oracle Lag Shield (<30s / 30,000ms FAIL-CLOSED) · Zero-429 SWR Storage Guard                                                      |
| Builder Monetization (`GMX_UI_FEE_RECEIVER`) | **Protocol-Standard Builder Fee Routing Configured (+5 bps)** on every unsigned GMX v2 payload via `uiFeeReceiver`                                                                                                 |


---



## Auditor — 30-Second CLI & API Verification

```bash
# 1. Install dependencies & run full Vitest suite
pnpm install
pnpm test    # 630 Vitest PASS (117 test files, 100% Clean)

# 2. Typecheck (0 errors)
pnpm typecheck

# 3. GMX v2 canonical order payload & DataStore view reader
npx tsx scripts/test-gmx-v2-execution.ts --live-read
# Optional: bypass 30s Oracle Lag fail-closed gate for dry-run payload inspection only
npx tsx scripts/test-gmx-v2-execution.ts --live-read --allow-stale-oracle

# 4. Live telemetry inspection
curl -s "https://bedeltawater.slivervine.xyz/api/grant-audit" | jq .arbitrumCitadel
```

---



## Testing / GMX Verification

```bash
npx tsx scripts/test-gmx-v2-execution.ts --help
npx tsx scripts/test-gmx-v2-execution.ts --live-read [--allow-stale-oracle]
```

Default execution enforces the strict **30s Oracle Lag fail-closed Citadel gate** (`ORACLE_LAG_DEADLOCK_MS = 30,000`). When Chainlink timestamp lag exceeds 30s vs L2 block headers, payload generation is blocked.

`--allow-stale-oracle` bypasses only the oracle lag deadlock filter for **dry-run / live-read payload inspection** (prints `[BYPASS_WARNING]`). Sequencer guard and gas surcharge checks remain armed. Use to verify `uiFeeReceiver` routing (e.g. `0xc9BddABD80982d2201376195DD9B85fb7951546f`) during elevated Chainlink lag — not for production broadcast.

---


| Module                        | Path                                            | Role                                                                                                                                                           |
| ----------------------------- | ----------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Sequencer Guard**           | `src/services/risk/sequencer-guard.ts`          | Chainlink Arbitrum One Sequencer Uptime Feed (`0xFdB631F5EE196F0ed6FAa767959853A9F217697D`) · 600s grace · zero-trust fail-closed                              |
| **Oracle Lag Shield**         | `src/services/risk/arbitrum-gas-guard.ts`       | Halts dispatch when Chainlink timestamp lag exceeds **30s** vs L2 block headers (fail-closed)                                                                  |
| **GMX Balancer Engine**       | `src/services/yield/gmx-v2-balancer.ts`         | Pre-trade underweight-side qualification · `isGmxBalancerQualified` · `expectedPriceImpactRebateBps` — canonical reward eligibility determined on-chain by GMX |
| **Price-Impact Gate**         | `src/services/yield/gmx-v2-price-impact.ts`     | `estimatePreliminaryImpact()` · subsidy vs penalty bps · soil trip on >50 bps penalty                                                                          |
| **Canonical Payload Builder** | `src/services/adapters/gmx-v2-order-payload.ts` | GMX v2 `CreateOrderParams` alignment — `orderType`, `minOutputAmount`, `initialCollateralDeltaAmount`, `callbackGasLimit`, dynamic `executionFeeWei`           |
| **GMX v2 Adapter**            | `src/services/adapters/gmx-v2-adapter.ts`       | DataStore read-path · unsigned hedge order assembly                                                                                                            |
| **Grant Audit**               | `src/routes/grant-audit.ts`                     | Live Zero-Trust JSON — Balancer + Citadel metrics · `<50ms` serialize                                                                                          |


**Builder monetization:** every unsigned increase/decrease/deposit payload injects `uiFeeReceiver` (SliverVine Treasury via `GMX_UI_FEE_RECEIVER`) with **Protocol-Standard Builder Fee Routing Configured (+5 bps)**, plus configurable `referralCode`.

**Fail-closed posture:** **500ms** Decision SLO applies to local Sidecar RTT; on-chain RPC network timeout enforced at **3000ms** fail-closed · Two-Phase Saga compensation · Dynamic Max SL = `Account Balance × 1% + $100`. Emergency Liquidity Sponge (`cross-venue-fail-safe.ts`) is a **routing policy** for HL L2 hedge fallback — not an on-chain fuse.

**Zero migration tax:** mount `@SagaProtected` or `silvervine-proxy` at `localhost:8080` — existing Python/TS alpha unchanged.

```bash
docker build -t silvervine-sidecar -f docker/Dockerfile.sidecar . && docker run -d -p 8080:8080 --name sv-sidecar silvervine-sidecar
curl -s localhost:8080/health | jq .sidecar && curl -s -o /dev/null -w "intent HTTP %{http_code}\n" -X POST localhost:8080/v1/intent -H 'Content-Type: application/json' -d '{"symbol":"ETH"}'
```

Full sidecar testlist: **[DOCKER_README.md](./DOCKER_README.md)**.

**CCXT-standard roadmap:** Phase 1 exposes `fetchTicker` · `createOrder` · `fetchPositions` over GMX v2 + HL hedge; M2 ships a CCXT-compatible adapter behind the same Citadel fail-closed gate. See [docs/GRANT_PROPOSAL.md](./docs/GRANT_PROPOSAL.md) §3.

---



## B2B Infrastructure

Institutional funds and market makers deploy the **SliverVine Citadel Telemetry Sidecar** as a local zero-GC relay with 500ms fail-closed SLO alignment.


| Resource                                   | Purpose                                                                                                       |
| ------------------------------------------ | ------------------------------------------------------------------------------------------------------------- |
| **[DOCKER_README.md](./DOCKER_README.md)** | Complete sidecar install guide — Docker + native Node (no Docker) · verification · B2B circuit breaker wiring |
| `docker/Dockerfile.sidecar`                | Production sidecar image build                                                                                |
| `docker/sidecar-daemon.mjs`                | Native Node daemon (Edge-safe `.mjs`, no TS runtime)                                                          |


---



## Documentation


| Document                                                               | Purpose                                              |
| ---------------------------------------------------------------------- | ---------------------------------------------------- |
| [docs/grant/GMX_BUILDERS_PITCH.md](./docs/grant/GMX_BUILDERS_PITCH.md) | GMX Builders Program application & Telegram outreach |
| [docs/ARBITRUM_ONE_PAGER.md](./docs/ARBITRUM_ONE_PAGER.md)             | Arbitrum Citadel technical one-pager                 |
| [docs/GRANT_PROPOSAL.md](./docs/GRANT_PROPOSAL.md)                     | Full scope & strategic roadmap                       |
| [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md)                         | Dual-engine topology · SRP (<200 LOC per file)       |


---



## v0.9 Roadmap (Planned — Out of Current v0.8 Scope)

- **ZeroDev AA (ERC-4337)** integration on Arbitrum — gas sponsorship & paymaster onboarding for institutional session-key flows
- Distinct from v0.8 Citadel fail-closed gateway; no change to current pre-execution guard SSOT until v0.9 ships



## V1.0 Strategic Roadmap & Planned Pillars (Out of Current Scope)

 V0.9 establishes the foundational risk engine and ZeroDev AA adapters for Grant submissions. The following expansion pillars and side products are in active planning for V1.0:

### Pillar 1 — ZeroDev AA & Multi-Chain Kernel Account

- in v0.9 (Kernel v0.3.1 / EntryPoint v0.7 with ZeroDev AA Paymaster gas sponsorship).
- Full institutional Session Key scoped permissions and policy validators targeted for v1.0.



### Pillar 2 — Robinhood Chain Idle Yield Router (RWA Refraction Engine)

- **RWA Asset Bridge & Arbitrage Engine**: Extends vault adapter interfaces to support Robinhood Chain (chain `46630`, contracts pre-delivered).
- **Across Protocol Routing**: Automatically routes idle Treasury and RWA assets (US Treasury Bills, Gold RWA) from Robinhood Chain via Across Protocol directly to Arbitrum One.
- **Asymmetric Yield Capture**: Deploys bridged RWA liquidity into Arbitrum GM pools for asymmetric yield optimization without manual intervention.



### Pillar 3 — Agent-Gate Pre-Execution Safety Core (AI Agent Armor)

- **AI Agent Pre-Execution Shield**: Built using ZeroDev Kernel v3 Session Keys and custom on-chain plugins to provide pre-execution level fail-closed protection for autonomous AI Agents.
- **RPC & Front-Running Defense**: Enforces strict local validation gates (`checkSoilResistance`) prior to signing, preventing AI Agent smart accounts from getting stuck in lagging RPC nodes or drained by hostile sandwich attacks on-chain."



## Future Roadmap

### SilverVine Pre-Execution Gate: Seamless Alignment with Arbitrum Hybrid ZK-BoLD Infrastructure

As Arbitrum One advances toward **Hybrid ZK-BoLD** settlement — combining optional ZK proofs, Fast Confirmation Committee attestations, and permissionless BoLD optimistic fallback — SliverVine's Citadel pre-execution gateway is being extended to align with this multi-prover security model **before** any GMX v2 payload is signed or broadcast.

- **Settlement-Aware Gate:** Extend the existing fail-closed Citadel pipeline (`sequencer-guard` → `arbitrum-gas-guard` → `checkSoilResistance()`) with ZK-BoLD assertion-state awareness, deferring high-value payloads until L2 state assertions reach the required confirmation tier (fast ZK + committee path vs. standard BoLD challenge window).
- **Multi-Prover Defense Parity:** Mirror Arbitrum's hybrid posture at the application layer — pre-execution safety does not depend on a single proof system; the gate fails closed on ambiguous or unconfirmed assertion epochs rather than trusting soft-finality RPC reads.
- **Oracle & Sequencer Hardening:** Reuse the canonical 30s Oracle Lag Shield and Chainlink Sequencer Uptime feed as first-layer guards, with BoLD Delay Buffer semantics informing dispatch hold windows during parent-chain censorship or dispute escalation events.
- **Zero Migration Tax:** Institutional sidecars (`silvervine-proxy` / `@SagaProtected`) inherit alignment transparently — no change to upstream alpha logic; only the Citadel gate SSOT gains BoLD epoch hooks.

**Status:** Planned — out of current v0.8 Santenmoku scope. Complements v0.9 (ZeroDev AA) and V1.0 strategic pillars without altering live pre-execution behavior until shipped.

---



## License

**BUSL-1.1** — converts to Apache-2.0 at M2 / $10M TVL or 24 months. Grant evaluators retain full code review and testing rights. See [LICENSE](./LICENSE).