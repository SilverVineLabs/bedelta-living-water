# SliverVine Protocol (BeDelta Living Water v1.0 / BeΔ): Sub-ms 0-Gas Pre-Broadcast Safety Citadel & Risk Navigator for AI Agents on Arbitrum

**Document:** Documentation Index
**Official Name:** SliverVine Protocol (BeDelta Living Water v1.0 / BeΔ)
**Philosophy:** **BeDelta (BeΔ)** = Market Delta-Neutrality & Execution Safety · **SliverVine** = fragmented intent protection & steel trading execution.
**Entity:** SilverVine Labs · **Protocol:** SliverVine · **Branch:** `v1.0_push_BDLW`
**Live:** [bedeltawater.slivervine.xyz](https://bedeltawater.slivervine.xyz) · **Dune:** [silvervine-citadel-telemetry](https://dune.com/silvervinelabs/silvervine-citadel-telemetry) · **Contact:** `grants@silvervinelabs.com`

> **Vitest SSOT:** **173 test files | 765 PASS Clean** · `pnpm test -- --run` · live proof `GET /api/grant-audit`.

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
| 4 | [`audit/PILLAR_1_GATEHOUSE_ZERODEV_AA_ANALYSIS.md`](./audit/PILLAR_1_GATEHOUSE_ZERODEV_AA_ANALYSIS.md) | **ZeroDev AA vs. Pre-execution Wasm Risk Substrate** — Kernel v3 institutional differentiation |
| 5 | [`sdk/CITADEL_SDK_BLUEPRINT.md`](./sdk/CITADEL_SDK_BLUEPRINT.md) | **B2B CaaS Integration Blueprint** — `@slivervine/citadel-sdk` · 10 bps builder + referral rebate model |

---

## Supporting Documents

| Audience | Document | Role |
|----------|----------|------|
| **Cross-chain risk & roadmap** | [`architecture/CROSS_CHAIN_RISK_AND_EVOLUTION.md`](./architecture/CROSS_CHAIN_RISK_AND_EVOLUTION.md) | 60 invariants · V1.0 vs V1.5/V2.0 badge separation |
| **Compliance Ingress Firewall (Pillar 2)** | [`audit/PILLAR_2_COMPLIANCE_INGRESS_FIREWALL_AUDIT.md`](./audit/PILLAR_2_COMPLIANCE_INGRESS_FIREWALL_AUDIT.md) | Venue-agnostic unidirectional AML escort · Robinhood Chain as inaugural reference adapter · 5/5 tests |
| **Edge Shield Wasm Core (Pillar 3)** | [`audit/PILLAR_3_EDGE_SHIELD_WASM_CORESPEC.md`](./audit/PILLAR_3_EDGE_SHIELD_WASM_CORESPEC.md) | `checkSoilResistance()` · p50 ~106µs · Tri-Sensor · R01–R20 defense matrix |
| **Security audit snapshot** | [`audit/PRINCIPAL_AUDIT_REPORT.md`](./audit/PRINCIPAL_AUDIT_REPORT.md) | Principal review · Gate / survival matrix |
| **Grant submissions** | [`grants/SUBMISSION.md`](./grants/SUBMISSION.md) | Buildathon main submission pack |
| **HackQuest dual-video scripts** | [`pitch/GRANT_PITCH_AND_VIDEO_STORYBOARD.md`](./pitch/GRANT_PITCH_AND_VIDEO_STORYBOARD.md) | Pitch 180s (rainstorm) · Demo 120s (live CLI) |
| **Arbitrum grant scope** | [`grants/arbitrum/GRANT_PROPOSAL.md`](./grants/arbitrum/GRANT_PROPOSAL.md) | DAO proposal · milestone scope |
| **GMX Builders** | [`grants/gmx/GMX_BUILDERS_PITCH.md`](./grants/gmx/GMX_BUILDERS_PITCH.md) | GMX v2 integration pitch |
| **SDK package README** | [`../src/sdk/README.md`](../src/sdk/README.md) | In-repo SDK quick reference |
| **Sidecar / B2B ops** | [`../docker/README.md`](../docker/README.md) | Telemetry sidecar · Docker Tier 5 |

---

## Folder Map

```text
docs/
 README.md ← you are here
 VERIFICATION_MATRIX.md Tier 0–5 CLI map (evaluators start here)
 architecture/ Yellow Paper · cross-chain risk framework
 audit/ DDIP · ZeroDev analysis · Robinhood gate · principal audit
 sdk/ Citadel SDK integration blueprint
 grants/ SUBMISSION + arbitrum/ + gmx/
 pitch/ dual-video storyboards
 telemetry/ Dune SQL spec + Monte Carlo JSON
```

Live proof: `GET /api/grant-audit`.
