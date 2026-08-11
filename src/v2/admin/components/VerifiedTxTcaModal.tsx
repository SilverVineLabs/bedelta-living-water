import type { Verified5TxFillRecord, Verified5TxResults } from "../../../data/verified-5tx";
import verifiedResultsJson from "../../../data/verified_5tx_results.json";
import { formatUsd } from "./adminHudShared";
import type { HudLocale } from "../hud-i18n";

export function loadVerified5TxResults(): Verified5TxResults {
  return verifiedResultsJson as Verified5TxResults;
}

export function VerifiedTxTcaModal({
  isOpen,
  locale: _locale,
  onClose,
}: {
  isOpen: boolean;
  locale: HudLocale;
  onClose: () => void;
}) {
  const results = loadVerified5TxResults();
  if (!isOpen) return null;
  const t = {
    title: "HL Testnet 5-TX TCA Proof",
    close: "Close",
    wallet: "Session Key Wallet",
    mode: results.dryRun
      ? results.aggregate.stub
        ? "Dry-Run (pnpm verify:5tx)"
        : "Dry-Run"
      : "Live Testnet",
    soil: "checkSoilResistance()",
    saved: "Δ Saved",
    open: "Open Explorer",
    empty: "No fills yet — run pnpm verify:5tx",
  };

  return (
    <div
      className="fixed inset-0 z-[9997] flex items-stretch justify-center bg-slate-950/90 p-3 md:p-6"
      data-testid="verified-tx-tca-modal"
      role="dialog"
      aria-modal="true"
      aria-label={t.title}
    >
      <div className="flex w-full max-w-3xl flex-col overflow-hidden rounded-xl border border-slate-600 bg-slate-900 shadow-2xl">
        <header className="flex items-center justify-between border-b border-slate-700 px-4 py-3">
          <h2 className="text-lg font-semibold text-amber-200">{t.title}</h2>
          <button
            type="button"
            data-testid="tca-close"
            onClick={onClose}
            className="rounded-lg border border-slate-500 px-3 py-1.5 text-sm text-slate-100 hover:bg-slate-800"
          >
            {t.close}
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-4">
          <div className="mb-4 grid gap-2 text-xs text-slate-300 md:grid-cols-2">
            <div>
              <span className="text-slate-500">{t.wallet}:</span>{" "}
              <code className="text-sky-200">{results.wallet}</code>
            </div>
            <div>
              <span className="text-slate-500">Mode:</span>{" "}
              <span className="font-semibold text-emerald-300">{t.mode}</span>
            </div>
            <div>
              <span className="text-slate-500">{t.soil}:</span>{" "}
              <span className={results.soilAudit?.ok ? "text-emerald-300" : "text-red-400"}>
                {results.soilAudit?.ok ? "PASS (BO-01 depth refill armed)" : "TRIPPED"}
              </span>
            </div>
            <div>
              <span className="text-slate-500">{t.saved}:</span>{" "}
              <span className="font-semibold text-emerald-300">
                {formatUsd(results.aggregate.savedUsd)} · {results.aggregate.avoidedBps.toFixed(1)} bps
              </span>
            </div>
          </div>

          {results.fills.length === 0 ? (
            <p className="text-sm text-slate-400">{t.empty}</p>
          ) : (
            <ul className="space-y-2" data-testid="verified-tx-list">
              {results.fills.map((fill: Verified5TxFillRecord) => (
                <li
                  key={`${fill.index}-${fill.txHash}`}
                  className="rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2"
                  data-testid={`verified-tx-${fill.index}`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-sm font-semibold text-slate-100">
                      #{fill.index} {fill.side} {fill.symbol} · ${fill.notionalUsd}
                    </span>
                    <a
                      href={fill.explorerUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      data-testid={`explorer-link-${fill.index}`}
                      className="rounded-md border border-sky-500/60 bg-sky-950/40 px-2.5 py-1 text-xs font-semibold text-sky-200 hover:bg-sky-900/50"
                    >
                      {t.open} ↗
                    </a>
                  </div>
                  <div className="mt-1 font-mono text-[10px] leading-relaxed text-slate-400">
                    tx: {fill.txHash.slice(0, 18)}… · fill {fill.fillTimeSec}s (UTC) · {fill.timestamp}
                  </div>
                  <div className="mt-1 text-[11px] text-slate-300">
                    BO-01 +{fill.w01DepthRefillBps} bps · raw {fill.rawSlippageBps} → gated{" "}
                    {fill.gatedSlippageBps} bps · saved {formatUsd(fill.savedUsd)}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
