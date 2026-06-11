'use client';

import { useEffect, useState } from 'react';
import OneSignal from 'react-onesignal';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';

const APP_ID = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID;

/** Reject after `ms` so a hung OneSignal call can't spin the button forever
 *  (seen on iOS PWA where requestPermission/optIn can never resolve). */
function withTimeout<T>(p: Promise<T>, ms = 12_000): Promise<T> {
  return Promise.race([
    p,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error('timeout')), ms)),
  ]);
}

/**
 * Lets the user opt in / out of web push. Reads live state from the OneSignal
 * SDK (booted by OneSignalInit) and reacts to permission / subscription changes.
 * Hidden entirely when push isn't configured or the browser can't support it.
 */
export function NotificationToggle() {
  const push = useToast((s) => s.push);
  const [supported, setSupported] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const [denied, setDenied] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!APP_ID || typeof window === 'undefined' || !('Notification' in window)) return;
    setSupported(true);

    const sync = () => {
      try {
        setDenied(OneSignal.Notifications.permissionNative === 'denied');
        setEnabled(OneSignal.Notifications.permission && Boolean(OneSignal.User?.PushSubscription?.optedIn));
      } catch {
        /* SDK not ready yet — a later event will sync. */
      }
    };
    sync();

    try {
      OneSignal.Notifications.addEventListener('permissionChange', sync);
      OneSignal.User.PushSubscription.addEventListener('change', sync);
    } catch {
      /* listeners attach after init; ignore if not ready */
    }
    return () => {
      try {
        OneSignal.Notifications.removeEventListener('permissionChange', sync);
        OneSignal.User.PushSubscription.removeEventListener('change', sync);
      } catch {
        /* noop */
      }
    };
  }, []);

  if (!supported) return null;

  async function toggle() {
    setBusy(true);
    try {
      if (enabled) {
        await withTimeout(OneSignal.User.PushSubscription.optOut());
        push('Đã tắt thông báo', 'success');
      } else {
        await withTimeout(OneSignal.Notifications.requestPermission());
        if (OneSignal.Notifications.permissionNative === 'denied') {
          push('Trình duyệt đã chặn thông báo, bật lại trong cài đặt trình duyệt nhé', 'error');
        } else {
          await withTimeout(OneSignal.User.PushSubscription.optIn());
          push('Đã bật thông báo', 'success');
        }
      }
    } catch {
      push('Không thay đổi được thông báo, thử lại nhé', 'error');
    } finally {
      setBusy(false);
    }
  }

  if (denied && !enabled) {
    return (
      <p className="text-xs text-text-muted">
        Thông báo đang bị trình duyệt chặn. Mở cài đặt trình duyệt cho trang này để bật lại.
      </p>
    );
  }

  return (
    <div className="flex items-center justify-between gap-3">
      <p className="text-xs text-text-muted">
        {enabled
          ? 'Bạn sẽ nhận thông báo khi có tương tác, lời mời kết bạn hoặc vượt ngân sách.'
          : 'Bật để nhận tương tác, lời mời kết bạn và cảnh báo vượt ngân sách.'}
      </p>
      <Button variant={enabled ? 'outline' : 'primary'} disabled={busy} onClick={toggle} className="shrink-0">
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : enabled ? 'Tắt' : 'Bật'}
      </Button>
    </div>
  );
}
