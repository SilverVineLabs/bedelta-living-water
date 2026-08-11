import { useState, type ReactNode } from "react";
import { TELEMETRY_API_COPY_COMMAND } from "./grant-ui-ssot";
import { useTelemetryHealthPing } from "./useTelemetryHealthPing";
import { useTelemetryAnalytics } from "./useTelemetryAnalytics";
import { PublicGoodDevGuidePanel } from "./PublicGoodDevGuidePanel";
import { PublicGoodPingBadge } from "./PublicGoodPingBadge";

export type PublicGoodTelemetryRadarVariant = "gate" | "inline";

export interface PublicGoodTelemetryRadarProps {
  variant?: PublicGoodTelemetryRadarVariant;
  focusHighlight?: boolean;
}

const GHOST_ACTION_CLASS = [
  "rounded border border-transparent bg-transparent px-2 py-0.5",
  "font-data text-[10px] font-medium text-zinc-500 transition-colors",
  "hover:border-zinc-700/50 hover:bg-zinc-900/40 hover:text-zinc-200",
].join(" ");

export function PublicGoodTelemetryRadar({
  variant = "inline",
  focusHighlight = false,
}: PublicGoodTelemetryRadarProps): ReactNode {
  const { pingMs, probeLive, isFailClosed } = useTelemetryHealthPing();
  const {
    preventedDrawdownUsd,
    toxicFillsBlockedPct,
    isSimulatedBenchmark,
    benchmarkImpactModelLabel,
    loading: analyticsLoading,
  } = useTelemetryAnalytics();
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);

  const isGate = variant === "gate";
  const failClosedActive = isFailClosed;

  const handleCopyApi = async () => {
    try {
      await navigator.clipboard.writeText(TELEMETRY_API_COPY_COMMAND);
      setCopyFeedback("Copied!");
      window.setTimeout(() => setCopyFeedback(null), 2_000);
    } catch {
      setCopyFeedback("Copy failed");
      window.setTimeout(() => setCopyFeedback(null), 2_000);
    }
  };

  const benchmarkLabel = isSimulatedBenchmark
    ? "SIMULATED BENCHMARK — ILLUSTRATIVE PREVENTED DRAWDOWN"
    : "PREVENTED DRAWDOWN";

  return (
    <div
      className={[
        "flex w-full min-w-0 flex-col gap-2 overflow-visible transition-all duration-700 ease-in-out",
        isGate ? "mx-auto items-center justify-center text-center" : "",
        focusHighlight
          ? "scale-[1.01] rounded-lg ring-4 ring-cyan-300/90 shadow-[0_0_36px_rgba(34,211,238,0.7),0_0_72px_rgba(34,211,238,0.4)]"
          : "",
      ].join(" ")}
      data-testid="public-good-telemetry-radar"
      data-variant={variant}
      data-focus-highlight={focusHighlight ? "true" : "false"}
    >
      <div
        className={[
          "flex w-full flex-col gap-2 overflow-visible rounded border px-3 py-2 font-data transition-all duration-700 ease-in-out",
          "bg-gradient-to-r from-cyan-950/30 via-zinc-950/40 to-emerald-950/25",
          focusHighlight
            ? "border-cyan-300 shadow-[0_0_28px_rgba(34,211,238,0.85),0_0_56px_rgba(34,211,238,0.45)]"
            : "border-cyan-500/30 shadow-[0_0_12px_rgba(34,211,238,0.08)]",
        ].join(" ")}
        data-testid="public-good-telemetry-banner"
      >
        <p
          className={[
            "w-full whitespace-normal break-words font-semibold leading-relaxed text-cyan-100/95",
            isGate ? "text-center text-xs sm:text-sm" : "text-[10px] sm:text-[11px]",
          ].join(" ")}
          data-testid="telemetry-prevented-drawdown-widget"
          aria-live="polite"
          title={benchmarkImpactModelLabel}
        >
          [ 🌐 PUBLIC GOOD TELEMETRY NODE · SHA-256 ANCHORED · 🛡️ {benchmarkLabel}:{" "}
          {preventedDrawdownUsd} USD | TOXIC FILLS BLOCKED:{" "}
          {analyticsLoading ? "—" : `${toxicFillsBlockedPct}%`} ]
        </p>

        <div
          className="flex w-full flex-row flex-wrap items-center justify-between gap-3"
          data-testid="telemetry-top-bar"
        >
          <PublicGoodPingBadge
            pingMs={pingMs}
            probeLive={probeLive}
            failClosedActive={failClosedActive}
            isGate={isGate}
          />
          <div
            className="flex flex-row flex-wrap items-center justify-end gap-2"
            data-testid="telemetry-action-row"
          >
            <button
              type="button"
              onClick={() => void handleCopyApi()}
              data-testid="copy-telemetry-api-button"
              className={GHOST_ACTION_CLASS}
            >
              [ 📋 Copy Telemetry API ]
            </button>
            {copyFeedback ? (
              <span
                className="font-data text-[10px] text-emerald-300"
                data-testid="copy-telemetry-feedback"
              >
                {copyFeedback}
              </span>
            ) : null}
            <PublicGoodDevGuidePanel isGate={isGate} actionButtonClass={GHOST_ACTION_CLASS} />
          </div>
        </div>
      </div>
    </div>
  );
}
