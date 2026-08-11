import { useEffect, useRef, useState, type ReactNode } from "react";

type IndexDirection = "up" | "down" | "flat";

export interface TelemetryIndexValueProps {
  value: number;
  format?: (value: number) => string;
  className?: string;
  testId?: string;
}

export function TelemetryIndexValue({
  value,
  format,
  className = "",
  testId,
}: TelemetryIndexValueProps): ReactNode {
  const prev = useRef(value);
  const [direction, setDirection] = useState<IndexDirection>("flat");
  const [pulse, setPulse] = useState(false);

  useEffect(() => {
    if (value === prev.current) return;
    setDirection(value > prev.current ? "up" : value < prev.current ? "down" : "flat");
    prev.current = value;
    setPulse(true);
    const timer = window.setTimeout(() => setPulse(false), 900);
    return () => window.clearTimeout(timer);
  }, [value]);

  const tone =
    direction === "up"
      ? "text-emerald-400"
      : direction === "down"
        ? "text-red-400"
        : "text-foreground";
  const display = format ? format(value) : String(value);

  return (
    <span
      data-testid={testId}
      className={[
        "inline-flex items-baseline gap-1 tabular-nums transition-colors duration-500",
        pulse ? tone : "text-foreground",
        pulse ? "animate-pulse" : "",
        className,
      ].join(" ")}
      aria-live="polite"
    >
      {pulse && direction === "up" ? (
        <span className="text-[10px] text-emerald-400" aria-hidden="true">
          ▲
        </span>
      ) : null}
      {pulse && direction === "down" ? (
        <span className="text-[10px] text-red-400" aria-hidden="true">
          ▼
        </span>
      ) : null}
      {display}
    </span>
  );
}
