'use client';

import { useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft, ChevronDown, Globe, Lock, Pencil, Plus, Trash2, Wallet, X,
} from 'lucide-react';
import { clsx } from 'clsx';
import {
  useAlbum,
  useAddPostsToAlbum,
  useDeleteAlbum,
  useRemovePostFromAlbum,
} from '@/lib/queries';
import { formatVND } from '@/lib/format';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import { useToast } from '@/components/ui/Toast';
import { MemoryLightbox } from '@/components/memories/MemoryLightbox';
import { AlbumForm } from '@/components/album/AlbumForm';
import { PostPicker } from '@/components/album/PostPicker';
import type { FeedPost } from '@/lib/types';

function tone(spent: number, budget: number) {
  if (spent > budget) return 'danger';
  if (spent / budget >= 0.8) return 'warning';
  return 'success';
}
const BAR = { success: 'bg-success', warning: 'bg-warning', danger: 'bg-danger' } as const;
const TEXT = { success: 'text-success', warning: 'text-warning', danger: 'text-danger' } as const;

function fmtDate(d: string) {
  const [y, m, day] = d.split('-');
  return `${day}/${m}/${y}`;
}

/** Bottom sheet thêm post (từ pool) vào album. */
function AddPostsSheet({ albumId, onClose }: { albumId: string; onClose: () => void }) {
  const push = useToast((s) => s.push);
  const add = useAddPostsToAlbum();
  const [ids, setIds] = useState<string[]>([]);

  async function onAdd() {
    if (!ids.length) return onClose();
    try {
      await add.mutateAsync({ id: albumId, post_ids: ids });
      push(`Đã thêm ${ids.length} ảnh vào album 🧳`, 'success');
      onClose();
    } catch (e) {
      push(e instanceof Error ? e.message : 'Thêm thất bại, thử lại nhé.', 'error');
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/40" onClick={onClose}>
      <div
        className="max-h-[85dvh] overflow-y-auto rounded-t-3xl bg-surface px-4 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-3 shadow-lift"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto mb-2 h-1.5 w-10 rounded-full bg-border" />
        <header className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-lg font-bold">Thêm ảnh vào album</h2>
          <button onClick={onClose} aria-label="Đóng" className="rounded-md p-1 text-text-secondary hover:bg-surface-muted">
            <X className="h-5 w-5" />
          </button>
        </header>
        <PostPicker value={ids} onChange={setIds} />
        <div className="mt-5">
          <Button className="w-full" loading={add.isPending} onClick={onAdd} disabled={!ids.length}>
            {ids.length ? `Thêm ${ids.length} ảnh` : 'Chọn ảnh để thêm'}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function AlbumDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const router = useRouter();
  const push = useToast((s) => s.push);

  const { data: album, isLoading } = useAlbum(id);
  const removePost = useRemovePostFromAlbum();
  const deleteAlbum = useDeleteAlbum();

  const [lightbox, setLightbox] = useState<FeedPost[] | null>(null);
  const [editing, setEditing] = useState(false);
  const [adding, setAdding] = useState(false);
  const [showBreakdown, setShowBreakdown] = useState(false);

  // Tiền đã chi gom theo nhóm category (chỉ EXPENSE — khớp với "spent" của album).
  const breakdown = useMemo(() => {
    const map = new Map<string, { id: string; name: string; icon: string; color: string; total: number; count: number }>();
    for (const p of album?.posts ?? []) {
      if (p.categories.type !== 'EXPENSE') continue;
      const k = p.categories.id;
      const cur = map.get(k) ?? {
        id: k, name: p.categories.name, icon: p.categories.icon, color: p.categories.color_hex, total: 0, count: 0,
      };
      cur.total += p.amount;
      cur.count += 1;
      map.set(k, cur);
    }
    return [...map.values()].sort((a, b) => b.total - a.total);
  }, [album]);
  const totalSpent = useMemo(() => breakdown.reduce((s, b) => s + b.total, 0), [breakdown]);

  async function onRemove(postId: string) {
    try {
      await removePost.mutateAsync({ id, postId });
      push('Đã gỡ ảnh về pool', 'info');
    } catch (e) {
      push(e instanceof Error ? e.message : 'Gỡ thất bại, thử lại nhé.', 'error');
    }
  }

  async function onDelete() {
    if (!confirm('Xoá album này? Ảnh không mất — sẽ quay lại pool.')) return;
    try {
      await deleteAlbum.mutateAsync(id);
      push('Đã xoá album', 'info');
      router.replace('/memories');
    } catch (e) {
      push(e instanceof Error ? e.message : 'Xoá thất bại, thử lại nhé.', 'error');
    }
  }

  const hasBudget = album?.budget_amount != null;
  const over = hasBudget && album!.remaining != null && album!.remaining < 0;
  const t = hasBudget ? tone(album!.spent, album!.budget_amount!) : 'success';
  const pct = hasBudget ? Math.max(0, Math.min(1, album!.spent / album!.budget_amount!)) : 0;

  return (
    <div className="min-h-dvh bg-background">
      <header className="sticky top-0 z-30 glass flex items-center gap-2 px-3 py-3.5 safe-top">
        <button
          onClick={() => router.back()}
          aria-label="Quay lại"
          className="flex h-9 w-9 items-center justify-center rounded-full text-text-secondary transition-transform duration-fast active:scale-90"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="truncate font-display text-lg font-bold">{album?.name ?? 'Album'}</h1>
        {album && (
          <div className="ml-auto flex items-center gap-1">
            <button
              onClick={() => setEditing(true)}
              aria-label="Sửa album"
              className="flex h-9 w-9 items-center justify-center rounded-full text-text-secondary transition-transform duration-fast active:scale-90"
            >
              <Pencil className="h-[18px] w-[18px]" />
            </button>
            <button
              onClick={onDelete}
              aria-label="Xoá album"
              className="flex h-9 w-9 items-center justify-center rounded-full text-danger transition-transform duration-fast active:scale-90"
            >
              <Trash2 className="h-[18px] w-[18px]" />
            </button>
          </div>
        )}
      </header>

      <div className="px-4 pb-24">
        {isLoading && (
          <div className="mt-4 space-y-3">
            <Skeleton className="h-24 w-full rounded-2xl" />
            <Skeleton className="h-48 w-full rounded-2xl" />
          </div>
        )}

        {!isLoading && album && (
          <>
            {/* Meta */}
            <div className="mt-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className={clsx(
                  'flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold',
                  album.is_public ? 'bg-primary/10 text-primary' : 'bg-surface-muted text-text-secondary',
                )}>
                  {album.is_public ? <Globe className="h-3.5 w-3.5" /> : <Lock className="h-3.5 w-3.5" />}
                  {album.is_public ? 'Công khai' : 'Riêng tư'}
                </span>
                <span className="numeric text-xs text-text-muted">{album.post_count} ảnh</span>
                {(album.start_date || album.end_date) && (
                  <span className="numeric text-xs text-text-muted">
                    {album.start_date ? fmtDate(album.start_date) : '…'}
                    {album.end_date ? ` → ${fmtDate(album.end_date)}` : ''}
                  </span>
                )}
              </div>
              {album.description && (
                <p className="mt-2 text-sm text-text-secondary">{album.description}</p>
              )}
            </div>

            {/* Thanh ngân sách chuyến */}
            {hasBudget && (
              <div className="mt-4 rounded-2xl bg-surface px-4 py-3.5 shadow-card">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-text">Ngân sách chuyến</span>
                  {over ? (
                    <span className="numeric rounded-full bg-danger/10 px-2 py-0.5 text-xs font-semibold text-danger">
                      Vượt {formatVND(-album.remaining!)}
                    </span>
                  ) : (
                    <span className={clsx('numeric rounded-full bg-surface-muted px-2 py-0.5 text-xs font-semibold', TEXT[t])}>
                      Còn {formatVND(album.remaining!)}
                    </span>
                  )}
                </div>
                <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-surface-muted">
                  <div className={clsx('h-full rounded-full transition-all duration-base', BAR[t])} style={{ width: `${pct * 100}%` }} />
                </div>
                <div className="mt-2 text-xs text-text-muted">
                  <span className="numeric">{formatVND(album.spent)} / {formatVND(album.budget_amount!)}</span>
                </div>
              </div>
            )}

            {/* Đã chi — gom theo nguồn (category), expand/collapse */}
            {breakdown.length > 0 && (
              <div className="mt-3 overflow-hidden rounded-2xl bg-surface shadow-card">
                <button
                  type="button"
                  onClick={() => setShowBreakdown((v) => !v)}
                  aria-expanded={showBreakdown}
                  className="flex w-full items-center justify-between px-4 py-3.5 text-left"
                >
                  <span className="flex items-center gap-2 text-sm font-medium text-text">
                    <Wallet className="h-4 w-4 text-text-secondary" />
                    Đã chi <span className="numeric font-semibold">{formatVND(totalSpent)}</span>
                    <span className="text-xs font-normal text-text-muted">· {breakdown.length} nhóm</span>
                  </span>
                  <ChevronDown className={clsx('h-4 w-4 text-text-secondary transition-transform duration-base', showBreakdown && 'rotate-180')} />
                </button>

                {showBreakdown && (
                  <ul className="space-y-2.5 border-t border-border px-4 py-3">
                    {breakdown.map((b) => {
                      const share = totalSpent > 0 ? b.total / totalSpent : 0;
                      return (
                        <li key={b.id}>
                          <div className="flex items-center justify-between gap-2 text-sm">
                            <span className="flex min-w-0 items-center gap-2">
                              <span className="text-base">{b.icon}</span>
                              <span className="truncate text-text">{b.name}</span>
                              <span className="shrink-0 text-xs text-text-muted">{b.count} khoản</span>
                            </span>
                            <span className="numeric shrink-0 font-semibold text-text">{formatVND(b.total)}</span>
                          </div>
                          <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-surface-muted">
                            <div className="h-full rounded-full transition-all duration-base" style={{ width: `${share * 100}%`, backgroundColor: b.color }} />
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            )}

            {/* Thêm ảnh */}
            <button
              type="button"
              onClick={() => setAdding(true)}
              className="mt-4 flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-border bg-surface-muted/40 px-3 py-2.5 text-sm font-medium text-text-secondary transition-colors duration-fast hover:border-primary/40"
            >
              <Plus className="h-4 w-4" /> Thêm ảnh từ pool
            </button>

            {/* Lưới ảnh */}
            {album.posts.length === 0 ? (
              <EmptyState icon="🖼️" title="Album chưa có ảnh" hint="Thêm ảnh từ pool hoặc up ảnh mới vào album này." />
            ) : (
              <div className="mt-4 grid grid-cols-3 gap-1.5">
                {album.posts.map((p) => (
                  <div key={p.id} className="group relative aspect-square overflow-hidden rounded-xl ring-1 ring-black/5 shadow-card">
                    <button onClick={() => setLightbox([p])} className="h-full w-full">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={p.photo_url} alt="" className="h-full w-full object-cover" />
                    </button>
                    <button
                      onClick={() => onRemove(p.id)}
                      aria-label="Gỡ ảnh"
                      className="glass-dark absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full text-text-inverse opacity-0 transition-opacity duration-fast group-hover:opacity-100"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {lightbox && <MemoryLightbox posts={lightbox} onClose={() => setLightbox(null)} />}
      {editing && album && <AlbumForm album={album} onClose={() => setEditing(false)} />}
      {adding && <AddPostsSheet albumId={id} onClose={() => setAdding(false)} />}
    </div>
  );
}
