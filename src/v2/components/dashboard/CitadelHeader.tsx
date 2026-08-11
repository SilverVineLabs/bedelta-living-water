import type { ReactNode } from "react";
import { HlProtocolRadar } from "../../../components/hud/HlProtocolRadar";
import {
  resolveHlProtocolRadar,
  type HlProtocolRadarInput,
} from "../../../components/hud/hl-protocol-radar";

import {
  SILVERVINE_HUD_DAPP_NODE_URL,
  SILVERVINE_PROTOCOL_SHIELD_URL,
} from "../../../components/hud/grant-ui-ssot";
import { GMX_ACCENT_TEXT_CLASS } from "../../../components/hud/gmx-citadel-theme";
import { DeltaNeutralLabel } from "../../../components/ui/brand-delta-ui";

const SILVERVINE_LABS_URL = SILVERVINE_PROTOCOL_SHIELD_URL;

export interface CitadelHeaderProps {
  telemetryDisconnected: boolean;
  demoRunning: boolean;
  liveRunning: boolean;
  walletConnected: boolean;
  sessionKeyBound: boolean;
  sessionKeyRevoked: boolean;
  circuitBreakerTripped: boolean;
  isStale: boolean;
  isLocked: boolean;
}

function resolveTelemetryStatusLabel({
  telemetryDisconnected,
  demoRunning,
  walletConnected,
}: Pick<
  CitadelHeaderProps,
  "telemetryDisconnected" | "demoRunning" | "walletConnected"
>): { label: string; simulation: boolean } {
  const onChainActive =
    !telemetryDisconnected && !demoRunning && walletConnected;

  if (onChainActive) {
    return {
      label: "[ 🟢 TELEMETRY: LIVE L2 TESTNET STREAM ]",
      simulation: false,
    };
  }

  return {
    label: "[ 🟡 TELEMETRY: SIMULATION MODEL ]",
    simulation: true,
  };
}

function resolveL2AdapterMode(
  simulation: boolean,
  radarInput: HlProtocolRadarInput,
): "standby" | "active" | "degraded" {
  if (simulation) return "standby";
  const indicators = resolveHlProtocolRadar(radarInput);
  const activeCount = indicators.filter((item) => item.status !== "STANDBY").length;
  return activeCount === indicators.length ? "active" : "degraded";
}

export function CitadelHeader({
  telemetryDisconnected,
  demoRunning,
  liveRunning: _liveRunning,
  walletConnected,
  sessionKeyBound: _sessionKeyBound,
  sessionKeyRevoked,
  circuitBreakerTripped,
  isStale,
  isLocked,
}: CitadelHeaderProps): ReactNode {
  const telemetry = resolveTelemetryStatusLabel({
    telemetryDisconnected,
    demoRunning,
    walletConnected,
  });

  const radarInput: HlProtocolRadarInput = {
    sessionKeyActive:
      !sessionKeyRevoked && !circuitBreakerTripped && !isStale,
    signingChannelOpen: !sessionKeyRevoked && !circuitBreakerTripped,
    twapShieldActive: true,
    marginTierHealthy: !isLocked,
  };

  const l2AdapterMode = resolveL2AdapterMode(telemetry.simulation, radarInput);

  return (
    <header className="santen-header px-4 py-4 sm:px-6">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="bg-gradient-to-r from-[#2d42fc] via-[#6b7cff] to-white bg-clip-text font-mono text-xs font-semibold tracking-wider text-transparent">
            BeΔLivingWater · Citadel HUD (v0.8) — Non-Custodial <DeltaNeutralLabel /> Engine + Anti-MEV
            &amp; Dynamic Slippage Vault + GMX v2 Arbitrum Citadel Shield
          </p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-2">
          <a
            href={SILVERVINE_LABS_URL}
            target="_blank"
            rel="noopener noreferrer"
            data-testid="citadel-silvervine-labs-shield-link"
            className={`font-data text-[10px] font-semibold ${GMX_ACCENT_TEXT_CLASS} transition-colors hover:text-white`}
          >
            [ 🛡️ Official Site · silvervinelabs.com (Defense Matrix) ↗ ]
          </a>
          <a
            href={SILVERVINE_HUD_DAPP_NODE_URL}
            target="_blank"
            rel="noopener noreferrer"
            data-testid="citadel-hud-dapp-node-link"
            className="font-data text-[10px] font-semibold text-white/85 transition-colors hover:text-white"
          >
            [ 🖥️ HUD / DApp · bedeltawater.slivervine.xyz ↗ ]
          </a>
          <span
            className={[
              "font-data text-[10px] font-semibold",
              telemetry.simulation ? "text-amber-300" : GMX_ACCENT_TEXT_CLASS,
            ].join(" ")}
            data-testid="header-telemetry-badge"
          >
            {telemetry.label}
          </span>
          <HlProtocolRadar
            variant="header"
            sessionKeyRevoked={sessionKeyRevoked}
            l2AdapterMode={l2AdapterMode}
            input={radarInput}
          />
        </div>
      </div>
    </header>
  );
}
