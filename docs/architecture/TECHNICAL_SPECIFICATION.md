# SliverVine Citadel — Technical Specification

**Protocol:** SliverVine / BeΔ Living Water · **Risk engine:** v0.8 Santenmoku  
**Scope:** Delta-Neutral GM Yield Engine · Triangle Liquidity Loop · Microsecond Moats · Cross-venue fail-closed gate  
**Entity:** SilverVine Labs · **Live proof:** [`/api/grant-audit`](https://bedeltawater.slivervine.xyz/api/grant-audit)

---

## § Core Product Identity

**Primary product:** **Delta-Neutral GM Yield Engine** — Arbitrum GMX v2 **ETH/USDC** GM pool + Hyperliquid **1× short hedge**, powered by the sub-ms **`checkSoilResistance()`** Pre-Execution Citadel Gateway.

**Robinhood Chain role:** **Permissioned Institutional Ingress Source only** — regulated treasuries enter via outbound escort (`46630`/`4663` → `42161`); Robinhood Chain is **not** a separate product line. Inbound from external chains to Robinhood Chain is AML-blocked by default.

---

## § Triangle Liquidity Loop Topology

Closed-loop three-venue routing keeps permissioned ingress capital, GM yield, and hedge legs phase-aligned:

```
Robinhood Chain (Permissioned Institutional Ingress)
        ↕  Across / AA egress (fail-closed · inbound 4663 blocked)
Arbitrum One (GMX GM Yield Base · ETH/USDC)
        ↕  1× Δ-neutral hedge
Hyperliquid (1× Short Hedge)
```

| Leg | Venue | Role |
|-----|-------|------|
| **Ingress** | Robinhood Chain | Permissioned institutional RWA / idle USDC origin · outbound-only escort to Arbitrum |
| **Yield base** | Arbitrum One · GMX v2 GM | Underweight-side GM LP · builder `uiFeeReceiver` · Citadel pre-execution gate |
| **Hedge** | Hyperliquid | Session-key **1× short** Emergency Liquidity Sponge · nonce-healed signing |

**Control plane:** Cloudflare Edge Worker (`SystemState` SSOT) evaluates sequencer · oracle lag · soil · RPC radar before any unsigned GMX payload or HL hedge dispatch. Routing is unidirectional into `SystemState`; venue adapters never mutate peer books without a gate pass.

**Read API:** `GET /api/yield/triangle` — structural APY / depth / gate status across HL · GMX (Robinhood Chain ingress stub stacked via egress escort).

---

## § Segregated Tranches

Solidity vault surface splits capital into two non-fungible risk lanes:

| Tranche | Chain policy | Behavior |
|---------|--------------|----------|
| **Permissioned RWA Tranche** | Robinhood Mainnet **4663** inbound **BLOCKED** at protocol filter | Institutional / RWA-tagged deposits only · `RobinhoodSafetySwitch` blacklist + oracle flush · no permissionless public mint path from 4663 |
| **Permissionless DeFi Tranche** | Arbitrum One + HL | Open GM / hedge flow behind Citadel fail-closed gate · standard DeFi UX |

**Invariant:** RWA capital on the permissioned lane cannot be atomically reminted into the permissionless DeFi tranche without an explicit, audited bridge + compliance gate (Across + AA). Chain **4663 → Arbitrum** inbound is denied by default; Testnet **46630** remains the active integration sandbox.

**On-chain anchors:** `contracts/RobinhoodSafetySwitch.sol` · `contracts/SliverVineRiskOracle.sol`.

---

## § Cross-Venue Risk Engine (Microsecond Moats)

| Moat | Constant / Module | Spec |
|------|-------------------|------|
| **Emergency Margin Buffer** | `5%` account equity reserve | Blocks new risk when free margin buffer would fall below 5% after intended notional |
| **HL Nonce Auto-Resync** | `HL_NONCE_AUTO_RESYNC` · `session-key-adapter-lib/nonce-auto-healing` | Monotonic nonce heal on `Invalid nonce` WS · heartbeat revoke closes signing channel |
| **NTP Clock Drift Compensator** | `NTP_CLOCK_DRIFT_COMPENSATOR` | Rejects / skew-corrects venue timestamps with **&lt;200ms** drift vs Edge NTP; aligns with Pgate latency fuse (`PGATE_MAX_LATENCY_MS` = 200) |
| **Cross-Venue Net Slippage TWAP** | `CrossVenueNetSlippage` | When net cross-book slippage **&gt; 0.5%** (`MAX_SLIPPAGE = 0.005`), trips soil + schedules **TWAPEngineV2** path slicing instead of market sweep |
| **GMX Positive Skew Rebate** | `gmx-v2-balancer` / price-impact soil | Qualifies underweight-side flow · captures **positive skew / price-impact rebate** bps (`expectedPriceImpactRebateBps`) — never conflated with builder UI fee |

**Companion fuses (existing SSOT):** Dynamic Max SL = `Balance × 1% + $100` · Sequencer 600s grace · Oracle lag fail-closed · Root 8 slippage breaker (0.5%).

---

## § Settlement Windows

| Window | Constant | Duration | Meaning |
|--------|----------|----------|---------|
| GMX GM redemption / settle | `GMX_REDEMPTION_WINDOW` | **3–5 minutes** | Keepers / oracle settle band for GM deposit·withdrawal completion on Arbitrum |
| HL withdrawal settle | `HL_WITHDRAWAL_SETTLEMENT_WINDOW` | **15 minutes** | L1 bridge / withdrawal finality budget before Citadel treats capital as free for re-route |

Gates must not assume instant atomicity across the triangle; inventory accounting holds legs in-flight until the respective window elapses or venue ack confirms.

---

## § Performance Fee Tokenomics (V1.5 Roadmap)

| Item | Definition |
|------|------------|
| **Benchmark** | Aave v3 USDC (Arbitrum) base borrow/supply APY — same fallback used by Arbitrum yield ingress |
| **Performance Fee** | **10% of Excess Yield Above Aave Benchmark Rate** |
| **Excess Yield** | `max(0, Net Strategy APY − Aave Benchmark APY)` after friction buffer |
| **Status** | **V1.5 roadmap** — not accrued on current v0.8 builder UI-fee path (+5 bps `uiFeeReceiver`) |

B2B Option B (slippage-savings fee) remains a separate commercial SKU and is not the V1.5 vault performance fee above.

---

## § ArbOS Elara Alignment

Native execution path targets **ArbOS / Stylus WASM** co-residence with Citadel Edge logic:

| Layer | Alignment |
|-------|-----------|
| **Stylus WASM core** | Risk filters and ingress predicates compile toward Arbitrum Stylus-native WASM for microsecond on-L2 evaluation (parity with Edge `checkSoilResistance` semantics) |
| **Elara protocol ingress** | Protocol-level **ingress filtering** (Elara) drops non-compliant Robinhood Chain / blacklisted senders before GM payload construction — complements `RobinhoodSafetySwitch` |
| **ArbOS gas / base-fee sensor** | Tri-Sensor **BaseFee Velocity** channel remains the congestion throttle for dispatch SLO |

**Design rule:** Edge (Cloudflare) remains the pre-broadcast SSOT; Stylus/Elara are the on-chain reinforcement plane — never a weaker substitute for fail-closed Edge gates.

---

## § Standard Compliance & ERC/EIP Wiki

Official infrastructure standards map — each row links a public ERC/EIP (or venue spec) to Citadel implementation anchors and verification.

| Standard | Role in Citadel | Implementation anchor | Verification |
|----------|-----------------|----------------------|--------------|
| **[EIP-712](https://eips.ethereum.org/EIPS/eip-712)** | Typed-data attestation · Session Key scopes · Gate digest binding | Domain `SliverVineCitadel` · `SliverVineGate.sol` · `src/sdk/constants.ts` · `src/services/session-key-adapter-lib/unlock-reauthorization.ts` | `SliverVineGate` Forge I1–I12 · `tests/sdk/citadel-sdk.test.ts` |
| **[ERC-4337](https://eips.ethereum.org/EIPS/eip-4337)** | Account Abstraction — scoped agent UserOps without hot-wallet custody | ZeroDev Kernel v3 · EntryPoint **v0.7** · `src/adapters/arbitrum/zerodev-aa/` · `src/services/aa-adapter/zerodev-kernel-adapter.ts` | `tests/adapters/zerodev-aa-gate.test.ts` · `tests/services/aa-adapter/*` |
| **[ERC-7579](https://eips.ethereum.org/EIPS/eip-7579)** | Modular smart-account modules — session-key permission scopes | ZeroDev Kernel v3 modular session keys · scoped `ORDER_EXECUTE` clip · daily gas sponsorship limits | `src/sdk/agent-intent.ts` · Pillar 1 Gatehouse (README) |
| **[EIP-1559](https://eips.ethereum.org/EIPS/eip-1559)** | Dynamic base-fee congestion sensing on Arbitrum One | Tri-Sensor **BaseFee Velocity** channel · `src/services/risk/arbitrum-gas-guard.ts` · keeper execution-fee estimate | `tests/arbitrum-gas-guard.test.ts` · README Tri-Sensor Matrix |
| **ArbOS 61** | Arbitrum L2 execution / Stylus co-residence alignment | `RobinhoodSafetySwitch.sol` (oracle flush + blacklist) · Elara ingress design · Stylus WASM parity path | `contracts/RobinhoodSafetySwitch.sol` · `docs/audit/R_CHAIN_SAFETY_GATE_AUDIT.md` |
| **Robinhood Chain Ingress** | Permissioned institutional egress · AML inbound isolation | Chains **46630** (testnet) / **4663** (mainnet filter) · `robinhood-across-bridge.ts` · `RobinhoodSafetySwitch.sol` | `tests/adapters/robinhood-across-bridge.test.ts` (5/5) · `exportRobinhoodAuditSnapshot()` |
| **WASM Core (`soil_core`)** | Sub-ms pre-execution soil fuse · Cloudflare Edge hot path | `pkg/soil_core.wasm` · `#![no_std]` Rust · `src/sdk/soil-wasm.ts` · budget **&lt;28 KiB** · warm exec **&lt;60 µs** | `tests/services/wasm-feasibility-lib/*` · `pnpm test:wasm-feasibility` |

**Compliance posture:**

- **EIP-712:** All Gate attestations and SDK envelopes bind `chainId` + `verifyingContract` — cross-chain replay denied at `verifyAndConsume`.
- **ERC-4337 / ERC-7579:** UserOps pass Edge `verifyAgentIntent()` before bundler dispatch; session modules enforce clip + TTL caps.
- **EIP-1559:** Gas-yield ratio fuse blocks dispatch when L1 surcharge exceeds target yield band.
- **Robinhood Chain:** Outbound-only escort (`46630`/`4663` → `42161`); inbound AML blocked · `lostUsd ≡ 0`.
- **WASM:** Hot-path soil evaluation mirrors Edge `checkSoilResistance()` semantics for sub-ms fail-closed.

**Related SDK surface:** [`docs/sdk/CITADEL_SDK_BLUEPRINT.md`](../sdk/CITADEL_SDK_BLUEPRINT.md) · Audit & Telemetry (`exportRobinhoodAuditSnapshot()`).

---

## Related Artifacts

| Path | Role |
|------|------|
| [`docs/ARBITRUM_ONE_PAGER.md`](../ARBITRUM_ONE_PAGER.md) | Grant one-pager |
| [`docs/grants/arbitrum/ARBITRUM_ONE_PAGER.md`](../grants/arbitrum/ARBITRUM_ONE_PAGER.md) | Arbitrum grant mirror |
| [`docs/ARCHITECTURE.md`](../ARCHITECTURE.md) | Dual-engine topology |
| `src/services/yield-router-lib/` | Yield Triangle router |
| `src/services/session-key-adapter-lib/nonce-auto-healing.ts` | `HL_NONCE_AUTO_RESYNC` |
| `src/services/risk-control-lib/soil-resistance.ts` | Cross-venue 0.5% fuse |
| `src/services/execution/twap-engine-v2.ts` | TWAP path planner |
