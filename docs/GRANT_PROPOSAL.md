# SliverVine Citadel — Grant Proposal (Arbitrum / GMX v0.9)

**Entity:** SilverVine Labs · **Contact:** `grants@silvervinelabs.com`  
**Protocol:** SliverVine / BeΔ Living Water · **Risk engine:** Santenmoku v0.8/v0.9  
**Live proof:** [`GET /api/grant-audit`](https://bedeltawater.slivervine.xyz/api/grant-audit)  
**Regression bar:** **725 Vitest PASS / 135 test files** · `pnpm test` · `pnpm audit:fast`

---

## Executive Summary

SliverVine Citadel is a **Delta-Neutral GM Yield Engine** — **GMX v2 ETH/USDC GM pools on Arbitrum One** paired with a **Hyperliquid 1× short hedge** — guarded by a **sub-ms `checkSoilResistance()` Pre-Execution Citadel Gateway**. The Edge Worker fail-closes on sequencer downtime, oracle lag, cross-venue slippage, and root-protection breaches **before** any hot-key signature or unsigned GMX broadcast.

**Robinhood Chain** serves strictly as a **Permissioned Institutional Ingress Source** (outbound escort `46630`/`4663` → `42161`); it is **not** a separate product line.

---

## Triangle Liquidity Loop

```text
Robinhood Chain (Permissioned Institutional Ingress · 46630 tested / 4663 deployment-ready)
        ↕  Across / AA egress (fail-closed · inbound 4663 blocked)
Arbitrum One (GMX GM Yield Base · ETH/USDC GM · builder uiFeeReceiver +5 bps)
        ↕  1× Δ-neutral hedge
Hyperliquid (1× Short Hedge · Session Key · nonce auto-heal)
```

| Leg | Role | v0.9 Status |
|-----|------|-------------|
| Robinhood Chain | Permissioned institutional RWA / idle USDC ingress | **Stub + testnet ACTIVE/TESTED** (`r-chain-yield-stub.ts`) |
| Arbitrum GMX | Underweight-side GM LP + Citadel gate | **Delivered** (adapters + grant-audit) |
| Hyperliquid | Emergency Liquidity Sponge hedge | **Delivered** (session-key + 5TX provenance fixture) |

Full topology: [`docs/architecture/TECHNICAL_SPECIFICATION.md`](./architecture/TECHNICAL_SPECIFICATION.md)

---

## v0.9 Grant Scope (Delivered)

| Pillar | Deliverable | Verification |
|--------|-------------|--------------|
| **Pre-execution gate** | `checkSoilResistance()` · sequencer · oracle lag | `pnpm test` · `/api/grant-audit` |
| **GMX v2 Citadel** | Unsigned payload builder · balancer · price-impact | `tests/adapters/gmx-v2-*` |
| **HL cross-venue** | Session-key executor · 5TX provenance | `tests/services/hl-5-trade-provenance.test.ts` |
| **On-chain Gate** | `SliverVineGate.sol` · Forge 60 tests · 327k fuzz | `cd SliverVineGate && forge test` |
| **SDK** | `@slivervine/citadel-sdk` (Apache-2.0) | `tests/sdk/citadel-sdk.test.ts` |
| **Wasm moat** | `pkg/soil_core.wasm` | `pnpm test:wasm-feasibility` |
| **Security matrix** | Fast / Security / Nightly tiers | `pnpm audit:fast` · `pnpm audit:security` |
| **Grant telemetry** | Zero-trust JSON audit surface | `curl …/api/grant-audit` |

**Live mainnet proof:** 0.2223 ETH Short OID `513344575969` · GMX `uiFeeReceiver` +5 bps · machine-readable via `provenanceVerified`.

---

## Out of Scope (V1.0 – V1.5 Roadmap)

| Item | Classification |
|------|----------------|
| BTC/USDC GM pools | V1.0 |
| USDG Robinhood Chain Treasury routing | V1.0 |
| Aave v3 live on-chain APY reads | V1.5 (currently static `DEFAULT_AAVE_BASE_APY` fallback only) |
| 10% Performance Fee over Aave benchmark | V1.5 |
| `TWAPEngineV2` live slice execution | V1.5 stub |
| ArbOS Elara protocol ingress | Design / Roadmap |
| Shadow-DEX ZK attestation | Roadmap |
| Robinhood Chain mainnet 4663 live bridge | DEPLOYMENT READY (contracts stub; bridge not live) |
| Sepolia Gate deployment (M3) | Milestone pending per `SliverVineGate/MILESTONES.md` |

---

## Why Arbitrum & GMX Benefit

1. **Sticky GM TVL** — underweight-side routing reduces pool skew.
2. **Builder alignment** — +5 bps `uiFeeReceiver` on every routed unsigned payload.
3. **Native LP premium** — estimated +15 ~ 30 bps for direct Arbitrum One providers.
4. **Fail-closed posture** — deny + compensate over partial fill under uncertainty.
5. **Open audit** — provenance badges · CLI-verifiable · no signing material in public JSON.

---

## Verify (60 seconds)

```bash
pnpm install
pnpm test          # 725 PASS / 135 files
pnpm audit:fast    # tsc + vitest-security + solhint + gitleaks
curl -s "https://bedeltawater.slivervine.xyz/api/grant-audit" | jq .provenanceVerified
```

---

## Related Documents

| Document | Purpose |
|----------|---------|
| [`docs/grants/arbitrum/ARBITRUM_ONE_PAGER.md`](./grants/arbitrum/ARBITRUM_ONE_PAGER.md) | Arbitrum grant one-pager |
| [`docs/audit/Principal_Audit_Report.md`](./audit/Principal_Audit_Report.md) | Principal Audit v1.0.0-rc1 |
| [`docs/sdk/CITADEL_SDK_BLUEPRINT.md`](./sdk/CITADEL_SDK_BLUEPRINT.md) | SDK integration blueprint |
| [`docs/ARCHITECTURE.md`](./ARCHITECTURE.md) | Dual-engine topology |
