/** GET /api/grant-audit — fail-soft HTTP 200 + SWR cached telemetry. */
import type { Env } from "../../env";
import { CORS_JSON_HEADERS } from "../../services/config";
import { buildGrantAuditPayload } from "../../routes/grant-audit-lib/grant-audit-payload";
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
    return jsonResponse(grantAuditResponseCache.payload, 200);
  }

  try {
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
