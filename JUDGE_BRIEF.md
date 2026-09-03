# JUDGE_BRIEF.md — SliverVine Citadel Shield (1-Page Buildathon Brief)

| Field | Value |
|-------|-------|
| **Headline** | **SliverVine Citadel Shield: Pre-Consensus Intent Firewall & Execution Safety Primitive for AI Agents on Arbitrum** |
| **Entity** | SilverVine Labs |
| **Track** | Promising Products — AI Agents & Financial Primitives |
| **Arbitrum One Gate** | `0xb174118bC0B84e8D6D59EEF2339e29bF7FCf8BF1` · [Ignition Tx](https://arbiscan.io/tx/0x54c153e9a41f704b5eb0ae554eac593d1110d62bd826ff094e72f2bd60c1b0c6) |
| **Repo** | [SilverVineLabs/bedelta-living-water](https://github.com/SilverVineLabs/bedelta-living-water) |
| **Tests** | `pnpm test -- --run` → **177 test files \| 778 PASS Clean** |
| **Deep docs** | [`docs/grants/SUBMISSION.md`](./docs/grants/SUBMISSION.md) · [`docs/VERIFICATION_MATRIX.md`](./docs/VERIFICATION_MATRIX.md) |

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

## Ecosystem Synergy — Why Each Judge Persona Should Care

### Pendle (Yield) Judges

**We do not compete on YT yield.** SliverVine is a **Yield Safety Sentinel** — off-chain circuit breaker for PT/YT positions:

- Expiry **<7d** + yield jitter **>200 bps** → fail-closed
- Shadow margin cross-check vs GMX maintenance before risk-increasing intents
- **Protects capital from liquidation blackholes** without building a Pendle yield product

→ [`pendle-gmx-cross-guard.ts`](./src/guards/pendle-gmx-cross-guard.ts)

### Dune (Analytics) Judges

**Structured on-chain + off-chain telemetry:**

- Sepolia Gate events: `IntentAttested` · `RiskTripBlocked` (live-indexed)
- **PEV (Prevented Exploit Volume)** — new metric: nominal USD of toxic intents blocked pre-broadcast
- Production SQL spec targets Arbitrum One `42161`

→ [`docs/telemetry/DUNE_DASHBOARD_SPECIFICATION.md`](./docs/telemetry/DUNE_DASHBOARD_SPECIFICATION.md) · `scripts/emit-sepolia-telemetry-events.ts`

### Virtuals / ElizaOS (AI Agent) Judges

**Zero-touch 1-line integration:**

```ts
import { withCitadelShield } from "@slivervine/citadel-sdk";

const execute = withCitadelShield(async (intent) => agent.swap(intent));
```

Reference harness (not partnership attestation): [`examples/agent-interceptor-demo.ts`](./examples/agent-interceptor-demo.ts) · Executable adapters: [`examples/adapters/`](./examples/adapters/)

### GMX (Builder) Judges

+10 bps `uiFeeReceiver` on qualified GM payloads · pre-execution soil fuse before DataStore broadcast.

### Arbitrum / Robinhood Judges

Live **42161** Gate · CREATE2 same address as Sepolia · Robinhood `46630/4663 → 42161` outbound escort + inbound AML BLOCK.

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
- Reference Agent harness — not Virtuals/ElizaOS official partnership
- Stylus = **V2.0 roadmap probe**; live gateway = **Solidity Gate**
- Monte Carlo **87.39%** toxic flow blocked — *nominal simulated*; not live TVL saved

---

**SilverVine Labs** · `grants@silvervinelabs.com` · [bedeltawater.slivervine.xyz](https://bedeltawater.slivervine.xyz)
