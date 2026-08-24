# Arbitrum Grant Proposal — Citadel Deployment & Security Roadmap

**Entity:** SilverVine Labs · **Contact:** `grants@silvervinelabs.com`  
**Official Site:** [silvervinelabs.com](https://silvervinelabs.com)  
**Repo:** [SilverVineLabs/bedelta-living-water](https://github.com/SilverVineLabs/bedelta-living-water)  
**Live DApp:** [bedeltawater.slivervine.xyz](https://bedeltawater.slivervine.xyz)

> **Baseline (locked):** Vitest `135 files | 724 PASS (100% Clean)` · Security-tier `5/0/0 PASS` (`docs/audit/static-analysis-report.json`; Vitest, Forge, Slither, Aderyn, pnpm-audit) · Defense Matrix `17 Active | 2 Refactored | 1 Deprecated` · Wasm Core `<28kb` Cloudflare budget, `<60µs` execution.  
> Fast-tier scorecard (`docs/audit/security-scorecard.json`) is overwritten by the last `audit:*` run — do not mix tiers.

**Audience:** Arbitrum ecosystem / Open House / future Security Grant.  
**Not this pack:** GMX `uiFeeReceiver` economics → [`../gmx/`](../gmx/).

---

## 1. Executive Summary

SliverVine deploys a **Zero-Trust Pre-Execution Citadel** on **Arbitrum One**, with **Sepolia** dual-leg provenance and an L1 **`SliverVineGate.sol`** consume-once attestation lock. Before any Arbitrum broadcast, Edge sensors (sequencer, oracle lag, soil) fail-closed; production attestations bind to Gate `verifyingContract`.

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

## 4. v0.9 Scope vs V1.0 Roadmap

| Horizon | Status | Scope |
|---------|--------|-------|
| **v0.9 Delivered (100% Code & Tested)** | ✅ Live | Sub-ms Wasm Soil Engine · ZeroDev Kernel v3 Session Key Adapter · Restored Deadman Switch (`agent-citadel-guard`) · Unidirectional Robinhood AML Bridge Escort · GMX +5 bps UI Fee · **135 files / 724 PASS** |
| **V1.0 Roadmap (Planned Post-Grant)** | ⏳ Planned | On-chain ECDSA Signer Recovery Verification · Production Smart Contract Deployment for GM Vaults |

| Phase | Scope | Status |
|-------|-------|--------|
| Open House / Buildathon | Live HUD · Gate · Sepolia proof · **135/724** bar · 5-step E2E (`pnpm demo:pipeline`) | ✅ Submitted |
| Security Grant pack | Cold audit pack · R01–R20 + Slither/Echidna narrative | ⏳ Planned |
| Institutional AA | Kernel v3 Session Key (draft: `docs/internal/zerodev/`) | ✅ Delivered in v0.9 |

---

## 5. Verification

```bash
pnpm install
pnpm test                 # 135 files | 724 PASS (100% Clean)
pnpm run audit:security   # 5/0/0 PASS
pnpm demo:pipeline        # 5-step Citadel E2E (dry-run)
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
