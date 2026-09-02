# Brand SSOT — SliverVine Protocol Spell-Fix (2026-09-02)


| Field      | Value                                                                |
| ---------- | -------------------------------------------------------------------- |
| **Branch** | `v1.0_push_BDLW`                                                     |
| **Scope**  | Global `.md` / `.ts` / `.tsx` / `.sol` / `.json` / scripts           |
| **Rule**   | Protocol = **SliverVine** · Entity = **SilverVine Labs** (unchanged) |


## Replacements

- `SilverVine Protocol` → `SliverVine Protocol`
- `SilverVine Citadel Protocol` → `SliverVine Citadel Protocol`
- `SilverVine Citadel` → `SliverVine Citadel`
- Standalone protocol `SilverVine` → `SliverVine` (29 files)

## Deprecated backwards-compat aliases only

- `resolveSilverVineRiskOracleAddress` / `readSilverVineRiskOracleState` — re-export aliases in `risk-oracle-gate.ts`
- `SILVERVINE_RISK_ORACLE_ABI` / `SILVERVINE_RISK_ORACLE_ADDRESS` — env/ABI deprecated aliases
- `SILVERVINE_HUD_DAPP_NODE_URL` / `SILVERVINE_SAFETY_BPS` / `SAFETY_RESERVE_BPS` — constant aliases

## API / constant pass (2026-09-02 follow-up)

- `zerodev-kernel-adapter.ts` — primary imports `resolveSliverVine*` / `readSliverVine*`
- `grant-ui-ssot.ts` — `SLIVERVINE_HUD_DAPP_NODE_URL` primary
- `fee-calculator.ts` — `SLIVERVINE_SAFETY_BPS` primary
- HUD strings — `[SLIVERVINE CITADEL HUD]` · `SLIVERVINE · SANTENMOKU SAFETY HUD` · `[SLIVERVINE DEFENSE]`

## Verification

- `pnpm test` — **176 test files | 775 PASS**
- Residual `SilverVine` grep — entity references only

