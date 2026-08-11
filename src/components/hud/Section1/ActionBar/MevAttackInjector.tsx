import type { ReactNode } from "react";
import type { MevAttackInjectorProps } from "./types";

export function MevAttackInjector({
  disabled,
  mevAttackActive = false,
  onInjectMev,
}: MevAttackInjectorProps): ReactNode {
  const injectDisabled = !mevAttackActive && disabled;

  const label = mevAttackActive
    ? "[ 🔄 Reset MEV Attack ]"
    : "[ ☣️ Inject 15bps MEV Attack ]";

  return (
    <button
      type="button"
      data-testid="action-inject-mev"
      data-mev-preset-locked="false"
      disabled={injectDisabled}
      onClick={onInjectMev}
      className={
        mevAttackActive
          ? "self-end text-xs px-2.5 py-1 bg-purple-950/80 hover:bg-purple-900 text-purple-200 border border-purple-500 rounded-md font-mono transition-all animate-pulse disabled:cursor-not-allowed disabled:opacity-50"
          : "self-end text-xs px-2.5 py-1 bg-amber-950/60 hover:bg-amber-900/80 text-amber-300 border border-amber-700/60 rounded-md font-mono transition-all disabled:cursor-not-allowed disabled:opacity-50"
      }
    >
      {label}
    </button>
  );
}
