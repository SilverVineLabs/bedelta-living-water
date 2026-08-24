# SliverVine Citadel — Grant Proposal (Arbitrum / GMX v0.9)

**Entity:** SilverVine Labs · **Contact:** `grants@silvervinelabs.com`  
**Protocol:** SliverVine / BeΔ Living Water · **Risk engine:** Santenmoku v0.8/v0.9  
**Live proof:** [`GET /api/grant-audit`](https://bedeltawater.slivervine.xyz/api/grant-audit)  
**Regression bar:** **735 Vitest PASS / 138 test files** · `pnpm test` · `pnpm audit:fast`

---

## Executive Summary

SliverVine Citadel is a **Delta-Neutral GM Yield Engine** — **GMX v2 ETH/USDC GM pools on Arbitrum One** paired with a **Hyperliquid 1× short hedge** — guarded by a **sub-ms** `checkSoilResistance()` **Pre-Execution Citadel Gateway**. The Edge Worker fail-closes on sequencer downtime, oracle lag, cross-venue slippage, and root-protection breaches **before** any hot-key signature or unsigned GMX broadcast.

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


| Leg             | Role                                               | v0.9 Status                                                |
| --------------- | -------------------------------------------------- | ---------------------------------------------------------- |
| Robinhood Chain | Permissioned institutional RWA / idle USDC ingress | **Stub + testnet ACTIVE/TESTED** (`r-chain-yield-stub.ts`) |
| Arbitrum GMX    | Underweight-side GM LP + Citadel gate              | **Delivered** (adapters + grant-audit)                     |
| Hyperliquid     | Emergency Liquidity Sponge hedge                   | **Delivered** (session-key + 5TX provenance fixture)       |


Full topology: [`docs/architecture/TECHNICAL_SPECIFICATION.md`](./architecture/TECHNICAL_SPECIFICATION.md)

---



## v0.9 Grant Scope (Delivered)


| Pillar                            | Deliverable                                        | Verification                                                                                                                              |
| --------------------------------- | -------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| **Pre-execution gate**            | `checkSoilResistance()` · sequencer · oracle lag   | `pnpm test` · `/api/grant-audit`                                                                                                          |
| **GMX v2 Citadel**                | Unsigned payload builder · balancer · price-impact | `tests/adapters/gmx-v2-*`                                                                                                                 |
| **HL cross-venue**                | Session-key executor · 5TX provenance              | `tests/services/hl-5-trade-provenance.test.ts`                                                                                            |
| **On-chain Gate**                 | `SliverVineGate.sol` · Forge 60 tests · 327k fuzz  | `cd SliverVineGate && forge test`                                                                                                         |
| **SDK**                           | `@slivervine/citadel-sdk` (Apache-2.0)             | `tests/sdk/citadel-sdk.test.ts`                                                                                                           |
| **Wasm moat**                     | `pkg/soil_core.wasm`                               | `pnpm test:wasm-feasibility`                                                                                                              |
| **Security matrix**               | Fast / Security / Nightly tiers                    | `pnpm audit:fast` · `pnpm audit:security`                                                                                                 |
| **Grant telemetry**               | Zero-trust JSON audit surface                      | `curl …/api/grant-audit`                                                                                                                  |
| **ZeroDev AA (Kernel v3)**        | ✅ Dry-Run Harness Verified (Kernel v3 / EntryPoint v0.7) | Dry-run harness + AA adapter tests; production UserOp broadcast remains flag-gated. |
| **ArbOS / Stylus WASM Alignment** | Active v0.9 / Research                             | **Edge-WASM Parity:** Sub-ms `soil_core.wasm` and `RobinhoodSafetySwitch.sol` active; native Stylus L2 co-residence alignment in roadmap. |
| **Sepolia Gate Testnet Sandbox**  | ✅ Contracts Verified & Forge Passed (Deployment Ready) | `SliverVineGate.sol` Forge 60/60 PASS · 327k Fuzz; ready for public Sepolia testnet broadcast. |


**Live mainnet proof:** 0.2223 ETH Short OID `513344575969` · GMX `uiFeeReceiver` +5 bps · machine-readable via `provenanceVerified`.

---



## Out of Scope (Proposed V1.0 – V1.5 Roadmap Options)

> **Governance & Feasibility Note:** The items below represent **tentative, proposed expansion vectors** subject to protocol TVL growth, market demand, and community governance approval. They are intentionally excluded from the active v0.9 production scope to maintain zero-compromise security on our core Arbitrum One GMX v2 pool.


| Proposed Module / Feature                    | Horizon Category | Tentative Implementation Scope & Conditions                                                                                        |
| -------------------------------------------- | ---------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| **Isomorphic BTC/USDC GMX Pools**            | Proposed V1.0    | **Config-driven expansion:** Configurable address mapping without smart contract or Wasm bytecode rewrites.                        |
| **USDG Robinhood Treasury Routing**          | Proposed V1.0    | **Permissioned clearing:** Config-driven treasury routing for native USDG redemption on Robinhood Chain upon demand.               |
| **Aave v3 Live On-Chain APY Reads**          | Proposed V1.5    | **Dynamic benchmark:** Replacing static `DEFAULT_AAVE_BASE_APY` fallback with active L2 oracle reads.                              |
| **10% Excess Yield Performance Fee**         | Proposed V1.5    | **Vault monetization:** Accruing 10% fee strictly on yield generated *above* Aave v3 benchmark APY.                                |
| **TWAPEngineV2 Live Slice Execution**        | Proposed V1.5    | **Execution planner:** Upgrading current TWAP path-slicing stub into active multi-clip execution routines for orders >$1M.         |
| **Shadow-DEX ZK Attestation**                | Research Option  | **Privacy-preserving proofs:** Evaluating ZK proofs for off-chain trade intent attestation without revealing agent strategies.     |
| **Robinhood Chain Mainnet 4663 Live Bridge** | Deployment Ready | **Mainnet Activation:** Activating live mainnet bridge contract upon regulatory approval (testnet `46630` remains active sandbox). |


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
pnpm test          # 735 PASS / 138 files
pnpm audit:fast    # tsc + vitest-security + solhint + gitleaks
curl -s "https://bedeltawater.slivervine.xyz/api/grant-audit" | jq .provenanceVerified
```

---



## Related Documents


| Document                                                                                | Purpose                    |
| --------------------------------------------------------------------------------------- | -------------------------- |
| [`docs/grants/arbitrum/ARBITRUM_ONE_PAGER.md`](./grants/arbitrum/ARBITRUM_ONE_PAGER.md) | Arbitrum grant one-pager   |
| [`docs/audit/Principal_Audit_Report.md`](./audit/Principal_Audit_Report.md)             | Principal Audit v1.0.0-rc1 |
| [`docs/sdk/CITADEL_SDK_BLUEPRINT.md`](./sdk/CITADEL_SDK_BLUEPRINT.md)                   | SDK integration blueprint  |
| [`docs/ARCHITECTURE.md`](./ARCHITECTURE.md)                                             | Dual-engine topology       |


