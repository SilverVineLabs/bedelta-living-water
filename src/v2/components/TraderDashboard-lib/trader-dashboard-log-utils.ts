import {
  BASE_TERMINAL_LOG_TEMPLATES,
  createTerminalLog,
  type TerminalLogLine,
} from "../LiveRiskTelemetryConsole";
import type { TxBatchRecord } from "../../../components/hud/Section1/section1-hud-types";
import {
  DEFAULT_SCALE_DOWN_COMBO,
  type ScaleDownComboId,
} from "../../../components/hud/scale-down-presets";
import type { Dispatch, SetStateAction } from "react";

export const MEV_FEED_FREEZE_MS = 5_000;
export const MEV_TOAST_DURATION_MS = 4_000;
export const MEV_TOAST_MESSAGE = "100% MEV Intercepted (0.00ms delay)";
export const TERMINAL_ROTATE_MS = 4_000;
export const MAX_TERMINAL_LOGS = 12;
export const LIVE_FILL_STREAM_MS = 150;
export const REVIEW_BOOT_DELAY_MS = 400;
export const DEMO_PLAYBACK_MS = 600;

export function resolveInitialComboFromUrl(): ScaleDownComboId {
  if (typeof window === "undefined") return DEFAULT_SCALE_DOWN_COMBO;
  const preset = new URLSearchParams(window.location.search).get("preset");
  if (preset === "v0.8") return "COMBO_A";
  if (preset === "v1.0") return "COMBO_B";
  if (preset === "v1.5") return "COMBO_C";
  return DEFAULT_SCALE_DOWN_COMBO;
}

export function isReviewerDemoMode(): boolean {
  if (typeof window === "undefined") return false;
  return new URLSearchParams(window.location.search).get("mode") === "review";
}

export function seedTerminalLogs(): TerminalLogLine[] {
  return BASE_TERMINAL_LOG_TEMPLATES.map((entry) =>
    createTerminalLog(entry.level, entry.message),
  );
}

export function resolveSelectedBatch(
  batches: readonly TxBatchRecord[],
  batchId: string | null,
): TxBatchRecord | null {
  if (!batchId || batches.length === 0) return null;
  return batches.find((b) => b.id === batchId) ?? null;
}

export function appendLogs(
  setter: Dispatch<SetStateAction<TerminalLogLine[]>>,
  templates: readonly { level: TerminalLogLine["level"]; message: string }[],
): void {
  setter((prev) =>
    [
      ...prev,
      ...templates.map((entry) => createTerminalLog(entry.level, entry.message)),
    ].slice(-MAX_TERMINAL_LOGS),
  );
}

export function playbackLogs(
  setter: Dispatch<SetStateAction<TerminalLogLine[]>>,
  templates: readonly { level: TerminalLogLine["level"]; message: string }[],
  intervalMs: number,
  onComplete?: () => void,
): void {
  let index = 0;
  const tick = () => {
    if (index >= templates.length) {
      onComplete?.();
      return;
    }
    appendLogs(setter, [templates[index]!]);
    index += 1;
    window.setTimeout(tick, intervalMs);
  };
  tick();
}
