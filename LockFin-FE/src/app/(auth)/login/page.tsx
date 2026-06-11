'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { createSupabaseBrowser } from '@/lib/supabase/client';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const push = useToast((s) => s.push);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const error = searchParams.get('error');
    if (error) push(error, 'error');
  }, [searchParams, push]);

  async function handleEmail(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const supabase = createSupabaseBrowser();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) return push(error.message, 'error');
    router.replace('/');
    router.refresh();
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
        <h1 className="font-display text-3xl font-bold text-primary">LockFin</h1>
        <p className="mt-2 text-sm text-text-secondary">Chụp chi tiêu, giữ streak 🔥</p>
      </header>
      <form onSubmit={handleEmail} className="flex flex-col gap-3 rounded-lg bg-surface p-6 shadow-card">
        <Input type="email" inputMode="email" autoComplete="email" placeholder="Email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        <Input type="password" autoComplete="current-password" placeholder="Mật khẩu" required value={password} onChange={(e) => setPassword(e.target.value)} />
        <Link href="/forgot-password" className="self-end text-xs font-medium text-primary">Quên mật khẩu?</Link>
        <Button type="submit" loading={loading}>Đăng nhập</Button>
      </form>
      <div className="flex items-center gap-3 text-xs text-text-muted">
        <span className="h-px flex-1 bg-border" /> hoặc <span className="h-px flex-1 bg-border" />
      </div>
      <Button variant="outline" onClick={handleGoogle}>Đăng nhập với Google</Button>
      <p className="text-center text-sm text-text-secondary">
        Chưa có tài khoản? <Link href="/signup" className="font-medium text-primary">Đăng ký</Link>
      </p>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
