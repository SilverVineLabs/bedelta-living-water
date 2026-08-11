import type { HlProtocolIndicator } from "./hl-protocol-radar";

const INACTIVE_ADAPTER_STATUSES = new Set<string>(["OFFLINE", "STANDBY"]);

export function countActiveAdapters(indicators: readonly HlProtocolIndicator[]): number {
  return indicators.filter((item) => !INACTIVE_ADAPTER_STATUSES.has(item.status)).length;
}
