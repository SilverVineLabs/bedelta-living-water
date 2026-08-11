/**
 * Global DEX safe-fetch — non-blocking failover + cache/backup depth for matrix pipeline.
 */

import {
  EXTERNAL_FETCH_TIMEOUT_MS,
  fetchAllowlistedWithTimeout,
} from "../defense/low-latency-fetch";
import { RpcNodeNotAllowlistedError } from "../defense/rpc-whitelist";

export type DexExchangeName = "dYdX" | "Vertex" | "Hyperliquid" | "Jupiter";

export type ExchangeFetchFailureKind =
  | "HTTP_500"
  | "HTTP_503"
  | "HTTP_ERROR"
  | "TIMEOUT"
  | "DNS"
  | "NETWORK";

export interface SafeExchangeFetchResult<T> {
  ok: boolean;
  data: T;
  source: "live" | "cache" | "backup";
  warning?: string;
  debugLog?: string;
}

/** Static backup mids for matrix soil resistance when live + cache are unavailable. */
export const EXCHANGE_BACKUP_PERP_MIDS: Readonly<Record<string, number>> = {
  BTC: 64_000,
  ETH: 3_500,
  SOL: 150,
  AVAX: 35,
  LINK: 15,
  NEAR: 5,
  DOT: 7,
  ARB: 1.2,
  ADA: 0.45,
  MATIC: 0.55,
  OP: 2.1,
  SUI: 1.8,
};

const exchangePayloadCache = new Map<string, unknown>();

export function formatExchangeUnavailableWarning(
  dex: DexExchangeName,
  reason: string,
): string {
  return `[WARN] [Exchanges] ${dex} API unavailable (${reason}), switching to cached/simulated depth.`;
}

export function classifyExchangeFetchFailure(
  err: unknown,
  httpStatus?: number,
): { label: string; kind: ExchangeFetchFailureKind } {
  if (httpStatus === 503) return { label: "503", kind: "HTTP_503" };
  if (httpStatus === 500) return { label: "500", kind: "HTTP_500" };
  if (httpStatus != null && httpStatus >= 400) {
    return { label: String(httpStatus), kind: "HTTP_ERROR" };
  }

  if (err instanceof RpcNodeNotAllowlistedError) {
    return { label: "Network", kind: "NETWORK" };
  }
  if (err instanceof DOMException && err.name === "TimeoutError") {
    return { label: "Timeout", kind: "TIMEOUT" };
  }
  if (err instanceof Error) {
    if (err.name === "AbortError") return { label: "Timeout", kind: "TIMEOUT" };
    const msg = err.message.toLowerCase();
    if (
      msg.includes("enotfound") ||
      msg.includes("getaddrinfo") ||
      msg.includes("dns") ||
      msg.includes("name not resolved")
    ) {
      return { label: "DNS", kind: "DNS" };
    }
    if (msg.includes("fetch failed") || msg.includes("network")) {
      return { label: "Network", kind: "NETWORK" };
    }
  }
  return { label: "Network", kind: "NETWORK" };
}

function isNonEmptyRecord(value: unknown): value is Record<string, number> {
  return (
    !!value &&
    typeof value === "object" &&
    Object.keys(value as Record<string, unknown>).length > 0
  );
}

function resolveCacheFallback<T>(
  dex: DexExchangeName,
  cacheKey: string,
  failureLabel: string,
  backup?: T,
  validate?: (data: T) => boolean,
): SafeExchangeFetchResult<T> | null {
  const isValid = validate ?? (() => true);
  const cached = exchangePayloadCache.get(cacheKey) as T | undefined;
  if (cached != null && isValid(cached)) {
    const warning = formatExchangeUnavailableWarning(dex, failureLabel);
    console.warn(warning);
    return {
      ok: false,
      data: cached,
      source: "cache",
      warning,
      debugLog: warning,
    };
  }
  if (backup != null && isValid(backup)) {
    const warning = formatExchangeUnavailableWarning(dex, failureLabel);
    console.warn(warning);
    return {
      ok: false,
      data: backup,
      source: "backup",
      warning,
      debugLog: warning,
    };
  }
  return null;
}

/** Non-throwing exchange fetch with cache + static backup failover. */
export async function safeExchangeFetch<T>(
  dex: DexExchangeName,
  cacheKey: string,
  fetchLive: () => Promise<T>,
  options: {
    backup?: T;
    validate?: (data: T) => boolean;
  } = {},
): Promise<SafeExchangeFetchResult<T>> {
  const validate = options.validate ?? (() => true);

  try {
    const data = await fetchLive();
    if (validate(data)) {
      exchangePayloadCache.set(cacheKey, data);
      return { ok: true, data, source: "live" };
    }
    const fallback = resolveCacheFallback(
      dex,
      cacheKey,
      "InvalidPayload",
      options.backup,
      validate,
    );
    if (fallback) return fallback;
    return {
      ok: false,
      data,
      source: "backup",
      warning: formatExchangeUnavailableWarning(dex, "InvalidPayload"),
      debugLog: formatExchangeUnavailableWarning(dex, "InvalidPayload"),
    };
  } catch (err) {
    const failure = classifyExchangeFetchFailure(err);
    const fallback = resolveCacheFallback(
      dex,
      cacheKey,
      failure.label,
      options.backup,
      validate,
    );
    if (fallback) return fallback;

    const warning = formatExchangeUnavailableWarning(dex, failure.label);
    console.warn(warning);
    const empty = (options.backup ?? ({} as T));
    return {
      ok: false,
      data: empty,
      source: "backup",
      warning,
      debugLog: warning,
    };
  }
}

export interface SafeExchangeHttpJsonOptions {
  url: string;
  init?: RequestInit;
  extraHosts?: readonly string[];
  timeoutMs?: number;
  fetchFn?: typeof fetch;
}

/** Allowlisted HTTP JSON fetch — never throws on 500/503/timeout/DNS. */
export async function safeExchangeHttpJson<T>(
  dex: DexExchangeName,
  cacheKey: string,
  options: SafeExchangeHttpJsonOptions & {
    parse: (body: unknown) => T;
    backup?: T;
    validate?: (data: T) => boolean;
  },
): Promise<SafeExchangeFetchResult<T>> {
  const fetchFn = options.fetchFn ?? fetchAllowlistedWithTimeout;
  const timeoutMs = options.timeoutMs ?? EXTERNAL_FETCH_TIMEOUT_MS;

  return safeExchangeFetch(
    dex,
    cacheKey,
    async () => {
      const response = await fetchFn(
        options.url,
        options.init,
        options.extraHosts ?? [],
        timeoutMs,
      );

      if (!response.ok) {
        const failure = classifyExchangeFetchFailure(undefined, response.status);
        throw new Error(`${dex} HTTP ${failure.label}`);
      }

      let body: unknown;
      try {
        body = await response.json();
      } catch (err) {
        throw new Error(`${dex} JSON parse failed: ${String(err)}`);
      }

      return options.parse(body);
    },
    {
      backup: options.backup,
      validate: options.validate,
    },
  );
}

export function readExchangePayloadCache<T>(cacheKey: string): T | null {
  const cached = exchangePayloadCache.get(cacheKey);
  return cached == null ? null : (cached as T);
}

export function seedExchangePayloadCache<T>(cacheKey: string, data: T): void {
  exchangePayloadCache.set(cacheKey, data);
}

export function __clearExchangePayloadCacheForTests(): void {
  exchangePayloadCache.clear();
}

export function backupPerpMidsForSymbols(
  symbols: readonly string[],
): Record<string, number> {
  const out: Record<string, number> = {};
  for (const symbol of symbols) {
    const key = symbol.toUpperCase();
    const mid = EXCHANGE_BACKUP_PERP_MIDS[key];
    if (mid != null && mid > 0) out[key] = mid;
  }
  if (Object.keys(out).length === 0) {
    return { ...EXCHANGE_BACKUP_PERP_MIDS };
  }
  return out;
}

export function isNonEmptyPriceMap(map: Record<string, number>): boolean {
  return isNonEmptyRecord(map);
}
