/** BeDeltaLivingWater DApp top navigation — institutional dark HUD header. */
import type { ReactNode } from "react";
import {
  GMX_ACCENT_TEXT_CLASS,
  GMX_CITADEL_ACCENT_BORDER_CLASS,
  GMX_MUTED_TEXT_CLASS,
  GMX_OFFWHITE_TEXT_CLASS,
} from "./hud/gmx-citadel-theme";

export interface HeaderNavTelemetry {
  protocolState: string;
  edgeLatencyLabel: string;
  workerHeadroomLabel: string;
}

export interface HeaderNavProps {
  className?: string;
  title?: string;
  subtitle?: string;
  logoSrc?: string;
  logoAlt?: string;
  telemetry: HeaderNavTelemetry;
  poweredByLabel?: string;
  connectLabel?: string;
  walletConnected?: boolean;
  walletLabel?: string;
  isConnecting?: boolean;
  onConnectWallet?: () => void;
  onDisconnectWallet?: () => void;
}

const DEFAULT_LOGO_SRC = "/brand/Logo_BeDeltaLivingWater.png";

function LiveMetric({ label, value }: { label: string; value: string }): ReactNode {
  return (
    <div className="flex min-w-0 flex-col items-center gap-0.5 px-2 py-1 sm:px-3">
      <span className={`font-mono text-[9px] uppercase tracking-widest ${GMX_MUTED_TEXT_CLASS}`}>
        {label}
      </span>
      <span
        className={`max-w-[11rem] truncate font-mono text-[11px] font-semibold sm:max-w-none ${GMX_OFFWHITE_TEXT_CLASS}`}
        title={value}
      >
        {value}
      </span>
    </div>
  );
}

export function HeaderNav({
  className = "",
  title = "BeDeltaLivingWater",
  subtitle = "BDLW v1.0",
  logoSrc = DEFAULT_LOGO_SRC,
  logoAlt = title,
  telemetry,
  poweredByLabel = "Powered by SliverVine Citadel CaaS",
  connectLabel = "Connect Smart Account (ZeroDev Session Key)",
  walletConnected = false,
  walletLabel,
  isConnecting = false,
  onConnectWallet,
  onDisconnectWallet,
}: HeaderNavProps): ReactNode {
  const walletActionLabel = walletConnected
    ? walletLabel ?? "Smart Account Connected"
    : isConnecting
      ? "Connecting…"
      : connectLabel;

  return (
    <header
      className={`border-b border-[#1d2842] bg-[#090d16]/95 backdrop-blur-sm ${className}`}
      data-testid="bdlw-header-nav"
    >
      <div className="mx-auto flex max-w-[1400px] flex-wrap items-center justify-between gap-3 px-3 py-2.5 sm:gap-4 sm:px-4">
        <div className="flex min-w-0 items-center gap-2.5 sm:gap-3">
          <img
            src={logoSrc}
            alt={logoAlt}
            width={40}
            height={40}
            className="h-9 w-9 shrink-0 rounded-sm border border-[#2d42fc]/25 object-contain shadow-[0_0_12px_rgba(45,66,252,0.2)] sm:h-10 sm:w-10"
            data-testid="bdlw-header-logo"
          />
          <div className="min-w-0">
            <p className={`truncate font-mono text-sm font-semibold sm:text-base ${GMX_ACCENT_TEXT_CLASS}`}>
              {title}
            </p>
            <p className={`font-mono text-[10px] tracking-[0.18em] uppercase ${GMX_MUTED_TEXT_CLASS}`}>
              {subtitle}
            </p>
          </div>
        </div>

        <div
          className={`order-3 flex w-full flex-wrap items-center justify-center gap-1 rounded border bg-[#101626]/90 px-2 py-1 sm:order-none sm:w-auto sm:flex-nowrap sm:gap-0 ${GMX_CITADEL_ACCENT_BORDER_CLASS}`}
          data-testid="bdlw-live-status-badge"
          role="status"
          aria-live="polite"
        >
          <span
            className="mr-1 hidden h-2 w-2 shrink-0 animate-pulse rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.75)] sm:inline-block"
            aria-hidden
          />
          <LiveMetric label="Protocol State" value={telemetry.protocolState} />
          <span className="hidden h-8 w-px bg-[#1d2842] sm:block" aria-hidden />
          <LiveMetric label="Edge Latency" value={telemetry.edgeLatencyLabel} />
          <span className="hidden h-8 w-px bg-[#1d2842] sm:block" aria-hidden />
          <LiveMetric label="Worker Headroom" value={telemetry.workerHeadroomLabel} />
        </div>

        <div className="flex min-w-0 flex-col items-end gap-1.5 sm:gap-2">
          <span
            className={`max-w-[14rem] text-right font-mono text-[9px] leading-tight tracking-wide uppercase sm:max-w-none sm:text-[10px] ${GMX_MUTED_TEXT_CLASS}`}
            data-testid="bdlw-powered-by-badge"
          >
            {poweredByLabel}
          </span>
          <button
            type="button"
            data-testid="bdlw-wallet-connect-button"
            disabled={isConnecting}
            onClick={walletConnected ? onDisconnectWallet : onConnectWallet}
            className={[
              "max-w-[16rem] truncate rounded border px-2.5 py-1.5 font-mono text-[10px] font-semibold transition-colors sm:max-w-xs sm:text-[11px]",
              walletConnected
                ? "border-emerald-500/45 bg-emerald-950/30 text-emerald-200 hover:border-emerald-400/60"
                : "border-[#2d42fc]/55 bg-[#2d42fc]/15 text-[#e2e8f0] shadow-[0_0_14px_rgba(45,66,252,0.25)] hover:bg-[#2d42fc]/25",
              isConnecting ? "cursor-wait opacity-70" : "",
            ].join(" ")}
            aria-busy={isConnecting}
          >
            {walletActionLabel}
          </button>
        </div>
      </div>
    </header>
  );
}

export default HeaderNav;
