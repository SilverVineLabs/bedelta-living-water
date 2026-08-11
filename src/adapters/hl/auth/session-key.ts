import { normalizeAddress } from "../crypto";

export function verifySessionKeyValidity(
  sessionKeyAddress: string,
  expiresAt: number,
  nowMs: number = Date.now(),
  clockDriftBufferMs = 5_000,
): boolean {
  if (!Number.isFinite(expiresAt) || expiresAt - clockDriftBufferMs <= nowMs) {
    return false;
  }
  try {
    normalizeAddress(sessionKeyAddress);
    return true;
  } catch {
    return false;
  }
}
