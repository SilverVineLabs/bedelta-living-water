/** Format remaining session TTL for HUD display (tabular-friendly). */
export function formatSessionTtlRemaining(ms: number, revoked: boolean): string {
  if (revoked) return "00h 00m 00s (REVOKED)";
  const totalSec = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(totalSec / 3600);
  const minutes = Math.floor((totalSec % 3600) / 60);
  const seconds = totalSec % 60;
  return `${hours}h ${minutes}m ${seconds}s`;
}
