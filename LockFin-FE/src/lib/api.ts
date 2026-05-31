import { createSupabaseBrowser } from './supabase/client';

const BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3000/api';

export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const supabase = createSupabaseBrowser();
  const { data: { session } } = await supabase.auth.getSession();
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session?.access_token ?? ''}`,
      ...(init?.headers ?? {}),
    },
  });
  if (res.status === 401) {
    // Session expired or invalid (refresh token dead). Clear it and bounce to
    // login instead of surfacing a generic error to the user.
    await supabase.auth.signOut({ scope: 'local' });
    if (typeof window !== 'undefined') window.location.assign('/login');
    throw new Error('Phiên đăng nhập đã hết hạn');
  }
  if (!res.ok) {
    let message = 'Request failed';
    try { message = (await res.json())?.message ?? message; } catch { /* noop */ }
    throw new Error(message);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}
