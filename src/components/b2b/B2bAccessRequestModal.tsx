import { useState, type FormEvent, type ReactNode } from "react";
import { Mail, X } from "lucide-react";
import { Button } from "../ui/button";
import { EARLY_ACCESS_CONTACT_EMAIL } from "../hud/v0/EarlyAccessModal";

export interface B2bAccessRequestModalProps {
  open: boolean;
  onClose: () => void;
}

export function B2bAccessRequestModal({ open, onClose }: B2bAccessRequestModalProps): ReactNode {
  const [email, setEmail] = useState("");
  const [firm, setFirm] = useState("");

  if (!open) return null;

  function onSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    const subject = encodeURIComponent("SliverVine Institutional API Access");
    const body = encodeURIComponent(`Firm: ${firm}\nEmail: ${email}\nEquity verification pending.`);
    window.location.href = `mailto:${EARLY_ACCESS_CONTACT_EMAIL}?subject=${subject}&body=${body}`;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#050810]/80 p-4 backdrop-blur-sm"
      role="presentation"
      data-testid="b2b-access-request-overlay"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        className="relative w-full max-w-md rounded-lg border border-primary/50 bg-[#101626] p-6"
        data-testid="b2b-access-request-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <button type="button" aria-label="Close" className="absolute right-3 top-3" onClick={onClose}>
          <X className="size-4" aria-hidden="true" />
        </button>
        <h2 className="font-mono text-sm font-semibold text-foreground">Institutional API Access Form</h2>
        <p className="mt-2 font-mono text-[10px] text-muted-foreground">
          Wallet equity &gt; $50k required for live Sidecar keys. Submit firm details for dry-run audit onboarding.
        </p>
        <form className="mt-4 flex flex-col gap-2" onSubmit={onSubmit}>
          <input
            value={firm}
            onChange={(e) => setFirm(e.target.value)}
            placeholder="Fund / MM / Integrator name"
            required
            className="rounded-md border border-border bg-background px-3 py-2 font-mono text-sm"
          />
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Institutional contact email"
            required
            className="rounded-md border border-border bg-background px-3 py-2 font-mono text-sm"
          />
          <Button type="submit" className="font-mono text-[11px]">
            Submit Access Request
          </Button>
        </form>
        <a
          href={`mailto:${EARLY_ACCESS_CONTACT_EMAIL}`}
          className="mt-3 inline-flex items-center gap-1 font-mono text-[10px] text-primary"
        >
          <Mail className="size-3" aria-hidden="true" /> hello@silvervinelabs.com
        </a>
      </div>
    </div>
  );
}
