# Dune Analytics Dashboard Specification — SilverVine Citadel

**Entity:** SilverVine Labs · **Live SSOT:** `GET /api/grant-audit`  
**Audience:** Buildathon evaluators · Dune sponsor diligence · institutional allocators  
**Reconciliation:** Custom spells ingest grant-audit KV snapshots as off-chain anchors against on-chain GMX / bridge events.

---

## Dashboard Panels (3 Production Queries)

| Panel | Metric | SSOT Module |
|-------|--------|-------------|
| **Pillar 2 — Ingress Escort Volume** | Robinhood → Arbitrum outbound USD · daily tx count | `across-ingress-bridge.ts` · `IngressSafetySwitch.sol` |
| **Pillar 3 — Soil Trip Frequency** | `SOIL_RESISTANCE_TRIP` count · notional blocked · p50 shield latency | `checkSoilResistance()` · Edge Worker KV |
| **CaaS — GMX UI Fee Accrual** | Routed volume × 10 bps · `GMX_UI_FEE_RECEIVER` | `gmx-revenue.ts` · `gmx-v2-order-payload.ts` |

---

## Query 1 — Ingress Escort Volume (Robinhood → Arbitrum One)

```sql
-- Panel: Pillar 2 Ingress Escort Volume
-- Chains: 46630 / 4663 → 42161 (outbound-only escort)
SELECT
  date_trunc('day', block_time) AS day,
  COUNT(*) AS bridge_tx_count,
  SUM(amount_usd) AS ingress_volume_usd
FROM dune.silvervinelabs.result_across_bridge_fills
WHERE dest_chain_id = 42161
  AND source_chain_id IN (46630, 4663)
  AND sender NOT IN (SELECT address FROM dune.silvervinelabs.dim_blocked_senders)
GROUP BY 1
ORDER BY 1 DESC;
```

**Grant-audit reconciliation field:** `robinhoodIngress.escortVolumeUsd` · `IN_FLIGHT_BRIDGE_CAPITAL` labels.

---

## Query 2 — Soil Trip Frequency (Pre-Execution Intercepts)

```sql
-- Panel: Pillar 3 Soil Trip Frequency
-- Event: SOIL_RESISTANCE_TRIP · fail-closed before mempool broadcast
SELECT
  date_trunc('hour', evt_block_time) AS hour,
  COUNT(*) AS intercept_count,
  SUM(blocked_notional_usd) AS notional_saved_usd,
  approx_percentile(elapsed_us_us, 0.5) AS p50_shield_latency_us
FROM dune.silvervinelabs.result_citadel_soil_trips
WHERE chain = 'arbitrum'
  AND evt_name = 'SOIL_RESISTANCE_TRIP'
GROUP BY 1
ORDER BY 1 DESC;
```

**Grant-audit reconciliation field:** `arbitrumCitadel.soilTrips` · `chaos-blackswan-metrics.json` (`255/255` blocked).

---

## Query 3 — GMX UI Fee Accrual (10 bps Builder Revenue)

```sql
-- Panel: CaaS GMX UI Fee Accrual @ 10 bps (GMX_UI_FEE_RECEIVER SSOT)
SELECT
  date_trunc('day', block_time) AS day,
  SUM(size_usd) AS routed_volume_usd,
  SUM(size_usd * 0.0010) AS builder_fee_usd_10bps,
  COUNT(DISTINCT tx_hash) AS order_count
FROM gmx_v2_arbitrum.order_created
WHERE ui_fee_receiver = '0xc9BddABD80982d2201376195DD9B85fb7951546f'
  AND block_time >= NOW() - INTERVAL '90' DAY
GROUP BY 1
ORDER BY 1 DESC;
```

**Grant-audit reconciliation field:** `gmxBuilderProof.uiFeeAccrualUsd` · `GMX_UI_FEE_BPS = 10`.

---

## Milestone Binding

| Milestone | Deliverable |
|-----------|-------------|
| **M-Dune** | Publish dashboard with all 3 queries live · link in `SUBMISSION.md` |
| **M-CLI** | Vitest regression bar unchanged · telemetry spec versioned in repo |

---

*SilverVine Labs · Dune Dashboard Spec · Vitest SSOT: 174/174 files | 768/768 PASS*
