import type { ReactNode } from "react";
import { ScaleDownCombobox } from "../../../components/hud/ScaleDownCombobox";
import type { ScaleDownComboId } from "../../../components/hud/scale-down-presets";
import { GLACIER_BADGE_CORE_CLASS } from "../../../components/hud/glacier-badge-styles";
import { GMX_DATASTORE_BREAKER_BADGE } from "../../../components/hud/Section1/section1-tooltip-styles";
import { GRANT_VITEST_SSOT_LABEL } from "../../../components/hud/grant-ui-ssot";

export interface Section2PresetMatrixProps {
  matrixDetails: Record<string, boolean>;
  chaosHardLocked?: boolean;
  onComboChange: (combo: ScaleDownComboId) => void;
  onExportAuditCertificate: () => void;
  onExportDryRunPlaybook: () => void;
  onExportFailClosedProofs: () => void;
  embeddedInPhase?: boolean;
}

export function Section2PresetMatrix({
  matrixDetails,
  chaosHardLocked = false,
  onComboChange,
  onExportAuditCertificate,
  onExportDryRunPlaybook,
  onExportFailClosedProofs,
  embeddedInPhase = false,
}: Section2PresetMatrixProps): ReactNode {
  const exportToolbarBtn = (tone: "cyan" | "purple" | "emerald") => {
    const tones = {
      cyan: "border-[#1d2842] bg-[#101626] text-[#e2e8f0] hover:border-[#2d42fc]/45",
      purple: "border-[#1d2842] bg-[#101626] text-[#e2e8f0] hover:border-[#2d42fc]/45",
      emerald: "border-[#1d2842] bg-[#101626] text-[#e2e8f0] hover:border-[#2d42fc]/45",
    } as const;
    return [
      "inline-flex max-w-full shrink-0 rounded border px-2 py-1.5 font-data text-[10px] font-semibold",
      "whitespace-normal text-left leading-snug transition-colors",
      tones[tone],
    ].join(" ");
  };

  return (
    <div
      className="flex flex-col space-y-3"
      aria-label="Section 2: Santenmoku Preset and Defense Matrix"
      data-testid="scale-down-v08-rail"
    >
      <div className="flex items-center gap-3">
        {embeddedInPhase ? null : (
          <p className="font-data text-[10px] uppercase tracking-[0.22em] text-[#94a3b8]">
            [ SECTION 2: SANTENMOKU PRESET &amp; DEFENSE MATRIX ]
          </p>
        )}
      </div>
      <p
        className={[
          "inline-flex items-center gap-1.5 rounded px-3 py-1",
          GLACIER_BADGE_CORE_CLASS,
        ].join(" ")}
        data-testid="matrix-vitest-ssot-badge"
      >
        [ ✓ {GRANT_VITEST_SSOT_LABEL} ]
      </p>
      <p
        className={[
          "inline-flex items-center gap-1.5 rounded px-3 py-1",
          GLACIER_BADGE_CORE_CLASS,
        ].join(" ")}
        data-testid="matrix-20-root-status-badge"
      >
        [ 🛡️ 20-ROOT MATRIX STATUS: 6/20 ACTIVE IN V0.8 | 14/20 ARMED FOR MAINNET ]
      </p>
      <p
        className={[
          "inline-flex items-center gap-1.5 rounded px-3 py-1 font-data text-xs font-extrabold",
          "border border-[#2d42fc]/50 bg-[#12172f] text-[#2d42fc] shadow-[0_0_12px_rgba(45,66,252,0.25)]",
        ].join(" ")}
        data-testid="matrix-gmx-datastore-breaker-badge"
      >
        {GMX_DATASTORE_BREAKER_BADGE}
      </p>
      <div
        className="flex flex-row flex-wrap items-stretch gap-2"
        data-testid="section2-public-good-export-toolbar"
      >
        <button
          type="button"
          data-testid="section2-export-audit-certificate"
          onClick={onExportAuditCertificate}
          className={exportToolbarBtn("cyan")}
        >
          [ 📜 Export SHA-256 Audit Certificate ]
        </button>
        <button
          type="button"
          data-testid="section2-export-dry-run-playbook"
          onClick={onExportDryRunPlaybook}
          className={exportToolbarBtn("purple")}
        >
          [ 🎮 Download Dry-Run Playbook JSON ]
        </button>
        <button
          type="button"
          data-testid="section2-export-fail-closed-proofs"
          onClick={onExportFailClosedProofs}
          className={exportToolbarBtn("emerald")}
        >
          [ 🛡️ Download Fail-Closed Proofs JSON ]
        </button>
      </div>
      <ScaleDownCombobox
        matrixDetails={matrixDetails}
        chaosHardLocked={chaosHardLocked}
        onComboChange={onComboChange}
      />
    </div>
  );
}
