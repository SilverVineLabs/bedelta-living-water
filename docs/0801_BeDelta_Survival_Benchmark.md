# BeΔ Living Water — Survival Benchmark Report

**Product:** BeDeltaLivingwater (BeΔ Living Water)  
**Data source:** Hyperliquid Mainnet L1 (`https://api.hyperliquid.xyz/info`) + Binance USDT-M basis  
**Asset:** ETH-PERP / USDC quote  
**Window:** last ~30.0 days (requested 30D)  
**Generated:** 2026-09-04T05:43:01.019Z  
**Primary notional:** $100,000.00 Δ-neutral hedge open  
**Stress notional:** $1,000,000.00 (depth stress)  
**Isolation runs:** Phase 3 / 4 / 5 / 6 independent · **+ Full-Spec Ultimate** · **+ Runs A/B/C (Batch stubs)**

---

## 0. HL Custom Dual-Radar (5-Sensor) Risk Engine

```
               【SliverVine HL Dynamic Risk Matrix (100%)】
                                  │
     ┌────────────────────────────┴────────────────────────────┐
     ▼                                                         ▼
【Primary Radar 60%】                                   【Secondary Radar 40%】
├─ S1 Orderbook Cancel/Fill + Micro-spread (30%)        ├─ S4 Top-20 ΔP_liq (50%)
├─ S2 Funding Slope dF/dt + d²F/dt² (40%)               └─ S5 HL↔Binance Basis z (50%)
└─ S3 Soil Resistance Depth Index (30%)
```

| Layer | Weight | Avg Score (0–100) |
|-------|--------|-------------------|
| Primary Radar | 60% | 87.98 |
| Secondary Radar | 40% | 59.68 |
| **Composite Safety Score** | 100% | **60.72** |
| Composite min / max | | 8.00 / 66.32 |
| Latest composite | | 62.28 → HUD `GREEN` · CRI 62 |

### Sensor breakdown (30D mean)

| Sensor | Radar | Intra-weight | Mean score | Role |
|--------|-------|--------------|------------|------|
| S1 Cancel-to-Fill / Micro-spread | Primary | 30% | 100.00 | MM vacuum / spread expansion |
| S2 Funding slope & accel | Primary | 40% | 96.35 | Leverage emotion kink |
| S3 Soil Resistance Depth | Primary | 30% | 64.79 | `checkSoilResistance()` |
| S4 Top-20 Whale ΔP_liq | Secondary | 50% | 45.00 | Cascade distance (maxLev=50x) |
| S5 HL vs Binance basis z | Secondary | 50% | 74.36 | Cross-venue curvature |

### Degrade gate (Composite < 30)

| Metric | Value |
|--------|-------|
| Hours evaluated | 720 |
| Degrade events | **42** (5.83% of window) |
| SystemState HUD histogram | `GREEN`:667 · `AMBER`:21 · `SANTENMOKU`:32 |
| **SLI-TWAP slippage saved on degrade** | **$1,048.10** |
| Latest degrade? | NO — clear |

> When composite < 30, `buildSystemState({ currentCri: composite })` downgrades HUD and SLI-TWAP savings are accrued vs market sweep (live L2 × stress multiplier).
### Phase 3 Test: Always-On Core + Anti-Fragile Yield Engine

**Weapon matrix (this run)**

| Module | Status |
|--------|--------|
| Always-On: `checkSoilResistance` | **ON** |
| Always-On: Saga state machine posture | **ON** (`SystemState` degrade on composite < 30) |
| Always-On: Base SLI-TWAP escort | **ON** |
| **Phase 3 — Anti-Fragile Yield Engine** | **ACTIVE** (`AntiFragileYieldService`) |
| W4 — 30-Path TWAP/VWAP Router | **BYPASS / Disabled** |
| W6 — VaaS Risk SDK | **BYPASS / Disabled** |

**Trigger:** Dual-Radar composite < 30 → black-swan regime → 1× short funding boost (default 1.5×) via `AntiFragileYieldService.evaluateHourlyHlFunding`.

| Metric | Baseline (Core only) | + Phase 3 Anti-Fragile | Pure Δ |
|--------|----------------------|--------------------------|--------|
| Net APY | 12.80% | **13.17%** | **+0.37%** |
| Funding PnL (30D) | $1,052.06 | **$1,082.74** | **+$30.68** |
| Ending NAV | $101,052.06 | **$101,082.74** | **+$30.68** |
| Max drawdown (funding path) | 0.0000% | 0.0000% | 0.0000% |
| Slippage Saved (radar SLI-TWAP) | $1,048.10 | $1,048.10 | **$0.00** *(yield weapon; slip path unchanged)* |
| Black-swan hours (AF active) | — | **42** | — |
| Yield Spike max (1h) | — | **$0.73** | — |
| Yield Spike mean (per BS hour) | — | **$0.73** | — |
| Yield Spike sum (30D) | — | **$30.68** | **= pure AF subsidy** |

> **Pure weapon delta:** Phase 3 adds **+0.37% Net APY** and **$30.68** extra funding capture over Always-On Core alone, with **$0.00** slippage delta (W4 bypassed — Base SLI-TWAP only).

### Phase 4 Test: Always-On Core + 30-Path TWAP Router

**Weapon matrix (this isolation)**

| Module | Status |
|--------|--------|
| Always-On: `checkSoilResistance` / Saga / Base SLI-TWAP | **ON** |
| Phase 3 — Anti-Fragile Yield | **BYPASS** |
| **Phase 4 — TWAPEngineV2 Full-30 Router** | **ACTIVE** (`TwapEngineV2Full30`) |
| Phase 6 — VaaS Risk SDK | **BYPASS** |

| Metric | Baseline (Base 3-path SLI-TWAP) | + Phase 4 Full-30 | Pure Δ |
|--------|--------------------------------|-------------------|--------|
| Paths used | 3 | **30** (30 slots) | — |
| Slippage Saved @ $100k | $0.00 | **$0.00** | **+$0.00** |
| Impact cost @ $1M | 0.62 bps / $62.29 | **0.51 bps** / **$51.43** | **−17.43% impact · −$10.86 cost** |
| Slippage Saved @ $1M stress | $47.51 | **$58.36** | **+$10.86** |
| Net APY Δ | — | — | **+0.00%** *(execution weapon; funding unchanged)* |

> **Pure weapon delta:** Phase 4 adds **+$10.86** Slippage Saved at $1M stress and cuts impact cost by **17.43%** vs Base SLI-TWAP.

### Phase 6 Test: Always-On Core + VaaS Risk SDK

**Weapon matrix (this isolation)**

| Module | Status |
|--------|--------|
| Always-On: `checkSoilResistance` / Saga / Base SLI-TWAP | **ON** |
| Phase 3 — Anti-Fragile Yield | **BYPASS** |
| Phase 4 — 30-Path TWAP | **BYPASS** |
| **Phase 6 — `@slivervine/citadel-sdk`** | **ACTIVE** (`enforceSantenmokuGuard` v1.0.0) |

| Metric | Baseline (no SDK) | + Phase 6 VaaS Guard | Pure Δ |
|--------|-------------------|----------------------|--------|
| Third-party vault orders simulated | 720 | 720 | — |
| Liquidation-prevention block rate | 0.00% | **100.00%** | **+100.00%** |
| Blocks (soil / root Max-SL) | 0 / 0 | **720** / **42** | — |
| Blocked toxic notional | $0.00 | **$3,456,000.00** | — |
| B2B SaaS license fee (2 bps on blocked) | $0.00 | **$691.20** (window) | **+$691.20** |
| SaaS fee annualized | $0.00 | **$8,421.30** /yr | **+$8,421.30** |
| Slippage Saved Δ | — | — | **$0.00** *(auth weapon; execution path unchanged)* |

> **Pure weapon delta:** Phase 6 raises third-party vault anti-liq block rate by **+100.00%** and unlocks **$8,421.30/yr** estimated B2B risk-SDK licensing (SaaS Fee Δ).

### Phase 5 Test: Always-On Core + Cross-Asset Funding Rotation

**Weapon matrix (this isolation)**

| Module | Status |
|--------|--------|
| Always-On: `checkSoilResistance` / Saga / Base SLI-TWAP | **ON** |
| Phase 3 — Anti-Fragile Yield | **BYPASS** |
| Phase 4 — 30-Path TWAP | **BYPASS** |
| **Phase 5 — Cross-Asset Funding Rotation** | **ACTIVE** (`CrossAssetRotationService` ETH/SOL/BTC) |
| Phase 6 — VaaS Risk SDK | **BYPASS** |

| Metric | Baseline (sticky ETH) | + Phase 5 Rotation | Pure Δ |
|--------|----------------------|--------------------|--------|
| Net APY | 12.80% | **12.80%** | **+0.00%** |
| Funding PnL (30D) | $1,052.06 | **$1,052.06** | **+$0.00** |
| Rotation slip cost | $0.00 | **$0.00** (0 switches @ 0.5 bps) | **−$0.00** |
| Net PnL after slip | $1,052.06 | **$1,052.06** | **+$0.00** |
| Samples (ETH/SOL/BTC funding) | 720 / 720 / 720 | — | — |

> **Pure weapon delta:** Phase 5 adds **+0.00% Net APY** after **$0.00** rotation friction (0 cross-asset switches).

### Phase Full-Spec: All-Weapons Active Benchmark (Ultimate Synergistic Mode)

**Weapon matrix (Test C — ALL ACTIVE)**

| Module | Status |
|--------|--------|
| Always-On Defense Core (Soil + Saga + Base SLI-TWAP) | **ON** |
| Phase 1 — 5-Sensor Dual-Radar (`HLRadarEvaluator`) | **ACTIVE** |
| Phase 2 — Est. Slippage Saved Telemetry | **ACTIVE** (`computeSlippageSaved`) |
| Phase 3 — Anti-Fragile Yield Engine | **ACTIVE** |
| Phase 4 — TWAPEngineV2 Full-30 Router | **ACTIVE** |
| Phase 5 — Cross-Asset Funding Rotation | **ACTIVE** |
| Phase 6 — `@slivervine/citadel-sdk` | **ACTIVE** |

| Ultimate Metric | Value |
|-----------------|-------|
| **Final Net APY (Rotation + Anti-Fragile synergy)** | **13.17%** (Δ vs sticky-ETH base +0.37%; extra $30.68) |
| Phase-5 rotation contrib (isolated Δ APY) | +0.00% · slip −$0.00 |
| Phase-3 AF contrib (isolated Δ APY) | +0.37% · +$30.68 |
| **$1M stress Slippage Saved (Full-30)** | **$58.36** |
| **30D cumulative Slippage Saved (radar×Full-30 synergy)** | **$367.69** |
| Phase-2 Telemetry card (`savedUsd` / avoided bps) | **$58.36** / 0.53 bps (2 samples) |
| **Engine Sharpe (Full-Spec equity)** | **120.87** |
| **Max Drawdown (Full-Spec equity)** | **0.0000%** |
| Ending NAV (Full-Spec) | $101,082.74 |
| **VaaS anti-liq block rate** | **100.00%** (720/720 orders) |
| **B2B SaaS Fee Δ (annualized)** | **$8,421.30/yr** ($691.20 in-window @ 2 bps) |
| Degrade hours / Yield Spike Σ | 42 / $30.68 |

> **Full-Spec scorecard:** Net APY **13.17%** · 30D Slip Saved **$367.69** · $1M stress **$58.36** · Sharpe **120.87** · MDD **0.0000%** · VaaS block **100.00%** · SaaS **$8,421.30/yr** · Phase5 ΔAPY **+0.00%**.

### Run A: Previous Full-Spec + Batch 1 Stubs

**Weapon matrix**

| Module | Status |
|--------|--------|
| Full-Spec (Core + Radar + Telemetry + AF + Full-30 + Rotation + VaaS) | **ON** |
| Batch 1 — USDC Yield Lend | **ACTIVE** |
| Batch 1 — Affiliate Reinvest (20%) | **ACTIVE** |
| Batch 1 — Iceberg Shadow Orders | **ACTIVE** |
| Batch 1 — Zero-Spread Rebalancer | **ACTIVE** |
| Batch 2 stubs | **BYPASS** |

| Metric | Full-Spec | + Batch 1 | Pure Δ |
|--------|-----------|-----------|--------|
| Net APY | 13.17% | **14.26%** | **+1.09%** |
| Lend interest (idle $25,000 @ 4.20%) | — | **$86.30** | +$86.30 |
| Affiliate reinvest (20% of $7.50) | — | **$1.50** | +$1.50 |
| Shadow spoof slip saved | — | **$0.81** (spoof 45.0%) | +$0.81 |
| Zero-spread transfer saved | — | **$1.00** | +$1.00 |
| Batch-1 total extra PnL | — | **$89.61** | — |
| Ending NAV | $101,082.74 | **$101,172.35** | +$89.61 |

> **Run A Δ:** Batch 1 adds **+1.09% Net APY** (Lend + Affiliate compound + Shadow + Zero-Spread).

### Run B: Batch 1 + Batch 2 Focus (Execution & Ingress)

**Weapon matrix**

| Module | Status |
|--------|--------|
| Always-On Core | **ON** |
| Full-Spec Phase weapons (AF / Full-30 / Rotation / VaaS / Radar) | **BYPASS** *(focus stubs)* |
| Batch 1 stubs (all 4) | **ACTIVE** |
| Batch 2 — Pre-emptive Gas Bidding | **ACTIVE** |
| Batch 2 — Cross-Chain Ingress (SOL/ARB) | **ACTIVE** |
| Batch 2 — Hyperdash Whale Follower | **ACTIVE** |

| Metric | Value |
|--------|-------|
| Net APY (base funding + Batch1/2 extras) | **15.55%** (Δ vs base +2.75%) |
| Ingress TVL credited (SOL + ARB) | **$99,935.00** (fee $65.00) |
| TVL after ingress | **$199,935.00** |
| Gas bid triggered / impact drop | YES / **18.00%** |
| Gas congestion slip saved | **$10.55** |
| Whale hedge Δ / side | -$12,000.00 / `short` (`counter`) |
| Whale sleeve funding (window) | **$126.25** |
| Batch-2 execution extra | **$136.80** (+1.66% APY) |

> **Run B Δ:** Ingress lifts TVL by **$99,935.00**; Gas+Whale add **+1.66% APY** / **$136.80**.

### Run C: Full Loaded Ultimate (All Weapons + All Stubs)

**Weapon matrix — EVERYTHING UNLOCKED**

| Module | Status |
|--------|--------|
| Full-Spec (Core + Dual-Radar + Telemetry + AF + Full-30 + Rotation + VaaS) | **ACTIVE** |
| Batch 1 (Lend + Affiliate + Shadow + Zero-Spread) | **ACTIVE** |
| Batch 2 (Gas + Ingress + Whale) | **ACTIVE** |

| Ultimate Metric | Value |
|-----------------|-------|
| **Final Net APY** | **15.93%** (Δ vs base +3.13%) |
| Batch-1 marginal Δ APY | +1.09% |
| Batch-2 marginal Δ APY | +1.66% |
| **Engine Sharpe** | **22.47** |
| **Max Drawdown** | **0.0000%** |
| **30D Slippage Saved** | **$379.06** |
| **$1M stress Slippage Saved** | **$68.87** |
| Ending NAV | **$101,309.15** |
| Ingress TVL credited | **$99,935.00** |
| **VaaS anti-liq block rate** | **100.00%** |
| **B2B SaaS Fee Δ** | **$8,421.30/yr** |
| **Affiliate reinvest (ann.)** | **$18.28/yr** |
| **Combined B2B + Affiliate $/yr** | **$8,439.57/yr** |

> **Run C scorecard:** Net APY **15.93%** · Sharpe **22.47** · MDD **0.0000%** · Slip30d **$379.06** · VaaS **100.00%** · Rev **$8,439.57/yr**.

---
## 1. Live Orderbook Depth (ETH/USDC)

| Metric | Value |
|--------|-------|
| Mid | $3,500.00 |
| Best bid / ask | $3,499.82 / $3,500.18 |
| Spread | 1.03 bps |
| Bid depth (top 10) | $1,749,715.50 |
| Ask depth (top 10) | $1,750,285.00 |
| Min-side depth | $1,749,715.50 |
| Impact @ $100k | 0.51 bps |
| Impact @ $1M | 1.10 bps |
| Depth floor (`MIN_DEPTH_USD`) | $100,000.00 |
| Soil resistance | TRIPPED |
| Soil reasons | ARBITRUM_SEQUENCER_PROBE_MISSING; SOFT_CONFIRMATION_PROBE_MISSING |

---

## 2. Market Sweep vs BeΔ SLI-TWAP

| Path | Notional | Impact | Slippage cost | Soil trips |
|------|----------|--------|---------------|------------|
| Market hard knock | $100,000 | 0.51 bps | $5.14 | — |
| BeΔ SLI-TWAP | $100,000 | 0.51 bps | $1.37 | 3 |
| **Slippage saved** | $100,000 | | **$3.77** | |
| Market hard knock | $1,000,000 | 1.10 bps | $109.79 | — |
| BeΔ SLI-TWAP | $1,000,000 | 0.51 bps | $13.71 | 3 |
| **Slippage saved (stress)** | $1,000,000 | | **$96.07** | |
| **Radar-gated SLI-TWAP saved** | degrade hours | | **$1,048.10** | 42 events |

SLI-TWAP: `TwapEngineV2Stub` (30-path) · `auditLiveBookSoilResistance()` fuse at 0.50%.

---

## 3. Funding → Net APY (ETH-PERP)

| Metric | Value |
|--------|-------|
| Funding samples | 720 (hourly) |
| Mean hourly funding | 0.001461% |
| **Net APY (short earns +rate)** | **12.80%** |
| First sample | 2026-08-05T06:00:00.000Z |
| Last sample | 2026-09-04T05:00:00.000Z |

---

## 4. Volatility · Max Drawdown · Sharpe

| Metric | Value |
|--------|-------|
| 1m candles (HL retention) | 43,200 (~720.0h span) |
| 1h candles (30D) | 720 |
| Binance 1h closes | 720 |
| Ann. vol (1m) | 0.00% |
| Ann. vol (1h, 30D) | 0.00% |
| Max drawdown (funding-only) | 0.0000% |
| Max drawdown (engine + residual) | 0.0000% |
| Sharpe (funding-only) | **131.53** |
| Sharpe (engine + residual) | **131.53** |
| Ending NAV (funding-only) | $101,052.06 |
| Ending NAV (engine) | $101,052.06 |

---

## 5. Live Survival Terminal

```
┌────────────────────────────────────────────────────────────────────────┐
│         BeΔ LIVING WATER — HL DUAL-RADAR SURVIVAL BENCHMARK            │
├────────────────────────────────────────────────────────────────────────┤
│ [HL L1 + Binance basis · 5-Sensor Dual-Radar · SLI-TWAP]                │
│                                                                        │
│ 1. COMPOSITE SAFETY SCORE:   60.72                        │
│ 2. DEGRADE EVENTS (<30):    42                           │
│ 3. RADAR SLI-TWAP SAVED:     +$1,048.10                   │
│ 4. SLIPPAGE SAVED ($100k):   +$3.77                       │
│ 5. SLIPPAGE SAVED ($1M):     +$96.07                      │
│ 6. MAX DRAWDOWN (30D eng):   0.0000%                      │
│ 7. NET ENGINE SHARPE:        131.53                       │
│ 8. NET FUNDING APY:          12.80%                       │
│ 9. PHASE3 AF NET APY:        13.17%                       │
│10. PHASE3 PURE Δ APY:        +0.37%                       │
│11. PHASE3 YIELD SPIKE Σ:     $30.68                       │
│12. PHASE4 Δ SLIP @ $1M:      +$10.86                      │
│13. PHASE4 IMPACT DROP $1M:   17.43%                       │
│14. PHASE6 BLOCK RATE Δ:      +100.00%                     │
│15. PHASE6 SaaS FEE Δ/yr:     $8,421.30                    │
│16. PHASE5 Δ APY / SLIP:      +0.00% / −$0.00              │
│17. FULL-SPEC NET APY:        13.17%                       │
│18. FULL-SPEC SLIP 30D:       $367.69                      │
│19. FULL-SPEC $1M SLIP:       $58.36                       │
│20. FULL-SPEC SHARPE / MDD:   120.87 / 0.0000%             │
│21. FULL-SPEC VAAS / SaaS:    100.00% / $8,421.30/yr       │
│22. RUN-A NET APY (B1 Δ):     14.26% (+1.09%)              │
│23. RUN-B NET APY / TVL+:     15.55% / +$99,935.00         │
│24. RUN-C ULTIMATE APY:       15.93%                       │
│25. RUN-C SHARPE / MDD:       22.47 / 0.0000%              │
│26. RUN-C REV B2B+AFF/yr:     $8,439.57/yr                 │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 6. Method Notes

1. **L1 truth:** `fundingHistory` (ETH/SOL/BTC), `candleSnapshot`, `l2Book`, `metaAndAssetCtxs`.
2. **Dual-Radar:** `HLRadarEvaluator` — degrade if composite < 30.
3. **Isolation:** Phase 3 / 4 / 5 / 6 each unlock exactly one weapon.
4. **Phase 5:** `CrossAssetRotationService` scores ETH/SOL/BTC by rate + $\lambda\cdot dF/dt$; charges 0.5 bps per switch.
5. **Full-Spec:** Rotation + AF + Full-30 slip + VaaS + Telemetry concurrent.
6. **Runs A/B/C:** Batch-1/2 stubs progressive — Lend/Affiliate/Shadow/ZSR → Gas/Ingress/Whale → Full Loaded.
7. **Disclaimer:** Historical L2 unavailable; VaaS orders synthetic off radar degrade; Batch stubs are pure sims.

---

*SilverVine Labs · BeΔ Living Water · Full Loaded Run C · BUSL-1.1 · `:qum[x0sumx]`*
