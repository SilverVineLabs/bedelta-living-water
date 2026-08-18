/**
 * GMX v2 revenue SSOT — uiFeeReceiver treasury + registered referral code.
 */

import { stringToHex } from "viem";

/** SliverVine Treasury — Wallet B uiFeeReceiver (5 bps UI fee accrual). */
export const GMX_UI_FEE_RECEIVER =
  "0xc9BddABD80982d2201376195DD9B85fb7951546f" as const;

export const GMX_UI_FEE_BPS = 5 as const;

/** Registered GMX Builders referral code label. */
export const GMX_REFERRAL_CODE_LABEL = "SILVERVINE" as const;

/** bytes32 referral code for GMX v2 CreateOrderParams.referralCode. */
export const GMX_REFERRAL_CODE_BYTES32 = stringToHex(GMX_REFERRAL_CODE_LABEL, {
  size: 32,
});
