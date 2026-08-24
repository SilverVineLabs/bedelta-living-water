# Arbitrum Open House Singapore Online Buildathon — Judge Review

| Field | Value |
|-------|-------|
| **Event** | [Arbitrum Open House Singapore Online Buildathon](https://arbitrum-singapore.hackquest.io/buildathons/Arbitrum-Open-House-Singapore-Online-Buildathon) |
| **Project** | SliverVine / BeΔLivingWater Citadel (`bedelta-citadel-core`) |
| **Reviewer role** | Lead Technical Judge (SSOT / Non-Inflatable) |
| **Review date** | 2026-08-24 |
| **Evidence bar** | CLI-reproducible only (`pnpm test`, `pnpm audit:fast`, code paths, Forge) |

---

## Executive Verdict

**PASS with conditions — Core-track aligned, not vaporware.**

v0.9 delivers a real Arbitrum One–centric pre-execution gateway: GMX v2 ETH/USDC GM adapters + Hyperliquid 1× session-key hedge + Wasm soil fuse + on-chain Gate, backed by a green Vitest bar. Sponsor integrations are present at scaffold-to-delivered depth, with honest gaps (ZeroDev mainnet UserOp unproven; Robinhood mainnet bridge stub; Elara / Stylus as design reinforcement). Documentation count drift (README/GRANT still cite older PASS totals) must be corrected for submission hygiene.

| Criterion | Score | Notes |
|-----------|------:|-------|
| Technical Realism & Code SSOT | **8.5 / 10** | 735/138 Vitest SSOT; Foundry Gate 60; roadmap items labeled |
| Core Track Alignment | **9.0 / 10** | Primary identity = Arb One GMX ETH/USDC + HL 1× short |
| Sponsor Integration Depth | **7.5 / 10** | Strong GMX/Arb/Alchemy/OZ posture; ZeroDev dry-run only; RH ingress stub |
| OpSec & Repo Cleanliness | **8.0 / 10** | `.env.example` scrubbed this review; README badge lag remains |

**Overall: 8.3 / 10 — Recommend for Buildathon demo track (Arbitrum One Delta Pool).**

---

## 1. Core Track Compliance

**Question:** Does the codebase prioritize **Arbitrum One GMX v2 ETH/USDC + Hyperliquid 1× Short** as primary product identity?

| Claim | Evidence | Judge finding |
|-------|----------|---------------|
| Primary venue Arbitrum One `42161` | README · TECH_SPEC · grant-audit topology | **Confirmed** |
| GMX v2 ETH/USDC GM | `src/services/adapters/gmx-v2-*` · balancer · unsigned payload · `GMX_UI_FEE_BPS = 5` | **Delivered** |
| HL 1× short hedge | `src/adapters/hl/**` · session-key · 5TX provenance tests · OID fixture | **Delivered** (CI dry-run default `HL_LIVE=0`) |
| Robinhood as product? | Explicitly “permissioned ingress example, not product identity” | **Correctly demoted** |
| Pillar 3 Wasm moat | `pkg/soil_core.wasm` · `checkSoilResistance()` | **Present & tested** |

**Verdict:** Core track **compliant**. Triangle loop narrative matches code gravity (Arb GM primary → HL hedge → optional RH ingress).

---

## 2. Sponsor Integration Scorecard

Aligned with Singapore Open House sponsor surface ([HackQuest Buildathon portal](https://arbitrum-singapore.hackquest.io/buildathons/Arbitrum-Open-House-Singapore-Online-Buildathon)).

| Sponsor / Stack | Claimed capability | Code / test anchor | Depth | Honesty note |
|-----------------|--------------------|--------------------|-------|--------------|
| **Arbitrum One / ArbOS** | BaseFee velocity sensor · Tri-Sensor · Stylus WASM path | `arbitrum-gas-guard.ts` · TECH_SPEC §4.2 | **Deep (sensor)** / **Design (Stylus/Elara)** | Elara ingress = roadmap; Edge remains SSOT |
| **GMX v2** | Builder +5 bps `uiFeeReceiver` · DataStore reads | `gmx-revenue.ts` · `gmx-v2-order-payload.ts` · DataStore adapters | **Deep** | Live builder fee path asserted in grant docs |
| **ZeroDev** | Kernel v3 session keys / ERC-4337 | `src/adapters/arbitrum/zerodev-aa/**` · `zerodev-aa-dryrun-harness.test.ts` (3/3) | **Scaffold + Dry-Run Verified** | Mainnet UserOp **unproven**; `USE_ZERODEV_AA` default off |
| **Robinhood Chain** | 46630/4663 unidirectional ingress · AML inbound block | `robinhood-across-bridge.ts` · `RobinhoodSafetySwitch.sol` · audit snapshot | **Firewall logic delivered** · **bridge stub** | 46630 ACTIVE/TESTED; 4663 DEPLOYMENT READY / `bridgeDeployed: false` |
| **OpenZeppelin** | Contracts v5 Ownable / ReentrancyGuard / EIP-712 semantics | TECH_SPEC §4 wiki · Gate ECDSA aligned with OZ `ECDSA.tryRecover` | **Semantic / docs** | Gate uses zero external deps by design; OZ semantics mirrored |
| **Alchemy** | Multi-chain HTTPS/WSS HA | `.env.example` Alchemy placeholders · Arb/Sepolia/RH/HL | **Config / infra** | Placeholders only after OpSec scrub |

### Scorecard summary

- **Must-have track (Arb + GMX + HL):** **Satisfied.**
- **Sponsor stretch (ZeroDev + Robinhood):** **Partial credit** — real adapters + tests, not mainnet-complete.
- **Infra (Alchemy + OZ):** **Documented & placeholder-clean**; OZ is compliance posture more than hard import.

---

## 3. v0.9 Scope Verification (Non-Inflatable)

### 3.1 Regression bar (this review)

| Check | Expected (PROGRESS_TRUTH_CHECK) | Status |
|-------|---------------------------------|--------|
| `pnpm test` | **735 PASS / 138 files** | Re-run under Task 3 |
| `pnpm audit:fast` | PASS 4/0/0 | Re-run under Task 3 |
| Foundry Gate | 60 passed | Cited from SSOT (not re-run in this pass unless available) |
| ZeroDev dry-run harness | Mock Bundler verified | File present · prior green |

### 3.2 Delivered vs Roadmap (spot-checks)

| Item | Classification | Code fact |
|------|----------------|-----------|
| Soil / sequencer / oracle-lag gates | **v0.9 Delivered** | `risk-control-lib` · `sequencer-guard` · `arbitrum-gas-guard` |
| Emergency Margin Buffer 5% | **v0.9 Delivered** | `DEFAULT_CROSS_MMR = 0.05` · `margin-buffer.test.ts` |
| Dynamic Max SL `Balance×1%+$100` | **v0.9 Delivered** | `effective-max-sl.ts` |
| Aave v3 live APY | **V1.5 Roadmap** | Static `DEFAULT_AAVE_BASE_APY` fallback only |
| TWAPEngineV2 live slices | **V1.5 stub** | `executeSlice` stub path |
| 10% excess yield performance fee | **V1.5 Roadmap** | TECH_SPEC labeled |
| Live TCA Analytics HUD | **Actively evolving** | grant-audit exists; HUD not frozen |
| Compound lending | **Not implemented** | No pool calls |

**Verdict:** Scope honesty is **strong** in `PROGRESS_TRUTH_CHECK.md` and `GRANT_PROPOSAL.md` Out-of-Scope table. **Deductions** for README / GRANT header still advertising **732/137** or **725/135** while SSOT is **735/138**.

---

## 4. OpSec & Repository Cleanliness

| Finding | Severity | Action taken / required |
|---------|----------|-------------------------|
| `.env.example` contained live-looking `ZERODEV_PROJECT_ID` UUID | **High** | Replaced with `your_zerodev_project_id_here` |
| `.env.example` contained live-looking `ARBSCAN_API` | **High** | Replaced with `your_arbscan_api_key_here` |
| Alchemy URLs use `YOUR_ALCHEMY_API_KEY` | OK | Keep placeholders |
| README Vitest badge lag (732/137) | Medium (submission polish) | Sync to 735/138 before final submit |
| GRANT_PROPOSAL regression bar lag (725/135) | Medium | Sync to 735/138 |

**Judge note:** Treat any previously committed real keys as **compromised** — rotate ZeroDev project credentials and Arbiscan API keys in provider consoles even after example scrub.

---

## 5. What Would Disqualify (Not Observed)

- Claiming mainnet ZeroDev UserOp production when flag is default-off → **avoided** in PROGRESS_TRUTH_CHECK §2.4.
- Claiming Robinhood as the product center → **avoided**.
- Claiming Aave live yield / TWAP execution as shipped → **correctly V1.5**.

---

## 6. Conditions for Final Submission

1. Keep Vitest / audit:fast green at **735/138**.
2. Sync README + GRANT_PROPOSAL PASS counts to SSOT.
3. Demo narrative: **Arbitrum One Delta Pool first**; ZeroDev = Gatehouse dry-run; Robinhood = optional ingress firewall.
4. Do not present Stylus/Elara as production-complete.

---

## 7. Final Judge Statement

SliverVine Citadel is a **credible Arbitrum Open House entry**: real TypeScript Edge gateway, real GMX v2 builder path, real HL hedge adapters, and an on-chain Gate with Foundry evidence. Sponsor depth is **asymmetric** (GMX/Arbitrum strongest; ZeroDev/Robinhood honest partials). With OpSec placeholders restored and badge SSOT synced, the project meets Buildathon standards for **Technical Realism** and **Core Track Alignment**.

*— End of BUILDATHON_JUDGE_REVIEW —*
