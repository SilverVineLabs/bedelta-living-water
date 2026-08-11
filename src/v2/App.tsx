import { useEffect, useState } from "react";
import {
  TraderDashboard,
  DEFAULT_DASHBOARD_VIEW_MODE,
} from "./components/TraderDashboard";
import { ClientOnly } from "./components/ClientOnly";
import { TerminalBootScreen } from "./components/TerminalBootScreen";
import { TerminalErrorBoundary } from "./components/TerminalErrorBoundary";
import { useMatrixApi } from "./hooks/useMatrixApi";
import { clientNowMs, isBrowser } from "./lib/client-runtime";
import { runStep1Scan } from "./services/step1-engine";
import {
  buildLiveDashboardViewModel,
  mergeStep1WithApiSnapshot,
} from "./services/live-dashboard";
import { STEP1_ROOT_KEYS, type Step1ScanResult } from "./types/step1";
import { DEFAULT_DVOL, DEFAULT_VIX } from "../services/config";
import { calculateRiskScoreFromTrippedRoots } from "./services/risk-engine";

const EXPERT_MOCK_XP = 85;

function buildInitialResult(nowMs = clientNowMs()): Step1ScanResult {
  const matrixDetails = Object.fromEntries(
    STEP1_ROOT_KEYS.map((key) => [key, true]),
  ) as Step1ScanResult["matrixDetails"];

  return {
    status: "SAFE",
    primaryMode: "EXPERT",
    maxLossUSD: 200,
    risk_score: calculateRiskScoreFromTrippedRoots([]),
    timestamp: nowMs,
    matrixDetails,
  };
}

export interface AppProps {
  initialResult?: Step1ScanResult;
  isMockMode?: boolean;
}

export function App({
  initialResult,
  isMockMode = false,
}: AppProps): React.ReactNode {
  const [step1Result, setStep1Result] = useState<Step1ScanResult>(
    () => initialResult ?? buildInitialResult(),
  );
  const [bootstrapping, setBootstrapping] = useState(
    () => isBrowser() && !isMockMode,
  );
  const [boundaryKey, setBoundaryKey] = useState(0);

  const { snapshot, loading, error, refresh } = useMatrixApi({
    enabled: isBrowser() && !isMockMode,
  });

  useEffect(() => {
    if (!isBrowser()) return;

    let cancelled = false;

    void (async () => {
      if (isMockMode) {
        setBootstrapping(false);
        return;
      }

      setBootstrapping(true);
      try {
        const scan = await runStep1Scan(undefined);
        if (!cancelled) setStep1Result(scan);
      } finally {
        if (!cancelled) setBootstrapping(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isMockMode]);

  const mergedStep1 = mergeStep1WithApiSnapshot(step1Result, snapshot);
  const liveView = buildLiveDashboardViewModel(
    mergedStep1,
    snapshot,
    DEFAULT_VIX,
    DEFAULT_DVOL,
  );

  const bootMessage = bootstrapping
    ? "Bootstrapping Santenmoku defense scan…"
    : "Initializing BeΔ Living Water terminal…";

  return (
    <ClientOnly fallback={<TerminalBootScreen message={bootMessage} />}>
      {bootstrapping ? (
        <TerminalBootScreen message={bootMessage} />
      ) : (
        <TerminalErrorBoundary
          key={boundaryKey}
          title="Trader Dashboard — Fault Isolation"
          onReset={() => setBoundaryKey((value) => value + 1)}
        >
          <TraderDashboard
            result={mergedStep1}
            isMockMode={isMockMode}
            viewMode={DEFAULT_DASHBOARD_VIEW_MODE}
            defaultViewMode={DEFAULT_DASHBOARD_VIEW_MODE}
            defaultVix={liveView.vix}
            defaultDvol={liveView.dvol}
            liveView={liveView}
            apiSync={{
              loading,
              error,
              refresh: () => void refresh(),
              pairCount: liveView.matrixRows.length,
            }}
            mockScanConfig={
              isMockMode
                ? {
                    isMockMode: true,
                    mockUserXP: EXPERT_MOCK_XP,
                    mockGeoCountry: "HK",
                    mockIsUSMarketOpenWindow: false,
                    mockVix: DEFAULT_VIX,
                    mockAccountEquityUsd: 10_000,
                    mockUserTxCount: 25,
                  }
                : undefined
            }
            onBootstrapScan={runStep1Scan}
          />
        </TerminalErrorBoundary>
      )}
    </ClientOnly>
  );
}

export default App;
