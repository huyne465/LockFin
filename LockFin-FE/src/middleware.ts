import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';

type CookieToSet = { name: string; value: string; options: CookieOptions };

const PUBLIC_PATHS = ['/login', '/signup', '/offline', '/auth/callback'];

export async function middleware(req: NextRequest) {
  // `res` is reassigned by setAll when Supabase refreshes the session, so the
  // refreshed auth cookies live on whatever `res` points to at the end.
  let res = NextResponse.next({ request: req });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => req.cookies.getAll(),
        setAll: (cookiesToSet: CookieToSet[]) => {
          cookiesToSet.forEach(({ name, value }) => req.cookies.set(name, value));
          res = NextResponse.next({ request: req });
          cookiesToSet.forEach(({ name, value, options }) =>
            res.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // getUser() validates the token with Supabase and refreshes it if expired.
  const { data: { user } } = await supabase.auth.getUser();
  const { pathname } = req.nextUrl;
  const isPublic = PUBLIC_PATHS.some((p) => pathname.startsWith(p));

  // Carry the (possibly refreshed/cleared) auth cookies onto a redirect so they
  // are not dropped — otherwise an expired session never clears and loops.
  const redirectTo = (target: string) => {
    const url = req.nextUrl.clone();
    url.pathname = target;
    const redirect = NextResponse.redirect(url);
    res.cookies.getAll().forEach((c) => redirect.cookies.set(c));
    return redirect;
  };

  if (!user && !isPublic) return redirectTo('/login');
  if (user && (pathname === '/login' || pathname === '/signup')) return redirectTo('/');

  return res;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|icons|manifest.json|sw.js|workbox-).*)'],
};
