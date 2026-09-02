# SDK Blueprint 架構不變量更新日誌

> **Vitest SSOT:** Proposal Baseline: 175 test files | 773 PASS (Current Branch Live: 176 test files | 775 PASS Clean)

**日期：** 2026-08-25  
**分支：** `v1.0_push_BDLW`  
**範圍：** `docs/sdk/CITADEL_SDK_BLUEPRINT.md`

---

## 變更摘要

於 Blueprint 新增結構化 Markdown 章節，不修改既有程式碼範例區塊。

| 新增章節 | 內容 |
|---------|------|
| **Triangle Liquidity Loop** | 三柱 + 三角流動性迴路圖（Arbitrum 主收益基地 · HL 對沖 · Robinhood 可選入口） |
| **Core Architectural Invariants** | 四項核心不變量正式文件化 |

## 四項不變量

1. **Non-Custodial Unidirectional Escort** — `lostUsd ≡ 0`、單向 escort、AML 反向封鎖
2. **30s TTL Nonce-Healed Self-Exploding Session Keys** — 30s 心跳 / attestation TTL、nonce 自癒、簽章通道自爆鎖定
3. **Zero-Bundler-Rejection Invariant (EIP-7562)** — UserOp 驗證階段 storage 規則、bundler fail-closed
4. **Skew Neutralizer Premium** — `uiFeeReceiver` +5 bps + 正向 skew rebate ~5 bps（合計 +5 ~ +10 bps 帶）

## 錨點對照

- 三角迴路：`docs/architecture/TECHNICAL_SPECIFICATION.md` §2
- EIP-7562 wiki：`docs/architecture/TECHNICAL_SPECIFICATION.md` §4.0
- Nonce healing：`src/services/session-key-adapter-lib/nonce-auto-healing.ts`
- UI fee SSOT：`src/config/gmx-revenue.ts` · `GMX_UI_FEE_BPS = 5`

## 限制遵守

- 程式碼範例區塊（§ Code Examples）未變更
- 僅新增結構化 Markdown 章節
