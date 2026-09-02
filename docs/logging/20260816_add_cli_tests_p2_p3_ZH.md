# add_cli_tests_p2_p3

> **Vitest SSOT:** Proposal Baseline: 175 test files | 773 PASS (Current Branch Live: 176 test files | 775 PASS Clean)

## Summary of Changes
- 新增 `scripts/test-rwa-refraction-cli.ts`：Pillar 2 端到端 Vault → Across → GMX 路由診斷輸出
- 新增 `scripts/test-agent-armor-cli.ts`：Pillar 3 正常簽名與 >500ms / soil 失敗 R20 sever 診斷
- `package.json` 新增 `test:cli:rwa` 與 `test:cli:armor`

## Test Results
- `pnpm run test:cli:rwa` — PASS（executionLatencyMs≈305）
- `pnpm run test:cli:armor` — Case A PASS（66-byte ECDSA）；Case B 注入 >500ms L2 probe → R20 sever + soil 拒簽

## TS Typecheck
- `pnpm typecheck` — CLEAN（session-key-signer 改為直連 kernel-v3-engine，避免 CLI 載入 zerodev adapter 全量）

## Log Output Path
- `/docs/logging/20260816_add_cli_tests_p2_p3.md`
