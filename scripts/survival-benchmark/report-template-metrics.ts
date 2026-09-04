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

export function buildMetricsSection(ctx: SurvivalReportContext): string {
  const {
    metrics100k, metricsStress, soilAudit, market100, twap100, saved100,
    marketStress, twapStress, savedStress, radarSlipSaved, degraded,
    funding, meanHourly, netApy, candles1m, candles1h, binance1h, c1mSpanH,
    vol1m, vol1h, mddFund, mddEng, sharpeFund, sharpeEng, navFund, navEng,
    spanDays, avgComposite, afNetApy,
    deltaApy, yieldSpikeSumUsd, deltaSlip1m, impactDrop1mPct, vaasBlockRateDelta,
    vaasSaasFeeAnnualized, phase5DeltaApy, phase5SlipCost, fullSpecNetApy,
    fullSpecSlip30d, fullSpecSlip1mStress, fullSpecSharpe, fullSpecMdd,
    fullSpecBlockRate, fullSpecSaasYr, runANetApy, batch1DeltaApy, runBNetApy,
    ingressTvlUsd, runCNetApy, runCSharpe, runCMdd, runCCombinedRevYr, rotationOn,
  } = ctx;
  return `## 1. Live Orderbook Depth (ETH/USDC)

| Metric | Value |
|--------|-------|
| Mid | ${fmtUsd(metrics100k.midPx, 2)} |
| Best bid / ask | ${fmtUsd(metrics100k.bestBid, 2)} / ${fmtUsd(metrics100k.bestAsk, 2)} |
| Spread | ${fmtBps(metrics100k.spreadBps)} |
| Bid depth (top 10) | ${fmtUsd(metrics100k.bidDepthUsd)} |
| Ask depth (top 10) | ${fmtUsd(metrics100k.askDepthUsd)} |
| Min-side depth | ${fmtUsd(metrics100k.depthUsd)} |
| Impact @ $100k | ${fmtBps(metrics100k.priceImpactBps)} |
| Impact @ $1M | ${metricsStress ? fmtBps(metricsStress.priceImpactBps) : "n/a"} |
| Depth floor (\`MIN_DEPTH_USD\`) | ${fmtUsd(MIN_DEPTH_USD)} |
| Soil resistance | ${soilAudit.tripped ? "TRIPPED" : "PASS"} |
| Soil reasons | ${soilAudit.reasons.length ? soilAudit.reasons.join("; ") : "—"} |

---

## 2. Market Sweep vs BeΔ SLI-TWAP

| Path | Notional | Impact | Slippage cost | Soil trips |
|------|----------|--------|---------------|------------|
| Market hard knock | ${fmtUsd(NOTIONAL_USD, 0)} | ${fmtBps(market100.impactBps)} | ${fmtUsd(market100.slipUsd)} | — |
| BeΔ SLI-TWAP | ${fmtUsd(NOTIONAL_USD, 0)} | ${fmtBps(twap100.impactBps)} | ${fmtUsd(twap100.slipUsd)} | ${twap100.soilTrips} |
| **Slippage saved** | ${fmtUsd(NOTIONAL_USD, 0)} | | **${fmtUsd(saved100)}** | |
| Market hard knock | ${fmtUsd(STRESS_NOTIONAL_USD, 0)} | ${fmtBps(marketStress.impactBps)} | ${fmtUsd(marketStress.slipUsd)} | — |
| BeΔ SLI-TWAP | ${fmtUsd(STRESS_NOTIONAL_USD, 0)} | ${fmtBps(twapStress.impactBps)} | ${fmtUsd(twapStress.slipUsd)} | ${twapStress.soilTrips} |
| **Slippage saved (stress)** | ${fmtUsd(STRESS_NOTIONAL_USD, 0)} | | **${fmtUsd(savedStress)}** | |
| **Radar-gated SLI-TWAP saved** | degrade hours | | **${fmtUsd(radarSlipSaved)}** | ${degraded.length} events |

SLI-TWAP: \`TwapEngineV2Stub\` (${TWAP_PATH_SLOT_COUNT}-path) · \`auditLiveBookSoilResistance()\` fuse at ${fmtPct(MAX_SLIPPAGE)}.

---

## 3. Funding → Net APY (ETH-PERP)

| Metric | Value |
|--------|-------|
| Funding samples | ${funding.length} (hourly) |
| Mean hourly funding | ${(meanHourly * 100).toFixed(6)}% |
| **Net APY (short earns +rate)** | **${fmtPct(netApy, 2)}** |
| First sample | ${new Date(funding[0]!.time).toISOString()} |
| Last sample | ${new Date(funding[funding.length - 1]!.time).toISOString()} |

---

## 4. Volatility · Max Drawdown · Sharpe

| Metric | Value |
|--------|-------|
| 1m candles (HL retention) | ${candles1m.length.toLocaleString()} (~${c1mSpanH.toFixed(1)}h span) |
| 1h candles (30D) | ${candles1h.length.toLocaleString()} |
| Binance 1h closes | ${binance1h.size.toLocaleString()} |
| Ann. vol (1m) | ${fmtPct(vol1m, 2)} |
| Ann. vol (1h, 30D) | ${fmtPct(vol1h, 2)} |
| Max drawdown (funding-only) | ${fmtPct(mddFund, 4)} |
| Max drawdown (engine + residual) | ${fmtPct(mddEng, 4)} |
| Sharpe (funding-only) | **${sharpeFund.toFixed(2)}** |
| Sharpe (engine + residual) | **${sharpeEng.toFixed(2)}** |
| Ending NAV (funding-only) | ${fmtUsd(navFund)} |
| Ending NAV (engine) | ${fmtUsd(navEng)} |

---

## 5. Live Survival Terminal

\`\`\`
┌────────────────────────────────────────────────────────────────────────┐
│         BeΔ LIVING WATER — HL DUAL-RADAR SURVIVAL BENCHMARK            │
├────────────────────────────────────────────────────────────────────────┤
│ [HL L1 + Binance basis · 5-Sensor Dual-Radar · SLI-TWAP]                │
│                                                                        │
│ 1. COMPOSITE SAFETY SCORE:   ${avgComposite.toFixed(2).padEnd(28)} │
│ 2. DEGRADE EVENTS (<${DEGRADE_THRESHOLD}):    ${String(degraded.length).padEnd(28)} │
│ 3. RADAR SLI-TWAP SAVED:     ${`${radarSlipSaved >= 0 ? "+" : ""}${fmtUsd(radarSlipSaved)}`.padEnd(28)} │
│ 4. SLIPPAGE SAVED ($100k):   ${`${saved100 >= 0 ? "+" : ""}${fmtUsd(saved100)}`.padEnd(28)} │
│ 5. SLIPPAGE SAVED ($1M):     ${`${savedStress >= 0 ? "+" : ""}${fmtUsd(savedStress)}`.padEnd(28)} │
│ 6. MAX DRAWDOWN (${Math.round(spanDays)}D eng):   ${fmtPct(mddEng, 4).padEnd(28)} │
│ 7. NET ENGINE SHARPE:        ${sharpeEng.toFixed(2).padEnd(28)} │
│ 8. NET FUNDING APY:          ${fmtPct(netApy, 2).padEnd(28)} │
│ 9. PHASE3 AF NET APY:        ${fmtPct(afNetApy, 2).padEnd(28)} │
│10. PHASE3 PURE Δ APY:        ${`${deltaApy >= 0 ? "+" : ""}${fmtPct(deltaApy, 2)}`.padEnd(28)} │
│11. PHASE3 YIELD SPIKE Σ:     ${`${fmtUsd(yieldSpikeSumUsd)}`.padEnd(28)} │
│12. PHASE4 Δ SLIP @ $1M:      ${`${deltaSlip1m >= 0 ? "+" : ""}${fmtUsd(deltaSlip1m)}`.padEnd(28)} │
│13. PHASE4 IMPACT DROP $1M:   ${`${fmtPct(impactDrop1mPct, 2)}`.padEnd(28)} │
│14. PHASE6 BLOCK RATE Δ:      ${`+${fmtPct(vaasBlockRateDelta, 2)}`.padEnd(28)} │
│15. PHASE6 SaaS FEE Δ/yr:     ${`${fmtUsd(vaasSaasFeeAnnualized)}`.padEnd(28)} │
│16. PHASE5 Δ APY / SLIP:      ${`${phase5DeltaApy >= 0 ? "+" : ""}${fmtPct(phase5DeltaApy, 2)} / −${fmtUsd(phase5SlipCost)}`.padEnd(28)} │
│17. FULL-SPEC NET APY:        ${fmtPct(fullSpecNetApy, 2).padEnd(28)} │
│18. FULL-SPEC SLIP 30D:       ${`${fmtUsd(fullSpecSlip30d)}`.padEnd(28)} │
│19. FULL-SPEC $1M SLIP:       ${`${fmtUsd(fullSpecSlip1mStress)}`.padEnd(28)} │
│20. FULL-SPEC SHARPE / MDD:   ${`${fullSpecSharpe.toFixed(2)} / ${fmtPct(fullSpecMdd, 4)}`.padEnd(28)} │
│21. FULL-SPEC VAAS / SaaS:    ${`${fmtPct(fullSpecBlockRate, 2)} / ${fmtUsd(fullSpecSaasYr)}/yr`.padEnd(28)} │
│22. RUN-A NET APY (B1 Δ):     ${`${fmtPct(runANetApy, 2)} (+${fmtPct(batch1DeltaApy, 2)})`.padEnd(28)} │
│23. RUN-B NET APY / TVL+:     ${`${fmtPct(runBNetApy, 2)} / +${fmtUsd(ingressTvlUsd)}`.padEnd(28)} │
│24. RUN-C ULTIMATE APY:       ${fmtPct(runCNetApy, 2).padEnd(28)} │
│25. RUN-C SHARPE / MDD:       ${`${runCSharpe.toFixed(2)} / ${fmtPct(runCMdd, 4)}`.padEnd(28)} │
│26. RUN-C REV B2B+AFF/yr:     ${`${fmtUsd(runCCombinedRevYr)}/yr`.padEnd(28)} │
└────────────────────────────────────────────────────────────────────────┘
\`\`\`

---

## 6. Method Notes

1. **L1 truth:** \`fundingHistory\` (ETH/SOL/BTC), \`candleSnapshot\`, \`l2Book\`, \`metaAndAssetCtxs\`.
2. **Dual-Radar:** \`HLRadarEvaluator\` — degrade if composite < ${DEGRADE_THRESHOLD}.
3. **Isolation:** Phase 3 / 4 / 5 / 6 each unlock exactly one weapon.
4. **Phase 5:** \`CrossAssetRotationService\` scores ETH/SOL/BTC by rate + $\\lambda\\cdot dF/dt$; charges ${rotationOn.rotationSlipBps} bps per switch.
5. **Full-Spec:** Rotation + AF + Full-30 slip + VaaS + Telemetry concurrent.
6. **Runs A/B/C:** Batch-1/2 stubs progressive — Lend/Affiliate/Shadow/ZSR → Gas/Ingress/Whale → Full Loaded.
7. **Disclaimer:** Historical L2 unavailable; VaaS orders synthetic off radar degrade; Batch stubs are pure sims.

---

*SilverVine Labs · BeΔ Living Water · Full Loaded Run C · BUSL-1.1 · \`:qum[x0sumx]\`*
`;`;`;
}
