# Wasm / Stylus 雙引擎路線圖文件建立日誌

**日期：** 2026-08-25  
**分支：** `v1.0_push_BDLW`  
**角色：** Senior Technical Writer  
**任務：** 建立 V1.0 雙引擎重構內部路線圖

---

## 建立項目

| 檔案 | 動作 | 說明 |
|------|------|------|
| `docs/internal/WASM_STYLUS_DUAL_ENGINE_ROADMAP.md` | **新增** | Pillar 3 Rust/Wasm 算式化 + Arbitrum Stylus 雙引擎路線圖（繁體中文） |
| `docs/logging/20260825_wasm_stylus_roadmap_creation.md` | **新增** | 本建立日誌 |

---

## 內容摘要

### 文件結構

1. **戰術目標** — Pillar 3 核心算式與 R01–R20 防禦矩陣 Rust 算式化；Edge SSOT + Stylus reinforcement 雙平面
2. **方向一：多項式張力算式化**
   - GMX v2 Skew Moment · 非對稱滑點 · Oracle Variance → `#[wasm_bindgen]` Rust crate
   - 目標：Pure Math 200 ns → < 50 ns；Edge p50 106 µs → < 60 µs
3. **方向二：Arbitrum Stylus 鏈上斷路器**
   - 同一 Rust SSOT 編譯為 Sepolia Stylus 合約
   - 目標：verifyAndConsume 28,043 gas → ~12,000 gas（> 50% 節省）
4. **敘事策略** — 黑客松 Demo 腳本 + M6 grant 包裝：「同一套 Rust，鏈上 Stylus + 鏈下 Cloudflare Wasm」

### 參照來源

- `src/wasm/soil_core.rs` · `src/sdk/soil-wasm.ts` · `soil-resistance-math.ts`
- `docs/architecture/TECHNICAL_SPECIFICATION.md` §4.2 · §3.5
- `SliverVineGate/MILESTONES.md` D1 方向
- `docs/internal/HOT_COLD_PATH_DECOUPLING.md`
- README gas / latency baseline（28,043 gas · 200 ns · 106 µs）

---

## 驗證

- [x] 分支確認：`v1.0_push_BDLW`
- [x] 語言：繁體中文
- [x] 設計鐵律：Edge pre-broadcast SSOT 不可弱化
- [x] Stylus activation 14M gas 風險已註記（對照 MILESTONES D1）

---

## 備註

本文件標記為 **⏳ V1.0 Design Spec**，與 v0.9 已交付 M4 `soil_core.wasm` 明確區隔。實作前需確認 Stylus 在目標鏈（Sepolia / Robinhood Chain）的啟用狀態。
