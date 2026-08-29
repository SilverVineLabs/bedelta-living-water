# SilverVineLogo CSS 裁切與尺寸調整

## Summary of Changes
- 移除 `object-contain`，改以 `overflow-hidden` 比例容器 + `-my-2` 負邊距裁切透明留白。
- Logo 預設高度提升至 `h-14 sm:h-16`（外框 `h-12 sm:h-14`），`w-auto` 維持寬度自適應。
- `GrantAuditPageHeader` 移除覆寫 `imageClassName`，沿用組件預設尺寸。

## Test Results
- Vitest Showcase（含 SilverVineLogo）：PASS

## TS Typecheck
- `tsc --noEmit`：待本地確認

## Log Output Path
- `/docs/logging/20260816_silvervine_logo_css_clip.md`
