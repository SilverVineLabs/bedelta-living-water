import { fmtPct, fmtUsd } from "./survival-benchmark.utils";
import type { FullSpecRunsResult } from "./full-spec-runs";
import type { PhaseIsolationsResult } from "./phase-isolations";

export function logSurvivalSummary(input: {
  avgComposite: number;
  degradedCount: number;
  radarSlipSaved: number;
  sharpeEng: number;
  netApy: number;
  phases: PhaseIsolationsResult;
  fullSpec: FullSpecRunsResult;
}): void {
  const { phases, fullSpec } = input;
  console.log(
    `[survival] composite=${input.avgComposite.toFixed(2)} degrade=${input.degradedCount} radarSaved=${fmtUsd(input.radarSlipSaved)} sharpeEng=${input.sharpeEng.toFixed(2)} apy=${fmtPct(input.netApy, 2)}`,
  );
  console.log(
    `[phase3] baselineApy=${fmtPct(phases.baselineNetApy, 2)} afApy=${fmtPct(phases.afNetApy, 2)} deltaApy=${phases.deltaApy >= 0 ? "+" : ""}${fmtPct(phases.deltaApy, 2)} extraSubsidy=${fmtUsd(phases.afExtraSubsidyUsd)} spikeMax=${fmtUsd(phases.yieldSpikeMaxUsd)} bsHours=${phases.blackSwanHours} slipDelta=${fmtUsd(phases.deltaSlipSavedP3)}`,
  );
  console.log(
    `[phase4] slipΔ100=${fmtUsd(phases.deltaSlip100)} slipΔ1M=${fmtUsd(phases.deltaSlip1m)} impactDrop1M=${fmtPct(phases.impactDrop1mPct, 2)} costDrop1M=${fmtUsd(phases.costDrop1mUsd)} paths=${phases.fullPaths}`,
  );
  console.log(
    `[phase5] baseApy=${fmtPct(phases.phase5Base.baselineEthApy, 2)} rotApy=${fmtPct(phases.phase5Active.annualizedApy, 2)} deltaApy=${phases.phase5DeltaApy >= 0 ? "+" : ""}${fmtPct(phases.phase5DeltaApy, 2)} rotSlip=${fmtUsd(phases.phase5SlipCost)} rotations=${phases.phase5Active.rotations} netExtra=${fmtUsd(phases.phase5NetExtra)}`,
  );
  console.log(
    `[phase6] blockRate=${fmtPct(phases.vaasBlockRate, 2)} blockΔ=+${fmtPct(phases.vaasBlockRateDelta, 2)} blockedNotional=${fmtUsd(phases.vaasBlockedNotional)} saasWindow=${fmtUsd(phases.vaasSaasFeeUsd)} saasΔ/yr=${fmtUsd(phases.vaasSaasFeeAnnualized)}`,
  );
  console.log(
    `[fullspec] apy=${fmtPct(fullSpec.fullSpecNetApy, 2)} vsBase=${fullSpec.fullSpecVsBaseApy >= 0 ? "+" : ""}${fmtPct(fullSpec.fullSpecVsBaseApy, 2)} slip30d=${fmtUsd(fullSpec.fullSpecSlip30d)} slip1M=${fmtUsd(fullSpec.fullSpecSlip1mStress)} sharpe=${fullSpec.fullSpecSharpe.toFixed(2)} mdd=${fmtPct(fullSpec.fullSpecMdd, 4)} block=${fmtPct(fullSpec.fullSpecBlockRate, 2)} saas/yr=${fmtUsd(fullSpec.fullSpecSaasYr)} telemetry=${fmtUsd(fullSpec.telemetry.savedUsd)}`,
  );
  console.log(
    `[runA] apy=${fmtPct(fullSpec.runANetApy, 2)} b1Δ=+${fmtPct(fullSpec.batch1DeltaApy, 2)} lend=${fmtUsd(fullSpec.lendRes.interestUsd)} aff=${fmtUsd(fullSpec.affRes.reinvestedUsd)} shadow=${fmtUsd(fullSpec.shadowSlipSaved)} zsr=${fmtUsd(fullSpec.zsrRes.savedUsd)}`,
  );
  console.log(
    `[runB] apy=${fmtPct(fullSpec.runBNetApy, 2)} vsBase=${fullSpec.runBVsBaseApy >= 0 ? "+" : ""}${fmtPct(fullSpec.runBVsBaseApy, 2)} ingressTvl=+${fmtUsd(fullSpec.ingressTvlUsd)} gasSaved=${fmtUsd(fullSpec.gasSlipSaved)} whaleFund=${fmtUsd(fullSpec.whaleFundingUsd)} b2Δ=+${fmtPct(fullSpec.batch2DeltaApy, 2)}`,
  );
  console.log(
    `[runC] apy=${fmtPct(fullSpec.runCNetApy, 2)} vsBase=${fullSpec.runCVsBaseApy >= 0 ? "+" : ""}${fmtPct(fullSpec.runCVsBaseApy, 2)} sharpe=${fullSpec.runCSharpe.toFixed(2)} mdd=${fmtPct(fullSpec.runCMdd, 4)} slip30d=${fmtUsd(fullSpec.runCSlip30d)} slip1M=${fmtUsd(fullSpec.runCSlip1m)} block=${fmtPct(fullSpec.runCBlockRate, 2)} rev/yr=${fmtUsd(fullSpec.runCCombinedRevYr)}`,
  );
}
