'use client';

import { useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Flame, UserPlus } from 'lucide-react';
import { useFeed, useIncomingRequests, useProfile } from '@/lib/queries';
import { formatRelative, formatVND } from '@/lib/format';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';

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
    <div>
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-border bg-surface/90 px-4 py-3 backdrop-blur safe-top">
        <div className="flex items-center gap-2">
          <div className="h-9 w-9 overflow-hidden rounded-full bg-surface-muted">
            {profile.data?.avatar_url ? (
              <Image src={profile.data.avatar_url} alt="" width={36} height={36} />
            ) : (
              <div className="flex h-full w-full items-center justify-center font-display font-semibold text-text-secondary">
                {profile.data?.display_name?.[0] ?? '?'}
              </div>
            )}
          </div>
          <span className="font-medium">{profile.data?.display_name ?? '…'}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 rounded-full bg-surface-muted px-3 py-1.5 text-streak">
            <Flame className="h-4 w-4" />
            <span className="numeric font-semibold">{profile.data?.current_streak ?? 0}</span>
          </div>
          <Link
            href="/friends"
            aria-label="Bạn bè"
            className="relative flex h-9 w-9 items-center justify-center rounded-full bg-surface-muted text-text-secondary transition-transform duration-fast active:scale-90"
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
        <div className="space-y-4 p-4">
          {[0, 1].map((i) => <Skeleton key={i} className="aspect-[4/5] w-full" />)}
        </div>
      )}

      {!feed.isLoading && posts.length === 0 && (
        <EmptyState icon="📷" title="Chưa có post nào" hint="Chụp ảnh chi tiêu đầu tiên, hoặc kết bạn để xem feed của bạn bè!" />
      )}

      <ul className="space-y-6 p-4">
        {posts.map((p) => (
          <li key={p.id} className="overflow-hidden rounded-lg bg-surface shadow-card">
            <div className="relative aspect-[4/5] w-full bg-surface-muted">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.photo_url} alt={p.note ?? ''} className="h-full w-full object-cover" />
              <div className="absolute left-3 top-3 flex items-center gap-2 rounded-full bg-black/45 px-2.5 py-1 text-text-inverse backdrop-blur">
                <div className="h-5 w-5 overflow-hidden rounded-full bg-white/20 text-center text-xs leading-5">
                  {p.profiles.username?.[0]?.toUpperCase() ?? '?'}
                </div>
                <span className="text-xs font-medium">{p.profiles.username}</span>
              </div>
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-4 text-text-inverse">
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
              </div>
            </div>
          </li>
        ))}
      </ul>

      <div ref={sentinel} className="h-10" />
      {feed.isFetchingNextPage && <p className="pb-6 text-center text-sm text-text-muted">Đang tải thêm…</p>}
    </div>
  );
}
