'use client';

import { clsx } from 'clsx';
import { formatVND } from '@/lib/format';
import { CategoryIcon } from '@/components/ui/CategoryIcon';
import type { BudgetStatus } from '@/lib/types';

/** Visual state derived from how much of the budget is used up. */
function tone(b: BudgetStatus) {
  if (b.is_over) return 'danger';
  if (b.percent >= 0.8) return 'warning';
  return 'success';
}

// Thanh tiến độ dày, bo tròn — đổ gradient nhạt dần để thấy rõ trạng thái.
const BAR = {
  success: 'bg-gradient-to-r from-success to-success/70',
  warning: 'bg-gradient-to-r from-warning to-warning/70',
  danger: 'bg-gradient-to-r from-danger to-danger/70',
} as const;

// Pill "còn lại / vượt" — nền tint theo tông trạng thái.
const PILL = {
  success: 'bg-success/12 text-success',
  warning: 'bg-warning/14 text-warning',
  danger: 'bg-danger/16 text-danger',
} as const;

const PCT = {
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
      className="w-full rounded-[22px] border border-border bg-surface px-4 py-4 text-left transition-transform duration-fast active:scale-[0.99]"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <CategoryIcon icon={icon} className="text-lg" />
          <span className="truncate font-semibold text-text">{name}</span>
        </div>
        <span className={clsx('numeric shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold', PILL[t])}>
          {budget.is_over ? `Vượt ${formatVND(-budget.remaining)}` : `Còn ${formatVND(budget.remaining)}`}
        </span>
      </div>

      <div className="mt-3.5 h-2.5 w-full overflow-hidden rounded-full bg-surface-muted">
        <div className={clsx('h-full rounded-full transition-all duration-base', BAR[t])} style={{ width: `${pct * 100}%` }} />
      </div>

      <div className="mt-2.5 flex items-center justify-between text-xs">
        <span className="numeric text-text-muted">{formatVND(budget.spent)} / {formatVND(budget.amount)}</span>
        <span className={clsx('numeric font-semibold', PCT[t])}>{Math.round(budget.percent * 100)}%</span>
      </div>
    </button>
  );
}
