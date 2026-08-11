/** Grant audit — EXECUTION_LOGS_KV read helpers. */
import { MAX_ORDER_CLIP_USD } from "../../config/risk-parameters";
import type { GrantAuditPayload } from "./grant-audit.types";

export const GRANT_AUDIT_LATEST_KEY = "log_latest";
export const GRANT_AUDIT_HISTORY_KEY = "history_7d";

export async function readGrantAuditKvJson(
  kv: KVNamespace,
  key: string,
): Promise<unknown | null> {
  const raw = await kv.get(key);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as unknown;
  } catch {
    return { raw };
  }
}

export function collectGrantAuditEntries(
  history: unknown,
  latest: unknown,
): unknown[] {
  const out: unknown[] = [];
  if (history && typeof history === "object") {
    const h = history as { entries?: unknown[] };
    if (Array.isArray(h.entries)) out.push(...h.entries);
    else if (Array.isArray(history)) out.push(...(history as unknown[]));
  }
  if (latest && typeof latest === "object") out.push(latest);
  return out;
}

export function extractGrantAuditCitadelMetrics(
  latest: unknown,
): GrantAuditPayload["citadel"] {
  const row =
    latest && typeof latest === "object"
      ? (latest as {
          probeLatencyMs?: number;
          step2?: { probeLatencyMs?: number; probeOk?: boolean };
          positionHealth?: { health?: string };
        })
      : null;
  const probe = row?.probeLatencyMs ?? row?.step2?.probeLatencyMs ?? null;
  const soilOk =
    row?.step2?.probeOk ??
    (row?.positionHealth?.health === "OK" ? true : null);
  return {
    probeLatencyMs: probe,
    soilResistanceOk: soilOk,
    sessionClipUsd: MAX_ORDER_CLIP_USD,
    maxDrawdownPct: 0,
  };
}
