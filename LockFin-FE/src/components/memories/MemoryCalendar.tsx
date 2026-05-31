'use client';

import { useMemo } from 'react';
import { clsx } from 'clsx';
import type { FeedPost } from '@/lib/types';

const WEEKDAYS = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
const MONTH_LABEL = [
  'Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6',
  'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12',
];

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

  const daysInMonth = new Date(year, mon, 0).getDate();
  const leading = mondayIndex(new Date(year, mon - 1, 1));
  const cells: (number | null)[] = [
    ...Array(leading).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  return (
    <div className="glass rounded-[1.75rem] p-4 shadow-card">
      <div className="mb-3 flex items-baseline justify-between px-1">
        <h2 className="font-display text-lg font-bold text-text">{MONTH_LABEL[mon - 1]} {year}</h2>
        <span className="text-xs font-medium text-text-muted">{posts.length} kỷ niệm</span>
      </div>

      <div className="mb-1.5 grid grid-cols-7 gap-1.5">
        {WEEKDAYS.map((w) => (
          <span key={w} className="text-center text-[10px] font-semibold uppercase tracking-wide text-text-muted">{w}</span>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1.5">
        {cells.map((day, i) => {
          if (day === null) return <span key={`e${i}`} className="aspect-square" />;
          const dayPosts = byDay.get(day);
          const cover = dayPosts?.[0];

          if (!cover) {
            return (
              <span
                key={day}
                className="flex aspect-square items-center justify-center rounded-xl bg-surface-muted/70 text-xs font-medium text-text-muted/70"
              >
                {day}
              </span>
            );
          }

          return (
            <button
              key={day}
              onClick={() => onSelectDay(dayPosts!)}
              className={clsx(
                'group relative aspect-square overflow-hidden rounded-xl ring-1 ring-black/5 shadow-card',
                'transition-transform duration-fast ease-spring active:scale-90',
              )}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={cover.photo_url} alt="" className="h-full w-full object-cover transition-transform duration-base group-hover:scale-105" />
              <span className="absolute left-1 top-1 rounded-md bg-black/45 px-1 text-[9px] font-semibold leading-tight text-white backdrop-blur">{day}</span>
              {dayPosts!.length > 1 && (
                <span className="absolute bottom-1 right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-cta px-1 text-[9px] font-bold text-white shadow">
                  {dayPosts!.length}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
