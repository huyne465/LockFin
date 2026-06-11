import { clsx } from 'clsx';

/**
 * Khối skeleton. Nền dùng `bg-border` (#F1E3D8) — tương phản rõ trên nền kem
 * `bg-background` (#FFF8F4). Trước đây dùng `bg-surface-muted` (#FFF6F2) gần như
 * trùng màu nền nên skeleton vô hình → trông như màn trắng. Vệt sáng quét ngang
 * báo "đang tải"; khi prefers-reduced-motion vệt đứng yên nhưng nền vẫn hiện rõ.
 */
export function Skeleton({ className }: { className?: string }) {
  return (
    <div className={clsx('relative overflow-hidden rounded-md bg-border', className)}>
      <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/70 to-transparent" />
    </div>
  );
}
