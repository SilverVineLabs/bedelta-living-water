import type { OperatorUnlockVersion } from "../../../v2/admin/operator-matrix";

export interface ShieldTheme {
  border: string;
  glow: string;
  accentText: string;
  power: string;
  label: string;
}

export const SHIELD_THEMES: Record<OperatorUnlockVersion, ShieldTheme> = {
  "v0.8": {
    border: "border-[#2d42fc]/50",
    glow: "shadow-[0_0_28px_rgba(45,66,252,0.35)]",
    accentText: "text-[#2d42fc]",
    power: "42%",
    label: "GMX Blue Shield",
  },
  "v1.0": {
    border: "border-amber-500/50",
    glow: "shadow-[0_0_28px_rgba(245,158,11,0.35)]",
    accentText: "text-amber-400",
    power: "78%",
    label: "Gold Shield",
  },
  "v1.5": {
    border: "border-purple-500/50",
    glow: "shadow-[0_0_28px_rgba(168,85,247,0.4)]",
    accentText: "text-purple-400",
    power: "100%",
    label: "Purple Shield",
  },
};

export const SHIELD_GLOW_CLASS: Record<OperatorUnlockVersion, string> = {
  "v0.8": "animate-shield-glow-gmx-blue",
  "v1.0": "animate-shield-glow-orange",
  "v1.5": "animate-shield-glow-purple-ultra",
};

export const PROTECTION_STATS: Record<
  OperatorUnlockVersion,
  { interceptPct: number; jitter: string }
> = {
  "v0.8": { interceptPct: 92.4, jitter: "±0.05% (±0.2 bps)" },
  "v1.0": { interceptPct: 98.6, jitter: "±0.02% (±0.1 bps)" },
  "v1.5": { interceptPct: 99.9, jitter: "±0.01% (±0.05 bps)" },
};

export function resolveShieldTheme(
  protocolVersion: OperatorUnlockVersion,
  forceUltraShield: boolean,
): ShieldTheme {
  return forceUltraShield ? SHIELD_THEMES["v1.5"] : SHIELD_THEMES[protocolVersion];
}
