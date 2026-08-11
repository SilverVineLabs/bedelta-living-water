import { assembleMatrix } from "../../../services/assemble-matrix-lib/assemble-matrix-assembler";
import { hktTimestamp } from "../../../services/config";
import { parseHyperliquidCryptoResponse } from "../../../services/exchanges/hl-parse";
import type { ExchangePriceMaps, HyperliquidMetaAndAssetCtxs } from "../../../types/matrix";
import type { Step2MockUniverseRow } from "../../types/step2-targets";
import {
  type HlAssetCtx,
  type HlUniverseAsset,
  type Tier1Candidate,
} from "./types";

export function parseMetaAndAssetCtxs(raw: unknown): Tier1Candidate[] {
  if (!Array.isArray(raw) || raw.length < 2) return [];
  const universe = (raw[0] as { universe?: HlUniverseAsset[] })?.universe ?? [];
  const ctxs = (raw[1] as HlAssetCtx[]) ?? [];
  const out: Tier1Candidate[] = [];

  universe.forEach((asset, index) => {
    const name = (asset.name ?? "").trim().toUpperCase();
    if (!name || name.includes(":")) return;
    const ctx = ctxs[index] ?? {};
    const midPx = parseFloat(ctx.midPx ?? ctx.oraclePx ?? ctx.markPx ?? "0");
    const prevDayPx = parseFloat(ctx.prevDayPx ?? "0");
    const fundingRateHourly = parseFloat(ctx.funding ?? "0") || 0;
    const oiContracts = parseFloat(ctx.openInterest ?? "0") || 0;
    const dayNtlVlm = parseFloat(ctx.dayNtlVlm ?? "0") || 0;
    if (!(midPx > 0)) return;

    const priceChange24hRatio =
      prevDayPx > 0 ? (midPx - prevDayPx) / prevDayPx : 0;
    const openInterestUsd = oiContracts * midPx;
    const oiIntensity = dayNtlVlm > 0 ? openInterestUsd / dayNtlVlm : 0;
    const oiChange24hRatio =
      oiIntensity >= 1.5
        ? Math.min(0.5, (oiIntensity - 1) * 0.2) * Math.sign(priceChange24hRatio || 1) * -1
        : oiIntensity >= 0.8
          ? 0.08 * Math.sign(-priceChange24hRatio || 1)
          : 0;

    out.push({
      symbol: name,
      fundingRateHourly,
      oiChange24hRatio,
      priceChange24hRatio,
      dayNtlVlm,
      openInterestUsd,
      midPx,
    });
  });

  return out;
}

/** Align Tier-1 candidates with main assemble-matrix funding / volume SSOT. */
export function alignCandidatesWithAssembleMatrix(
  raw: unknown,
  candidates: Tier1Candidate[],
): Tier1Candidate[] {
  try {
    const parsed = parseHyperliquidCryptoResponse(
      raw as HyperliquidMetaAndAssetCtxs,
    );
    const maps: ExchangePriceMaps = {
      hlSpot: parsed.cryptoMaps.hlSpot,
      hlPerp: parsed.cryptoMaps.hlPerp,
      hlFunding: parsed.cryptoMaps.hlFunding,
      hlDayVolumeUsd: parsed.dayVolumeUsd,
      dydxPerp: {},
    };
    const matrix = assembleMatrix(hktTimestamp(), maps);
    const highYield = new Set(
      (matrix.matrix ?? []).map((row) => row.b1_symbol.toUpperCase()),
    );

    return candidates
      .map((c) => {
        const funding = maps.hlFunding[c.symbol] ?? c.fundingRateHourly;
        const dayNtlVlm = maps.hlDayVolumeUsd?.[c.symbol] ?? c.dayNtlVlm;
        const midPx = maps.hlPerp[c.symbol] ?? c.midPx;
        const openInterestUsd =
          matrix.matrix?.find((r) => r.b1_symbol.toUpperCase() === c.symbol)
            ?.hl_oi_usd ?? c.openInterestUsd;
        return {
          ...c,
          fundingRateHourly: funding,
          dayNtlVlm,
          midPx: midPx > 0 ? midPx : c.midPx,
          openInterestUsd:
            openInterestUsd && openInterestUsd > 0
              ? openInterestUsd
              : c.openInterestUsd,
        };
      })
      .sort((a, b) => {
        const aBoost = highYield.has(a.symbol) ? 1 : 0;
        const bBoost = highYield.has(b.symbol) ? 1 : 0;
        return bBoost - aBoost;
      });
  } catch {
    return candidates;
  }
}

export function mockRowsToCandidates(rows: Step2MockUniverseRow[]): Tier1Candidate[] {
  return rows.map((row) => ({
    symbol: row.symbol.toUpperCase(),
    fundingRateHourly: row.fundingRateHourly,
    oiChange24hRatio: row.oiChange24hRatio,
    priceChange24hRatio:
      row.prevDayPx > 0 ? (row.midPx - row.prevDayPx) / row.prevDayPx : 0,
    dayNtlVlm: row.dayNtlVlm,
    openInterestUsd: row.openInterest * row.midPx,
    midPx: row.midPx,
  }));
}
