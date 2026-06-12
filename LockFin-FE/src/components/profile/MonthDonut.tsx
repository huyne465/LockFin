'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { formatVND } from '@/lib/format';
import { useTheme } from '@/lib/useTheme';
import type { MonthStat } from '@/lib/types';

export function MonthDonut({ stats }: { stats: MonthStat[] }) {
  const total = stats.reduce((s, x) => s + Number(x.total), 0);
  const { theme } = useTheme();
  const dark = theme === 'dark';
  // Tách lát donut bằng màu nền card để khe hở ăn theo theme.
  const sliceStroke = dark ? '#1B1D27' : '#ffffff';
  const tooltipStyle = dark
    ? { borderRadius: 12, border: '1px solid #2A2C36', background: '#1B1D27', color: '#F3F3F7' }
    : { borderRadius: 12, border: '1px solid #F1E3D8' };
  // recharts gives each item/label its own inline colour, so contentStyle.color
  // doesn't reach the text — set it explicitly or the label stays dark on dark.
  const tooltipTextStyle = dark ? { color: '#F3F3F7' } : { color: '#1F1B16' };
  return (
    <div className="col-span-2 rounded-lg bg-surface p-5 shadow-soft">
      <div className="flex items-baseline justify-between">
        <h3 className="font-display text-sm font-semibold text-text-secondary">Tổng chi tiêu tháng</h3>
        <p className="numeric font-display text-xl font-bold">{formatVND(total)}</p>
      </div>
      <div className="mt-2 h-56">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={stats} dataKey="total" nameKey="category_name" innerRadius={55} outerRadius={85} strokeWidth={2} stroke={sliceStroke} isAnimationActive={false}>
              {stats.map((s) => <Cell key={s.category_id} fill={s.color_hex} />)}
            </Pie>
            <Tooltip
              formatter={(v: number, _name, p) => [formatVND(Number(v)), p?.payload?.category_name]}
              contentStyle={tooltipStyle}
              itemStyle={tooltipTextStyle}
              labelStyle={tooltipTextStyle}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
