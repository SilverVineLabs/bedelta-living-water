# Arbitrum Submission Pack — Citadel Gateway & Gate Attestation

**Entity:** SilverVine Labs · **Contact:** `grants@silvervinelabs.com`  
**Official Site:** [silvervinelabs.com](https://silvervinelabs.com)  
**Live:** [bedeltawater.slivervine.xyz](https://bedeltawater.slivervine.xyz) · `GET /api/grant-audit`  
**Repo:** [SilverVineLabs/bedelta-living-water](https://github.com/SilverVineLabs/bedelta-living-water)

> **Baseline (locked):** Vitest **164 test files | 735 PASS (100% Clean)** · Security-tier `5/0/0 PASS` · Defense Matrix `17 Active | 2 Refactored | 1 Deprecated` · Wasm `<28kb` Cloudflare budget, `<60µs` execution.

**Audience:** Arbitrum Open House / Buildathon / chain security diligence.  
**Out of scope here:** GMX builder fee pitch → [`gmx/GMX_BUILDERS_PITCH.md`](./gmx/GMX_BUILDERS_PITCH.md).

---

## Primary Surface — Arbitrum One + Sepolia

| Layer | Module | Role |
|-------|--------|------|
| L1 Gate | `SliverVineGate/src/SliverVineGate.sol` | Consume-once attestation · replay lock · gas-bounded `verifyAndConsume` |
| Edge Citadel | Workers on Arbitrum One | Sequencer · oracle-lag · soil fail-closed |
| Sepolia proof | `sepoliaDualLegProof` | Arbiscan-anchored dual-leg diligence |
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

## Verification (60s)

```bash
pnpm install
pnpm test                 # 164 test files | 735 PASS (100% Clean)
pnpm run audit:security   # 5/0/0 PASS
cd SliverVineGate && forge test --gas-report && cd ..
curl -s "https://bedeltawater.slivervine.xyz/api/grant-audit" | jq .sepoliaDualLegProof
```

**Regression bar:** **164 test files | 735 PASS (100% Clean)** · Forge 60/60 · 327,675 fuzz · Wasm `<28kb` / `<60µs`.

---

## Related Documents

| Document | Purpose |
|----------|---------|
| [`arbitrum/ARBITRUM_ONE_PAGER.md`](./arbitrum/ARBITRUM_ONE_PAGER.md) | One-pager |
| [`arbitrum/GRANT_PROPOSAL.md`](./arbitrum/GRANT_PROPOSAL.md) | Scope & roadmap |
| [`../architecture/TECHNICAL_SPECIFICATION.md`](../architecture/TECHNICAL_SPECIFICATION.md) | R01–R20 |
| [`gmx/GMX_BUILDERS_PITCH.md`](./gmx/GMX_BUILDERS_PITCH.md) | GMX-only builder economics |
