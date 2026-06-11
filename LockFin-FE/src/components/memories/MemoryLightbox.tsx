'use client';

import { ArrowDownLeft, ArrowUpRight, X } from 'lucide-react';
import { clsx } from 'clsx';
import { formatRelative, formatVND } from '@/lib/format';
import { CategoryIcon } from '@/components/ui/CategoryIcon';
import type { FeedPost } from '@/lib/types';
import { PostReactions } from '@/components/post/PostReactions';

export function MemoryLightbox({
  posts,
  onClose,
  hideAmounts = false,
}: {
  posts: FeedPost[];
  onClose: () => void;
  /** When viewing someone else's public album, hide the money figures. */
  hideAmounts?: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black/85 backdrop-blur-md safe-top safe-bottom animate-fade-up">
      <header className="flex items-center justify-between px-5 py-4">
        <span className="numeric text-sm font-medium text-white/70">
          {posts.length} kỷ niệm
        </span>
        <button
          onClick={onClose}
          aria-label="Đóng"
          className="glass-dark flex h-11 w-11 items-center justify-center rounded-full text-text-inverse transition-transform duration-fast active:scale-90"
        >
          <X className="h-5 w-5" />
        </button>
      </header>

      <div className="flex-1 overflow-y-auto px-5 pb-10">
        <div className="mx-auto flex max-w-sm flex-col gap-5">
          {posts.map((p) => {
            const isIncome = p.categories.type === 'INCOME';
            return (
              <div key={p.id} className="flex flex-col gap-3">
              <figure className="overflow-hidden rounded-[2rem] bg-black shadow-lift ring-1 ring-white/10">
                <div className="relative aspect-square w-full">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={p.photo_url} alt={p.note ?? p.categories.name} className="h-full w-full object-cover" />

                  {/* Tag Thu/Chi — màu + icon + chữ (không chỉ dựa vào màu) */}
                  <span
                    className={clsx(
                      'absolute left-3 top-3 flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold text-white shadow',
                      isIncome ? 'bg-emerald-700' : 'bg-rose-600',
                    )}
                  >
                    {isIncome ? <ArrowDownLeft className="h-3.5 w-3.5" strokeWidth={2.5} /> : <ArrowUpRight className="h-3.5 w-3.5" strokeWidth={2.5} />}
                    {isIncome ? 'Thu' : 'Chi'}
                  </span>

                  <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-4 text-text-inverse">
                    <div className="flex items-end justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 text-sm">
                          <CategoryIcon icon={p.categories.icon} />
                          <span className="truncate">{p.categories.name}</span>
                        </div>
                        {p.note && <p className="mt-1 truncate text-sm opacity-90">{p.note}</p>}
                      </div>
                      {!hideAmounts && (
                        <span className={clsx('numeric shrink-0 text-lg font-bold', isIncome ? 'text-emerald-300' : 'text-rose-300')}>
                          {isIncome ? '+' : '−'}{formatVND(p.amount)}
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-[11px] opacity-75">{formatRelative(p.created_at)}</p>
                  </figcaption>
                </div>
              </figure>

              <PostReactions postId={p.id} reactions={p.reactions} tone="dark" />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
