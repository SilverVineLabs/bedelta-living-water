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

import { buildRadarSection } from "./report-template-radar";
import { buildPhasesSection } from "./report-template-phases";
import { buildMetricsSection } from "./report-template-metrics";

export function buildSurvivalMarkdown(ctx: SurvivalReportContext): string {
  return [
    buildRadarSection(ctx),
    buildPhasesSection(ctx),
    buildMetricsSection(ctx),
  ].join("");
}
