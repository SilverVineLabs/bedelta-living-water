# TECHNICAL_SPECIFICATION ZeroDev v4 章節更新日誌

> **Vitest SSOT:** Proposal Baseline: 175 test files | 773 PASS (Current Branch Live: 176 test files | 775 PASS Clean)

**日期：** 2026-08-26  
**分支：** `v1.0_push_BDLW`  
**角色：** Senior Technical Writer  
**任務：** 3/3 — 強化 Tech Spec ZeroDev 帳戶抽象章節

---

## 修改項目

| 檔案 | 動作 | 說明 |
|------|------|------|
| `docs/architecture/TECHNICAL_SPECIFICATION.md` | **更新** | 新增 §2.4（繁中）· 擴充 §4.0 ERC-4337 / EIP-7562 · Related Documents |
| `docs/logging/20260826_tech_spec_zerodev_v4_update.md` | **新增** | 本建立日誌 |

---

## 變更摘要（< 150 行）

### 新增 §2.4 Pillar 1 — ZeroDev 帳戶抽象（繁體中文）

| 小節 | 內容 |
|------|------|
| **§2.4.1** | ZeroDev 作為 BDLW 非託管 106 µs 管線基礎核心（Session Keys · Paymaster · Bundler 三能力表 + 執行管線圖） |
| **§2.4.2** | Kernel v3（v0.9 SSOT）vs Kernel v4（V1.0 適配層遷移 · Shield/Wasm 零改寫） |
| **§2.4.3** | Paymaster Gas Sponsorship（$0.50/筆 · $10/日 · soil 串行熔斷） |
| **§2.4.4** | EIP-7562 Zero-Bundler-Rejection 不變量（fail-closed · 3s timeout） |
| **§2.4.5** | ZeroDev v4「Seven Stages, One Stack」對齊（Sign in → Fund → Gas → Authorize → Execute + Recover/Compose V1.0） |

### §4.0 擴充（英文 + 繁中交叉引用）

- ERC-4337：指向 §2.4 · Paymaster 限額 · 106 µs coupling 列
- EIP-7562：繁中不變量標題 · `evaluateStaticBreakerMatrix` · 驗證錨點

### 其他

- §2.3 錨點新增 `ZERODEV_SMART_ROUTING_DEEP_DIVE.md` 連結
- Related Documents 新增三份 internal 文件連結

---

## 驗證

- [x] 分支：`v1.0_push_BDLW`
- [x] 語言：新增 §2.4 為繁體中文
- [x] 修改行數：< 150 行
- [x] Kernel v3 = v0.9 已交付 · v4 = V1.0 適配層（非重寫 Shield）
- [x] 3/3 文件系列完成

---

## 備註

「Seven Stages, One Stack」中 BDLW 明確對齊前五階段（Sign in → Execute）；⑥ Recover、⑦ Compose 標記 V1.0，與現有 `intent-ledger.ts` 2PC 語意部分重疊。
