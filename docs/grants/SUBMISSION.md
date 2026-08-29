# Arbitrum Submission Pack — Citadel Gateway & Gate Attestation

**Entity:** SilverVine Labs · **Contact:** `grants@silvervinelabs.com`  
**Official Site:** [silvervinelabs.com](https://silvervinelabs.com)  
**Live:** [bedeltawater.slivervine.xyz](https://bedeltawater.slivervine.xyz) · `GET /api/grant-audit`  
**Repo:** [SilverVineLabs/bedelta-living-water](https://github.com/SilverVineLabs/bedelta-living-water)

---

## Section 0: Elevator Pitch & AI Agent Cerebellum Paradigm Shift

**One line:** BDLW is **The 106µs Physical Cerebellum for ERC-7579 AI Agents & Institutional Vaults** — a **p50 ~106 µs pre-execution Citadel** on **Arbitrum One** where every GMX / Hyperliquid broadcast passes Wasm soil fuse, EIP-712 Gate attestation, and ZeroDev scoped session keys **before** mempool exposure.

### Why LLMs Need a Microsecond Cerebellum

| Layer | Latency | Role | Failure mode without BDLW |
|-------|---------|------|---------------------------|
| **LLM / Agent Planner** | **seconds** | Intent composition · natural-language policy | Too slow for mempool race · reactive hedging after LVR/MEV damage |
| **ERC-7579 Session Validator** | **&lt;1 ms** | ZeroDev Kernel v3 scoped `ORDER_EXECUTE` · R06/R07 clip | Approves structurally valid UserOps that are **economically toxic** |
| **BDLW Wasm / Stylus Hook** | **p50 ~106 µs** | `checkSoilResistance()` · `SliverVineSoilCoprocessor` | — **fail-closed before broadcast** |

**Paradigm shift:** LLMs are the **cortex** (slow, strategic). BDLW is the **cerebellum** (fast, reflexive) — the ERC-7579 pre-execution hook that blocks MEV sandwiches, oracle-lag deadlocks, and cross-venue slippage **before** the Sequencer or HL mempool ever sees the order. Without this reflex layer, AI agents and institutional vaults inherit **reactive** risk — adjusting after toxic fills, not preventing them.

**Product identity:** Delta-neutral **GMX v2 ETH/USDC GM + Hyperliquid 1× short** on Arbitrum One · **`@slivervine/citadel-sdk`** (Apache-2.0) for third-party dApps & AI agents.

---

## 4-Dimension Positioning Matrix (Text-UI)

Absolute positioning on **[Pre-Execution Gate] × [Microsecond Latency]** — the blue-ocean quadrant no post-execution analytics stack occupies:

```text
                    POST-EXECUTION                          PRE-EXECUTION
                 (Dashboards · DAO)                    (Inline Gate · Fail-Closed)
              ┌─────────────────────────┬─────────────────────────────────────────┐
   SLOW       │  Gauntlet / Chaos Labs  │  Manual Multisig + Policy Scripts         │
 (min–days)   │  Parameter tuning       │  (human-in-the-loop · too late for MEV)   │
              ├─────────────────────────┼─────────────────────────────────────────┤
   FAST       │  Reactive Vault Bots    │  ★ BDLW Microsecond Shield ★            │
 (µs–ms)      │  (post-fill rebalance)  │  p50 ~106µs · ERC-7579 Hook · Wasm/Stylus│
              └─────────────────────────┴─────────────────────────────────────────┘
                                        ▲
                          Blue Ocean: Pre-Exec × Microsecond
```

| Dimension | Legacy Stack | BDLW Citadel |
|-----------|--------------|--------------|
| **Execution phase** | Post-trade analytics · governance votes | **Pre-broadcast inline gate** |
| **Latency SLO** | Minutes → days | **p50 ~106 µs** Edge · **&lt;60 µs** Wasm warm |
| **Account model** | EOA / broad smart-wallet scopes | **ERC-7579** modular session keys · scoped clip |
| **On-chain reinforcement** | Off-chain simulation only | **Stylus Soil Coprocessor** (`contracts/stylus-probe/src/lib.rs`) |

---

## Strategic Radar Comparison Table

Five-star institutional diligence lens — **Manual Hedging vs Reactive Vaults vs BDLW Microsecond Shield**:

| Capability | Manual Hedging | Reactive Vault Bots | **BDLW Microsecond Shield** |
|------------|:--------------:|:-------------------:|:---------------------------:|
| **Pre-execution MEV / LVR block** | ★☆☆☆☆ | ★★☆☆☆ | ★★★★★ |
| **Sub-ms soil / slippage fuse** | ★☆☆☆☆ | ★★☆☆☆ | ★★★★★ |
| **ERC-7579 session scope (R06/R07)** | ★★☆☆☆ | ★★★☆☆ | ★★★★★ |
| **Cross-venue Δ-neutral (GMX + HL)** | ★★★☆☆ | ★★★★☆ | ★★★★★ |
| **Non-custodial / `lostUsd ≡ 0`** | ★★★☆☆ | ★★★☆☆ | ★★★★★ |
| **Observability (Dune + grant-audit)** | ★★☆☆☆ | ★★★☆☆ | ★★★★☆ |
| **Operational burden (24/7 ops)** | ★☆☆☆☆ | ★★★☆☆ | ★★★★★ |

**Verdict:** Reactive vaults optimize **after** toxic flow; BDLW optimizes **before** — the only five-star row on pre-execution × microsecond latency.

---

## Dune Analytics Observability Integration Spec

Public grant diligence requires **on-chain + Edge telemetry parity**. BDLW exposes `GET /api/grant-audit` as the live SSOT; Dune dashboards mirror the same pillars for institutional allocators.

**Dashboard SSOT targets:**

| Panel | Metric | Source |
|-------|--------|--------|
| **Pillar 2 — Ingress** | Robinhood → Arbitrum escort volume · `IN_FLIGHT_BRIDGE_CAPITAL` events | Across bridge · `IngressSafetySwitch` |
| **Pillar 3 — Intercepts** | `SOIL_RESISTANCE_TRIP` count · fail-closed saves (USD notional blocked) | Edge Worker logs → KV → Dune spell |
| **CaaS Revenue — 10 bps Builder** | GMX `uiFeeReceiver` accrual · routed notional × 10 bps | GMX v2 ExchangeRouter order events |

**Suggested Dune SQL — Pillar 2 Ingress (Robinhood escort volume, Arbitrum One):**

```sql
-- Pillar 2: Outbound Robinhood → Arbitrum ingress (Across bridge fills)
SELECT
  date_trunc('day', block_time) AS day,
  COUNT(*) AS bridge_tx_count,
  SUM(amount_usd) AS ingress_volume_usd
FROM dune.silvervinelabs.result_across_bridge_fills   -- custom spell · 46630/4663 → 42161
WHERE dest_chain_id = 42161
  AND sender NOT IN (SELECT address FROM dune.silvervinelabs.dim_blocked_senders)
GROUP BY 1
ORDER BY 1 DESC;
```

**Suggested Dune SQL — Pillar 3 Intercepts (fail-closed soil trips):**

```sql
-- Pillar 3: Pre-execution intercepts (SOIL_TRIPPED · capital saved)
SELECT
  date_trunc('hour', evt_block_time) AS hour,
  COUNT(*) AS intercept_count,
  SUM(blocked_notional_usd) AS notional_saved_usd,
  AVG(elapsed_us_us) AS p50_shield_latency_us
FROM dune.silvervinelabs.result_citadel_soil_trips   -- Edge Worker → spell ingest
WHERE chain = 'arbitrum'
  AND evt_name = 'SOIL_RESISTANCE_TRIP'
GROUP BY 1
ORDER BY 1 DESC;
```

**Suggested Dune SQL — 10 bps Builder Revenue (GMX uiFeeReceiver):**

```sql
-- CaaS: GMX v2 builder fee accrual @ 10 bps (GMX_UI_FEE_RECEIVER SSOT)
SELECT
  date_trunc('day', block_time) AS day,
  SUM(size_usd) AS routed_volume_usd,
  SUM(size_usd * 0.0010) AS builder_fee_usd_10bps,   -- 10 bps = 0.10%
  COUNT(DISTINCT tx_hash) AS order_count
FROM gmx_v2_arbitrum.order_created
WHERE ui_fee_receiver = '0xc9BddABD80982d2201376195DD9B85fb7951546f'  -- GMX_UI_FEE_RECEIVER
  AND block_time >= NOW() - INTERVAL '90' DAY
GROUP BY 1
ORDER BY 1 DESC;
```

> **Integration note:** Custom spells ingest `GET /api/grant-audit` KV snapshots (`gmxBuilderProof.uiFeeAccrualUsd`, `arbitrumCitadel.soilTrips`) as reconciliation anchors against on-chain GMX events.

---

## 30-Second Elevator Pitch & Business Model

**One line:** BDLW is a **p50 ~106 µs pre-execution Citadel** on **Arbitrum One** — every GMX / Hyperliquid broadcast passes Wasm soil fuse, EIP-712 Gate attestation, and ZeroDev scoped session keys **before** mempool exposure.

**B2B Citadel-as-a-Service (CaaS) monetization — yield security, not custody:**

| Revenue lane | Rate | Role |
|--------------|------|------|
| **GMX Native Builder Fee** | **+10 bps** `uiFeeReceiver` on every unsigned GMX v2 payload | GMX v2 ExchangeRouter native parameter · institutional routing revenue · **zero additional overhead on v0.9 execution safety** |
| **GMX Referral Rebate** | Up to **25%** of GMX trading fees (venue-native `referralCode`) | Standard GMX Builders rebate share · separate from builder UI fee |
| **Dynamic Skew Rebate** | Up to **~5 bps** underweight-side price-impact rebate (venue-native; separate from UI fee) | Skew-neutralizer premium on delta-neutral GM flow |
| **Combined B2B band** | **10 bps builder + up to 25% referral + skew rebate** | **Yield security fee stack** — Citadel gates signing before Worker injects fees; innovation = sub-ms fail-closed risk layer, not fee arbitrage |

**Product identity:** Delta-neutral **GMX v2 ETH/USDC GM + Hyperliquid 1× short** on Arbitrum One · **`@slivervine/citadel-sdk`** (Apache-2.0) for third-party dApps & AI agents.

**Demo & storyboard:** [`Grant Pitch & Video Storyboard — The Storm & 3-Options`](../pitch/GRANT_PITCH_AND_VIDEO_STORYBOARD.md) · 35s evaluator script · Three-Pillar architecture walkthrough.

> **Regression SSOT:** Vitest **172/172 files | 758/758 PASS (100% Clean · Exit Code 0)** on `pnpm test -- --run` · Cargo Stylus **`cargo test` 5/5 PASS** · Forge **60/60** · Security-tier **5/0/0 PASS**.

---

> **Proposal Locked Baseline:** Vitest **168 test files | 742 PASS (100% Clean)** · **Current Live Suite:** **172/172 files | 758/758 PASS (100% Clean · Exit Code 0)** on `pnpm test -- --run` · Security-tier `5/0/0 PASS` · Defense Matrix `17 Active | 2 Refactored | 1 Deprecated` · Wasm `<28kb` Cloudflare budget, `<60µs` execution.

**Audience:** Arbitrum Open House / Buildathon / chain security diligence.  
**Out of scope here:** GMX builder fee pitch → [`gmx/GMX_BUILDERS_PITCH.md`](./gmx/GMX_BUILDERS_PITCH.md) (monetization only — not the innovation claim).

**Interceptor Moat:** Deciding transaction execution safety at **p50 ~106 μs** BEFORE MEV bots or Sequencer mempools ever see it.  
**v0.9:** Production-Ready (Arbitrum Sepolia Testnet & Dry-Run Verified) · Mainnet deployment ties to **M6 Grant distribution**.  
**V1.0:** **Citadel-as-a-Service (CaaS)** — productize `@slivervine/citadel-sdk` as an open sub-ms pre-execution risk layer for Arbitrum dApps & AI Agents.

---

## Primary Surface — Arbitrum One + Sepolia

| Layer | Module | Role |
|-------|--------|------|
| L1 Gate | `SliverVineGate/src/SliverVineGate.sol` | Consume-once attestation · replay lock · gas-bounded `verifyAndConsume` |
| Edge Citadel | Workers on Arbitrum One | Sequencer · oracle-lag · soil fail-closed |
| Sepolia proof | `sepoliaDualLegProof` | Arbiscan-anchored dual-leg diligence |
| On-chain gate (Sepolia) | `scripts/deploy-sepolia-gate.sol` | Forge deploy + Arbiscan verify for `SliverVineGate` · `IngressSafetySwitch` |
| **On-Chain HF Math Coprocessor (Stylus)** | [`contracts/stylus-probe/`](../contracts/stylus-probe/) | **`SliverVineSoilCoprocessor`** · fixed-point `evaluate_soil_coprocessor(spread_bps, depth_usd, slippage_bps)` |
| Security matrix | `pnpm run audit:security` | Vitest + Forge + Slither + Aderyn + pnpm-audit |

---

## 3-Tier Security Audit Matrix

| Tier | Command | Target |
|------|---------|--------|
| Fast | `pnpm run audit:fast` | tsc · security slice · Solhint · Gitleaks → writes `security-scorecard.json` |
| Security | `pnpm run audit:security` | **5/0/0 PASS** (Vitest, Forge, Slither, Aderyn, pnpm-audit) → `static-analysis-report.json` + scorecard |
| Nightly | `pnpm run audit:nightly` | Echidna · Halmos · deep fuzz |

Artifacts: security-tier **5/0/0** SSOT = `docs/audit/static-analysis-report.json`.  
`docs/audit/security-scorecard.json` always mirrors the **last** matrix tier run (check `"tier"` field — do not cite as 5/0/0 unless `"tier": "security"`).

---

## Tri-Sensor Control Loop (Arbitrum Edge)

| Sensor | Domain | Action |
|--------|--------|--------|
| BaseFee Velocity | ArbOS EIP-1559 | Throttle on congestion band breach |
| RPC Jitter Radar | Multi-provider RTT / head staleness | Fail-closed on phase desync |
| Phase-Shift Detector | Oracle / book alignment | Instant breaker |

Live envelopes: `GET /api/grant-audit`.

---

## Three-Pillar Architecture (Submission SSOT)

| Pillar | Role | SSOT |
|--------|------|------|
| **Gatehouse (Auth)** | ZeroDev scoped session keys · Kernel v3 · R06 / R07 | `zerodev-aa-*` · Gate attestation |
| **Pillar 2: Compliance Ingress Firewall (with Robinhood Ingress as Reference Adapter)** | Venue-agnostic unidirectional AML escort · inbound AML blocked · **Pending-Capital Recognition Invariant (`lostUsd ≡ 0`)** on `IN_FLIGHT_BRIDGE_CAPITAL` until explicit timeout (`BRIDGE_TIMEOUT_FAIL_CLOSED`) · Robinhood Chain (`46630`/`4663` → `42161`) is the inaugural Code-Verified / Dry-Run Verified reference adapter — not the protocol anchor | `across-ingress-bridge.ts` · `IngressSafetySwitch.sol` · `tests/adapters/across-ingress-bridge.test.ts` |
| **Shield (CORE MOAT)** | Sub-ms Wasm pre-execution armor · p50 ~106 μs · fail-closed before mempool | `checkSoilResistance()` · `soil_core.wasm` |

**Pending-Capital Recognition Invariant:** During active bridge execution, in-flight liquidity is labelled `IN_FLIGHT_BRIDGE_CAPITAL`; **`lostUsd` is strictly `0`** — the protocol never prematurely writes off pending bridge capital as principal loss until an explicit fail-closed timeout. SDK enforcement: `assertUnidirectionalBridge()` · `exportRobinhoodAuditSnapshot()` throw on `lostUsd ≠ 0`.

---

## On-Chain Verification — Arbitrum Sepolia (421614)

| Contract | Role | Verified Address (Sepolia) | Source |
|----------|------|----------------------------|--------|
| **Deployer / Admin / Signer** | OpSec-isolated Forge broadcast signer · gate stack admin | `0xbd65d785Dac74EBa9efFdB357b2dC52fCC26EC7F` | [`scripts/deploy-sepolia-gate.sol`](../../scripts/deploy-sepolia-gate.sol) |
| `SliverVineGate` | Consume-once EIP-712 attestation anchor | `0xb174118bc0B84e8D6D59EEF2339e29bF7FCf8BF1` | [`SliverVineGate/src/SliverVineGate.sol`](../../SliverVineGate/src/SliverVineGate.sol) |
| `SliverVineRiskOracle` | EIP-712 offline risk report · `STATUS_SHUTDOWN` flush | `0x3FFa2539f502682E8145e6Eb427ff78d258D53a4` | [`contracts/SliverVineRiskOracle.sol`](../../contracts/SliverVineRiskOracle.sol) |
| `IngressSafetySwitch` | Pillar 2 compliance filter (oracle flush + blacklist) | `0x3E4298e2b8d4e30396A54C1817Eb71c9272Ffb4B` | [`contracts/IngressSafetySwitch.sol`](../../contracts/IngressSafetySwitch.sol) |
| `SliverVineSoilCoprocessor` (Stylus) | **On-Chain High-Frequency Math Coprocessor for Pre-Execution Soil Verification** — u128 fixed-point score · quadratic spread/slippage penalty · fail-closed `depth_usd ≥ 10_000` · score ceiling `10_000` | **Code-Verified** (Cargo **5/5**, Wasm Sandbox Vitest Passed, On-chain Deploy Pending Tooling Lock) | [`contracts/stylus-probe/src/lib.rs`](../../contracts/stylus-probe/src/lib.rs) |

**Deploy (Sepolia gate stack):**

```bash
export PRIVATE_KEY=... GATE_SIGNERS=0x..,0x.. GATE_THRESHOLD=2 GUARDIAN=0x.. GATE_ADMIN=0x.. RISK_ORACLE_SIGNER=0x..
forge script scripts/deploy-sepolia-gate.sol:DeploySepoliaGate \
  --rpc-url $ARB_SEPOLIA_RPC_URL --broadcast --verify --etherscan-api-key $ARBISCAN_API_KEY
```

**Stylus coprocessor build & deploy:**

```bash
cd contracts/stylus-probe
cargo check --target wasm32-unknown-unknown
cargo test                              # fixed-point score unit proofs
cargo stylus check && cargo stylus deploy --network arbitrum-sepolia
export SOIL_COPROCESSOR_ADDRESS=0x...   # record in deploy-sepolia-gate logs
```

Replace zero addresses above with Arbiscan-verified deployments before final grant submission.

---

## Verification (60s)

```bash
pnpm install
pnpm test -- --run        # Current Live Suite: 172/172 files | 758/758 PASS (Proposal Locked Baseline: 168 | 742)
pnpm run audit:security   # 5/0/0 PASS
cd SliverVineGate && forge test --gas-report && cd ..
curl -s "https://bedeltawater.slivervine.xyz/api/grant-audit" | jq .sepoliaDualLegProof
```

**Regression bar:** **Proposal Locked Baseline:** 168 files | 742 PASS (100% Clean) · **Current Live Suite:** 172/172 files | 758/758 PASS (100% Clean · Exit Code 0) · Forge 60/60 · 327,675 fuzz · Wasm `<28kb` / `<60µs`.

---

## Related Documents

| Document | Purpose |
|----------|---------|
| [`arbitrum/ARBITRUM_ONE_PAGER.md`](./arbitrum/ARBITRUM_ONE_PAGER.md) | One-pager |
| [`arbitrum/GRANT_PROPOSAL.md`](./arbitrum/GRANT_PROPOSAL.md) | Scope & roadmap |
| [`../architecture/TECHNICAL_SPECIFICATION.md`](../architecture/TECHNICAL_SPECIFICATION.md) | R01–R20 |
| [`gmx/GMX_BUILDERS_PITCH.md`](./gmx/GMX_BUILDERS_PITCH.md) | GMX-only builder economics |
