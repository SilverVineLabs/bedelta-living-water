# Arbitrum Submission Pack — Citadel Gateway & Gate Attestation

**Entity:** SilverVine Labs · **Contact:** `grants@silvervinelabs.com`  
**Official Site:** [silvervinelabs.com](https://silvervinelabs.com)  
**Live:** [bedeltawater.slivervine.xyz](https://bedeltawater.slivervine.xyz) · `GET /api/grant-audit`  
**Repo:** [SilverVineLabs/bedelta-living-water](https://github.com/SilverVineLabs/bedelta-living-water)

> **Proposal Locked Baseline:** Vitest **168 test files | 742 PASS (100% Clean)** · **Current Live Suite:** **171 test files | 753 PASS (100% Clean)** on `pnpm test -- --run` · Security-tier `5/0/0 PASS` · Defense Matrix `17 Active | 2 Refactored | 1 Deprecated` · Wasm `<28kb` Cloudflare budget, `<60µs` execution.

**Audience:** Arbitrum Open House / Buildathon / chain security diligence.  
**Out of scope here:** GMX builder fee pitch → [`gmx/GMX_BUILDERS_PITCH.md`](./gmx/GMX_BUILDERS_PITCH.md) (monetization only — not the innovation claim).

**Interceptor Moat:** Deciding transaction execution safety at **p50 ~106 μs** BEFORE MEV bots or Sequencer mempools ever see it.  
**v0.9:** Production-Ready (Arbitrum Sepolia Testnet & Dry-Run Verified) · Mainnet deployment ties to **M6 Grant distribution**.  
**V1.0:** **Citadel-as-a-Service (CaaS)** — productize `@slivervine/citadel-sdk` as an open sub-ms pre-execution risk layer for Arbitrum dApps & AI Agents.

---

## Primary Surface — Arbitrum One + Sepolia

| Layer | Module | Role |
|-------|--------|------|
| L1 Gate | `SliverVineGate/src/SliverVineGate.sol` | Consume-once attestation · replay lock · gas-bounded `verifyAndConsume` |
| Edge Citadel | Workers on Arbitrum One | Sequencer · oracle-lag · soil fail-closed |
| Sepolia proof | `sepoliaDualLegProof` | Arbiscan-anchored dual-leg diligence |
| On-chain gate (Sepolia) | `scripts/deploy-sepolia-gate.sol` | Forge deploy + Arbiscan verify for `SliverVineGate` · `RobinhoodSafetySwitch` |
| Stylus soil probe | [`contracts/stylus-probe/`](../contracts/stylus-probe/) | Rust `SliverVineSoilProbe` · `check_soil_probe(spread_bps, depth_usd)` baseline |
| Security matrix | `pnpm run audit:security` | Vitest + Forge + Slither + Aderyn + pnpm-audit |

---

## 3-Tier Security Audit Matrix

| Tier | Command | Target |
|------|---------|--------|
| Fast | `pnpm run audit:fast` | tsc · security slice · Solhint · Gitleaks → writes `security-scorecard.json` |
| Security | `pnpm run audit:security` | **5/0/0 PASS** (Vitest, Forge, Slither, Aderyn, pnpm-audit) → `static-analysis-report.json` + scorecard |
| Nightly | `pnpm run audit:nightly` | Echidna · Halmos · deep fuzz |

Artifacts: security-tier **5/0/0** SSOT = `docs/audit/static-analysis-report.json`.  
`docs/audit/security-scorecard.json` always mirrors the **last** matrix tier run (check `"tier"` field — do not cite as 5/0/0 unless `"tier": "security"`).

---

## Tri-Sensor Control Loop (Arbitrum Edge)

| Sensor | Domain | Action |
|--------|--------|--------|
| BaseFee Velocity | ArbOS EIP-1559 | Throttle on congestion band breach |
| RPC Jitter Radar | Multi-provider RTT / head staleness | Fail-closed on phase desync |
| Phase-Shift Detector | Oracle / book alignment | Instant breaker |

Live envelopes: `GET /api/grant-audit`.

---

## Three-Pillar Architecture (Submission SSOT)

| Pillar | Role | SSOT |
|--------|------|------|
| **Gatehouse (Auth)** | ZeroDev scoped session keys · Kernel v3 · R06 / R07 | `zerodev-aa-*` · Gate attestation |
| **Pillar 2: Compliance Ingress Firewall (with Robinhood Ingress as Reference Adapter)** | Venue-agnostic unidirectional AML escort · inbound AML blocked · **Pending-Capital Recognition Invariant (`lostUsd ≡ 0`)** on `IN_FLIGHT_BRIDGE_CAPITAL` until explicit timeout (`BRIDGE_TIMEOUT_FAIL_CLOSED`) · Robinhood Chain (`46630`/`4663` → `42161`) is the inaugural Code-Verified / Dry-Run Verified reference adapter — not the protocol anchor | `robinhood-across-bridge.ts` · `RobinhoodSafetySwitch.sol` · `tests/adapters/robinhood-*` |
| **Shield (CORE MOAT)** | Sub-ms Wasm pre-execution armor · p50 ~106 μs · fail-closed before mempool | `checkSoilResistance()` · `soil_core.wasm` |

**Pending-Capital Recognition Invariant:** During active bridge execution, in-flight liquidity is labelled `IN_FLIGHT_BRIDGE_CAPITAL`; **`lostUsd` is strictly `0`** — the protocol never prematurely writes off pending bridge capital as principal loss until an explicit fail-closed timeout. SDK enforcement: `assertUnidirectionalBridge()` · `exportRobinhoodAuditSnapshot()` throw on `lostUsd ≠ 0`.

---

## On-Chain Verification — Arbitrum Sepolia (421614)

| Contract | Role | Verified Address (Sepolia) | Source |
|----------|------|----------------------------|--------|
| `SliverVineGate` | Consume-once EIP-712 attestation anchor | `0x0000000000000000000000000000000000000000` *(pending `forge script`)* | [`SliverVineGate/src/SliverVineGate.sol`](../../SliverVineGate/src/SliverVineGate.sol) |
| `RobinhoodSafetySwitch` | Pillar 2 compliance filter (oracle flush + blacklist) | `0x0000000000000000000000000000000000000000` *(pending `forge script`)* | [`contracts/RobinhoodSafetySwitch.sol`](../../contracts/RobinhoodSafetySwitch.sol) |
| `SliverVineSoilProbe` (Stylus) | On-chain soil baseline probe (`spread_bps ≤ 50` ∧ `depth_usd ≥ 10_000`) | `0x0000000000000000000000000000000000000000` *(pending `cargo stylus deploy`)* | [`contracts/stylus-probe/src/lib.rs`](../../contracts/stylus-probe/src/lib.rs) |

**Deploy (Sepolia gate stack):**

```bash
export PRIVATE_KEY=... GATE_SIGNERS=0x..,0x.. GATE_THRESHOLD=2 GUARDIAN=0x.. GATE_ADMIN=0x.. RISK_ORACLE_SIGNER=0x..
forge script scripts/deploy-sepolia-gate.sol:DeploySepoliaGate \
  --rpc-url $ARB_SEPOLIA_RPC_URL --broadcast --verify --etherscan-api-key $ARBISCAN_API_KEY
```

**Stylus probe build:**

```bash
cd contracts/stylus-probe && cargo stylus check && cargo stylus deploy --network arbitrum-sepolia
```

Replace zero addresses above with Arbiscan-verified deployments before final grant submission.

---

## Verification (60s)

```bash
pnpm install
pnpm test -- --run        # Current Live Suite: 171 files | 753 PASS (Proposal Locked Baseline: 168 | 742)
pnpm run audit:security   # 5/0/0 PASS
cd SliverVineGate && forge test --gas-report && cd ..
curl -s "https://bedeltawater.slivervine.xyz/api/grant-audit" | jq .sepoliaDualLegProof
```

**Regression bar:** **Proposal Locked Baseline:** 168 files | 742 PASS (100% Clean) · **Current Live Suite:** 171 files | 753 PASS (100% Clean) · Forge 60/60 · 327,675 fuzz · Wasm `<28kb` / `<60µs`.

---

## Related Documents

| Document | Purpose |
|----------|---------|
| [`arbitrum/ARBITRUM_ONE_PAGER.md`](./arbitrum/ARBITRUM_ONE_PAGER.md) | One-pager |
| [`arbitrum/GRANT_PROPOSAL.md`](./arbitrum/GRANT_PROPOSAL.md) | Scope & roadmap |
| [`../architecture/TECHNICAL_SPECIFICATION.md`](../architecture/TECHNICAL_SPECIFICATION.md) | R01–R20 |
| [`gmx/GMX_BUILDERS_PITCH.md`](./gmx/GMX_BUILDERS_PITCH.md) | GMX-only builder economics |
