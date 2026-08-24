/**
 * Protocol version presets — core pillars and version metadata.
 */

import { operatorsIntroducedAt } from "../operator-matrix";
import type { CorePillarDef, ProtocolVersion, ProtocolVersionMeta } from "./hud-protocol-versions-types";

/**
 * Version Matrix — five protocol evolution groups (one-screen HUD).
 * weaponIds derived from STANDARD_OPERATOR_ROSTER SSOT (no W39/W40/W45).
 */
export const CORE_PILLARS: readonly CorePillarDef[] = [
  {
    id: "V08_ORIGIN",
    topologyNodeIds: ["NODE_ALPHA"],
    weaponIds: operatorsIntroducedAt("v0.8"),
    labelEn: "v0.8 Public Origin",
  },
  {
    id: "V10_RISK",
    topologyNodeIds: ["NODE_OMEGA", "NODE_DELTA"],
    weaponIds: operatorsIntroducedAt("v1.0"),
    labelEn: "v1.0 Risk Foundation",
  },
  {
    id: "V15_CITADEL",
    topologyNodeIds: ["NODE_SIGMA"],
    weaponIds: operatorsIntroducedAt("v1.5"),
    labelEn: "v1.5 Dark Citadel",
  },
  {
    id: "V25_COUNTER",
    topologyNodeIds: ["NODE_KAPPA"],
    weaponIds: [],
    labelEn: "v2.5 MEV Counter",
  },
  {
    id: "V30_DOME",
    topologyNodeIds: ["NODE_LAMBDA", "NODE_ZETA"],
    weaponIds: [],
    labelEn: "v3.0 Geodesic Dome",
  },
] as const;

export const PROTOCOL_VERSION_META: Readonly<
  Record<ProtocolVersion, ProtocolVersionMeta>
> = {
  "v0.8": {
    id: "v0.8",
    labelEn: "v0.8 Public Origin",
    blurbEn: "Physical hard-lock only: checkSoilResistance + rootProtection",
  },
  "v1.0": {
    id: "v1.0",
    labelEn: "v1.0 Risk Foundation",
    blurbEn: "Adds SSOT state machine + liquidity tanks",
  },
  "v1.5": {
    id: "v1.5",
    labelEn: "v1.5 Dark Citadel",
    blurbEn: "Full 24-Cell: high-speed dispatch + hard-shell armor",
  },
  "v2.0": {
    id: "v2.0",
    labelEn: "v2.0 Geometric Spread",
    blurbEn: "Tempo/Cycle: geometric dynamic spread",
  },
  "v2.5": {
    id: "v2.5",
    labelEn: "v2.5 MEV Counter",
    blurbEn: "Bitwise + iceberg: MEV counterstrike",
  },
  "v3.0": {
    id: "v3.0",
    labelEn: "v3.0 Geodesic Dome",
    blurbEn: "Full-weapon dome: reserved for future milestones",
  },
};
