# `@slivervine/citadel-sdk` — Integration Blueprint

**License:** Apache-2.0 · **Entity:** SilverVine Labs  
**Package:** `@slivervine/citadel-sdk` (monorepo: `src/sdk/`)  
**EIP-712 domain:** `SliverVineCitadel` · **Version:** `1`  
**Gate anchor:** `SLIVERVINE_GATE_ADDRESS` (`src/sdk/constants.ts`)

> **Non-inflatable posture:** This SDK performs **stateless pre-execution validation** before UserOp / Session Key signing. Full cryptographic quorum and replay protection are enforced on-chain by `SliverVineGate.verifyAndConsume` — not claimed as complete off-chain ECDSA recovery in this package.

---

## Architecture

```text
┌─────────────────────────────────────────────────────────────┐
│  dApp / AI Agent / Institutional Router                      │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  @slivervine/citadel-sdk (Apache-2.0)                        │
│  ├─ verifyAgentIntent()     — soil + session + attestation   │
│  ├─ evaluateSoilCore()      — Wasm soil_core (<60µs warm)    │
│  ├─ assertUnidirectionalBridge() — Robinhood Chain → Arbitrum only │
│  ├─ exportRobinhoodAuditSnapshot() — AML cut-off audit cert        │
│  └─ legacy-risk barrel      — Worker re-exports (internal)         │
└───────────────────────────┬─────────────────────────────────┘
                            │ fail-closed deny
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  Cloudflare Edge Worker (BUSL-1.1)                           │
│  checkSoilResistance() · sequencer-guard · grant-audit       │
└───────────────────────────┬─────────────────────────────────┘
                            │ unsigned payload / attestation
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  SliverVineGate.sol (on-chain)                               │
│  EIP-712 verifyAndConsume · TTL ≤30s · single-use digest     │
└─────────────────────────────────────────────────────────────┘
```

---

## Module Map

| Module | Path | Role |
|--------|------|------|
| Public entry | `src/sdk/index.ts` | Re-exports SDK surface |
| Agent armor | `src/sdk/agent-intent.ts` | `verifyAgentIntent()` — sub-ms gate formula |
| Wasm soil | `src/sdk/soil-wasm.ts` | `pkg/soil_core.wasm` loader · `<28 KiB` budget |
| Bridge escort | `src/sdk/unidirectional-bridge.ts` | Outbound-only Robinhood Chain → Arbitrum |
| Constants | `src/sdk/constants.ts` | EIP-712 domain + chain IDs |
| Attestation | `src/sdk/attestation.ts` | Envelope structural validation |
| Robinhood audit | `src/sdk/robinhood-audit-snapshot.ts` | `exportRobinhoodAuditSnapshot()` cut-off cert |
| Tests | `tests/sdk/citadel-sdk.test.ts` | Gap proofs (injection · tamper · AML block) |

---

## EIP-712 Domain — `SliverVineCitadel`

| Field | Value |
|-------|-------|
| `name` | `SliverVineCitadel` |
| `version` | `1` |
| `chainId` | Deployment chain (42161 Arbitrum One SSOT) |
| `verifyingContract` | `SLIVERVINE_GATE_ADDRESS` |

Attestation envelopes must bind:

- `digest` — UserOp / calldata hash
- `expiresAtMs` — ≤ 30s TTL (aligned with Oracle Lag Shield)
- `sig` — Gate signer material (L1 quorum at contract)
- `verifyingContract` — must match `SLIVERVINE_GATE_ADDRESS`
- `domainName` — must equal `SliverVineCitadel`

---

## Sub-Millisecond Gate Integration

Production decision formula (`verifyAgentIntent`):

```text
allowedToSign = injectionOk ∧ digestOk ∧ soilOk ∧ sessionOk ∧ gasOk ∧ attOk
```

| Gate | Limit | Module |
|------|-------|--------|
| Soil slippage | ≤ 0.5% (`MAX_SLIPPAGE`) | Wasm `soil_core` or TS fallback |
| Session clip | ≤ $30 default | `agent-intent.ts` |
| Session TTL | ≤ 7d | `agent-intent.ts` |
| RPC / Pgate latency | ≤ **200 ms** | `PGATE_MAX_LATENCY_MS` in `src/config/constants.ts` (compile-time, not env) |
| Wasm hot path | **< 60 µs** warm | `pkg/soil_core.wasm` |
| Pure math soil | ~0.0002 ms | Grant resilience benchmark |

**Integration sequence:**

1. Build intent digest from unsigned UserOp / GMX payload.
2. Call `verifyAgentIntent()` with soil snapshot + attestation envelope.
3. If `allowedToSign === false` → **do not** request wallet / Session Key signature.
4. Optionally route attestation through `SliverVineGate.verifyAndConsume` on-chain before `GatedExecutor.execute`.

---

## Quick Start

```ts
import {
  verifyAgentIntent,
  assertUnidirectionalBridge,
  EIP712_DOMAIN_NAME,
  SLIVERVINE_GATE_ADDRESS,
} from "@slivervine/citadel-sdk";

const verdict = verifyAgentIntent({
  intentDigest: "0x…",
  sessionKey: { agentAddress: "0x…", maxOrderClipUsd: 30, expiresAtMs: Date.now() + 86_400_000 },
  soil: { symbol: "ETH-PERP", hlSpot: 3500, hlPerp: 3501, dydxPerp: 3500.5, depthUsd: 500_000 },
  attestation: {
    digest: "0x…",
    expiresAtMs: Date.now() + 30_000,
    sig: "0x…",
    verifyingContract: SLIVERVINE_GATE_ADDRESS,
    domainName: EIP712_DOMAIN_NAME,
  },
  preset: "production",
});

if (!verdict.allowedToSign) {
  throw new Error(verdict.reasons.join("|"));
}
```

---

## Audit & Telemetry

### 5% Emergency Margin Buffer (HL Cross-Margin)

| Constant | Value | Module |
|----------|-------|--------|
| `DEFAULT_CROSS_MMR` | `0.05` (5%) | `src/services/risk/liquidation-meter.ts` |

Verified by `tests/risk-control/margin-buffer.test.ts` — asserts SSOT constant, default MMR on liq estimate, and `needsSoilRebalance` when free buffer ≤ 5%.

```bash
pnpm exec vitest run tests/risk-control/margin-buffer.test.ts
```

### `exportRobinhoodAuditSnapshot()`

Immutable **Robinhood Chain audit cut-off certificate** — SHA-256 signed JSON for institutional diligence exports. Records chain status, AML isolation, zero-loss invariant, and cut-off timestamp.

| Field | Type | Meaning |
|-------|------|---------|
| `robinhoodChainId` | `46630` \| `4663` | **46630** testnet sandbox active · **4663** mainnet filter state |
| `mainnetFilterActive` | `true` | Chain **4663** inbound AML filter armed |
| `inboundBlocked` | `true` | AML isolation proof (`AML_INBOUND_TO_ROBINHOOD_BLOCKED`) |
| `inFlightCapitalUsd` | `number` | Active Across bridge in-flight notional |
| `settledCapitalUsd` | `number` | Settled outbound escort notional |
| `lostUsd` | `0` | Strict zero-loss invariant (`lostUsd ≡ 0`) |
| `inboundToRobinhoodPermitted` | `false` | Hard invariant — zero inbound capital |
| `cutoffTimestamp` | ISO-8601 | Audit cut-off instant (immutable snapshot boundary) |
| `cutoffTimestampUnix` | `number` | UNIX epoch seconds (same cut-off) |
| `sha256Signature` | hex | Canonical JSON digest |

**Chain status matrix:**

| Network | Chain ID | Snapshot role |
|---------|----------|---------------|
| Robinhood Testnet | **46630** | Active integration sandbox — outbound escort to Arbitrum |
| Robinhood Mainnet | **4663** | Deployment-ready — inbound from 42161 blocked at protocol filter |

**HTTP mirror:** `GET /api/robinhood-audit-snapshot?chainId=46630&amountUsd=2500`

```ts
import {
  exportRobinhoodAuditSnapshot,
  ROBINHOOD_MAINNET_CHAIN_ID,
  ROBINHOOD_TESTNET_CHAIN_ID,
} from "@slivervine/citadel-sdk";

const cert46630 = await exportRobinhoodAuditSnapshot({
  robinhoodChainId: ROBINHOOD_TESTNET_CHAIN_ID,
  amountUsd: 2_500,
  wallet: "0x…",
  initiatedAtMs: Date.now(),
  cutoffTimestamp: new Date().toISOString(),
});

const cert4663 = await exportRobinhoodAuditSnapshot({
  robinhoodChainId: ROBINHOOD_MAINNET_CHAIN_ID,
  amountUsd: 1_000,
  wallet: "0x…",
  initiatedAtMs: Date.now(),
});

// Invariants — must hold on every export
if (
  cert46630.inboundBlocked !== true ||
  cert46630.lostUsd !== 0 ||
  cert46630.cutoffTimestampUnix !==
    Math.floor(new Date(cert46630.cutoffTimestamp).getTime() / 1000)
) {
  throw new Error("Robinhood audit invariant breach");
}
```

**Component + SDK tests:**

```bash
pnpm exec vitest run tests/components/phase01-audit-certificate-export.test.ts
pnpm exec vitest run tests/risk-control/margin-buffer.test.ts
```

---

## Verification

```bash
pnpm exec vitest run tests/sdk/citadel-sdk.test.ts
pnpm test
pnpm audit:fast
pnpm build:wasm   # rebuild pkg/soil_core.wasm
```

---

## Related

- SDK README: [`src/sdk/README.md`](../../src/sdk/README.md)
- Technical Spec: [`docs/architecture/TECHNICAL_SPECIFICATION.md`](../architecture/TECHNICAL_SPECIFICATION.md)
- On-chain Gate: [`SliverVineGate/`](../../SliverVineGate/)
