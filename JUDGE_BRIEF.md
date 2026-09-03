# JUDGE_BRIEF.md — SliverVine Citadel Shield (1-Page Buildathon Brief)

| Field | Value |
|-------|-------|
| **Headline** | **SliverVine Citadel Shield: Pre-Consensus Intent Firewall & Execution Safety Primitive for AI Agents on Arbitrum** |
| **Entity** | SilverVine Labs |
| **Track** | Promising Products — AI Agents & Financial Primitives |
| **Arbitrum One Gate** | `0xb174118bC0B84e8D6D59EEF2339e29bF7FCf8BF1` · [Ignition Tx](https://arbiscan.io/tx/0x54c153e9a41f704b5eb0ae554eac593d1110d62bd826ff094e72f2bd60c1b0c6) |
| **Live Dune Telemetry Portal** | [`https://bedeltawater.slivervine.xyz`](https://bedeltawater.slivervine.xyz) (Redirects to official Dune Dashboard) |
| **Headless Audit Endpoint** | [`https://bedeltawater.slivervine.xyz/api/grant-audit`](https://bedeltawater.slivervine.xyz/api/grant-audit) |
| **Repo** | [SilverVineLabs/bedelta-living-water](https://github.com/SilverVineLabs/bedelta-living-water) |
| **Tests** | `pnpm test -- --run` → **177 test files \| 778 PASS Clean** |
| **Deep docs** | [`docs/grants/SUBMISSION.md`](./docs/grants/SUBMISSION.md) · [`docs/VERIFICATION_MATRIX.md`](./docs/VERIFICATION_MATRIX.md) |

> **Headless Infrastructure Protocol:** Core interaction is API/SDK Native (`@slivervine/citadel-sdk`) & CLI HUD.

---

## 30-Second Identity

SliverVine is **not** a Wasm slippage calculator. It is a **pre-consensus execution safety primitive**: sub-ms intent clearing on Cloudflare Edge (`checkSoilResistance()`, p50 ~106µs) **plus** an immutable **EIP-712 consume-once `SliverVineGate`** on Arbitrum One. Toxic AI Agent UserOps are severed **before** Sequencer queues — **0-Gas** on blocked paths.

```bash
pnpm test -- --run
pnpm tsx examples/agent-interceptor-demo.ts          # ALLOW
pnpm tsx examples/agent-interceptor-demo.ts --trip   # FAIL_CLOSED
```

---

## Why Protocol, Not a Tool?

| Property | Evidence |
|----------|----------|
| **Consume-once invariant** | `SliverVineGate.sol` — EIP-712 attestation replay ⇒ `Replayed()` revert |
| **Non-custodial settlement gate** | No proxy · no ETH custody · live on **42161** |
| **Unidirectional state flow** | Edge soil fuse → signing channel → Gate attestation (Foundry 62/62) |
| **Composable primitive** | `@slivervine/citadel-sdk` · `withCitadelShield` decorator · Reference harness |

A *tool* reports risk post-hoc. A *protocol primitive* **binds execution** with on-chain invariants and fail-closed pre-consensus clearing.

---

## Ecosystem Synergy — Arbitrum Open House Buildathon Priorities

### Offchain Labs Core / Arbitrum Foundation

**Lean execution · 0-Gas pre-broadcast severance · mainnet gate `0xb174…`:**

- Sub-ms Edge `checkSoilResistance()` (p50 ~106µs) — no on-chain hot-path bloat
- Toxic intents severed **before** Sequencer queues → **0-Gas** on blocked paths
- Live **Arbitrum One** consume-once `SliverVineGate` at `0xb174118bC0B84e8D6D59EEF2339e29bF7FCf8BF1`

### GMX Protocol

**+10 bps builder lane & depth/slippage fuse:**

- Qualified GM payloads route `uiFeeReceiver` builder fee
- Pre-execution soil fuse (cross-venue slippage + depth) before DataStore broadcast

### Pendle Finance

**Yield Safety Sentinel & expiry/volatility circuit breaker:**

- Expiry **<7d** + yield jitter **>200 bps** → fail-closed
- Shadow margin cross-check vs GMX maintenance before risk-increasing intents
- Protects PT/YT capital from liquidation blackholes — not a competing yield product

→ [`pendle-gmx-cross-guard.ts`](./src/guards/pendle-gmx-cross-guard.ts)

### Dune Analytics

**Structured on-chain events & PEV (Prevented Exploit Volume) metric:**

- Sepolia Gate events: `IntentAttested` · `RiskTripBlocked` (live-indexed)
- **PEV** — nominal USD of toxic intents blocked pre-broadcast
- Production SQL spec targets Arbitrum One `42161`

→ [`docs/telemetry/DUNE_DASHBOARD_SPECIFICATION.md`](./docs/telemetry/DUNE_DASHBOARD_SPECIFICATION.md) · `scripts/emit-sepolia-telemetry-events.ts`

### AI Agent Ecosystem Runtimes (Virtuals / ElizaOS / LangChain TS & Python)

**Zero-touch integration for agent swarms (TS decorator + Python REST):**

```ts
import { withCitadelShield } from "@slivervine/citadel-sdk";

const execute = withCitadelShield(async (intent) => agent.swap(intent));
```

```python
# pip install langchain-core pydantic
# python examples/adapters/langchain-agent-adapter.py
from langchain_core.tools import BaseTool  # SlivervinePreExecutionGuardTool in adapter module
```

Executable adapters with Cyberpunk ANSI HUD: [`examples/adapters/`](./examples/adapters/) (TS + Python) · Reference harness: [`examples/agent-interceptor-demo.ts`](./examples/agent-interceptor-demo.ts)

---

## Official Rubric — CLI Proof Pointers

| Criterion (25% each) | One-liner | Verify |
|---------------------|-----------|--------|
| **Smart Contract Quality** | Immutable consume-once Gate on mainnet | Arbiscan Tx above · `SliverVineGate/test/` |
| **Product-Market Fit** | GMX builder lane + Agent SDK + Pendle sentinel | `gmx-v2-order-payload.ts` · `decorator.ts` |
| **Innovation & Creativity** | Pre-consensus intent firewall + PEV metric | This brief · SUBMISSION § Innovation |
| **Real Problem Solving** | 0-Gas pre-broadcast death window | `--trip` demo · `lostUsd ≡ 0` |

---

## Honest Scope (Do Not Over-Claim)

- Bootstrap Ignition Keys (`0x1111…`/`0x2222…`) on mainnet deploy — public verification only
- Reference Agent harness — not an official Virtuals/ElizaOS/LangChain partnership attestation
- Stylus = **V2.0 roadmap probe**; live gateway = **Solidity Gate**
- Monte Carlo **87.39%** toxic flow blocked — *nominal simulated*; not live TVL saved

---

**SilverVine Labs** · `grants@silvervinelabs.com` · [Live Dune Telemetry Portal](https://bedeltawater.slivervine.xyz) · [Headless Audit Endpoint](https://bedeltawater.slivervine.xyz/api/grant-audit)
