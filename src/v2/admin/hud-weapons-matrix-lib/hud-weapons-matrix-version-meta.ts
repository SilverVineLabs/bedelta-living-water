/**
 * Santenmoku 64 Weapons Matrix — version metadata and unlock maps.
 */

import { buildProtocolVersionUnlocks } from "../../../data/operator-matrix";
import type { ProtocolVersion } from "./hud-weapons-matrix-types";

export const VERSION_BASE_SAVED: Readonly<Record<ProtocolVersion, number>> = {
  "v0.8": 142.5,
  "v1.0": 380.0,
  "v1.5": 1250.0,
  "v2.0": 2000.0,
  "v2.5": 2800.0,
  "v3.0": 5000.0,
};

export const VERSION_RANK: Readonly<Record<ProtocolVersion, number>> = {
  "v0.8": 0,
  "v1.0": 1,
  "v1.5": 2,
  "v2.0": 3,
  "v2.5": 4,
  "v3.0": 5,
};

export const JITTER_TIP_EN =
  "[On-chain physical jitter] Expected error ±0.03% ~ ±0.08% from block time and P2P network latency.";

export const ARCH_SHIELD_TIP_EN =
  "[Arch Shield Dynamics] Idle = flat bar (zero drag); on MEV sandwich detect, arch expands to absorb top-side kinetic impact.";

export type VersionTimelineMeta = {
  icon: "🟢" | "🟡" | "🔒";
  labelEn: string;
};

export const VERSION_TIMELINE: Readonly<Record<ProtocolVersion, VersionTimelineMeta>> = {
  "v0.8": { icon: "🟢", labelEn: "[ 🟢 Live on Testnet - 2026 Q3 ]" },
  "v1.0": { icon: "🟡", labelEn: "[ 🟡 Target: 2026 Q4 (Milestone 1) ]" },
  "v1.5": { icon: "🔒", labelEn: "[ 🔒 Target: 2027 Q1 (Grant Milestone 2) ]" },
  "v2.0": { icon: "🔒", labelEn: "[ 🔒 Target: 2027 Q1 (Geometric Spread) ]" },
  "v2.5": { icon: "🔒", labelEn: "[ 🔒 Target: 2027 Q2 ]" },
  "v3.0": { icon: "🔒", labelEn: "[ 🔒 Target: 2027 Q3 ]" },
};

export const VERSION_UNLOCKS = buildProtocolVersionUnlocks();

export const WEAPON_UNLOCK_VERSION: Readonly<Record<string, ProtocolVersion>> = (() => {
  const order: ProtocolVersion[] = ["v0.8", "v1.0", "v1.5", "v2.0", "v2.5", "v3.0"];
  const map: Record<string, ProtocolVersion> = {};
  for (const v of order) for (const id of VERSION_UNLOCKS[v]) if (!(id in map)) map[id] = v;
  return map;
})();
