'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Globe, Lock, X } from 'lucide-react';
import { clsx } from 'clsx';
import { useCreateAlbum, useUpdateAlbum } from '@/lib/queries';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';
import type { AlbumDetail, AlbumSummary } from '@/lib/types';
import { PostPicker } from './PostPicker';

/** Map lỗi BE (400/403/404) sang toast tiếng Việt. */
function friendlyError(e: unknown): string {
  const msg = e instanceof Error ? e.message : '';
  if (/name/i.test(msg) || /empty/i.test(msg)) return 'Đặt tên album nhé.';
  if (/budget|amount|positive/i.test(msg)) return 'Ngân sách phải lớn hơn 0.';
  if (/end_date|start_date|date/i.test(msg)) return 'Ngày kết thúc phải sau ngày bắt đầu.';
  if (/not found|404/i.test(msg)) return 'Không tìm thấy album này.';
  if (/forbidden|403/i.test(msg)) return 'Bạn không có quyền sửa album này.';
  return msg || 'Có lỗi xảy ra, thử lại nhé.';
}

export function AlbumForm({ album, onClose }: { album?: AlbumSummary | AlbumDetail; onClose: () => void }) {
  const isEdit = !!album;
  const router = useRouter();
  const push = useToast((s) => s.push);
  const create = useCreateAlbum();
  const update = useUpdateAlbum();

  const [name, setName] = useState(album?.name ?? '');
  const [description, setDescription] = useState(album?.description ?? '');
  const [isPublic, setIsPublic] = useState(album?.is_public ?? false);
  const [budget, setBudget] = useState(album?.budget_amount != null ? String(album.budget_amount) : '');
  const [startDate, setStartDate] = useState(album?.start_date ?? '');
  const [endDate, setEndDate] = useState(album?.end_date ?? '');
  const [postIds, setPostIds] = useState<string[]>([]);

  const saving = create.isPending || update.isPending;

  async function onSubmit() {
    const trimmed = name.trim();
    if (!trimmed) return push('Đặt tên album nhé.', 'error');
    const budgetAmount = budget ? Number(budget.replace(/[^\d]/g, '')) : null;
    if (budgetAmount != null && budgetAmount <= 0) return push('Ngân sách phải lớn hơn 0.', 'error');
    if (startDate && endDate && endDate < startDate) return push('Ngày kết thúc phải sau ngày bắt đầu.', 'error');

    try {
      if (isEdit) {
        await update.mutateAsync({
          id: album!.id,
          name: trimmed,
          description: description.trim() || undefined,
          is_public: isPublic,
          budget_amount: budgetAmount,
          start_date: startDate || undefined,
          end_date: endDate || undefined,
        });
        push('Đã cập nhật album 👍', 'success');
        onClose();
      } else {
        const created: AlbumDetail = await create.mutateAsync({
          name: trimmed,
          description: description.trim() || undefined,
          is_public: isPublic,
          budget_amount: budgetAmount,
          start_date: startDate || undefined,
          end_date: endDate || undefined,
          post_ids: postIds.length ? postIds : undefined,
        });
        push('Đã tạo album 🧳', 'success');
        onClose();
        router.push(`/memories/albums/${created.id}`);
      }
    } catch (e) {
      push(friendlyError(e), 'error');
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/40" onClick={onClose}>
      <div
        className="max-h-[90dvh] overflow-y-auto rounded-t-3xl bg-surface px-4 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-3 shadow-lift"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto mb-2 h-1.5 w-10 rounded-full bg-border" />
        <header className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-lg font-bold">{isEdit ? 'Sửa album' : 'Tạo album'}</h2>
          <button onClick={onClose} aria-label="Đóng" className="rounded-md p-1 text-text-secondary hover:bg-surface-muted">
            <X className="h-5 w-5" />
          </button>
        </header>

        <label className="mb-1 block text-sm font-medium text-text-secondary">Tên chuyến đi</label>
        <Input
          placeholder="Đà Lạt 3N2Đ"
          maxLength={100}
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="font-medium"
        />

        <label className="mb-1 mt-4 block text-sm font-medium text-text-secondary">Mô tả (tuỳ chọn)</label>
        <textarea
          placeholder="Chuyến đi cuối năm cùng team…"
          maxLength={1000}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
          className="w-full resize-none rounded-md border border-border bg-surface px-4 py-3 text-text placeholder:text-text-muted focus:border-primary transition-colors duration-fast"
        />

        {/* Public / Private */}
        <button
          type="button"
          onClick={() => setIsPublic((v) => !v)}
          className={clsx(
            'mt-4 flex w-full items-center justify-between rounded-md border border-border bg-surface px-4 py-3 transition-colors duration-fast',
            isPublic ? 'border-primary/50 bg-surface-muted' : '',
          )}
        >
          <span className="flex items-center gap-2 text-sm">
            {isPublic ? <Globe className="h-4 w-4 text-primary" /> : <Lock className="h-4 w-4 text-text-muted" />}
            {isPublic ? 'Công khai — bạn bè xem được trên hồ sơ' : 'Riêng tư — chỉ mình bạn'}
          </span>
        </button>

        <label className="mb-1 mt-4 block text-sm font-medium text-text-secondary">Ngân sách chuyến (VND, tuỳ chọn)</label>
        <Input
          inputMode="numeric"
          placeholder="Để trống = không đặt"
          value={budget}
          onChange={(e) => setBudget(e.target.value.replace(/[^\d]/g, ''))}
          className="numeric text-lg font-semibold"
        />

        <div className="mt-4 flex gap-3">
          <div className="flex-1">
            <label className="mb-1 block text-sm font-medium text-text-secondary">Bắt đầu</label>
            <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          </div>
          <div className="flex-1">
            <label className="mb-1 block text-sm font-medium text-text-secondary">Kết thúc</label>
            <Input type="date" value={endDate} min={startDate || undefined} onChange={(e) => setEndDate(e.target.value)} />
          </div>
        </div>

        {/* Gom sẵn post khi tạo */}
        {!isEdit && (
          <div className="mt-5">
            <div className="mb-2 flex items-center justify-between">
              <label className="text-sm font-medium text-text-secondary">Gom ảnh có sẵn (tuỳ chọn)</label>
              {postIds.length > 0 && (
                <span className="numeric text-xs font-semibold text-primary">đã chọn {postIds.length}</span>
              )}
            </div>
            <PostPicker value={postIds} onChange={setPostIds} />
          </div>
        )}

        <div className="mt-6">
          <Button className="w-full" loading={saving} onClick={onSubmit}>
            {isEdit ? 'Lưu' : 'Tạo album 🧳'}
          </Button>
        </div>
      </div>
    </div>
  );
}
