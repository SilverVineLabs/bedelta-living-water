/**
 * 2PC Intent persistence — Edge KV / D1 / DO-compatible crash recovery layer.
 */

import {
  buildFlattenAction,
  importCrossLegIntent,
  listAllIntents,
  type CrossLegIntent,
  type FlattenLegFn,
  type IntentLedgerOptions,
} from "../intent-ledger";

export const INTENT_PERSISTENCE_PREFIX = "intent:2pc:";
export const INTENT_INDEX_KEY = "intent:2pc:__index";

export interface IntentPersistenceStore {
  get(key: string): Promise<string | null>;
  put(key: string, value: string, options?: { expirationTtl?: number }): Promise<void>;
  delete(key: string): Promise<void>;
  listKeys(prefix: string): Promise<string[]>;
}

export interface IntentPersistenceRecord {
  version: 1;
  savedAt: string;
  intent: CrossLegIntent;
}

export interface EmergencyUnwindResult {
  intentId: string;
  ok: boolean;
  reason: string;
  flattenCount: number;
}

export interface CrashRecoveryResult {
  restoredCount: number;
  unwound: EmergencyUnwindResult[];
}

export interface CrashRecoveryOptions extends IntentLedgerOptions {
  flattenLeg?: FlattenLegFn;
}

function intentKey(id: string): string {
  return `${INTENT_PERSISTENCE_PREFIX}${id}`;
}

function cloneIntent(intent: CrossLegIntent): CrossLegIntent {
  return {
    ...intent,
    legs: [...intent.legs] as [CrossLegIntent["legs"][0], CrossLegIntent["legs"][1]],
    legResults: [...intent.legResults],
    flattenActions: [...intent.flattenActions],
  };
}

export function serializeIntentRecord(intent: CrossLegIntent): string {
  const record: IntentPersistenceRecord = {
    version: 1,
    savedAt: new Date().toISOString(),
    intent: cloneIntent(intent),
  };
  return JSON.stringify(record);
}

export function deserializeIntentRecord(raw: string): CrossLegIntent {
  const parsed = JSON.parse(raw) as IntentPersistenceRecord | CrossLegIntent;
  if ("intent" in parsed && parsed.version === 1) {
    return cloneIntent(parsed.intent);
  }
  return cloneIntent(parsed as CrossLegIntent);
}

/** In-memory persistence store for tests and local dev */
export class InMemoryIntentPersistenceStore implements IntentPersistenceStore {
  private readonly data = new Map<string, string>();

  async get(key: string): Promise<string | null> {
    return this.data.get(key) ?? null;
  }

  async put(key: string, value: string): Promise<void> {
    this.data.set(key, value);
  }

  async delete(key: string): Promise<void> {
    this.data.delete(key);
  }

  async listKeys(prefix: string): Promise<string[]> {
    return [...this.data.keys()].filter((key) => key.startsWith(prefix));
  }

  clear(): void {
    this.data.clear();
  }
}

export interface KvNamespaceLike {
  get(key: string): Promise<string | null>;
  put(
    key: string,
    value: string,
    options?: { expirationTtl?: number },
  ): Promise<void>;
  delete(key: string): Promise<void>;
  list(options: { prefix: string }): Promise<{ keys: { name: string }[] }>;
}

/** Cloudflare KV-backed persistence adapter */
export function createKvIntentPersistenceStore(
  kv: KvNamespaceLike,
): IntentPersistenceStore {
  return {
    get: (key) => kv.get(key),
    put: (key, value, options) =>
      kv.put(key, value, options?.expirationTtl ? { expirationTtl: options.expirationTtl } : undefined),
    delete: (key) => kv.delete(key),
    listKeys: async (prefix) => {
      const listing = await kv.list({ prefix });
      return listing.keys.map((entry) => entry.name);
    },
  };
}

async function readIndex(store: IntentPersistenceStore): Promise<string[]> {
  const raw = await store.get(INTENT_INDEX_KEY);
  if (!raw) return [];
  try {
    const ids = JSON.parse(raw) as string[];
    return Array.isArray(ids) ? ids : [];
  } catch {
    return [];
  }
}

async function writeIndex(store: IntentPersistenceStore, ids: string[]): Promise<void> {
  await store.put(INTENT_INDEX_KEY, JSON.stringify([...new Set(ids)]));
}

function ttlSeconds(intent: CrossLegIntent): number {
  return Math.max(Math.ceil(intent.ttlMs / 1000) + 86_400, 86_400);
}

/** Persist a single intent snapshot to Edge storage */
export async function saveIntentSnapshot(
  intent: CrossLegIntent,
  store: IntentPersistenceStore,
): Promise<void> {
  const key = intentKey(intent.id);
  await store.put(key, serializeIntentRecord(intent), {
    expirationTtl: ttlSeconds(intent),
  });
  const index = await readIndex(store);
  if (!index.includes(intent.id)) {
    index.push(intent.id);
    await writeIndex(store, index);
  }
}

/** Load a persisted intent by id */
export async function loadIntentSnapshot(
  id: string,
  store: IntentPersistenceStore,
): Promise<CrossLegIntent | null> {
  const raw = await store.get(intentKey(id));
  if (!raw) return null;
  return deserializeIntentRecord(raw);
}

/** Load all persisted intents from storage */
export async function loadAllIntentSnapshots(
  store: IntentPersistenceStore,
): Promise<CrossLegIntent[]> {
  const keys = await store.listKeys(INTENT_PERSISTENCE_PREFIX);
  const idsFromKeys = keys
    .filter((key) => key !== INTENT_INDEX_KEY)
    .map((key) => key.slice(INTENT_PERSISTENCE_PREFIX.length));
  const index = await readIndex(store);
  const ids = [...new Set([...index, ...idsFromKeys])];
  const intents: CrossLegIntent[] = [];
  for (const id of ids) {
    const intent = await loadIntentSnapshot(id, store);
    if (intent) intents.push(intent);
  }
  return intents;
}

/** Restore persisted intents into the hot in-memory ledger */
export async function restoreLedgerFromPersistence(
  store: IntentPersistenceStore,
): Promise<CrossLegIntent[]> {
  const snapshots = await loadAllIntentSnapshots(store);
  return snapshots.map((intent) => importCrossLegIntent(intent));
}

function isPreparedExpired(intent: CrossLegIntent, now: number): boolean {
  if (intent.phase !== "PREPARED" || intent.preparedAt === undefined) return false;
  return now - intent.preparedAt > intent.ttlMs;
}

/** Emergency unwind for a single PREPARED intent past TTL */
export async function emergencyUnwindPreparedIntent(
  intent: CrossLegIntent,
  options: CrashRecoveryOptions = {},
): Promise<{ intent: CrossLegIntent; result: EmergencyUnwindResult }> {
  const now = options.now?.() ?? Date.now();
  const flattenLeg = options.flattenLeg ?? (async () => ({ ok: true }));

  if (!isPreparedExpired(intent, now)) {
    return {
      intent,
      result: {
        intentId: intent.id,
        ok: true,
        reason: "NOT_EXPIRED",
        flattenCount: 0,
      },
    };
  }

  const preparedIndexes = new Set(
    intent.legResults.filter((r) => r.ok).map((r) => r.legIndex),
  );
  const updated = cloneIntent(intent);
  updated.phase = "ABORTED";
  updated.abortedAt = now;
  updated.abortReason = "CRASH_RECOVERY_TTL_EXPIRED";
  updated.flattenActions = updated.legs
    .filter((_, index) => preparedIndexes.has(index))
    .map((leg) => buildFlattenAction(leg, "CRASH_RECOVERY_TTL_EXPIRED"));

  for (const action of updated.flattenActions) {
    await flattenLeg(action, updated);
  }

  const persisted = importCrossLegIntent(updated);
  return {
    intent: persisted,
    result: {
      intentId: persisted.id,
      ok: true,
      reason: "CRASH_RECOVERY_TTL_EXPIRED",
      flattenCount: persisted.flattenActions.length,
    },
  };
}

/** Scan restored ledger and auto-unwind expired PREPARED intents */
export async function runCrashRecovery(
  store: IntentPersistenceStore,
  options: CrashRecoveryOptions = {},
): Promise<CrashRecoveryResult> {
  const restored = await restoreLedgerFromPersistence(store);
  const now = options.now?.() ?? Date.now();
  const unwound: EmergencyUnwindResult[] = [];

  for (const intent of listAllIntents()) {
    if (intent.phase !== "PREPARED") continue;
    if (!isPreparedExpired(intent, now)) continue;

    const { intent: updated, result } = await emergencyUnwindPreparedIntent(intent, options);
    unwound.push(result);
    await saveIntentSnapshot(updated, store);
  }

  return {
    restoredCount: restored.length,
    unwound,
  };
}

/** Worker boot hook — restore ledger + emergency unwind expired PREPARED intents */
export async function bootstrapIntentPersistence(
  store: IntentPersistenceStore,
  options: CrashRecoveryOptions = {},
): Promise<CrashRecoveryResult> {
  return runCrashRecovery(store, options);
}

/** Sync all hot ledger intents to persistence store */
export async function syncLedgerToPersistence(
  store: IntentPersistenceStore,
): Promise<number> {
  const intents = listAllIntents();
  for (const intent of intents) {
    await saveIntentSnapshot(intent, store);
  }
  return intents.length;
}
