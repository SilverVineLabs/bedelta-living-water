// SliverVine Protocol v0.9 — Level 5 Emergency evacuation shield (public demo UI)
import { useEffect, useState, type ReactNode } from "react";
import {
  isEvacuationTriggered,
  isExplicitSanmEvacuationDemo,
  resolveSanmHudFrame,
  useSanmHudFrame,
  type SanmHudFrame,
} from "./hud/use-sanm-hud-frame";

export type { SanmHudFrame } from "./hud/use-sanm-hud-frame";
export {
  resolveSanmHudFrame,
  useSanmHudFrame,
  isEvacuationTriggered,
  isExplicitSanmEvacuationDemo,
};

export interface NirvanaEvacuationShieldProps {
  currentFrame?: SanmHudFrame;
  step?: number;
}

function emitEvacuationLogs(frame: SanmHudFrame): void {
  console.warn("[SliverVine] StatusRefreshed — FAIL_CLOSED latch engaged.");
  console.error(
    `[SliverVine] EmergencyJumped — statusCode=0x03 shutdown | minute=${frame.minute}`,
  );
  console.warn("[SliverVine] Atomic 0-entropy RWA evacuation sequence complete.");
}

export function NirvanaEvacuationShield({
  currentFrame,
  step,
}: NirvanaEvacuationShieldProps): ReactNode {
  const resolvedFrame = useSanmHudFrame(step);
  const frame = currentFrame ?? resolvedFrame;
  const [active, setActive] = useState(false);

  useEffect(() => {
    const triggered =
      isEvacuationTriggered(frame) &&
      (currentFrame != null || isExplicitSanmEvacuationDemo(step));
    setActive(triggered);
    if (triggered) emitEvacuationLogs(frame);
  }, [frame, currentFrame, step]);

  if (!active) return null;

  const metrics = frame.isomorphic_metrics;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-[#0a0a0b]/98 font-mono text-zinc-100"
      data-testid="nirvana-evacuation-shield"
      role="alertdialog"
      aria-label="Level 5 emergency evacuation active"
    >
      <div className="pointer-events-none absolute inset-0 bg-[repeating-linear-gradient(0deg,rgba(255,59,48,0.04)_0px,rgba(255,59,48,0.04)_1px,transparent_1px,transparent_3px)]" />

      <div className="relative mx-4 w-full max-w-2xl border border-red-600/50 bg-[#111113] p-8 shadow-[0_0_80px_rgba(220,38,38,0.35)]">
        <div className="mb-4 inline-flex items-center gap-2 border border-red-500 bg-red-950/80 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-red-400">
          <span className="h-2 w-2 animate-pulse rounded-full bg-red-500" />
          Level 5 Emergency — RWA Evacuation Active
        </div>

        <h2 className="mb-2 text-lg font-bold uppercase tracking-wide text-red-300">
          Circuit Breaker Tripped · Fail-Closed Engaged
        </h2>
        <p className="mb-6 text-xs leading-relaxed text-zinc-400">
          Off-chain sentinel reported non-linear market stress. SliverVineRiskOracle latched
          SHUTDOWN (statusCode 3). Ingress Safety Switch blocked institutional ingress.
          Wallet exposure was atomically rotated into 0-entropy RWA vault custody.
        </p>

        <dl className="mb-6 grid grid-cols-3 gap-3 border border-zinc-800 bg-black/60 p-4 text-xs">
          <div>
            <dt className="text-[9px] uppercase text-zinc-500">Stress Index</dt>
            <dd className="font-bold text-red-400">{(metrics.fci_index * 100).toFixed(2)}%</dd>
          </div>
          <div>
            <dt className="text-[9px] uppercase text-zinc-500">Drawdown Delta</dt>
            <dd className="font-bold text-red-400">{metrics.hawking_chronology_protection_delta.toFixed(2)}</dd>
          </div>
          <div>
            <dt className="text-[9px] uppercase text-zinc-500">Entropy Amplitude</dt>
            <dd className="font-bold text-red-400">{metrics.string_tension_amplitude.toFixed(4)}</dd>
          </div>
        </dl>

        <div className="border border-emerald-700/40 bg-emerald-950/20 px-4 py-3 text-center">
          <p className="text-xs font-bold uppercase tracking-wider text-emerald-400">
            0-Entropy RWA Vault Transfer — Confirmed
          </p>
          <p className="mt-1 text-[10px] text-zinc-500">
            System status: {frame.system_status} · Timeline minute: {frame.minute}
          </p>
        </div>
      </div>
    </div>
  );
}

export default NirvanaEvacuationShield;
