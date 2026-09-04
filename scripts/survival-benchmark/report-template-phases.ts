import { HL_INFO_URL } from "../../src/config/constants";
import { TWAP_PATH_SLOT_COUNT } from "../../src/services/execution/twap-engine-v2";
import { MAX_SLIPPAGE, MIN_DEPTH_USD } from "../../src/services/risk-control";
import { RISK_SDK_PACKAGE, RISK_SDK_VERSION } from "../../src/sdk/risk-sdk";
import {
  DEGRADE_THRESHOLD,
  NOTIONAL_USD,
  STRESS_NOTIONAL_USD,
  VAAS_LICENSE_BPS,
} from "./survival-benchmark.types";
import { fmtBps, fmtPct, fmtUsd, isoNow } from "./survival-benchmark.utils";
import type { SurvivalReportContext } from "./survival-report-context";

export function buildPhasesSection(ctx: SurvivalReportContext): string {
  const {
    baselineNetApy, afNetApy, deltaApy, baselineFundingUsd, afFundingUsd,
    afExtraSubsidyUsd, navBase, navAf, mddBase, mddAf, phase3SlipSaved,
    deltaSlipSavedP3, blackSwanHours, yieldSpikeMaxUsd, avgSpikeUsd,
    yieldSpikeSumUsd, basePaths, fullPaths, slipSavedBase100, slipSavedFull100,
    base1m, full1m, impactDrop1mPct, costDrop1mUsd, slipSavedBase1m,
    slipSavedFull1m, deltaSlip100, deltaSlip1m, vaasOrders, vaasBaselineBlockRate,
    vaasBlockRate, vaasBlockRateDelta, vaasSoilBlocks, vaasRootBlocks,
    vaasBlockedNotional, vaasSaasFeeUsd, vaasSaasFeeAnnualized, phase5Base,
    phase5Active, phase5DeltaApy, phase5ExtraFunding, phase5SlipCost,
    phase5NetExtra, rotationOn, funding, fundingSol, fundingBtc, fullSpecNetApy,
    fullSpecVsBaseApy, fullSpecExtraFunding, fullSpecSlip1mStress, fullSpecSlip30d,
    telemetry, fullSpecSharpe, fullSpecMdd, navFs, fullSpecBlockRate,
    fullSpecSaasYr, vaasBlocked, degraded, runANetApy, batch1DeltaApy,
    idleUsdcUsd, lendRes, affRes, shadowSlipSaved, shadowRes, zsrRes,
    batch1ExtraUsd, runANav, builderCommissionUsd,
    runBNetApy, runBVsBaseApy, runBTvlAfter, ingressTvlUsd, ingressSol, ingressArb, gasRes,
    gasImpactDropPct, gasSlipSaved, whaleRes, whaleFundingUsd, batch2ExtraUsd,
    batch2DeltaApy, runCNetApy, runCVsBaseApy, runCSharpe, runCMdd, runCSlip30d,
    runCSlip1m, runCNav, runCBlockRate, runCSaasYr, runCAffiliateYr,
    runCCombinedRevYr,
  } = ctx;
  return `### Phase 3 Test: Always-On Core + Anti-Fragile Yield Engine

**Weapon matrix (this run)**

| Module | Status |
|--------|--------|
| Always-On: \`checkSoilResistance\` | **ON** |
| Always-On: Saga state machine posture | **ON** (\`SystemState\` degrade on composite < ${DEGRADE_THRESHOLD}) |
| Always-On: Base SLI-TWAP escort | **ON** |
| **Phase 3 — Anti-Fragile Yield Engine** | **ACTIVE** (\`AntiFragileYieldService\`) |
| W4 — 30-Path TWAP/VWAP Router | **BYPASS / Disabled** |
| W6 — VaaS Risk SDK | **BYPASS / Disabled** |

**Trigger:** Dual-Radar composite < ${DEGRADE_THRESHOLD} → black-swan regime → 1× short funding boost (default 1.5×) via \`AntiFragileYieldService.evaluateHourlyHlFunding\`.

| Metric | Baseline (Core only) | + Phase 3 Anti-Fragile | Pure Δ |
|--------|----------------------|--------------------------|--------|
| Net APY | ${fmtPct(baselineNetApy, 2)} | **${fmtPct(afNetApy, 2)}** | **${deltaApy >= 0 ? "+" : ""}${fmtPct(deltaApy, 2)}** |
| Funding PnL (30D) | ${fmtUsd(baselineFundingUsd)} | **${fmtUsd(afFundingUsd)}** | **${afExtraSubsidyUsd >= 0 ? "+" : ""}${fmtUsd(afExtraSubsidyUsd)}** |
| Ending NAV | ${fmtUsd(navBase)} | **${fmtUsd(navAf)}** | **${navAf - navBase >= 0 ? "+" : ""}${fmtUsd(navAf - navBase)}** |
| Max drawdown (funding path) | ${fmtPct(mddBase, 4)} | ${fmtPct(mddAf, 4)} | ${fmtPct(mddAf - mddBase, 4)} |
| Slippage Saved (radar SLI-TWAP) | ${fmtUsd(phase3SlipSaved)} | ${fmtUsd(phase3SlipSaved)} | **${fmtUsd(deltaSlipSavedP3)}** *(yield weapon; slip path unchanged)* |
| Black-swan hours (AF active) | — | **${blackSwanHours}** | — |
| Yield Spike max (1h) | — | **${fmtUsd(yieldSpikeMaxUsd)}** | — |
| Yield Spike mean (per BS hour) | — | **${fmtUsd(avgSpikeUsd)}** | — |
| Yield Spike sum (30D) | — | **${fmtUsd(yieldSpikeSumUsd)}** | **= pure AF subsidy** |

> **Pure weapon delta:** Phase 3 adds **${deltaApy >= 0 ? "+" : ""}${fmtPct(deltaApy, 2)} Net APY** and **${fmtUsd(afExtraSubsidyUsd)}** extra funding capture over Always-On Core alone, with **${fmtUsd(deltaSlipSavedP3)}** slippage delta (W4 bypassed — Base SLI-TWAP only).

### Phase 4 Test: Always-On Core + 30-Path TWAP Router

**Weapon matrix (this isolation)**

| Module | Status |
|--------|--------|
| Always-On: \`checkSoilResistance\` / Saga / Base SLI-TWAP | **ON** |
| Phase 3 — Anti-Fragile Yield | **BYPASS** |
| **Phase 4 — TWAPEngineV2 Full-30 Router** | **ACTIVE** (\`TwapEngineV2Full30\`) |
| Phase 6 — VaaS Risk SDK | **BYPASS** |

| Metric | Baseline (Base 3-path SLI-TWAP) | + Phase 4 Full-30 | Pure Δ |
|--------|--------------------------------|-------------------|--------|
| Paths used | ${basePaths} | **${fullPaths}** (${TWAP_PATH_SLOT_COUNT} slots) | — |
| Slippage Saved @ $100k | ${fmtUsd(slipSavedBase100)} | **${fmtUsd(slipSavedFull100)}** | **${deltaSlip100 >= 0 ? "+" : ""}${fmtUsd(deltaSlip100)}** |
| Impact cost @ $1M | ${fmtBps(base1m.impactBps)} / ${fmtUsd(base1m.slipUsd)} | **${fmtBps(full1m.impactBps)}** / **${fmtUsd(full1m.slipUsd)}** | **−${fmtPct(Math.max(0, impactDrop1mPct), 2)} impact · ${costDrop1mUsd >= 0 ? "−" : "+"}${fmtUsd(Math.abs(costDrop1mUsd))} cost** |
| Slippage Saved @ $1M stress | ${fmtUsd(slipSavedBase1m)} | **${fmtUsd(slipSavedFull1m)}** | **${deltaSlip1m >= 0 ? "+" : ""}${fmtUsd(deltaSlip1m)}** |
| Net APY Δ | — | — | **+0.00%** *(execution weapon; funding unchanged)* |

> **Pure weapon delta:** Phase 4 adds **${deltaSlip1m >= 0 ? "+" : ""}${fmtUsd(deltaSlip1m)}** Slippage Saved at $1M stress and cuts impact cost by **${fmtPct(Math.max(0, impactDrop1mPct), 2)}** vs Base SLI-TWAP.

### Phase 6 Test: Always-On Core + VaaS Risk SDK

**Weapon matrix (this isolation)**

| Module | Status |
|--------|--------|
| Always-On: \`checkSoilResistance\` / Saga / Base SLI-TWAP | **ON** |
| Phase 3 — Anti-Fragile Yield | **BYPASS** |
| Phase 4 — 30-Path TWAP | **BYPASS** |
| **Phase 6 — \`${RISK_SDK_PACKAGE}\`** | **ACTIVE** (\`enforceSantenmokuGuard\` v${RISK_SDK_VERSION}) |

| Metric | Baseline (no SDK) | + Phase 6 VaaS Guard | Pure Δ |
|--------|-------------------|----------------------|--------|
| Third-party vault orders simulated | ${vaasOrders} | ${vaasOrders} | — |
| Liquidation-prevention block rate | ${fmtPct(vaasBaselineBlockRate, 2)} | **${fmtPct(vaasBlockRate, 2)}** | **+${fmtPct(vaasBlockRateDelta, 2)}** |
| Blocks (soil / root Max-SL) | 0 / 0 | **${vaasSoilBlocks}** / **${vaasRootBlocks}** | — |
| Blocked toxic notional | $0.00 | **${fmtUsd(vaasBlockedNotional)}** | — |
| B2B SaaS license fee (${VAAS_LICENSE_BPS} bps on blocked) | $0.00 | **${fmtUsd(vaasSaasFeeUsd)}** (window) | **+${fmtUsd(vaasSaasFeeUsd)}** |
| SaaS fee annualized | $0.00 | **${fmtUsd(vaasSaasFeeAnnualized)}** /yr | **+${fmtUsd(vaasSaasFeeAnnualized)}** |
| Slippage Saved Δ | — | — | **$0.00** *(auth weapon; execution path unchanged)* |

> **Pure weapon delta:** Phase 6 raises third-party vault anti-liq block rate by **+${fmtPct(vaasBlockRateDelta, 2)}** and unlocks **${fmtUsd(vaasSaasFeeAnnualized)}/yr** estimated B2B risk-SDK licensing (SaaS Fee Δ).

### Phase 5 Test: Always-On Core + Cross-Asset Funding Rotation

**Weapon matrix (this isolation)**

| Module | Status |
|--------|--------|
| Always-On: \`checkSoilResistance\` / Saga / Base SLI-TWAP | **ON** |
| Phase 3 — Anti-Fragile Yield | **BYPASS** |
| Phase 4 — 30-Path TWAP | **BYPASS** |
| **Phase 5 — Cross-Asset Funding Rotation** | **ACTIVE** (\`CrossAssetRotationService\` ETH/SOL/BTC) |
| Phase 6 — VaaS Risk SDK | **BYPASS** |

| Metric | Baseline (sticky ETH) | + Phase 5 Rotation | Pure Δ |
|--------|----------------------|--------------------|--------|
| Net APY | ${fmtPct(phase5Base.baselineEthApy, 2)} | **${fmtPct(phase5Active.annualizedApy, 2)}** | **${phase5DeltaApy >= 0 ? "+" : ""}${fmtPct(phase5DeltaApy, 2)}** |
| Funding PnL (30D) | ${fmtUsd(phase5Base.fundingPnlUsd)} | **${fmtUsd(phase5Active.fundingPnlUsd)}** | **${phase5ExtraFunding >= 0 ? "+" : ""}${fmtUsd(phase5ExtraFunding)}** |
| Rotation slip cost | $0.00 | **${fmtUsd(phase5SlipCost)}** (${phase5Active.rotations} switches @ ${rotationOn.rotationSlipBps} bps) | **−${fmtUsd(phase5SlipCost)}** |
| Net PnL after slip | ${fmtUsd(phase5Base.netPnlUsd)} | **${fmtUsd(phase5Active.netPnlUsd)}** | **${phase5NetExtra >= 0 ? "+" : ""}${fmtUsd(phase5NetExtra)}** |
| Samples (ETH/SOL/BTC funding) | ${funding.length} / ${fundingSol.length} / ${fundingBtc.length} | — | — |

> **Pure weapon delta:** Phase 5 adds **${phase5DeltaApy >= 0 ? "+" : ""}${fmtPct(phase5DeltaApy, 2)} Net APY** after **${fmtUsd(phase5SlipCost)}** rotation friction (${phase5Active.rotations} cross-asset switches).

### Phase Full-Spec: All-Weapons Active Benchmark (Ultimate Synergistic Mode)

**Weapon matrix (Test C — ALL ACTIVE)**

| Module | Status |
|--------|--------|
| Always-On Defense Core (Soil + Saga + Base SLI-TWAP) | **ON** |
| Phase 1 — 5-Sensor Dual-Radar (\`HLRadarEvaluator\`) | **ACTIVE** |
| Phase 2 — Est. Slippage Saved Telemetry | **ACTIVE** (\`computeSlippageSaved\`) |
| Phase 3 — Anti-Fragile Yield Engine | **ACTIVE** |
| Phase 4 — TWAPEngineV2 Full-30 Router | **ACTIVE** |
| Phase 5 — Cross-Asset Funding Rotation | **ACTIVE** |
| Phase 6 — \`${RISK_SDK_PACKAGE}\` | **ACTIVE** |

| Ultimate Metric | Value |
|-----------------|-------|
| **Final Net APY (Rotation + Anti-Fragile synergy)** | **${fmtPct(fullSpecNetApy, 2)}** (Δ vs sticky-ETH base ${fullSpecVsBaseApy >= 0 ? "+" : ""}${fmtPct(fullSpecVsBaseApy, 2)}; extra ${fmtUsd(fullSpecExtraFunding)}) |
| Phase-5 rotation contrib (isolated Δ APY) | ${phase5DeltaApy >= 0 ? "+" : ""}${fmtPct(phase5DeltaApy, 2)} · slip −${fmtUsd(phase5SlipCost)} |
| Phase-3 AF contrib (isolated Δ APY) | ${deltaApy >= 0 ? "+" : ""}${fmtPct(deltaApy, 2)} · +${fmtUsd(afExtraSubsidyUsd)} |
| **$1M stress Slippage Saved (Full-30)** | **${fmtUsd(fullSpecSlip1mStress)}** |
| **30D cumulative Slippage Saved (radar×Full-30 synergy)** | **${fmtUsd(fullSpecSlip30d)}** |
| Phase-2 Telemetry card (\`savedUsd\` / avoided bps) | **${fmtUsd(telemetry.savedUsd)}** / ${telemetry.avoidedBps.toFixed(2)} bps (${telemetry.sampleCount} samples) |
| **Engine Sharpe (Full-Spec equity)** | **${fullSpecSharpe.toFixed(2)}** |
| **Max Drawdown (Full-Spec equity)** | **${fmtPct(fullSpecMdd, 4)}** |
| Ending NAV (Full-Spec) | ${fmtUsd(navFs)} |
| **VaaS anti-liq block rate** | **${fmtPct(fullSpecBlockRate, 2)}** (${vaasBlocked}/${vaasOrders} orders) |
| **B2B SaaS Fee Δ (annualized)** | **${fmtUsd(fullSpecSaasYr)}/yr** (${fmtUsd(vaasSaasFeeUsd)} in-window @ ${VAAS_LICENSE_BPS} bps) |
| Degrade hours / Yield Spike Σ | ${degraded.length} / ${fmtUsd(yieldSpikeSumUsd)} |

> **Full-Spec scorecard:** Net APY **${fmtPct(fullSpecNetApy, 2)}** · 30D Slip Saved **${fmtUsd(fullSpecSlip30d)}** · $1M stress **${fmtUsd(fullSpecSlip1mStress)}** · Sharpe **${fullSpecSharpe.toFixed(2)}** · MDD **${fmtPct(fullSpecMdd, 4)}** · VaaS block **${fmtPct(fullSpecBlockRate, 2)}** · SaaS **${fmtUsd(fullSpecSaasYr)}/yr** · Phase5 ΔAPY **${phase5DeltaApy >= 0 ? "+" : ""}${fmtPct(phase5DeltaApy, 2)}**.

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
| Net APY | ${fmtPct(fullSpecNetApy, 2)} | **${fmtPct(runANetApy, 2)}** | **+${fmtPct(batch1DeltaApy, 2)}** |
| Lend interest (idle ${fmtUsd(idleUsdcUsd, 0)} @ ${fmtPct(lendRes.annualizedApy, 2)}) | — | **${fmtUsd(lendRes.interestUsd)}** | +${fmtUsd(lendRes.interestUsd)} |
| Affiliate reinvest (20% of ${fmtUsd(builderCommissionUsd)}) | — | **${fmtUsd(affRes.reinvestedUsd)}** | +${fmtUsd(affRes.reinvestedUsd)} |
| Shadow spoof slip saved | — | **${fmtUsd(shadowSlipSaved)}** (spoof ${(shadowRes.spoofRatio * 100).toFixed(1)}%) | +${fmtUsd(shadowSlipSaved)} |
| Zero-spread transfer saved | — | **${fmtUsd(zsrRes.savedUsd)}** | +${fmtUsd(zsrRes.savedUsd)} |
| Batch-1 total extra PnL | — | **${fmtUsd(batch1ExtraUsd)}** | — |
| Ending NAV | ${fmtUsd(navFs)} | **${fmtUsd(runANav)}** | +${fmtUsd(batch1ExtraUsd)} |

> **Run A Δ:** Batch 1 adds **+${fmtPct(batch1DeltaApy, 2)} Net APY** (Lend + Affiliate compound + Shadow + Zero-Spread).

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
| Net APY (base funding + Batch1/2 extras) | **${fmtPct(runBNetApy, 2)}** (Δ vs base ${runBVsBaseApy >= 0 ? "+" : ""}${fmtPct(runBVsBaseApy, 2)}) |
| Ingress TVL credited (SOL + ARB) | **${fmtUsd(ingressTvlUsd)}** (fee ${fmtUsd(ingressSol.feeUsd + ingressArb.feeUsd)}) |
| TVL after ingress | **${fmtUsd(runBTvlAfter)}** |
| Gas bid triggered / impact drop | ${gasRes.triggered ? "YES" : "NO"} / **${fmtPct(gasImpactDropPct, 2)}** |
| Gas congestion slip saved | **${fmtUsd(gasSlipSaved)}** |
| Whale hedge Δ / side | ${fmtUsd(whaleRes.hedgeDeltaUsd)} / \`${whaleRes.hedgeSide}\` (\`${whaleRes.mode}\`) |
| Whale sleeve funding (window) | **${fmtUsd(whaleFundingUsd)}** |
| Batch-2 execution extra | **${fmtUsd(batch2ExtraUsd)}** (+${fmtPct(batch2DeltaApy, 2)} APY) |

> **Run B Δ:** Ingress lifts TVL by **${fmtUsd(ingressTvlUsd)}**; Gas+Whale add **+${fmtPct(batch2DeltaApy, 2)} APY** / **${fmtUsd(batch2ExtraUsd)}**.

### Run C: Full Loaded Ultimate (All Weapons + All Stubs)

**Weapon matrix — EVERYTHING UNLOCKED**

| Module | Status |
|--------|--------|
| Full-Spec (Core + Dual-Radar + Telemetry + AF + Full-30 + Rotation + VaaS) | **ACTIVE** |
| Batch 1 (Lend + Affiliate + Shadow + Zero-Spread) | **ACTIVE** |
| Batch 2 (Gas + Ingress + Whale) | **ACTIVE** |

| Ultimate Metric | Value |
|-----------------|-------|
| **Final Net APY** | **${fmtPct(runCNetApy, 2)}** (Δ vs base ${runCVsBaseApy >= 0 ? "+" : ""}${fmtPct(runCVsBaseApy, 2)}) |
| Batch-1 marginal Δ APY | +${fmtPct(batch1DeltaApy, 2)} |
| Batch-2 marginal Δ APY | +${fmtPct(batch2DeltaApy, 2)} |
| **Engine Sharpe** | **${runCSharpe.toFixed(2)}** |
| **Max Drawdown** | **${fmtPct(runCMdd, 4)}** |
| **30D Slippage Saved** | **${fmtUsd(runCSlip30d)}** |
| **$1M stress Slippage Saved** | **${fmtUsd(runCSlip1m)}** |
| Ending NAV | **${fmtUsd(runCNav)}** |
| Ingress TVL credited | **${fmtUsd(ingressTvlUsd)}** |
| **VaaS anti-liq block rate** | **${fmtPct(runCBlockRate, 2)}** |
| **B2B SaaS Fee Δ** | **${fmtUsd(runCSaasYr)}/yr** |
| **Affiliate reinvest (ann.)** | **${fmtUsd(runCAffiliateYr)}/yr** |
| **Combined B2B + Affiliate $/yr** | **${fmtUsd(runCCombinedRevYr)}/yr** |

> **Run C scorecard:** Net APY **${fmtPct(runCNetApy, 2)}** · Sharpe **${runCSharpe.toFixed(2)}** · MDD **${fmtPct(runCMdd, 4)}** · Slip30d **${fmtUsd(runCSlip30d)}** · VaaS **${fmtPct(runCBlockRate, 2)}** · Rev **${fmtUsd(runCCombinedRevYr)}/yr**.

---
`;
}
