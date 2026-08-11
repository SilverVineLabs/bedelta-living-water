import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  SECTION1_TOOLTIP_BODY_CLASS,
} from "../Section1/section1-tooltip-styles";
import { GLACIER_BADGE_CORE_CLASS } from "../glacier-badge-styles";
import { TERMINAL_LEVEL_CLASS, type TerminalLogLine } from "./terminal-log";

export interface DualColumnLogPanelProps {
  title: string;
  titleClassName?: string;
  logs: readonly TerminalLogLine[];
  headerTag?: string;
  headerTagTooltip?: string;
  pulsingLogId?: string | null;
  streamLocked?: boolean;
  testId: string;
}

export function DualColumnLogPanel({
  title,
  titleClassName = "text-zinc-400",
  logs,
  headerTag,
  headerTagTooltip,
  pulsingLogId = null,
  streamLocked = false,
  testId,
}: DualColumnLogPanelProps): ReactNode {
  const listRef = useRef<HTMLUListElement>(null);
  const [headerTagOpen, setHeaderTagOpen] = useState(false);
  const reversed = [...logs].reverse();

  useEffect(() => {
    if (streamLocked || !listRef.current) return;
    listRef.current.scrollTop = 0;
  }, [logs.length, streamLocked]);

  return (
    <div
      className="flex min-h-[11rem] flex-1 flex-col border border-zinc-800/80 bg-zinc-950/40"
      data-testid={testId}
    >
      <div className="sticky top-0 z-20 border-b border-zinc-800/80 bg-zinc-950/90 px-2 py-1.5 backdrop-blur">
        <p className={`font-data text-[9px] font-semibold uppercase tracking-[0.16em] ${titleClassName}`}>
          {title}
        </p>
        {headerTag ? (
          <div className="group/risk relative mt-1 flex items-center gap-1">
            <p
              className={[
                "inline-flex items-center gap-1.5 rounded px-3 py-1",
                GLACIER_BADGE_CORE_CLASS,
              ].join(" ")}
              data-testid="section3-risk-check-overhead-tag"
            >
              {headerTag}
            </p>
            {headerTagTooltip ? (
              <>
                <button
                  type="button"
                  aria-label="Execution overhead probe details"
                  aria-expanded={headerTagOpen}
                  data-testid="section3-risk-check-overhead-info-trigger"
                  onClick={() => setHeaderTagOpen((prev) => !prev)}
                  className="cursor-help rounded px-0.5 text-[10px] text-black transition-colors hover:text-black/80"
                >
                  ℹ️
                </button>
                <div
                  role="tooltip"
                  data-testid="section3-risk-check-overhead-tooltip"
                  className={[
                    "pointer-events-none absolute left-0 top-full mt-1 hidden w-80 rounded border border-zinc-700 bg-zinc-950/95 p-3 font-data text-[9px] leading-relaxed text-zinc-300 shadow-xl",
                    headerTagOpen
                      ? "block"
                      : "group-hover/risk:block group-focus-within/risk:block",
                  ].join(" ")}
                >
                  <span className={SECTION1_TOOLTIP_BODY_CLASS}>{headerTagTooltip}</span>
                </div>
              </>
            ) : null}
          </div>
        ) : null}
      </div>
      <ul
        ref={listRef}
        className="max-h-44 flex-1 space-y-0 overflow-y-auto px-2 py-2"
        role="log"
      >
        {reversed.map((line) => (
          <li
            key={line.id}
            data-log-id={line.id}
            className={[
              "rounded px-1 py-1 text-[10px] leading-relaxed tabular-nums transition-colors duration-300",
              pulsingLogId === line.id
                ? "bg-emerald-500/20 ring-1 ring-emerald-500/60 animate-pulse"
                : "",
            ].join(" ")}
          >
            <span className="text-zinc-600">[{line.timestamp}]</span>{" "}
            <span className={TERMINAL_LEVEL_CLASS[line.level]}>[{line.level}]</span>{" "}
            <span
              className={
                line.message.includes("[TCA-ANCHOR]")
                  ? "text-amber-300"
                  : "text-zinc-300"
              }
            >
              {line.message}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
