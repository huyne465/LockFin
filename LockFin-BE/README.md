# LockFin Backend

NestJS + Supabase backend for **LockFin** — FinTech + Social mobile-first web app.

## Quick start

```bash
npm install
cp .env.example .env   # fill in Supabase creds
npm run start:dev
```

API: `http://localhost:3000/api` — Swagger: `http://localhost:3000/docs`

## Architecture (feature-based clean architecture)

```
src/
├── main.ts
├── app.module.ts
├── core/
│   └── supabase/              # Global Supabase client provider
├── common/
│   ├── guards/                # SupabaseAuthGuard (verifies JWT)
│   └── decorators/            # @CurrentUser, @Public
└── features/
    ├── profiles/              # Profile + streak gamification
    ├── categories/            # Default + user-specific categories
    └── posts/                 # Uploads, feed, stats aggregation
```

Each feature owns its own `controller / service / repository / dto`.

## Auth

`SupabaseAuthGuard` is registered globally via `APP_GUARD`. Every route requires a Supabase JWT (`Authorization: Bearer <token>`) unless decorated with `@Public()`. The authenticated user is injected via `@CurrentUser()`.

## Database tables expected (Supabase)

- `profiles(id uuid pk, username, avatar_url, current_streak int, highest_streak int, last_post_date date)`
- `categories(id uuid pk, user_id uuid null, name, icon, color, is_default bool)`
- `posts(id uuid pk, user_id uuid, category_id uuid, photo_url, amount numeric, note, is_private bool, created_at timestamptz)`

Optional Supabase RPC for atomic stats:

```sql
create or replace function get_monthly_stats(p_user_id uuid, p_month date)
returns table(category_id uuid, total numeric) language sql stable as $$
  select category_id, sum(amount)::numeric
  from posts
  where user_id = p_user_id
    and date_trunc('month', created_at) = date_trunc('month', p_month)
  group by category_id;
$$;
```

## Key endpoints

| Method | Path                       | Notes                               |
| ------ | -------------------------- | ----------------------------------- |
| GET    | `/api/profiles/me`         | Current profile + streak info       |
| GET    | `/api/categories`          | Default + user categories           |
| POST   | `/api/categories`          | Create user category                |
| DELETE | `/api/categories/:id`      | Delete user category                |
| POST   | `/api/posts`               | Create post → triggers streak       |
| GET    | `/api/posts/feed`          | Public feed (paginated)             |
| GET    | `/api/posts/stats?month=YYYY-MM` | Sum-by-category for the month |
