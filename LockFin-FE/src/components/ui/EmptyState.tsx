import type { ReactNode } from 'react';

export function EmptyState({ icon, title, hint }: { icon?: ReactNode; title: string; hint?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
      {icon && <div className="text-5xl">{icon}</div>}
      <h2 className="font-display text-lg font-semibold text-text">{title}</h2>
      {hint && <p className="max-w-xs text-sm text-text-secondary">{hint}</p>}
    </div>
  );
}
