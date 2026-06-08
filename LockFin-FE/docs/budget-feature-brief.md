# Budget Feature — FE Implementation Brief

> Backend cung cấp module `budgets`: user đặt **ngân sách theo ngày / tháng / năm** (và tuỳ chọn theo category). Mỗi lần up post chi tiêu, BE tính `spent`/`remaining` động → FE chỉ cần **invalidate query budget** sau khi up là số "còn lại" tự cập nhật. Xem contract chi tiết ở `LockFin-BE/docs/budget-api-brief.md`. Mọi call đi qua `api()` (đã đính token).

---

## 1. Khái niệm

- **Budget** = hạn mức cho 1 kỳ. `period_type`: `DAY` | `MONTH` | `YEAR`. `category_id = null` ⇒ **ngân sách tổng** (mọi chi tiêu EXPENSE); có `category_id` ⇒ ngân sách riêng cho category đó.
- BE trả sẵn `spent`, `remaining`, `percent` (0..1+), `is_over` — **FE không tự cộng post**, chỉ hiển thị.
- "Trừ thẳng vào budget" = sau khi `useCreatePost` thành công → invalidate `['budgets']` → các widget budget tự fetch lại `remaining` mới.

---

## 2. Types (thêm vào `src/lib/types.ts`)

```ts
export type BudgetPeriod = 'DAY' | 'MONTH' | 'YEAR';

export interface BudgetStatus {
  id: string;
  user_id: string;
  category_id: string | null;
  period_type: BudgetPeriod;
  period_start: string;     // 'YYYY-MM-DD'
  amount: number;
  category: { id: string; name: string; icon: string; color_hex: string } | null; // null = tổng
  spent: number;
  remaining: number;        // có thể âm khi vượt
  percent: number;          // spent/amount (0..1+)
  is_over: boolean;
  created_at: string;
  updated_at: string;
}
```

Mở rộng `FeedPost` (response của POST /posts) — optional, backward-compatible:
```ts
export interface BudgetImpact {
  budget_id: string;
  period_type: BudgetPeriod;
  category_id: string | null;
  remaining: number;
  is_over: boolean;
}
// FeedPost thêm: budget_impact?: BudgetImpact[];
```

---

## 3. Query hooks (thêm vào `src/lib/queries.ts`)

```ts
// query keys
budgets: (date: string) => ['budgets', date] as const,

const todayIso = () => new Date().toISOString().slice(0, 10);

export const useBudgets = (date = todayIso()) =>
  useQuery({
    queryKey: qk.budgets(date),
    queryFn: () => api<BudgetStatus[]>(`/budgets?date=${date}`),
  });

export interface UpsertBudgetInput {
  category_id?: string | null;
  period_type: BudgetPeriod;
  period_start: string;   // ngày bất kỳ trong kỳ, BE tự chuẩn hoá
  amount: number;
}
export function useUpsertBudget() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: UpsertBudgetInput) =>
      api<BudgetStatus>('/budgets', { method: 'POST', body: JSON.stringify(body) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['budgets'] }),
  });
}

export function useUpdateBudget() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, amount }: { id: string; amount: number }) =>
      api<BudgetStatus>(`/budgets/${id}`, { method: 'PATCH', body: JSON.stringify({ amount }) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['budgets'] }),
  });
}

export function useDeleteBudget() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api<void>(`/budgets/${id}`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['budgets'] }),
  });
}
```

**⚠️ Đổi 1 dòng trong `useCreatePost`** — thêm invalidate budgets để "trừ thẳng" hiện ngay:
```ts
onSuccess: () => {
  qc.invalidateQueries({ queryKey: qk.profile });
  qc.invalidateQueries({ queryKey: qk.feed });
  qc.invalidateQueries({ queryKey: ['posts', 'mine'] });
  qc.invalidateQueries({ queryKey: ['stats'] });
  qc.invalidateQueries({ queryKey: ['budgets'] });   // 👈 thêm
},
```

---

## 4. Màn hình & component

### 4.1 Quản lý ngân sách — `src/app/(main)/budgets/page.tsx`
- Thêm tab/route mới (cập nhật `BottomNav.tsx` nếu muốn vào menu chính, hoặc đặt link trong Profile).
- 3 section theo `period_type`: **Hôm nay (DAY) · Tháng này (MONTH) · Năm nay (YEAR)**. Lọc `useBudgets()` theo `period_type`.
- Mỗi budget render `<BudgetCard>` (mục 4.2). Nút **+ Đặt ngân sách** mở `<BudgetForm>` (mục 4.3).
- Dùng `EmptyState` khi chưa có budget nào của nhóm.

### 4.2 `src/components/budget/BudgetCard.tsx`
Hiển thị tiến độ một budget:
- Tên: `category?.name ?? 'Tổng chi tiêu'` + icon (`category?.icon ?? '💰'`).
- Thanh progress = `percent` (clamp 0..1 để vẽ, nhưng vẫn show số thật).
- Dòng số: `spent` / `amount` (dùng `formatCurrency` ở `src/lib/format.ts`), badge **"Còn {remaining}"**.
- Trạng thái màu: `percent < 0.8` xanh · `0.8..1` vàng · `is_over` đỏ + label "Vượt {-remaining}".
- Tap → mở `<BudgetForm>` ở chế độ sửa (PATCH amount) / có nút xoá.

### 4.3 `src/components/budget/BudgetForm.tsx`
Form tạo/sửa (bottom sheet, theo phong cách `UploadModal`):
- Chọn `period_type` (3 chip Ngày/Tháng/Năm).
- Chọn category (reuse list từ `useCategories()`, group EXPENSE) **hoặc** "Tổng" (category_id = null).
- Nhập `amount` (Input numeric, lọc `replace(/[^\d]/g, '')` như UploadModal).
- `period_start` mặc định = hôm nay (BE tự chuẩn hoá về đầu kỳ) — không cần date picker phức tạp ở v1.
- Submit → `useUpsertBudget()`; sửa amount → `useUpdateBudget()`. Toast tiếng Việt.

### 4.4 Widget tóm tắt ở trang chính / profile (tuỳ chọn nhưng nên có)
- Ở `src/app/(main)/page.tsx` hoặc `profile/page.tsx`: 1 dòng gọn "Ngân sách tháng: còn {remaining} / {amount}" lấy từ `useBudgets()` filter `period_type==='MONTH' && category_id===null`.
- Đây là điểm user thấy "tiền bị trừ" rõ nhất sau mỗi lần up.

### 4.5 Cảnh báo ngay khi up — trong `UploadModal.tsx`
Sau `createPost.mutateAsync(...)`, đọc `budget_impact` từ response:
```ts
const post = await createPost.mutateAsync({ ... });
const over = post.budget_impact?.find((b) => b.is_over);
if (over) {
  push(`⚠️ Vượt ngân sách ${LABEL[over.period_type]} rồi! Còn ${formatCurrency(over.remaining)}`, 'error');
} else {
  const month = post.budget_impact?.find((b) => b.period_type === 'MONTH');
  if (month) push(`Đã up 🔥 — còn ${formatCurrency(month.remaining)} trong ngân sách tháng`, 'success');
  else push('Đã up lên 🔥', 'success');
}
```
(Không chặn up — chỉ thông báo.)

---

## 5. UX / lưu ý

- `remaining` có thể **âm** → format "Vượt X" thay vì hiện số âm trần trụi.
- `useBudgets()` mặc định date = hôm nay; nếu màn Memories đang xem tháng khác, có thể truyền date tương ứng để xem tiến độ kỳ đó.
- Map lỗi `400/404` thành toast thân thiện (vd amount ≤ 0 → "Nhập hạn mức hợp lệ nhé").
- Đặt lại budget cùng kỳ = **ghi đè** (BE upsert), không tạo trùng → form không cần phân biệt create/update theo kỳ, cứ POST.

---

## 6. Việc cần chốt với Backend

1. `POST /posts` đã trả `budget_impact` chưa? (mục 4.5 phụ thuộc field này — nếu chưa, FE fallback gọi `useBudgets()` invalidate là đủ, chỉ mất phần toast realtime.)
2. Ngân sách tổng gom đúng các category EXPENSE chứ? (để label "Tổng chi tiêu" cho khớp.)
3. Có cần xem ngân sách **kỳ quá khứ** (đổi `date`) trong v1 không, hay chỉ kỳ hiện tại? → mặc định chỉ hiện tại.

---

## 7. Checklist FE

- [ ] Thêm types `BudgetStatus`, `BudgetPeriod`, `BudgetImpact` + field `budget_impact?` trên `FeedPost`.
- [ ] Thêm hooks `useBudgets`/`useUpsertBudget`/`useUpdateBudget`/`useDeleteBudget` + query key `budgets`.
- [ ] Thêm invalidate `['budgets']` vào `useCreatePost`.
- [ ] `components/budget/BudgetCard.tsx`, `BudgetForm.tsx`.
- [ ] `app/(main)/budgets/page.tsx` + link trong `BottomNav`/Profile.
- [ ] Widget "ngân sách tháng" ở trang chính/profile.
- [ ] Cảnh báo `budget_impact` trong `UploadModal.tsx`.
