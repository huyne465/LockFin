import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';

const vnd = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 });

export const formatVND = (n: number) => vnd.format(n);

export const formatRelative = (iso: string) =>
  formatDistanceToNow(new Date(iso), { addSuffix: true, locale: vi });

export const currentMonth = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};
