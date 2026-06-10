'use client';

import Link from 'next/link';
import { ArrowDownLeft, ArrowUpRight, Globe, ImageIcon, Lock } from 'lucide-react';
import { clsx } from 'clsx';
import { formatVND } from '@/lib/format';
import type { AlbumSummary } from '@/lib/types';

/** Mức dùng ngân sách chuyến → màu thanh (giống BudgetCard). */
function tone(spent: number, budget: number) {
  if (spent > budget) return 'danger';
  if (spent / budget >= 0.8) return 'warning';
  return 'success';
}

const BAR = { success: 'bg-success', warning: 'bg-warning', danger: 'bg-danger' } as const;

export function AlbumCard({ album }: { album: AlbumSummary }) {
  const hasBudget = album.budget_amount != null;
  const over = hasBudget && album.remaining != null && album.remaining < 0;
  const t = hasBudget ? tone(album.spent, album.budget_amount!) : 'success';
  const pct = hasBudget ? Math.max(0, Math.min(1, album.spent / album.budget_amount!)) : 0;

  return (
    <Link
      href={`/memories/albums/${album.id}`}
      className="group flex flex-col overflow-hidden rounded-2xl bg-surface shadow-card transition-transform duration-fast active:scale-[0.98]"
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-surface-muted">
        {album.cover_photo_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={album.cover_photo_url}
            alt=""
            className="h-full w-full object-cover transition-transform duration-base group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-text-muted/60">
            <ImageIcon className="h-8 w-8" />
          </div>
        )}

        <span className="glass-dark absolute left-2 top-2 flex h-7 items-center gap-1 rounded-full px-2 text-[11px] font-semibold text-text-inverse">
          {album.is_public ? <Globe className="h-3.5 w-3.5" /> : <Lock className="h-3.5 w-3.5" />}
        </span>
        <span className="glass-dark absolute bottom-2 right-2 flex h-6 items-center gap-1 rounded-full px-2 text-[11px] font-semibold text-text-inverse">
          <ImageIcon className="h-3 w-3" />
          <span className="numeric">{album.post_count}</span>
        </span>
      </div>

      <div className="flex flex-1 flex-col px-3 py-2.5">
        <h3 className="truncate font-display text-sm font-bold text-text">{album.name}</h3>
        {album.description && (
          <p className="mt-0.5 truncate text-xs text-text-muted">{album.description}</p>
        )}

        {hasBudget && (
          <div className="mt-2.5">
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-muted">
              <div className={clsx('h-full rounded-full transition-all duration-base', BAR[t])} style={{ width: `${pct * 100}%` }} />
            </div>
            <div className="mt-1.5 flex items-center justify-between text-[11px]">
              <span className="numeric text-text-muted">{formatVND(album.spent)}</span>
              {over ? (
                <span className="numeric font-semibold text-danger">Vượt {formatVND(-album.remaining!)}</span>
              ) : (
                <span className="numeric text-text-muted">/ {formatVND(album.budget_amount!)}</span>
              )}
            </div>
          </div>
        )}

        {/* Chi (chỉ khi không có ngân sách — tránh lặp với thanh trên) + Thu */}
        {!hasBudget && album.spent > 0 && (
          <div className="mt-1.5 flex items-center gap-1 text-[11px] text-text-secondary">
            <ArrowUpRight className="h-3 w-3 text-danger" strokeWidth={2.5} />
            <span className="numeric font-semibold">{formatVND(album.spent)}</span>
            <span className="text-text-muted">chi</span>
          </div>
        )}
        {album.income > 0 && (
          <div className="mt-1.5 flex items-center gap-1 text-[11px] text-text-secondary">
            <ArrowDownLeft className="h-3 w-3 text-success" strokeWidth={2.5} />
            <span className="numeric font-semibold">{formatVND(album.income)}</span>
            <span className="text-text-muted">thu</span>
          </div>
        )}
      </div>
    </Link>
  );
}
