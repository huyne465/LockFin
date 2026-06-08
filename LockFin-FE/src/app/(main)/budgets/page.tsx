'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Plus } from 'lucide-react';
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

  const isEmpty = !isLoading && (data?.length ?? 0) === 0;

  return (
    <div className="min-h-dvh bg-background">
      <header className="sticky top-0 z-30 glass flex items-center gap-2 px-3 py-3.5 safe-top">
        <Link
          href="/profile"
          aria-label="Quay lại"
          className="flex h-9 w-9 items-center justify-center rounded-full text-text-secondary transition-transform duration-fast active:scale-90"
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
            icon="🎯"
            title="Chưa đặt ngân sách nào"
            hint="Đặt hạn mức theo ngày / tháng / năm để theo dõi mỗi lần chi tiêu được trừ thẳng."
          />
        )}

        {!isLoading && !isEmpty &&
          SECTIONS.map(({ period, title }) => {
            const items = byPeriod[period];
            if (items.length === 0) return null;
            return (
              <section key={period} className="mt-6">
                <h2 className="mb-2 px-1 text-sm font-semibold text-text-secondary">{title}</h2>
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
