# Arbitrum Grant Proposal — SliverVine Protocol (BeDelta Living Water v1.0 / BeΔ): Sub-ms 0-Gas Pre-Broadcast Safety Citadel & Risk Navigator for AI Agents on Arbitrum

**Official Name:** SliverVine Protocol (BeDelta Living Water v1.0 / BeΔ)
**Entity:** SilverVine Labs · **Contact:** `grants@silvervinelabs.com`
**Official Site:** [silvervinelabs.com](https://silvervinelabs.com)
**Repo:** [SilverVineLabs/bedelta-living-water](https://github.com/SilverVineLabs/bedelta-living-water)
**Live DApp:** [bedeltawater.slivervine.xyz](https://bedeltawater.slivervine.xyz)

> **Locked Minimum Proposal Baseline:** Vitest **175 test files | 773 tests PASS (100% Clean · Exit Code 0)** · **Current Live Suite:** **175 test files | 773 tests PASS (100% Clean · Exit Code 0)** · Security-tier `5/0/0 PASS` · Defense Matrix `17 Active | 2 Refactored | 1 Deprecated` · Wasm Core `<28kb` Cloudflare budget, `<60µs` execution.

**Audience:** Arbitrum ecosystem / Open House / future Security Grant.
**Not this pack:** GMX `uiFeeReceiver` economics → [`../gmx/`](../gmx/).

---

## 1. Executive Summary

SliverVine deploys a **Zero-Trust Pre-Execution Citadel** on **Arbitrum One**, with **Sepolia** dual-leg provenance and an L1 **`SliverVineGate.sol`** consume-once attestation lock. Before any Arbitrum broadcast, Edge sensors (sequencer, oracle lag, soil) fail-closed; production attestations bind to Gate `verifyingContract`.

**Interceptor Moat:** Deciding transaction execution safety at **p50 ~106 μs** BEFORE MEV bots or Sequencer mempools ever see it. Builder **+10 bps `uiFeeReceiver`** + up to **25% referral rebate** is standard GMX Builders monetization — secondary to the sub-ms risk gateway.

For LP exit semantics, the protocol enforces **zero protocol-level lock-up (100% non-custodial); redemption speed is subject only to GMX v2's native 3–5 min async Keeper settlement.**

**v1.0 Delivered (Sepolia verified)** · Mainnet deployment ties to **M6 Grant distribution**.

Security diligence is first-class: **3-Tier Audit Matrix** — security tier **5/0/0 PASS** lives in `docs/audit/static-analysis-report.json` (Vitest, Forge, Slither, Aderyn, pnpm-audit); `security-scorecard.json` mirrors the last run’s `"tier"`. Nightly adds Echidna / Halmos.

---

## 2. Arbitrum Deliverables (Live)

| Deliverable | SSOT | Status |
|-------------|------|--------|
| L1 Gate consume-once | `SliverVineGate/` · Forge 60/60 · 327,675 fuzz | Live |
| Edge Citadel on Arb One | Workers · sequencer / gas / soil | Live |
| Sepolia dual-leg proof | `sepoliaDualLegProof` in `/api/grant-audit` | Live |
| 3-Tier security scorecard | `docs/audit/security-scorecard.json` | Live |
| Wasm soil core | `pkg/soil_core.wasm` `<28kb` / `<60µs` | Live |
| R01–R20 matrix | Technical Specification | **17 / 2 / 1** |

---

## 3. Differentiation (Arbitrum Security)

| Gap | Typical L2 toolkit | SliverVine Citadel |
|-----|--------------------|--------------------|
| Pre-broadcast risk | Post-trade monitors | Fail-closed Edge + Gate attestation |
| Attestation replay | Soft off-chain checks | On-chain consume-once |
| Audit automation | Ad-hoc scripts | Fast / Security / Nightly matrix |
| Agent / AA drift | Unsigned UserOps | Bound via SDK + Gate (see ZeroDev pack when submitting AA) |

---

## 4. v1.0 Delivered Scope vs Post-Grant Roadmap

| Horizon | Status | Scope |
|---------|--------|-------|
| **v1.0 Delivered (Sepolia verified)** | ✅ Live | Sub-ms Wasm Soil Engine · ZeroDev Kernel v3 Session Key Adapter · Restored Deadman Switch (`agent-citadel-guard`) · Unidirectional Robinhood AML Bridge Escort · GMX **+10 bps** UI Fee (monetization, not moat) · **175 test files | 773 tests PASS (100% Clean · Exit Code 0)** · Sepolia / dry-run verified; mainnet ties to M6 |
| **V1.5 Roadmap (Planned Post-Grant)** | ⏳ Planned | **Citadel-as-a-Service (CaaS)** — productize `@slivervine/citadel-sdk` as an open sub-ms pre-execution risk layer for all Arbitrum dApps & AI Agent frameworks · **Hedge Leg Depth Guard** — dedicated Hyperliquid L2 orderbook depth sensing prior to hedge execution (zero-market-impact 1× short even during flash-liquidity drawdowns) · On-chain ECDSA Signer Recovery · Production GM Vault deployment · BTC/USDC isomorphic pools |

| Phase | Scope | Status |
|-------|-------|--------|
| Open House / Buildathon | Live HUD · Gate · Sepolia proof · **175/773** bar *(Locked: 175/773)* · 5-step E2E (`pnpm run demo:e2e`) | ✅ Submitted |
| Security Grant pack | Cold audit pack · R01–R20 + Slither/Echidna narrative | ⏳ Planned |
| Institutional AA | Kernel v3 Session Key (draft: `docs/internal/zerodev/`) | ✅ Delivered in v1.0 |

---

## 5. Verification

```bash
pnpm install
pnpm test # 175 test files | 773 tests PASS (100% Clean · Exit Code 0)
pnpm run audit:security # 5/0/0 PASS
pnpm run demo:e2e # 5-step Citadel E2E (dry-run)
cd SliverVineGate && forge test && cd ..
curl -s "https://bedeltawater.slivervine.xyz/api/grant-audit" | jq .sepoliaDualLegProof
```

---

## Related Documents

| Document | Purpose |
|----------|---------|
| [`../SUBMISSION.md`](../SUBMISSION.md) | Submission pack |
| [`ARBITRUM_ONE_PAGER.md`](./ARBITRUM_ONE_PAGER.md) | One-pager |
| [`../../architecture/TECHNICAL_SPECIFICATION.md`](../../architecture/TECHNICAL_SPECIFICATION.md) | R01–R20 |
| [`../../audit/`](../../audit/) | Scorecards |
| [`../gmx/GMX_BUILDERS_PITCH.md`](../gmx/GMX_BUILDERS_PITCH.md) | GMX-only economics |
