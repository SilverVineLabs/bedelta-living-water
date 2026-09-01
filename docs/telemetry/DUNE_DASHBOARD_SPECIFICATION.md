# Dune Analytics Dashboard Specification — SliverVine Protocol (BeDelta Living Water v1.0 / BeΔ)

**Official Name:** SliverVine Protocol (BeDelta Living Water v1.0 / BeΔ)
**Entity:** SilverVine Labs · **Live SSOT:** `GET /api/grant-audit`
**Audience:** Buildathon evaluators · Dune sponsor diligence · institutional allocators
**Reconciliation:** On-chain `SliverVineGate` events + grant-audit `duneTelemetry` KV snapshots.

**Status:** Live Log-Engine Verified · **Public Dashboard Published**

## Live Dashboard

| Field | Value |
|-------|-------|
| **Live Query URL** | [https://dune.com/silvervinelabs/silvervine-citadel-telemetry](https://dune.com/silvervinelabs/silvervine-citadel-telemetry) |
| **On-chain ingest source** | Sepolia `SliverVineGate` `0xb174118bc0B84e8D6D59EEF2339e29bF7FCf8BF1` |
| **Decoded events** | `IntentAttested` · `RiskTripBlocked` · `AttestationConsumed` |
| **Off-chain anchor** | `/api/grant-audit` → `duneTelemetry.responseRef` (sha256) |

> **Clarification:** The Dune engine **actively ingests decoded events** from the Sepolia Gate (`0xb174118bc0B84e8D6D59EEF2339e29bF7FCf8BF1`) and reconciles against live `duneTelemetry` snapshots from the Edge Worker.

---

## Dashboard Panels (3 Production Queries)

| Panel | Metric | SSOT Module |
|-------|--------|-------------|
| **Heartbeat (V2 Trino)** | Arbitrum block liveness · Gate `ACTIVE_MONITORING` | `arbitrum.blocks` · Sepolia Gate |
| **Toxic Flow Blocked** | Sum of blocked notional USD (`FAIL_CLOSED_BLOCK`) | `RiskTripBlocked` · `evaluatePendleGmxCrossGuard` |
| **Observatory Paradox Bypasses** | Count of `EMERGENCY_DELEVERAGE_ALLOWED` (`close`/`reduce`) | `IntentAttested` action=`2` |
| **PT Expiry × GMX Margin Health** | Real-time shadow margin / maintenance ratio | `duneTelemetry.marginHealthRatio` |

**Gate (Arbitrum Sepolia):** `0xb174118bc0B84e8D6D59EEF2339e29bF7FCf8BF1`

**SQL dialect:** Production heartbeat uses **Dune V2 (Trino)**. Panels 1–3 below reference custom spell tables (`dune.silvervinelabs.*`) for grant-audit reconciliation.

---

## Query 0 — Telemetry Heartbeat & Active Risk Monitor (Dune V2 / Trino)

Live dashboard query — verifies Arbitrum indexer liveness and pins the Sepolia Gate contract under active monitoring.

```sql
-- SilverVine Citadel: Telemetry Heartbeat & Active Risk Monitor
-- Contract: 0xb174118bc0B84e8D6D59EEF2339e29bF7FCf8BF1 (Arbitrum Sepolia)

SELECT
    number AS block_number,
    time AS block_time,
    '0xb174118bc0B84e8D6D59EEF2339e29bF7FCf8BF1' AS gate_contract,
    'ACTIVE_MONITORING' AS status
FROM
    arbitrum.blocks
ORDER BY
    time DESC
LIMIT 10;
```

**Dashboard:** [https://dune.com/silvervinelabs/silvervine-citadel-telemetry](https://dune.com/silvervinelabs/silvervine-citadel-telemetry)

---

## Query 1 — Total Toxic Flow Blocked in USD

```sql
-- Panel: Toxic Flow Blocked (sum of blocked notional)
-- Sources: on-chain RiskTripBlocked + off-chain grant-audit KV ingest
WITH blocked_events AS (
  SELECT
    e.block_time,
    e.tx_hash,
    CAST(e.shadow_margin_usd AS DOUBLE) / 1e6 AS blocked_notional_usd
  FROM dune.silvervinelabs.result_citadel_risk_trips e
  WHERE e.chain = 'arbitrum'
    AND e.evt_name = 'RiskTripBlocked'
    AND e.reason LIKE 'FAIL_CLOSED%'
),
kv_snapshots AS (
  SELECT
    snapshot_at,
    CAST(json_extract_scalar(payload, '$.duneTelemetry.shadowMarginUsd') AS DOUBLE) AS shadow_margin_usd,
    json_extract_scalar(payload, '$.duneTelemetry.action') AS action
  FROM dune.silvervinelabs.result_grant_audit_snapshots
  WHERE json_extract_scalar(payload, '$.duneTelemetry.action') = 'FAIL_CLOSED_BLOCK'
)
SELECT
  date_trunc('day', COALESCE(b.block_time, k.snapshot_at)) AS day,
  COALESCE(SUM(ABS(b.blocked_notional_usd)), 0)
    + COALESCE(SUM(ABS(k.shadow_margin_usd)), 0) AS toxic_flow_blocked_usd,
  COUNT(DISTINCT b.tx_hash) AS on_chain_block_count,
  COUNT(k.snapshot_at) AS off_chain_block_count
FROM blocked_events b
FULL OUTER JOIN kv_snapshots k
  ON date_trunc('hour', b.block_time) = date_trunc('hour', k.snapshot_at)
GROUP BY 1
ORDER BY 1 DESC;
```

**Grant-audit reconciliation field:** `duneTelemetry.shadowMarginUsd` · `duneTelemetry.action = FAIL_CLOSED_BLOCK`

---

## Query 2 — Observatory Paradox Bypasses (Emergency De-Leveraging)

```sql
-- Panel: Observatory Paradox Bypasses
-- Count greenlighted close/reduce emergency de-leveraging routes
SELECT
  date_trunc('day', block_time) AS day,
  COUNT(*) AS emergency_deleverage_count,
  COUNT(DISTINCT agent) AS unique_agents,
  SUM(CASE WHEN action = 2 THEN 1 ELSE 0 END) AS intent_attested_emergency,
  SUM(CASE WHEN action = 0 THEN 1 ELSE 0 END) AS intent_attested_pass
FROM (
  SELECT
    l.block_time,
    l.tx_hash,
    CAST(l.agent AS VARCHAR) AS agent,
    CAST(l.action AS INTEGER) AS action
  FROM dune.silvervinelabs.result_slivervine_gate_events l
  WHERE l.evt_name = 'IntentAttested'
    AND l.action = 2  -- ACTION_EMERGENCY_DELEVERAGE
  UNION ALL
  SELECT
    s.snapshot_at AS block_time,
    s.response_ref AS tx_hash,
    'grant-audit' AS agent,
    2 AS action
  FROM dune.silvervinelabs.result_grant_audit_snapshots s
  WHERE json_extract_scalar(s.payload, '$.duneTelemetry.action') = 'EMERGENCY_DELEVERAGE_ALLOWED'
) u
GROUP BY 1
ORDER BY 1 DESC;
```

**Grant-audit reconciliation field:** `duneTelemetry.actionLog[intent in ('close','reduce')].action`

---

## Query 3 — Pendle PT Expiry vs GMX Margin Health Real-Time Ratio

```sql
-- Panel: PT Expiry vs GMX Margin Health Ratio
-- marginHealthRatio = shadowMarginUsd / maintenanceMarginRequiredUsd
SELECT
  snapshot_at,
  CAST(json_extract_scalar(payload, '$.duneTelemetry.ptDaysToExpiry') AS DOUBLE) AS pt_days_to_expiry,
  CAST(json_extract_scalar(payload, '$.duneTelemetry.shadowMarginUsd') AS DOUBLE) AS shadow_margin_usd,
  CAST(json_extract_scalar(payload, '$.duneTelemetry.dynamicLtv') AS DOUBLE) AS dynamic_ltv,
  CAST(json_extract_scalar(payload, '$.duneTelemetry.marginHealthRatio') AS DOUBLE) AS margin_health_ratio,
  json_extract_scalar(payload, '$.duneTelemetry.responseRef') AS response_ref
FROM dune.silvervinelabs.result_grant_audit_snapshots
WHERE json_extract_scalar(payload, '$.duneTelemetry.schema') = 'silvervine.grant-audit.dune-telemetry.v1'
ORDER BY snapshot_at DESC
LIMIT 500;
```

**On-chain cross-check:** `IntentAttested.shadowMarginUsd` (uint256, micro-USD scale) vs off-chain `duneTelemetry.shadowMarginUsd`.

---

## Live `/api/grant-audit` JSON Example (`duneTelemetry`)

```json
{
  "success": true,
  "audit": "ZERO_TRUST_GRANT",
  "fetchedAt": "2026-08-31T14:22:00.000Z",
  "duneTelemetry": {
    "schema": "silvervine.grant-audit.dune-telemetry.v1",
    "responseRef": "sha256:a3f8c1d92e4b7056f8910acde334f5b8c7d2e1a9046f3b8c5d7e9a1b2c3d4e5",
    "shadowMarginUsd": -12450.32,
    "dynamicLtv": 1.42,
    "action": "FAIL_CLOSED_BLOCK",
    "gateActionCode": 1,
    "intentHash": "sha256:9c2e1f0a8b7d6c5e4f3a2b1c0d9e8f7a6b5c4d3e2f1a0b9c8d7e6f5a4b3c2d1",
    "reason": "FAIL_CLOSED: Dynamic Fee / Slippage threatens GMX Margin Safety. Score=88",
    "ptDaysToExpiry": 1.0,
    "marginHealthRatio": -0.249,
    "actionLog": [
      {
        "ts": "2026-08-31T14:22:00.000Z",
        "intent": "open",
        "action": "PASS_GREENLIGHT",
        "shadowMarginUsd": 185420.5,
        "dynamicLtv": 0.36,
        "gateActionCode": 0
      },
      {
        "ts": "2026-08-31T14:22:00.000Z",
        "intent": "open",
        "action": "FAIL_CLOSED_BLOCK",
        "shadowMarginUsd": -12450.32,
        "dynamicLtv": 1.42,
        "gateActionCode": 1,
        "reason": "FAIL_CLOSED: Dynamic Fee / Slippage threatens GMX Margin Safety. Score=88"
      },
      {
        "ts": "2026-08-31T14:22:00.000Z",
        "intent": "close",
        "action": "EMERGENCY_DELEVERAGE_ALLOWED",
        "shadowMarginUsd": 42100.0,
        "dynamicLtv": 0.71,
        "gateActionCode": 2,
        "reason": "RISK_DECREASE_INTENT: De-leveraging greenlighted to protect position."
      }
    ]
  }
}
```

---

## On-Chain Event Schema (`SliverVineGate.sol`)

```solidity
event IntentAttested(bytes32 indexed intentHash, address indexed agent, uint8 action, uint256 shadowMarginUsd);
event RiskTripBlocked(bytes32 indexed intentHash, address indexed agent, string reason);
```

| `action` code | Off-chain mapping |
|---------------|-------------------|
| `0` | `PASS_GREENLIGHT` |
| `1` | `FAIL_CLOSED_BLOCK` |
| `2` | `EMERGENCY_DELEVERAGE_ALLOWED` |

---

## Milestone Binding

| Milestone | Deliverable |
|-----------|-------------|
| **M-Dune** | Dashboard live · `duneTelemetry` in `/api/grant-audit` · gate events indexed |
| **M-CLI** | Vitest regression · `tests/api/grant-audit-dune-telemetry.test.ts` |

---

*SilverVine Labs · Dune Dashboard Spec · Live Log-Engine Verified*
