'use client';

import { useCallback, useEffect, useState } from 'react';

export type Theme = 'light' | 'dark';

const STORAGE_KEY = 'lockfin-theme';
const EVENT = 'lockfin-theme-change';

/** Đọc theme đang áp dụng từ <html> (đã được no-FOUC script set trước khi paint). */
function readTheme(): Theme {
  if (typeof document === 'undefined') return 'light';
  return document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
}

/** Áp theme lên DOM + lưu localStorage, rồi báo cho mọi hook khác cùng cập nhật. */
export function applyTheme(theme: Theme) {
  if (typeof document === 'undefined') return;
  document.documentElement.setAttribute('data-theme', theme);
  try {
    localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    /* private mode — bỏ qua */
  }
  window.dispatchEvent(new CustomEvent(EVENT, { detail: theme }));
}

/** Theme hiện tại + hàm đổi. Đồng bộ giữa các component qua custom event. */
export function useTheme() {
  const [theme, setThemeState] = useState<Theme>('light');

  useEffect(() => {
    setThemeState(readTheme());
    const onChange = (e: Event) => {
      const next = (e as CustomEvent<Theme>).detail ?? readTheme();
      setThemeState(next);
    };
    window.addEventListener(EVENT, onChange);
    return () => window.removeEventListener(EVENT, onChange);
  }, []);

  const setTheme = useCallback((next: Theme) => applyTheme(next), []);
  const toggle = useCallback(() => applyTheme(readTheme() === 'dark' ? 'light' : 'dark'), []);

  return { theme, setTheme, toggle };
}
