'use client';

import { useMemo, useState } from 'react';
import { Check, ChevronLeft, ChevronRight } from 'lucide-react';
import { clsx } from 'clsx';
import { useMyPosts } from '@/lib/queries';
import { currentMonth } from '@/lib/format';
import { Skeleton } from '@/components/ui/Skeleton';

function shiftMonth(month: string, delta: number) {
  const [y, m] = month.split('-').map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

/**
 * Lưới chọn-nhiều post của chính user. Mặc định chỉ hiện post ở pool
 * (chưa thuộc album nào) — vì 1 post tối đa 1 album.
 */
export function PostPicker({
  value,
  onChange,
  poolOnly = true,
}: {
  value: string[];
  onChange: (ids: string[]) => void;
  poolOnly?: boolean;
}) {
  const [month, setMonth] = useState(currentMonth());
  const { data, isLoading } = useMyPosts(month);
  const isCurrent = month === currentMonth();

  const posts = useMemo(
    () => (data ?? []).filter((p) => (poolOnly ? p.album_id == null : true)),
    [data, poolOnly],
  );

  const toggle = (id: string) =>
    onChange(value.includes(id) ? value.filter((x) => x !== id) : [...value, id]);

  return (
    <div>
      <div className="mb-2.5 flex items-center justify-center gap-3">
        <button
          type="button"
          onClick={() => setMonth((m) => shiftMonth(m, -1))}
          aria-label="Tháng trước"
          className="flex h-8 w-8 items-center justify-center rounded-full text-text-secondary transition-transform duration-fast active:scale-90"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <span className="numeric min-w-24 text-center text-xs font-semibold text-text-secondary">{month}</span>
        <button
          type="button"
          onClick={() => !isCurrent && setMonth((m) => shiftMonth(m, 1))}
          disabled={isCurrent}
          aria-label="Tháng sau"
          className="flex h-8 w-8 items-center justify-center rounded-full text-text-secondary transition-transform duration-fast active:scale-90 disabled:opacity-30"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-4 gap-1.5">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="aspect-square rounded-xl" />
          ))}
        </div>
      ) : posts.length === 0 ? (
        <p className="py-6 text-center text-sm text-text-muted">
          {poolOnly ? 'Không có ảnh ở pool trong tháng này.' : 'Chưa có kỷ niệm tháng này.'}
        </p>
      ) : (
        <div className="grid grid-cols-4 gap-1.5">
          {posts.map((p) => {
            const picked = value.includes(p.id);
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => toggle(p.id)}
                className={clsx(
                  'relative aspect-square overflow-hidden rounded-xl ring-1 transition-transform duration-fast active:scale-90',
                  picked ? 'ring-2 ring-primary' : 'ring-black/5',
                )}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.photo_url} alt="" className="h-full w-full object-cover" />
                <span
                  className={clsx(
                    'absolute inset-0 transition-opacity duration-fast',
                    picked ? 'bg-primary/25' : 'bg-transparent',
                  )}
                />
                {picked && (
                  <span className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-text-inverse shadow">
                    <Check className="h-3 w-3" strokeWidth={3} />
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
