/** True when executing in a browser context (guards SSR / prerender / extension noise). */
export function isBrowser(): boolean {
  return typeof window !== "undefined" && typeof document !== "undefined";
}

/** Safe epoch ms for client-only timestamps; 0 during non-browser phases. */
export function clientNowMs(): number {
  return isBrowser() ? Date.now() : 0;
}

/**
 * Best-effort read of a window property without throwing when wallet extensions
 * install broken getters on `window`.
 */
export function readWindowProperty(name: string): unknown {
  if (!isBrowser()) return undefined;
  try {
    return (window as unknown as Record<string, unknown>)[name];
  } catch {
    return undefined;
  }
}
