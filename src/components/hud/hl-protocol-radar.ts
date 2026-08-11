/** Hyperliquid native protocol compatibility radar — v0.8 Grant HUD. */

export type HlProtocolIndicatorId =
  | "PORTFOLIO_MARGIN_GUARD"
  | "DYNAMIC_TWAP_SHIELD"
  | "MARGIN_TIER_SCALER"
  | "INSTITUTIONAL_SESSION_KEY";

export type HlProtocolStatus = "COMPATIBLE" | "ACTIVE" | "STANDBY";

export interface HlProtocolIndicator {
  id: HlProtocolIndicatorId;
  label: string;
  status: HlProtocolStatus;
  detail: string;
}

export interface HlProtocolRadarInput {
  sessionKeyActive?: boolean;
  signingChannelOpen?: boolean;
  twapShieldActive?: boolean;
  marginTierHealthy?: boolean;
}

export const HL_PROTOCOL_INDICATORS: readonly {
  id: HlProtocolIndicatorId;
  label: string;
}[] = [
  { id: "PORTFOLIO_MARGIN_GUARD", label: "Portfolio Margin Guard" },
  { id: "DYNAMIC_TWAP_SHIELD", label: "Dynamic TWAP Shield" },
  { id: "MARGIN_TIER_SCALER", label: "Margin Tier Scaler" },
  { id: "INSTITUTIONAL_SESSION_KEY", label: "EIP-712 Session Key (TRADE_ONLY)" },
] as const;

export function resolveHlProtocolRadar(
  input: HlProtocolRadarInput = {},
): readonly HlProtocolIndicator[] {
  const sessionActive = input.sessionKeyActive !== false;
  const signingOpen = input.signingChannelOpen !== false;
  const twapActive = input.twapShieldActive !== false;
  const marginHealthy = input.marginTierHealthy !== false;

  return [
    {
      id: "PORTFOLIO_MARGIN_GUARD",
      label: "Portfolio Margin Guard",
      status: marginHealthy ? "ACTIVE" : "STANDBY",
      detail:
        "Citadel portfolio margin guard (Arbitrum + HL) — enforces Dynamic Max SL = balance × 1% + $100 on every trade",
    },
    {
      id: "DYNAMIC_TWAP_SHIELD",
      label: "Dynamic TWAP Shield",
      status: twapActive ? "COMPATIBLE" : "STANDBY",
      detail:
        "Hyperliquid TWAP-compatible routing — SLI-TWAP 30-path soil-gated execution shield",
    },
    {
      id: "MARGIN_TIER_SCALER",
      label: "Margin Tier Scaler",
      status: marginHealthy ? "ACTIVE" : "STANDBY",
      detail:
        "Hyperliquid cross-tier margin scaler — probes tier health and scales notional caps in real time",
    },
    {
      id: "INSTITUTIONAL_SESSION_KEY",
      label: "EIP-712 Session Key (TRADE_ONLY)",
      status: sessionActive && signingOpen ? "ACTIVE" : "STANDBY",
      detail:
        "Scope: L2 Trade Only | Cap: $5,000 USD | Master Withdrawal: PERMANENTLY DISABLED",
    },
  ];
}

/** Default v0.8 fixture — all four HL native features compatible. */
export function demoHlProtocolRadar(): readonly HlProtocolIndicator[] {
  return resolveHlProtocolRadar({
    sessionKeyActive: true,
    signingChannelOpen: true,
    twapShieldActive: true,
    marginTierHealthy: true,
  });
}
