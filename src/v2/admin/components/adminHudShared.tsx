import { useState, type ReactNode } from "react";

export function formatCapital(usd: number): string {
  if (usd >= 1_000_000) return `$${(usd / 1_000_000).toFixed(0)}M`;
  if (usd >= 1_000) return `$${(usd / 1_000).toFixed(0)}k`;
  return `$${usd}`;
}

export function formatUsd(n: number): string {
  const sign = n > 0 ? "+" : n < 0 ? "" : "";
  return `${sign}$${n.toFixed(2)}`;
}

export function Tip({
  text,
  children,
  testId,
}: {
  text: string;
  children: ReactNode;
  testId?: string;
}) {
  const [pos, setPos] = useState<{ left: number; top: number } | null>(null);

  return (
    <span
      className="relative inline-flex max-w-full cursor-help"
      data-testid={testId}
      onMouseEnter={(e) => {
        const r = e.currentTarget.getBoundingClientRect();
        const tipW = 240;
        const left = Math.min(
          Math.max(r.left + r.width / 2, tipW / 2 + 8),
          window.innerWidth - tipW / 2 - 8,
        );
        const preferBelow = r.bottom + 8;
        const top =
          preferBelow + 80 > window.innerHeight
            ? Math.max(8, r.top - 8)
            : preferBelow;
        setPos({ left, top });
      }}
      onMouseLeave={() => setPos(null)}
      onFocus={(e) => {
        const r = e.currentTarget.getBoundingClientRect();
        setPos({
          left: r.left + r.width / 2,
          top: r.bottom + 8,
        });
      }}
      onBlur={() => setPos(null)}
    >
      {children}
      {pos ? (
        <span
          role="tooltip"
          className="pointer-events-none fixed z-[9999] w-60 -translate-x-1/2 rounded-lg border border-slate-500 bg-slate-950 px-3 py-2 text-left text-xs leading-relaxed text-slate-50 shadow-2xl"
          style={{
            left: pos.left,
            top: pos.top,
            transform: pos.top < 40 ? "translate(-50%, -100%)" : "translateX(-50%)",
          }}
        >
          {text}
        </span>
      ) : null}
    </span>
  );
}
