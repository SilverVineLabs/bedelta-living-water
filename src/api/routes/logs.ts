import type { Env } from "../../env";
import { APP_VERSION, CORS_JSON_HEADERS } from "../../services/config";
import {
  buildGrantAuditPayload,
  extractTxHashes,
  proveZeroDelta,
} from "../../routes/grant-audit";

const LATEST_KEY = "log_latest";
const HISTORY_KEY = "history_7d";

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: CORS_JSON_HEADERS,
  });
}

async function readKvJson(
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

/**
 * GET /api/logs | GET /logs — full execution history, raw Tx hashes, Zero-Delta proof.
 */
export async function handleExecutionLogsRequest(
  env: Env,
  request?: Request | null,
): Promise<Response> {
  if (!env.EXECUTION_LOGS_KV) {
    return jsonResponse(
      {
        success: false,
        error: "EXECUTION_LOGS_KV binding missing",
        latest: null,
        history: null,
        executionHistory: [],
        txHashes: [],
        zeroDelta: { proven: false, maxAbsNetDelta: 0, sampleCount: 0, reason: "KV_MISSING" },
        citadel: null,
        escalationState: null,
        fetchedAt: new Date().toISOString(),
      },
      503,
    );
  }

  const audit = await buildGrantAuditPayload(env, request);

  return jsonResponse({
    success: true,
    keys: { latest: LATEST_KEY, history: HISTORY_KEY },
    latest: audit.latest,
    history: audit.history,
    executionHistory: audit.executionHistory,
    txHashes: audit.txHashes,
    zeroDelta: audit.zeroDelta,
    citadel: audit.citadel,
    escalationState: audit.escalationState,
    audit: "ZERO_TRUST_GRANT",
    fetchedAt: audit.fetchedAt,
  });
}

/** GET /api · GET /api/health — Worker metadata JSON (not SPA root). */
export function handleSystemStatusRequest(env: Env): Response {
  return jsonResponse({
    success: true,
    service: "bedelta-living-water",
    version: APP_VERSION,
    status: "ok",
    bindings: {
      EXECUTION_LOGS_KV: Boolean(env.EXECUTION_LOGS_KV),
      SLIVERVINE_KV: Boolean(env.SLIVERVINE_KV ?? env.SYSTEM_STATE_KV),
      ASSETS: Boolean(env.ASSETS),
    },
    endpoints: {
      logs: "/api/logs",
      logsAlias: "/logs",
      grantAudit: "/api/grant-audit",
      yieldTriangle: "/api/yield/triangle",
      telemetryHealth: "/api/telemetry/health",
    },
    timestamp: new Date().toISOString(),
  });
}

/** True when pathname is an execution-logs GET route. */
export function isExecutionLogsPath(pathname: string): boolean {
  return pathname === "/api/logs" || pathname === "/logs";
}

export { extractTxHashes, proveZeroDelta, readKvJson };
