import { useState, type ReactNode } from "react";
import type { ScaleDownComboId } from "../scale-down-presets";
import { DEFAULT_SCALE_DOWN_COMBO } from "../scale-down-presets";
import { isCitadelChaosHardLocked, useCitadelChaosStore } from "../citadel-chaos-store";
import { Section2PresetMatrix } from "../../../v2/components/dashboard/Section2PresetMatrix";
import type { FullGrantAuditVenueView } from "./grant-audit-view-types";
import { CitadelChaosCircuitBanner } from "./CitadelChaosCircuitBanner";
import { Phase03Eip712DemoConsole } from "./Phase03Eip712DemoConsole";

export interface Phase03DefenseProps {
  view: FullGrantAuditVenueView;
}

const noop = (): void => undefined;

export function Phase03Defense({ view }: Phase03DefenseProps): ReactNode {
  const chaosMode = useCitadelChaosStore();
  const chaosHardLocked = isCitadelChaosHardLocked(chaosMode);
  const [, setCombo] = useState<ScaleDownComboId>(DEFAULT_SCALE_DOWN_COMBO);

  return (
    <section
      className="grant-audit-v0-matrix-card flex h-full flex-col gap-5 rounded-lg border border-border bg-card p-5"
      data-testid="grant-audit-phase-03-defense"
    >
      <div className="flex items-center gap-3">
        <span className="rounded border border-primary/40 bg-primary/10 px-2 py-1 font-mono text-[10px] font-semibold tracking-widest text-primary">
          PHASE 03
        </span>
        <h2 className="text-pretty font-mono text-sm font-semibold uppercase tracking-wide text-foreground">
          Santenmoku {view.defenseRoots}-Root Defense Matrix
        </h2>
      </div>
      <CitadelChaosCircuitBanner mode={chaosMode} />
      <Section2PresetMatrix
        matrixDetails={{}}
        chaosHardLocked={chaosHardLocked}
        onComboChange={setCombo}
        onExportAuditCertificate={noop}
        onExportDryRunPlaybook={noop}
        onExportFailClosedProofs={noop}
        embeddedInPhase
      />
      <Phase03Eip712DemoConsole />
    </section>
  );
}
