'use client';

import { useMemo, useState } from 'react';
import { Trash2, X } from 'lucide-react';
import { clsx } from 'clsx';
import {
  useCategories,
  useDeleteBudget,
  useUpdateBudget,
  useUpsertBudget,
} from '@/lib/queries';
import { Button } from '@/components/ui/Button';
import { CategoryIcon } from '@/components/ui/CategoryIcon';
import { Input } from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';
import type { BudgetPeriod, BudgetStatus } from '@/lib/types';

const PERIODS: { value: BudgetPeriod; label: string }[] = [
  { value: 'DAY', label: 'Ngày' },
  { value: 'MONTH', label: 'Tháng' },
  { value: 'YEAR', label: 'Năm' },
];

const todayIso = () => new Date().toISOString().slice(0, 10);

/** Map BE validation errors to friendly Vietnamese toasts. */
function friendlyError(e: unknown): string {
  const msg = e instanceof Error ? e.message : '';
  if (/amount/i.test(msg) || /positive/i.test(msg)) return 'Nhập hạn mức hợp lệ nhé.';
  if (/not found|404/i.test(msg)) return 'Không tìm thấy ngân sách này.';
  return msg || 'Có lỗi xảy ra, thử lại nhé.';
}

export function BudgetForm({ budget, onClose }: { budget?: BudgetStatus; onClose: () => void }) {
  const isEdit = !!budget;
  const push = useToast((s) => s.push);
  const { data: categories } = useCategories();
  const upsert = useUpsertBudget();
  const update = useUpdateBudget();
  const remove = useDeleteBudget();

  const [period, setPeriod] = useState<BudgetPeriod>(budget?.period_type ?? 'MONTH');
  const [categoryId, setCategoryId] = useState<string | null>(budget?.category_id ?? null);
  const [amount, setAmount] = useState(budget ? String(budget.amount) : '');

  const expenseCats = useMemo(
    () => (categories ?? []).filter((c) => c.type === 'EXPENSE'),
    [categories],
  );

  const saving = upsert.isPending || update.isPending || remove.isPending;

  async function onSubmit() {
    const amt = Number(amount.replace(/[^\d]/g, ''));
    if (!amt || amt <= 0) return push('Nhập hạn mức hợp lệ nhé.', 'error');

    try {
      if (isEdit) {
        await update.mutateAsync({ id: budget!.id, amount: amt });
        push('Đã cập nhật hạn mức', 'success');
      } else {
        await upsert.mutateAsync({
          category_id: categoryId,
          period_type: period,
          period_start: todayIso(),
          amount: amt,
        });
        push('Đã đặt ngân sách', 'success');
      }
      onClose();
    } catch (e) {
      push(friendlyError(e), 'error');
    }
  }

  async function onDelete() {
    if (!budget) return;
    try {
      await remove.mutateAsync(budget.id);
      push('Đã xoá ngân sách', 'info');
      onClose();
    } catch (e) {
      push(friendlyError(e), 'error');
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/40" onClick={onClose}>
      <div
        className="rounded-t-3xl bg-surface px-4 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-3 shadow-lift"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto mb-2 h-1.5 w-10 rounded-full bg-border" />
        <header className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-lg font-bold">{isEdit ? 'Sửa ngân sách' : 'Đặt ngân sách'}</h2>
          <button onClick={onClose} aria-label="Đóng" className="rounded-md p-1 text-text-secondary hover:bg-surface-muted">
            <X className="h-5 w-5" />
          </button>
        </header>

        {/* Kỳ — chỉ chọn khi tạo mới */}
        {!isEdit && (
          <>
            <p className="mb-2 text-sm font-medium text-text-secondary">Kỳ ngân sách</p>
            <div className="flex gap-2">
              {PERIODS.map((p) => (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => setPeriod(p.value)}
                  className={clsx(
                    'flex-1 rounded-full border px-3 py-2 text-sm font-medium transition-all duration-fast',
                    period === p.value
                      ? 'border-primary bg-primary text-text-inverse shadow-soft'
                      : 'border-border bg-surface text-text hover:border-primary/40',
                  )}
                >
                  {p.label}
                </button>
              ))}
            </div>

            <p className="mb-2 mt-5 text-sm font-medium text-text-secondary">Áp dụng cho</p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setCategoryId(null)}
                className={clsx(
                  'flex items-center gap-2 rounded-full border px-3 py-2 text-sm font-medium transition-all duration-fast',
                  categoryId === null
                    ? 'border-primary bg-primary text-text-inverse shadow-soft'
                    : 'border-border bg-surface text-text hover:border-primary/40',
                )}
              >
                <span>💰</span> Tổng chi tiêu
              </button>
              {expenseCats.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setCategoryId(c.id)}
                  className={clsx(
                    'flex items-center gap-2 rounded-full border px-3 py-2 text-sm font-medium transition-all duration-fast',
                    categoryId === c.id
                      ? 'border-primary bg-primary text-text-inverse shadow-soft'
                      : 'border-border bg-surface text-text hover:border-primary/40',
                  )}
                >
                  <CategoryIcon icon={c.icon} /> {c.name}
                </button>
              ))}
            </div>
          </>
        )}

        {isEdit && (
          <p className="mb-3 text-sm text-text-secondary">
            {budget!.category?.name ?? 'Tổng chi tiêu'} ·{' '}
            {PERIODS.find((p) => p.value === budget!.period_type)?.label}
          </p>
        )}

        <label className="mb-1 mt-5 block text-sm font-medium text-text-secondary">Hạn mức (VND)</label>
        <Input
          inputMode="numeric"
          placeholder="0"
          value={amount}
          onChange={(e) => setAmount(e.target.value.replace(/[^\d]/g, ''))}
          className="numeric text-xl font-semibold"
        />

        <div className="mt-6 flex gap-2">
          {isEdit && (
            <Button variant="outline" className="!px-3 text-danger" onClick={onDelete} disabled={saving} aria-label="Xoá">
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
          <Button className="flex-1" loading={saving} onClick={onSubmit}>
            {isEdit ? 'Lưu' : 'Đặt ngân sách'}
          </Button>
        </div>
      </div>
    </div>
  );
}
