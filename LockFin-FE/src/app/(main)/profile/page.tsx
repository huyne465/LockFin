'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ChevronRight, LogOut, Settings, Users, Wallet } from 'lucide-react';
import { useBudgets, useMonthStats, useProfile } from '@/lib/queries';
import { createSupabaseBrowser } from '@/lib/supabase/client';
import { currentMonth, formatVND } from '@/lib/format';
import { StreakCard } from '@/components/profile/StreakCard';
import { MonthDonut } from '@/components/profile/MonthDonut';
import { CategoryBreakdown } from '@/components/profile/CategoryBreakdown';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import { Button } from '@/components/ui/Button';

function monthOptions(): string[] {
  const out: string[] = [];
  const d = new Date();
  for (let i = 0; i < 6; i++) {
    const x = new Date(d.getFullYear(), d.getMonth() - i, 1);
    out.push(`${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}`);
  }
  return out;
}

export default function ProfilePage() {
  const [month, setMonth] = useState(currentMonth());
  const profile = useProfile();
  const stats = useMonthStats(month);
  const budgets = useBudgets();
  const monthBudget = budgets.data?.find((b) => b.period_type === 'MONTH' && b.category_id === null);

  async function signOut() {
    const supabase = createSupabaseBrowser();
    // `local` scope clears the cookies without a network revoke call, which
    // would otherwise fail (and skip clearing) when the token is already expired.
    await supabase.auth.signOut({ scope: 'local' });
    // Hard navigation forces middleware to re-run with the cleared cookies and
    // drops any stale React Query / client state from the signed-in session.
    window.location.assign('/login');
  }

  const displayName = profile.data?.display_name?.trim() || profile.data?.username || '…';
  const avatarInitial = displayName[0]?.toUpperCase() ?? '?';

  return (
    <div className="px-4 py-4">
      <header className="mb-4 flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <Link
            href="/profile/settings"
            aria-label="Cài đặt hồ sơ"
            className="h-12 w-12 shrink-0 overflow-hidden rounded-full bg-surface-muted ring-2 ring-primary/15"
          >
            {profile.data?.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={profile.data.avatar_url} alt="" className="h-full w-full object-cover" />
            ) : (
              <span className="flex h-full w-full items-center justify-center font-display text-lg font-semibold text-text-secondary">
                {avatarInitial}
              </span>
            )}
          </Link>
          <div className="min-w-0">
            <h1 className="truncate font-display text-xl font-bold leading-tight">{displayName}</h1>
            {profile.data?.username && (
              <p className="truncate text-xs text-text-muted">@{profile.data.username}</p>
            )}
          </div>
        </div>
        <select
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          className="shrink-0 rounded-md border border-border bg-surface px-3 py-2 text-sm"
        >
          {monthOptions().map((m) => <option key={m} value={m}>{m}</option>)}
        </select>
      </header>

      <div className="grid grid-cols-2 gap-3">
        <StreakCard profile={profile.data} />

        {stats.isLoading && <Skeleton className="col-span-2 h-64" />}
        {!stats.isLoading && (stats.data?.length ?? 0) === 0 && (
          <div className="col-span-2">
            <EmptyState icon="📊" title="Chưa có chi tiêu tháng này" hint="Chụp ảnh chi tiêu đầu tiên để thấy biểu đồ." />
          </div>
        )}
        {!stats.isLoading && (stats.data?.length ?? 0) > 0 && (
          <>
            <MonthDonut stats={stats.data!} />
            <CategoryBreakdown stats={stats.data!} />
          </>
        )}
      </div>

      <Link
        href="/budgets"
        className="mt-6 flex items-center gap-3 rounded-lg border border-border bg-surface px-4 py-3.5 transition-colors duration-fast hover:bg-surface-muted"
      >
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Wallet className="h-5 w-5" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block font-medium text-text">Ngân sách</span>
          {monthBudget && (
            <span className={`numeric block text-xs ${monthBudget.is_over ? 'text-danger' : 'text-text-muted'}`}>
              {monthBudget.is_over
                ? `Vượt ${formatVND(-monthBudget.remaining)} tháng này`
                : `Còn ${formatVND(monthBudget.remaining)} / ${formatVND(monthBudget.amount)} tháng này`}
            </span>
          )}
        </span>
        <ChevronRight className="h-5 w-5 text-text-muted" />
      </Link>

      <Link
        href="/friends"
        className="mt-3 flex items-center gap-3 rounded-lg border border-border bg-surface px-4 py-3.5 transition-colors duration-fast hover:bg-surface-muted"
      >
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Users className="h-5 w-5" />
        </span>
        <span className="flex-1 font-medium text-text">Bạn bè</span>
        <ChevronRight className="h-5 w-5 text-text-muted" />
      </Link>

      <Link
        href="/profile/settings"
        className="mt-3 flex items-center gap-3 rounded-lg border border-border bg-surface px-4 py-3.5 transition-colors duration-fast hover:bg-surface-muted"
      >
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Settings className="h-5 w-5" />
        </span>
        <span className="flex-1 font-medium text-text">Cài đặt</span>
        <ChevronRight className="h-5 w-5 text-text-muted" />
      </Link>

      <div className="mt-4">
        <Button variant="outline" className="w-full" onClick={signOut}>
          <LogOut className="h-4 w-4" /> Đăng xuất
        </Button>
      </div>
    </div>
  );
}
