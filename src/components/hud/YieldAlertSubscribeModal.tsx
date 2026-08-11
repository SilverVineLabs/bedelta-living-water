/** Non-intrusive BeΔ yield alert email capture — Vault View banner. */
import type { FormEvent, ReactNode } from "react";
import { useState } from "react";
import { SUBSCRIBE_SUCCESS_MESSAGE } from "../../routes/subscribe.constants";
import { DeltaNeutralLabel } from "../ui/brand-delta-ui";

export interface YieldAlertSubscribeModalProps {
  className?: string;
  source?: string;
}

export function YieldAlertSubscribeModal({
  className = "",
  source = "vault-view",
}: YieldAlertSubscribeModalProps): ReactNode {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("loading");
    setError(null);
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, source }),
      });
      const body = (await res.json()) as { success?: boolean; message?: string; error?: string };
      if (!res.ok || !body.success) {
        setStatus("error");
        setError(body.error ?? `Subscribe failed (${res.status})`);
        return;
      }
      setStatus("success");
      setEmail("");
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Network error");
    }
  }

  if (status === "success") {
    return (
      <aside
        className={`rounded border border-emerald-500/35 bg-emerald-950/20 px-4 py-3 ${className}`}
        data-testid="yield-alert-subscribe-success"
      >
        <p className="font-mono text-[12px] font-semibold text-emerald-300">{SUBSCRIBE_SUCCESS_MESSAGE}</p>
        <p className="mt-1 font-data text-[11px] text-circuit/55">
          No wallet required — alerts cover yield shifts and safety guard events.
        </p>
      </aside>
    );
  }

  return (
    <aside
      className={`rounded border border-circuit/20 bg-moss-deep/60 px-4 py-3 ${className}`}
      data-testid="yield-alert-subscribe-banner"
    >
      <p className="font-mono text-[11px] font-semibold tracking-wide text-circuit">
        BeΔ Yield &amp; Safety Alerts
      </p>
      <p className="mt-1 font-data text-[11px] text-circuit/60">
        Optional email for <DeltaNeutralLabel /> vault yield and drawdown guard updates — no account login.
      </p>
      <form className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center" onSubmit={onSubmit}>
        <input
          type="email"
          name="email"
          autoComplete="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="min-w-0 flex-1 rounded border border-circuit/25 bg-moss-deep/80 px-3 py-2 font-data text-[12px] text-circuit placeholder:text-circuit/35"
          data-testid="yield-alert-email-input"
        />
        <button
          type="submit"
          disabled={status === "loading"}
          className="rounded border border-cyan-400/40 bg-cyan-950/25 px-4 py-2 font-mono text-[11px] text-cyan-200 hover:border-cyan-300/60 disabled:opacity-60"
          data-testid="yield-alert-submit"
        >
          {status === "loading" ? "Saving…" : "Subscribe"}
        </button>
      </form>
      {error ? (
        <p className="mt-2 font-data text-[11px] text-rose-300" data-testid="yield-alert-error">
          {error}
        </p>
      ) : null}
    </aside>
  );
}

export default YieldAlertSubscribeModal;
