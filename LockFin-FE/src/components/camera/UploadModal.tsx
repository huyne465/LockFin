'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, LockOpen, X } from 'lucide-react';
import { clsx } from 'clsx';
import { createSupabaseBrowser } from '@/lib/supabase/client';
import { useCategories, useCreatePost, useProfile } from '@/lib/queries';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';
import type { Category, CategoryType } from '@/lib/types';

const TYPE_LABEL: Record<CategoryType, string> = {
  EXPENSE: 'Chi tiêu', INCOME: 'Thu nhập', SAVING: 'Tiết kiệm', GOAL: 'Mục tiêu',
};

export function UploadModal({ blob, previewUrl, onClose }: { blob: Blob; previewUrl: string; onClose: () => void }) {
  const router = useRouter();
  const push = useToast((s) => s.push);
  const { data: categories } = useCategories();
  const { data: profile } = useProfile();
  const createPost = useCreatePost();

  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [uploading, setUploading] = useState(false);

  const grouped = useMemo(() => {
    const g: Record<CategoryType, Category[]> = { EXPENSE: [], INCOME: [], SAVING: [], GOAL: [] };
    (categories ?? []).forEach((c) => g[c.type].push(c));
    return g;
  }, [categories]);

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

      await createPost.mutateAsync({
        category_id: categoryId,
        photo_url: publicUrl,
        amount: amt,
        note: note.trim() || undefined,
        is_private: isPrivate,
      });
      push('Đã up lên 🔥', 'success');
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
                      <span className="text-base">{c.icon}</span>
                      <span className="text-sm font-medium">{c.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )
          ))}
        </div>

        <label className="mt-5 block text-sm font-medium text-text-secondary">Ghi chú (tuỳ chọn)</label>
        <Input
          placeholder="Cà phê sáng The Coffee House…"
          maxLength={500}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          className="mt-1"
        />

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
      </div>

      <div className="fixed inset-x-0 bottom-0 border-t border-border bg-surface px-4 py-4 safe-bottom">
        <Button className="w-full text-base" loading={uploading} onClick={onSubmit}>
          Up lên 🔥
        </Button>
      </div>
    </div>
  );
}
