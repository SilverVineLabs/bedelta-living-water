/**
 * SPDX-License-Identifier: BUSL-1.1
 * Copyright (c) 2026 SilverVine Labs. All Rights Reserved.
 *
 * Status dictionary — Step 1 top bar, hedge, volatility, and tour sections.
 */

import { BRAND_DELTA_SYMBOL } from "../constants";
import {
  AUTO_PILOT_BASIS_BADGE,
  MILESTONE_SANDBOX_BADGE,
} from "../../services/copilot-care-messages";

const brandDelta = BRAND_DELTA_SYMBOL;

export const STATUS_DICTIONARY_STEP1 = {
  // Step 1: Top Bar & Heartbeat
  TOP_BAR_STATUS: {
    MINDSET:
      "Mindset Status: Psychological discipline check before executing trades.",
    VIX_DVOL:
      "Volatility Index: Real-time implied volatility reading from options/DVOL.",
    TARGET_LOCK:
      "Target State: Indicates whether a token is locked & ready in Step 3.",
    MARKET_HEARTBEAT: {
      SAFE: {
        label: "SAFE / STABLE",
        color: "#50D2C1",
        desc: "Market structure stable. All safety circuit breakers disarmed.",
      },
      ELEVATED: {
        label: "ELEVATED VOL",
        color: "#FFD700",
        desc: "Volatility spiking. Position sizing automatically throttled.",
      },
      LOCKED: {
        label: "CIRCUIT TRIGGERED",
        color: "#FF4D4D",
        desc: "Extreme volatility detected. Step 3 execution hard-locked.",
      },
    },
  },

  // Step 1: Best Hedge & Strategy Radar (labels live in STRATEGY_DICTIONARY)
  BEST_HEDGE_STRATEGY: {
    LOCK_BUTTON: {
      label: "[ 🔒 LOCK BEST HEDGE TO STEP 3 ]",
      desc: `Auto-injects optimal ${brandDelta}-neutral strategy with dynamic Effective Max SL = (Equity × 1%) + $100. ${AUTO_PILOT_BASIS_BADGE}`,
    },
    AUTO_LOCKED: {
      label: "[ 🎯 AUTO LOCKED ]",
      desc: `Top-ranked ${brandDelta}-neutral hedge auto-selected by APR / funding edge.`,
    },
    AUTO_PILOT: {
      label: AUTO_PILOT_BASIS_BADGE,
      desc: "One-click basis arbitrage — optimal ratio computed and Step 3 pre-filled without page reload.",
    },
    MILESTONE: {
      label: MILESTONE_SANDBOX_BADGE,
      desc: "Cross-chain live settlement ships in Milestone 2; sandbox execution is active today.",
    },
  },

  // Step 3: Dynamic Max SL weld badge
  MAX_SL_WELD: {
    label: "MAX SL DYNAMIC WELD",
    color: "#50D2C1",
    desc: "Dynamic Limit Enforced: Effective Max SL USD = (Account Equity × 1%) + $100. Auto-calculates Dynamic Stop-Loss % based on order size and live equity.",
  },

  // Step 1: Volatility Heat
  VOLATILITY_HEAT: {
    SAFE: {
      label: "SAFE",
      color: "#50D2C1",
      desc: "Low market stress. Deep orderbooks and low slippage.",
    },
    ELEVATED: {
      label: "ELEVATED",
      color: "#FFD700",
      desc: "Elevated market stress. Limit orders strongly recommended.",
    },
    DANGER: {
      label: "DANGER",
      color: "#FF4D4D",
      desc: "Extreme market stress. Slippage circuit breaker activated.",
    },
  },

  // Step 2 & 3: Soil & Slippage
  SLIPPAGE_ALERT: {
    ATTACK_READY: {
      label: "ATTACK READY",
      color: "#50D2C1",
      desc: "Spread and estimated slippage within acceptable risk thresholds.",
    },
    CIRCUIT_BREAKER: {
      label: "CIRCUIT BREAKER",
      color: "#FF4D4D",
      desc: "Orderbook depth too thin. Target temporarily locked.",
    },
  },
  SOIL_RESISTANCE: {
    COMPACT: {
      label: "SOIL: COMPACT",
      color: "#50D2C1",
      desc: "High orderbook depth (Slippage < 0.1%). Supports maximum capital execution.",
    },
    BALANCED: {
      label: "SOIL: BALANCED",
      color: "#45C4B4",
      desc: "Moderate depth (Slippage 0.1%-0.3%). Standard capital allocation.",
    },
    LOOSE: {
      label: "SOIL: LOOSE",
      color: "#FFD700",
      desc: "Thin orderbook depth (Slippage > 0.3%). Capital allocation auto-capped.",
    },
  },

  /** 6-stage DonDon / Santenmoku status HUD prompts */
  STATUS_HUD: {
    NORMAL: {
      emoji: "🟢",
      label: "Green Scan",
      subtitle: "Silent background monitoring",
      cssClass: "is-normal",
    },
    GROWTH: {
      emoji: "🟢",
      label: "+EXP, LEVEL UP!",
      subtitle: "Safe-zone XP progression burst",
      cssClass: "is-growth",
    },
    WARNING: {
      emoji: "🟡",
      label: "Amber Status / alert",
      subtitle: "Risk hawk eye activated",
      cssClass: "is-warning",
    },
    SHIELD: {
      emoji: "🛡️",
      label: "Shield Protocol",
      subtitle: "Deep root defense active",
      cssClass: "is-shield",
    },
    GOD_MODE: {
      emoji: "👁️",
      label: "SANTENMOKU PROTOCOL: ENGAGED",
      subtitle: "Three-Eyes physical override",
      cssClass: "is-god-mode",
    },
    BLOCKED: {
      emoji: "🔴",
      label: "ERROR 403 / DEADLOCK",
      subtitle: "100% execution deadlock",
      cssClass: "is-blocked",
    },
  },

  /** Step 1 Pipeline Bar — Master Preset Controller (trade modes) */
  TRADE_MODES: {
    SHIELD: {
      label: "Shield",
      button: "[ 🛡️ R6: Shield ]",
      status: "MAX DEFENSE (ALL 20 ROOTS)",
      root: 6,
      desc: "Default Security Mode. Unlocked (0 TXs). Enforces all 20-Root defenses and macro gates.",
    },
    TACTICAL: {
      label: "Tactical",
      button: "[ ⚔️ R13: Tactical ]",
      status: "BALANCED DEFENSE",
      root: 13,
      lockTip: "Requires ≥ 5 Citadel Wallet TXs to unlock",
      desc: "Unlocked via ≥ 5 Citadel Wallet TXs. Streamlines macro gates while keeping dynamic Max SL & Soil Check active.",
    },
    FLASH: {
      label: "Flash",
      button: "[ ⚡ R18: Flash ]",
      status: "HIGH SPEED DIRECT ACCESS",
      lamp: "HIGH SPEED",
      root: 18,
      lockTip: "Requires ≥ 20 Citadel Wallet TXs",
      desc: "Pro Sniper Mode. Unlocked via ≥ 20 Citadel Wallet TXs. Direct access to Step 3 with welded Root 1 (Dynamic Max SL) & Root 8 (Slippage Breaker).",
    },
  },

  /** 5-Sec Quick Guide modal steps */
  QUICK_TOUR: {
    TITLE: "5-Sec Quick Guide",
    CTA: "[ 🚀 START EXECUTION / ENTER SANDBOX ]",
    STEP1: {
      title: "Gatekeeper & Preset Roles",
      roots: "[R5/R6/R13]",
      desc: "Monitors macro volatility, session locks, and preset defense modes (Shield/Tactical/Flash) to unlock execution pathways.",
    },
    STEP2: {
      title: "Weak Target Radar",
      roots: "[R11/R12/R16]",
      desc: `Filters venue funding rate extremes and cross-venue yield discrepancies to lock optimal ${brandDelta}-neutral targets.`,
    },
    STEP3: {
      title: "Sniper Shield & Risk Engine",
      roots: "[R1/R3/R8]",
      desc: "Calculates dynamic order size based on soil resistance while enforcing Effective Max SL = (Equity × 1%) + $100.",
    },
    STEP4: {
      title: "Live Vault & Review Logs",
      roots: "[R14/R17/R19/R20]",
      desc: "Real-time vault position telemetry, ClOID order tracking, and automated post-trade review closure.",
    },
  },
} as const;
