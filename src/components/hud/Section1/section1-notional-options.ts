import type { TradeNotionalTier } from "../../../data/verified-5tx";

export const NOTIONAL_LABELS: Record<TradeNotionalTier, string> = {
  "1K": "$1K",
  "100K": "$100K",
  "1M": "$1M",
};

export const NOTIONAL_OPTIONS: readonly {
  tier: TradeNotionalTier;
  label: string;
}[] = [
  { tier: "1K", label: "$1K Testnet (5-TX)" },
  { tier: "100K", label: "$100K Pro" },
  { tier: "1M", label: "$1M Institutional" },
];
