'use client';

import { useEffect } from 'react';
import OneSignal from 'react-onesignal';
import { createSupabaseBrowser } from '@/lib/supabase/client';

const APP_ID = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID;

// Module-level guards: React 18 StrictMode mounts effects twice in dev, and the
// SDK throws if init runs more than once per page load.
let initStarted = false;
let initialized = false;

/**
 * Boots the OneSignal Web SDK once and keeps its `external_id` in sync with the
 * Supabase session, so the backend can target pushes by Supabase user id.
 * Renders nothing. Safely no-ops when NEXT_PUBLIC_ONESIGNAL_APP_ID is unset.
 */
export function OneSignalInit() {
  useEffect(() => {
    if (!APP_ID || initStarted) return;
    initStarted = true;

    const supabase = createSupabaseBrowser();

    (async () => {
      try {
        await OneSignal.init({
          appId: APP_ID,
          allowLocalhostAsSecureOrigin: true,
          serviceWorkerPath: 'OneSignalSDKWorker.js',
        });
        initialized = true;

        // Bind the current session, then track future sign-in / sign-out.
        const { data: { user } } = await supabase.auth.getUser();
        if (user) await OneSignal.login(user.id);
      } catch (err) {
        // Never let a push hiccup break the app shell.
        console.warn('OneSignal init failed', err);
      }
    })();

    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (!initialized) return;
      if (event === 'SIGNED_OUT') {
        OneSignal.logout().catch(() => {});
      } else if (session?.user) {
        OneSignal.login(session.user.id).catch(() => {});
      }
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  return null;
}
