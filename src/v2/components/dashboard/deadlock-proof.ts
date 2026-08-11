import { setCitadelChaosMode } from "../../../components/hud/citadel-chaos-store";
import { updateSystemState } from "../../../core/state";
import { computeVerified5TxSha256Anchor } from "../../../data/verified-5tx";
import { formatTruncatedSha256Anchor } from "../../../data/verified-5tx-display-helpers";
import type { TxBatchRecord } from "../../../components/hud/Section1/section1-hud-types";

export interface DeadlockCryptographicProof {
  protocol: "SliverVine";
  event: "KV_PERSISTED_HARDLOCK_TRIGGERED";
  triggeredAt: string;
  defenseRoots: readonly string[];
  sessionStatus: "SESSION_KEY_REVOKED" | "KV_PERSISTED_HARDLOCK";
  sha256Anchor: string | null;
  sha256AnchorTruncated: string | null;
}

export function buildDeadlockCryptographicProof(
  sessionKeyRevoked: boolean,
  batch: TxBatchRecord | null,
): DeadlockCryptographicProof {
  const anchor = batch ? computeVerified5TxSha256Anchor(batch.results.fills) : null;
  return {
    protocol: "SliverVine",
    event: "KV_PERSISTED_HARDLOCK_TRIGGERED",
    triggeredAt: new Date().toISOString(),
    defenseRoots: [
      "R20 (KV Hardlock)",
      "R17 (Daily Drawdown)",
      "BO-01 (Fail-Closed Soil Probe)",
    ],
    sessionStatus: sessionKeyRevoked ? "SESSION_KEY_REVOKED" : "KV_PERSISTED_HARDLOCK",
    sha256Anchor: anchor,
    sha256AnchorTruncated: anchor ? formatTruncatedSha256Anchor(anchor) : null,
  };
}

export function formatDeadlockProofToast(anchorTruncated: string | null): string {
  const hash = anchorTruncated ?? "n/a";
  return `[ 🛡️ CRYPTOGRAPHIC PROOF COPIED TO CLIPBOARD | SHA-256: ${hash} ]`;
}

export async function copyDeadlockProofJson(
  proof: DeadlockCryptographicProof,
): Promise<boolean> {
  const text = JSON.stringify(proof, null, 2);
  if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      /* execCommand fallback */
    }
  }
  if (typeof document === "undefined") return false;
  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "true");
  textarea.style.position = "fixed";
  textarea.style.left = "-9999px";
  document.body.appendChild(textarea);
  textarea.select();
  const copied = document.execCommand("copy");
  document.body.removeChild(textarea);
  return copied;
}

/** Clear browser stores + SSOT hardlock flags before HUD hard reload. */
export function resetHudSystemStateAfterDeadlock(): void {
  try {
    localStorage.clear();
    sessionStorage.clear();
  } catch {
    /* private mode / quota */
  }
  setCitadelChaosMode(null);
  updateSystemState({
    patch: {
      signingChannelOpen: true,
      sessionKeyMode: "TRADE_ACTIVE",
      sessionKeyStatus: "OK",
      hardlock: false,
      currentCri: 100,
    },
  });
}

export function resolveHasActiveSessionKey(input: {
  sessionKeyBound: boolean;
  sessionKeyRevoked: boolean;
  ttlExpiryMs: number | null;
}): boolean {
  return input.sessionKeyBound || input.sessionKeyRevoked || input.ttlExpiryMs != null;
}

/** Authenticated-session gate — guests/public auditors stay on read-only HUD. */
export function shouldShowHardlockModal(input: {
  isHardlocked: boolean;
  isWalletConnected: boolean;
  hasActiveSessionKey: boolean;
}): boolean {
  return input.isHardlocked && input.isWalletConnected && input.hasActiveSessionKey;
}
