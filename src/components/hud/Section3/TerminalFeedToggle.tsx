import type { ReactNode } from "react";

export interface TerminalFeedToggleProps {
  feedPaused: boolean;
  isRevoked?: boolean;
  onToggleFeed: () => void;
}

export function TerminalFeedToggle({
  feedPaused,
  isRevoked = false,
  onToggleFeed,
}: TerminalFeedToggleProps): ReactNode {
  return (
    <button
      type="button"
      data-testid="toggle-terminal-feed"
      onClick={onToggleFeed}
      disabled={isRevoked}
      className={[
        "shrink-0 rounded border px-1.5 py-0.5 text-[10px] font-semibold",
        isRevoked
          ? "cursor-not-allowed border-red-500/50 bg-red-950/40 text-red-300 opacity-90"
          : "border-zinc-600/60 bg-zinc-900/60 text-zinc-300 hover:bg-zinc-800/60",
      ].join(" ")}
    >
      {isRevoked
        ? "[ 🔴 LOCKED ]"
        : feedPaused
          ? "[ ▶️ RESUME STREAM ]"
          : "[ ⏸️ PAUSE STREAM / LOCK INSPECTION ]"}
    </button>
  );
}
