import type { Env } from "./env";

/** Official public Dune telemetry dashboard — root domain redirect target. */
export const DUNE_TELEMETRY_PORTAL_URL =
  "https://dune.com/silvervinelabs/silvervine-citadel-telemetry" as const;

/** Worker-handled JSON/API paths — all other GET routes delegate to ASSETS SPA. */
export function isWorkerApiPath(pathname: string): boolean {
  return (
    pathname === "/api" ||
    pathname === "/api/health" ||
    pathname.startsWith("/api/") ||
    pathname === "/logs"
  );
}

/** Delegate to Cloudflare Static Assets — preserves query string (?role=grant|vault). */
export async function fetchStaticAsset(env: Env, request: Request): Promise<Response> {
  if (!env.ASSETS) {
    return new Response("ASSETS binding unavailable", {
      status: 503,
      headers: { "Content-Type": "text/plain; charset=UTF-8" },
    });
  }
  return env.ASSETS.fetch(request);
}
