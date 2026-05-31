import { Flame, Trophy } from 'lucide-react';
import type { Profile } from '@/lib/types';

export function StreakCard({ profile }: { profile?: Profile }) {
  return (
    <div className="col-span-2 rounded-lg bg-surface p-5 shadow-soft">
      <div className="flex items-center gap-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-streak to-primary text-text-inverse shadow-soft">
          <Flame className="h-8 w-8" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs uppercase tracking-wide text-text-muted">Streak hiện tại</p>
          <p className="numeric font-display text-3xl font-bold text-text">
            {profile?.current_streak ?? 0} <span className="text-base font-medium text-text-secondary">ngày</span>
          </p>
        </div>
        <div className="flex flex-col items-end gap-1 text-right">
          <Trophy className="h-4 w-4 text-warning" />
          <span className="numeric text-sm font-semibold">{profile?.highest_streak ?? 0}</span>
          <span className="text-[10px] uppercase tracking-wide text-text-muted">Cao nhất</span>
        </div>
      </div>
    </div>
  );
}
