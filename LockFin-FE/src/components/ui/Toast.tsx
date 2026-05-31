'use client';
import { create } from 'zustand';
import { useEffect } from 'react';

interface ToastItem { id: number; message: string; tone: 'success' | 'error' | 'info' }
interface ToastState {
  items: ToastItem[];
  push: (msg: string, tone?: ToastItem['tone']) => void;
  remove: (id: number) => void;
}

export const useToast = create<ToastState>((set) => ({
  items: [],
  push: (message, tone = 'info') => set((s) => ({ items: [...s.items, { id: Date.now() + Math.random(), message, tone }] })),
  remove: (id) => set((s) => ({ items: s.items.filter((i) => i.id !== id) })),
}));

export function ToastViewport() {
  const items = useToast((s) => s.items);
  const remove = useToast((s) => s.remove);
  useEffect(() => {
    const timers = items.map((i) => setTimeout(() => remove(i.id), 3200));
    return () => { timers.forEach(clearTimeout); };
  }, [items, remove]);
  return (
    <div className="pointer-events-none fixed inset-x-0 top-4 z-50 flex flex-col items-center gap-2 px-4">
      {items.map((i) => (
        <div
          key={i.id}
          className={
            'pointer-events-auto rounded-lg px-4 py-2.5 shadow-lift transition-all duration-base ' +
            (i.tone === 'success' ? 'bg-success text-text-inverse'
              : i.tone === 'error' ? 'bg-danger text-text-inverse'
              : 'bg-surface text-text border border-border')
          }
        >
          {i.message}
        </div>
      ))}
    </div>
  );
}
