import { formatVND } from '@/lib/format';
import type { MonthStat } from '@/lib/types';

export function CategoryBreakdown({ stats }: { stats: MonthStat[] }) {
  const total = stats.reduce((s, x) => s + Number(x.total), 0) || 1;
  return (
    <div className="col-span-2 rounded-lg bg-surface p-5 shadow-soft">
      <h3 className="font-display text-sm font-semibold text-text-secondary">Theo danh mục</h3>
      <ul className="mt-3 space-y-3">
        {stats.map((s) => {
          const pct = (Number(s.total) / total) * 100;
          return (
            <li key={s.category_id}>
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  <span>{s.icon}</span>
                  <span className="font-medium">{s.category_name}</span>
                </span>
                <span className="numeric font-semibold">{formatVND(Number(s.total))}</span>
              </div>
              <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-surface-muted">
                <div className="h-full rounded-full transition-all duration-slow ease-spring" style={{ width: `${pct}%`, background: s.color_hex }} />
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
