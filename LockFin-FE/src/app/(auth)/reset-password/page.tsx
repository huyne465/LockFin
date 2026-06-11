'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createSupabaseBrowser } from '@/lib/supabase/client';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';

export default function ResetPasswordPage() {
  const router = useRouter();
  const push = useToast((s) => s.push);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState<boolean | null>(null);

  useEffect(() => {
    const supabase = createSupabaseBrowser();
    supabase.auth.getSession().then(({ data }) => setReady(!!data.session));
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirm) return push('Mật khẩu nhập lại không khớp', 'error');
    setLoading(true);
    const supabase = createSupabaseBrowser();
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) return push(error.message, 'error');
    push('Đã đổi mật khẩu thành công', 'success');
    router.replace('/');
    router.refresh();
  }

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center gap-6 px-6 py-12">
      <header className="text-center">
        <h1 className="font-display text-3xl font-bold text-primary">Đặt mật khẩu mới</h1>
        <p className="mt-2 text-sm text-text-secondary">Chọn mật khẩu mới cho tài khoản của bạn</p>
      </header>
      {ready === false ? (
        <div className="rounded-lg bg-surface p-6 text-center shadow-card">
          <p className="text-sm text-text-secondary">
            Liên kết không hợp lệ hoặc đã hết hạn. Hãy yêu cầu gửi lại liên kết đặt lại mật khẩu.
          </p>
          <Link href="/forgot-password" className="mt-4 inline-block font-medium text-primary">
            Gửi lại liên kết
          </Link>
        </div>
      ) : (
        <form onSubmit={onSubmit} className="flex flex-col gap-3 rounded-lg bg-surface p-6 shadow-card">
          <Input type="password" autoComplete="new-password" placeholder="Mật khẩu mới (≥ 6 ký tự)" minLength={6} required value={password} onChange={(e) => setPassword(e.target.value)} />
          <Input type="password" autoComplete="new-password" placeholder="Nhập lại mật khẩu" minLength={6} required value={confirm} onChange={(e) => setConfirm(e.target.value)} />
          <Button type="submit" loading={loading} disabled={ready === null}>Đổi mật khẩu</Button>
        </form>
      )}
    </main>
  );
}
