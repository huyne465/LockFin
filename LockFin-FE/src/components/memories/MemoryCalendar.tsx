'use client';

import { useMemo } from 'react';
import { clsx } from 'clsx';
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

          return (
            <button
              key={day}
              onClick={() => onSelectDay(dayPosts!)}
              className={clsx(
                'group aspect-square rounded-2xl bg-white p-[3px] shadow-card',
                'transition-transform duration-fast ease-spring active:scale-90',
                thu > chi
                  ? 'ring-2 ring-success'
                  : chi > thu
                    ? 'ring-2 ring-danger'
                    : isToday
                      ? 'ring-2 ring-primary'
                      : 'ring-1 ring-border',
              )}
            >
              <div className="relative h-full w-full overflow-hidden rounded-[0.85rem]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={cover.photo_url} alt="" className="h-full w-full object-cover transition-transform duration-base group-hover:scale-105" />
                <span className="absolute left-1 top-1 rounded-md bg-black/45 px-1 text-[9px] font-semibold leading-tight text-white backdrop-blur">{day}</span>
                {dayPosts!.length > 1 && (
                  <span className="absolute bottom-1 right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-cta px-1 text-[9px] font-bold text-white shadow">
                    {dayPosts!.length}
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
