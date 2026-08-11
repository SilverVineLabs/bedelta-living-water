import { useEffect, useState, type ReactNode } from "react";
import { Button } from "../ui/button";
import { B2bAccessRequestModal } from "./B2bAccessRequestModal";
import { B2bOptionCSavingsCalculator } from "./B2bOptionCSavingsCalculator";
import { B2bSidecarProbeTest } from "./B2bSidecarProbeTest";

const SIDECAR_BLUEPRINT_TAG = "[ 🛠️ Developer Sidecar Blueprint (v0.8-preview) ]" as const;
const SIDECAR_DOCKER_CMD = `# GMX-native sidecar (v0.8-preview)
docker build -t silvervine-sidecar -f docker/Dockerfile.sidecar .
docker run -d -p 8080:8080 --name sv-sidecar silvervine-sidecar`;
const TELEMETRY_PROBE =
  "[ ⚡ 500ms DECISION DEADLINE SLO : FAIL-CLOSED ARMED ] [Vector Bias: 0.000] [Escalation Ladder: GREEN 10x]";

const PRICING_TIERS = [
  {
    id: "option-a",
    label: "Option A — Monthly License",
    detail: "$2,500/mo flat · 0% performance fee · dedicated Citadel sidecar routing.",
  },
  {
    id: "option-b",
    label: "Option B — Performance Fee",
    detail: "10% of verified slippage savings · pay only when execution alpha is captured.",
  },
  {
    id: "option-c",
    label: "Option C — Enterprise Usage License",
    detail: "[ Flexible Usage-Based License: Contact for Enterprise SLA & GMX Co-Integration ]",
  },
] as const;

async function verifyWalletEquityOver50k(): Promise<boolean> {
  if (typeof window === "undefined") return false;
  const eth = (window as Window & { ethereum?: { request?: (args: { method: string }) => Promise<unknown> } }).ethereum;
  if (!eth?.request) return false;
  try {
    await eth.request({ method: "eth_requestAccounts" });
    return false;
  } catch {
    return false;
  }
}

export function B2bInstitutionalPage(): ReactNode {
  const [probeSeq, setProbeSeq] = useState(0);
  const [accessOpen, setAccessOpen] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setProbeSeq((value) => value + 1), 500);
    return () => clearInterval(timer);
  }, []);

  async function onRequestAccess(): Promise<void> {
    const verified = await verifyWalletEquityOver50k();
    if (!verified) setAccessOpen(true);
  }

  return (
    <>
      <div
        className="grant-audit-v0-root mx-auto flex min-h-screen max-w-5xl flex-col gap-6 px-4 py-8 md:px-8"
        data-testid="b2b-institutional-page"
      >
        <header className="flex flex-col gap-2">
          <a href="/" className="font-mono text-[10px] text-primary hover:underline">
            ← Back to Grant Audit Vault
          </a>
          <h1 className="font-mono text-lg font-semibold text-foreground md:text-xl">
            GMX v2 Institutional Protection &amp; Sidecar Gateway
          </h1>
          <p className="font-mono text-[11px] text-muted-foreground">
            GMX underweight-side delta-neutral hedging for large GM bag holders · 5 bps uiFeeReceiver integration · Hyperliquid short-leg fail-closed sponge
          </p>
          <p className="font-mono text-[10px] text-primary/90">
            Protect existing GMX v2 GM positions without unwinding — route rebalances to underweight pool sides via Citadel Sidecar API.
          </p>
        </header>

        <section
          className="rounded-lg border border-emerald-500/40 bg-emerald-950/20 p-4 font-mono text-[10px] text-emerald-300"
          data-testid="b2b-telemetry-stream"
        >
          <span className="text-muted-foreground">Live Telemetry Terminal · tick {probeSeq}</span>
          <p className="mt-2 animate-pulse">{TELEMETRY_PROBE}</p>
        </section>

        <section className="rounded-lg border border-border bg-card p-5" data-testid="b2b-sidecar-integration">
          <div className="flex flex-col gap-1">
            <span className="font-mono text-[10px] font-semibold text-primary">{SIDECAR_BLUEPRINT_TAG}</span>
            <h2 className="font-mono text-[11px] font-semibold uppercase tracking-widest text-primary">
              GMX v2 Sidecar Integration
            </h2>
          </div>
          <pre className="mt-3 overflow-x-auto rounded-md border border-border bg-background p-3 font-mono text-[10px] text-foreground">
            {SIDECAR_DOCKER_CMD}
          </pre>
          <B2bSidecarProbeTest />
        </section>

        <section className="flex flex-col gap-3" data-testid="b2b-pricing-ladder">
          <h2 className="font-mono text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
            Hybrid Pricing Tier
          </h2>
          {PRICING_TIERS.map((tier) => (
            <div
              key={tier.id}
              className="rounded-md border border-border bg-background/60 p-4"
              data-testid={`b2b-pricing-${tier.id}`}
            >
              <p className="font-mono text-[11px] font-semibold text-primary">{tier.label}</p>
              <p className="mt-1 font-mono text-[10px] text-muted-foreground">{tier.detail}</p>
              {tier.id === "option-c" ? <B2bOptionCSavingsCalculator /> : null}
            </div>
          ))}
        </section>

        <Button
          type="button"
          className="w-full font-mono text-[11px] shadow-[0_0_16px_rgba(45,66,252,0.35)] sm:w-auto"
          data-testid="b2b-request-institutional-access"
          onClick={() => void onRequestAccess()}
        >
          [ 🔒 Request Institutional API Access ]
        </Button>
      </div>
      <B2bAccessRequestModal open={accessOpen} onClose={() => setAccessOpen(false)} />
    </>
  );
}
