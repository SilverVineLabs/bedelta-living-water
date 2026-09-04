# EIP/ERC 標準 Wiki 更新日誌

> **Vitest SSOT:** 180 test files | 803 PASS Clean

**日期：** 2026-08-25  
**分支：** `v1.0_push_BDLW`  
**範圍：** `docs/architecture/01_TECHNICAL_SPECIFICATION.md` §4  
**作者：** Lead Architect（Agent）

---

## 變更摘要

正式將 SliverVine Citadel 綁定的五項核心 ERC/EIP 標準寫入技術規格 §4，並新增 **§4.0 ERC/EIP Standards Reference Wiki** 子章節。

| 標準 | 文件化內容 |
|------|-----------|
| **ERC-4337** | EntryPoint v0.7 · Kernel v0.3.1 · UserOp 欄位結構 · `verifyAgentIntent()` 前置閘門 |
| **EIP-7562** | Zero-Bundler-Rejection Invariant · 驗證階段 storage 規則 · `BUNDLER_TIMEOUT_FAIL_CLOSED` |
| **EIP-712** | Domain `SliverVineCitadel` v1 · `RiskAttestation` 型別 · `consumed[digest]` 單次消耗 |
| **ERC-1271** | Kernel `isValidSignature` · Gate ECDSA m-of-n 雙軌驗簽 |
| **ERC-20 / ERC-777** | 非託管 escort 語意 · `IN_FLIGHT_BRIDGE_CAPITAL` · GMX USDC SSOT |

## 程式錨點對照

| 錨點 | 路徑 |
|------|------|
| UserOp SSOT | `src/adapters/arbitrum/zerodev-aa/zerodev-aa-userop.ts` |
| EIP-712 domain | `src/sdk/constants.ts` · `SliverVineGate.sol` |
| Attestation 信封 | `src/sdk/attestation.ts` · `evaluateAttestation()` |
| Agent intent gate | `src/sdk/agent-intent.ts` · `verifyAgentIntent()` |
| Bridge escrow | `src/adapters/robinhood/robinhood-across-bridge.ts` |
| Payload binding | `SliverVineGate/src/GatedExecutor.sol` |

## 合規表更新

- 主表新增 EIP-7562、ERC-1271、ERC-20/ERC-777 三列；ERC-4337 / EIP-712 列擴充實作錨點。
- §4.1 Compliance Posture 新增五項標準要點條目。

## 行數預算

- 修改行數：< 150（符合任務限制）
- 未變更 §4.2 / §4.3 及文件其餘章節

## 驗證狀態

- 文件-only 變更；無程式碼 / 測試執行
- 錨點與現有 v0.9 程式庫一致（Forge 60/60 · Vitest 741 PASS 為 Phase C 基線）
