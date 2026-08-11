import type { ReactNode } from "react";
import { BatchHistoryDropdown } from "./BatchHistoryDropdown";
import { EmergencyRevokeButton } from "./EmergencyRevokeButton";
import { Eip712SignGuidanceBanner } from "./Eip712SignGuidanceBanner";
import { NonCustodialGuardBadge } from "./NonCustodialGuardBadge";
import { TwinEngineButtons } from "./TwinEngineButtons";
import { WalletConnectionBar } from "./WalletConnectionBar";
import type { Section1ActionBarProps } from "./types";

export type { Section1ActionBarProps } from "./types";

export function Section1ActionBar({
  batches,
  selectedBatchId,
  walletConnected,
  demoRunning,
  liveRunning,
  physicalDeadlock,
  sessionKeyRevoked,
  sessionKeyBound,
  ttlExpiryMs,
  mevAttackActive = false,
  onAutoDemo,
  onConnectOrExecute,
  onExportAudit,
  onExportAuditCertificate,
  onCopyGrantProof,
  onBatchSelect,
  onEmergencyRevoke,
  walletAddress = null,
  onDisconnectWallet,
}: Section1ActionBarProps): ReactNode {
  const rootProtectionLocked = sessionKeyRevoked;
  const signatureDeadlocked = physicalDeadlock || sessionKeyRevoked;
  const sessionKeyActive =
    walletConnected && sessionKeyBound && !sessionKeyRevoked && ttlExpiryMs != null;
  const autoDemoDisabled = demoRunning || liveRunning || mevAttackActive;
  const executeDisabled = signatureDeadlocked || autoDemoDisabled;
  const batchActionsDisabled =
    signatureDeadlocked || demoRunning || liveRunning || mevAttackActive;
  return (
    <div
      className="relative z-40 mb-0 mt-3 w-full overflow-visible border-y-2 border-double border-zinc-600/80 py-3 pb-0"
      data-testid="section1-action-bar"
    >
      <NonCustodialGuardBadge />
      {rootProtectionLocked ? (
        <p
          className="mb-2 rounded border border-red-500/70 bg-red-950/60 px-2 py-1.5 text-center font-data text-[10px] font-semibold text-red-200 shadow-[0_0_18px_rgba(239,68,68,0.35)]"
          data-testid="root-protection-overlay"
        >
          [ LOCKED BY ROOT PROTECTION ]
        </p>
      ) : physicalDeadlock ? (
        <p
          className="mb-2 rounded border border-red-500/60 bg-red-950/50 px-2 py-1.5 text-center font-data text-[10px] font-semibold text-red-300"
          data-testid="physical-deadlock-notice"
        >
          [ 🔒 KV-PERSISTED HARDLOCK — EIP-712 SIGNATURE CHANNEL SEVERED ]
        </p>
      ) : null}
      {walletConnected && walletAddress && onDisconnectWallet ? (
        <WalletConnectionBar
          walletAddress={walletAddress}
          sessionKeyActive={sessionKeyActive}
          onDisconnect={onDisconnectWallet}
        />
      ) : null}
      <EmergencyRevokeButton
        walletConnected={walletConnected}
        sessionKeyActive={sessionKeyActive}
        sessionKeyRevoked={sessionKeyRevoked}
        demoRunning={demoRunning}
        ttlExpiryMs={ttlExpiryMs}
        onEmergencyRevoke={onEmergencyRevoke}
      />
      {liveRunning && walletConnected ? <Eip712SignGuidanceBanner /> : null}
      <TwinEngineButtons
        disabled={autoDemoDisabled}
        executeDisabled={executeDisabled}
        signatureDeadlocked={signatureDeadlocked}
        walletConnected={walletConnected}
        onAutoDemo={onAutoDemo}
        onConnectOrExecute={onConnectOrExecute}
      />
      <BatchHistoryDropdown
        batches={batches}
        selectedBatchId={selectedBatchId}
        onBatchSelect={onBatchSelect}
        actionsDisabled={batchActionsDisabled}
        onExportAudit={onExportAudit}
        onExportAuditCertificate={onExportAuditCertificate}
        onCopyGrantProof={onCopyGrantProof}
        walletAddress={walletAddress}
      />
    </div>
  );
}
