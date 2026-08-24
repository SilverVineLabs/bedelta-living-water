/**
 * Protocol version presets — weapon unlock and topology helpers.
 */

import { TOPOLOGY_SHIELD_TREE } from "../../services/tension-engine-service";
import { VERSION_UNLOCKS } from "../hud-weapons-matrix";
import type { ProtocolVersion } from "./hud-protocol-versions-types";
import { VE_OPTIMIZE_VERSIONS } from "./hud-protocol-versions-types";

export function isWeaponUnlockedInVersion(
  weaponId: string,
  version: ProtocolVersion,
): boolean {
  return VERSION_UNLOCKS[version].includes(weaponId);
}

/** Enabled map for version: unlocked → on; locked → off. */
export function weaponEnabledMapForVersion(
  version: ProtocolVersion,
): Record<string, boolean> {
  const map: Record<string, boolean> = {};
  for (const card of TOPOLOGY_SHIELD_TREE) {
    for (const w of card.weapons) {
      map[w.id] = isWeaponUnlockedInVersion(w.id, version);
    }
  }
  return map;
}

/** Hard-lock (checkbox disabled) when weapon not in version, or tree.locked unless v3.0. */
export function isWeaponUiLocked(
  weaponId: string,
  version: ProtocolVersion,
  treeLocked: boolean,
): boolean {
  if (!isWeaponUnlockedInVersion(weaponId, version)) return true;
  if (treeLocked && version !== "v3.0") return true;
  return false;
}

export function topologyCardsInOrder(row: readonly string[]) {
  return row.map((id) => {
    const card = TOPOLOGY_SHIELD_TREE.find((c) => c.id === id);
    if (!card) throw new Error(`Missing topology card ${id}`);
    return card;
  });
}

export function isVeOptimizeVersion(version: ProtocolVersion): boolean {
  return (VE_OPTIMIZE_VERSIONS as readonly string[]).includes(version);
}
