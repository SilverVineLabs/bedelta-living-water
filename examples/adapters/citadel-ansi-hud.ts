/**
 * Shared Cyberpunk ANSI HUD for SliverVine Citadel agent adapters.
 */
import { checkSoilResistance, type SoilResistanceInput, type SoilResistanceResult } from "../../src/services/risk-control";
import { __resetArbitrumGasGuardForTests } from "../../src/services/risk/arbitrum-gas-guard";
import { __resetSequencerGuardCacheForTests } from "../../src/services/risk/sequencer-guard";
import { __resetSoftConfirmationGuardForTests } from "../../src/services/risk/soft-confirmation-guard";
import { seedSafeArbitrumProbes } from "../../tests/helpers/arbitrum-probe-seed";

export const R = "\x1b[0m";
export const RED = "\x1b[31;1m";
export const GREEN = "\x1b[32;1m";
export const YELLOW = "\x1b[33;1m";
export const CYAN = "\x1b[36;1m";
export const GRAY = "\x1b[90m";
export const BOLD = "\x1b[1m";

const BOX_W = 63;

export const HEALTHY_SOIL: SoilResistanceInput = {
  symbol: "ETH",
  hlSpot: 3500,
  hlPerp: 3500,
  dydxPerp: 3500,
  depthUsd: 200_000,
  at: new Date(),
};

export const TOXIC_SOIL: SoilResistanceInput = {
  ...HEALTHY_SOIL,
  depthUsd: 1,
  hlPerp: 4200,
  hlSpot: 3500,
};

export function seedAdapterProbes(nowMs: number = Date.now()): void {
  __resetArbitrumGasGuardForTests();
  __resetSequencerGuardCacheForTests();
  __resetSoftConfirmationGuardForTests();
  seedSafeArbitrumProbes(nowMs);
}

function padBanner(text: string): string {
  const inner = ` ${text} `;
  const pad = Math.max(0, BOX_W - inner.length);
  return `${"─".repeat(Math.floor(pad / 2))}${inner}${"─".repeat(Math.ceil(pad / 2))}`;
}

export function printBanner(subtitle: string): void {
  const inner = `🛡️  SliverVine Citadel Shield · ${subtitle}`;
  console.log(`${CYAN}┌${"─".repeat(BOX_W)}┐${R}`);
  console.log(`${CYAN}│${R}${BOLD}${padBanner(inner)}${R}${CYAN}│${R}`);
  console.log(`${CYAN}└${"─".repeat(BOX_W)}┘${R}`);
}

export function printMode(trip: boolean): void {
  const label = trip ? "ROGUE_TOXIC_INTENT (--trip)" : "NORMAL_INTENT";
  console.log(`${BOLD}MODE:${R} ${trip ? RED : GREEN}${label}${R}\n`);
}

export function printResult(pass: boolean): void {
  const line = "═".repeat(BOX_W + 2);
  if (pass) {
    console.log(`\n${GREEN}${line}${R}`);
    console.log(`${GREEN}${BOLD}RESULT: ✅ LIFECYCLE COMPLETE: PASS (Pre-Broadcast Allowed)${R}`);
    console.log(`${GREEN}${line}${R}`);
    return;
  }
  console.log(`\n${RED}${line}${R}`);
  console.log(`${RED}${BOLD}RESULT: 🛑 LIFECYCLE COMPLETE: FAIL_CLOSED (0-Gas Intercepted)${R}`);
  console.log(`${RED}${line}${R}`);
}

function formatTripAlert(reasons: string[]): string {
  const primary = reasons.find((r) => r.includes("CROSS_VENUE_SLIPPAGE")) ?? reasons[0] ?? "SOIL_RESISTANCE_TRIP";
  const match = primary.match(/CROSS_VENUE_SLIPPAGE=([0-9.]+)%>([0-9.]+)%/);
  if (match) {
    return `SOIL_RESISTANCE_TRIP: CROSS_VENUE_SLIPPAGE (${parseFloat(match[1]).toFixed(2)}% > ${match[2]}%)`;
  }
  return `SOIL_RESISTANCE_TRIP: ${primary.replace(/=/g, " ")}`;
}

function formatLatency(us: number): string {
  const ms = us / 1000;
  return ms >= 1 ? `${YELLOW}${ms.toFixed(1)}ms${R}` : `${YELLOW}${us.toFixed(1)}µs${R}`;
}

function hudLine(tag: string, body: string, color: string): void {
  console.log(`${color}${BOLD}[${tag}]${R}    ${body}`);
}

export function hudIntent(agentId: string, framework: string, intent: string, venue: string): void {
  hudLine("INTENT", `agentId: ${CYAN}${agentId}${R} | framework: ${CYAN}${framework}${R}`, CYAN);
  hudLine("INTENT", `intent: ${intent} | venue: ${venue}`, GRAY);
}

export function hudSoilFuse(pass: boolean, latencyUs: number, reasons: string[]): void {
  if (!pass) hudLine("ALERT", formatTripAlert(reasons), RED);
  const passLabel = pass ? `${GREEN}true${R}` : `${RED}false${R}`;
  hudLine(
    "FUSE",
    `checkSoilResistance() -> PASS: ${passLabel} | latency: ${formatLatency(latencyUs)} ${GRAY}(Edge p50: ~106µs)${R}`,
    pass ? GREEN : YELLOW,
  );
}

export function hudSevered(trigger: string): void {
  hudLine("SEVERED", `EIP-712 Signature Channel: ${RED}CLOSED${R} (Fail-Closed · ${trigger})`, RED);
}

export function hudBlocked(): void {
  hudLine("BLOCKED", `UserOp Dispatch: ${RED}REJECTED${R} | Gas Cost: ${CYAN}0-Gas (Pre-Broadcast)${R}`, RED);
}

export function hudChannelOpen(): void {
  hudLine("CHANNEL", `EIP-712 Signature Channel: ${GREEN}OPEN${R}`, GREEN);
}

export function hudDispatched(target: string, latencyUs: number): void {
  hudLine("DISPATCH", `UserOp Dispatch: ${GREEN}ALLOWED${R} | target: ${target} | latency: ${formatLatency(latencyUs)}`, GREEN);
}

export const COOLDOWN_MS = 60_000;

export function isCooldownError(message: string): boolean {
  return message.includes("MANDATORY_COOLDOWN_ACTIVE");
}

export function parseShieldTripReasons(message: string): string[] {
  const prefix = "[Citadel Shield Trip] Execution blocked pre-broadcast: ";
  if (message.startsWith(prefix)) {
    return message.slice(prefix.length).split("; ").filter(Boolean);
  }
  return [message];
}

export function parseBackoffRemainingSec(message: string): number {
  const match = message.match(/for the next (\d+) seconds/);
  return match ? Number.parseInt(match[1], 10) : 60;
}

export function hudBackoff(agentId: string, remainingSec: number): void {
  hudLine(
    "BACK-OFF",
    `LLM Back-off active for agent ${CYAN}${agentId}${R} — ${YELLOW}DO NOT RETRY${R} or invoke LLM inference for ${YELLOW}${remainingSec}s${R}`,
    YELLOW,
  );
}

export function printBackoffResult(): void {
  const line = "═".repeat(BOX_W + 2);
  console.log(`\n${YELLOW}${line}${R}`);
  console.log(`${YELLOW}${BOLD}RESULT: ⏸️  MANDATORY_COOLDOWN_ACTIVE (LLM Back-off Engaged)${R}`);
  console.log(`${YELLOW}${line}${R}`);
}

export function printBackoffDivider(): void {
  console.log(`\n${CYAN}${BOLD}--- LLM Back-off Demo: immediate retry (same agentId) ---${R}\n`);
}

export interface SoilHudRun {
  result: SoilResistanceResult;
  measuredUs: number;
  pass: boolean;
}

export function runSoilCheckHud(
  soil: SoilResistanceInput,
  meta: { agentId: string; framework: string; intent: string; venue?: string },
): SoilHudRun {
  hudIntent(meta.agentId, meta.framework, meta.intent, meta.venue ?? "GMX v2 ETH/USDC GM");
  const t0 = performance.now();
  const result = checkSoilResistance(soil);
  const measuredUs = (performance.now() - t0) * 1000;
  const pass = result.ok;
  hudSoilFuse(pass, measuredUs, result.reasons);
  return { result, measuredUs, pass };
}
