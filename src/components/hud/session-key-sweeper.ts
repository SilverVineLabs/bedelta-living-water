/** Ghost session keys idle ≥24h or past expiry — OPSEC sweep targets. */

export const SESSION_KEY_SWEEP_IDLE_MS = 24 * 60 * 60 * 1000;

export interface GhostSessionKeyRecord {
  id: string;
  agentName: string;
  createdAtMs: number;
  lastUsedAtMs: number | null;
  expiresAtMs: number;
}

export interface SessionKeySweepSnapshot {
  ghostCount: number;
  totalRegistered: number;
  sweepableIds: readonly string[];
}

export function isGhostSessionKey(
  key: GhostSessionKeyRecord,
  nowMs = Date.now(),
): boolean {
  if (nowMs >= key.expiresAtMs) return true;
  const idleAnchor = key.lastUsedAtMs ?? key.createdAtMs;
  return nowMs - idleAnchor >= SESSION_KEY_SWEEP_IDLE_MS;
}

export function auditGhostSessionKeys(
  keys: readonly GhostSessionKeyRecord[],
  nowMs = Date.now(),
): SessionKeySweepSnapshot {
  const sweepable = keys.filter((key) => isGhostSessionKey(key, nowMs));
  return {
    ghostCount: sweepable.length,
    totalRegistered: keys.length,
    sweepableIds: sweepable.map((key) => key.id),
  };
}

/** HUD fixture — two stale keys + one active session key. */
export function demoGhostSessionKeyRegistry(
  nowMs = Date.now(),
): readonly GhostSessionKeyRecord[] {
  const hour = 60 * 60 * 1000;
  return [
    {
      id: "sk-hl-001",
      agentName: "BeDeltaAgent",
      createdAtMs: nowMs - 48 * hour,
      lastUsedAtMs: null,
      expiresAtMs: nowMs - 12 * hour,
    },
    {
      id: "sk-hl-002",
      agentName: "BeDeltaAgent",
      createdAtMs: nowMs - 72 * hour,
      lastUsedAtMs: nowMs - 30 * hour,
      expiresAtMs: nowMs + hour,
    },
    {
      id: "sk-hl-003",
      agentName: "BeDeltaAgent",
      createdAtMs: nowMs - 2 * hour,
      lastUsedAtMs: nowMs - 5 * 60 * 1000,
      expiresAtMs: nowMs + 22 * hour,
    },
  ];
}
