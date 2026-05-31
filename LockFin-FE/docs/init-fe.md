# 🎨 LockFin Frontend — Implementation Handoff (for FE Agent)

> Backend (NestJS + Supabase) đã hoàn thành & tested. Tài liệu này là **contract** để FE agent build NextJS PWA độc lập, không cần đọc source backend.

---

## 0. TL;DR — Bạn cần build gì

Một **NextJS 14+ PWA**, mobile-first, 3 tabs:

| Tab | Tên           | Vai trò                                         |
| --- | ------------- | ----------------------------------------------- |
| 1   | 🔥 **Feed**   | Ảnh bạn bè real-time + streak counter           |
| 2   | 📸 **Camera** | Màn hình mặc định — chụp & upload chi tiêu      |
| 3   | 📊 **Profile** | Streak, biểu đồ chi tiêu theo tháng, settings  |

Stack đề xuất: **Next.js App Router · TailwindCSS · shadcn/ui · @supabase/supabase-js · Recharts · react-webcam · zustand** (state) · **@tanstack/react-query** (fetching).

---

## 1. Tech & Project setup

```bash
npx create-next-app@latest lockfin-web --typescript --tailwind --app --src-dir --import-alias "@/*"
cd lockfin-web
npm i @supabase/supabase-js @tanstack/react-query zustand recharts react-webcam lucide-react clsx
npm i -D @types/node
# PWA
npm i next-pwa
# UI (shadcn)
npx shadcn-ui@latest init
```

### `.env.local`

```
NEXT_PUBLIC_SUPABASE_URL=https://<project>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
NEXT_PUBLIC_API_BASE_URL=http://localhost:3000/api
```

### PWA manifest

- `public/manifest.json` (name, short_name "LockFin", `display: standalone`, theme color `#FF6B6B`)
- Icons 192/512, maskable
- `next-pwa` config trong `next.config.js` (offline fallback page cho Feed)

---

## 1.5 Design System (qua [ui-ux-pro-max-skill](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill))

Trước khi code UI, chạy skill này để generate design tokens cho cả app. Chi tiết prompt + output template ở [design-system-brief.md](./design-system-brief.md).

### Cấu hình map vào skill

| Trục | Lựa chọn | Lý do |
| --- | --- | --- |
| Reasoning rule | `Personal Finance Tracker` (chính) + `Habit Tracker` (streak) | Đúng domain, auto loại anti-pattern fintech (neon, crypto purple) |
| UI Style | `Soft UI Evolution` (#19) hoặc `Claymorphism` (#9) | Mobile-first, thân thiện — KHÔNG dùng Glassmorphism (khó đọc trên ảnh feed) |
| Layout pattern | `Bento Box Grid` (#21) cho Tab 3 | Donut + streak card + category list lên grid rất gọn |
| Primary color | `#FF6B6B` (đã fix trong manifest) | Skill auto suggest secondary/CTA/surface ăn với coral |
| Typography | Pair "friendly + numeric-safe" (Inter + Manrope hoặc Plus Jakarta Sans) | Cần đọc tốt số tiền VND |
| Tech stack rule | `Next.js + shadcn/ui + TailwindCSS` | Khớp Section 1 |
| Effects | Micro-interactions (#16) cho nút chụp & streak toast | Locket-style cần tactile feedback |

### Deliverables

- `src/styles/design-tokens.ts` — color/typography/shadow/radius scale
- `tailwind.config.ts` — extend từ tokens, không hardcode màu trong component
- Google Fonts import trong root `layout.tsx`
- File checklist anti-pattern (kèm theo skill output) — review trước khi merge UI PR

### Áp dụng theo tab

- **Tab 1 (Feed)**: full-bleed card + soft shadow overlay, không glass
- **Tab 2 (Camera)**: big tactile capture button (scale-on-press, haptic-like)
- **Tab 3 (Profile)**: Bento grid — streak card | donut | category list

---

## 2. Authentication

**Backend KHÔNG xử lý auth** — Supabase Auth làm hết. FE gọi trực tiếp Supabase SDK để login/signup, lấy `access_token`, rồi đính kèm vào mọi request tới backend qua header:

```
Authorization: Bearer <access_token>
```

### Flow

1. `supabase.auth.signInWithPassword({ email, password })` hoặc `signInWithOAuth({ provider: 'google' })`
2. Token lưu trong cookie (dùng `@supabase/ssr` cho App Router) → SSR đọc được
3. Tạo HTTP client wrapper tự động gắn Bearer token:

```ts
// src/lib/api.ts
import { createBrowserClient } from '@supabase/ssr';

export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const supabase = createBrowserClient(URL, ANON);
  const { data: { session } } = await supabase.auth.getSession();
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session?.access_token ?? ''}`,
      ...(init?.headers ?? {}),
    },
  });
  if (!res.ok) throw new Error((await res.json()).message ?? 'Request failed');
  return res.json();
}
```

### Trigger auto-create profile

Backend giả định khi user signup, Supabase trigger (`Auto-create Profile on New User`) đã tạo sẵn row trong `profiles`. Nếu chưa có, contact backend dev — đừng tự gọi POST từ FE.

---

## 3. API Contract

**Base URL (dev)**: `http://localhost:3000/api`
**Swagger docs**: `http://localhost:3000/docs`
**Tất cả endpoints yêu cầu Bearer token** trừ khi ghi rõ `@Public`.

### 3.1 Profiles

#### `GET /profiles/me`

Trả về profile + streak của user hiện tại.

```json
{
  "id": "f632e5e4-8ca0-4133-b5f9-1335e7c59c02",
  "username": "huyne465_5b99e",
  "display_name": "huyne465",
  "avatar_url": null,
  "current_streak": 1,
  "highest_streak": 1,
  "last_post_date": "2026-05-28"
}
```

**Dùng ở**: Tab 1 (header streak badge), Tab 3 (profile card).

---

### 3.2 Categories

#### `GET /categories`

Trả về cả categories mặc định (`user_id: null`) + categories user tự tạo.

```json
[
  {
    "id": "11e8a494-3fd3-48c7-8e42-1e834e0111ff",
    "user_id": null,
    "name": "Cà phê",
    "type": "EXPENSE",
    "icon": "☕",
    "color_hex": "#D97706"
  }
]
```

**`type` enum**: `EXPENSE | INCOME | SAVING | GOAL`

**Dùng ở**: Tab 2 (category picker khi tạo post), Tab 3 (legend biểu đồ).

#### `POST /categories`

```json
{ "name": "Bún bò", "type": "EXPENSE", "icon": "🍜", "color_hex": "#FF6B6B" }
```

#### `DELETE /categories/:id`

Chỉ xóa được category mình tạo.

---

### 3.3 Posts (cốt lõi)

#### `POST /posts`

Tạo post mới → backend **tự động trigger streak update**. FE chỉ cần POST, sau đó re-fetch `/profiles/me` để lấy streak mới.

```json
{
  "category_id": "11e8a494-3fd3-48c7-8e42-1e834e0111ff",
  "photo_url": "https://<supabase>/storage/v1/object/public/posts/abc.jpg",
  "amount": 45000,
  "note": "Cà phê sáng The Coffee House",
  "is_private": false
}
```

**Validation rules** (backend reject nếu sai):
- `category_id`: UUID, bắt buộc
- `photo_url`: string, bắt buộc (URL từ Supabase Storage)
- `amount`: số dương, tối đa 2 số thập phân
- `note`: optional, max 500 ký tự
- `is_private`: optional boolean, default `false`

Response: PostRow vừa tạo (xem shape ở `/posts/feed`).

#### `GET /posts/feed?limit=20&offset=0`

Feed công khai (chỉ `is_private: false`), sort `created_at DESC`, kèm join `profiles` + `categories`.

```json
[
  {
    "id": "65dfed21-...",
    "user_id": "f632e5e4-...",
    "category_id": "2b6fb6ff-...",
    "photo_url": "https://picsum.photos/...",
    "amount": 599000,
    "note": "Áo thun Uniqlo",
    "is_private": false,
    "created_at": "2026-05-28T15:49:35.005462+00:00",
    "profiles": {
      "id": "f632e5e4-...",
      "username": "huyne465_5b99e",
      "avatar_url": null
    },
    "categories": {
      "id": "2b6fb6ff-...",
      "name": "Mua sắm",
      "icon": "🛍️",
      "color_hex": "#FFD93D",
      "type": "EXPENSE"
    }
  }
]
```

**Pagination**: `limit` (default 20), `offset` (default 0) → dùng cho infinite scroll.

> ⚠️ **Friend filter chưa có ở backend.** Hiện feed trả về post public của TOÀN BỘ user. Khi friendships module xong, endpoint này sẽ tự động filter — FE không phải đổi gì.

#### `GET /posts/stats?month=YYYY-MM`

Aggregate chi tiêu theo category trong tháng. **Đã group + sum sẵn** — dùng thẳng cho Recharts không cần xử lý.

```json
[
  {
    "category_id": "11e8a494-...",
    "category_name": "Cà phê",
    "color_hex": "#D97706",
    "icon": "☕",
    "total": 45000
  },
  {
    "category_id": "1d8a17a2-...",
    "category_name": "Ăn uống",
    "color_hex": "#FF6B6B",
    "icon": "🍜",
    "total": 120000
  }
]
```

---

## 4. Supabase Storage (upload ảnh)

Backend **không nhận file upload**. FE upload trực tiếp Supabase Storage, lấy public URL, rồi gửi URL cho `POST /posts`.

### Setup bucket

Trong Supabase Dashboard → Storage → tạo bucket `posts` (public). Policy:

```sql
-- Cho phép user đã login upload
create policy "auth users can upload" on storage.objects
  for insert with check (bucket_id = 'posts' and auth.role() = 'authenticated');

-- Cho phép ai cũng đọc (vì public feed)
create policy "anyone can read" on storage.objects
  for select using (bucket_id = 'posts');
```

### Upload từ FE

```ts
const file: Blob = /* từ canvas capture */;
const fileName = `${userId}/${Date.now()}.jpg`;
const { data, error } = await supabase.storage
  .from('posts')
  .upload(fileName, file, { contentType: 'image/jpeg', upsert: false });

const { data: { publicUrl } } = supabase.storage
  .from('posts')
  .getPublicUrl(fileName);

// Rồi gọi POST /posts với photo_url = publicUrl
```

---

## 5. Cấu trúc 3 Tabs — UX chi tiết

### 📸 Tab 2: Camera (route `/` — màn mặc định)

1. Mount → bật webcam (dùng `react-webcam` với `facingMode: 'environment'`)
2. Nút chụp lớn ở giữa-dưới → capture sang `<canvas>` → Blob
3. Sau khi chụp → modal full-screen:
   - Preview ảnh
   - Input `amount` (numeric keypad)
   - Picker `category` (horizontal scroll, icon + name, group theo `type`)
   - Input `note` (optional, 500 ký tự)
   - Toggle `is_private` (lock icon)
   - Nút **"Up lên 🔥"**
4. Submit flow:
   - Upload Blob → Supabase Storage → lấy URL
   - `POST /posts` với URL
   - Invalidate React Query keys: `['profile', 'me']`, `['feed']`, `['stats', month]`
   - Toast "🔥 +1 ngày streak!" nếu profile.current_streak tăng
   - Redirect Tab 1

### 🔥 Tab 1: Feed (route `/feed`)

- Header sticky: avatar | username | **streak badge** (🔥 + số ngày, animated khi tăng)
- List vertical, full-bleed image card (giống Locket):
  - Photo (aspect 1:1 hoặc 4:5)
  - Footer overlay: `categories.icon + name`, `amount` (format VND), `note`
  - Mini avatar user post góc trên
- **Infinite scroll**: `useInfiniteQuery` gọi `/posts/feed` với offset
- **Realtime** (optional v2): subscribe Supabase Realtime channel `postgres_changes` trên bảng `posts` → prepend post mới

### 📊 Tab 3: Profile (route `/profile`)

- Card đầu: avatar, display_name, **current_streak / highest_streak**
- Month picker (default tháng hiện tại)
- **Donut chart** (Recharts `<PieChart>`) — data từ `/posts/stats`:
  - `dataKey="total"`, `nameKey="category_name"`, `fill={item.color_hex}`
  - Legend với icon emoji
- Tổng chi tiêu tháng (sum `total[]`)
- List categories với progress bar % so với total
- Section settings: edit categories, sign out

---

## 6. State management

- **Server state**: React Query — 1 query per endpoint, key conventions:
  - `['profile', 'me']`
  - `['categories']`
  - `['feed', { limit, offset }]`
  - `['stats', month]`
- **Client state** (zustand): camera modal open, selected category in picker, current month filter
- **Auth state**: Supabase SDK tự quản lý + listen `onAuthStateChange`

---

## 7. Routing & layout

```
src/app/
├── layout.tsx                 # Root: providers (QueryClient, Supabase, Theme)
├── (auth)/
│   ├── login/page.tsx
│   └── signup/page.tsx
├── (main)/
│   ├── layout.tsx             # Bottom tab bar
│   ├── page.tsx               # Tab 2: Camera (default)
│   ├── feed/page.tsx          # Tab 1
│   └── profile/page.tsx       # Tab 3
└── middleware.ts              # Redirect to /login nếu chưa auth
```

Bottom tab bar — fixed, safe-area-inset-bottom, 3 icons (lucide: `Flame`, `Camera`, `User`).

---

## 8. Edge cases & gotchas

| Case | Hành xử |
| ---- | ------- |
| User mở app lần đầu, chưa có post nào | `/posts/feed` trả `[]` → show empty state "Hãy chụp bức ảnh đầu tiên!" |
| Streak = 0 sau khi nghỉ vài ngày | Backend tự reset về 1 khi POST mới. FE chỉ hiển thị giá trị từ API |
| Token hết hạn (401) | Supabase SDK auto-refresh. Nếu vẫn fail → redirect `/login` |
| Upload Storage thất bại | Rollback: KHÔNG gọi `POST /posts`. Toast lỗi, giữ ảnh trong state để user retry |
| `is_private: true` | Vẫn xuất hiện trong `/posts/stats` (chi tiêu cá nhân) nhưng KHÔNG vào `/posts/feed` |
| Mất mạng | Service worker cache shell + queue POST (background sync — v2) |

---

## 9. Format helpers cần có

```ts
// VND
new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(45000)
// → "45.000 ₫"

// Relative time
// "vừa xong", "5 phút trước", ...  (dùng date-fns/locale/vi)
```

---

## 10. Definition of Done (MVP)

- [ ] Đăng ký / đăng nhập (email + Google OAuth)
- [ ] Tab Camera: chụp ảnh → chọn category → nhập số tiền → up
- [ ] Tab Feed: list ảnh paginated, streak badge ở header
- [ ] Tab Profile: streak card + donut chart theo tháng
- [ ] PWA installable trên iOS & Android
- [ ] Lighthouse mobile: Performance ≥ 85, PWA = pass
- [ ] Empty states cho cả 3 tab
- [ ] Loading skeletons cho feed & chart
- [ ] Error toast cho mọi mutation thất bại
- [ ] Design tokens generated qua ui-ux-pro-max-skill, commit `src/styles/design-tokens.ts`
- [ ] Pass pre-delivery checklist của skill: contrast ≥ 4.5:1, `cursor-pointer` trên mọi clickable, `prefers-reduced-motion` respected, responsive 375/768/1024/1440
- [ ] Không dùng emoji làm icon hệ thống (chỉ dùng cho category data) — icon UI dùng lucide-react

---

## 11. Câu hỏi cần xác nhận với Backend

1. Khi nào có **friendships** endpoints? (`GET /friends`, `POST /friends/request`, ...)
2. Realtime feed → dùng Supabase Realtime trực tiếp hay đợi WebSocket gateway?
3. Có cần endpoint `GET /posts/me` (chỉ post của mình, kể cả private) cho Tab 3 không?
4. Edit/delete post — có API chưa?

---

**Backend repo**: `d:/LockFin/LockFin-BE` — chạy `npm run start:dev` → Swagger tại `/docs`.
