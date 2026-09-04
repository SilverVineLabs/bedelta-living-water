# JUDGE_BRIEF.md — SliverVine Citadel Shield (1-Page Buildathon Brief)

| Field | Value |
|-------|-------|
| **Headline** | **SliverVine Citadel Shield: Pre-Consensus Intent Firewall & Execution Safety Primitive for AI Agents on Arbitrum** |
| **Entity** | SilverVine Labs |
| **Track** | Promising Products — AI Agents & Financial Primitives |
| **Arbitrum One Gate** | `0xb174118bC0B84e8D6D59EEF2339e29bF7FCf8BF1` · [Ignition Tx](https://arbiscan.io/tx/0x54c153e9a41f704b5eb0ae554eac593d1110d62bd826ff094e72f2bd60c1b0c6) |
| **Live Dune Telemetry Portal** | [https://dune.com/silvervinelabs/silvervine-citadel-telemetry](https://dune.com/silvervinelabs/silvervine-citadel-telemetry) · PEV operational on Sepolia Gate `0xb174118bC0B84e8D6D59EEF2339e29bF7FCf8BF1` |
| **Headless Audit Endpoint** | [`https://bedeltawater.slivervine.xyz/api/grant-audit`](https://bedeltawater.slivervine.xyz/api/grant-audit) |
| **Repo** | [SilverVineLabs/bedelta-living-water](https://github.com/SilverVineLabs/bedelta-living-water) |
| **Tests** | `pnpm test -- --run` → **173 test files | 765 PASS Clean** · full matrix → [`docs/VERIFICATION_MATRIX.md`](./docs/VERIFICATION_MATRIX.md) |
| **Deep docs** | [`docs/grants/SUBMISSION.md`](./docs/grants/SUBMISSION.md) · [`docs/VERIFICATION_MATRIX.md`](./docs/VERIFICATION_MATRIX.md) |

> **Headless Infrastructure Protocol:** Core interaction is API/SDK Native (`@slivervine/citadel-sdk`) & CLI HUD.

---

## 30-Second Identity

SliverVine is **not** a Wasm slippage calculator. It is a **pre-consensus execution safety primitive**: sub-ms intent clearing on Cloudflare Edge (`checkSoilResistance()`, p50 ~106µs · **`pkg/soil_core.wasm` — independent of AA**) **plus** an immutable **EIP-712 consume-once `SliverVineGate`** on Arbitrum One. ZeroDev Kernel v3 is an **opt-in Pillar 1 AA delivery layer** (`USE_ZERODEV_AA` default-off) — not the source of sub-ms latency. Toxic AI Agent UserOps are severed **before** Sequencer queues — **0-Gas** on blocked paths.

```bash
pnpm test -- --run
pnpm demo:agent          # ALLOW
pnpm demo:agent --trip   # FAIL_CLOSED
```

> All verification commands: [`docs/VERIFICATION_MATRIX.md`](./docs/VERIFICATION_MATRIX.md)

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

**Live dashboard:** [https://dune.com/silvervinelabs/silvervine-citadel-telemetry](https://dune.com/silvervinelabs/silvervine-citadel-telemetry)

**Structured on-chain events & PEV (Prevented Exploit Volume) metric:**

- Sepolia Gate `0xb174118bC0B84e8D6D59EEF2339e29bF7FCf8BF1` — **`IntentAttested`** (live EIP-712 attestations) + **`RiskTripBlocked`** (pre-broadcast fail-closed severance) indexed in real time
- **PEV** — `SUM(blocked_intent_notional_usd)` from `RiskTripBlocked` logs; **fully operational on-chain** via Sepolia Gate
- Production SQL spec + daily reconciliation panels target Arbitrum One `42161`

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

Executable adapters with Cyberpunk ANSI HUD: [`examples/adapters/`](./examples/adapters/) (TS + Python) · Reference harness: `pnpm demo:agent` ([`examples/agent-interceptor-demo.ts`](./examples/agent-interceptor-demo.ts))

---

## Innovation & Real Problem Solving — AI Behavioral Safety Substrate

1. **Native LLM Back-off & Retry Intercepts**: Active **60-second cooldown lock** per `agentId` in `withCitadelShield` ([`src/sdk/decorator.ts`](./src/sdk/decorator.ts)) prevents token-burning infinite retry loops and **RPC Rate-Limit Self-DoS** when transactions fail closed — surfaces `[Citadel Back-off] MANDATORY_COOLDOWN_ACTIVE` for LLM runtimes (`pnpm tsx examples/adapters/elizaos-action-adapter.ts --trip`).
2. **Non-Semantic Bytecode Predicate Assertions**: Evaluates **raw bytecode parameters** at **p50 ~106µs** Edge Wasm rather than natural language — rendering the system immune to **Indirect Prompt Injections** at the signing layer ([Technical Specification §0.1](./docs/architecture/TECHNICAL_SPECIFICATION.md#01-bytecode-predicate-verification-v10--erc-7715--post-grant-design-spec)).
3. **Dynamic Threshold Obfuscation**: Cryptographic pseudo-random **±2–5 bps jitter** on slippage / depth cutoffs ([`soil-threshold-jitter.ts`](./src/services/risk-control-lib/soil-threshold-jitter.ts)) prevents MEV searchers from predicting exact **50 bps** fuse boundaries off-chain.

---

## Official Rubric — CLI Proof Pointers

| Criterion (25% each) | One-liner | Verify |
|---------------------|-----------|--------|
| **Smart Contract Quality** | Immutable consume-once Gate on mainnet | Arbiscan Tx above · `SliverVineGate/test/` |
| **Product-Market Fit** | GMX builder lane + Agent SDK + Pendle sentinel | `gmx-v2-order-payload.ts` · `decorator.ts` |
| **Innovation & Creativity** | Pre-consensus intent firewall + PEV + AI Behavioral Safety Substrate | This brief · SUBMISSION § Innovation |
| **Real Problem Solving** | 0-Gas pre-broadcast death window + LLM back-off cooldown | `--trip` adapter demos · `lostUsd ≡ 0` |

---

## 88% Defense Mesh & Honest 12% Post-Grant R&D Blueprint

> **Formal definition (SSOT):** [Risk Mitigation & Disclaimer Framework §0.1](./docs/architecture/RISK_MITIGATION_AND_DISCLAIMER_FRAMEWORK.md#01-what-slivervine-citadel-shield-does--and-does-not--guarantee) — **100%** on-chain risk surface = **88%** pre-broadcast mesh + **12%** systemic residuals · **80/20 Pareto** targets acute microstructure tail in Pillar 3.

### Industry Baseline (~80% or Below)

Traditional DeFi / Agent risk checks rely on **post-hoc analytics** or **mutable pause functions**, leaving gaps for MEV sandwiching, LLM retry token-burn, and session key exploitation.

### SliverVine V1.0 Delivered (**88% Defense Coverage**)

- 🟢 **Sub-ms Pre-Broadcast Severance** — 0-Gas Wasm soil fuse (p50 ~106µs) blocks MEV & toxic fills before mempool queues.
- 🟢 **AI Behavioral Safety Substrate** — 60s LLM cooldown lock prevents token-burning infinite retry loops; dynamic jitter (±2–5 bps) prevents MEV threshold sniping.
- 🟢 **0-Proxy Immutable Gate** — No admin upgrade backdoors; EIP-712 consume-once attestation (`consumed[digest]`).
- 🟢 **Session Key Blast-Radius Isolation** — Scoped `ORDER_EXECUTE` + **$5,000** notional cap (`SESSION_KEY_NOTIONAL_CAP_USD`).
- 🟢 **Oracle & RPC Resilience** — 30s oracle-lag fail-closed (`ORACLE_LAG_DEADLOCK`) + Honeypot trap RPC defense.

### The Remaining **12%** (Why We Need This Foundation Grant)

Honest disclosure of systemic out-of-scope risks: **TEE enclave supply chains**, **multi-RPC eclipse consensus**, and **protocol-level DeFi flash-loan black swans**.

Grant allocation directly fuels **V2.0 R&D**:

1. **TEE / Enclave Hardware Key Isolation** (AWS KMS / SGX Enclaves).
2. **Multi-RPC Quorum Consensus Verification** (anti–RPC eclipse spoofing).
3. **Decentralized PEV (Prevented Exploit Volume) Intelligence Feed**.

### V1.0 Honest Limits (Do Not Over-Claim)

- Bootstrap Ignition Keys (`0x1111…`/`0x2222…`) — public verification only
- Reference Agent harness — not an official Virtuals/ElizaOS/LangChain partnership attestation
- Stylus = **V2.0 roadmap probe**; live gateway = **Solidity Gate**
- Monte Carlo **87.39%** toxic flow blocked — *nominal simulated*; not live TVL saved

---

**SilverVine Labs** · `grants@silvervinelabs.com` · [Live Dune Dashboard](https://dune.com/silvervinelabs/silvervine-citadel-telemetry) · [Headless Audit Endpoint](https://bedeltawater.slivervine.xyz/api/grant-audit)
