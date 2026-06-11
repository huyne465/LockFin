'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createSupabaseBrowser } from '@/lib/supabase/client';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';

export default function SignupPage() {
  const router = useRouter();
  const push = useToast((s) => s.push);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const supabase = createSupabaseBrowser();
    const { error } = await supabase.auth.signUp({
      email, password,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });
    setLoading(false);
    if (error) return push(error.message, 'error');
    push('Kiểm tra email để xác nhận tài khoản', 'success');
    router.replace('/login');
  }

  async function handleGoogle() {
    const supabase = createSupabaseBrowser();
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  }

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center gap-6 px-6 py-12">
      <header className="text-center">
        <h1 className="font-display text-3xl font-bold text-primary">Tham gia LockFin</h1>
        <p className="mt-2 text-sm text-text-secondary">Bắt đầu streak ngay hôm nay</p>
      </header>
      <form onSubmit={onSubmit} className="flex flex-col gap-3 rounded-lg bg-surface p-6 shadow-card">
        <Input type="email" placeholder="Email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        <Input type="password" placeholder="Mật khẩu (≥ 6 ký tự)" minLength={6} required value={password} onChange={(e) => setPassword(e.target.value)} />
        <Button type="submit" loading={loading}>Đăng ký</Button>
      </form>
      <div className="flex items-center gap-3 text-xs text-text-muted">
        <span className="h-px flex-1 bg-border" /> hoặc <span className="h-px flex-1 bg-border" />
      </div>
      <Button variant="outline" onClick={handleGoogle}>Đăng ký với Google</Button>
      <p className="text-center text-sm text-text-secondary">
        Đã có tài khoản? <Link href="/login" className="font-medium text-primary">Đăng nhập</Link>
      </p>
    </main>
  );
}
