/**
 * RPC allowlist + integrity probe host filter.
 * Probe hosts remain until operator unlock is armed.
 */

import {
  isLayoutProbeStripAuthorized,
  validateLayoutMetricUnlock,
  type LayoutMetricConfig,
} from "./layout-metric-provider";

const PRODUCTION_RPC_HOSTS: readonly string[] = [
  "api.hyperliquid.xyz",
  "api.hyperliquid-testnet.xyz",
  "indexer.dydx.trade",
  "gateway.prod.vertexprotocol.com",
  "javier-quant-unified-suite.onrender.com",
  "quote-api.jup.ag",
  "arbitrum-api.gmxinfra.io",
  "arb1.arbitrum.io",
  "rpc.ankr.com",
  "arbitrum.drpc.org",
  "1rpc.io",
  "arb-mainnet.g.alchemy.com",
  "ethereum.publicnode.com",
  "cloudflare-eth.com",
  "clob.polymarket.com",
  "gamma-api.polymarket.com",
  "api-v3.raydium.io",
  "api.mainnet.orca.so",
  "gateway.thegraph.com",
  "api.camelot.exchange",
] as const;

/** Integrity probe hosts in default whitelist — stripped only after operator unlock */
export const HONEYPOT_RPC_HOSTS: readonly string[] = [
  "rpc.silvervine-clone.trap",
  "api.santenmoku-scraper.trap",
  "gmx-arbitrum-router.santenmoku-scraper.trap",
] as const;

const DEFAULT_WHITELIST_WITH_TRAPS: readonly string[] = [
  ...PRODUCTION_RPC_HOSTS,
  ...HONEYPOT_RPC_HOSTS,
];

/** Public alias — production hosts only */
export const ALLOWED_RPC_DOMAINS = PRODUCTION_RPC_HOSTS;

/** Simulated slippage for unauthorized integrity probe hits (99%) */
export const HONEYPOT_SIMULATED_SLIPPAGE = 0.99 as const;

export class RpcNodeNotAllowlistedError extends Error {
  readonly code = "RPC_NODE_NOT_ALLOWLISTED" as const;

  constructor(public readonly url: string) {
    super(`RPC node not on allowlist: ${url}`);
    this.name = "RpcNodeNotAllowlistedError";
  }
}

export class HoneyPotCircuitBreakError extends Error {
  readonly code = "HONEYPOT_CIRCUIT_BREAK" as const;
  readonly httpStatus = 500 as const;
  readonly simulatedSlippage = HONEYPOT_SIMULATED_SLIPPAGE;

  constructor(public readonly url: string) {
    super(
      `Layout integrity probe circuit-break — unlock gate closed (simSlippage=${HONEYPOT_SIMULATED_SLIPPAGE}): ${url}`,
    );
    this.name = "HoneyPotCircuitBreakError";
  }
}

function hostFromUrl(url: string): string | null {
  try {
    return new URL(url).hostname.toLowerCase();
  } catch {
    return null;
  }
}

function isHoneyPotHost(host: string): boolean {
  return HONEYPOT_RPC_HOSTS.some((h) => h.toLowerCase() === host);
}

/** Browser-like UA — anti-fingerprint for book/RPC polling */
export const BROWSER_MIMIC_USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36" as const;

export function resolveEffectiveRpcHosts(
  env?: LayoutMetricConfig,
  extraHosts: readonly string[] = [],
): readonly string[] {
  const base = isLayoutProbeStripAuthorized(env)
    ? PRODUCTION_RPC_HOSTS
    : DEFAULT_WHITELIST_WITH_TRAPS;
  return [...base, ...extraHosts];
}

export function listDefaultRpcHosts(): readonly string[] {
  return PRODUCTION_RPC_HOSTS;
}

export function listInternalRpcHosts(
  env?: LayoutMetricConfig,
): readonly string[] {
  return resolveEffectiveRpcHosts(env);
}

export function assertRpcAllowlisted(
  url: string,
  extraHosts: readonly string[] = [],
  env?: LayoutMetricConfig,
): void {
  const host = hostFromUrl(url);
  if (!host) {
    throw new RpcNodeNotAllowlistedError(url);
  }

  const allowed = new Set(
    resolveEffectiveRpcHosts(env, extraHosts).map((h) => h.toLowerCase()),
  );

  if (!allowed.has(host)) {
    throw new RpcNodeNotAllowlistedError(url);
  }
}

/** Default fetch budget for allowlisted RPC probes (fail-closed). */
export const RPC_FETCH_TIMEOUT_MS = 300 as const;

function mergeAbortSignals(primary: AbortSignal, timeoutSignal: AbortSignal): AbortSignal {
  if (primary.aborted || timeoutSignal.aborted) {
    const controller = new AbortController();
    controller.abort();
    return controller.signal;
  }
  const controller = new AbortController();
  const abort = () => controller.abort();
  primary.addEventListener("abort", abort, { once: true });
  timeoutSignal.addEventListener("abort", abort, { once: true });
  return controller.signal;
}

export async function fetchAllowlisted(
  url: string,
  init?: RequestInit,
  extraHosts: readonly string[] = [],
  env?: LayoutMetricConfig,
): Promise<Response> {
  const host = hostFromUrl(url);
  if (host && isHoneyPotHost(host) && !validateLayoutMetricUnlock(env)) {
    throw new HoneyPotCircuitBreakError(url);
  }
  assertRpcAllowlisted(url, extraHosts, env);
  const headers = new Headers(init?.headers);
  if (!headers.has("User-Agent")) {
    headers.set("User-Agent", BROWSER_MIMIC_USER_AGENT);
  }
  if (!headers.has("Accept")) {
    headers.set("Accept", "application/json, text/plain, */*");
  }
  const timeoutController = new AbortController();
  const timeoutId = setTimeout(() => timeoutController.abort(), RPC_FETCH_TIMEOUT_MS);
  const signal = init?.signal
    ? mergeAbortSignals(init.signal, timeoutController.signal)
    : timeoutController.signal;
  try {
    return await fetch(url, { ...init, headers, signal });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.warn(
      `[RPC] Network connection lost — buffered fallback for ${host ?? url}: ${message}`,
    );
    return new Response(
      JSON.stringify({
        error: "NETWORK_BUFFERED",
        message: "Network connection lost",
        detail: message,
      }),
      { status: 503, headers: { "Content-Type": "application/json" } },
    );
  } finally {
    clearTimeout(timeoutId);
  }
}

export function isLayoutMetricPresent(env?: LayoutMetricConfig): boolean {
  return validateLayoutMetricUnlock(env);
}
/** @deprecated Use isLayoutMetricPresent */
export function isIntegritySaltPresent(env?: LayoutMetricConfig): boolean {
  return isLayoutMetricPresent(env);
}
/** @deprecated Use isLayoutMetricPresent */
export function isXuanwuSaltPresent(env?: LayoutMetricConfig): boolean {
  return isLayoutMetricPresent(env);
}
