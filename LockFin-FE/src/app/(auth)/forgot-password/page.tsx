'use client';

import { useState } from 'react';
import Link from 'next/link';
import { createSupabaseBrowser } from '@/lib/supabase/client';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';

export default function ForgotPasswordPage() {
  const push = useToast((s) => s.push);
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const supabase = createSupabaseBrowser();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
    });
    setLoading(false);
    if (error) return push(error.message, 'error');
    setSent(true);
  }

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center gap-6 px-6 py-12">
      <header className="text-center">
        <h1 className="font-display text-3xl font-bold text-primary">Quên mật khẩu</h1>
        <p className="mt-2 text-sm text-text-secondary">Nhập email để nhận liên kết đặt lại</p>
      </header>
      {sent ? (
        <div className="rounded-lg bg-surface p-6 text-center shadow-card">
          <p className="text-sm text-text-secondary">
            Đã gửi liên kết đặt lại mật khẩu tới <span className="font-medium text-text">{email}</span>.
            Kiểm tra hộp thư (cả mục spam) và bấm vào liên kết để tiếp tục.
          </p>
        </div>
      ) : (
        <form onSubmit={onSubmit} className="flex flex-col gap-3 rounded-lg bg-surface p-6 shadow-card">
          <Input type="email" inputMode="email" autoComplete="email" placeholder="Email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          <Button type="submit" loading={loading}>Gửi liên kết</Button>
        </form>
      )}
      <p className="text-center text-sm text-text-secondary">
        <Link href="/login" className="font-medium text-primary">Quay lại đăng nhập</Link>
      </p>
    </main>
  );
}
