# SliverVine Protocol — Documentation Index

**Entity:** SilverVine Labs · **Protocol:** SliverVine · **Live:** [bedeltawater.slivervine.xyz](https://bedeltawater.slivervine.xyz)  
**Contact:** `grants@silvervinelabs.com`

> **Baseline (locked):** Vitest **735 PASS (164 files)** · `pnpm test` · live proof `GET /api/grant-audit`.  
> **Evaluators start here:** [`VERIFICATION_MATRIX.md`](./VERIFICATION_MATRIX.md) — Tier 1–5 CLI map.

> **SSOT Realignment Log (2026-08-25)**  
> - **Deployment status:** All docs unified on `v0.9 Production-Ready (Arbitrum Sepolia Testnet & Dry-Run Verified)` — not equivalent to Arbitrum One mainnet live (M6).  
> - **Fuzz:** Default `forge test` = **5,120** (5×1,024); **327,675** = `pnpm audit:nightly` / `FOUNDRY_PROFILE=deep`.  
> - **Design vs Code:** SGX PRM · Stylus on-L2 · ERC-7715 = ⏳ V1.0 Design Spec; `evaluateHlOrderbookGapGuard()` = v0.9 partial guard.

## Canonical Docs (SSOT)

| # | Document | Role |
|---|----------|------|
| 1 | [`architecture/TECHNICAL_SPECIFICATION.md`](./architecture/TECHNICAL_SPECIFICATION.md) | Yellow Paper — Triangle Liquidity Loop · R01–R20 · ERC/EIP wiki |
| 2 | [`sdk/CITADEL_SDK_BLUEPRINT.md`](./sdk/CITADEL_SDK_BLUEPRINT.md) | SDK Integration — `@slivervine/citadel-sdk` (Apache-2.0) |
| 3 | [`audit/PRINCIPAL_AUDIT_REPORT.md`](./audit/PRINCIPAL_AUDIT_REPORT.md) | Security Audit — liability decoupling · Gate / survival matrix |
| 4 | [`grants/SUBMISSION.md`](./grants/SUBMISSION.md) | Buildathon Main Submission — Arbitrum Open House pack |
| 5 | [`grants/arbitrum/ARBITRUM_ONE_PAGER.md`](./grants/arbitrum/ARBITRUM_ONE_PAGER.md) | Grant One-Pager — DAO / short diligence |
| 6 | [`VERIFICATION_MATRIX.md`](./VERIFICATION_MATRIX.md) | **Evaluator Verification Matrix** — Tier 1–5 scripts & expected PASS bars |

## Supporting (by audience)

| Audience | Open |
|----------|------|
| **Buildathon / grant judges** | [`VERIFICATION_MATRIX.md`](./VERIFICATION_MATRIX.md) → then [`grants/SUBMISSION.md`](./grants/SUBMISSION.md) |
| **GMX Builders** | [`grants/gmx/GMX_BUILDERS_PITCH.md`](./grants/gmx/GMX_BUILDERS_PITCH.md) |
| **Arbitrum grant scope** | [`grants/arbitrum/GRANT_PROPOSAL.md`](./grants/arbitrum/GRANT_PROPOSAL.md) |
| **Grant track index** | [`grants/README.md`](./grants/README.md) |
| **Robinhood Safety Gate** | [`audit/ROBINHOOD_CHAIN_SAFETY_GATE_AUDIT.md`](./audit/ROBINHOOD_CHAIN_SAFETY_GATE_AUDIT.md) |
| **SDK package README** | [`../src/sdk/README.md`](../src/sdk/README.md) |
| **Sidecar / B2B ops** | [`../docker/README.md`](../docker/README.md) |

## Folder map

```text
docs/
  VERIFICATION_MATRIX.md   Evaluator Tier 1–5 CLI map (start here)
  architecture/            Yellow Paper (TECHNICAL_SPECIFICATION)
  sdk/                     Citadel SDK blueprint (public)
  audit/                   Principal audit · Robinhood Chain safety gate
  grants/                  SUBMISSION + arbitrum/ + gmx/
```

Live proof: `GET /api/grant-audit`.
