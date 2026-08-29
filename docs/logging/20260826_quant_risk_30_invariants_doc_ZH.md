# Quant Risk 30 Invariants 文件建立日誌

**日期：** 2026-08-26  
**分支：** `v1.0_push_BDLW`  
**角色：** Lead Quant & Systems Risk Architect

---

## 建立項目

| 檔案 | 動作 | 說明 |
|------|------|------|
| `docs/internal/QUANT_RISK_30_INVARIANTS.md` | **新增** | BDLW 動態 Delta-Neutral Vault 三十條黃金不變量（繁體中文） |
| `docs/logging/20260826_quant_risk_30_invariants_doc.md` | **新增** | 本建立日誌 |

---

## 內容摘要

### 六類 × 五條 = 30 條（GI-01–GI-30）

| 類別 | GI 編號 | 重點錨點 |
|------|---------|----------|
| 1. 費用與利差覆蓋 | GI-01–05 | uiFeeReceiver +5bps · skew +5~+10bps · gas-yield fuse · Paymaster 限額 |
| 2. 盤口與滑點追蹤 | GI-06–10 | MAX_SLIPPAGE 0.5% · 10bps impact · HL L2 · TWAP · PGATE 200ms |
| 3. GMX GM Pool 結構 | GI-11–15 | underweight · ETH/USDC · async settle · receiver/price bounds |
| 4. 微秒級預執行風控 | GI-16–20 | **106µs** · Wasm <60µs · Dynamic Max SL · AllowedToSign · soil→paymaster trip |
| 5. 密碼學與資產安全 | GI-21–25 | **lostUsd ≡ 0** · payloadHash · EIP-712 · **ZeroDev Session Keys** · R20 |
| 6. 巨觀與多場執行 | GI-26–30 | Δ-neutral 1× short · RH 單向 escort · funding delever · R17/R13 |

### 四項 BDLW 核心錨點

- 106 µs Wasm Soil Engine → GI-16–20
- lostUsd ≡ 0 → GI-21, GI-27
- uiFeeReceiver +5bps ~ +10bps → GI-01–03
- ZeroDev Session Keys → GI-05, GI-19, GI-24

### 參照來源

- `docs/architecture/TECHNICAL_SPECIFICATION.md` R01–R20
- `src/wasm/soil_core.rs` · `soil-resistance.ts` · `gmx-revenue.ts`
- `unidirectional-bridge.ts` · `zerodev-aa-*` · `GatedExecutor.sol`
- 既有 internal docs（Hot/Cold · Smart Routing · Wasm/Stylus）

---

## 驗證

- [x] 分支：`v1.0_push_BDLW`
- [x] 語言：繁體中文
- [x] 30 條不變量完整覆蓋六類
- [x] GI → R01–R20 交叉索引
- [x] 驗證指令清單已附
