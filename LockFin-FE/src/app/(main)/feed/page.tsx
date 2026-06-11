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
          <Link
            href="/profile"
            aria-label="Hồ sơ"
            className="h-11 w-11 overflow-hidden rounded-full ring-2 ring-primary/20"
          >
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
          </Link>
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
        <div className="space-y-6 p-4">
          {[0, 1].map((i) => (
            <div key={i} className="polaroid p-2.5 pb-3.5">
              <Skeleton className="aspect-[4/5] w-full rounded-[0.6rem]" />
              <div className="space-y-2 px-1.5 pt-3">
                <Skeleton className="h-4 w-1/2 rounded-full" />
                <Skeleton className="h-3 w-1/3 rounded-full" />
              </div>
            </div>
          ))}
        </div>
      )}

      {!feed.isLoading && posts.length === 0 && (
        <EmptyState title="Chưa có post nào" hint="Chụp ảnh chi tiêu đầu tiên, hoặc kết bạn để xem feed của bạn bè!" />
      )}

      <ul className="feed-wheel space-y-6 px-4 py-4">
        {posts.map((p) => {
          const isIncome = p.categories.type === 'INCOME';
          const authorName = p.profiles.display_name?.trim() || p.profiles.username;
          const initial = authorName?.[0]?.toUpperCase() ?? '?';
          return (
            <li key={p.id} className="feed-card-spin polaroid p-2.5 pb-3.5">
              <div className="relative aspect-[4/5] w-full overflow-hidden rounded-[0.6rem] bg-black">
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
                    isIncome ? 'bg-success' : 'bg-danger',
                  )}
                >
                  {isIncome ? <ArrowDownLeft className="h-3.5 w-3.5" strokeWidth={2.5} /> : <ArrowUpRight className="h-3.5 w-3.5" strokeWidth={2.5} />}
                  {isIncome ? 'Thu' : 'Chi'}
                </span>
              </div>

              {/* Dải giấy Polaroid — chú thích chi tiêu */}
              <div className="px-1.5 pt-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <CategoryIcon icon={p.categories.icon} className="text-base" />
                      <span className="truncate font-display text-sm font-bold text-text">{p.categories.name}</span>
                    </div>
                    {p.note && <p className="mt-0.5 truncate text-[13px] text-text-secondary">{p.note}</p>}
                  </div>
                  <span className={clsx('numeric shrink-0 text-lg font-extrabold', isIncome ? 'text-success' : 'text-danger')}>
                    {isIncome ? '+' : '−'}{formatVND(p.amount)}
                  </span>
                </div>

                <div className="mt-2.5 border-t border-border/70 pt-2">
                  <p className="mb-1.5 text-[11px] text-text-muted">{formatRelative(p.created_at)}</p>
                  <PostReactions postId={p.id} reactions={p.reactions} />
                </div>
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
