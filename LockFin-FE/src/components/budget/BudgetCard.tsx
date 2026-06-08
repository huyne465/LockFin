'use client';

import { clsx } from 'clsx';
import { formatVND } from '@/lib/format';
import type { BudgetStatus } from '@/lib/types';

/** Visual state derived from how much of the budget is used up. */
function tone(b: BudgetStatus) {
  if (b.is_over) return 'danger';
  if (b.percent >= 0.8) return 'warning';
  return 'success';
}

const BAR = {
  success: 'bg-success',
  warning: 'bg-warning',
  danger: 'bg-danger',
} as const;

const TEXT = {
  success: 'text-success',
  warning: 'text-warning',
  danger: 'text-danger',
} as const;

export function BudgetCard({ budget, onEdit }: { budget: BudgetStatus; onEdit: (b: BudgetStatus) => void }) {
  const t = tone(budget);
  const name = budget.category?.name ?? 'Tổng chi tiêu';
  const icon = budget.category?.icon ?? '💰';
  const pct = Math.max(0, Math.min(1, budget.percent)); // clamp chỉ để vẽ thanh

  return (
    <button
      type="button"
      onClick={() => onEdit(budget)}
      className="w-full rounded-2xl bg-surface px-4 py-3.5 text-left shadow-card transition-transform duration-fast active:scale-[0.99]"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <span className="text-lg">{icon}</span>
          <span className="truncate font-medium text-text">{name}</span>
        </div>
        {budget.is_over ? (
          <span className="numeric shrink-0 rounded-full bg-danger/10 px-2 py-0.5 text-xs font-semibold text-danger">
            Vượt {formatVND(-budget.remaining)}
          </span>
        ) : (
          <span className={clsx('numeric shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold', `${TEXT[t]} bg-surface-muted`)}>
            Còn {formatVND(budget.remaining)}
          </span>
        )}
      </div>

      <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-surface-muted">
        <div className={clsx('h-full rounded-full transition-all duration-base', BAR[t])} style={{ width: `${pct * 100}%` }} />
      </div>

      <div className="mt-2 flex items-center justify-between text-xs text-text-muted">
        <span className="numeric">{formatVND(budget.spent)} / {formatVND(budget.amount)}</span>
        <span className="numeric">{Math.round(budget.percent * 100)}%</span>
      </div>
    </button>
  );
}
