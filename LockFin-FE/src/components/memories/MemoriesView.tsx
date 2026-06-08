'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, Flame, Heart, Plus } from 'lucide-react';
import { useAlbums, useMyPosts, useProfile } from '@/lib/queries';
import { currentMonth } from '@/lib/format';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import type { FeedPost } from '@/lib/types';
import { AlbumCard } from '@/components/album/AlbumCard';
import { AlbumForm } from '@/components/album/AlbumForm';
import { MemoryCalendar } from './MemoryCalendar';
import { MemoryLightbox } from './MemoryLightbox';

function shiftMonth(month: string, delta: number) {
  const [y, m] = month.split('-').map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export function MemoriesView() {
  const [month, setMonth] = useState(currentMonth());
  const [dayPosts, setDayPosts] = useState<FeedPost[] | null>(null);
  const [creatingAlbum, setCreatingAlbum] = useState(false);

  const profile = useProfile();
  const posts = useMyPosts(month);
  const albums = useAlbums();
  const albumList = albums.data ?? [];
  const list = posts.data ?? [];
  const isCurrent = month === currentMonth();

  return (
    <div className="min-h-dvh bg-background">
      {/* Header */}
      <header className="sticky top-0 z-30 glass flex items-center justify-between px-5 py-3.5 safe-top">
        <span className="w-10" />
        <h1 className="font-display text-lg font-bold">Kỷ niệm</h1>
        <Link
          href="/profile"
          aria-label="Hồ sơ"
          className="h-10 w-10 overflow-hidden rounded-full ring-2 ring-primary/20"
        >
          {profile.data?.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={profile.data.avatar_url} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-surface-muted font-display text-sm font-semibold text-text-secondary">
              {profile.data?.display_name?.[0]?.toUpperCase() ?? '?'}
            </div>
          )}
        </Link>
      </header>

      <div className="px-4 pt-4">
        {/* Recent strip */}
        {list.length > 0 && (
          <div className="mb-4 flex gap-2.5 overflow-x-auto pb-1">
            {list.slice(0, 12).map((p) => (
              <button
                key={p.id}
                onClick={() => setDayPosts([p])}
                className="h-16 w-16 shrink-0 overflow-hidden rounded-2xl ring-1 ring-black/5 shadow-card transition-transform duration-fast active:scale-90"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.photo_url} alt="" className="h-full w-full object-cover" />
              </button>
            ))}
          </div>
        )}

        {/* Albums */}
        <section className="mb-5">
          <div className="mb-2.5 flex items-center justify-between px-1">
            <h2 className="font-display text-base font-bold text-text">Album 🧳</h2>
            <button
              type="button"
              onClick={() => setCreatingAlbum(true)}
              className="flex items-center gap-1 rounded-full bg-primary px-3 py-1.5 text-xs font-semibold text-text-inverse shadow-soft transition-transform duration-fast active:scale-95"
            >
              <Plus className="h-3.5 w-3.5" /> Tạo album
            </button>
          </div>

          {albums.isLoading ? (
            <div className="grid grid-cols-2 gap-3">
              <Skeleton className="h-44 w-full rounded-2xl" />
              <Skeleton className="h-44 w-full rounded-2xl" />
            </div>
          ) : albumList.length === 0 ? (
            <button
              type="button"
              onClick={() => setCreatingAlbum(true)}
              className="flex w-full flex-col items-center gap-1 rounded-2xl border border-dashed border-border bg-surface-muted/40 px-6 py-7 text-center transition-colors duration-fast hover:border-primary/40"
            >
              <span className="text-3xl">🧳</span>
              <span className="text-sm font-semibold text-text">Tạo album cho chuyến đi đầu tiên</span>
              <span className="text-xs text-text-muted">Gom chi tiêu một chuyến vào chung một nơi.</span>
            </button>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {albumList.map((a) => (
                <AlbumCard key={a.id} album={a} />
              ))}
            </div>
          )}
        </section>

        {/* Month switcher */}
        <div className="mb-4 flex items-center justify-center gap-4">
          <button
            onClick={() => setMonth((m) => shiftMonth(m, -1))}
            aria-label="Tháng trước"
            className="glass flex h-9 w-9 items-center justify-center rounded-full text-text-secondary transition-transform duration-fast active:scale-90"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <span className="numeric min-w-28 text-center text-sm font-semibold text-text-secondary">{month}</span>
          <button
            onClick={() => !isCurrent && setMonth((m) => shiftMonth(m, 1))}
            disabled={isCurrent}
            aria-label="Tháng sau"
            className="glass flex h-9 w-9 items-center justify-center rounded-full text-text-secondary transition-transform duration-fast active:scale-90 disabled:opacity-30"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>

        {/* Calendar */}
        {posts.isLoading && <Skeleton className="h-96 w-full rounded-[1.75rem]" />}

        {!posts.isLoading && list.length === 0 && (
          <EmptyState icon="🗓️" title="Chưa có kỷ niệm tháng này" hint="Chụp ảnh chi tiêu để lấp đầy tấm lịch của bạn." />
        )}

        {!posts.isLoading && list.length > 0 && (
          <MemoryCalendar month={month} posts={list} onSelectDay={setDayPosts} />
        )}

        {/* Summary footer */}
        <div className="glass mx-auto mt-5 flex max-w-xs items-center justify-center gap-5 rounded-full px-5 py-3 shadow-card">
          <span className="flex items-center gap-1.5 text-sm font-semibold text-text">
            <Heart className="h-4 w-4 text-primary" fill="currentColor" />
            <span className="numeric">{list.length}</span>
            <span className="text-text-muted">kỷ niệm</span>
          </span>
          <span className="h-4 w-px bg-border" />
          <span className="flex items-center gap-1.5 text-sm font-semibold text-streak">
            <Flame className="h-4 w-4" />
            <span className="numeric">{profile.data?.current_streak ?? 0}</span>
            <span className="text-text-muted">streak</span>
          </span>
        </div>
      </div>

      {dayPosts && <MemoryLightbox posts={dayPosts} onClose={() => setDayPosts(null)} />}
      {creatingAlbum && <AlbumForm onClose={() => setCreatingAlbum(false)} />}
    </div>
  );
}
