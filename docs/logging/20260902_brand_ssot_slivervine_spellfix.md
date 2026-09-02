# Brand SSOT — SliverVine Protocol Spell-Fix (2026-09-02)

| Field | Value |
|-------|-------|
| **Branch** | `v1.0_push_BDLW` |
| **Scope** | Global `.md` / `.ts` / `.tsx` / `.sol` / `.json` / scripts |
| **Rule** | Protocol = **SliverVine** · Entity = **SilverVine Labs** (unchanged) |

## Replacements

- `SilverVine Protocol` → `SliverVine Protocol`
- `SilverVine Citadel Protocol` → `SliverVine Citadel Protocol`
- `SilverVine Citadel` → `SliverVine Citadel`
- Standalone protocol `SilverVine` → `SliverVine` (29 files)

## Protected (no change)

- `SilverVine Labs` · `SilverVineLabs` · `silvervinelabs` URLs
- `resolveSilverVineRiskOracle` / `readSilverVineRiskOracleState` API aliases

## Verification

- `pnpm test` — **176 test files | 775 PASS**
- Residual `SilverVine` grep — entity references only
