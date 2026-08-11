/**
 * Santenmoku 64 Weapons Matrix — shared types.
 */

export type ProtocolVersion =
  | "v0.8"
  | "v1.0"
  | "v1.5"
  | "v2.0"
  | "v2.5"
  | "v3.0";

export type RainCategoryId = "UMBRELLA" | "BOOTS" | "RAINCOAT";

export interface RainWeaponDef {
  id: string;
  /** Legacy internal code (W##) — not shown in scale-down HUD */
  code: string;
  /** Category-prefix display code (UM-01 / BO-01 / RA-01) */
  displayCode: string;
  /** Target protocol version (v0.8 / v1.0 / v1.5) */
  unlockVersion: ProtocolVersion | null;
  /** Estimated slippage saved (basis points) */
  savedBpsEstimate: number;
  labelEn: string;
}

export interface RainCategoryDef {
  id: RainCategoryId;
  symbol: "O" | "△" | "I";
  emoji: string;
  count: 21 | 22;
  labelEn: string;
  tipEn: string;
  blurbEn: string;
  weapons: readonly RainWeaponDef[];
}

export type WeaponMatrixStatus =
  | { kind: "active" }
  | { kind: "coming_soon"; version: ProtocolVersion }
  | { kind: "locked" };
