import { useSyncExternalStore, useState, type ReactNode } from "react";
import {
  CITADEL_CHAOS_LABEL,
  getCitadelChaosMode,
  setCitadelChaosMode,
  subscribeCitadelChaos,
  toggleCitadelChaosMode,
  type CitadelChaosMode,
} from "../../citadel-chaos-store";
import { SOIL_CHECK_DELAY_MS } from "../section1-hud-types";
import { runChaosRpcDelayProbe } from "../section1-hud-engine-lib/section1-hud-engine-core";
import type { SoilResistanceLogEntry } from "../section1-hud-types";

export interface ChaosRpcDelayInjectorProps {
  disabled?: boolean;
  chaosTripped?: boolean;
  onChaosTrip?: (payload: {
    soilLog: SoilResistanceLogEntry;
    terminalLine: string;
  }) => void;
  onChaosReset?: () => void;
}

const CITADEL_MODES: CitadelChaosMode[] = ["sequencer_down", "oracle_lag_deadlock"];

export function ChaosRpcDelayInjector({
  disabled = false,
  chaosTripped = false,
  onChaosTrip,
  onChaosReset,
}: ChaosRpcDelayInjectorProps): ReactNode {
  const [pending, setPending] = useState(false);
  const [tripLine, setTripLine] = useState<string | null>(null);
  const citadelChaos = useSyncExternalStore(subscribeCitadelChaos, getCitadelChaosMode, getCitadelChaosMode);

  const handleClick = () => {
    if (disabled || pending) return;
    if (chaosTripped) {
      setTripLine(null);
      setCitadelChaosMode(null);
      onChaosReset?.();
      return;
    }
    setPending(true);
    setTripLine(null);
    window.setTimeout(() => {
      const payload = runChaosRpcDelayProbe();
      setTripLine(`${payload.terminalLine} | tradeAllowed: false`);
      setPending(false);
      onChaosTrip?.(payload);
    }, SOIL_CHECK_DELAY_MS);
  };

  return (
    <div className="flex min-w-0 flex-col items-start gap-1">
      <button
        type="button"
        data-testid="action-inject-chaos-rpc-delay"
        disabled={disabled || pending}
        onClick={handleClick}
        className={[
          "rounded border font-data font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50",
          pending
            ? "animate-pulse border-amber-500/60 bg-amber-950/50 px-2 py-1 text-[10px] text-amber-200"
            : chaosTripped
              ? "border-purple-500/50 bg-purple-950/40 px-2 py-1 text-[10px] text-purple-200 hover:border-purple-400/70"
              : "border-red-500/50 bg-red-950/40 px-2 py-1 text-[10px] text-red-200 hover:border-red-400/70 hover:text-red-100",
        ].join(" ")}
      >
        {pending
          ? "[ ⏳ Simulating 500ms RPC Delay… ]"
          : chaosTripped
            ? "[ 🔄 Reset Chaos / MEV Injector ]"
            : "[ 💥 Inject 500ms RPC Delay / Simulated MEV ]"}
      </button>

      <div className="flex flex-wrap gap-1">
        {CITADEL_MODES.map((mode) => {
          const active = citadelChaos === mode;
          return (
            <button
              key={mode}
              type="button"
              data-testid={`citadel-chaos-${mode}`}
              disabled={disabled}
              onClick={() => toggleCitadelChaosMode(mode)}
              className={[
                "rounded border px-2 py-0.5 font-mono text-[9px] transition-colors disabled:opacity-50",
                active
                  ? "border-rose-400/70 bg-rose-950/50 text-rose-200"
                  : "border-zinc-600/60 bg-zinc-950/40 text-zinc-300 hover:border-rose-400/40",
              ].join(" ")}
            >
              {active ? "🔴 " : ""}
              {CITADEL_CHAOS_LABEL[mode]}
            </button>
          );
        })}
      </div>

      {citadelChaos ? (
        <p className="font-mono text-[9px] text-rose-300" data-testid="citadel-chaos-active-badge">
          [ 🔴 Citadel HUD · {CITADEL_CHAOS_LABEL[citadelChaos]} · live overlay ]
        </p>
      ) : null}

      {chaosTripped ? (
        <p className="max-w-full text-left font-mono text-[9px] leading-snug text-red-300" data-testid="chaos-trade-blocked-badge">
          [ 🔴 tradeAllowed: false · SOIL_RESISTANCE_TRIP ]
        </p>
      ) : null}
      {tripLine && !chaosTripped ? (
        <p className="max-w-full text-left font-mono text-[9px] leading-snug text-red-300" data-testid="chaos-soil-resistance-trip-line">
          {tripLine}
        </p>
      ) : null}
    </div>
  );
}
