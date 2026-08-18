# SliverVine Protocol — GMX v2 / Arbitrum Citadel Pre-Execution Gateway

[![Grant Audit](https://img.shields.io/badge/Grant_Audit-Passed-0052FF.svg)](https://bedeltawater.slivervine.xyz/api/grant-audit)
[![Vitest](https://img.shields.io/badge/Vitest-630%2F630_PASS_(117_test_files)-brightgreen.svg)](https://github.com/SilverVineLabs/bedelta-living-water)
[![TypeScript](https://img.shields.io/badge/TypeScript-Strict_0_Errors-blue.svg)](https://github.com/SilverVineLabs/bedelta-living-water)
[![License](https://img.shields.io/badge/License-BUSL--1.1-orange.svg)](LICENSE)

<p align="center"><img src="public/brand/Detox_Sanctuary_wm.webp" alt="SliverVine Citadel Gate - Detox Sanctuary" width="600" style="border-radius: 8px;"></p>

> **Off-Chain Zero-Trust Pre-Execution Safety Gateway & Dynamic Rebalancer for GMX v2 GM Pools on Arbitrum One.**  
> **Risk engine:** v0.8 Multi-Layer Risk Engine (internal code name: Santenmoku)

**Entity:** SilverVine Labs · **Contact:** `grants@silvervinelabs.com` · **B2B:** `hello@silvervinelabs.com`  
**Official Site:** [silvervinelabs.com](https://silvervinelabs.com) — Defense Matrix portal & landing page  
**Repo:** [SilverVineLabs/bedelta-living-water](https://github.com/SilverVineLabs/bedelta-living-water) · **Live DApp:** [bedeltawater.slivervine.xyz](https://bedeltawater.slivervine.xyz)  
**Architect:** qum0x (20+ Year Enterprise Web & Systems Architect) — All claims verifiable via CLI (`pnpm test`) and live JSON telemetry (`/api/grant-audit`).

**Regression bar:** **117 Test Files | 630 Vitest PASS (100% Clean)** · **`npx tsc --noEmit` CLEAN**

**Primary venue:** GMX v2 Arbitrum Citadel Gateway · Live Proof via [`/api/grant-audit`](https://bedeltawater.slivervine.xyz/api/grant-audit)

| Live Proof Telemetry | Value |
|----------------------|-------|
| Live Execution Proof | **0.2223 ETH Short** (OID: `513344575969`) — Hyperliquid cross-venue hedge vs GMX GM Pool · machine-readable via `provenanceVerified` in [`/api/grant-audit`](https://bedeltawater.slivervine.xyz/api/grant-audit) |
| GMX GM ETH/USD Pool TVL | ~$802.43 USDC (489.716 GM · `0xc9Bd...546f`) |
| HL Session Key Hedge Margin | ~$199.80 USDC |
| Combined Monitored Citadel TVL | ~$1,302.39 USDC |
| Zero-Δ Dynamic Shield · MDD Guard | **0.00% MDD** (90d window · ~$1.3k monitored Citadel TVL) |
| GMX Ecosystem Defenses | OI Imbalance Absorbed · Price Impact Rebate Optimizer (+0.02% Saved) · Canonical Oracle Lag Shield (dynamic runtime threshold · machine-readable via `/api/grant-audit`) · Zero-429 SWR Storage Guard |
| Builder Monetization (`GMX_UI_FEE_RECEIVER`) | **Protocol-Standard Builder Fee Routing Configured (+5 bps)** on every unsigned GMX v2 payload via `uiFeeReceiver` |

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
# Optional: bypass Oracle Lag fail-closed gate for dry-run payload inspection only
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

Default execution enforces the strict **Oracle Lag fail-closed Citadel gate** (dynamic runtime threshold — machine-readable via [`/api/grant-audit`](https://bedeltawater.slivervine.xyz/api/grant-audit)). When canonical oracle timestamp lag exceeds the active tolerance band vs L2 block headers, payload generation is blocked.

`--allow-stale-oracle` bypasses only the oracle lag deadlock filter for **dry-run / live-read payload inspection** (prints `[BYPASS_WARNING]`). Sequencer guard and gas surcharge checks remain armed. Use to verify `uiFeeReceiver` routing (e.g. `0xc9BddABD80982d2201376195DD9B85fb7951546f`) during elevated Chainlink lag — not for production broadcast.

---

| Module | Path | Role |
|--------|------|------|
| **Sequencer Guard** | `src/services/risk/sequencer-guard.ts` | Chainlink Arbitrum One Sequencer Uptime Feed · dynamic grace window · zero-trust fail-closed |
| **Oracle Lag Shield** | `src/services/risk/arbitrum-gas-guard.ts` | Halts dispatch when canonical oracle lag exceeds dynamic runtime threshold vs L2 block headers (fail-closed · machine-readable via `/api/grant-audit`) |
| **GMX Balancer Engine** | `src/services/yield/gmx-v2-balancer.ts` | Pre-trade underweight-side qualification · `isGmxBalancerQualified` · `expectedPriceImpactRebateBps` — canonical reward eligibility determined on-chain by GMX |
| **Price-Impact Gate** | `src/services/yield/gmx-v2-price-impact.ts` | `estimatePreliminaryImpact()` · subsidy vs penalty bps · soil trip on penalty exceeding dynamic runtime fuse (machine-readable via `/api/grant-audit`) |
| **Canonical Payload Builder** | `src/services/adapters/gmx-v2-order-payload.ts` | GMX v2 `CreateOrderParams` alignment — `orderType`, `minOutputAmount`, `initialCollateralDeltaAmount`, `callbackGasLimit`, dynamic `executionFeeWei` |
| **GMX v2 Adapter** | `src/services/adapters/gmx-v2-adapter.ts` | DataStore read-path · unsigned hedge order assembly |
| **Grant Audit** | `src/routes/grant-audit.ts` | Live Zero-Trust JSON — Balancer + Citadel metrics · `<50ms` serialize |

**Builder monetization:** every unsigned increase/decrease/deposit payload injects **`uiFeeReceiver`** (SliverVine Treasury via `GMX_UI_FEE_RECEIVER`) with **Protocol-Standard Builder Fee Routing Configured (+5 bps)**, plus configurable **`referralCode`**.

**Fail-closed posture:** Decision SLO and on-chain RPC network timeout are **dynamic runtime thresholds** (machine-readable via [`/api/grant-audit`](https://bedeltawater.slivervine.xyz/api/grant-audit)) · Two-Phase Saga compensation · Dynamic Max SL = `Account Balance × 1% + $100`. Emergency Liquidity Sponge (`cross-venue-fail-safe.ts`) is a **routing policy** for HL L2 hedge fallback — not an on-chain fuse.

---

## Tri-Sensor Telemetry Matrix (Control Loop Architecture)

The Citadel pre-execution gateway runs a closed-loop **Tri-Sensor Telemetry Matrix** before any GMX broadcast. Three orthogonal observability channels feed a fused control decision — **no static weight constants** ($w_1$, $w_2$, $\lambda$) are published in open documentation.

| Sensor Channel | Observability Domain | Control Action |
|----------------|---------------------|----------------|
| **BaseFee Velocity Sensor** | ArbOS EIP-1559 base-fee acceleration / deceleration as congestion stress proxy | Throttle dispatch when fee velocity exceeds dynamic tolerance band |
| **RPC Jitter Radar** | Multi-provider RTT dispersion and head-staleness across whitelisted endpoints | Fail-closed when jitter radar flags endpoint phase desync |
| **Phase-Shift Instability Detector** | Cross-venue oracle / book phase alignment (HL ↔ dYdX ↔ GMX) | Invoke instant circuit breaker on cross-sensor phase-shift anomaly |

Fused sensor deviations exceeding **dynamic runtime tolerance bands** trigger fail-closed interlock. Live threshold envelopes, guard states, and benchmark latencies are machine-readable via `GET /api/grant-audit` — empirical constants remain in compiled Worker bindings and environment secrets only.

**Zero migration tax:** mount `@SagaProtected` or `silvervine-proxy` at `localhost:8080` — existing Python/TS alpha unchanged.

```bash
docker build -t silvervine-sidecar -f docker/Dockerfile.sidecar . && docker run -d -p 8080:8080 --name sv-sidecar silvervine-sidecar
curl -s localhost:8080/health | jq .sidecar && curl -s -o /dev/null -w "intent HTTP %{http_code}\n" -X POST localhost:8080/v1/intent -H 'Content-Type: application/json' -d '{"symbol":"ETH"}'
```

Full sidecar testlist: **[DOCKER_README.md](./DOCKER_README.md)**.

**CCXT-standard roadmap:** Phase 1 exposes `fetchTicker` · `createOrder` · `fetchPositions` over GMX v2 + HL hedge; M2 ships a CCXT-compatible adapter behind the same Citadel fail-closed gate. See [docs/GRANT_PROPOSAL.md](./docs/GRANT_PROPOSAL.md) §3.

---

## B2B Infrastructure

Institutional funds and market makers deploy the **SliverVine Citadel Telemetry Sidecar** as a local zero-GC relay with fail-closed SLO alignment (dynamic runtime threshold · machine-readable via `/api/grant-audit`).

| Resource | Purpose |
|----------|---------|
| **[DOCKER_README.md](./DOCKER_README.md)** | Complete sidecar install guide — Docker + native Node (no Docker) · verification · B2B circuit breaker wiring |
| `docker/Dockerfile.sidecar` | Production sidecar image build |
| `docker/sidecar-daemon.mjs` | Native Node daemon (Edge-safe `.mjs`, no TS runtime) |

---

## Documentation

| Document | Purpose |
|----------|---------|
| [docs/grant/GMX_BUILDERS_PITCH.md](./docs/grant/GMX_BUILDERS_PITCH.md) | GMX Builders Program application & Telegram outreach |
| [docs/ARBITRUM_ONE_PAGER.md](./docs/ARBITRUM_ONE_PAGER.md) | Arbitrum Citadel technical one-pager |
| [docs/GRANT_PROPOSAL.md](./docs/GRANT_PROPOSAL.md) | Full scope & strategic roadmap |
| [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md) | Dual-engine topology · SRP (<200 LOC per file) |

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

---

## License

**BUSL-1.1** — converts to Apache-2.0 at M2 / $10M TVL or 24 months. Grant evaluators retain full code review and testing rights. See [LICENSE](./LICENSE).
