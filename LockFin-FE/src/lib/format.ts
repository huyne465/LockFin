import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';

const vnd = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 });

export const formatVND = (n: number) => vnd.format(n);

/** Số tiền khi nhập: "1000000" -> "1.000.000". Bỏ mọi ký tự không phải chữ số. */
export const formatAmountInput = (raw: string) => {
  const digits = raw.replace(/\D/g, '');
  return digits ? digits.replace(/\B(?=(\d{3})+(?!\d))/g, '.') : '';
};

/** Ngược lại formatAmountInput: "1.000.000" -> 1000000. */
export const parseAmount = (formatted: string) => Number(formatted.replace(/\D/g, '')) || 0;

export const formatRelative = (iso: string) =>
  formatDistanceToNow(new Date(iso), { addSuffix: true, locale: vi });

export const currentMonth = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};
