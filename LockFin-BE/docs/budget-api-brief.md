# Budget Feature — BE Implementation Brief

> Mục tiêu: cho user đặt **ngân sách (budget)** theo **ngày / tháng / năm** (và tuỳ chọn theo từng category). Khi user up một post chi tiêu, số tiền sẽ được **trừ thẳng vào budget tương ứng** → user thấy "còn lại bao nhiêu". Mọi endpoint cần `Authorization: Bearer <supabase_access_token>` như các module hiện tại.

Module mới: `src/features/budgets/` (theo đúng pattern `categories` / `posts`: controller + service + repository + dto + module). Đăng ký trong `app.module.ts`.

---

## 0. Quyết định kiến trúc quan trọng — "trừ thẳng" = tính động, KHÔNG lưu số dư

Có 2 cách làm "trừ tiền khỏi budget":

| | A. Lưu cột `spent` rồi `spent += amount` mỗi lần up | B. **Tính động** `spent = SUM(posts trong kỳ)` (khuyến nghị ✅) |
|---|---|---|
| Sửa / xoá post | Phải nhớ cộng/trừ ngược → dễ lệch | Tự đúng, không cần làm gì |
| Đua tranh (concurrency) | Phải lock / RPC atomic | Không vấn đề |
| Đổi category của post | Phức tạp | Tự đúng |
| Khớp với code hiện có | Khác pattern | **Giống hệt `statsByCategory` / RPC `get_monthly_stats`** |

→ **Chọn B.** Bảng `budgets` chỉ lưu **hạn mức (`amount`)**. `spent` và `remaining` được **tính khi đọc** bằng cách cộng dồn `posts` trong khoảng thời gian của budget. "Trừ thẳng vào budget" về mặt UX = mỗi lần đọc budget trả luôn `spent`/`remaining` cập nhật tức thì; FE chỉ cần invalidate query budget sau khi up post (xem FE brief).

Lợi ích phụ: response của `POST /posts` có thể trả kèm `budget_impact` để FE show ngay "Bạn còn X trong ngân sách tháng" mà không cần gọi thêm.

---

## 1. Schema (chạy trong Supabase SQL editor)

```sql
create table public.budgets (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  category_id  uuid references public.categories(id) on delete cascade, -- NULL = ngân sách tổng (mọi khoản EXPENSE)
  period_type  text not null check (period_type in ('DAY','MONTH','YEAR')),
  period_start date not null,            -- đã chuẩn hoá: DAY=ngày đó, MONTH=ngày 01, YEAR=01-01
  amount       numeric(14,2) not null check (amount > 0),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- Mỗi (user, category|tổng, loại kỳ, mốc kỳ) chỉ có 1 budget.
-- COALESCE vì Postgres coi NULL là khác nhau trong UNIQUE thường.
create unique index budgets_unique_key on public.budgets (
  user_id, coalesce(category_id, '00000000-0000-0000-0000-000000000000'::uuid), period_type, period_start
);

create index budgets_user_period on public.budgets (user_id, period_type, period_start);

alter table public.budgets enable row level security;
-- BE dùng service-role (admin client) như các bảng khác nên RLS có thể để policy tối thiểu;
-- nếu muốn an toàn cho client trực tiếp: policy "own rows" theo auth.uid() = user_id.
```

**Chuẩn hoá `period_start` (làm ở service, trước khi ghi):**
- `DAY`   → chính ngày đó (`2026-06-08`)
- `MONTH` → ngày 01 của tháng (`2026-06-01`)
- `YEAR`  → 01-01 của năm (`2026-01-01`)

**Khoảng `[period_start, period_end)` để cộng dồn post:**
- `DAY`   → `+1 day`
- `MONTH` → `+1 month`
- `YEAR`  → `+1 year`

---

## 2. RPC tính spent (khuyến nghị, có fallback)

Giống `get_monthly_stats`: ưu tiên RPC, nếu RPC chưa tồn tại thì repository tự reduce client-side.

```sql
create or replace function public.get_budget_status(p_user_id uuid, p_date date)
returns table (
  budget_id   uuid,
  category_id uuid,
  period_type text,
  period_start date,
  amount      numeric,
  spent       numeric
)
language sql stable as $$
  select
    b.id, b.category_id, b.period_type, b.period_start, b.amount,
    coalesce(sum(p.amount), 0) as spent
  from public.budgets b
  left join public.posts p
    on p.user_id = b.user_id
   and p.created_at >= b.period_start
   and p.created_at <  (b.period_start + (
        case b.period_type
          when 'DAY'   then interval '1 day'
          when 'MONTH' then interval '1 month'
          when 'YEAR'  then interval '1 year'
        end))
   -- category-scoped budget chỉ tính post cùng category;
   -- budget tổng (category_id null) chỉ tính post thuộc category EXPENSE.
   and (
        (b.category_id is not null and p.category_id = b.category_id)
     or (b.category_id is null and exists (
          select 1 from public.categories c
          where c.id = p.category_id and c.type = 'EXPENSE'))
       )
  where b.user_id = p_user_id
    -- chỉ lấy các budget "đang phủ" ngày p_date
    and b.period_start <= p_date
    and p_date < (b.period_start + (
        case b.period_type
          when 'DAY'   then interval '1 day'
          when 'MONTH' then interval '1 month'
          when 'YEAR'  then interval '1 year'
        end))
  group by b.id;
$$;
```

> `remaining = amount - spent`, `percent = spent / amount`, `is_over = spent > amount` → **tính ở service**, không nhét vào DB.

---

## 3. Data shapes

```ts
export type BudgetPeriod = 'DAY' | 'MONTH' | 'YEAR';

// Row thô trong DB
export interface BudgetRow {
  id: string;
  user_id: string;
  category_id: string | null;   // null = ngân sách tổng
  period_type: BudgetPeriod;
  period_start: string;         // 'YYYY-MM-DD'
  amount: number;
  created_at: string;
  updated_at: string;
}

// Trả về cho FE (đã kèm tiến độ)
export interface BudgetStatus extends BudgetRow {
  category: { id: string; name: string; icon: string; color_hex: string } | null; // join, null nếu budget tổng
  spent: number;
  remaining: number;     // amount - spent (có thể âm)
  percent: number;       // 0..1+ (spent/amount), làm tròn 4 chữ số
  is_over: boolean;      // spent > amount
}
```

---

## 4. Endpoints

Controller `@Controller('budgets')`, `@ApiTags('budgets')`, `@ApiBearerAuth()`, lấy user bằng `@CurrentUser()`.

### 4.1 Tạo / cập nhật budget (upsert theo unique key)
```
POST /budgets
Body: {
  "category_id": "<uuid> | null",   // bỏ trống / null = ngân sách tổng
  "period_type": "DAY" | "MONTH" | "YEAR",
  "period_start": "2026-06-08",     // FE gửi ngày bất kỳ trong kỳ; BE tự chuẩn hoá
  "amount": 5000000
}
```
- Service **chuẩn hoá** `period_start` theo `period_type` rồi **upsert** vào unique key → đặt lại budget cùng kỳ sẽ ghi đè `amount` (không tạo trùng). Dùng `.upsert(..., { onConflict: 'user_id,category_id,period_type,period_start' })` hoặc check-then-update.
- **Response `201`** → `BudgetStatus` (kèm `spent`/`remaining` tính ngay).
- **Lỗi:** `400` amount ≤ 0 hoặc period_type sai · `404` category_id không thuộc user (nếu có truyền).

### 4.2 Danh sách budget đang phủ một ngày (màn chính)
```
GET /budgets?date=2026-06-08
```
- Mặc định `date` = hôm nay nếu bỏ trống.
- **Response `200`** → `BudgetStatus[]` gồm mọi budget đang phủ ngày đó (budget DAY của ngày, MONTH của tháng, YEAR của năm — cả tổng lẫn theo category). Dùng RPC `get_budget_status` rồi join category + tính remaining/percent/is_over.

### 4.3 (tuỳ chọn) Lọc theo loại kỳ
```
GET /budgets?period_type=MONTH&date=2026-06-08
```
Trả riêng nhóm budget MONTH đang phủ `date`. Tiện cho từng widget.

### 4.4 Sửa hạn mức
```
PATCH /budgets/:id
Body: { "amount": 6000000 }
```
`200` → `BudgetStatus`. `404` không thấy / không thuộc user.

### 4.5 Xoá budget
```
DELETE /budgets/:id
```
`204`. `404` không thuộc user.

---

## 5. Tích hợp với `POST /posts` (cảnh báo vượt ngân sách)

Không cần ghi gì vào `budgets` khi up post (đã chọn cách tính động). Chỉ thêm **thông tin cảnh báo** để FE phản hồi tức thì:

- Trong `PostsService.create`, sau khi insert post, gọi `BudgetsService.statusForDate(userId, post.created_at)` (hoặc một hàm nhẹ chỉ lấy budget liên quan tới `post.category_id` + budget tổng) và trả kèm:

```ts
// Response POST /posts (mở rộng, backward-compatible)
{
  ...postRow,
  budget_impact?: Array<{
    budget_id: string;
    period_type: 'DAY'|'MONTH'|'YEAR';
    category_id: string | null;
    remaining: number;   // sau khi đã tính cả post vừa tạo
    is_over: boolean;
  }>;
}
```
- `PostsModule` cần `imports: [BudgetsModule]` và `BudgetsModule` `exports: [BudgetsService]`.
- Giữ field này **optional** để không phá FE cũ. Nếu user chưa đặt budget nào liên quan → trả `[]` hoặc bỏ field.

> Lưu ý: KHÔNG chặn việc up post khi vượt budget — chỉ cảnh báo. (Trừ khi sau này muốn chế độ "khoá chi tiêu".)

---

## 6. Việc cần chốt

1. **Budget tổng (category null) định nghĩa "chi tiêu" thế nào?** Brief đang gom mọi post thuộc category `type='EXPENSE'`. Có cần loại trừ `INCOME/SAVING/GOAL` khác đi không? (hiện đã loại.)
2. **Một category có nên cho phép cùng lúc budget DAY + MONTH + YEAR không?** Schema hiện cho phép (unique gồm cả `period_type`). Mặc định: cho phép.
3. **Carry-over** (dư tháng này cộng sang tháng sau) — chưa làm ở v1, để sau.
4. **Cảnh báo ngưỡng** (vd báo khi đạt 80%) — FE tự tính từ `percent`, BE không cần thêm gì.
5. Có cần endpoint **lịch sử budget các kỳ trước** (GET theo range) để vẽ biểu đồ không? → v2.

---

## 7. Checklist triển khai BE

- [ ] Tạo bảng `budgets` + unique index + RPC `get_budget_status` trên Supabase.
- [ ] `budgets.repository.ts`: `upsert`, `findForDate` (gọi RPC + fallback reduce như `statsByCategory`), `findOne`, `updateAmount`, `delete`, join category.
- [ ] `dto/create-budget.dto.ts` (`category_id?` UUID nullable, `period_type` enum, `period_start` regex `YYYY-MM-DD`, `amount` `@IsPositive`), `dto/update-budget.dto.ts`, `dto/budget-query.dto.ts` (`date` optional, `period_type` optional).
- [ ] `budgets.service.ts`: chuẩn hoá `period_start`, tính `remaining/percent/is_over`, validate category thuộc user.
- [ ] `budgets.controller.ts` 5 route ở mục 4.
- [ ] `budgets.module.ts` + đăng ký trong `app.module.ts`; `exports: [BudgetsService]`.
- [ ] Mở rộng `PostsService.create` trả `budget_impact` (PostsModule import BudgetsModule).
- [ ] Cập nhật Swagger (`@ApiProperty`) cho tất cả DTO.
