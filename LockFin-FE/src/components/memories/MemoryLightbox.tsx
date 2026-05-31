'use client';

import { X } from 'lucide-react';
import { formatRelative, formatVND } from '@/lib/format';
import type { FeedPost } from '@/lib/types';

export function MemoryLightbox({ posts, onClose }: { posts: FeedPost[]; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black/85 backdrop-blur-md safe-top safe-bottom animate-fade-up">
      <header className="flex items-center justify-end px-5 py-4">
        <button
          onClick={onClose}
          aria-label="Đóng"
          className="glass-dark flex h-10 w-10 items-center justify-center rounded-full text-text-inverse transition-transform duration-fast active:scale-90"
        >
          <X className="h-5 w-5" />
        </button>
      </header>

      <div className="flex-1 overflow-y-auto px-5 pb-10">
        <div className="mx-auto flex max-w-sm flex-col gap-5">
          {posts.map((p) => (
            <figure key={p.id} className="overflow-hidden rounded-[2rem] bg-black shadow-lift ring-1 ring-white/10">
              <div className="relative aspect-square w-full">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.photo_url} alt={p.note ?? ''} className="h-full w-full object-cover" />
                <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 to-transparent p-4 text-text-inverse">
                  <div className="flex items-end justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 text-sm">
                        <span>{p.categories.icon}</span>
                        <span className="truncate">{p.categories.name}</span>
                      </div>
                      {p.note && <p className="mt-1 truncate text-sm opacity-90">{p.note}</p>}
                    </div>
                    <span className="numeric shrink-0 text-lg font-bold">{formatVND(p.amount)}</span>
                  </div>
                  <p className="mt-1 text-[11px] opacity-75">{formatRelative(p.created_at)}</p>
                </figcaption>
              </div>
            </figure>
          ))}
        </div>
      </div>
    </div>
  );
}
