/** GET /api/grant-audit — fail-soft HTTP 200 + SWR cached telemetry. */
import type { Env } from "../../env";
import { engineModeForGrantAudit } from "../../middleware/engine-mode-router";
import { CORS_JSON_HEADERS } from "../../services/config";
import { buildGrantAuditPayload } from "../../routes/grant-audit-lib/grant-audit-payload";
import { readGrantAuditPrecomputedPayload } from "../../routes/grant-audit-lib/grant-audit-kv";
import { buildGrantAuditSwrFallbackPayload } from "../../routes/grant-audit-lib/grant-audit-swr-fallback";
import type { GrantAuditPayload } from "../../routes/grant-audit-lib/grant-audit.types";

const GRANT_AUDIT_RESPONSE_CACHE_TTL_MS = 3_000;

let grantAuditResponseCache: { at: number; payload: GrantAuditPayload } | null = null;

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: CORS_JSON_HEADERS,
  });
}

function overlayRequestEngineMode(
  payload: GrantAuditPayload,
  request?: Request,
): GrantAuditPayload {
  if (!request) return payload;
  return { ...payload, engineMode: engineModeForGrantAudit(request) };
}

/** Zero-Trust grant audit — never surfaces HTTP 500 on RPC / sequencer / oracle failures. */
export async function handleGrantAuditRequest(
  env: Env,
  request?: Request,
): Promise<Response> {
  const now = Date.now();
  if (
    grantAuditResponseCache &&
    now - grantAuditResponseCache.at < GRANT_AUDIT_RESPONSE_CACHE_TTL_MS
  ) {
    return jsonResponse(
      overlayRequestEngineMode(grantAuditResponseCache.payload, request),
      200,
    );
  }

  try {
    const kvPayload = env.EXECUTION_LOGS_KV
      ? await readGrantAuditPrecomputedPayload(env.EXECUTION_LOGS_KV, now)
      : null;
    if (kvPayload) {
      const payload = overlayRequestEngineMode(kvPayload, request);
      grantAuditResponseCache = { at: now, payload };
      return jsonResponse(payload, 200);
    }

    const payload = await buildGrantAuditPayload(env, request);
    grantAuditResponseCache = { at: now, payload };
    return jsonResponse(payload, 200);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Grant audit route failed";
    const fallback = buildGrantAuditSwrFallbackPayload(request, message, env);
    grantAuditResponseCache = { at: now, payload: fallback };
    return jsonResponse(fallback, 200);
  }
}

export function __resetGrantAuditResponseCacheForTests(): void {
  grantAuditResponseCache = null;
}

export function isGrantAuditApiPath(pathname: string): boolean {
  return pathname === "/api/grant-audit";
}
