import { Flame, Trophy } from 'lucide-react';
import type { Profile } from '@/lib/types';

const WEEK = 7;

export function StreakCard({ profile }: { profile?: Profile }) {
  const current = profile?.current_streak ?? 0;
  const highest = profile?.highest_streak ?? 0;
  // Chuỗi tuần: số chấm sáng = số ngày giữ streak gần nhất (tối đa 7).
  const lit = Math.max(0, Math.min(WEEK, current));

  return (
    <div className="relative col-span-2 overflow-hidden rounded-[26px] bg-primary p-5 text-white shadow-[0_18px_40px_-16px_rgb(var(--c-primary)/0.55)]">
      {/* Chiều sâu: sáng góc trên-trái, tối góc dưới-phải (giữ đúng hue brand ở cả 2 theme). */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/15 via-transparent to-black/25" />
      {/* Quầng sáng accent mờ. */}
      <div className="pointer-events-none absolute -right-8 -top-10 h-40 w-40 rounded-full bg-[rgb(var(--accent-on-brand))] opacity-20 blur-[60px]" />

      <div className="relative flex items-center gap-4">
        <div className="flex h-[62px] w-[62px] shrink-0 items-center justify-center rounded-[20px] border border-white/20 bg-white/15">
          <Flame className="h-8 w-8 text-[rgb(var(--accent-on-brand))]" fill="currentColor" strokeWidth={1.5} />
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-white/70">Streak hiện tại</p>
          <p className="mt-0.5 flex items-baseline gap-1.5">
            <span className="numeric font-display text-[38px] font-bold leading-none">{current}</span>
            <span className="text-[15px] font-semibold text-white/80">ngày</span>
          </p>
        </div>

        <div className="flex shrink-0 flex-col items-end">
          <Trophy className="h-[18px] w-[18px] text-[rgb(var(--accent-on-brand))]" fill="currentColor" strokeWidth={1.5} />
          <span className="numeric mt-1 text-lg font-semibold leading-none">{highest}</span>
          <span className="mt-1 text-[10px] text-white/65">cao nhất</span>
        </div>
      </div>

      <div className="relative mt-[18px] flex gap-[7px]">
        {Array.from({ length: WEEK }).map((_, i) => (
          <span
            key={i}
            className={`h-2 flex-1 rounded-full ${i < lit ? 'bg-[rgb(var(--accent-on-brand))]' : 'bg-white/25'}`}
          />
        ))}
      </div>
    </div>
  );
}
