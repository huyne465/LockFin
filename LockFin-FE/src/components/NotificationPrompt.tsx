'use client';

import { useEffect, useState } from 'react';
import OneSignal from 'react-onesignal';
import { Bell, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';

const APP_ID = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID;
const DISMISS_KEY = 'lockfin:push-prompt-dismissed';

/**
 * One-time opt-in card shown soon after the user enters the app, so we ask for
 * notification permission up front instead of only burying it in Settings.
 *
 * Web push permission can only be requested from a user gesture (and on iOS only
 * inside an installed PWA), so we surface a button rather than auto-prompting.
 * Only appears when push is supported and permission is still undecided; once the
 * user enables or dismisses, it never nags again.
 */
export function NotificationPrompt() {
  const push = useToast((s) => s.push);
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!APP_ID || typeof window === 'undefined' || !('Notification' in window)) return;
    if (localStorage.getItem(DISMISS_KEY)) return;

    // Give OneSignalInit a moment to boot, then show only if permission is still
    // 'default' (not granted/denied). Poll briefly in case the SDK is slow.
    let tries = 0;
    const id = window.setInterval(() => {
      tries += 1;
      try {
        const native = OneSignal.Notifications.permissionNative; // 'default' | 'granted' | 'denied'
        if (native === 'default') {
          setShow(true);
          window.clearInterval(id);
        } else if (native === 'granted' || native === 'denied' || tries >= 6) {
          window.clearInterval(id);
        }
      } catch {
        if (tries >= 6) window.clearInterval(id);
      }
    }, 1000);
    return () => window.clearInterval(id);
  }, []);

  if (!show) return null;

  function dismiss() {
    try {
      localStorage.setItem(DISMISS_KEY, '1');
    } catch {
      /* private mode — fine, it just shows again next session */
    }
    setShow(false);
  }

  async function enable() {
    setBusy(true);
    try {
      await OneSignal.Notifications.requestPermission();
      if (OneSignal.Notifications.permission) {
        await OneSignal.User.PushSubscription.optIn();
        push('Đã bật thông báo', 'success');
      } else if (OneSignal.Notifications.permissionNative === 'denied') {
        push('Trình duyệt đã chặn thông báo, bật lại trong cài đặt nhé', 'error');
      }
    } catch {
      /* user dismissed the native dialog or push unsupported — silently move on */
    } finally {
      setBusy(false);
      dismiss();
    }
  }

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 flex justify-center px-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
      <div className="w-full max-w-sm rounded-2xl bg-surface p-4 shadow-lift ring-1 ring-border animate-pop-in">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Bell className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-display text-sm font-bold text-text">Bật thông báo</p>
            <p className="mt-0.5 text-xs text-text-secondary">
              Nhận tương tác, lời mời kết bạn và cảnh báo vượt ngân sách ngay khi có.
            </p>
          </div>
          <button
            type="button"
            onClick={dismiss}
            aria-label="Để sau"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-text-muted transition-transform duration-fast active:scale-90"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="mt-3 flex gap-2">
          <Button variant="ghost" className="flex-1" onClick={dismiss}>
            Để sau
          </Button>
          <Button className="flex-1" loading={busy} onClick={enable}>
            Bật ngay
          </Button>
        </div>
      </div>
    </div>
  );
}
