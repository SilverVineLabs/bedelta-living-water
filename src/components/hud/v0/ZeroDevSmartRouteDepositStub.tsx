/** 1-click Robinhood USDG → Arbitrum GM cross-chain deposit preview (read-only demo). */
import { useState, type ReactNode } from "react";
import { GMX_V2_EXCHANGE_ROUTER_ARBITRUM } from "../../../config/gmx-revenue";
import {
  GMX_ACCENT_TEXT_CLASS,
  GMX_CITADEL_PANEL_CLASS,
  GMX_MUTED_TEXT_CLASS,
  GMX_OFFWHITE_TEXT_CLASS,
} from "../gmx-citadel-theme";
import {
  runSmartRouteDepositPreview,
  type SmartRouteDepositPreview,
} from "../smart-route-deposit-flow";

const DEMO_WALLET = "0xcccccccccccccccccccccccccccccccccccccccc" as const;

export function ZeroDevSmartRouteDepositStub(): ReactNode {
  const [preview, setPreview] = useState<SmartRouteDepositPreview | null>(null);

  const onPreview = () => setPreview(runSmartRouteDepositPreview({ amountUsd: 1_000, wallet: DEMO_WALLET }));

  return (
    <section className={GMX_CITADEL_PANEL_CLASS} data-testid="zerodev-smart-route-deposit-stub">
      <h3 className={`font-mono text-xs font-semibold tracking-[0.14em] uppercase ${GMX_ACCENT_TEXT_CLASS}`}>
        ZeroDev Smart Routing · Cross-Chain Deposit Preview
      </h3>
      <p className={`mt-2 font-data text-[11px] leading-relaxed ${GMX_MUTED_TEXT_CLASS}`}>
        Robinhood 46630 USDG → Arbitrum GM via{" "}
        <span className={GMX_OFFWHITE_TEXT_CLASS}>{GMX_V2_EXCHANGE_ROUTER_ARBITRUM.slice(0, 10)}…</span>
      </p>
      <button
        type="button"
        data-testid="smart-route-deposit-preview-btn"
        onClick={onPreview}
        className="mt-3 rounded border border-[#2d42fc] bg-[#2d42fc]/15 px-4 py-2 font-mono text-[11px] text-[#2d42fc] shadow-[0_0_12px_rgba(45,66,252,0.25)]"
      >
        [ 1-Click Cross-Chain Deposit Preview ]
      </button>
      {preview ? (
        <div className="mt-3 space-y-1 rounded border border-[#1d2842] bg-[#090d16]/70 px-3 py-2 font-mono text-[10px]" data-testid="smart-route-deposit-preview-result">
          <p className={preview.ok ? "text-emerald-400" : "text-rose-400"}>
            {preview.ok ? "[ ✓ GATE SIM ALLOW ]" : "[ ✗ FAIL-CLOSED ]"} · soil={preview.soilTripped ? "TRIP" : "OK"}
          </p>
          <p className={GMX_MUTED_TEXT_CLASS}>route={preview.targetRoute}</p>
          <p className={GMX_MUTED_TEXT_CLASS}>payloadHash={preview.payloadHash ?? "—"}</p>
        </div>
      ) : null}
    </section>
  );
}
