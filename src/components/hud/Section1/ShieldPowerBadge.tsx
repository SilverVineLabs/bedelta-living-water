import type { ReactNode } from "react";
import type { OperatorUnlockVersion } from "../../../v2/admin/operator-matrix";
import { SHIELD_GLOW_CLASS, type ShieldTheme } from "./section1-shield-themes";

export interface ShieldPowerBadgeProps {
  protocolVersion: OperatorUnlockVersion;
  theme: ShieldTheme;
  forceUltraShield?: boolean;
  shieldDemoPulse?: boolean;
}

function ShieldIcon({
  protocolVersion,
  forceUltraShield = false,
  shieldDemoPulse = false,
}: Pick<ShieldPowerBadgeProps, "protocolVersion" | "forceUltraShield" | "shieldDemoPulse">): ReactNode {
  const isPurpleUltra = protocolVersion === "v1.5" || forceUltraShield;

  return (
    <div
      className={[
        "relative flex h-20 w-20 max-h-28 max-w-28 shrink-0 items-center justify-center md:h-24 md:w-24",
        isPurpleUltra ? "overflow-visible" : "overflow-hidden",
      ].join(" ")}
      data-testid="section1-shield-icon"
      data-protocol-version={protocolVersion}
      data-ultra-shield={forceUltraShield ? "true" : undefined}
    >
      {isPurpleUltra ? (
        <div
          aria-hidden="true"
          className={[
            "pointer-events-none absolute inset-0 rounded-full blur-2xl",
            forceUltraShield
              ? "animate-pulse bg-fuchsia-500/50"
              : "animate-pulse bg-fuchsia-600/30",
          ].join(" ")}
        />
      ) : null}
      <img
        src="/brand/TP_Shield.png"
        alt="Santenmoku Risk Shield"
        width={112}
        height={112}
        className={[
          "relative z-10 h-full w-full object-contain",
          forceUltraShield || isPurpleUltra
            ? "animate-shield-glow-purple-ultra"
            : SHIELD_GLOW_CLASS[protocolVersion],
          shieldDemoPulse ? "animate-pulse" : "",
        ].join(" ")}
      />
    </div>
  );
}

export function ShieldPowerBadge({
  protocolVersion,
  theme,
  forceUltraShield = false,
  shieldDemoPulse = false,
}: ShieldPowerBadgeProps): ReactNode {
  return (
    <div className="flex max-w-[7.5rem] shrink-0 flex-col items-center gap-1 md:max-w-[8rem]">
      <ShieldIcon
        protocolVersion={protocolVersion}
        forceUltraShield={forceUltraShield}
        shieldDemoPulse={shieldDemoPulse}
      />
      <p className={`font-data text-[9px] font-semibold ${theme.accentText}`}>
        [ 🛡️ SHIELD ]
      </p>
      <p className={`font-mono text-base font-bold ${theme.accentText}`}>
        {theme.label} · Power: {theme.power}
      </p>
    </div>
  );
}
