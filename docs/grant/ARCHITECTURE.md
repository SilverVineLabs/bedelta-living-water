# Grant Architecture — SliverVine Citadel Gateway

Dual-engine Cloudflare Edge Worker. SRP: <200 LOC per file. Full topology: [../ARCHITECTURE.md](../ARCHITECTURE.md).

---

## 1. KV Key-Prefix Isolation

Production uses **one Cloudflare KV namespace ID** bound four times (`BEDELTA_WATER_KV`, `SLIVERVINE_KV`, `SYSTEM_STATE_KV`, `EXECUTION_LOGS_KV`). Tenancy is **logical**, enforced by mandatory key prefixes in `src/services/kv-lib/keys.ts` and route-specific writers.

| Prefix | Binding | Domain | Example keys |
|--------|---------|--------|--------------|
| `exec:*` | `EXECUTION_LOGS_KV` | Grant audit logs · mainnet monitor | `exec:log_latest`, `exec:history_7d` (legacy unprefixed keys retiring) |
| `state:*` | `SYSTEM_STATE_KV` | SystemState SSOT · intent ledger · R20 flags | `state:system:state` (`KV_KEYS.SYSTEM_STATE`) |
| `sys:*` | `BEDELTA_WATER_KV` / `SLIVERVINE_KV` | Heartbeat · matrix · market telemetry · risk logs | `sys:heartbeat`, `sys:matrix:latest`, `sys:telemetry:soak-rolling` |

**Rules**

1. Writers must use `KV_KEYS` constants — no ad-hoc string keys.
2. Cross-prefix writes on the same logical record are forbidden.
3. Separate namespace IDs are not required at current scale; prefix discipline is the isolation contract.

Configuration SSOT: `wrangler.toml` header comments.

---

## 2. Request Flow (Grant Path)

1. Ingress — `src/index.ts` → `worker-routing.ts`; crons `*/5 * * * *` → GMX hedge drift gate.
2. Pre-execution gate — sequencer → oracle lag → `checkSoilResistance()`.
3. GMX routing — `gmx-v2-balancer.ts` underweight qualification → `gmx-v2-order-payload.ts` with `uiFeeReceiver`.
4. HL hedge leg — `hl-auto-hedge.ts` session-key sponge when Citadel flags trip.
5. Audit JSON — `GET /api/grant-audit` from `EXECUTION_LOGS_KV` + live telemetry probes.

---

## 3. MDD Guard Scope (HUD)

**0.00% MDD** claims are scoped to:

- **Time window:** Santenmoku Citadel Telemetry Window (multi-week / 30d verification envelope; machine-readable via `/api/grant-audit`)
- **Capital envelope:** ~$1,302 USDC combined monitored Citadel TVL (GM pool + HL hedge margin)
- **Mechanism:** Dynamic Max SL + soil resistance fail-closed envelope — **0.00% MDD (Santenmoku Verified Window · Machine-Readable Telemetry · ~$1.3k Monitored Citadel TVL)** — not a universal vault guarantee

Constants: `MDD_GUARD_*` in `src/config/constants.ts`.

---

## 4. Regression Bar & Test Count History

| Phase | Test files | Vitest tests | Notes |
|-------|------------|--------------|-------|
| Pre-audit peak | 167+ | 846+ | Broad matrix · duplicate async stubs · dark-staging modules |
| Scope refactoring & matrix stabilization pass | 115 | 623 | Removed stale duplicates · scoped async-api project · grant-path focus |
| Current bar | **117** | **630** | **100% PASS** · `tsc --noEmit` CLEAN |

**Why 846 → 623:** Deliberate scope stabilization — dropped redundant HL/GMX matrix fixtures, consolidated grant-audit async tests, and removed dark-staging-only suites not in M1 grant deliverables. The bar reflects **grant-critical paths** (Citadel gate, grant-audit JSON, execution logs, defense matrix) rather than inflated count.

Verify: `pnpm test` · `pnpm typecheck`

---

## Related Documents

| Document | Purpose |
|----------|---------|
| [GRANT_PROPOSAL.md](./GRANT_PROPOSAL.md) | M1–M3 scope · Done / NOT-done |
| [SUBMISSION.md](./SUBMISSION.md) | Grant submission pack |
| [../ARCHITECTURE.md](../ARCHITECTURE.md) | Full 20-root defense matrix |
| [../../SECURITY.md](../../SECURITY.md) | Vulnerability reporting · fail-closed guarantees |
