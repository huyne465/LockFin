'use client';

import { useMemo } from 'react';
import { clsx } from 'clsx';
import { SmoothImage } from '@/components/ui/SmoothImage';
import type { FeedPost } from '@/lib/types';

const WEEKDAYS = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];

/** Monday-first weekday index (0 = Mon … 6 = Sun). */
function mondayIndex(date: Date) {
  return (date.getDay() + 6) % 7;
}

export function MemoryCalendar({
  month,
  posts,
  onSelectDay,
}: {
  month: string; // YYYY-MM
  posts: FeedPost[];
  onSelectDay: (posts: FeedPost[]) => void;
}) {
  const [year, mon] = month.split('-').map(Number);

  const byDay = useMemo(() => {
    const map = new Map<number, FeedPost[]>();
    for (const p of posts) {
      const d = new Date(p.created_at);
      if (d.getFullYear() === year && d.getMonth() + 1 === mon) {
        const day = d.getDate();
        const list = map.get(day) ?? [];
        list.push(p);
        map.set(day, list);
      }
    }
    return map;
  }, [posts, year, mon]);

  const now = new Date();
  const todayDay =
    now.getFullYear() === year && now.getMonth() + 1 === mon ? now.getDate() : -1;

  const daysInMonth = new Date(year, mon, 0).getDate();
  const leading = mondayIndex(new Date(year, mon - 1, 1));
  const cells: (number | null)[] = [
    ...Array(leading).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  return (
    <div className="glass rounded-[1.75rem] p-4 shadow-card">
      <div className="mb-2 grid grid-cols-7 gap-2">
        {WEEKDAYS.map((w) => (
          <span key={w} className="text-center text-[10px] font-semibold uppercase tracking-wide text-text-muted">{w}</span>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-2">
        {cells.map((day, i) => {
          if (day === null) return <span key={`e${i}`} className="aspect-square" />;
          const dayPosts = byDay.get(day);
          const cover = dayPosts?.[0];
          const isToday = day === todayDay;

          if (!cover) {
            return (
              <span
                key={day}
                className={clsx(
                  'flex aspect-square items-center justify-center rounded-2xl text-xs font-medium',
                  isToday
                    ? 'bg-primary/10 font-bold text-primary ring-1 ring-inset ring-primary/40'
                    : 'bg-surface-muted/60 text-text-muted/70',
                )}
              >
                {day}
              </span>
            );
          }

          // Net thu–chi trong ngày → màu viền: thu nhiều hơn = xanh, chi nhiều hơn = đỏ.
          let chi = 0;
          let thu = 0;
          for (const p of dayPosts!) {
            if (p.categories.type === 'INCOME') thu += p.amount;
            else if (p.categories.type === 'EXPENSE') chi += p.amount;
          }

          const count = dayPosts!.length;
          const multiple = count > 1;
          // Ring tài chính: tinh tế (1px) để khung vẫn giữ chất polaroid trắng sạch.
          const ring =
            thu > chi
              ? 'ring-success/60'
              : chi > thu
                ? 'ring-danger/60'
                : isToday
                  ? 'ring-primary/60'
                  : 'ring-black/[0.06]';

          return (
            <button
              key={day}
              onClick={() => onSelectDay(dayPosts!)}
              aria-label={`Ngày ${day}, ${count} kỷ niệm`}
              className="group relative aspect-square transition-transform duration-fast ease-spring active:scale-90"
            >
              {/* Polaroid xếp chồng phía sau khi ngày có nhiều ảnh — fan ra khi hover. */}
              {multiple && (
                <>
                  <span
                    aria-hidden
                    className="absolute inset-[2px] origin-bottom rotate-[6deg] rounded-[5px] bg-white shadow-card ring-1 ring-black/[0.06] transition-transform duration-base ease-spring group-hover:rotate-[11deg]"
                  />
                  <span
                    aria-hidden
                    className="absolute inset-[2px] origin-bottom -rotate-[5deg] rounded-[5px] bg-white shadow-card ring-1 ring-black/[0.06] transition-transform duration-base ease-spring group-hover:-rotate-[9deg]"
                  />
                </>
              )}

              {/* Polaroid mặt trước: viền trắng đều 3 cạnh, dải caption dưới dày hơn. */}
              <div
                className={clsx(
                  'relative flex h-full flex-col rounded-[5px] bg-white p-[3px] pb-[6px] shadow-card ring-1',
                  'transition-transform duration-base ease-spring group-hover:-rotate-2',
                  ring,
                )}
              >
                <div className="relative flex-1 overflow-hidden rounded-[3px] bg-surface-muted">
                  <SmoothImage src={cover.photo_url} className="h-full w-full" />
                  {multiple && (
                    <span className="absolute right-0.5 top-0.5 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-black/55 px-1 text-[8px] font-bold leading-none text-white">
                      {count}
                    </span>
                  )}
                </div>
                <span className="mt-[3px] text-center text-[10px] font-semibold leading-none text-text-muted">{day}</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
