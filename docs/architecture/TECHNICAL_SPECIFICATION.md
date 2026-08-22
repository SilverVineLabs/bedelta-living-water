# SliverVine Citadel — Technical Specification

**Protocol:** SliverVine / BeΔ Living Water · **Risk engine:** v0.8 Santenmoku  
**Scope:** Triangle Liquidity Loop · Microsecond Moats · Cross-venue fail-closed gate  
**Entity:** SilverVine Labs · **Live proof:** [`/api/grant-audit`](https://bedeltawater.slivervine.xyz/api/grant-audit)

---

## § Triangle Liquidity Loop Topology

Closed-loop three-venue routing keeps regulated source capital, GM yield, and hedge legs phase-aligned:

```
R-Chain (Regulated Source)
        ↕  Across / AA ingress (fail-closed)
Arbitrum One (GMX GM Yield Base)
        ↕  1x Δ-neutral hedge
Hyperliquid (1x Short Hedge)
```

| Leg | Venue | Role |
|-----|-------|------|
| **Source** | R-Chain (Robinhood) | Regulated RWA / idle USDC origin · permissioned inbound |
| **Yield base** | Arbitrum One · GMX v2 GM | Underweight-side GM LP · builder `uiFeeReceiver` · Citadel pre-execution gate |
| **Hedge** | Hyperliquid | Session-key **1x short** Emergency Liquidity Sponge · nonce-healed signing |

**Control plane:** Cloudflare Edge Worker (`SystemState` SSOT) evaluates sequencer · oracle lag · soil · RPC radar before any unsigned GMX payload or HL hedge dispatch. Routing is unidirectional into `SystemState`; venue adapters never mutate peer books without a gate pass.

**Read API:** `GET /api/yield/triangle` — structural APY / depth / gate status across HL · GMX (R-Chain stub stacked via ingress).

---

## § Segregated Tranches

Solidity vault surface splits capital into two non-fungible risk lanes:

| Tranche | Chain policy | Behavior |
|---------|--------------|----------|
| **Permissioned RWA Tranche** | Robinhood Mainnet **4663** inbound **BLOCKED** at protocol filter | Institutional / RWA-tagged deposits only · `RobinhoodSafetySwitch` blacklist + oracle flush · no permissionless public mint path from 4663 |
| **Permissionless DeFi Tranche** | Arbitrum One + HL | Open GM / hedge flow behind Citadel fail-closed gate · standard DeFi UX |

**Invariant:** RWA capital on the permissioned lane cannot be atomically reminted into the permissionless DeFi tranche without an explicit, audited bridge + compliance gate (Across + AA). Chain **4663 → Arbitrum** inbound is denied by default; Testnet **46630** remains the active integration sandbox.

**On-chain anchors:** `contracts/RobinhoodSafetySwitch.sol` · `contracts/SilverVineRiskOracle.sol`.

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
| **Elara protocol ingress** | Protocol-level **ingress filtering** (Elara) drops non-compliant R-Chain / blacklisted senders before GM payload construction — complements `RobinhoodSafetySwitch` |
| **ArbOS gas / base-fee sensor** | Tri-Sensor **BaseFee Velocity** channel remains the congestion throttle for dispatch SLO |

**Design rule:** Edge (Cloudflare) remains the pre-broadcast SSOT; Stylus/Elara are the on-chain reinforcement plane — never a weaker substitute for fail-closed Edge gates.

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
