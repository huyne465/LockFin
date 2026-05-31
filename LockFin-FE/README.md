# LockFin FE

Next.js 14 PWA — implementation theo `docs/init-fe.md` + `docs/design-system-brief.md`.

## Setup

```bash
npm install
cp .env.local.example .env.local   # fill Supabase URL + ANON KEY + API base
npm run dev
```

## Cần làm trước khi chạy production

1. Tạo icon PWA tại `public/icons/icon-{192,512}.png` + `icon-maskable-512.png`.
2. Tạo Supabase Storage bucket `posts` (public) với policy như docs section 4.
3. Cấu hình Google OAuth provider trong Supabase Dashboard (callback `/auth/callback`).
4. Backend NestJS chạy tại `NEXT_PUBLIC_API_BASE_URL` (default `http://localhost:3000/api`).

## Cấu trúc

```
src/
├── app/
│   ├── (auth)/{login,signup}/page.tsx
│   ├── (main)/
│   │   ├── layout.tsx          # bottom nav 3 tabs
│   │   ├── page.tsx            # Tab 2 — Camera (default)
│   │   ├── feed/page.tsx       # Tab 1 — Feed
│   │   └── profile/page.tsx    # Tab 3 — Profile
│   ├── auth/callback/route.ts  # OAuth redirect
│   ├── offline/page.tsx
│   ├── layout.tsx + providers.tsx + globals.css
├── components/{ui,camera,profile}/...
├── lib/
│   ├── supabase/{client,server}.ts
│   ├── api.ts                  # Bearer-injecting fetch wrapper
│   ├── queries.ts              # React Query hooks
│   ├── types.ts                # API contract types
│   ├── format.ts               # VND, relative time, currentMonth
│   └── store.ts                # zustand UI state
├── middleware.ts               # auth guard
└── styles/design-tokens.ts
```

## Scripts

- `npm run dev` — Next dev (PWA disabled)
- `npm run build` — production build với service worker
- `npm run typecheck` — `tsc --noEmit`

## Design system

Xem [docs/design-system-checklist.md](docs/design-system-checklist.md) cho palette + anti-pattern checklist.
