# fix_robinhood_rwa_execution_chain

## Summary of Changes
- 新增 `src/config/rwa-refraction.ts` SSOT；GMX GM pool 位址自 config 動態解析（ETH pool 對齊 `gmx-v2-gm-balance`）
- `robinhood-refraction-adapter.ts` 串接 RPC vault 讀取 fallback、Across mock 執行與 GMX 分配目標
- `r-chain-vault-adapter` 支援 Robinhood Chain (46630) `eth_call` balanceOf，失敗時回退 stub

## Test Results
- `pnpm exec vitest run tests/v10/robinhood-refraction.test.ts` — 11 PASS

## TS Typecheck
- `pnpm typecheck` — CLEAN

## Log Output Path
- `/docs/logging/20260816_fix_robinhood_rwa_execution_chain.md`
