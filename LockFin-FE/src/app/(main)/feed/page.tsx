'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { ArrowDownLeft, ArrowUpRight, Flame, UserPlus } from 'lucide-react';
import { clsx } from 'clsx';
import { useFeed, useIncomingRequests, useProfile } from '@/lib/queries';
import { CategoryIcon } from '@/components/ui/CategoryIcon';
import { formatRelative, formatVND } from '@/lib/format';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import { PostReactions } from '@/components/post/PostReactions';

export default function FeedPage() {
  const profile = useProfile();
  const feed = useFeed();
  const incoming = useIncomingRequests();
  const pendingCount = incoming.data?.length ?? 0;
  const sentinel = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!sentinel.current) return;
    const el = sentinel.current;
    const io = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && feed.hasNextPage && !feed.isFetchingNextPage) feed.fetchNextPage();
    }, { rootMargin: '200px' });
    io.observe(el);
    return () => io.disconnect();
  }, [feed]);

  const posts = feed.data?.pages.flat() ?? [];

  return (
    <div className="min-h-full bg-background">
      <header className="sticky top-0 z-30 glass flex items-center justify-between px-4 py-3 safe-top">
        <div className="flex items-center gap-2.5">
          <span className="h-9 w-9 overflow-hidden rounded-full ring-2 ring-primary/20">
            {profile.data?.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={profile.data.avatar_url} alt="" className="h-full w-full object-cover" />
            ) : (
              <span className="flex h-full w-full items-center justify-center bg-surface-muted font-display text-sm font-semibold text-text-secondary">
                {profile.data?.display_name?.[0]?.toUpperCase() ?? '?'}
              </span>
            )}
          </span>
          <div className="leading-tight">
            <p className="text-[11px] text-text-muted">Khoảnh khắc của</p>
            <p className="font-display text-sm font-bold text-text">{profile.data?.display_name ?? '…'}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1 rounded-full bg-streak/10 px-3 py-1.5 text-streak">
            <Flame className="h-4 w-4" fill="currentColor" />
            <span className="numeric text-sm font-bold">{profile.data?.current_streak ?? 0}</span>
          </span>
          <Link
            href="/friends"
            aria-label="Bạn bè"
            className="relative flex h-11 w-11 items-center justify-center rounded-full bg-surface-muted text-text-secondary transition-transform duration-fast active:scale-90"
          >
            <UserPlus className="h-[1.15rem] w-[1.15rem]" />
            {pendingCount > 0 && (
              <span className="numeric absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-text-inverse">
                {pendingCount}
              </span>
            )}
          </Link>
        </div>
      </header>

      {feed.isLoading && (
        <div className="space-y-5 p-4">
          {[0, 1].map((i) => <Skeleton key={i} className="aspect-[4/5] w-full rounded-[1.75rem]" />)}
        </div>
      )}

      {!feed.isLoading && posts.length === 0 && (
        <EmptyState title="Chưa có post nào" hint="Chụp ảnh chi tiêu đầu tiên, hoặc kết bạn để xem feed của bạn bè!" />
      )}

      <ul className="space-y-5 p-4">
        {posts.map((p) => {
          const isIncome = p.categories.type === 'INCOME';
          const authorName = p.profiles.display_name?.trim() || p.profiles.username;
          const initial = authorName?.[0]?.toUpperCase() ?? '?';
          return (
            <li
              key={p.id}
              className="overflow-hidden rounded-[1.75rem] bg-surface shadow-card ring-1 ring-black/5"
            >
              <div className="relative aspect-[4/5] w-full bg-black">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.photo_url} alt={p.note ?? p.categories.name} className="h-full w-full object-cover" />

                {/* Tác giả */}
                <div className="glass-pill absolute left-3 top-3 flex items-center gap-1.5 rounded-full py-1 pl-1 pr-2.5 text-text-inverse">
                  <span className="flex h-6 w-6 items-center justify-center overflow-hidden rounded-full bg-white/20 text-[11px] font-semibold">
                    {p.profiles.avatar_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.profiles.avatar_url} alt="" className="h-full w-full object-cover" />
                    ) : (
                      initial
                    )}
                  </span>
                  <span className="text-xs font-medium">{authorName}</span>
                </div>

                {/* Tag Thu/Chi — màu + icon + chữ */}
                <span
                  className={clsx(
                    'absolute right-3 top-3 flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold text-white shadow',
                    isIncome ? 'bg-emerald-700' : 'bg-rose-600',
                  )}
                >
                  {isIncome ? <ArrowDownLeft className="h-3.5 w-3.5" strokeWidth={2.5} /> : <ArrowUpRight className="h-3.5 w-3.5" strokeWidth={2.5} />}
                  {isIncome ? 'Thu' : 'Chi'}
                </span>

                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent p-4 text-text-inverse">
                  <div className="flex items-end justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 text-sm">
                        <CategoryIcon icon={p.categories.icon} />
                        <span className="truncate">{p.categories.name}</span>
                      </div>
                      {p.note && <p className="mt-1 truncate text-sm opacity-90">{p.note}</p>}
                    </div>
                    <span className={clsx('numeric shrink-0 text-xl font-bold', isIncome ? 'text-emerald-300' : 'text-rose-300')}>
                      {isIncome ? '+' : '−'}{formatVND(p.amount)}
                    </span>
                  </div>
                  <p className="mt-1 text-[11px] opacity-75">{formatRelative(p.created_at)}</p>
                </div>
              </div>

              <div className="px-3 py-2.5">
                <PostReactions postId={p.id} reactions={p.reactions} />
              </div>
            </li>
          );
        })}
      </ul>

      <div ref={sentinel} className="h-10" />
      {feed.isFetchingNextPage && (
        <p className="pb-6 text-center text-sm text-text-muted">Đang tải thêm…</p>
      )}
    </div>
  );
}
