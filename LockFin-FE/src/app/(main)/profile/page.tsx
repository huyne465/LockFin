'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { LogOut } from 'lucide-react';
import { useMonthStats, useProfile } from '@/lib/queries';
import { createSupabaseBrowser } from '@/lib/supabase/client';
import { currentMonth } from '@/lib/format';
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
  const router = useRouter();
  const [month, setMonth] = useState(currentMonth());
  const profile = useProfile();
  const stats = useMonthStats(month);

  async function signOut() {
    const supabase = createSupabaseBrowser();
    await supabase.auth.signOut();
    router.replace('/login');
    router.refresh();
  }

  return (
    <div className="px-4 py-4">
      <header className="mb-4 flex items-center justify-between">
        <h1 className="font-display text-xl font-bold">Hồ sơ</h1>
        <select
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          className="rounded-md border border-border bg-surface px-3 py-2 text-sm"
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

      <div className="mt-6">
        <Button variant="outline" className="w-full" onClick={signOut}>
          <LogOut className="h-4 w-4" /> Đăng xuất
        </Button>
      </div>
    </div>
  );
}
