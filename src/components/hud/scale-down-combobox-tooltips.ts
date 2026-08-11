import type { ScaleDownComboId } from "./scale-down-presets";

export const PRESET_HOVER_TOOLTIPS: Record<ScaleDownComboId, string> = {
  COMBO_A: `[ v0.8 GMX Blue Shield Active Rules ]
• R1: Daily Loss Hard-Lock (Active)
• R2: Geo-Fence Lock (Active)
• R6: Beginner Notional Cap (Active)
• BO-01: Soil Resistance Depth Probe (Active)
• RA-01: rootProtection Physical Circuit Breaker (Active)`,
  COMBO_B: `[ v1.0 Institutional Circuit Breakers ]
• All v0.8 Rules +
• R8: Slippage Circuit Breaker (Armed)
• R10: Tsunami Volatility Shield (Armed)
• R12: Cross-Venue Divergence Lock (Armed)
• R15: 1x Leverage Cap Lock (Armed)`,
  COMBO_C: `[ v1.5 Counter-MEV & Full Defense ]
• All v0.8 + v1.0 Rules +
• R17: Daily Drawdown Hard Lock (Armed)
• R20: Physical Kill Switch (Armed)
• UM-03: Bitwise Invert Counter-Attack (Simulation)`,
};

export const ROOT_PROTECTION_TOOLTIP = `rootProtection() Circuit Breaker (RA-01 / R17):
Daily Drawdown Hard Limit = $200 USD.
Trigger Condition: ΔEquity_daily ≤ -$200 USD ==> Sever EIP-712 Hot Key Signature Pipeline instantly.`;
