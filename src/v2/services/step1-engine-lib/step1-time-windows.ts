/** US equity open spike window (minutes from midnight EST) — 09:15–09:45 */
const OPEN_SPIKE_START_MIN = 9 * 60 + 15;
const OPEN_SPIKE_END_MIN = 9 * 60 + 45;

/** US equity close spike window (minutes from midnight EST) — 15:45–16:15 */
const CLOSE_SPIKE_START_MIN = 15 * 60 + 45;
const CLOSE_SPIKE_END_MIN = 16 * 60 + 15;

export type EstClockParts = {
  hour: number;
  minute: number;
  totalMinutes: number;
};

/**
 * Convert a UTC instant into America/New_York wall-clock parts (EST/EDT).
 */
export function getEstClockParts(now: Date = new Date()): EstClockParts {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(now);

  const hour = Number(parts.find((p) => p.type === "hour")?.value ?? "0");
  const minute = Number(parts.find((p) => p.type === "minute")?.value ?? "0");
  return { hour, minute, totalMinutes: hour * 60 + minute };
}

/** True when wall clock falls inside the US open spike window */
export function isUsOpenSpikeWindow(now: Date = new Date()): boolean {
  const { totalMinutes } = getEstClockParts(now);
  return (
    totalMinutes >= OPEN_SPIKE_START_MIN && totalMinutes < OPEN_SPIKE_END_MIN
  );
}

/** True when wall clock falls inside the US close spike window */
export function isUsCloseSpikeWindow(now: Date = new Date()): boolean {
  const { totalMinutes } = getEstClockParts(now);
  return (
    totalMinutes >= CLOSE_SPIKE_START_MIN && totalMinutes < CLOSE_SPIKE_END_MIN
  );
}

/** True when either open or close spike window is active */
export function isUsMarketSpikeWindow(now: Date = new Date()): boolean {
  return isUsOpenSpikeWindow(now) || isUsCloseSpikeWindow(now);
}
