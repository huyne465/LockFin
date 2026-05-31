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
  if (!res.ok) {
    let message = 'Request failed';
    try { message = (await res.json())?.message ?? message; } catch { /* noop */ }
    throw new Error(message);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}
