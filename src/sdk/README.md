# `@slivervine/citadel-sdk`

**License:** Apache-2.0 · see [`LICENSE`](./LICENSE) · **Entity:** SilverVine Labs · **Protocol brand:** SliverVine  
**EIP-712 domain:** `SliverVineCitadel` · **Gate anchor:** `SLIVERVINE_GATE_ADDRESS`

> **Baseline:** Vitest `164 test files | 735 PASS (100% Clean)` · Security-tier `5/0/0 PASS` ([`static-analysis-report.json`](../../docs/audit/static-analysis-report.json); Vitest, Forge, Slither, Aderyn, pnpm-audit) · Defense Matrix `17 Active | 2 Refactored | 1 Deprecated` · Wasm `<28kb` / `<60µs`.  
> Fast-tier scorecard ([`security-scorecard.json`](../../docs/audit/security-scorecard.json)) is overwritten by the last `audit:fast|security|nightly` run — do not mix tiers.

> **"Behavioral pass does not imply Web3 security."**  
> `@slivervine/citadel-sdk` currently performs **stateless attestation envelope validation** (EIP-712 structural checks: digest match, expiry, `verifyingContract`, domain `SliverVineCitadel`, sig hex shape) plus `&lt;28kb` Wasm soil evaluation **BEFORE** any UserOp hits the mempool.  
> **Full cryptographic signature recovery / m-of-n quorum is bound at the L1 `SliverVineGate` contract layer** (`verifyAndConsume`) — not claimed as complete off-chain ECDSA recovery in this SDK package.

Stateless pre-execution harness. No private keys. No custody. Fail-closed by default.

### Why institutions & dApp builders adopt it

| | Value |
|---|--------|
| **Zero-Drift AI Agent Armor** | Intercepts prompt injections, Session Key TTL drift, and execution anomalies in sub-millisecond runtime (**&lt;60µs** Wasm soil path). |
| **Anti-Copycat Domain Locking** | Un-attested or tampered UserOps fail-closed (`allowedToSign: false`) by default — Gate `verifyingContract` + domain `SliverVineCitadel`. |
| **Unidirectional Compliance Escort** | Enforces 1-way outbound liquidity (`46630`/`4663` → `42161`); inbound reverse paths blocked (AML contamination isolation). |

## Install / import (monorepo)

```ts
import {
  verifyAgentIntent,
  assertUnidirectionalBridge,
  SLIVERVINE_GATE_ADDRESS,
  EIP712_DOMAIN_NAME,
} from "../sdk"; // or `@slivervine/citadel-sdk` when published
```

## dApp integration

### 1. Agent intent (AI / Session Key)

```ts
const verdict = verifyAgentIntent({
  intentDigest, // 0x + 32-byte UserOp / calldata digest
  sessionKey: { agentAddress, maxOrderClipUsd: 30, expiresAtMs },
  soil: { symbol: "ETH-PERP", hlSpot, hlPerp, dydxPerp, depthUsd, isTestnet: false },
  gasBurst: { estimatedGasCostUsd: 0.1, sponsored: true },
  attestation: {
    digest: intentDigest,
    expiresAtMs: Date.now() + 30_000,
    sig: "0x…", // Risk Oracle / Gate signer
    verifyingContract: SLIVERVINE_GATE_ADDRESS,
    domainName: EIP712_DOMAIN_NAME,
  },
  preset: "production", // default — missing attestation ⇒ allowedToSign: false
});

if (!verdict.allowedToSign) {
  // Do not request wallet / Session Key signature
}
```

**Equation (production):**

`allowedToSign = injectionOk ∧ digestOk ∧ soilOk ∧ sessionOk ∧ gasOk ∧ attOk`

| Gate | Formula / limit |
|------|-----------------|
| Soil | ¬tripped; slippage ≤ 0.5%; depth ≥ floor |
| Session | clip ≤ $30; TTL ≤ 7d |
| Gas | per-UserOp ≤ $0.50; daily sponsorship ≤ $10 |
| Attestation | Envelope: digest=intent ∧ fresh ∧ sig hex ∧ Gate `verifyingContract` ∧ domain `SliverVineCitadel` (L1 ECDSA/m-of-n at `SliverVineGate`) |

Dev bypass only with explicit `allowDevBypass: true` or `preset: "test"` + `soil.isTestnet: true`.

### 2. Unidirectional bridge (Robinhood → Arbitrum)

```ts
const escort = assertUnidirectionalBridge({
  sourceChainId: 46630, // or 4663 mainnet alias
  destChainId: 42161,
  amountUsd: 1000,
  wallet,
  initiatedAtMs: Date.now(),
});
// inbound (→ Robinhood) ⇒ capitalLabel AML_INBOUND_TO_ROBINHOOD_BLOCKED, lostUsd === 0
```

## Audit test harness

Executable gap proofs live in:

- `tests/sdk/citadel-sdk-intent.test.ts`
- `tests/sdk/citadel-sdk-bridge-armor.test.ts`

```bash
pnpm exec vitest run tests/sdk/citadel-sdk-intent.test.ts tests/sdk/citadel-sdk-bridge-armor.test.ts
pnpm test
pnpm audit:fast
```

Covers: prompt-injection / session drift interception, missing & tampered attestation (anti-copycat), multi-symbol soil (`ETH-PERP`, `BTC-PERP`, synthetic RWA), outbound `46630`/`4663`→`42161`, inbound AML block.

## M4 Wasm

- Rust `#![no_std]` core: [`soil_core.rs`](../../src/wasm/soil_core.rs) → [`pkg/soil_core.wasm`](../../pkg/soil_core.wasm) (&lt;28 KiB Cloudflare budget)
- Hot-path exec budget: **&lt;60µs**
- Production `verifyAgentIntent` requires Wasm (`WASM_CORE_REQUIRED` if missing); dev falls back to TS sim
- Rebuild: `pnpm build:wasm`

## Related

- Blueprint: [`CITADEL_SDK_BLUEPRINT.md`](../../docs/sdk/CITADEL_SDK_BLUEPRINT.md)
- Docs index: [`docs/README.md`](../../docs/README.md)
- On-chain: [`SliverVineGate/`](../../SliverVineGate/) · [`SliverVineRiskOracle.sol`](../../contracts/SliverVineRiskOracle.sol)
