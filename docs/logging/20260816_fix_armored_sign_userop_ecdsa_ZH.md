# fix_armored_sign_userop_ecdsa

## Summary of Changes
- `armoredSignUserOp()` 改為透過 `kernel-v3-engine` + `zerodev-aa-adapter` 產生真實 secp256k1 ECDSA 簽名（含 Kernel v3 `0x00` validator mode 前綴）
- 政策 / soil 失敗改為 `ArmoredSignRejectedError` fail-closed 拋錯，簽名前即阻斷
- `agent-armor.test.ts` 驗證 ≥65-byte ERC-4337 ECDSA 簽名格式

## Test Results
- `pnpm exec vitest run tests/v10/agent-armor.test.ts` — PASS

## TS Typecheck
- `pnpm typecheck` — CLEAN

## Log Output Path
- `/docs/logging/20260816_fix_armored_sign_userop_ecdsa.md`
