# SliverVine Citadel — Verification Matrix (Buildathon / Grant Evaluators)

**Entity:** SilverVine Labs · **Contact:** `grants@silvervinelabs.com`  
**Live:** [bedeltawater.slivervine.xyz](https://bedeltawater.slivervine.xyz) · `GET /api/grant-audit`  
**Repo:** [SilverVineLabs/bedelta-living-water](https://github.com/SilverVineLabs/bedelta-living-water)

> **Regression bar (locked):** Vitest **164 files / 735 PASS** · Forge **60/60** · Property Fuzz **327,675** (`pnpm audit:nightly` / `FOUNDRY_PROFILE=deep`; standard `forge test` = **5,120** = 5×1,024) · ZeroDev AA **Dry-Run Harness Verified (Kernel v3 / EntryPoint v0.7)**.

Open this document first. Each tier is CLI-reproducible with **zero mainnet signing dependency** unless explicitly noted.

---

## Quick Start (≈ 3 minutes)

```bash
pnpm install
pnpm test                 # Tier 1 — 164 files / 735 PASS
pnpm audit:fast           # Tier 2 — fast security scorecard
pnpm test:zerodev         # Tier 4 — ZeroDev AA dry-run harness
curl -s "https://bedeltawater.slivervine.xyz/api/grant-audit" | jq .provenanceVerified
```

Optional deeper tiers:

```bash
pnpm audit:security                         # Tier 2 — full 5/0/0 matrix
cd SliverVineGate && forge test && cd ..     # Tier 3 — Gate + default fuzz (5,120)
cd SliverVineGate && FOUNDRY_PROFILE=deep forge test --match-path 'test/*.fuzz.t.sol' && cd ..  # 327,675 deep fuzz
pnpm audit:nightly                          # Tier 2/3 deep — Echidna · Halmos · deep fuzz gate
# Tier 5 — see docker/README.md
```

---

## Tier Map

| Tier | Command | What it proves | Expected |
|------|---------|----------------|----------|
| **1** | `pnpm test` | Core engine · Soil · Wasm · Sequencer · Margin Buffer · adapters | **164 files / 735 PASS** |
| **2** | `pnpm audit:fast` / `pnpm audit:security` | TSC · Vitest security · Solhint · Gitleaks · Slither · Aderyn | Fast PASS · Security **5/0/0** |
| **3** | `cd SliverVineGate && forge test` | On-chain Gate · default property fuzz (5×1,024) · gas bounds | **60 Passed** · **5,120 fuzz** (default profile) |
| **4** | `pnpm test:zerodev` | Kernel v3 UserOp draft · session scope · oracle gate (offline) | Dry-run harness **PASS** |
| **5** | [`docker/README.md`](../docker/README.md) | Telemetry sidecar · live grant-audit endpoints | `/health` · `/api/grant-audit` |

---

## Tier 1 — Core Engine & Risk Verification

**Command:** `pnpm test`  
**Definition:** `vitest run --dir . --coverage` (after coverage clean)  
**SSOT:** **164 test files · 735 PASS · `risk-control.ts` 100% coverage**

| Domain | Coverage focus | Example paths |
|--------|----------------|---------------|
| **Soil / Pre-execution** | `checkSoilResistance()` · fail-closed trips | `tests/risk-control/*` · soil / margin-buffer |
| **Wasm shield** | `soil_core.wasm` feasibility / hot-path | `tests/services/wasm-feasibility*` |
| **Sequencer / gas / soft-confirm** | ArbOS guards · lag · soft confirmation | `tests/services/*guard*` · risk suite |
| **Margin Buffer (5%)** | `DEFAULT_CROSS_MMR === 0.05` · rebalance | `tests/risk-control/margin-buffer.test.ts` |
| **GMX v2** | Unsigned payloads · fees · datastore | `tests/adapters/gmx-v2-*` |
| **Hyperliquid** | Session key · auth · WS · 5TX provenance | `tests/adapters/hl/*` · `tests/verify-5tx-*` |
| **SDK / Gate attestation** | EIP-712 · bridge armor | `tests/sdk/*` |
| **Robinhood ingress** | Unidirectional escort · AML inbound block | `tests/adapters/robinhood-*` · `r-chain-*` |
| **ZeroDev AA (unit)** | Adapter / dry-run harness units | `tests/adapters/zerodev-aa-*` |

**Judge note:** Full suite is the institutional regression bar. Sub-slices (`pnpm test:grant-v09-sim`, `pnpm test:wasm-feasibility`) are optional deep-dives only.

---

## Tier 2 — Security & Static Analysis

| Tier | Command | Tools | Artifact |
|------|---------|-------|----------|
| **Fast** | `pnpm audit:fast` | `tsc --noEmit` · Vitest security slice · Solhint · Gitleaks | `docs/audit/security-scorecard.json` (`"tier":"fast"`) |
| **Security** | `pnpm audit:security` | Vitest · Forge · Slither · Aderyn · `pnpm audit` | `docs/audit/static-analysis-report.json` + scorecard · **5/0/0 PASS** |
| **Nightly** (optional) | `pnpm audit:nightly` | Echidna · Halmos · deep fuzz | Nightly scorecard |

**OpSec:** Fast scorecard always mirrors the **last** `audit:*` run — check `"tier"` before citing **5/0/0**.

Related: [`audit/PRINCIPAL_AUDIT_REPORT.md`](./audit/PRINCIPAL_AUDIT_REPORT.md) · [`audit/ROBINHOOD_CHAIN_SAFETY_GATE_AUDIT.md`](./audit/ROBINHOOD_CHAIN_SAFETY_GATE_AUDIT.md)

---

## Tier 3 — Smart Contract & Fuzzing

**Default command (CI / `audit:security`):**

```bash
cd SliverVineGate && forge test --gas-report && cd ..
```

**Deep fuzz command (327,675 executions):**

```bash
pnpm audit:nightly
# or: cd SliverVineGate && FOUNDRY_PROFILE=deep forge test --match-path 'test/*.fuzz.t.sol' && cd ..
```

| Metric | Default `forge test` | Deep profile (`FOUNDRY_PROFILE=deep` / `pnpm audit:nightly`) |
|--------|----------------------|----------------------------------------------------------------|
| Unit tests | **60 Passed · 0 Failed** | **60 Passed · 0 Failed** |
| Property fuzzing | **5 × 1,024 = 5,120** executions | **5 × 65,535 = 327,675** executions |
| Invariants | **3 × 16,384** stateful calls · 0 counterexamples | same |
| Core | `SliverVineGate.sol` consume-once attestation · gas-bounded `verifyAndConsume` | same |

---

## Tier 4 — ZeroDev AA Dry-Run

**Command:** `pnpm test:zerodev`  
**Definition:** `vitest run tests/adapters/zerodev-aa-dryrun-harness.test.ts`

| Assertion | Status |
|-----------|--------|
| Kernel v3 / EntryPoint **v0.7** UserOp **draft** path | ✅ Dry-run harness verified |
| Session scope + Risk Oracle Gate fail-closed | ✅ Offline / mock bundler |
| Mainnet UserOp broadcast | ⚠️ **Not claimed** (`USE_ZERODEV_AA` default-off) |

No funded Sepolia / mainnet network dependency for this tier.

---

## Tier 5 — Sidecar & Integration

**Guide:** [`docker/README.md`](../docker/README.md) · **License:** BUSL-1.1 · Copyright (c) 2026 SilverVine Labs

| Surface | How to verify |
|---------|---------------|
| Sidecar image | `docker build -t silvervine-sidecar -f docker/Dockerfile.sidecar .` |
| Health | `curl -sS http://localhost:8080/health \| jq .` |
| Fail-closed intent | `POST /v1/intent` → HTTP **403** |
| Live grant audit | `curl -s https://bedeltawater.slivervine.xyz/api/grant-audit \| jq .provenanceVerified` |
| Demo pipeline | `pnpm run demo:e2e` |

---

## On-Chain Contract Topology (`contracts/` vs `SliverVineGate/`)

Automated dependency audit (2026-08-24): **no TS/JS runtime import** of `contracts/*.sol` paths; **no duplicate** Solidity definitions inside `SliverVineGate/`. Two distinct on-chain surfaces:

| Path | Contracts | Role | Forge / TS linkage |
|------|-----------|------|-------------------|
| **`SliverVineGate/`** | `SliverVineGate.sol` · `GatedExecutor.sol` | EIP-712 consume-once attestation gate (Tier 3) | `cd SliverVineGate && forge test` · **60/60** · default fuzz **5,120** · deep **327,675** via `FOUNDRY_PROFILE=deep` |
| **`contracts/`** | `SliverVineRiskOracle.sol` · `RobinhoodSafetySwitch.sol` | Robinhood Chain compliance oracle + institutional firewall | **Not** in Forge testbed · ABI mirrored in TS |

**TypeScript interface SSOT (Edge runtime):**

| Solidity source | TS ABI / adapter | Usage |
|-----------------|------------------|-------|
| `contracts/SliverVineRiskOracle.sol` | `src/services/aa-adapter/risk-oracle.ts` → `SLIVERVINE_RISK_ORACLE_ABI` | `risk-oracle-gate.ts` · viem `readContract` when `SLIVERVINE_RISK_ORACLE_ADDRESS` set |
| `contracts/RobinhoodSafetySwitch.sol` | `risk-oracle.ts` → `ROBINHOOD_SAFETY_SWITCH_ABI` | `risk-oracle-adapter.ts` · `evaluateComplianceAdapter()` (fail-closed logic) |

**Static analysis:** Solhint / Slither scan repo-wide `*.sol` (includes `contracts/`).  
**Verdict:** `contracts/` is **not** a safe delete — it is the canonical Solidity spec for Robinhood ingress; TS adapters intentionally mirror ABIs (no Forge artifact import at Edge).

---

## Maintainer Scripts (evaluator-safe)

| Script | Purpose |
|--------|---------|
| `pnpm test` | Full Vitest + coverage |
| `pnpm test:zerodev` | AA dry-run harness |
| `pnpm test:watch` | Interactive Vitest |
| `pnpm typecheck` | `tsc --noEmit` |
| `pnpm audit:fast` / `audit:security` / `audit:nightly` | 3-tier security matrix |
| `pnpm run demo:e2e` | Grant E2E demonstration |
| `pnpm build:wasm` | Rust `soil_core.wasm` |
| `pnpm verify:5tx` / `verify:grant` / `verify:negative` | Provenance / negative proofs |
| `pnpm build` / `deploy` / `dev` | Worker / SPA toolchain |

**Removed from public script surface (OpSec):** live ignition / wallet sweep / spot sell / Sepolia UserOp one-offs — not required for Buildathon diligence.

---

## Related Docs

| Document | Role |
|----------|------|
| [`README.md`](./README.md) | Docs router |
| [`grants/SUBMISSION.md`](./grants/SUBMISSION.md) | Buildathon main submission |
| [`architecture/TECHNICAL_SPECIFICATION.md`](./architecture/TECHNICAL_SPECIFICATION.md) | Yellow Paper |
| [`../README.md`](../README.md) | Repo entry · CLI verification |
| [`../docker/README.md`](../docker/README.md) | Sidecar testlist |

---

*SilverVine Labs · BUSL-1.1 · Verification Matrix · Vitest 735 PASS (164 files)*
