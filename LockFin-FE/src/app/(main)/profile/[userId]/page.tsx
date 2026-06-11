'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Copy } from 'lucide-react';
import { useProfile, useUserAlbums, useUserProfile } from '@/lib/queries';
import { useToast } from '@/components/ui/Toast';
import { AlbumCard } from '@/components/album/AlbumCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { Skeleton } from '@/components/ui/Skeleton';
import type { ProfileSummary } from '@/lib/types';

const nameOf = (p?: ProfileSummary | null) =>
  p?.display_name?.trim() || p?.username?.trim() || 'Người dùng';

export default function UserProfilePage() {
  const { userId } = useParams<{ userId: string }>();
  const router = useRouter();
  const push = useToast((s) => s.push);
  const me = useProfile();
  const profile = useUserProfile(userId);
  const albums = useUserAlbums(userId);

  const isSelf = me.data?.id === userId;

  // Viewing your own id here → send to the editable profile instead.
  useEffect(() => {
    if (isSelf) router.replace('/profile');
  }, [isSelf, router]);

  const p = profile.data;
  const albumList = albums.data ?? [];

  if (isSelf) return null;

  async function copyUsername() {
    if (!p?.username) return;
    try {
      await navigator.clipboard.writeText(`@${p.username}`);
      push('Đã copy username', 'success');
    } catch {
      push('Không copy được, thử lại nhé', 'error');
    }
  }

  return (
    <div className="min-h-full bg-background">
      <header className="sticky top-0 z-30 glass flex items-center gap-2 px-3 py-3.5 safe-top">
        <button
          type="button"
          onClick={() => router.back()}
          aria-label="Quay lại"
          className="flex h-11 w-11 items-center justify-center rounded-full text-text-secondary transition-transform duration-fast active:scale-90"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="font-display text-lg font-bold">Hồ sơ</h1>
      </header>

      <div className="px-4 pb-10">
        {profile.isError ? (
          <ErrorState
            error={profile.error}
            title="Không tải được hồ sơ"
            message="Không tìm thấy người dùng này hoặc đã có lỗi xảy ra."
            onRetry={() => profile.refetch()}
            retrying={profile.isFetching}
          />
        ) : (
          <>
            {/* Profile header */}
            <div className="mt-4 flex items-center gap-4">
              <div className="h-20 w-20 shrink-0 overflow-hidden rounded-full bg-surface-muted ring-2 ring-primary/15">
                {profile.isLoading ? (
                  <Skeleton className="h-full w-full" />
                ) : p?.avatar_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.avatar_url} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center font-display text-2xl font-semibold text-text-secondary">
                    {nameOf(p)[0]?.toUpperCase() ?? '?'}
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-display text-xl font-bold text-text">{nameOf(p)}</p>
                {p?.username && (
                  <button
                    type="button"
                    onClick={copyUsername}
                    className="mt-1 inline-flex max-w-full items-center gap-1.5 rounded-full bg-surface-muted px-2.5 py-1 text-sm text-text-secondary transition-colors duration-fast hover:bg-border"
                  >
                    <span className="truncate">@{p.username}</span>
                    <Copy className="h-3.5 w-3.5 shrink-0" />
                  </button>
                )}
              </div>
            </div>

            {/* Public albums */}
            <h2 className="mb-3 mt-7 px-1 text-sm font-semibold text-text-secondary">Album công khai</h2>
            {albums.isLoading && (
              <div className="grid grid-cols-2 gap-3">
                <Skeleton className="aspect-[4/3] rounded-2xl" />
                <Skeleton className="aspect-[4/3] rounded-2xl" />
              </div>
            )}
            {albums.isError && (
              <ErrorState
                error={albums.error}
                title="Không tải được album"
                onRetry={() => albums.refetch()}
                retrying={albums.isFetching}
              />
            )}
            {!albums.isLoading && !albums.isError && albumList.length === 0 && (
              <EmptyState
                icon="🔒"
                title="Chưa có album công khai"
                hint="Người này chưa chia sẻ album nào."
              />
            )}
            {albumList.length > 0 && (
              <div className="grid grid-cols-2 gap-3">
                {albumList.map((a) => (
                  <AlbumCard key={a.id} album={a} />
                ))}
              </div>
            )}
          </>
        )}

        <Link
          href="/friends"
          className="mt-8 block text-center text-sm text-text-muted underline-offset-2 hover:underline"
        >
          ← Về danh sách bạn bè
        </Link>
      </div>
    </div>
  );
}
