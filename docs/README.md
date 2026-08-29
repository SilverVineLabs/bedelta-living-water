# SliverVine Protocol — Documentation Index

**Entity:** SilverVine Labs · **Protocol:** SliverVine · **Branch:** `v1.0_push_BDLW`  
**Live:** [bedeltawater.slivervine.xyz](https://bedeltawater.slivervine.xyz) · **Contact:** `grants@silvervinelabs.com`

> **Locked Minimum Proposal Baseline:** Vitest **168 files | 742 PASS (100% Clean)** · **Current Live Suite:** **174 files | 768 PASS** · `pnpm test -- --run` · live proof `GET /api/grant-audit`.

> **Language policy:** English SSOT files are self-contained — professional English only, no CJK characters, no cross-language links.

---

## Start Here — Grant Reviewers & Institutional Auditors

**Step 1:** [`VERIFICATION_MATRIX.md`](./VERIFICATION_MATRIX.md) — Tier 0–5 CLI verification (Docker · Vitest · Forge · ZeroDev · live telemetry).

**Step 2:** Read the **Top 5 Core Grant Documents** below in order.

---

## Top 5 Core Grant Documents

| # | Document | Role |
|---|----------|------|
| 1 | [`VERIFICATION_MATRIX.md`](./VERIFICATION_MATRIX.md) | **CLI Tier 0–5 Verification Entry** — reproducible PASS bars for evaluators |
| 2 | [`architecture/TECHNICAL_SPECIFICATION.md`](./architecture/TECHNICAL_SPECIFICATION.md) | **Yellow Paper** — R01–R20 Risk Matrix · Three Pillars · Arbitrum-centric topology |
| 3 | [`audit/INSTITUTIONAL_DUE_DILIGENCE_MEMORANDUM.md`](./audit/INSTITUTIONAL_DUE_DILIGENCE_MEMORANDUM.md) | **Institutional DDIP** — allocator diligence · Basel III alignment · chaos 255/255 |
| 4 | [`audit/ZERODEV_EIP7702_COMPARATIVE_ANALYSIS.md`](./audit/ZERODEV_EIP7702_COMPARATIVE_ANALYSIS.md) | **ZeroDev AA vs. Pre-execution Wasm Risk Substrate** — Kernel v3 institutional differentiation |
| 5 | [`sdk/CITADEL_SDK_BLUEPRINT.md`](./sdk/CITADEL_SDK_BLUEPRINT.md) | **B2B CaaS Integration Blueprint** — `@slivervine/citadel-sdk` · 10 bps builder + referral rebate model |

---

## Supporting Documents

| Audience | Document | Role |
|----------|----------|------|
| **Cross-chain risk & roadmap** | [`architecture/CROSS_CHAIN_RISK_AND_EVOLUTION.md`](./architecture/CROSS_CHAIN_RISK_AND_EVOLUTION.md) | 60 invariants · V1.0 vs V1.5/V2.0 badge separation |
| **Compliance Ingress Firewall (Pillar 2)** | [`audit/ROBINHOOD_CHAIN_SAFETY_GATE_AUDIT.md`](./audit/ROBINHOOD_CHAIN_SAFETY_GATE_AUDIT.md) | Venue-agnostic unidirectional AML escort · Robinhood Chain as inaugural reference adapter · 5/5 tests |
| **Security audit snapshot** | [`audit/PRINCIPAL_AUDIT_REPORT.md`](./audit/PRINCIPAL_AUDIT_REPORT.md) | Principal review · Gate / survival matrix |
| **Grant submissions** | [`grants/SUBMISSION.md`](./grants/SUBMISSION.md) | Buildathon main submission pack |
| **Arbitrum grant scope** | [`grants/arbitrum/GRANT_PROPOSAL.md`](./grants/arbitrum/GRANT_PROPOSAL.md) | DAO proposal · milestone scope |
| **GMX Builders** | [`grants/gmx/GMX_BUILDERS_PITCH.md`](./grants/gmx/GMX_BUILDERS_PITCH.md) | GMX v2 integration pitch |
| **SDK package README** | [`../src/sdk/README.md`](../src/sdk/README.md) | In-repo SDK quick reference |
| **Sidecar / B2B ops** | [`../docker/README.md`](../docker/README.md) | Telemetry sidecar · Docker Tier 5 |

---

## Folder Map

```text
docs/
  README.md                 ← you are here
  VERIFICATION_MATRIX.md    Tier 0–5 CLI map (evaluators start here)
  architecture/             Yellow Paper · cross-chain risk framework
  audit/                    DDIP · ZeroDev analysis · Robinhood gate · principal audit
  sdk/                      Citadel SDK integration blueprint
  grants/                   SUBMISSION + arbitrum/ + gmx/
```

Live proof: `GET /api/grant-audit`.
