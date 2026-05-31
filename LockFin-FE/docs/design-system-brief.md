# 🎨 LockFin — Design System Brief

> Brief để FE agent chạy [ui-ux-pro-max-skill](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill) sinh design system cho LockFin PWA. Output sẽ được commit vào `src/styles/design-tokens.ts`.

---

## 1. Prompt cho skill

Copy-paste nguyên block dưới đây vào Claude (đã cài skill):

```
Use ui-ux-pro-max-skill to generate a complete design system for my project.

PROJECT: LockFin
TYPE: Mobile-first PWA — Personal Finance Tracker + Social Photo Feed (Locket-style)
TARGET USERS: Gen Z Vietnam, daily expense tracking with photo proof
PLATFORMS: PWA (iOS + Android home-screen install), Next.js App Router

CORE FLOWS (3 tabs):
  1. Feed — full-bleed photo cards of friends' expenses + streak badge
  2. Camera — capture → category picker → amount → upload (default tab)
  3. Profile — streak card + monthly donut chart + category breakdown

REASONING RULES TO APPLY:
  - Primary: Personal Finance Tracker
  - Secondary: Habit Tracker (for streak gamification)

CONSTRAINTS:
  - Brand primary color is FIXED: #FF6B6B (coral)
  - Stack: Next.js 14 + TailwindCSS + shadcn/ui + lucide-react
  - Must work in light mode by default (dark mode is v2)
  - Numeric-heavy UI — typography must render VND amounts cleanly
  - NO glassmorphism (photo feed needs solid card surfaces)
  - NO AI purple/pink gradients (fintech trust signal)
  - NO neon/crypto aesthetics

PREFERRED STYLES (in order):
  1. Soft UI Evolution (#19)
  2. Claymorphism (#9)
  3. Bento Box Grid (#21) — apply specifically to Tab 3 (Profile)

PREFERRED EFFECTS:
  - Micro-interactions (#16) on capture button and streak +1 toast
  - Smooth transitions 150–300ms
  - Scale-on-press for tactile feel

OUTPUT FORMAT:
  - TypeScript design tokens file (ready to drop into src/styles/design-tokens.ts)
  - Tailwind config extension snippet
  - Google Fonts import line
  - Anti-pattern checklist for PR review
  - Per-tab application notes (Feed / Camera / Profile)
```

---

## 2. Output template (skill phải fill)

Skill output sẽ được normalize về structure này trước khi commit:

### 2.1 `src/styles/design-tokens.ts`

```ts
export const tokens = {
  color: {
    primary:    '#FF6B6B',   // FIXED — coral brand
    secondary:  '#______',   // skill fills (ăn với coral, không neon)
    cta:        '#______',   // skill fills (high contrast, conversion)
    surface:    '#______',   // card background
    background: '#______',   // app background (warm white preferred)
    text: {
      primary:   '#______',  // contrast >= 7:1 on background
      secondary: '#______',  // contrast >= 4.5:1
      muted:     '#______',
    },
    semantic: {
      success: '#______',
      danger:  '#______',
      warning: '#______',
    },
  },
  font: {
    sans:    "'____', system-ui, sans-serif",   // body
    display: "'____', system-ui, sans-serif",   // numeric/headings
  },
  radius: { sm: '____', md: '____', lg: '____', full: '9999px' },
  shadow: {
    soft:    '____',  // Soft UI Evolution signature
    pressed: '____',  // inset for tactile buttons
    card:    '____',
  },
  motion: {
    fast:   '150ms',
    base:   '200ms',
    slow:   '300ms',
    spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
  },
} as const;
```

### 2.2 Tailwind config snippet

```ts
// tailwind.config.ts
import { tokens } from './src/styles/design-tokens';

export default {
  theme: {
    extend: {
      colors: { /* map từ tokens.color */ },
      fontFamily: { sans: [...], display: [...] },
      boxShadow: { soft: tokens.shadow.soft, pressed: tokens.shadow.pressed },
      borderRadius: { ...tokens.radius },
      transitionTimingFunction: { spring: tokens.motion.spring },
    },
  },
};
```

### 2.3 Google Fonts import

Một dòng `<link>` hoặc `next/font` snippet, paste vào `src/app/layout.tsx`.

### 2.4 Anti-pattern checklist (skill auto-gen)

Checkbox list để review trước khi merge UI PR. Mặc định phải có:
- [ ] Không dùng emoji làm UI icon (lucide-react only — category icon là data, OK)
- [ ] `cursor-pointer` trên mọi clickable
- [ ] Hover/active state smooth 150–300ms
- [ ] Text contrast ≥ 4.5:1 (light mode)
- [ ] Focus ring visible cho keyboard nav
- [ ] `@media (prefers-reduced-motion: reduce)` tắt animation
- [ ] Responsive test: 375px, 768px, 1024px, 1440px
- [ ] Không glassmorphism trên Feed card
- [ ] Không AI purple/pink gradient bất cứ đâu

### 2.5 Per-tab application notes

| Tab | Style note |
| --- | --- |
| Feed | Solid card `bg-surface` + `shadow-card`, photo full-bleed, footer overlay dùng `text-text-primary` trên gradient đen mờ — KHÔNG glass |
| Camera | Capture button `rounded-full` size 80px, `shadow-soft` → active state `shadow-pressed` + `scale-95`, transition 200ms spring |
| Profile | Bento grid 2 cols mobile: row1 = streak card (col-span-2), row2 = donut (col-span-2), row3 = category list. Mỗi cell `rounded-lg shadow-soft bg-surface p-4` |

---

## 3. Workflow

1. FE agent chạy skill với prompt ở Section 1
2. Skill trả về full design system → normalize về template Section 2
3. Commit `src/styles/design-tokens.ts` + tailwind config trong PR đầu tiên (`feat: design system foundation`)
4. Mọi PR UI sau đó phải:
   - Import từ `tokens` (không hardcode hex/px)
   - Tick anti-pattern checklist trong PR description

---

## 4. Khi nào re-run skill

- Đổi brand color (cần re-derive secondary/CTA)
- Add dark mode (v2 — re-run với constraint mới)
- Add tab/feature mới mà style cũ không cover (vd: friends list, notifications)

Không re-run cho từng component lẻ — design system là source of truth.
