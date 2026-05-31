# 🎨 LockFin — Design System & Anti-pattern Checklist

> Tokens generated thủ công dựa trên [design-system-brief.md](./design-system-brief.md) (skill `ui-ux-pro-max-skill` không có trong session). Re-run skill khi đổi brand/dark mode/feature mới.

## Tokens output

- `src/styles/design-tokens.ts` — source of truth
- `tailwind.config.ts` — extend từ tokens, không hardcode hex/px trong component
- Google Fonts: `next/font` (Inter + Plus Jakarta Sans) trong `src/app/layout.tsx`

## Palette quick-ref

| Token | Hex | Vai trò |
| --- | --- | --- |
| `primary` | `#FF6B6B` | Coral brand (FIXED) |
| `primary-hover` | `#FF5252` | Hover state |
| `secondary` | `#FFD9B3` | Accent ấm |
| `cta` | `#FF8A3D` | CTA cam, contrast cao |
| `surface` | `#FFFFFF` | Card |
| `surface-muted` | `#FFF6F2` | Card phụ / chip |
| `background` | `#FFF8F4` | App bg warm white |
| `border` | `#F1E3D8` | Border mềm |
| `text` | `#1F1B16` | Text chính (≥ 12:1 trên bg) |
| `text-secondary` | `#5B5249` | Phụ (≥ 6:1) |
| `text-muted` | `#8A8078` | Mờ (≥ 4.5:1) |
| `streak` | `#FF7A1A` | Lửa streak |
| `success/danger/warning/info` | semantic | Trạng thái |

## Pre-merge checklist

- [ ] Không hardcode màu/px — chỉ dùng class Tailwind hoặc import `tokens`
- [ ] Không emoji làm UI icon (lucide-react only — category icon là data, OK)
- [ ] `cursor-pointer` mặc định trên button (đã set ở `globals.css`)
- [ ] Hover/active transition 150–300ms qua `duration-fast|base|slow` + `ease-spring`
- [ ] Text contrast ≥ 4.5:1 (light mode) — dùng `text-text` / `text-text-secondary`
- [ ] Focus ring keyboard nav — đã set global `:focus-visible`
- [ ] `prefers-reduced-motion` respected — đã set global ở `globals.css`
- [ ] Responsive test: 375 / 768 / 1024 / 1440
- [ ] KHÔNG glassmorphism trên Feed card (dùng `bg-surface shadow-card`, footer dùng gradient đen mờ)
- [ ] KHÔNG AI purple/pink gradient, KHÔNG neon
- [ ] Capture button có scale-on-press + shadow-pressed (đã có ở `CameraView`)
- [ ] Số tiền VND dùng class `numeric` (Plus Jakarta Sans + tabular-nums)

## Per-tab application

| Tab | Style |
| --- | --- |
| Feed | `bg-surface shadow-card`, photo full-bleed, footer overlay `bg-gradient-to-t from-black/70` |
| Camera | Capture button `h-20 w-20 rounded-full bg-primary shadow-soft active:scale-90 active:shadow-pressed` |
| Profile | Bento `grid-cols-2 gap-3`: row1 streak (col-span-2), row2 donut (col-span-2), row3 categories (col-span-2) |
