import { useEffect, useState, type ReactNode } from "react";
import { formatSessionTtlRemaining } from "../session-ttl-format";

export interface TelemetryStatusBarProps {
  isRevoked?: boolean;
  ttlExpiryMs: number | null;
}

export function TelemetryStatusBar({
  isRevoked = false,
  ttlExpiryMs,
}: TelemetryStatusBarProps): ReactNode {
  const [ttlRemainingMs, setTtlRemainingMs] = useState(0);

  useEffect(() => {
    if (isRevoked || ttlExpiryMs == null) {
      setTtlRemainingMs(0);
      return undefined;
    }
    const tick = () => setTtlRemainingMs(Math.max(0, ttlExpiryMs - Date.now()));
    tick();
    const timer = window.setInterval(tick, 1_000);
    return () => window.clearInterval(timer);
  }, [ttlExpiryMs, isRevoked]);

  const ttlLabel =
    ttlExpiryMs == null
      ? "N/A"
      : formatSessionTtlRemaining(ttlRemainingMs, isRevoked);

  return (
    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 border-b border-zinc-800/80 px-3 py-2 text-[10px] text-zinc-400">
      <span>
        SystemState: {isRevoked ? "READ_ONLY_LOCKOUT" : "SINGLE_DIRECTIONAL_FLOW"}
      </span>
      <span className="text-zinc-600">|</span>
      <span
        data-testid="session-ttl-countdown"
        className={isRevoked ? "text-red-400" : undefined}
      >
        TTL: {ttlLabel}
      </span>
      <span className="text-zinc-600">|</span>
      <span className="text-emerald-400/90">rootProtection(): ARMED ($200 SL)</span>
    </div>
  );
}
