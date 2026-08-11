import type { ReactNode } from "react";
import { VerifiedTxTcaModal } from "../../admin/components/VerifiedTxTcaModal";
import { CitadelHeader } from "../dashboard/CitadelHeader";
import { DeadlockOverlay } from "../dashboard/DeadlockOverlay";
import { Section2PresetMatrix } from "../dashboard/Section2PresetMatrix";
import { Section1ActionBar } from "../../../components/hud/Section1/ActionBar/Section1ActionBar";
import { GrantAuditPage } from "../../../components/GrantAuditPage";
import { useGrantAuditRole } from "../../../components/useGrantAuditRole";
import { TraderDashboardActions } from "./TraderDashboardActions";
import { TraderDashboardConsole } from "./TraderDashboardConsole";
import {
  DEFAULT_DASHBOARD_VIEW_MODE,
  type ApiSyncState,
  type DashboardViewMode,
  type TraderDashboardProps,
} from "./trader-dashboard-types";
import { useTraderDashboardState } from "./useTraderDashboardState";

export type { ApiSyncState, DashboardViewMode, TraderDashboardProps };
export { DEFAULT_DASHBOARD_VIEW_MODE };

export function TraderDashboard({
  result: initialResult,
  liveView,
  apiSync,
}: TraderDashboardProps): ReactNode {
  const vm = useTraderDashboardState({ initialResult, liveView, apiSync });
  const [grantRole] = useGrantAuditRole();

  return (
    <div className="santen-shell font-hud relative min-h-screen overflow-y-auto overflow-x-hidden">
      <div>
        {grantRole !== "grant" ? (
          <CitadelHeader
            telemetryDisconnected={vm.telemetryDisconnected}
            demoRunning={vm.actionBar.demoRunning}
            liveRunning={vm.actionBar.liveRunning}
            walletConnected={vm.actionBar.walletConnected}
            sessionKeyBound={vm.actionBar.sessionKeyBound}
            sessionKeyRevoked={vm.sessionKeyRevoked}
            circuitBreakerTripped={vm.circuitBreakerTripped}
            isStale={vm.isStale}
            isLocked={vm.isLocked}
          />
        ) : null}

        <main className="trader-dashboard-main mx-auto mb-0 max-w-7xl space-y-0 px-4 py-6 pb-0 sm:px-6">
          <div data-testid="grant-citadel-panel">
            <GrantAuditPage />
          </div>

          {grantRole !== "grant" ? (
          <>
          <div
            className="mb-6 grid grid-cols-1 items-stretch gap-6 lg:grid-cols-2"
            data-testid="section1-section2-grid"
          >
            <TraderDashboardActions
              protocolVersion={vm.protocolVersion}
              mevAttackPhase={vm.mevAttackPhase}
              mevAttackToxicityBps={vm.mevAttackToxicityBps}
              baselineLossBpsOverride={vm.baselineLossBpsOverride}
              baselineAlarmFlash={vm.baselineAlarmFlash}
              section1ShakeActive={vm.section1ShakeActive}
              section1FocusActive={vm.section1FocusActive}
              forceUltraShield={vm.forceUltraShield}
              shieldDemoPulse={vm.shieldDemoPulse}
              savedBpsOverride={vm.savedBpsOverride}
              hasLive5TxProof={vm.hasLive5TxProof}
              liveProofSavedUsd={vm.liveProofSavedUsd}
              mevAttackDisabled={
                vm.actionBar.sessionKeyRevoked ||
                vm.actionBar.physicalDeadlock ||
                vm.actionBar.demoRunning ||
                vm.actionBar.liveRunning
              }
              onInjectMev={vm.actionBar.onInjectMev}
              onChaosRpcDelay={vm.onChaosRpcDelay}
              onChaosReset={vm.onChaosReset}
              chaosSoilTripped={vm.chaosSoilTripped}
            />
            <Section2PresetMatrix
              matrixDetails={vm.step1Result.matrixDetails}
              onComboChange={vm.handleComboChange}
              onExportAuditCertificate={vm.onExportAuditCertificate}
              onExportDryRunPlaybook={vm.onExportDryRunPlaybook}
              onExportFailClosedProofs={vm.onExportFailClosedProofs}
            />
          </div>
          <Section1ActionBar
            {...vm.actionBar}
            mevAttackActive={vm.mevAttackPhase !== "idle"}
          />
          <TraderDashboardConsole
            className="m-0 mb-0 p-0"
            terminalLogs={vm.terminalLogs}
            feedPaused={vm.feedPaused}
            sessionKeyRevoked={vm.sessionKeyRevoked}
            ttlExpiryMs={vm.ttlExpiryMs}
            onToggleFeed={() => vm.setFeedPaused((prev) => !prev)}
            inlineBanner={
              vm.deadlockProofToast ??
              vm.signatureCancelledBanner ??
              vm.mevToast ??
              vm.emergencyToast
            }
            inlineBannerTone={
              vm.signatureCancelledBanner
                ? "warning"
                : vm.emergencyToast
                  ? "error"
                  : "success"
            }
            batchResults={vm.selectedBatchResults}
            pulseHighlight={vm.terminalPulseActive}
          />
          </>
          ) : null}
        </main>

        <VerifiedTxTcaModal
          isOpen={vm.proofsModalOpen}
          locale="en"
          onClose={() => vm.setProofsModalOpen(false)}
        />
      </div>

      <DeadlockOverlay
        visible={vm.showHardlockModal}
        sessionKeyRevoked={vm.sessionKeyRevoked}
        selectedBatch={vm.selectedBatch}
        onDisconnect={vm.handleDeadlockDisconnect}
        onProofCopied={(toast) => {
          vm.setDeadlockProofToast(toast);
          window.setTimeout(() => vm.setDeadlockProofToast(null), 4_000);
        }}
      />

    </div>
  );
}

export default TraderDashboard;
