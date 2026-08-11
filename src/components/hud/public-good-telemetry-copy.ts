export const PING_TOOLTIP_COPY =
  "Citadel Edge RTT probe to Arbitrum RPC + Cross-DEX health (`/api/telemetry/health`). Fail-closed trigger at >200ms.";

export const DEV_GUIDE_TITLE =
  "Developer Setup Guide: How to mount `@silvervine/risk-sdk` & query public telemetry.";

export const DEV_GUIDE_BODY =
  "Install `@silvervine/risk-sdk`, mount the risk envelope provider, then poll the public telemetry health endpoint for CRI, soil resistance, and circuit-breaker state — no API key required.";

export const DEV_GUIDE_RESILIENCY_TITLE =
  "Live Telemetry Resiliency & Fail-Closed Diagnostics";

export const DEV_GUIDE_RESILIENCY_INTRO =
  'SliverVine Protocol operates under a deterministic "Fail-Closed" design:';

export const DEV_GUIDE_RESILIENCY_ITEMS = [
  {
    label: "RPC Health & Latency Switching (RPC_HEALTH)",
    body: "Automatically degrades to cached simulation telemetry if primary/backup RPC latency exceeds 500ms or encounters HTTP 503 timeouts.",
  },
  {
    label: "Soil Resistance Circuit Breaker (SOIL_RESISTANCE_TRIP)",
    body: "Synchronously rejects trade intents (tradeAllowed: false) when orderbook depth is insufficient (INSUFFICIENT_DEPTH_DUAL_VENUE), eliminating toxic fills and slippage bleed.",
  },
  {
    label: "High-Availability Telemetry Streaming (/api/telemetry/health)",
    body: "Serves sub-20ms 200 OK responses on Cloudflare Workers edge nodes regardless of underlying CEX/DEX RPC connection status.",
  },
] as const;
