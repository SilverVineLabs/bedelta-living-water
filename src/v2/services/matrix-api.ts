import {
  assertUiWorkerHandshake,
  buildUiHandshakeHeaders,
} from "../../services/defense/ui-canary";
import type { MatrixResponse, MatrixSuccessResponse } from "../../types/matrix";
import {
  isSilentBufferFetchFailure,
  logBufferedTelemetryOnce,
} from "../lib/hud-buffer-log";

const DEFAULT_POLL_MS = 20_000;

export interface MatrixApiSnapshot {
  payload: MatrixSuccessResponse;
  fetchedAt: number;
}

export class MatrixApiBufferError extends Error {
  constructor() {
    super("MATRIX_API_BUFFERED");
    this.name = "MatrixApiBufferError";
  }
}

export async function fetchMatrixApiData(): Promise<MatrixApiSnapshot> {
  const handshake = assertUiWorkerHandshake();
  if (!handshake.ok) {
    throw new Error(handshake.message);
  }

  try {
    const response = await fetch("/api/data", {
      method: "GET",
      headers: {
        Accept: "application/json",
        ...buildUiHandshakeHeaders(),
      },
    });

    let body: MatrixResponse;
    try {
      body = (await response.json()) as MatrixResponse;
    } catch (parseErr) {
      if (isSilentBufferFetchFailure(parseErr)) {
        logBufferedTelemetryOnce();
        throw new MatrixApiBufferError();
      }
      throw parseErr;
    }

    if (response.status === 403 || ("hardlock" in body && body.hardlock)) {
      const message =
        "error" in body && body.error
          ? body.error
          : "Hardlock Access Denied · signing channel severed";
      throw new Error(message);
    }

    if (!("success" in body) || body.success !== true) {
      if (!response.ok && response.status >= 500) {
        logBufferedTelemetryOnce();
        throw new MatrixApiBufferError();
      }
      const message =
        "error" in body && body.error ? body.error : `API error HTTP ${response.status}`;
      throw new Error(message);
    }

    return { payload: body, fetchedAt: Date.now() };
  } catch (err) {
    if (err instanceof MatrixApiBufferError) throw err;
    if (isSilentBufferFetchFailure(err)) {
      logBufferedTelemetryOnce();
      throw new MatrixApiBufferError();
    }
    throw err;
  }
}

export function resolveMatrixPollIntervalMs(
  pollMs = DEFAULT_POLL_MS,
): number {
  return Math.max(5_000, pollMs);
}

export { DEFAULT_POLL_MS };
