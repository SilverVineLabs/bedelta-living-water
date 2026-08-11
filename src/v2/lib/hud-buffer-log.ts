let bufferedTelemetryLogged = false;

export const HUD_BUFFER_LOG =
  "[SILVERVINE CITADEL HUD] Engine: Santenmoku v0.8 (Buffered Telemetry Active)";

export function logBufferedTelemetryOnce(): void {
  if (bufferedTelemetryLogged || typeof console === "undefined") return;
  bufferedTelemetryLogged = true;
  console.info(HUD_BUFFER_LOG);
}

export function isSilentBufferFetchFailure(err: unknown): boolean {
  if (!(err instanceof TypeError) && !(err instanceof Error)) return true;
  const msg = err.message.toLowerCase();
  return (
    msg.includes("failed to fetch") ||
    msg.includes("networkerror") ||
    msg.includes("network request failed") ||
    msg.includes("network connection lost") ||
    msg.includes("connection lost") ||
    msg.includes("connection refused") ||
    msg.includes("load failed") ||
    msg.includes("fetch failed")
  );
}
