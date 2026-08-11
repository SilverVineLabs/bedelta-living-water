/** Cloudflare Edge — `x-engine-mode` header router (HL native vs Arbitrum Citadel). */
export const ENGINE_MODE_HEADER = "x-engine-mode" as const;

export type EngineMode = "HYPERLIQUID_NATIVE" | "ARBITRUM_CITADEL";

export interface EngineModeStatus {
  engineMode: EngineMode;
  /** HL $300 live logging engine vs Citadel GMX/Vertex stack */
  liveLoggingEngine: "hl-300-live" | "citadel-gmx-vertex";
  primaryVenue: "hyperliquid" | "gmx-v2";
  hedgeVenues: readonly ("hyperliquid" | "gmx-v2" | "vertex")[];
  ingressChain: "HYPERLIQUID" | "ARBITRUM";
}

const HL_NATIVE: EngineModeStatus = {
  engineMode: "HYPERLIQUID_NATIVE",
  liveLoggingEngine: "hl-300-live",
  primaryVenue: "hyperliquid",
  hedgeVenues: ["hyperliquid"],
  ingressChain: "HYPERLIQUID",
};

const ARBITRUM_CITADEL: EngineModeStatus = {
  engineMode: "ARBITRUM_CITADEL",
  liveLoggingEngine: "citadel-gmx-vertex",
  primaryVenue: "gmx-v2",
  hedgeVenues: ["gmx-v2", "vertex", "hyperliquid"],
  ingressChain: "ARBITRUM",
};

function normalizeHeader(raw: string | null): EngineMode {
  const key = (raw ?? "").trim().toUpperCase().replace(/-/g, "_");
  if (key === "ARBITRUM_CITADEL" || key === "CITADEL" || key === "ARBITRUM") {
    return "ARBITRUM_CITADEL";
  }
  return "HYPERLIQUID_NATIVE";
}

export function resolveEngineModeStatus(mode: EngineMode): EngineModeStatus {
  return mode === "ARBITRUM_CITADEL" ? ARBITRUM_CITADEL : HL_NATIVE;
}

/** Cron / scheduled jobs — always HL native (no request headers). */
export function getScheduledEngineMode(): EngineModeStatus {
  return HL_NATIVE;
}

export function parseEngineModeHeader(request: Request): EngineModeStatus {
  return resolveEngineModeStatus(normalizeHeader(request.headers.get(ENGINE_MODE_HEADER)));
}

export function engineModeForGrantAudit(request?: Request | null): EngineModeStatus {
  return request ? parseEngineModeHeader(request) : HL_NATIVE;
}

export function applyEngineModeResponseHeaders(
  response: Response,
  status: EngineModeStatus,
): Response {
  const headers = new Headers(response.headers);
  headers.set(ENGINE_MODE_HEADER, status.engineMode);
  headers.set("x-engine-live-logging", status.liveLoggingEngine);
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

/** Yield / triangle read-path — Citadel mode forces Arbitrum ingress. */
export function resolveYieldIngressChain(
  request: Request,
  queryIngress: string | null,
): "HYPERLIQUID" | "ARBITRUM" {
  const mode = parseEngineModeHeader(request);
  if (mode.engineMode === "ARBITRUM_CITADEL") return "ARBITRUM";
  const q = (queryIngress ?? "").trim().toUpperCase();
  return q === "ARBITRUM" ? "ARBITRUM" : "HYPERLIQUID";
}
