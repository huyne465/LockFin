'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { AlertTriangle, ArrowLeft, CheckCircle2, Plus } from 'lucide-react';
import { clsx } from 'clsx';
import { useBudgets } from '@/lib/queries';
import { BudgetCard } from '@/components/budget/BudgetCard';
import { BudgetForm } from '@/components/budget/BudgetForm';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import type { BudgetPeriod, BudgetStatus } from '@/lib/types';

const SECTIONS: { period: BudgetPeriod; title: string }[] = [
  { period: 'DAY', title: 'Hôm nay' },
  { period: 'MONTH', title: 'Tháng này' },
  { period: 'YEAR', title: 'Năm nay' },
];

export default function BudgetsPage() {
  const { data, isLoading } = useBudgets();
  // null = đóng form, undefined-budget = đang tạo mới, có budget = đang sửa.
  const [editing, setEditing] = useState<BudgetStatus | null>(null);
  const [creating, setCreating] = useState(false);

  const byPeriod = useMemo(() => {
    const g: Record<BudgetPeriod, BudgetStatus[]> = { DAY: [], MONTH: [], YEAR: [] };
    (data ?? []).forEach((b) => g[b.period_type].push(b));
    return g;
  }, [data]);

  const overCount = useMemo(() => (data ?? []).filter((b) => b.is_over).length, [data]);
  const total = data?.length ?? 0;
  const isEmpty = !isLoading && total === 0;

  return (
    <div className="min-h-full bg-background">
      <header className="sticky top-0 z-30 glass flex items-center gap-2 px-3 py-3.5 safe-top">
        <Link
          href="/profile"
          aria-label="Quay lại"
          className="flex h-11 w-11 items-center justify-center rounded-full text-text-secondary transition-transform duration-fast active:scale-90"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="font-display text-lg font-bold">Ngân sách</h1>
        <button
          type="button"
          onClick={() => setCreating(true)}
          className="ml-auto flex items-center gap-1.5 rounded-full bg-primary px-3.5 py-2 text-sm font-medium text-text-inverse shadow-soft transition-transform duration-fast active:scale-95"
        >
          <Plus className="h-4 w-4" /> Đặt
        </button>
      </header>

      <div className="px-4 pb-10">
        {isLoading && (
          <div className="mt-4 space-y-3">
            <Skeleton className="h-24 w-full rounded-2xl" />
            <Skeleton className="h-24 w-full rounded-2xl" />
          </div>
        )}

        {isEmpty && (
          <EmptyState
            title="Chưa đặt ngân sách nào"
            hint="Đặt hạn mức theo ngày / tháng / năm để theo dõi mỗi lần chi tiêu được trừ thẳng."
          />
        )}

        {/* Tổng quan — bao nhiêu hạn mức, bao nhiêu đang vượt */}
        {!isLoading && !isEmpty && (
          <div className="mt-4 flex items-center gap-3 rounded-2xl bg-surface px-4 py-3.5 shadow-card">
            <span
              className={clsx(
                'flex h-10 w-10 shrink-0 items-center justify-center rounded-full',
                overCount > 0 ? 'bg-danger/12 text-danger' : 'bg-success/12 text-success',
              )}
            >
              {overCount > 0 ? <AlertTriangle className="h-5 w-5" /> : <CheckCircle2 className="h-5 w-5" />}
            </span>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-text">
                {overCount > 0 ? `${overCount} hạn mức đang vượt` : 'Mọi hạn mức trong tầm kiểm soát'}
              </p>
              <p className="numeric text-xs text-text-muted">{total} ngân sách đang theo dõi</p>
            </div>
          </div>
        )}

        {!isLoading && !isEmpty &&
          SECTIONS.map(({ period, title }) => {
            const items = byPeriod[period];
            if (items.length === 0) return null;
            return (
              <section key={period} className="mt-6">
                <div className="mb-2 flex items-center justify-between px-1">
                  <h2 className="text-sm font-semibold text-text-secondary">{title}</h2>
                  <span className="numeric text-xs text-text-muted">{items.length}</span>
                </div>
                <div className="space-y-2.5">
                  {items.map((b) => (
                    <BudgetCard key={b.id} budget={b} onEdit={setEditing} />
                  ))}
                </div>
              </section>
            );
          })}
      </div>

      {creating && <BudgetForm onClose={() => setCreating(false)} />}
      {editing && <BudgetForm budget={editing} onClose={() => setEditing(null)} />}
    </div>
  );
}
