import type { ReactNode } from "react";

export const PHASE01_INSPECTOR_GUIDE_COPY = {
  sequencer: "Intersects L2 sequencer halts before toxic MEV sandwiching.",
  oracle: "Differentiates Chainlink heartbeat idle vs true oracle staleness.",
  l1Gas: "Caps L1 calldata surcharge spikes from draining GM LP yield.",
  tvl: "Cryptographically verified 1:1 GMX GM vs Hyperliquid Perp hedge.",
} as const;

export interface Phase01InspectorGuideOverlayProps {
  active: boolean;
  testId: string;
  copy: string;
  children: ReactNode;
}

export function Phase01InspectorGuideOverlay({
  active,
  testId,
  copy,
  children,
}: Phase01InspectorGuideOverlayProps): ReactNode {
  return (
    <div className="relative">
      {children}
      {active ? (
        <div
          data-testid={testId}
          className="absolute inset-0 z-10 flex items-end rounded-md border border-[#2d42fc]/45 bg-[#2d42fc]/20 p-3 shadow-[0_0_20px_rgba(45,66,252,0.35)] backdrop-blur-[2px]"
        >
          <p className="font-mono text-[10px] leading-relaxed text-sky-100">{copy}</p>
        </div>
      ) : null}
    </div>
  );
}
