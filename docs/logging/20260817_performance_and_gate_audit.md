# Performance & On-Chain Gate Audit — Arbitrum Buildathon V1.0

> **Vitest SSOT:** Proposal Baseline: 175 test files | 773 PASS (Current Branch Live: 176 test files | 775 PASS Clean)

**Audit Date:** 2026-08-17 (UTC+8)
**Auditor Role:** Cursor Senior Systems Engineer
**Repo:** `bedelta-citadel-core` (`feat/v1.0-expansion` @ `56cfe58`)
**Domain:** `bedeltawater.slivervine.xyz` (SliverVine Protocol)

---

## Executive Verdict

| Objective | Target | Measured | Verdict |
|---|---|---|---|
| `checkSoilResistance()` sub-microsecond latency | p50 < **1.0 µs** (1,000 ns) | p50 ≈ **106 µs** (105,951 ns) | ❌ **FAIL** |
| `checkSoilResistance()` practical Edge SLO | < **1.0 ms** | p50 ≈ **0.106 ms** | ✅ **PASS** |
| Worker gzipped bundle | ≤ **158.99 KiB** | **158.99 KiB** (exact) | ✅ **PASS** (at ceiling) |
| `verifyAndConsume` median gas | ~**28k** | **28,043** gas | ✅ **PASS** |
| `SliverVineGate` runtime bytecode | < **24 KiB** | **8,916 B** (8.71 KiB) | ✅ **PASS** |
| Foundry test suite (`SliverVineGate/`) | 60/60 green | **60 passed / 0 failed** | ✅ **PASS** |

**Bottom line:** Bundle and on-chain gate claims are **verifiable and within limits**. The **sub-microsecond** `checkSoilResistance()` claim is **not supported** by measured data; the defensible latency claim is **sub-millisecond** (~100 µs median in Node.js v22).

> **Repo note:** `SliverVineGate/` Solidity sources are **absent** on `feat/v1.0-expansion` working tree (only `MILESTONES.md` remains). On-chain tests were executed from a **`git archive v0.9 SliverVineGate`** extract at `/tmp/slivervine-gate-audit/SliverVineGate`. Re-integrate gate sources before submission.

---

## 1. `checkSoilResistance()` Decision Latency Benchmark

### Methodology

- **Function:** `checkSoilResistance()` from `src/services/risk-control-lib/soil-resistance.ts`
- **Harness:** Inline `tsx` benchmark, 2,000 warmup + **10,000** timed iterations
- **Timers:** `performance.now()` (converted to ns) **and** `process.hrtime.bigint()`
- **Probes:** Deterministic test probes via `scripts/_shared/santenmoku-stress-probes.ts` (`resetProbes`, `SAFE_AT`)
- **Input:** Nominal ETH path — `hlSpot/hlPerp/dydxPerp=3500`, `depthUsd=MIN_DEPTH_USD`, `orderSizeUsd=500`, `accountBalanceUsd=10_000`
- **Environment:** Node.js `v22.23.1`, Linux WSL2

### Raw Output

```json
{
 "benchmark": "checkSoilResistance() pure path",
 "node": "v22.23.1",
 "iterations": 10000,
 "warmup": 2000,
 "claimTargetNs": 1000,
 "claimLabel": "Sub-Microsecond (<1.0 µs)",
 "performanceNow": {
 "minNs": 56109,
 "p50Ns": 106628,
 "p95Ns": 257390,
 "p99Ns": 589181,
 "maxNs": 8558158,
 "meanNs": 134744
 },
 "hrtimeBigint": {
 "minNs": 55904,
 "p50Ns": 105951,
 "p95Ns": 256019,
 "p99Ns": 585661,
 "maxNs": 8554588,
 "meanNs": 133565
 },
 "passSubMicrosecond_p50": false,
 "passSubMillisecond_p50": true
}
```

### Analysis

| Percentile | `hrtime` (ns) | `hrtime` (µs) | vs 1 µs target |
|---|---|---|---|
| min | 55,904 | 55.9 µs | **56× over** |
| **p50** | **105,951** | **106.0 µs** | **106× over** |
| p95 | 256,019 | 256.0 µs | 256× over |
| p99 | 585,661 | 585.7 µs | 586× over |
| mean | 133,565 | 133.6 µs | 134× over |

**Why latency exceeds 1 µs:** `checkSoilResistance()` is **not** a single arithmetic fuse. The hot path sequentially evaluates **≥8 guard subsystems** before slippage math:

```117:165:src/services/risk-control-lib/soil-resistance.ts
export function checkSoilResistance(
 input: SoilResistanceInput,
): SoilResistanceResult {
 // ...
 if (isTsunamiShieldWindow(input.at)) { ... }
 if (!isSequencerSafe(input.at?.getTime())) { ... }
 if (!isArbitrumStatusSequencerHealthy(input.at?.getTime())) { ... }
 if (!isRpcRadarSequencerHealthy(input.at?.getTime())) { ... }
 if (isArbitrumGasGuardBlocked()) { ... }
 if (!isSoftConfirmationSafe(input.at?.getTime())) { ... }
 // + crossSpread, gmxPriceImpact, hlOrderbookGap, rwaSettlement, slippage math, telemetry emit on trip
```

**Cross-reference — internal SLO harness** (`scripts/grant-advanced-resilience-benchmark.ts`, 10k iters, `evaluateGatewayRules` + `checkSoilResistance`):

```json
"benchmark": {
 "pass": true,
 "meanLatencyMs": 0.0004,
 "iterations": 10000,
 "sloTargetMs": 1,
 "soilSloMs": 500
}
```

That harness SLO is **< 1.0 ms** (millisecond), **not** sub-microsecond. The `.cursorrules` "0.014ms Edge execution logic" (14 µs) is also **not met** by the full guard stack (~106 µs measured).

### Verdict — Latency

| Claim | Result |
|---|---|
| Sub-microsecond (< 1 µs) | ❌ **REJECTED** — off by ~2 orders of magnitude |
| Sub-millisecond (< 1 ms) | ✅ **CONFIRMED** — p50 ≈ 0.106 ms |
| Oracle-lag circuit-break (> 500 ms RPC) | ✅ Architectural (separate from pure-function bench) |

---

## 2. Cloudflare Worker Bundle Constraint

### Commands

```bash
pnpm run bundle:measure
# equivalent: pnpm run build:worker → vite build + tsc + wrangler deploy --dry-run
```

### Raw Output — `bundle:measure`

```json
{
 "measuredAt": "2026-08-17T15:14:07.819Z",
 "entry": "src/worker-entry.ts",
 "artifact": "dist-worker/worker-entry.js",
 "rawKiB": 767.34,
 "gzipKiB": 158.99,
 "wranglerTotalUploadKiB": 767.34,
 "wranglerTotalGzipKiB": 158.99
}
```

### Raw Output — `pnpm run build:worker` (wrangler tail)

```
Total Upload: 767.34 KiB / gzip: 158.99 KiB
--dry-run: exiting now.
```

### Verdict — Bundle

| Metric | Limit | Measured | Status |
|---|---|---|---|
| Gzipped Worker upload | ≤ 158.99 KiB | **158.99 KiB** | ✅ **PASS** (zero headroom) |
| Raw `worker-entry.js` | informational | 767.34 KiB | — |

**Risk:** Bundle is **exactly at the 158.99 KiB ceiling**. Any dependency addition will breach the limit without further tree-shaking or code splitting.

---

## 3. On-Chain Gate — Gas & Bytecode (`SliverVineGate/`)

### Environment

```
forge Version: 1.7.1
solc 0.8.28, optimizer_runs=20000 (foundry.toml)
Source: git archive v0.9 → /tmp/slivervine-gate-audit/SliverVineGate
```

### Test Execution

```bash
cd /tmp/slivervine-gate-audit/SliverVineGate
/home/lhsum/.foundry/bin/forge test --gas-report
```

```
Ran 4 test suites in 11.79s: 60 tests passed, 0 failed, 0 skipped (60 total tests)
```

### Gas Report Excerpt — `verifyAndConsume`

```
╭------------------------------------------------+-----------------+-------+--------+-------+---------╮
| src/SliverVineGate.sol:SliverVineGate Contract | | | | | |
+=====================================================================================================+
| Deployment Cost | Deployment Size | | | | |
|------------------------------------------------+-----------------+-------+--------+-------+---------|
| 2090241 | 10216 | | | | |
|------------------------------------------------+-----------------+-------+--------+-------+---------|
| Function Name | Min | Avg | Median | Max | # Calls |
|------------------------------------------------+-----------------+-------+--------+-------+---------|
| verifyAndConsume | 25853 | 29550 | 28043 | 77128 | 17991 |
╰------------------------------------------------+-----------------+-------+--------+-------+---------╯
```

| Metric | MILESTONES.md claim | This audit | Delta |
|---|---|---|---|
| `verifyAndConsume` min | 25,853 | **25,853** | exact match |
| `verifyAndConsume` median | 28,055 | **28,043** | −12 gas (−0.04%) |
| `verifyAndConsume` max | 77,148 | **77,128** | −20 gas |

### Bytecode Size — `forge build --sizes`

```
╭-----------------+------------------+-------------------+--------------------+---------------------╮
| Contract | Runtime Size (B) | Initcode Size (B) | Runtime Margin (B) | Initcode Margin (B) |
+===================================================================================================+
| SliverVineGate | 8,916 | 9,960 | 15,660 | 39,192 |
| GatedExecutor | 3,771 | 4,431 | 20,805 | 44,721 |
╰-----------------+------------------+-------------------+--------------------+---------------------╯
```

| Size metric | Value | 24 KiB limit (24,576 B) | Status |
|---|---|---|---|
| **Runtime bytecode** (on-chain) | **8,916 B** (8.71 KiB) | 36% of limit | ✅ **PASS** |
| Initcode | 9,960 B | 41% of limit | ✅ PASS |
| Gas-report "Deployment Size" | 10,216 B | 42% of limit | ✅ PASS (artifact metric) |

> **Clarification:** `MILESTONES.md` cites "10,216 bytes runtime". `forge build --sizes` reports **on-chain runtime = 8,916 B**. The gas-report **Deployment Size = 10,216** is a deployment-artifact figure (initcode/metadata-adjacent), not the deployed runtime wordcode. **Both are well under the 24 KiB EIP-170 limit.**

### Verdict — On-Chain Gate

| Claim | Result |
|---|---|
| `verifyAndConsume` ~28k median gas | ✅ **CONFIRMED** (28,043) |
| Runtime < 24 KiB | ✅ **CONFIRMED** (8.71 KiB) |
| 60/60 Foundry tests | ✅ **CONFIRMED** |
| Zero external deps (inline ECDSA) | ✅ **CONFIRMED** (static review of `SliverVineGate.sol`) |

---

## 4. Static Code Audit — Risk Engine & Verification Path

### 4.1 Off-Chain Risk Engine (`checkSoilResistance`)

| Finding | Severity | Detail |
|---|---|---|
| Fail-closed guard stack | ✅ Strength | 8+ sequential probes before trade math; trip → `notifyFailClosedLock` + telemetry |
| Latency claim accuracy | ⚠️ Medium | Public "sub-microsecond" claim unsupported; use **~100 µs p50** or **<1 ms SLO** |
| Trip side-effects on hot path | ℹ️ Info | `recordTelemetrySoilTrip()` + `emitRiskLog()` on trip add I/O; acceptable for fail-closed but not latency-neutral |
| Probe testability | ✅ Strength | `santenmoku-stress-probes.ts` provides deterministic injection for CI |

### 4.2 On-Chain Gate (`SliverVineGate.sol`)

| Invariant | Static Review | Test Coverage |
|---|---|---|
| I1 halted → deny all | ✅ `halted` checked first | `test_I1_Halted_Denies` |
| I2 verdict == ALLOW only | ✅ `VERDICT_ALLOW = 1` | `test_I2_NonAllowVerdict_Denies` |
| I6 replay protection | ✅ `consumed[digest]` mapping | `test_I6_Replay_Denies`, fuzz |
| I7 strict signer ordering | ✅ ascending address guard | `test_I7b_DuplicateSigner_Denies` |
| I7d malleability rejection | ✅ `s <= secp256k1n/2` | `test_I7d_MalleableSignature_Denies` |
| Cross-chain replay | ✅ `chainId` in EIP-712 domain | `test_CrossChainReplay_Impossible` |
| Asymmetric authority | ✅ halt immediate, unhalt timelocked | authority test suite |
| No oracle on-chain reads | ✅ by design (comment L19–22) | architectural |

### 4.3 Integration Gap (Current Branch)

| Item | Status |
|---|---|
| `SliverVineGate/` sources on `feat/v1.0-expansion` | ❌ **Missing** (only `MILESTONES.md`) |
| `DEPLOYMENTS.md` gate addresses | `drafted, not yet deployed` |
| `forge` from repo root | Returns "Nothing to compile" (no `foundry.toml` at root) |

**Remediation:** `git checkout v0.9 -- SliverVineGate` or restore submodule before Buildathon demo / M3 deployment milestone.

---

## 5. Recommended Public Claims (Buildathon-Safe)

| ✅ Safe to claim | ❌ Do not claim |
|---|---|
| `checkSoilResistance()` median **~106 µs** in Node (10k bench) | "Sub-microsecond" (< 1 µs) decision latency |
| Full risk gate stack **< 1 ms** SLO | "0.014 ms" without scoping to a specific micro-kernel |
| Worker bundle **158.99 KiB gzip** (at limit) | Headroom for new deps without rebuild |
| `verifyAndConsume` **~28k gas** median | Exact 28,055 gas (use "~28k") |
| Gate runtime **8.7 KiB** (<< 24 KiB) | "10.2 KiB runtime" without clarifying metric |
| 60/60 Foundry tests, 327k+ fuzz runs | "contracts pre-deployed" (not yet on-chain) |

---

## 6. Reproduction Commands

```bash
# 1. Soil resistance latency (10,000 iterations)
cd bedelta-citadel-core
pnpm exec tsx -e "
import { performance } from 'node:perf_hooks';
import { MIN_DEPTH_USD, checkSoilResistance } from './src/services/risk-control.ts';
import { muteConsole, resetProbes, SAFE_AT } from './scripts/_shared/santenmoku-stress-probes.ts';
const inp = { symbol:'ETH', hlSpot:3500, hlPerp:3500, dydxPerp:3500, depthUsd:MIN_DEPTH_USD, at:SAFE_AT };
const r = muteConsole(); resetProbes(Date.now());
for (let i=0;i<2000;i++) checkSoilResistance(inp);
const ns=[]; for (let i=0;i<10000;i++){const t=process.hrtime.bigint();checkSoilResistance(inp);ns.push(Number(process.hrtime.bigint()-t));}
r(); ns.sort((a,b)=>a-b); console.log('p50_ns', ns[5000]);
"

# 2. Worker bundle
pnpm run bundle:measure

# 3. On-chain gate (restore sources first)
git archive v0.9 SliverVineGate | tar -x -C /tmp/gate-audit
cd /tmp/gate-audit/SliverVineGate
~/.foundry/bin/forge test --gas-report
~/.foundry/bin/forge build --sizes
```

---

*Audit artifacts generated 2026-08-17. All measurements from live execution on auditor workstation.*
