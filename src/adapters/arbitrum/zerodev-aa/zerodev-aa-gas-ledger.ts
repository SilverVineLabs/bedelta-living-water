/** ZeroDev AA sponsored gas ledger — memory-first, optional KV persistence (24h rolling window). */

export const MAX_GAS_COST_PER_USEROP_USD = 0.5 as const;
export const DAILY_SPONSORSHIP_LIMIT_USD = 10 as const;
export const GAS_LEDGER_WINDOW_MS = 86_400_000 as const;
export const GAS_LEDGER_KV_KEY = "zerodev:aa:gas:ledger" as const;
export const GAS_LEDGER_KV_TTL_SEC = 86_400 as const;

export interface GasLedgerSnapshot {
  windowStartMs: number;
  cumulativeSpentUsd: number;
  lastUpdatedMs: number;
}

let memoryLedger: GasLedgerSnapshot = freshSnapshot(Date.now());

export function __resetGasLedgerForTests(nowMs = Date.now()): void {
  memoryLedger = freshSnapshot(nowMs);
}

export function __setGasLedgerForTests(snapshot: GasLedgerSnapshot): void {
  memoryLedger = snapshot;
}

function freshSnapshot(nowMs: number): GasLedgerSnapshot {
  return { windowStartMs: nowMs, cumulativeSpentUsd: 0, lastUpdatedMs: nowMs };
}

export function normalizeGasLedgerSnapshot(raw: GasLedgerSnapshot, nowMs: number): GasLedgerSnapshot {
  if (!Number.isFinite(raw.windowStartMs) || !Number.isFinite(raw.cumulativeSpentUsd)) {
    return freshSnapshot(nowMs);
  }
  if (nowMs - raw.windowStartMs >= GAS_LEDGER_WINDOW_MS) {
    return freshSnapshot(nowMs);
  }
  return {
    windowStartMs: raw.windowStartMs,
    cumulativeSpentUsd: Math.max(0, raw.cumulativeSpentUsd),
    lastUpdatedMs: nowMs,
  };
}

export function getGasLedgerSnapshot(nowMs = Date.now()): GasLedgerSnapshot {
  memoryLedger = normalizeGasLedgerSnapshot(memoryLedger, nowMs);
  return memoryLedger;
}

export async function loadGasLedgerFromKv(kv: KVNamespace, nowMs = Date.now()): Promise<GasLedgerSnapshot> {
  const raw = await kv.get(GAS_LEDGER_KV_KEY);
  if (!raw) {
    memoryLedger = getGasLedgerSnapshot(nowMs);
    return memoryLedger;
  }
  try {
    const parsed = JSON.parse(raw) as GasLedgerSnapshot;
    memoryLedger = normalizeGasLedgerSnapshot(parsed, nowMs);
  } catch {
    memoryLedger = getGasLedgerSnapshot(nowMs);
  }
  return memoryLedger;
}

export function isDailySponsorshipExhausted(
  snapshot?: GasLedgerSnapshot,
  nowMs = Date.now(),
): boolean {
  const s = snapshot ?? getGasLedgerSnapshot(nowMs);
  return s.cumulativeSpentUsd >= DAILY_SPONSORSHIP_LIMIT_USD;
}

export function recordSponsoredGasSpend(usd: number, nowMs = Date.now()): GasLedgerSnapshot {
  if (!Number.isFinite(usd) || usd <= 0) return getGasLedgerSnapshot(nowMs);
  const snap = getGasLedgerSnapshot(nowMs);
  memoryLedger = {
    windowStartMs: snap.windowStartMs,
    cumulativeSpentUsd: snap.cumulativeSpentUsd + usd,
    lastUpdatedMs: nowMs,
  };
  return memoryLedger;
}

export async function persistGasLedgerToKv(kv: KVNamespace, snapshot?: GasLedgerSnapshot): Promise<void> {
  const snap = snapshot ?? getGasLedgerSnapshot();
  await kv.put(GAS_LEDGER_KV_KEY, JSON.stringify(snap), { expirationTtl: GAS_LEDGER_KV_TTL_SEC });
}

export async function recordSponsoredGasSpendKv(
  usd: number,
  kv: KVNamespace,
  nowMs = Date.now(),
): Promise<GasLedgerSnapshot> {
  await loadGasLedgerFromKv(kv, nowMs);
  const updated = recordSponsoredGasSpend(usd, nowMs);
  await persistGasLedgerToKv(kv, updated);
  return updated;
}
