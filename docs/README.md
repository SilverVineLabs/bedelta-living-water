# SliverVine Protocol — Documentation Index

**Entity:** SilverVine Labs · **Protocol:** SliverVine · **Live:** [bedeltawater.slivervine.xyz](https://bedeltawater.slivervine.xyz)  
**Contact:** `grants@silvervinelabs.com`

> **Baseline (locked):** Vitest `135 files | 724 PASS (100% Clean)` · Security-tier `5/0/0 PASS` (`docs/audit/static-analysis-report.json`; Vitest, Forge, Slither, Aderyn, pnpm-audit) · Defense Matrix `17 Active | 2 Refactored | 1 Deprecated` · Wasm Core `<28kb` Cloudflare budget, `<60µs` execution.  
> Fast-tier scorecard (`docs/audit/security-scorecard.json`) is overwritten by the last `audit:*` run — do not mix tiers.

Open **one folder** for your role. Do not send reviewers the whole tree.

| Audience | Open first | Avoid leading with |
|----------|------------|--------------------|
| **GMX Builders** | [`grants/gmx/`](./grants/gmx/) | Robinhood / ZeroDev stubs |
| **Arbitrum Buildathon / DAO / Security** | [`grants/arbitrum/`](./grants/arbitrum/) + [`architecture/`](./architecture/) | HL TCA deep-dive |
| **Security / auditors** | [`architecture/TECHNICAL_SPECIFICATION.md`](./architecture/TECHNICAL_SPECIFICATION.md) + [`audit/`](./audit/) | Marketing pitch decks |
| **SDK integrators** | [`../src/sdk/README.md`](../src/sdk/README.md) → [`sdk/CITADEL_SDK_BLUEPRINT.md`](./sdk/CITADEL_SDK_BLUEPRINT.md) | Grant economics |
| **Sidecar / B2B ops** | [`../DOCKER_README.md`](../DOCKER_README.md) | Grant one-pagers |
| **Grant program status** | [`grants/README.md`](./grants/README.md) | Internal drafts |
| **Internal (Confidential)** | [`internal/README.md`](./internal/README.md) | Public grant packs |

## Folder map

```text
docs/
  architecture/   Technical Specification & R01–R20 (Yellow Paper)
  sdk/            @slivervine/citadel-sdk blueprint (Apache-2.0) — public
  grants/         Public grant submissions only (GMX · Arbitrum)
  internal/       Confidential strategy & pitch drafts (SilverVine Labs only)
  audit/          security-scorecard.json (last tier run) · static-analysis-report.json (security-tier 5/0/0)
```

Live proof: `GET /api/grant-audit`.
