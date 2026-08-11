import { useEffect, useRef, useState, type ReactNode } from "react";
import { formatSessionTtlRemaining } from "../../session-ttl-format";
import type { EmergencyRevokeButtonProps } from "./types";

const ARM_CONFIRM_MS = 3_000;
const REVOKED_FEEDBACK_MS = 2_000;

type RevokeUiState = "idle" | "armed" | "revoked-feedback";

export function EmergencyRevokeButton({
  walletConnected,
  sessionKeyActive,
  sessionKeyRevoked,
  demoRunning = false,
  ttlExpiryMs,
  onEmergencyRevoke,
}: EmergencyRevokeButtonProps): ReactNode {
  const [uiState, setUiState] = useState<RevokeUiState>("idle");
  const [ttlRemainingMs, setTtlRemainingMs] = useState(0);
  const armTimeoutRef = useRef<number | null>(null);
  const feedbackTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    if (sessionKeyRevoked) {
      setUiState("idle");
    }
  }, [sessionKeyRevoked]);

  useEffect(() => {
    if (!sessionKeyActive || sessionKeyRevoked || ttlExpiryMs == null) {
      setTtlRemainingMs(0);
      return undefined;
    }
    const tick = () => setTtlRemainingMs(Math.max(0, ttlExpiryMs - Date.now()));
    tick();
    const timer = window.setInterval(tick, 1_000);
    return () => window.clearInterval(timer);
  }, [ttlExpiryMs, sessionKeyRevoked, sessionKeyActive]);

  useEffect(
    () => () => {
      if (armTimeoutRef.current !== null) window.clearTimeout(armTimeoutRef.current);
      if (feedbackTimeoutRef.current !== null) {
        window.clearTimeout(feedbackTimeoutRef.current);
      }
    },
    [],
  );

  const clearArmTimeout = () => {
    if (armTimeoutRef.current !== null) {
      window.clearTimeout(armTimeoutRef.current);
      armTimeoutRef.current = null;
    }
  };

  const handleClick = () => {
    if (!sessionKeyActive && !sessionKeyRevoked) return;

    if (sessionKeyRevoked) {
      onEmergencyRevoke();
      return;
    }

    if (uiState === "idle") {
      setUiState("armed");
      clearArmTimeout();
      armTimeoutRef.current = window.setTimeout(() => {
        setUiState("idle");
        armTimeoutRef.current = null;
      }, ARM_CONFIRM_MS);
      return;
    }

    if (uiState === "armed") {
      clearArmTimeout();
      setUiState("revoked-feedback");
      onEmergencyRevoke();
      if (feedbackTimeoutRef.current !== null) {
        window.clearTimeout(feedbackTimeoutRef.current);
      }
      feedbackTimeoutRef.current = window.setTimeout(() => {
        setUiState("idle");
        feedbackTimeoutRef.current = null;
      }, REVOKED_FEEDBACK_MS);
    }
  };

  if (demoRunning) {
    return (
      <div className="mt-2 min-w-0" data-testid="emergency-revoke-demo-mode">
        <div className="w-full rounded border border-cyan-500/40 bg-cyan-950/30 px-2 py-2.5 font-data">
          <span className="block text-[10px] font-semibold leading-tight text-cyan-200">
            [ 🤖 Auto-Demo Active — Read-Only Mode ]
          </span>
          <span className="mt-0.5 block text-xs font-mono leading-tight text-cyan-300/80">
            Session Key pipeline disabled during demo playback
          </span>
        </div>
      </div>
    );
  }

  const ttlLabel =
    ttlExpiryMs != null
      ? formatSessionTtlRemaining(ttlRemainingMs, sessionKeyRevoked)
      : "N/A";

  let line1: string;
  let line2: string;
  let buttonClass: string;
  let testId: string;
  let disabled = false;

  if (sessionKeyRevoked) {
    line1 = "[ 🔄 Re-Auth 24h Session Key ]";
    line2 = `TTL: ${ttlLabel} · Session Revoked`;
    buttonClass =
      "w-full rounded border border-emerald-500/50 bg-emerald-950/40 px-2 py-2.5 font-data hover:bg-emerald-900/40";
    testId = "reauth-session-key-bar";
  } else if (!walletConnected) {
    line1 = "[ 🔒 Session Key Unbound ]";
    line2 = "Connect wallet to enable EIP-712 Session";
    buttonClass =
      "w-full cursor-not-allowed rounded border border-zinc-700 bg-zinc-900/60 px-2 py-2.5 font-data opacity-80";
    testId = "emergency-revoke-disconnected-bar";
    disabled = true;
  } else if (!sessionKeyActive) {
    line1 = "[ ⏳ Awaiting EIP-712 Bind ]";
    line2 = "Execute 5-TX to sign Session Agent";
    buttonClass =
      "w-full cursor-not-allowed rounded border border-amber-500/40 bg-amber-950/30 px-2 py-2.5 font-data opacity-90";
    testId = "emergency-revoke-unbound-bar";
    disabled = true;
  } else if (uiState === "revoked-feedback") {
    line1 = "[ 💥 SESSION REVOKED ]";
    line2 = "Hot pipeline severed · READ_ONLY_OBSERVER";
    buttonClass =
      "w-full rounded border border-red-500 bg-red-900/70 px-2 py-2.5 font-data shadow-[0_0_16px_rgba(239,68,68,0.45)]";
    testId = "emergency-revoke-feedback-bar";
  } else if (uiState === "armed") {
    line1 = "[ ⚠️ CONFIRM EMERGENCY REVOKE? ]";
    line2 = "Click again within 3s to terminate Session Agent";
    buttonClass =
      "w-full animate-pulse rounded border border-red-500 bg-red-950/80 px-2 py-2.5 font-data shadow-[0_0_14px_rgba(239,68,68,0.35)] hover:bg-red-900/60";
    testId = "emergency-revoke-armed-bar";
  } else {
    line1 = "[ 🛑 Emergency Revoke Keys ]";
    line2 = `TTL: ${ttlLabel} · EIP-712 Active · Cap: $5,000 Max Notional`;
    buttonClass =
      "w-full rounded border border-red-500/40 bg-red-950/30 px-2 py-2.5 font-data hover:bg-red-900/40";
    testId = "emergency-revoke-keys-bar";
  }

  return (
    <div className="mt-2 min-w-0">
      <button
        type="button"
        data-testid={testId}
        disabled={disabled}
        onClick={handleClick}
        className={buttonClass}
      >
        <span
          className={`block text-[10px] font-semibold leading-tight ${
            sessionKeyRevoked
              ? "text-emerald-200"
              : !walletConnected || !sessionKeyActive
                ? "text-zinc-400"
                : "text-red-200"
          }`}
        >
          {line1}
        </span>
        <span
          className="mt-0.5 block text-xs font-mono font-semibold leading-tight tracking-wider text-white"
          data-testid="emergency-revoke-ttl-line"
        >
          {line2}
        </span>
      </button>
    </div>
  );
}
