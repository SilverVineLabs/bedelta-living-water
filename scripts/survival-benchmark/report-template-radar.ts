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

export function buildRadarSection(ctx: SurvivalReportContext): string {
  const {
    spanDays,
    avgPrimary,
    avgSecondary,
    avgComposite,
    minComposite,
    maxComposite,
    latest,
    avgS,
    ethMeta,
    ticks,
    degraded,
    hudCounts,
    radarSlipSaved,
  } = ctx;
  return `# BeΔ Living Water — Survival Benchmark Report

**Product:** BeDeltaLivingwater (BeΔ Living Water)  
**Data source:** Hyperliquid Mainnet L1 (\`${HL_INFO_URL}\`) + Binance USDT-M basis  
**Asset:** ETH-PERP / USDC quote  
**Window:** last ~${spanDays.toFixed(1)} days (requested 30D)  
**Generated:** ${isoNow()}  
**Primary notional:** ${fmtUsd(NOTIONAL_USD)} Δ-neutral hedge open  
**Stress notional:** ${fmtUsd(STRESS_NOTIONAL_USD)} (depth stress)  
**Isolation runs:** Phase 3 / 4 / 5 / 6 independent · **+ Full-Spec Ultimate** · **+ Runs A/B/C (Batch stubs)**

---

## 0. HL Custom Dual-Radar (5-Sensor) Risk Engine

\`\`\`
               【SliverVine HL Dynamic Risk Matrix (100%)】
                                  │
     ┌────────────────────────────┴────────────────────────────┐
     ▼                                                         ▼
【Primary Radar 60%】                                   【Secondary Radar 40%】
├─ S1 Orderbook Cancel/Fill + Micro-spread (30%)        ├─ S4 Top-20 ΔP_liq (50%)
├─ S2 Funding Slope dF/dt + d²F/dt² (40%)               └─ S5 HL↔Binance Basis z (50%)
└─ S3 Soil Resistance Depth Index (30%)
\`\`\`

| Layer | Weight | Avg Score (0–100) |
|-------|--------|-------------------|
| Primary Radar | 60% | ${avgPrimary.toFixed(2)} |
| Secondary Radar | 40% | ${avgSecondary.toFixed(2)} |
| **Composite Safety Score** | 100% | **${avgComposite.toFixed(2)}** |
| Composite min / max | | ${minComposite.toFixed(2)} / ${maxComposite.toFixed(2)} |
| Latest composite | | ${latest.composite.toFixed(2)} → HUD \`${latest.hudState}\` · CRI ${latest.systemState.currentCri} |

### Sensor breakdown (30D mean)

| Sensor | Radar | Intra-weight | Mean score | Role |
|--------|-------|--------------|------------|------|
| S1 Cancel-to-Fill / Micro-spread | Primary | 30% | ${avgS.s1.toFixed(2)} | MM vacuum / spread expansion |
| S2 Funding slope & accel | Primary | 40% | ${avgS.s2.toFixed(2)} | Leverage emotion kink |
| S3 Soil Resistance Depth | Primary | 30% | ${avgS.s3.toFixed(2)} | \`checkSoilResistance()\` |
| S4 Top-20 Whale ΔP_liq | Secondary | 50% | ${avgS.s4.toFixed(2)} | Cascade distance (maxLev=${ethMeta.maxLeverage}x) |
| S5 HL vs Binance basis z | Secondary | 50% | ${avgS.s5.toFixed(2)} | Cross-venue curvature |

### Degrade gate (Composite < ${DEGRADE_THRESHOLD})

| Metric | Value |
|--------|-------|
| Hours evaluated | ${ticks.length} |
| Degrade events | **${degraded.length}** (${fmtPct(degraded.length / Math.max(ticks.length, 1), 2)} of window) |
| SystemState HUD histogram | ${Object.entries(hudCounts).map(([k, v]) => `\`${k}\`:${v}`).join(" · ") || "—"} |
| **SLI-TWAP slippage saved on degrade** | **${fmtUsd(radarSlipSaved)}** |
| Latest degrade? | ${latest.degraded ? "YES — SystemState downgraded" : "NO — clear"} |

> When composite < ${DEGRADE_THRESHOLD}, \`buildSystemState({ currentCri: composite })\` downgrades HUD and SLI-TWAP savings are accrued vs market sweep (live L2 × stress multiplier).
`;
}
