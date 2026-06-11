'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ImageIcon, Lock, LockOpen, X } from 'lucide-react';
import { clsx } from 'clsx';
import { createSupabaseBrowser } from '@/lib/supabase/client';
import { CategoryIcon } from '@/components/ui/CategoryIcon';
import { useAlbums, useBudgets, useCategories, useCreatePost, useProfile } from '@/lib/queries';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';
import { formatVND } from '@/lib/format';
import type { BudgetPeriod, Category, CategoryType } from '@/lib/types';

const TYPE_LABEL: Record<CategoryType, string> = {
  EXPENSE: 'Chi tiêu', INCOME: 'Thu nhập', SAVING: 'Tiết kiệm', GOAL: 'Mục tiêu',
};

const PERIOD_LABEL: Record<BudgetPeriod, string> = { DAY: 'ngày', MONTH: 'tháng', YEAR: 'năm' };

export function UploadModal({ blob, previewUrl, onClose }: { blob: Blob; previewUrl: string; onClose: () => void }) {
  const router = useRouter();
  const push = useToast((s) => s.push);
  const { data: categories } = useCategories();
  const { data: profile } = useProfile();
  const { data: budgets } = useBudgets();
  const { data: albums } = useAlbums();
  const createPost = useCreatePost();

  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [albumId, setAlbumId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const grouped = useMemo(() => {
    const g: Record<CategoryType, Category[]> = { EXPENSE: [], INCOME: [], SAVING: [], GOAL: [] };
    (categories ?? []).forEach((c) => g[c.type].push(c));
    return g;
  }, [categories]);

  const amt = Number(amount.replace(/[^\d]/g, '')) || 0;
  const selectedCat = categories?.find((c) => c.id === categoryId) ?? null;
  const selectedAlbum = useMemo(
    () => albums?.find((a) => a.id === albumId) ?? null,
    [albums, albumId],
  );

  // Budgets this expense will hit. A category-scoped budget matches its own
  // category; total budgets (category_id null) only count EXPENSE posts. Income/
  // saving/goal categories therefore deduct from nothing.
  const affected = useMemo(() => {
    if (!categoryId || selectedCat?.type !== 'EXPENSE') return [];
    const order = { DAY: 0, MONTH: 1, YEAR: 2 } as const;
    return (budgets ?? [])
      .filter((b) => b.category_id === categoryId || b.category_id === null)
      // category-scoped first, then total; each sorted day → month → year
      .sort((a, b) =>
        (a.category_id === null ? 1 : 0) - (b.category_id === null ? 1 : 0) ||
        order[a.period_type] - order[b.period_type],
      );
  }, [budgets, categoryId, selectedCat]);

  async function onSubmit() {
    if (!categoryId) return push('Chọn category trước nhé', 'error');
    const amt = Number(amount.replace(/[^\d.]/g, ''));
    if (!amt || amt <= 0) return push('Nhập số tiền hợp lệ', 'error');

    setUploading(true);
    try {
      const supabase = createSupabaseBrowser();
      const userId = profile?.id ?? 'anon';
      const fileName = `${userId}/${Date.now()}.jpg`;
      const { error: upErr } = await supabase.storage.from('posts').upload(fileName, blob, {
        contentType: 'image/jpeg', upsert: false,
      });
      if (upErr) throw upErr;
      const { data: { publicUrl } } = supabase.storage.from('posts').getPublicUrl(fileName);

      const post = await createPost.mutateAsync({
        category_id: categoryId,
        photo_url: publicUrl,
        amount: amt,
        note: note.trim() || undefined,
        is_private: isPrivate,
        album_id: albumId ?? null,
      });

      if (albumId) {
        // Ảnh vào album không lên feed bạn bè → đưa user về xem album.
        const name = albums?.find((a) => a.id === albumId)?.name ?? 'album';
        push(`Đã thêm vào album ${name}`, 'success');
        router.push(`/memories/albums/${albumId}`);
        return;
      }

      const over = post.budget_impact?.find((b) => b.is_over);
      const month = post.budget_impact?.find((b) => b.period_type === 'MONTH');
      if (over) {
        push(`⚠️ Vượt ngân sách ${PERIOD_LABEL[over.period_type]} ${formatVND(-over.remaining)} rồi!`, 'error');
      } else if (month) {
        push(`Đã up 🔥 — còn ${formatVND(month.remaining)} trong ngân sách tháng`, 'success');
      } else {
        push('Đã up lên', 'success');
      }
      router.push('/feed');
    } catch (e: any) {
      push(e?.message ?? 'Up thất bại — thử lại nhé', 'error');
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background safe-top">
      <header className="flex items-center justify-between border-b border-border bg-surface px-4 py-3">
        <button onClick={onClose} className="rounded-md p-1 text-text-secondary hover:bg-surface-muted" aria-label="Đóng">
          <X className="h-5 w-5" />
        </button>
        <h2 className="font-display font-semibold">Up chi tiêu</h2>
        <span className="w-7" />
      </header>

      <div className="flex-1 overflow-y-auto px-4 pb-32 pt-4">
        <img src={previewUrl} alt="preview" className="aspect-[4/5] w-full rounded-lg object-cover shadow-card" />

        <label className="mt-5 block text-sm font-medium text-text-secondary">Số tiền (VND)</label>
        <Input
          inputMode="numeric"
          placeholder="0"
          value={amount}
          onChange={(e) => setAmount(e.target.value.replace(/[^\d]/g, ''))}
          className="mt-1 numeric text-xl font-semibold"
        />

        <div className="mt-5 space-y-4">
          {(['EXPENSE', 'INCOME', 'SAVING', 'GOAL'] as CategoryType[]).map((t) => (
            grouped[t].length > 0 && (
              <div key={t}>
                <p className="mb-2 text-xs font-medium uppercase tracking-wide text-text-muted">{TYPE_LABEL[t]}</p>
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {grouped[t].map((c) => (
                    <button
                      key={c.id}
                      onClick={() => setCategoryId(c.id)}
                      className={clsx(
                        'flex shrink-0 items-center gap-2 rounded-full border px-3 py-2 transition-all duration-fast',
                        categoryId === c.id
                          ? 'border-primary bg-primary text-text-inverse shadow-soft'
                          : 'border-border bg-surface text-text hover:border-primary/40',
                      )}
                    >
                      <CategoryIcon icon={c.icon} className="text-base" />
                      <span className="text-sm font-medium">{c.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )
          ))}
        </div>

        {affected.length > 0 && (
          <div className="mt-5 rounded-xl border border-border bg-surface-muted/60 p-3">
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-text-muted">
              {amt > 0 ? 'Khoản này sẽ trừ vào' : 'Đang theo dõi quỹ'}
            </p>
            <ul className="space-y-1.5">
              {affected.map((b) => {
                const after = b.remaining - amt; // số còn lại sau khi trừ khoản đang nhập
                const over = after < 0;
                const name = b.category?.name ?? 'Tổng chi tiêu';
                const icon = b.category?.icon ?? '💰';
                return (
                  <li key={b.id} className="flex items-center justify-between gap-2 text-sm">
                    <span className="flex min-w-0 items-center gap-1.5 text-text">
                      <CategoryIcon icon={icon} />
                      <span className="truncate">{name}</span>
                      <span className="shrink-0 text-text-muted">· {PERIOD_LABEL[b.period_type]}</span>
                    </span>
                    <span className={clsx('numeric shrink-0 font-medium', over ? 'text-danger' : 'text-text-secondary')}>
                      {over ? `⚠️ Vượt ${formatVND(-after)}` : `còn ${formatVND(after)}`}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        {/* EXPENSE category selected but no budget yet → nudge the user to create one. */}
        {affected.length === 0 && selectedCat?.type === 'EXPENSE' && (
          <button
            type="button"
            onClick={() => router.push('/budgets')}
            className="mt-5 flex w-full items-center justify-between rounded-xl border border-dashed border-border bg-surface-muted/40 px-3 py-2.5 text-sm text-text-secondary transition-colors duration-fast hover:border-primary/40"
          >
            <span>Chưa có quỹ cho mục «{selectedCat.name}»</span>
            <span className="font-medium text-primary">Đặt ngân sách →</span>
          </button>
        )}

        <label className="mt-5 block text-sm font-medium text-text-secondary">Ghi chú (tuỳ chọn)</label>
        <Input
          placeholder="Cà phê sáng The Coffee House…"
          maxLength={500}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          className="mt-1"
        />

        {/* Lưu vào — Pool (mặc định) hoặc một album */}
        <label className="mt-5 block text-sm font-medium text-text-secondary">Lưu vào</label>
        <div className="mt-2 flex gap-2 overflow-x-auto pb-1">
          <button
            type="button"
            onClick={() => setAlbumId(null)}
            className={clsx(
              'flex shrink-0 items-center gap-2 rounded-full border px-3 py-2 transition-all duration-fast',
              albumId === null
                ? 'border-primary bg-primary text-text-inverse shadow-soft'
                : 'border-border bg-surface text-text hover:border-primary/40',
            )}
          >
            <span className="text-sm font-medium">Pool</span>
          </button>
          {(albums ?? []).map((a) => (
            <button
              key={a.id}
              type="button"
              onClick={() => setAlbumId(a.id)}
              className={clsx(
                'flex shrink-0 items-center gap-2 rounded-full border py-1.5 pl-1.5 pr-3 transition-all duration-fast',
                albumId === a.id
                  ? 'border-primary bg-primary text-text-inverse shadow-soft'
                  : 'border-border bg-surface text-text hover:border-primary/40',
              )}
            >
              <span className="flex h-6 w-6 shrink-0 items-center justify-center overflow-hidden rounded-full bg-surface-muted">
                {a.cover_photo_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={a.cover_photo_url} alt="" className="h-full w-full object-cover" />
                ) : (
                  <ImageIcon className="h-3.5 w-3.5 text-text-muted" />
                )}
              </span>
              <span className="max-w-32 truncate text-sm font-medium">{a.name}</span>
            </button>
          ))}
        </div>
        {albumId && (
          <p className="mt-1.5 text-xs text-text-muted">Ảnh trong album không hiện ở feed bạn bè.</p>
        )}

        {/* Ngân sách chuyến của album đang chọn — theo dõi ngay khi up */}
        {selectedAlbum && selectedAlbum.budget_amount != null && (() => {
          const budget = selectedAlbum.budget_amount;
          const adds = selectedCat?.type === 'EXPENSE'; // album.spent chỉ tính EXPENSE
          const projectedSpent = selectedAlbum.spent + (adds ? amt : 0);
          const after = budget - projectedSpent; // còn lại sau khoản đang nhập
          const over = after < 0;
          const tone = over ? 'danger' : projectedSpent / budget >= 0.8 ? 'warning' : 'success';
          const bar = { success: 'bg-success', warning: 'bg-warning', danger: 'bg-danger' }[tone];
          const text = { success: 'text-success', warning: 'text-warning', danger: 'text-danger' }[tone];
          const pct = Math.max(0, Math.min(1, projectedSpent / budget));
          return (
            <div className="mt-3 rounded-xl border border-border bg-surface-muted/60 p-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium uppercase tracking-wide text-text-muted">Ngân sách chuyến</span>
                <span className={clsx('numeric text-sm font-semibold', over ? 'text-danger' : text)}>
                  {over ? `⚠️ Vượt ${formatVND(-after)}` : `còn ${formatVND(after)}`}
                </span>
              </div>
              <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-surface">
                <div className={clsx('h-full rounded-full transition-all duration-base', bar)} style={{ width: `${pct * 100}%` }} />
              </div>
              <div className="mt-1.5 numeric text-xs text-text-muted">
                {formatVND(projectedSpent)} / {formatVND(budget)}
                {adds && amt > 0 && <span className="text-text-muted/70"> · +{formatVND(amt)} khoản này</span>}
              </div>
            </div>
          );
        })()}

        {/* Riêng tư chỉ áp dụng khi đăng pool */}
        {!albumId && (
          <button
            onClick={() => setIsPrivate((v) => !v)}
            className={clsx(
              'mt-4 flex w-full items-center justify-between rounded-md border border-border bg-surface px-4 py-3 transition-colors duration-fast',
              isPrivate && 'border-primary/50 bg-surface-muted',
            )}
          >
            <span className="flex items-center gap-2 text-sm">
              {isPrivate ? <Lock className="h-4 w-4 text-primary" /> : <LockOpen className="h-4 w-4 text-text-muted" />}
              {isPrivate ? 'Chỉ mình bạn xem' : 'Hiện trong feed'}
            </span>
          </button>
        )}
      </div>

      <div className="fixed inset-x-0 bottom-0 border-t border-border bg-surface px-4 py-4 safe-bottom">
        <Button className="w-full text-base" loading={uploading} onClick={onSubmit}>
          {albumId ? 'Thêm vào album' : 'Up'}
        </Button>
      </div>
    </div>
  );
}
