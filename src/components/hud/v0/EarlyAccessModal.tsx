import type { FormEvent, ReactNode } from "react";
import { useState } from "react";
import { Mail, X } from "lucide-react";
import { SUBSCRIBE_SUCCESS_MESSAGE } from "../../../routes/subscribe.constants";
import { Button } from "../../ui/button";

export const EARLY_ACCESS_TWITTER_URL = "https://x.com/SilverVineLabs" as const;
export const EARLY_ACCESS_CONTACT_EMAIL = "hello@silvervinelabs.com" as const;

export interface EarlyAccessModalProps {
  open: boolean;
  onClose: () => void;
}

export function EarlyAccessModal({ open, onClose }: EarlyAccessModalProps): ReactNode {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("loading");
    setError(null);
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, source: "early-access-waitlist" }),
      });
      const body = (await res.json()) as { success?: boolean; error?: string };
      if (!res.ok || !body.success) {
        setStatus("error");
        setError(body.error ?? `Waitlist failed (${res.status})`);
        return;
      }
      setStatus("success");
      setEmail("");
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Network error");
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#050810]/80 p-4 backdrop-blur-sm"
      role="presentation"
      data-testid="early-access-modal-overlay"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="early-access-modal-title"
        className="grant-audit-v0-shield-card relative w-full max-w-md rounded-lg border border-primary/50 bg-[#101626] p-6 shadow-[0_0_32px_rgba(45,66,252,0.35)]"
        data-testid="early-access-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          aria-label="Close early access modal"
          className="absolute right-3 top-3 rounded border border-border p-1 text-muted-foreground hover:border-primary/50 hover:text-foreground"
          onClick={onClose}
        >
          <X className="size-4" aria-hidden="true" />
        </button>
        <h2
          id="early-access-modal-title"
          className="pr-8 font-mono text-sm font-semibold leading-snug tracking-tight text-foreground"
        >
          🛡️ BeΔLivingWater Vault — Institutional Audit Phase
        </h2>
        <p className="mt-3 font-mono text-[11px] leading-relaxed text-muted-foreground">
          Public Mainnet sleeve is currently undergoing GMX v2 Grant Audit. Deposit caps will unlock for Early
          Access waitlist members.
        </p>
        {status === "success" ? (
          <p className="mt-4 font-mono text-[11px] font-semibold text-emerald-400" data-testid="early-access-success">
            {SUBSCRIBE_SUCCESS_MESSAGE}
          </p>
        ) : (
          <form className="mt-4 flex flex-col gap-3" onSubmit={onSubmit}>
            <input
              type="email"
              name="email"
              autoComplete="email"
              placeholder="Enter email for early vault access"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="rounded-md border border-border bg-background px-3 py-2 font-mono text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-primary"
              data-testid="early-access-email-input"
            />
            <Button type="submit" disabled={status === "loading"} data-testid="early-access-claim-button">
              {status === "loading" ? "Claiming…" : "[ Claim Early Allocation ]"}
            </Button>
            {error ? (
              <p className="font-mono text-[11px] text-red-400" data-testid="early-access-error">
                {error}
              </p>
            ) : null}
          </form>
        )}
        <div className="mt-5 flex flex-col gap-2 border-t border-border pt-4">
          <a
            href={EARLY_ACCESS_TWITTER_URL}
            target="_blank"
            rel="noreferrer noopener"
            className="grant-audit-v0-glow-badge inline-flex items-center justify-center rounded-md border border-primary/40 bg-primary/10 px-3 py-2 font-mono text-[11px] text-primary hover:border-primary/60"
            data-testid="early-access-twitter-cta"
          >
            [ 🐦 Follow @SilverVineLabs ]
          </a>
          <a
            href={`mailto:${EARLY_ACCESS_CONTACT_EMAIL}`}
            className="inline-flex items-center justify-center gap-1.5 rounded-md border border-border bg-background px-3 py-2 font-mono text-[11px] text-muted-foreground hover:border-primary/50 hover:text-foreground"
            data-testid="early-access-email-cta"
          >
            <Mail className="size-3.5 text-primary" aria-hidden="true" />
            [ ✉️ Contact Protocol Architects ]
          </a>
        </div>
      </div>
    </div>
  );
}
