import type { Env } from "./env";
import { routeRequest } from "./api/routes";
import {
  handleExecutionLogsRequest,
} from "./api/routes/logs";
import {
  handleGrantAuditRequest,
  isGrantAuditApiPath,
} from "./routes/grant-audit";
import {
  applyEngineModeResponseHeaders,
  parseEngineModeHeader,
} from "./middleware/engine-mode-router";
import { CORS_JSON_HEADERS } from "./services/config";
import { severSigningChannel } from "./services/session-key-adapter-lib/session-key-gates";
import { configureTelegramAlert } from "./services/telemetry/telegram-alert";
import { ensureIntentPersistenceBoot } from "./worker-scheduled";
import { fetchStaticAsset, isWorkerApiPath, DUNE_TELEMETRY_PORTAL_URL } from "./worker-routing";

const GEO_BLOCKED_COUNTRIES = new Set(["US", "CU", "IR", "KP", "SY"]);

const PUBLIC_READ_ONLY_PATHS = new Set([
  "/api/telemetry/health",
  "/api/telemetry/analytics",
  "/api/badge/health",
  "/api/badge/proofs",
  "/api/yield/triangle",
  "/api/logs",
  "/api/grant-audit",
  "/api",
  "/api/health",
  "/logs",
  "/",
  "/grant-audit",
  "/b2b",
  "/app",
]);

function enforceGeoCompliance(request: Request): Response | null {
  const url = new URL(request.url);
  if (request.method === "GET" && PUBLIC_READ_ONLY_PATHS.has(url.pathname)) {
    return null;
  }
  const country = request.cf?.country;
  if (typeof country !== "string" || !GEO_BLOCKED_COUNTRIES.has(country)) {
    return null;
  }
  severSigningChannel();
  return new Response(
    "[SLIVERVINE DEFENSE] Access Denied by Geo-Compliance Circuit Breaker\n\nHyperliquid Foundation Evaluators: Contact grants@silvervinelabs.com for evaluator whitelist onboarding.",
    {
      status: 403,
      headers: { "Content-Type": "text/plain; charset=UTF-8" },
    },
  );
}

export async function handleWorkerFetch(
  request: Request,
  env: Env,
  ctx: ExecutionContext,
): Promise<Response> {
  configureTelegramAlert({
    TELEGRAM_BOT_TOKEN: env.TELEGRAM_BOT_TOKEN,
    TELEGRAM_CHAT_ID: env.TELEGRAM_CHAT_ID,
  });
  ctx.waitUntil(
    ensureIntentPersistenceBoot(env).catch((err) => {
      console.error("[bedelta] fetch persistence boot failed", err);
    }),
  );

  const geoResponse = enforceGeoCompliance(request);
  if (geoResponse) return geoResponse;

  const url = new URL(request.url);
  if (request.method === "GET" && url.pathname === "/") {
    return Response.redirect(DUNE_TELEMETRY_PORTAL_URL, 302);
  }
  if (!isWorkerApiPath(url.pathname)) {
    return fetchStaticAsset(env, request);
  }

  try {
    if (
      request.method === "GET" &&
      (url.pathname === "/api/logs" || url.pathname === "/logs")
    ) {
      return await handleExecutionLogsRequest(env, request);
    }
    if (request.method === "GET" && isGrantAuditApiPath(url.pathname)) {
      return applyEngineModeResponseHeaders(
        await handleGrantAuditRequest(env, request),
        parseEngineModeHeader(request),
      );
    }
  } catch (error) {
    console.error("[bedelta] explicit route error", error);
    const message =
      error instanceof Error ? error.message : "Explicit route failed";
    return new Response(
      JSON.stringify({ success: false, error: message }),
      { status: 500, headers: CORS_JSON_HEADERS },
    );
  }

  try {
    return await routeRequest(request, env, ctx);
  } catch (error) {
    console.error("[bedelta] unhandled fetch error", error);
    const message =
      error instanceof Error ? error.message : "Worker fetch failed";
    return new Response(
      JSON.stringify({ success: false, error: message }),
      { status: 500, headers: CORS_JSON_HEADERS },
    );
  }
}
