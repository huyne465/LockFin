'use client';

import { Moon, Sun } from 'lucide-react';
import { useTheme } from '@/lib/useTheme';

/** Nút bật/tắt dark mode. Hiển thị icon của theme sẽ chuyển sang khi bấm. */
export function ThemeToggle({ className = '' }: { className?: string }) {
  const { theme, toggle } = useTheme();
  const isDark = theme === 'dark';

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={isDark ? 'Chuyển sang chế độ sáng' : 'Chuyển sang chế độ tối'}
      title={isDark ? 'Chế độ sáng' : 'Chế độ tối'}
      className={`flex h-10 w-10 items-center justify-center rounded-full border border-border bg-surface text-text-secondary transition-colors duration-base hover:text-text ${className}`}
    >
      {isDark ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  );
}
